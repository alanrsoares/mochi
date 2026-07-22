// Emit a TypeScript declaration (.d.ts) for a compiled alang module, so the
// emitted JS can be consumed from TypeScript with full types. Top-level `let`s
// become `export declare const`s; `type` decls become exported tagged-union
// types matching the `{ _tag, _0, ... }` runtime; `extern`s are imports, not
// our declarations, so they are omitted.
//
// The declared type of a binding follows the EMITTED JS, not just the HM type:
// a multi-param lambda `(a, b) => …` compiles to a 2-arg JS function, so its
// declaration is `(a: A, b: B) => R` — we peel arrows by the lambda's arity,
// recursing into curried bodies (`f => r => …` stays `(f: F) => (r: R) => …`).
import { flatMap, isErr, map, ok, pipe, type Result } from "@onrails/result";
import type { Ctor, Expr, Program, Stmt, TypeExpr } from "./ast";
import { check } from "./check";
import type { AlangError } from "./errors";
import { inferProgramTypes, type Scheme } from "./infer";
import { lex } from "./lexer";
import { parse } from "./parser";
import { builtinTypeDecls, preludeEnv, preludeNamespaces } from "./prelude";
import { type AliasDef, aliasParamId, foldAliases, type Row, type Type } from "./types";

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
    case "arrow":
      return `(x: ${tsOf(t.from, names)}) => ${tsOf(t.to, names)}`;
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
  return fields.length === 0 ? "{}" : `{ ${fields.join("; ")} }`;
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

// Assign generic letters to a scheme's quantified type vars.
const genericNames = (sc: Scheme): Map<number, string> =>
  new Map(sc.vars.map((id, i) => [id, LETTERS[i] ?? `T${i}`]));

// A variant's type-param names → TS generic letters (`a` → `A`).
const paramGmap = (params: string[]): Map<string, string> =>
  new Map(params.map((p, i) => [p, LETTERS[i] ?? `T${i}`]));

// A ctor field type param / primitive name → TS.
const argTs = (a: string, gmap: Map<string, string>): string =>
  gmap.get(a) ?? PRIM_TS[a] ?? (a === "float" || a === "int" ? "number" : a);

// A ctor field type is a full TypeExpr (ADR 0015); render it in tsOf's style
// (`[t]` → `t[]`, applied ctors → generics, arrows → function types).
const teTs = (te: TypeExpr, gmap: Map<string, string>): string => {
  switch (te.kind) {
    case "tname":
      return argTs(te.name, gmap);
    case "tarrow":
      return `(x: ${teTs(te.from, gmap)}) => ${teTs(te.to, gmap)}`;
    case "tapp":
      return `${te.ctor}<${te.args.map((a) => teTs(a, gmap)).join(", ")}>`;
    case "ttuple":
      return `[${te.elems.map((e) => teTs(e, gmap)).join(", ")}]`;
    case "tlist":
      return `${teTs(te.elem, gmap)}[]`;
  }
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
// keeping order — [2] & [1,1] for n=2; [3],[2,1],[1,2],[1,1,1] for n=3. Shortest
// first (fewest groups) so overload resolution prefers the all-at-once form.
const compositions = (n: number): number[][] => {
  if (n === 0) return [[]];
  const out: number[][] = [];
  for (let k = 1; k <= n; k++) for (const rest of compositions(n - k)) out.push([k, ...rest]);
  return out.toSorted((a, b) => a.length - b.length);
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
  const ret = tsOf(cur, names);
  if (params.length <= 1) return `${head}(${params.join(", ")}) => ${ret}`;

  // One call signature per grouping. The first group is the (generic) call
  // signature's params; later groups nest as returned arrow types, inheriting
  // the generics. `{ <G>(a,b): R; <G>(a): (b) => R; … }`.
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
    paramTypes: c.fields.map((f) => teTs(f.type, gmap)),
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
    return `${head}${declType(folded, value, names)}`;
  }
  return tsOf(folded, new Map());
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
    const fields = c.fields.map((fld, i) => `${fld.name ?? `_${i}`}: ${teTs(fld.type, gmap)}`);
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
  if (s.kind === "import") return null; // re-exports live in the sibling module
  if (s.kind === "type") {
    const a = aliasByName.get(s.name);
    return a ? aliasTsDecl(a) : typeDecl(s.name, s.params, s.ctors);
  }
  if (s.kind === "extern") return null; // imported, not declared here
  const sc = schemeOf(s.name);
  return sc && !s.name.startsWith("$") ? letDecl(s.name, sc, s.value, aliases) : null;
};

// Builtin variant type decls a program's binding types reference but that the
// program does not itself declare (e.g. `Option<number>` from `Map.get`). Emitted
// so those references resolve. Shared by the `.d.ts` writer and the `.ts` backend.
export const referencedBuiltinTypeDecls = (
  prog: Program,
  schemeOf: (n: string) => Scheme | undefined,
): string[] => {
  const declared = new Set(prog.stmts.flatMap((s) => (s.kind === "type" ? [s.name] : [])));
  const referenced = new Set<string>();
  for (const s of prog.stmts) {
    if (s.kind !== "let" || s.name.startsWith("$")) continue;
    const sc = schemeOf(s.name);
    if (sc) consIn(sc.type, referenced);
  }
  return builtinTypeDecls
    .filter((bt) => referenced.has(bt.name) && !declared.has(bt.name))
    .map((bt) => typeDecl(bt.name, bt.params, bt.ctors));
};

export const emitDts = (src: string): Result<string, AlangError> => {
  const r = pipe(
    lex(src),
    flatMap(parse),
    flatMap(check),
    flatMap((prog) =>
      map(
        inferProgramTypes(prog, preludeEnv, { open: true, namespaces: preludeNamespaces }),
        (res) => ({
          prog,
          env: res.env,
          aliases: res.aliases,
        }),
      ),
    ),
  );
  if (isErr(r)) return r;
  const { prog, env, aliases } = r.value;
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
