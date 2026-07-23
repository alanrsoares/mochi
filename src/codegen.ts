// Codegen — AST → JavaScript source. Pure (no failure).
// alang owns the type system (HM inference), so emitted JS carries no type
// annotations — the checker runs before codegen and guarantees soundness.
// ts-pattern .exhaustive() forces a case for every Expr kind here: add an AST
// node and forget it → TS compile error in the compiler, not a silent gap.
import { match } from "ts-pattern";
import type {
  Ctor,
  CtorField,
  Expr,
  ExternStmt,
  FieldExpr,
  ImportStmt,
  LambdaExpr,
  LamParam,
  ListExpr,
  ListPat,
  LitPat,
  MatchArm,
  MatchExpr,
  Pattern,
  Program,
  Stmt,
  TypeStmt,
} from "./ast";
import { builtinTypeDecls, namespaceRuntime, preludeJsDefs, runtimeDeps } from "./prelude";
import type { Span } from "./span";

// A `Ns.member` access on a bare namespace ref (`List.map`) → the JS identifier
// its runtime is defined under, or null if it isn't a namespace access.
const nsRuntimeId = (e: FieldExpr): string | null =>
  e.target.kind === "ref" ? (namespaceRuntime[e.target.name]?.[e.name] ?? null) : null;

// A constructor's runtime field keys: a labelled field uses its label, an
// unlabelled one its position (`_0`, `_1`). Both the factory (`genType`) and the
// pattern destructure (`genWithArm`) must agree, so patterns consult this
// registry — populated per `codegen` call from the program's `type` decls.
const keysOf = (fields: CtorField[]): string[] => fields.map((f, i) => f.name ?? `_${i}`);
let ctorKeys = new Map<string, string[]>();

// Optional per-binding type annotation for a top-level `let`, returning the text
// to splice after the name (`: (x: A) => A`) or null for none. Set from
// `CodegenOptions.annotate` per `codegen` call; the TS backend (`codegen-ts.ts`,
// ADR 0026) supplies it, the JS backend leaves it null (byte-identical output).
// Module-level for the same reason `ctorKeys` is — `genStmt` is a free function.
let annotateLet: ((name: string, value: Expr) => string | null) | null = null;

// Optional typing for a variant's ctor factory in TS mode (ADR 0026): given the
// type decl and one ctor, return the generic head, per-field param types, and
// the variant return type, or null for the untyped JS shape. Supplied by the TS
// backend (from dts's `ctorFactoryTs`); null for the JS backend.
export type CtorFactoryTs = {
  generics: string;
  paramTypes: string[];
  ret: string;
  retMono: string;
};
let annotateCtor: ((s: TypeStmt, c: Ctor) => CtorFactoryTs | null) | null = null;

// TS backend (ADR 0026): lower `a |> f(x)` to the flattened call `f(x, a)`
// instead of the curried `f(x)(a)`. Both are equivalent under `_curry`, but the
// flat form lets `tsc` infer type args from ALL arguments at once — `xs |> map(f)`
// as `map(f, xs)` pins the element type, where `map(f)(xs)` leaves it `unknown`.
// Off for the JS backend, which stays byte-identical.
let flattenPipe = false;

// TS backend (ADR 0036): emit a tuple literal as `_tuple(a, b)` instead of the
// bare array `[a, b]`. The runtime `_tuple` is an identity whose rest param is
// inferred as a tuple, so tsc keeps `[A, B]` where a bare array literal would
// widen to `(A | B)[]` (no contextual tuple type flows through `Some(…)`/`Ok(…)`
// /ts-pattern arm returns). Off for the JS backend — output stays byte-identical.
let tupleHelper = false;

// TS backend (ADR 0028): given a lambda's span and its collapsed parameter count,
// return a `generics` head (`<A, B>` or `""`) to scope over the arrow plus one
// type annotation (the bare type text, no leading `:`) or null per param. The
// head is non-empty only for a generic function binding's value lambda (ADR 0032),
// where scoping the letters on the arrow lets its params name them; every other
// lambda gets `""` and concrete-only params. Supplied by the TS backend from the
// per-node inference table; null for the JS backend (byte-identical output).
let annotateParams:
  | ((span: Span, arity: number) => { generics: string; params: (string | null)[] })
  | null = null;

// TS backend (ADR 0031): given a match scrutinee expr, return its concrete TS
// type text (the "base" the guard-form predicate narrows from), or null (generic
// scrutinee / JS backend). Used to synthesize a type-predicate guard so the
// handler input narrows — ts-pattern's `Narrow` only refines for `x is U` guards,
// not plain boolean ones, so nested-pattern handlers otherwise see the full union.
let guardBaseType: ((scrutinee: Expr) => string | null) | null = null;

// TS backend (ADR 0035): given an EMPTY collection literal expr, return its
// fully-concrete TS type text (`Map<number, Ty>`, `Ty[]`), or null (element
// type still generic / JS backend). An empty `#{}`/`[]` otherwise infers
// `Map<unknown, unknown>`/`never[]` (and `Set.fromArray([])` → `Set<never>`),
// which won't flow to a concretely-typed state field; the annotation pins it.
let annotateEmpty: ((e: Expr) => string | null) | null = null;

// TS backend (ADR 0035): given a `let x = v in …` value expr, return the
// monomorphic TS type to annotate the emitted IIFE param `x`, or null. The
// annotation flows contextual types into `v`'s empty collections through the
// IIFE, which arg-based inference alone cannot do.
let annotateLetin: ((value: Expr) => string | null) | null = null;

// TS backend (ADR 0043): given an applied parametric constructor call (`Ok(x)`,
// `Err(e)`), return its fully-concrete TS type text to cast the call to, or null.
// A ctor's argument pins only some type params; a phantom one (`Ok`'s error, `Err`'s
// ok) stays free and widens to `unknown` in a ts-pattern arm — annotating the call
// (`Ok("") as Result<string, string>`) pins it. The applied-ctor analogue of the
// nullary-ctor rule (`annotateEmpty` on a `ref`, ADR 0039).
let annotateCall: ((e: Expr) => string | null) | null = null;

// Extension for cross-module import specifiers: `.js` for the JS backend (the
// compiled sibling), `""` for the TS backend (`import … from "./mod"`, which
// tsc/bundlers resolve to the sibling `.ts`). Set per `codegen` call.
let moduleExt = ".js";

// The field keys of a module's EXPORTED ctors — threaded into an importer's
// `codegen` so a pattern on an imported variant destructures the right runtime
// keys (`Some(value: a)` → `{ value }`, not the positional `{ _0 }`).
export const exportedCtorKeys = (prog: Program): Map<string, string[]> => {
  const m = new Map<string, string[]>();
  for (const s of prog.stmts)
    if (s.kind === "type" && s.exported) for (const c of s.ctors) m.set(c.name, keysOf(c.fields));
  return m;
};

// Collapse a curried lambda chain (`x => y => body`, or a mix with multi-param
// lambdas) into one flat parameter list plus the final body. alang types treat
// `(x, y) => e` and `x => y => e` identically (`a -> b -> c`), so this is sound
// — it lets a multi-arg function lower to a single `_curry`-wrapped JS function
// instead of nested closures (CRITIQUE §4.4).
const collapseLambda = (l: LambdaExpr): { params: LamParam[]; body: Expr } => {
  const params = [...l.params];
  let body: Expr = l.body;
  while (body.kind === "lambda") {
    params.push(...body.params);
    body = body.body;
  }
  return { params, body };
};

// Re-escape a decoded literal chunk for a JS template literal: backslashes
// first (else the escapes we're about to insert double-escape), then the
// two chars that would otherwise reopen JS template syntax.
const escapeTemplateLiteral = (s: string): string =>
  s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

const genExpr = (e: Expr): string =>
  match(e)
    .with({ kind: "num" }, (n) => n.raw)
    .with({ kind: "bool" }, (b) => String(b.value))
    .with({ kind: "str" }, (s) => JSON.stringify(s.value))
    // "…${x}…" (ADR 0023) → a native JS template literal — emitted JS reads
    // exactly like the source.
    .with({ kind: "interp" }, (interp) => {
      const body = interp.parts
        .map((p) => (typeof p === "string" ? escapeTemplateLiteral(p) : `\${${genExpr(p)}}`))
        .join("");
      return `\`${body}\``;
    })
    .with({ kind: "ref" }, (r) => {
      // A parametric nullary ctor (`None`) infers `Option<never>`, which won't
      // flow where a concrete `Option<C>` is expected — annotate it in place
      // (TS backend, ADR 0039), the Option/variant analogue of the empty-array
      // rule above. Gate on a 0-field ctor so plain value refs are untouched;
      // `annotateEmpty` returns null unless the recorded type is fully concrete.
      const nullaryCtor = ctorKeys.get(r.name)?.length === 0;
      const ann = nullaryCtor ? annotateEmpty?.(r) : null;
      return ann ? `(${r.name} as ${ann})` : r.name;
    })
    .with({ kind: "call" }, (c) => {
      const inner = `${genCallee(c.fn)}(${c.args.map(genExpr).join(", ")})`;
      // TS backend (ADR 0043): an applied parametric ctor (`Ok("")`, `Err(e)`)
      // leaves the type param its argument doesn't determine free, so tsc widens
      // it to `unknown` — in a ts-pattern arm that then clashes with a sibling
      // arm. Cast the call to its resolved concrete type. Gated on an uppercase
      // callee (a ctor; `annotateCall` itself yields null unless the type is a
      // fully-concrete `con`, so ordinary Capitalized calls stay bare).
      const ann = c.fn.kind === "ref" && /^[A-Z]/.test(c.fn.name) ? annotateCall?.(c) : null;
      return ann ? `(${inner} as ${ann})` : inner;
    })
    .with({ kind: "lambda" }, (l) => {
      const { params, body } = collapseLambda(l);
      // TS backend: annotate each param from the lambda's inferred curried type
      // (ADR 0028), so `(x) => …` becomes `(x: A) => …` — otherwise strict tsc
      // infers `any`. `l.span` (the outer, un-collapsed lambda) carries the full
      // `A -> B -> …` type; the callback peels it per collapsed param.
      const ann = annotateParams?.(l.span, params.length);
      const anns = ann?.params ?? [];
      const ps = params.map((p, i) => {
        const g = genParam(p);
        return anns[i] ? `${g}: ${anns[i]}` : g;
      });
      // A generic binding's value lambda scopes its letters here (ADR 0032), so
      // its (now fully annotated) params can name them; every other lambda: "".
      const arrow = `${ann?.generics ?? ""}(${ps.join(", ")}) => ${genLambdaBody(body)}`;
      // Curried type, flat JS impl: arity ≥ 2 lowers to a `_curry`-wrapped
      // function so any call grouping works (CRITIQUE §4.4). Arity 1 needs none.
      return params.length >= 2 ? `_curry(${params.length}, ${arrow})` : arrow;
    })
    // let x = v in b  →  an IIFE binding x: `((x) => b)(v)`. Non-recursive, so
    // a plain arg-application is enough; nested let-ins chain as curried IIFEs.
    .with({ kind: "letin" }, (l) => {
      const ann = annotateLetin?.(l.value);
      const param = ann ? `${l.name}: ${ann}` : l.name;
      return `((${param}) => ${genLambdaBody(l.body)})(${genExpr(l.value)})`;
    })
    // let? p = v in b  →  the Result bind: `_Result_flatMap((p) => b)(v)`.
    // Under `flattenPipe` (TS backend) the two args go in ONE grouping —
    // `_Result_flatMap((p) => b, v)` — so tsc infers `p`'s type from `v` in the
    // all-at-once overload; the curried `f(v)` split leaves `p` unconstrained
    // (`unknown`) across the two calls. Both are equivalent under `_curry`.
    .with({ kind: "letbind" }, (l) => {
      const f = `(${genParam(l.param)}) => ${genLambdaBody(l.body)}`;
      const v = genExpr(l.value);
      return flattenPipe ? `_Result_flatMap(${f}, ${v})` : `_Result_flatMap(${f})(${v})`;
    })
    // desugar inline: a |> f  →  f(a). Under `flattenPipe` (TS backend), a pipe
    // into a call appends the arg — `a |> f(x)` → `f(x, a)` — so tsc infers type
    // args from every argument at once; otherwise the curried `f(x)(a)`.
    .with({ kind: "pipe" }, (p) =>
      flattenPipe && p.right.kind === "call"
        ? `${genCallee(p.right.fn)}(${[...p.right.args, p.left].map(genExpr).join(", ")})`
        : `${genCallee(p.right)}(${genExpr(p.left)})`,
    )
    // Always parenthesized, so the output nests safely in any JS position.
    .with(
      { kind: "ternary" },
      (t) => `(${genExpr(t.cond)} ? ${genExpr(t.then)} : ${genExpr(t.else)})`,
    )
    .with({ kind: "match" }, genMatch)
    .with({ kind: "record" }, (r) => {
      const fields = r.fields.map((f) => `${f.name}: ${genExpr(f.value)}`);
      const parts = r.spread ? [`...${genExpr(r.spread)}`, ...fields] : fields;
      return parts.length === 0 ? "{}" : `{ ${parts.join(", ")} }`;
    })
    .with({ kind: "field" }, (f) => nsRuntimeId(f) ?? `${genMember(f.target)}.${f.name}`)
    // A tuple erases to a JS array `[a, b]` (like ReScript); the type system
    // keeps it distinct from an `alang` Array, the runtime shares the shape. TS
    // emit wraps it in `_tuple(…)` so tsc infers a tuple, not a widened array
    // (ADR 0036); the JS backend keeps the bare literal (byte-identical).
    .with({ kind: "tuple" }, (t) => {
      const elems = t.elements.map(genExpr).join(", ");
      return tupleHelper ? `_tuple(${elems})` : `[${elems}]`;
    })
    .with({ kind: "arr" }, (l) => {
      const body = `[${l.elements.map(genExpr).join(", ")}]`;
      // Empty `[]` infers `never[]` — annotate with the resolved element type
      // (TS backend) so it flows where a concrete array is expected (ADR 0035).
      const ann = l.elements.length === 0 ? annotateEmpty?.(l) : null;
      return ann ? `(${body} as ${ann})` : body;
    })
    .with({ kind: "list" }, genList)
    .with({ kind: "map" }, (m) => {
      const entries = m.entries.map((e) => `[${genExpr(e.key)}, ${genExpr(e.value)}]`).join(", ");
      // Empty `#{}` infers `Map<unknown, unknown>` — emit `new Map<K, V>()`
      // with the resolved key/value types (TS backend, ADR 0035).
      const ann = m.entries.length === 0 ? annotateEmpty?.(m) : null;
      return ann ? `new ${ann}()` : `new Map([${entries}])`;
    })
    .exhaustive();

// A `@{...}` literal → a lazy iterable over its (eagerly-evaluated) elements.
// `_list` wraps a generator factory so the List is re-iterable and lazy.
const genList = (e: ListExpr): string => {
  const yields = e.elements.map((el) => `yield (${genExpr(el)});`).join(" ");
  return `_list(function* () {${yields ? ` ${yields} ` : ""}})`;
};

// A lambda parameter lowers to JS: a name, or native object destructuring.
const genParam = (p: LamParam): string =>
  p.kind === "name"
    ? p.name
    : p.kind === "ptuple"
      ? `[${p.names.join(", ")}]`
      : `{ ${p.fields.join(", ")} }`;

// A lambda in callee position must be parenthesized: `((x) => ...)(arg)`.
const genCallee = (e: Expr): string => (e.kind === "lambda" ? `(${genExpr(e)})` : genExpr(e));

// A record or lambda in member-target position needs parens: `({...}).x`.
const genMember = (e: Expr): string =>
  e.kind === "record" || e.kind === "lambda" ? `(${genExpr(e)})` : genExpr(e);

// A record literal as a concise arrow body must be parenthesized, else JS
// parses `=> { ... }` as a statement block: `=> ({ x: 1 })`.
const genLambdaBody = (e: Expr): string => (e.kind === "record" ? `(${genExpr(e)})` : genExpr(e));

// ---- match → @onrails/pattern chain --------------------------------------
// Emitted `switch` lowers to a match().with().exhaustive() chain. We target
// @onrails/pattern (ts-pattern-shaped, smaller runtime, pairs with
// @onrails/result + @onrails/maybe). Each arm is a single pattern, which is the
// common subset both libraries share.

// A pattern always matches (→ `.otherwise`) when it binds without narrowing: a
// wildcard, a plain name, or a record whose every field just binds.
const isCatchAll = (p: Pattern): boolean =>
  p.kind === "pwild" ||
  p.kind === "pbind" ||
  (p.kind === "precord" && p.fields.every((f) => isCatchAll(f.pat))) ||
  // A tuple always matches when every position does (irrefutable product).
  (p.kind === "ptuple" && p.elems.every(isCatchAll)) ||
  // [...all] / @{...all} — a bare rest with no fixed head matches anything.
  ((p.kind === "parr" || p.kind === "plist") && p.elems.length === 0 && p.rest !== null);

// ---- general pattern compiler ----------------------------------------------
// Nested patterns can't lower to matcher objects: @onrails/pattern's matcher
// compares object values shallowly (`!==`), so `{ value: { _tag: "Sm" } }`
// never matches. An arm with nesting instead lowers to the guard form the
// array/tuple arms already use — `.with((_v) => conds, (slot) => body)`.
// `patConds` renders the refutable tests against a path expression; `patSlot`
// renders the JS destructuring target binding the names ("" = a hole, nothing
// binds beneath). Lazy `plist` never reaches either: nested occurrences are
// rejected by check.ts, top-level arms go through `genListMatch`.

// `{ key: sub }` entry, punned when the bound name IS the key.
const keyedSlot = (key: string, sub: string): string => (sub === key ? key : `${key}: ${sub}`);

const patSlot = (p: Pattern): string => {
  switch (p.kind) {
    case "pbind":
      return p.name;
    case "pwild":
    case "plit":
    case "pbool":
    case "pstr":
    case "plist":
      return "";
    case "pctor": {
      const keys = ctorKeys.get(p.ctor);
      const entries = p.args.flatMap((a, i) => {
        const s = patSlot(a);
        return s === "" ? [] : [keyedSlot(keys?.[i] ?? `_${i}`, s)];
      });
      return entries.length ? `{ ${entries.join(", ")} }` : "";
    }
    case "precord": {
      const entries = p.fields.flatMap((f) => {
        const s = patSlot(f.pat);
        return s === "" ? [] : [keyedSlot(f.label, s)];
      });
      return entries.length ? `{ ${entries.join(", ")} }` : "";
    }
    case "ptuple": {
      const slots = p.elems.map(patSlot);
      return slots.some((s) => s !== "") ? `[${slots.join(", ")}]` : "";
    }
    case "parr": {
      const slots = p.elems.map(patSlot);
      if (p.rest?.kind === "pbind") slots.push(`...${p.rest.name}`);
      return slots.some((s) => s !== "") ? `[${slots.join(", ")}]` : "";
    }
    // Alternatives bind identical names at identical positions (checked), so any
    // alt's slot destructures the value for the whole arm.
    case "por":
      return patSlot(p.alts[0]!);
  }
};

const patConds = (p: Pattern, path: string): string[] => {
  switch (p.kind) {
    case "pwild":
    case "pbind":
    case "plist":
      return [];
    case "plit":
    case "pbool":
    case "pstr":
      return [`${path} === ${litValue(p)}`];
    case "pctor": {
      const keys = ctorKeys.get(p.ctor);
      return [
        `${path}._tag === ${JSON.stringify(p.ctor)}`,
        ...p.args.flatMap((a, i) => patConds(a, `${path}.${keys?.[i] ?? `_${i}`}`)),
      ];
    }
    case "precord":
      return p.fields.flatMap((f) => patConds(f.pat, `${path}.${f.label}`));
    case "ptuple":
      // No length guard — tuple arity is guaranteed by the type.
      return p.elems.flatMap((e, i) => patConds(e, `${path}[${i}]`));
    case "parr":
      return [
        `${path}.length ${p.rest ? ">=" : "==="} ${p.elems.length}`,
        ...p.elems.flatMap((e, i) => patConds(e, `${path}[${i}]`)),
      ];
    case "por": {
      // `(condsA) || (condsB) || …` — each alt's own conds &&-joined first.
      const alts = p.alts.map((a) => {
        const c = patConds(a, path);
        return c.length ? c.map((x) => `(${x})`).join(" && ") : "true";
      });
      return [alts.map((a) => `(${a})`).join(" || ")];
    }
  }
};

// The handler parameter for a catch-all pattern: bind the name, destructure a
// record's/tuple's binds, or ignore the value.
const catchAllParam = (p: Pattern): string => {
  // `[...all]` / `@{...all}` binds the whole collection to the rest name — NOT
  // a destructure: `[...all]` would copy the array and force a lazy List.
  if (p.kind === "parr" || p.kind === "plist")
    return p.rest?.kind === "pbind" ? `(${p.rest.name})` : "()";
  const slot = patSlot(p);
  return slot === "" ? "()" : `(${slot})`;
};

// A switch is a "lazy-List match" when it has a narrowing `@{}`/`@{h,...t}` arm
// (a lone `@{...all}` is a catch-all, not narrowing). check.ts guarantees such a
// switch is exactly the empty + single-head-cons pair, so it lowers directly.
const isListMatch = (m: MatchExpr): boolean =>
  m.arms.some((a) => a.pattern.kind === "plist" && !isCatchAll(a.pattern));

// A lazy tail/rest: replay the still-buffered elements from index `from`, then
// drain whatever's left in the iterator. `_list` makes it re-iterable + lazy.
const listTail = (from: number): string =>
  `_list(function* () { for (let _i = ${from}; _i < _b.length; _i++) yield _b[_i]; ` +
  `if (!_done) { let _s; while (!(_s = _it.next()).done) yield _s.value; } })`;

// One narrowing lazy-List arm → an `if (cond) return call;`. A fixed arm `@{a,
// b}` must see n+1 pulls to prove length exactly n; a cons arm `@{h, ...t}`
// needs n pulls (length ≥ n) and binds its tail to a lazy List over the rest.
// Element sub-patterns guard/bind via the general compiler against the buffer
// (`_b[i]` is already pulled, so nested tests force nothing extra).
const genListArm = (p: ListPat, body: Expr): string => {
  const n = p.elems.length;
  const guards = p.elems.flatMap((ep, i) => patConds(ep, `_b[${i}]`));
  const cond = [p.rest ? `_pull(${n})` : `!_pull(${n + 1}) && _b.length === ${n}`, ...guards].join(
    " && ",
  );
  const params: string[] = [];
  const args: string[] = [];
  p.elems.forEach((ep, i) => {
    const slot = patSlot(ep);
    if (slot !== "") {
      params.push(slot);
      args.push(`_b[${i}]`);
    }
  });
  if (p.rest?.kind === "pbind") {
    params.push(p.rest.name);
    args.push(listTail(n));
  }
  return `  if (${cond}) return ((${params.join(", ")}) => ${genLambdaBody(body)})(${args.join(", ")});`;
};

// A lazy-List switch → an IIFE that pulls just enough elements to decide each
// arm, buffering them so later arms can re-examine a prefix without re-forcing
// it. Bounded pulls only — a pull-sequence is never fully forced, so this can't
// use @onrails/pattern (not length-indexable). check.ts proved totality.
const genListMatch = (m: MatchExpr): string => {
  const arms: string[] = [];
  let fallback = `(() => { throw new Error("non-exhaustive lazy-list switch"); })()`;
  for (const a of m.arms) {
    if (a.pattern.kind === "plist" && !isCatchAll(a.pattern)) {
      arms.push(genListArm(a.pattern, a.body));
    } else if (isCatchAll(a.pattern)) {
      // `@{...all}` / `_` / bind matches any list; a named rest binds a lazy
      // List over the whole thing (leftover buffer + iterator). Terminal arm.
      const rest =
        a.pattern.kind === "plist" && a.pattern.rest?.kind === "pbind" ? a.pattern.rest.name : null;
      fallback = rest ? `((${rest}) => ${genLambdaBody(a.body)})(${listTail(0)})` : genExpr(a.body);
      break;
    }
  }
  return (
    `((_it) => { const _b = []; let _done = false; ` +
    `const _pull = (_n) => { while (_b.length < _n && !_done) { const _s = _it.next(); ` +
    `if (_s.done) _done = true; else _b.push(_s.value); } return _b.length >= _n; };\n` +
    `${arms.join("\n")}\n  return ${fallback};\n` +
    `})(${genExpr(m.scrutinee)}[Symbol.iterator]())`
  );
};

const genMatch = (m: MatchExpr): string => {
  if (isListMatch(m)) return genListMatch(m);
  const parts = [`match(${genExpr(m.scrutinee)})`];
  // TS backend (ADR 0031): the concrete scrutinee type each guard-form arm
  // narrows FROM. null in JS mode / for generic scrutinees → the bare guard form.
  const base = guardBaseType?.(m.scrutinee) ?? null;
  let catchAll: MatchArm | undefined;
  for (const arm of m.arms) {
    // A guarded arm narrows regardless of its pattern (the guard can be
    // false), so it always takes the guard form — even `_ when g`.
    if (arm.guard) {
      parts.push(`  ${genGuardArm(arm.pattern, arm.body, arm.guard, base)}`);
      continue;
    }
    if (isCatchAll(arm.pattern)) {
      catchAll ??= arm;
      continue;
    }
    parts.push(`  ${genWithArm(arm.pattern as NarrowingPattern, arm.body, base)}`);
  }
  if (catchAll) {
    parts.push(
      `  .otherwise(${catchAllParam(catchAll.pattern)} => ${genLambdaBody(catchAll.body)})`,
    );
  } else if (guardBaseType !== null && m.arms.some((a) => a.pattern.kind === "parr")) {
    // TS backend (ADR 0038): an eager-array match with no catch-all is the
    // `[]` + `[h, ...t]` length partition check.ts proved total. Its guard arms
    // test `.length` — they don't narrow `A[]` structurally, so ts-pattern's
    // `.exhaustive()` still sees `A[]` leftover and types as
    // `NonExhaustiveError<A[]>` (TS2322). Close with a throwing `.otherwise`
    // instead: its `never` return is assignable to the declared type, and the
    // branch is dead (totality already proven). JS mode (`guardBaseType` null)
    // keeps `.exhaustive()` — emitted JS stays byte-identical.
    parts.push(`  .otherwise(() => { throw new Error("non-exhaustive match"); })`);
  } else {
    parts.push("  .exhaustive()");
  }
  return parts.join("\n");
};

// A literal pattern rendered as a JS value for the matcher object / `.with`.
const litValue = (p: LitPat): string =>
  p.kind === "pstr" ? JSON.stringify(p.value) : p.kind === "plit" ? p.raw : String(p.value);

// Patterns that narrow (everything a catch-all is not) — routed to `.with(...)`.
type NarrowingPattern = Extract<
  Pattern,
  { kind: "pctor" | "plit" | "pbool" | "pstr" | "precord" | "parr" | "ptuple" | "por" }
>;

// A sub-pattern the flat matcher-object form can express: a bind, wildcard, or
// primitive literal (the matcher compares values with `!==`, so only
// primitives are meaningful there). Anything deeper routes to the guard form.
const isFlatSub = (p: Pattern): boolean =>
  p.kind === "pbind" ||
  p.kind === "pwild" ||
  p.kind === "plit" ||
  p.kind === "pbool" ||
  p.kind === "pstr";

// TS backend (ADR 0031): render a guard-form pattern to the type-predicate
// target it narrows to, from the scrutinee's concrete `base` type. A ctor
// contributes `Extract<base, { _tag: "C" }>`; a nested ctor/record inside a field
// refines that field via indexed access, so the handler input narrows exactly as
// the pattern does. Pure over `ctorKeys`; only reachable in TS mode.
function patTarget(p: Pattern, base: string): string {
  if (p.kind === "pctor") {
    const member = `Extract<${base}, { _tag: ${JSON.stringify(p.ctor)} }>`;
    const keys = ctorKeys.get(p.ctor);
    const refines = p.args.flatMap((a, i) => {
      const key = keys?.[i] ?? `_${i}`;
      const sub = fieldRefine(a, `${member}[${JSON.stringify(key)}]`);
      return sub ? [`${JSON.stringify(key)}: ${sub}`] : [];
    });
    return refines.length ? `${member} & { ${refines.join("; ")} }` : member;
  }
  if (p.kind === "precord") {
    const refines = p.fields.flatMap((f) => {
      const sub = fieldRefine(f.pat, `${base}[${JSON.stringify(f.label)}]`);
      return sub ? [`${JSON.stringify(f.label)}: ${sub}`] : [];
    });
    return refines.length ? `${base} & { ${refines.join("; ")} }` : base;
  }
  if (p.kind === "ptuple") {
    // Tuple element i is `base[i]`; refine each element whose sub-pattern narrows.
    const subs = p.elems.map((e, i) => fieldRefine(e, `(${base})[${i}]`));
    if (subs.every((s) => s === null)) return base;
    return `[${p.elems.map((_, i) => subs[i] ?? `(${base})[${i}]`).join(", ")}]`;
  }
  if (p.kind === "parr") {
    // Array `T[]` → a tuple of refined heads plus a `...T[]` rest, so a head
    // matched by a ctor (`[IPExpr(e), ...rest]`) narrows for the handler.
    const elemType = `(${base})[number]`;
    const subs = p.elems.map((e) => fieldRefine(e, elemType));
    if (subs.every((s) => s === null)) return base;
    const heads = subs.map((s) => s ?? elemType).join(", ");
    return `[${heads}${p.rest ? `, ...${base}` : ""}]`;
  }
  // or-patterns: keep the base (per-alt narrowing would need a union target).
  return base;
}

// A field's refined type when its sub-pattern narrows it, else null (the field
// keeps its declared type — a bind/wildcard/literal needs no narrowing).
function fieldRefine(p: Pattern, fieldBase: string): string | null {
  if (p.kind === "pctor") return patTarget(p, fieldBase);
  if (p.kind === "precord") {
    const t = patTarget(p, fieldBase);
    return t === fieldBase ? null : t;
  }
  return null;
}

// The general arm: predicate + destructuring handler, built by the pattern
// compiler. Handles arbitrary nesting (`Sm(Sm(n))`, `Ok((a, b))`, ctors inside
// tuples/arrays) and `when` guards. A guard runs after the structural tests
// (&&-short-circuit), with the pattern's binds rebound from the root by the same
// destructuring slot the handler uses. In TS mode (`base` set) the arm is a type
// predicate `(_v): _v is <target>` whose body tests a widened `_g` copy — so the
// handler input narrows (ADR 0031) without the boolean body fighting `_v`'s type.
const genGuardArm = (p: Pattern, body: Expr, guard?: Expr, base: string | null = null): string => {
  const root = base ? "_g" : "_v";
  const conds = patConds(p, root);
  const slot = patSlot(p);
  if (guard)
    conds.push(slot === "" ? `(${genExpr(guard)})` : `((${slot}) => ${genExpr(guard)})(${root})`);
  const test = conds.length ? conds.join(" && ") : "true";
  const handler = `${slot === "" ? "()" : `(${slot})`} => ${genLambdaBody(body)}`;
  // Emit a type predicate ONLY when it actually refines (target ≠ base): a
  // whole-value pattern with no field narrowing (`[]`, `_ when g`) gains nothing
  // from `_v is base` and would trip TS2677 when `base` is a row-poly `{…} & R`
  // param — the closed `base` string isn't assignable to the open param. The
  // plain boolean guard leaves `_v` at its declared (open) type. (ADR 0031/0034)
  if (base) {
    const target = patTarget(p, base);
    if (target !== base)
      return `.with((_v): _v is ${target} => { const _g: any = _v; return ${test}; }, ${handler})`;
    return `.with((_v) => { const _g: any = _v; return ${test}; }, ${handler})`;
  }
  return `.with((_v) => ${test}, ${handler})`;
};

const genWithArm = (p: NarrowingPattern, body: Expr, base: string | null = null): string => {
  // Array/tuple/or arms always take the guard form (not matcher-object-able).
  if (p.kind === "parr" || p.kind === "ptuple" || p.kind === "por")
    return genGuardArm(p, body, undefined, base);

  if (p.kind === "plit" || p.kind === "pbool" || p.kind === "pstr")
    return `.with(${litValue(p)}, () => ${genLambdaBody(body)})`;

  if (p.kind === "precord") {
    if (!p.fields.every((f) => isFlatSub(f.pat))) return genGuardArm(p, body, undefined, base);
    // Flat fast path: literal fields form the matcher object (at least one —
    // else it's a catch-all); binding fields destructure in the handler.
    const lits = p.fields.flatMap((f) =>
      f.pat.kind === "plit" || f.pat.kind === "pbool" || f.pat.kind === "pstr"
        ? [`${f.label}: ${litValue(f.pat)}`]
        : [],
    );
    const slot = patSlot(p);
    return `.with({ ${lits.join(", ")} }, ${slot === "" ? "()" : `(${slot})`} => ${genLambdaBody(body)})`;
  }

  // pctor — flat fast path keeps the readable matcher-object form.
  if (!p.args.every(isFlatSub)) return genGuardArm(p, body, undefined, base);
  const binds: string[] = []; // "value: r" (or "_0: r" positionally)
  const litFields: string[] = []; // "value: 5" — narrows further
  const keys = ctorKeys.get(p.ctor);
  p.args.forEach((a, i) => {
    const key = keys?.[i] ?? `_${i}`;
    if (a.kind === "pbind") binds.push(keyedSlot(key, a.name));
    else if (a.kind === "plit" || a.kind === "pbool" || a.kind === "pstr")
      litFields.push(`${key}: ${litValue(a)}`);
    // pwild → don't bind
  });
  const patObj = [`_tag: ${JSON.stringify(p.ctor)}`, ...litFields].join(", ");
  const param = binds.length ? `({ ${binds.join(", ")} })` : "()";
  return `.with({ ${patObj} }, ${param} => ${genLambdaBody(body)})`;
};

// ---- statements -----------------------------------------------------------

// A variant decl has no runtime type in JS — it lowers to constructor
// factories only. Nullary → a tagged value; n-ary → a tagging function. The
// discriminant key is `_tag`, matching the @onrails ecosystem convention
// (@onrails/result, @onrails/maybe), so their type guards (isOk/isSome/...)
// recognize alang values at the JS boundary.
const genType = (s: TypeStmt): string =>
  s.ctors
    .map((c) => {
      const tag = JSON.stringify(c.name);
      if (c.fields.length === 0) {
        const ts = annotateCtor?.(s, c) ?? null;
        // Annotate the nullary const so `_tag` stays the literal (`"Leaf"`), not
        // widened to `string` — else it won't match the variant union.
        return ts
          ? `const ${c.name}: ${ts.retMono} = { _tag: ${tag} };`
          : `const ${c.name} = { _tag: ${tag} };`;
      }
      const keys = keysOf(c.fields);
      const params = keys.join(", ");
      const obj = `({ _tag: ${tag}, ${params} })`;
      const ts = annotateCtor?.(s, c) ?? null; // TS backend types the factory
      // Single-field: a typed arrow scopes its own generics (`<A>(_0: A): T`).
      if (c.fields.length < 2) {
        if (!ts) return `const ${c.name} = (${params}) => ${obj};`;
        const typed = keys.map((k, i) => `${k}: ${ts.paramTypes[i]}`).join(", ");
        return `const ${c.name} = ${ts.generics}(${typed}): ${ts.ret} => ${obj};`;
      }
      // Multi-field: curried so partial application works (CRITIQUE §4.4). The
      // TS form casts `_curry`'s `any` to the public signature — the impl's
      // params stay `any` (from `_curry`), so no generic-scope gymnastics.
      const impl = `(${params}) => ${obj}`;
      const curried = `_curry(${c.fields.length}, ${impl})`;
      if (!ts) return `const ${c.name} = ${curried};`;
      const sig = `${ts.generics}(${keys.map((k, i) => `${k}: ${ts.paramTypes[i]}`).join(", ")}) => ${ts.ret}`;
      return `const ${c.name} = ${curried} as ${sig};`;
    })
    .join("\n");

// extern → an ESM import binding the external export to the alang name.
const genExtern = (s: ExternStmt): string => {
  const spec = s.imported === s.name ? s.name : `${s.imported} as ${s.name}`;
  return `import { ${spec} } from ${JSON.stringify(s.module)};`;
};

// import { a, b } from "./mod"  → the compiled sibling `./mod.js`. Source paths
// name the `.al` module (with or without extension); output targets `.js`.
const genImport = (s: ImportStmt): string => {
  const names = s.names.map((n) => n.name).join(", ");
  const path = `${s.from.replace(/\.al$/, "")}${moduleExt}`;
  return `import { ${names} } from ${JSON.stringify(path)};`;
};

const genStmt = (s: Stmt): string => {
  if (s.kind === "import") return genImport(s);
  if (s.kind === "type") {
    const decls = genType(s);
    if (decls === "") return ""; // record alias: pure type, no runtime
    return s.exported
      ? decls
          .split("\n")
          .map((l) => `export ${l}`)
          .join("\n")
      : decls;
  }
  if (s.kind === "extern") {
    // An extern is itself an import; re-export the local binding when exported.
    return s.exported ? `${genExtern(s)}\nexport { ${s.name} };` : genExtern(s);
  }
  const doExport = s.exported && !s.name.startsWith("$"); // never export destructure temps
  const ann = annotateLet?.(s.name, s.value) ?? ""; // TS backend annotates; JS leaves bare
  return `${doExport ? "export " : ""}const ${s.name}${ann} = ${genExpr(s.value)};`;
};

// Does the program need the `@onrails/pattern` import? Only if it has a match
// that lowers to a `match()` chain. A lazy-List switch lowers to a plain IIFE
// instead, so a program that only ever destructures Lists imports nothing.
const usesMatchLib = (e: Expr): boolean =>
  match(e)
    .with({ kind: "num" }, { kind: "bool" }, { kind: "str" }, { kind: "ref" }, () => false)
    .with({ kind: "interp" }, (i) => i.parts.some((p) => typeof p !== "string" && usesMatchLib(p)))
    .with({ kind: "call" }, (c) => usesMatchLib(c.fn) || c.args.some(usesMatchLib))
    .with({ kind: "lambda" }, (l) => usesMatchLib(l.body))
    .with({ kind: "letin" }, (l) => usesMatchLib(l.value) || usesMatchLib(l.body))
    .with({ kind: "letbind" }, (l) => usesMatchLib(l.value) || usesMatchLib(l.body))
    .with({ kind: "pipe" }, (p) => usesMatchLib(p.left) || usesMatchLib(p.right))
    .with(
      { kind: "ternary" },
      (t) => usesMatchLib(t.cond) || usesMatchLib(t.then) || usesMatchLib(t.else),
    )
    .with(
      { kind: "match" },
      (m) =>
        !isListMatch(m) ||
        usesMatchLib(m.scrutinee) ||
        m.arms.some(
          (a) => (a.guard !== undefined && usesMatchLib(a.guard)) || usesMatchLib(a.body),
        ),
    )
    .with(
      { kind: "record" },
      (r) =>
        (r.spread ? usesMatchLib(r.spread) : false) || r.fields.some((f) => usesMatchLib(f.value)),
    )
    .with({ kind: "field" }, (f) => usesMatchLib(f.target))
    .with({ kind: "tuple" }, (t) => t.elements.some(usesMatchLib))
    .with({ kind: "arr" }, (l) => l.elements.some(usesMatchLib))
    .with({ kind: "list" }, (l) => l.elements.some(usesMatchLib))
    .with({ kind: "map" }, (m) =>
      m.entries.some((e) => usesMatchLib(e.key) || usesMatchLib(e.value)),
    )
    .exhaustive();

// Every name referenced anywhere in an expression. Coarse — it counts locally
// shadowed uses too — but only ever consulted for prelude names, which are never
// worth shadowing, so the over-count is harmless.
const exprRefs = (e: Expr, acc: Set<string>): void => {
  match(e)
    .with({ kind: "num" }, { kind: "bool" }, { kind: "str" }, () => {})
    .with({ kind: "interp" }, (i) => {
      for (const p of i.parts) if (typeof p !== "string") exprRefs(p, acc);
    })
    .with({ kind: "ref" }, (r) => acc.add(r.name))
    .with({ kind: "call" }, (c) => {
      exprRefs(c.fn, acc);
      for (const a of c.args) exprRefs(a, acc);
    })
    .with({ kind: "lambda" }, (l) => {
      const { params, body } = collapseLambda(l);
      if (params.length >= 2) acc.add("_curry"); // arity ≥ 2 lowers to `_curry(...)`
      exprRefs(body, acc);
    })
    .with({ kind: "letin" }, (l) => {
      exprRefs(l.value, acc);
      exprRefs(l.body, acc);
    })
    .with({ kind: "letbind" }, (l) => {
      acc.add("_Result_flatMap"); // the bind lowers onto the prelude runtime
      exprRefs(l.value, acc);
      exprRefs(l.body, acc);
    })
    .with({ kind: "pipe" }, (p) => {
      exprRefs(p.left, acc);
      exprRefs(p.right, acc);
    })
    .with({ kind: "ternary" }, (t) => {
      exprRefs(t.cond, acc);
      exprRefs(t.then, acc);
      exprRefs(t.else, acc);
    })
    .with({ kind: "match" }, (m) => {
      exprRefs(m.scrutinee, acc);
      // A lazy-List arm that binds a tail/rest builds a `_list(...)` at runtime.
      if (m.arms.some((a) => a.pattern.kind === "plist" && a.pattern.rest?.kind === "pbind"))
        acc.add("_list");
      for (const arm of m.arms) {
        if (arm.guard) exprRefs(arm.guard, acc);
        exprRefs(arm.body, acc);
      }
    })
    .with({ kind: "record" }, (r) => {
      if (r.spread) exprRefs(r.spread, acc);
      for (const f of r.fields) exprRefs(f.value, acc);
    })
    .with({ kind: "field" }, (f) => {
      const rt = nsRuntimeId(f); // `List.map` → `_List_map`, not a field access
      if (rt) {
        acc.add(rt); // its runtime deps are pulled in by preludePreamble's closure
        return;
      }
      exprRefs(f.target, acc);
    })
    .with({ kind: "tuple" }, (t) => {
      for (const el of t.elements) exprRefs(el, acc);
    })
    .with({ kind: "arr" }, (l) => {
      for (const el of l.elements) exprRefs(el, acc);
    })
    .with({ kind: "list" }, (l) => {
      acc.add("_list"); // a `@{...}` literal calls the List core at runtime
      for (const el of l.elements) exprRefs(el, acc);
    })
    .with({ kind: "map" }, (m) => {
      for (const e of m.entries) {
        exprRefs(e.key, acc);
        exprRefs(e.value, acc);
      }
    })
    .exhaustive();
};

// The names a program binds at module scope — anything that would shadow a
// prelude builtin, so its runtime def must NOT be inlined (else a duplicate
// `const` and a JS SyntaxError, e.g. a user `let hypot = …`).
const boundNames = (prog: Program): Set<string> => {
  const bound = new Set<string>();
  for (const s of prog.stmts) {
    if (s.kind === "let" || s.kind === "extern") bound.add(s.name);
    else if (s.kind === "type") for (const c of s.ctors) bound.add(c.name);
    else if (s.kind === "import") for (const n of s.names) bound.add(n.name);
  }
  return bound;
};

// The prelude runtime names a program needs: every builtin it references and
// does not itself define, in prelude declaration order. Shared by the JS backend
// (inlines the defs) and the TS backend (imports them from the typed runtime).
export const collectRuntimeDeps = (prog: Program): string[] => {
  const refs = new Set<string>();
  for (const s of prog.stmts) {
    if (s.kind === "let") exprRefs(s.value, refs);
    // A multi-field constructor lowers to `_curry(...)` in genType (which
    // exprRefs never walks), so seed the dep here.
    else if (s.kind === "type" && s.ctors.some((c) => c.fields.length >= 2)) refs.add("_curry");
  }
  // Transitively pull in each referenced def's runtime deps (`range` → `_list`,
  // `_Map_get` → Some/None, …). A forward cursor over a push-only worklist
  // drains the growing frontier without an in-place `.pop()`.
  const queue = [...refs];
  for (let i = 0; i < queue.length; i++) {
    const r = queue[i]!;
    for (const d of runtimeDeps[r] ?? [])
      if (!refs.has(d)) {
        refs.add(d);
        queue.push(d);
      }
  }
  const bound = boundNames(prog);
  return Object.keys(preludeJsDefs).filter((name) => refs.has(name) && !bound.has(name));
};

// The prelude runtime a program needs inlined, emitted in declaration order.
const preludePreamble = (prog: Program): string => {
  const defs = collectRuntimeDeps(prog).map((name) => preludeJsDefs[name]!);
  return defs.length ? `${defs.join("\n")}\n\n` : "";
};

// `runtime`: inline the prelude builtins the program uses, so the emitted module
// runs standalone. Off by default — callers that supply their own prelude (tests
// via `new Function(preludeJs, …)`) keep prelude-free output.
export type CodegenOptions = {
  runtime?: boolean;
  annotate?: (name: string, value: Expr) => string | null;
  annotateCtor?: (s: TypeStmt, c: Ctor) => CtorFactoryTs | null;
  flattenPipe?: boolean;
  tupleHelper?: boolean;
  moduleExt?: string;
  annotateParams?: (span: Span, arity: number) => { generics: string; params: (string | null)[] };
  guardBaseType?: (scrutinee: Expr) => string | null;
  annotateEmpty?: (e: Expr) => string | null;
  annotateLetin?: (value: Expr) => string | null;
  annotateCall?: (e: Expr) => string | null;
};

export const codegen = (
  prog: Program,
  imported?: Map<string, string[]>,
  opts: CodegenOptions = {},
): string => {
  ctorKeys = new Map(imported ?? []);
  annotateLet = opts.annotate ?? null;
  annotateCtor = opts.annotateCtor ?? null;
  flattenPipe = opts.flattenPipe ?? false;
  tupleHelper = opts.tupleHelper ?? false;
  moduleExt = opts.moduleExt ?? ".js";
  annotateParams = opts.annotateParams ?? null;
  guardBaseType = opts.guardBaseType ?? null;
  annotateEmpty = opts.annotateEmpty ?? null;
  annotateLetin = opts.annotateLetin ?? null;
  annotateCall = opts.annotateCall ?? null;
  for (const s of prog.stmts)
    if (s.kind === "type") for (const c of s.ctors) ctorKeys.set(c.name, keysOf(c.fields));
  // Seed builtin variant ctor keys (Some/Ok/…) unless the program declares its own.
  for (const bt of builtinTypeDecls)
    for (const c of bt.ctors) if (!ctorKeys.has(c.name)) ctorKeys.set(c.name, keysOf(c.fields));
  const needsMatch = prog.stmts.some((s) => s.kind === "let" && usesMatchLib(s.value));
  const header = needsMatch ? `import { match } from "@onrails/pattern";\n\n` : "";
  const preamble = opts.runtime ? preludePreamble(prog) : "";
  const body = prog.stmts.map(genStmt).join("\n");
  return `${header}${preamble}${body}\n`;
};
