// Emit a TypeScript declaration (.d.ts) for a compiled mochi module, so the
// emitted JS can be consumed from TypeScript with full types. Top-level `let`s
// become `export declare const`s; `type` decls become exported tagged-union
// types matching the `{ _tag, _0, ... }` runtime; `extern`s are imports, not
// our declarations, so they are omitted.
//
// The declared type of a binding follows the EMITTED JS, not just the HM type:
// a multi-param lambda `(a, b) => …` compiles to a 2-arg JS function, so its
// declaration is `(a: A, b: B) => R` — we peel arrows by the lambda's arity,
// recursing into curried bodies (`f => r => …` stays `(f: F) => (r: R) => …`).
import { isErr, ok, type Result } from "@onrails/result";
import type { Ctor, Expr, Program, Stmt, TypeExpr } from "./ast";
import { toTypedProgram } from "./compile";
import type { Diagnostic } from "./errors";
import type { Scheme } from "./infer";
import { builtinTypeDecls, preludeNamespaces } from "./prelude";
import { typeExprToType } from "./schemes";
import {
  type AliasDef,
  aliasParamId,
  foldAliases,
  mkFresh,
  type Row,
  type Type,
  tVar,
} from "./types";

// Collect every type-constructor name appearing in a type (for detecting which
// builtin variant decls an emitted module must include).
const consIn = (t: Type, acc: Set<string>): void => {
  if (t.kind === "con") {
    acc.add(t.name);
    for (const a of t.args) consIn(a, acc);
  } else if (t.kind === "arrow") {
    consIn(t.from, acc);
    consIn(t.to, acc);
  } else if (t.kind === "record") {
    let row = t.row;
    while (row.kind === "extend") {
      consIn(row.type, acc);
      row = row.rest;
    }
  }
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const PRIM_TS: Record<string, string> = { number: "number", string: "string", bool: "boolean" };

// HM type → TS type. `names` maps quantified var ids to generic letters; any
// other var renders as `unknown` (it escaped generalization at this position).
const tsOf = (t: Type, names: Map<number, string>): string => {
  switch (t.kind) {
    case "var":
      return names.get(t.id) ?? "unknown";
    case "con": {
      const prim = PRIM_TS[t.name];
      if (prim) return prim;
      if (t.name === "Array" && t.args.length === 1) return `${tsOf(t.args[0]!, names)}[]`;
      if (t.name === "List" && t.args.length === 1) return `Iterable<${tsOf(t.args[0]!, names)}>`;
      if (t.name === "tuple") return `[${t.args.map((a) => tsOf(a, names)).join(", ")}]`;
      return t.args.length === 0
        ? t.name
        : `${t.name}<${t.args.map((a) => tsOf(a, names)).join(", ")}>`;
    }
    case "arrow": {
      // Flat multi-param arrow, matching codegen's UNCURRIED calling convention:
      // user functions emit `(a, b) => …` (defs) and `f(a, b)` (calls), never
      // `f(a)(b)`. `declType` already flattens a binding's own params this way;
      // rendering NESTED function types (a HOF's function-typed param, e.g.
      // `sepBy`'s `parseItem`) curried instead — `(x) => (x) => R` — is what
      // made a flat function VALUE reject against a curried param slot (TS2345).
      // Collapse the whole arrow chain into one arrow so the two agree.
      const params: string[] = [];
      let cur: Type = t;
      while (cur.kind === "arrow") {
        params.push(tsOf(cur.from, names));
        cur = cur.to;
      }
      const named = params.map((p, i) => `${String.fromCharCode(97 + i)}: ${p}`);
      return `(${named.join(", ")}) => ${tsOf(cur, names)}`;
    }
    case "record":
      return tsRow(t.row, names);
  }
};

const tsRow = (row: Row, names: Map<number, string>): string => {
  const fields: string[] = [];
  let cur = row;
  while (cur.kind === "extend") {
    fields.push(`${cur.label}: ${tsOf(cur.type, names)}`);
    cur = cur.rest;
  }
  const body = fields.length === 0 ? "{}" : `{ ${fields.join("; ")} }`;
  // Open tail: intersect the row var's generic letter (`{ … } & R`) so a
  // field-subset record unifies with the full state and vice-versa (ADR 0034).
  // A quantified rvar carries a letter (via genericNames); an unbound one (no
  // generic head to scope it — non-lambda bindings) falls back to the closed
  // record, matching the pre-0034 behavior.
  if (cur.kind === "rvar") {
    const g = names.get(cur.id);
    // Parenthesize: `&` binds looser than the `[]` an array wrapper appends, so
    // a bare `{…} & R` element would mis-parse as `{…} & (R[])`.
    if (g) return fields.length === 0 ? g : `({ ${fields.join("; ")} } & ${g})`;
  }
  return body;
};

// True when a (zonked) type still carries an unbound type or row var — i.e. it
// is NOT fully concrete. `tsOf` would render such a var as `unknown`.
const hasFreeVar = (t: Type): boolean => {
  switch (t.kind) {
    case "var":
      return true;
    case "con":
      return t.args.some(hasFreeVar);
    case "arrow":
      return hasFreeVar(t.from) || hasFreeVar(t.to);
    case "record": {
      let row = t.row;
      while (row.kind === "extend") {
        if (hasFreeVar(row.type)) return true;
        row = row.rest;
      }
      return row.kind === "rvar";
    }
  }
};

// TS type for an EMPTY collection literal (`#{}`/`[]`/`@{}`) whose element types
// are fully known, else null. An empty literal otherwise infers `Map<unknown,
// unknown>`/`never[]`/`Set<never>`, which won't flow to a concretely-typed
// parameter (ADR 0035); annotating the seed with the resolved element types
// (`new Map<number, Ty>()`, `[] as Ty[]`) fixes the mismatch.
//
// `names` (default empty, ADR 0042) carries the letters of an enclosing generic
// binding: a seed whose element type is a var of that binding renders it as the
// letter (`new Map<string, … & D>()`) rather than being skipped. With no such
// scope (empty map) only a fully concrete element type renders — a free var
// would become `unknown`, no better than tsc's own guess for the literal.
export const emptyCollTs = (
  t: Type,
  aliases: AliasDef[],
  names: Map<number, string> = new Map(),
): string | null => {
  const folded = foldAliases(t, aliases);
  return allVarsIn(folded, names) ? tsOf(folded, names) : null;
};

// TS type for an APPLIED parametric constructor call (`Ok(x)`, `Some(y)`) whose
// result type is fully known, else null. A constructor's argument pins only the
// type params it mentions; a phantom param (`Ok`'s error type, `Err`'s ok type)
// stays free at the call, so tsc widens it to `unknown` — and in a ts-pattern arm
// that then fails to unify with a sibling arm (`Ok("")` : `Result<string, unknown>`
// vs the recursive branch's `Result<string, string>`; ADR 0043). Annotate the call
// with its resolved concrete type (`Ok("") as Result<string, string>`) — the
// applied-ctor analogue of ADR 0039's nullary-ctor rule and ADR 0035's empty seed.
// Fully-concrete cons only: a free var would render `unknown`, no better than tsc.
export const ctorCallTs = (t: Type, aliases: AliasDef[]): string | null => {
  const folded = foldAliases(t, aliases);
  if (folded.kind !== "con" || folded.args.length === 0) return null;
  return hasFreeVar(folded) ? null : tsOf(folded, new Map());
};

// Arity-aware function type: peel one arrow per lambda parameter, then recurse
// into the body (which may itself be a lambda for curried definitions).
const declType = (t: Type, value: Expr, names: Map<number, string>): string => {
  if (value.kind !== "lambda") return tsOf(t, names);
  const params: string[] = [];
  let cur = t;
  value.params.forEach((p, i) => {
    if (cur.kind !== "arrow") return;
    const name = p.kind === "name" ? p.name : `_${i}`;
    params.push(`${name}: ${tsOf(cur.from, names)}`);
    cur = cur.to;
  });
  return `(${params.join(", ")}) => ${declType(cur, value.body, names)}`;
};

// A binding's parameters flattened — across nested value lambdas (`a => b => …`)
// AND a single multi-param lambda (`(a, b) => …`) alike — into one ordered list,
// plus the final return type. Feeds `curriedOverloads` for CONCRETE function
// bindings so every partial-application grouping `_curry` accepts typechecks.
const flatBindingParams = (
  t: Type,
  value: Expr,
  names: Map<number, string>,
): { params: string[]; ret: string } => {
  const params: string[] = [];
  let cur = t;
  let v = value;
  let n = 0;
  while (v.kind === "lambda") {
    for (const p of v.params) {
      if (cur.kind !== "arrow") break;
      const name = p.kind === "name" ? p.name : `_${n}`;
      params.push(`${name}: ${tsOf(cur.from, names)}`);
      cur = cur.to;
      n++;
    }
    v = v.body;
  }
  return { params, ret: tsOf(cur, names) };
};

// Assign generic letters to a scheme's quantified vars — type vars AND row
// vars alike. `freshVar`/`freshRowVar` share one id counter (types.ts), so tv
// and rv ids never collide and one map covers both: `tsOf` looks up a type var,
// `tsRow` looks up an open row's tail. Row-poly bindings (e.g. `st => {...st}`)
// thus emit `{ …fields } & R` under a `<R>` head instead of a closed record
// that drops the row var (ADR 0034).
const genericNames = (sc: Scheme): Map<number, string> =>
  new Map([...sc.vars, ...sc.rvars].map((id, i) => [id, LETTERS[i] ?? `T${i}`]));

// A variant's type-param names → TS generic letters (`a` → `A`).
const paramGmap = (params: string[]): Map<string, string> =>
  new Map(params.map((p, i) => [p, LETTERS[i] ?? `T${i}`]));

// A ctor field type is a full TypeExpr (ADR 0015). Lower it to a Type first
// (params bound positionally, aliases left nominal) and render through `tsOf`,
// so the TS output grammar has exactly one encoder — flat-arrow collapse and
// `List` → `Iterable` apply to ctor fields exactly as everywhere else.
const fieldTs = (te: TypeExpr, params: string[]): string => {
  const vars = new Map(params.map((p, i): [string, Type] => [p, tVar(i)]));
  const names = new Map(params.map((_, i): [number, string] => [i, LETTERS[i] ?? `T${i}`]));
  return tsOf(typeExprToType(te, vars, mkFresh(params.length)), names);
};

// Free type-var ids in a Type, first-appearance order.
const freeVars = (t: Type, acc: number[]): void => {
  switch (t.kind) {
    case "var":
      if (!acc.includes(t.id)) acc.push(t.id);
      return;
    case "con":
      for (const a of t.args) freeVars(a, acc);
      return;
    case "arrow":
      freeVars(t.from, acc);
      freeVars(t.to, acc);
      return;
    case "record": {
      let r = t.row;
      while (r.kind === "extend") {
        freeVars(r.type, acc);
        r = r.rest;
      }
      return;
    }
  }
};

// Ordered compositions of n: every way to write n as a sum of positive ints
// keeping order — [2] & [1,1] for n=2; [3],[2,1],[1,2],[1,1,1] for n=3. Longest
// first (most groups) so the all-at-once FLAT signature (`[n]`) lands LAST.
// TS resolves a call against the first *matching* overload regardless of order,
// but infers a call's type args from a passed OVERLOADED function using its LAST
// overload only. Keeping the flat form last makes that inference pin every type
// var (`reduce(add, 0, xs)` → both of add's params inferred), matching the flat
// param shapes `tsOf` now renders for function-typed values.
const compositions = (n: number): number[][] => {
  if (n === 0) return [[]];
  const out: number[][] = [];
  for (let k = 1; k <= n; k++) for (const rest of compositions(n - k)) out.push([k, ...rest]);
  return out.toSorted((a, b) => b.length - a.length);
};

// Curried-compatible function type from rendered params (`"a: T"`) + return type.
// The JS backend curries every arity-≥2 function via `_curry`, so a call site may
// partially apply in ANY grouping — `f(a, b)`, `f(a)(b)`, `f(a, b)(c)`. A single
// flat `(a, b) => R` rejects all but the all-at-once form, so emit an OVERLOAD
// per composition of the arity, covering every grouping `_curry` accepts, with the
// flat signature LAST (see `compositions`). `head` (`<A, B>`) scopes generics; on
// the overload object it must sit INSIDE each call signature, so it is threaded
// through here rather than prepended by the caller. Shared by builtin runtime
// typing (`flatFnType`) and user binding typing (`declType`) so both curry alike.
const curriedOverloads = (head: string, params: string[], ret: string): string => {
  if (params.length <= 1) return `${head}(${params.join(", ")}) => ${ret}`;
  const sig = (groups: number[]): string => {
    const slices: string[][] = [];
    let idx = 0;
    for (const g of groups) {
      slices.push(params.slice(idx, idx + g));
      idx += g;
    }
    let tail = ret;
    for (let i = slices.length - 1; i >= 1; i--) tail = `(${slices[i]!.join(", ")}) => ${tail}`;
    return `${head}(${slices[0]!.join(", ")}): ${tail};`;
  };
  return `{ ${compositions(params.length).map(sig).join(" ")} }`;
};

// A prelude builtin's HM type rendered for the typed runtime (ADR 0026). The JS
// backend curries every arity-≥2 builtin via `_curry`, so a call site emits ANY
// partial-application grouping — `map(f, xs)`, `xs |> map(f)` → `map(f)(xs)`,
// `foldl(f, z)(xs)`, `foldl(f)(z)(xs)`. A single flat `(a, b) => R` type rejects
// all but the all-at-once form, breaking pipelines. So emit an OVERLOADED type:
// one generic call signature per composition of the arity, covering every
// grouping `_curry` accepts. arity 0 → the bare type; arity 1 → a plain arrow.
// Used by scripts/gen-runtime.ts.
export const flatFnType = (t: Type, arity: number): string => {
  const ids: number[] = [];
  freeVars(t, ids);
  const names = new Map(ids.map((id, i) => [id, LETTERS[i] ?? `T${i}`]));
  const head = ids.length ? `<${ids.map((id) => names.get(id)).join(", ")}>` : "";
  if (arity === 0) return `${head}${tsOf(t, names)}`;
  const params: string[] = [];
  let cur = t;
  for (let i = 0; i < arity && cur.kind === "arrow"; i++) {
    params.push(`${String.fromCharCode(97 + i)}: ${tsOf(cur.from, names)}`);
    cur = cur.to;
  }
  return curriedOverloads(head, params, tsOf(cur, names));
};

// The TS signature pieces for a ctor's runtime factory (ADR 0026 TS backend):
// generic head, per-field param types, and the variant return type. genType
// assembles these into `const C = <A>(_0: T): Head => …` (single field) or a
// `_curry(n, …) as <A>(…) => Head` cast (multi-field).
// `ret` is the generic return (`Tree<A>`), for the factory signature. `retMono`
// substitutes `never` for every param (`Tree<never>`), for a nullary ctor const
// — which has no function to scope generics on, so it takes the "empty" instance
// (assignable to any covariant use, mirroring how `None: Option<never>` is typed).
export const ctorFactoryTs = (
  typeName: string,
  params: string[],
  c: Ctor,
): { generics: string; paramTypes: string[]; ret: string; retMono: string } => {
  const gmap = paramGmap(params);
  const gs = params.map((p) => gmap.get(p)!);
  return {
    generics: gs.length ? `<${gs.join(", ")}>` : "",
    paramTypes: c.fields.map((f) => fieldTs(f.type, params)),
    ret: gs.length ? `${typeName}<${gs.join(", ")}>` : typeName,
    retMono: gs.length ? `${typeName}<${gs.map(() => "never").join(", ")}>` : typeName,
  };
};

// The TS type of a binding, WITHOUT the `export declare const name:` wrapper —
// the one piece the `.d.ts` writer (`letDecl`) and the `.ts` backend
// (`codegen-ts.ts`, ADR 0026) share. A function carries a `<A, B>` generic head
// plus arity-peeled parameter names; a non-function polymorphic binding has
// nowhere to bind generics, so its escaped vars fall back to `unknown`.
export const bindingTsType = (sc: Scheme, value: Expr, aliases: AliasDef[]): string => {
  const names = genericNames(sc);
  // Fold structural rows to alias names first, so a binding typed `{ x, y }`
  // declares as `Point` — reusing the emitted `export type Point`.
  const folded = foldAliases(sc.type, aliases);
  if (value.kind === "lambda") {
    const generics = [...names.values()];
    const head = generics.length ? `<${generics.join(", ")}>` : "";
    // CONCRETE function: emit partial-application overloads so `_curry`'d partial
    // calls (`inRange(48, 57)`, `setLetMeta(true, doc)`) typecheck against the
    // curried runtime. GENERIC functions keep the flat/nested arrow — overloads
    // there wreck tsc's callback contextual typing and type-arg inference
    // (params collapse to `Option<never>`/`any`). See ADR 0037.
    if (head === "") {
      const { params, ret } = flatBindingParams(folded, value, names);
      return curriedOverloads("", params, ret);
    }
    return `${head}${declType(folded, value, names)}`;
  }
  return tsOf(folded, new Map());
};

// Every type AND row var in a (zonked) type is a key of `names`. Unlike
// `freeVars` (type vars only), this also inspects a record's trailing row var,
// so an open record `{ … } & R` counts as "fully in scope" only when `R` too
// carries a letter — the precondition for rendering it as `{ … } & R` rather
// than dropping the tail. Empty `names` ⇒ true only for a fully concrete type.
const allVarsIn = (t: Type, names: Map<number, string>): boolean => {
  switch (t.kind) {
    case "var":
      return names.has(t.id);
    case "con":
      return t.args.every((a) => allVarsIn(a, names));
    case "arrow":
      return allVarsIn(t.from, names) && allVarsIn(t.to, names);
    case "record": {
      let row = t.row;
      while (row.kind === "extend") {
        if (!allVarsIn(row.type, names)) return false;
        row = row.rest;
      }
      return row.kind === "rvar" ? names.has(row.id) : true;
    }
  }
};

// Merge the generic-letter maps of several schemes into one id → letter map.
// Var ids are globally unique within an inference run and each quantified id
// belongs to exactly ONE binding's scheme, so the union never collides on a key
// even when two schemes both start their letters at `A` (distinct ids). Used to
// bring a generic binding's letters into scope for the inner lambdas nested in
// its body (ADR 0042).
export const unionGenericNames = (schemes: Iterable<Scheme>): Map<number, string> => {
  const out = new Map<number, string>();
  for (const sc of schemes) for (const [id, letter] of genericNames(sc)) out.set(id, letter);
  return out;
};

// TS backend (ADR 0028): the per-parameter TS type annotations for a lambda,
// given its INFERRED (curried) type — looked up from the per-node type table —
// and its collapsed parameter count. One arrow is peeled per param.
//
// Only CONCRETE param types are emitted — a type with a free type variable is
// left bare (null). Two reasons: (1) a generic binding's letters (`<A, B>`) are
// declared on the const's TYPE head, NOT in the value expression, so emitting `A`
// in a value-position param would be an out-of-scope `TS2304`; (2) an outer
// binding lambda's generic params are already supplied contextually by that head,
// and generic inner-lambda params are usually supplied contextually by the
// higher-order function they're passed to. Concrete inner params (over `Expr`,
// `string`, records of concrete fields, …) are exactly the ones tsc can't infer
// → the bare-param `any` (TS7006) this clears. Records/tuples render structurally,
// so destructure params (`{ x, y }`, `[a, b]`) get a matching type too.
//
// ADR 0042: `names` (default empty) carries the letters in lexical scope — the
// enclosing generic binding's `<A, B, …>` (via `unionGenericNames`). A param
// whose every var is one of those renders with the letters (`(a: { … } & B)`)
// rather than staying bare; tsc cannot infer such a param through a nested
// higher-order call (`map((a) => …, filter(…))`) and falls it to `unknown`.
// A concrete param still renders (empty-map path); a param mixing in an
// out-of-scope var still stays bare (rendering it would be `unknown`/dropped).
export const lambdaParamTypesTs = (
  lamType: Type,
  arity: number,
  aliases: AliasDef[],
  names: Map<number, string> = new Map(),
): (string | null)[] => {
  const out: (string | null)[] = [];
  let cur = foldAliases(lamType, aliases);
  for (let i = 0; i < arity; i++) {
    if (cur.kind !== "arrow") {
      out.push(null);
      continue;
    }
    const from = cur.from;
    if (allVarsIn(from, names)) {
      // Every var is in scope — render with the enclosing letters (ADR 0042).
      out.push(tsOf(from, names));
    } else {
      // Fall back to ADR 0028: emit only if fully concrete, else leave bare.
      const fv: number[] = [];
      freeVars(from, fv);
      out.push(fv.length === 0 ? tsOf(from, new Map()) : null);
    }
    cur = cur.to;
  }
  return out;
};

// TS backend (ADR 0032): a GENERIC function binding's value lambda emitted as a
// generic arrow — `_curry(n, <A, B>(p: A, …) => …)` — so its params can name the
// binding's generic letters. This closes the polymorphic higher-order tail ADR
// 0028 left open: `lambdaParamTypesTs` skips generic params because their letters
// live on the const's TYPE head (out of scope in the value expression, would be
// TS2304), so `_curry` erased them to `any`/`unknown` in the body (TS18046/7006/
// 2345). Scoping the SAME letters (from the scheme's `genericNames`, matching the
// const head `bindingTsType` emits) on the lambda itself brings them into value
// scope. Returns the generic head plus EVERY param's type — generic letters and
// concrete types alike — peeling one arrow of the scheme type per collapsed param.
// Null when the binding is non-generic (the concrete-only path already handles it).
export const genericLambdaParams = (
  sc: Scheme,
  arity: number,
  aliases: AliasDef[],
): { generics: string; params: (string | null)[] } | null => {
  const names = genericNames(sc);
  if (names.size === 0) return null;
  const params: (string | null)[] = [];
  let cur = foldAliases(sc.type, aliases);
  for (let i = 0; i < arity; i++) {
    if (cur.kind !== "arrow") {
      params.push(null);
      continue;
    }
    params.push(tsOf(cur.from, names));
    cur = cur.to;
  }
  return { generics: `<${[...names.values()].join(", ")}>`, params };
};

// A match scrutinee's concrete TS type — the base a guard-form arm's type
// predicate narrows FROM (`(_v): _v is Extract<T, …>`, ADR 0031). codegen builds
// the `Extract<…>` target from the pattern; this supplies the `T`. Concrete types
// only — a scrutinee with free vars can't name its generics in a value position
// (TS2304), same rule as `lambdaParamTypesTs`; those stay the bare `(_v) => …`
// boolean guard (and their nested-pattern handlers keep the polymorphic tail).
export const guardParamTs = (scrutType: Type, aliases: AliasDef[]): string | null => {
  const t = foldAliases(scrutType, aliases);
  const fv: number[] = [];
  freeVars(t, fv);
  return fv.length === 0 ? tsOf(t, new Map()) : null;
};

const letDecl = (name: string, sc: Scheme, value: Expr, aliases: AliasDef[]): string =>
  `export declare const ${name}: ${bindingTsType(sc, value, aliases)};`;

// A transparent record alias → an exported TS object type. Field types come from
// the alias template (an HM record whose params are marker vars); map each marker
// to a generic letter so `type Box a = { value: a }` emits `type Box<A> = ...`.
export const aliasTsDecl = (def: AliasDef): string => {
  const names = new Map(def.params.map((_, i) => [aliasParamId(i), LETTERS[i] ?? `T${i}`]));
  const body = tsOf(def.template, names);
  const head = def.params.length ? `${def.name}<${[...names.values()].join(", ")}>` : def.name;
  return `export type ${head} = ${body};`;
};

// A `type` decl → an exported tagged union matching the runtime shape.
export const typeDecl = (name: string, params: string[], ctors: Ctor[]): string => {
  const gmap = paramGmap(params);
  const variant = (c: Ctor): string => {
    const fields = c.fields.map((fld, i) => `${fld.name ?? `_${i}`}: ${fieldTs(fld.type, params)}`);
    return `{ _tag: "${c.name}"${fields.length ? `; ${fields.join("; ")}` : ""} }`;
  };
  const head = params.length ? `${name}<${params.map((p) => gmap.get(p)).join(", ")}>` : name;
  return `export type ${head} =\n${ctors.map((c) => `  | ${variant(c)}`).join("\n")};`;
};

const declOf = (
  s: Stmt,
  schemeOf: (n: string) => Scheme | undefined,
  aliasByName: Map<string, AliasDef>,
  aliases: AliasDef[],
): string | null => {
  switch (s.kind) {
    case "import":
      return null;
    case "type": {
      const a = aliasByName.get(s.name);
      return a ? aliasTsDecl(a) : typeDecl(s.name, s.params, s.ctors);
    }
    case "extern":
      return null;
  } // imported, not declared here
  const sc = schemeOf(s.name);
  return sc && !s.name.startsWith("$") ? letDecl(s.name, sc, s.value, aliases) : null;
};

// Type-constructor names referenced anywhere in a TypeExpr (`Option<Expr>` →
// {Option}, nested included). Used to spot builtin unions named in ctor/alias
// FIELD positions — inference-derived binding types alone miss those.
const teConNames = (te: TypeExpr, acc: Set<string>): void => {
  switch (te.kind) {
    case "tname":
      acc.add(te.name);
      return;
    case "tarrow":
      teConNames(te.from, acc);
      teConNames(te.to, acc);
      return;
    case "tapp":
      acc.add(te.ctor);
      for (const a of te.args) teConNames(a, acc);
      return;
    case "ttuple":
      for (const e of te.elems) teConNames(e, acc);
      return;
    case "tlist":
      teConNames(te.elem, acc);
      return;
  }
};

// Builtin variant type decls a program's types reference but that the program
// does not itself declare (e.g. `Option<number>` from `Map.get`, or a variant
// field typed `Option<Expr>`). Emitted so those references resolve. Shared by
// the `.d.ts` writer and the `.ts` backend.
export const referencedBuiltinTypeDecls = (
  prog: Program,
  schemeOf: (n: string) => Scheme | undefined,
): string[] => {
  const declared = new Set(prog.stmts.flatMap((s) => (s.kind === "type" ? [s.name] : [])));
  const referenced = new Set<string>();
  for (const s of prog.stmts) {
    // Binding types (inference-derived) …
    if (s.kind === "let" && !s.name.startsWith("$")) {
      const sc = schemeOf(s.name);
      if (sc) consIn(sc.type, referenced);
    }
    // … and type-decl field positions (`guard: Option<Expr>`).
    if (s.kind === "type") {
      for (const c of s.ctors) for (const f of c.fields) teConNames(f.type, referenced);
      if (s.alias) for (const f of s.alias) teConNames(f.type, referenced);
    }
  }
  return builtinTypeDecls
    .filter((bt) => referenced.has(bt.name) && !declared.has(bt.name))
    .map((bt) => typeDecl(bt.name, bt.params, bt.ctors));
};

// Builtin variant decls a guard-form type predicate (ADR 0031) names in the
// emitted body but that `referencedBuiltinTypeDecls` missed — it scans binding
// schemes and type-decl fields, not match-scrutinee types, so `match(opt)` on an
// `Option<Stmt>` never surfaced `Option`. Scans the body text and skips any name
// the header already declares (a builtin the module also uses at binding level,
// or a locally-declared `type Result`), so no duplicate decl.
export const builtinDeclsIn = (bodyText: string, headerText: string): string[] =>
  builtinTypeDecls
    .filter(
      (bt) =>
        !headerText.includes(`type ${bt.name}<`) && new RegExp(`\\b${bt.name}\\b`).test(bodyText),
    )
    .map((bt) => typeDecl(bt.name, bt.params, bt.ctors));

// An extern binding paired with the inferred scheme its declared type resolved
// to. `imported` is the JS export name (what the emitted `import { … }` binds).
export type ExternBinding = { imported: string; scheme: Scheme };

// A `.d.ts` for an extern module (`extern name : T = "./host.js" "jsName"`),
// so the emitted `.ts` that imports from it type-checks (TS backend, ADR 0026,
// gap 3). Externs are real external JS with no mochi-visible declarations, so
// without this tsc reports TS2307 "cannot find module". Each imported binding
// becomes an `export declare const`: a FUNCTION extern gets the same OVERLOADED
// signature as a runtime builtin (`flatFnType`), so both curried (`f(a)(b)`) and
// uncurried (`f(a, b)`) call sites resolve; a VALUE extern renders its free type
// vars as `any` — the untyped-JS boundary, and a const has no generic head to
// bind them to. Referenced builtin variants (e.g. `Result`) are inlined so the
// file is self-contained.
export const externModuleDts = (externs: ExternBinding[]): string => {
  const referenced = new Set<string>();
  for (const e of externs) consIn(e.scheme.type, referenced);
  const decls = builtinTypeDecls
    .filter((bt) => referenced.has(bt.name))
    .map((bt) => typeDecl(bt.name, bt.params, bt.ctors));

  const arrowCount = (t: Type): number => (t.kind === "arrow" ? 1 + arrowCount(t.to) : 0);
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const { imported, scheme } of externs) {
    if (seen.has(imported)) continue;
    seen.add(imported);
    const t = scheme.type;
    const n = arrowCount(t);
    if (n === 0) {
      const ids: number[] = [];
      freeVars(t, ids);
      const names = new Map(ids.map((id) => [id, "any"]));
      lines.push(`export declare const ${imported}: ${tsOf(t, names)};`);
    } else {
      lines.push(`export declare const ${imported}: ${flatFnType(t, n)};`);
    }
  }
  return `${[...decls, ...lines].join("\n")}\n`;
};

export const emitDts = (src: string): Result<string, Diagnostic> => {
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces });
  if (isErr(r)) return r;
  const { prog, res } = r.value;
  const { env, aliases } = res;
  const aliasByName = new Map(aliases.map((a) => [a.name, a]));
  const lines = prog.stmts
    .map((s) => declOf(s, (n) => env.get(n), aliasByName, aliases))
    .filter((l): l is string => l !== null);
  // A builtin variant used in an exported binding's type (e.g. `Option<number>`
  // from `Map.get`) needs its type decl emitted too, unless the program declares
  // its own. Prepend so the reference resolves.
  const builtins = referencedBuiltinTypeDecls(prog, (n) => env.get(n));
  return ok(`${[...builtins, ...lines].join("\n")}\n`);
};
