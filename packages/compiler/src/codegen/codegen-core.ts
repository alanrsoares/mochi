/**
 * Codegen core — expression-level AST → JavaScript, plus the shared `GenCtx`
 * threaded through every gen* module in this package.
 */
import { match } from "@onrails/pattern";
import type {
  Ctor,
  Expr,
  FieldExpr,
  LambdaExpr,
  LamParam,
  ListExpr,
  TypeExpr,
  TypeStmt,
} from "../ast/ast";
import type { Span } from "../ast/span";
import { namespaceRuntime } from "../prelude/prelude";
import { exprRefs } from "./codegen-deps";
import { genLoopBlock } from "./codegen-loop";
import { genMatch } from "./codegen-match";

/** Top-level arrow spine length of a surface type (`a -> b -> c` → 2). */
export const typeExprArity = (te: TypeExpr): number =>
  te.kind === "tarrow" ? 1 + typeExprArity(te.to) : 0;

/** A `Ns.member` access on a bare namespace ref (`List.map`) → the JS identifier its runtime is defined under, or null if it isn't a namespace access. */
export const nsRuntimeId = (e: FieldExpr): string | null =>
  e.target.kind === "ref" ? (namespaceRuntime[e.target.name]?.[e.name] ?? null) : null;

/** Runtime helper for a monadic bind — `let?` is Option or Result after infer dispatch (ADR 0079). */
export const bindRuntime = (monad: "Option" | "Result" | "Task"): string =>
  monad === "Option" ? "_Option_flatMap" : monad === "Result" ? "_Result_flatMap" : "_Task_andThen";

/** The typing a TS-mode ctor factory carries (see `GenCtx.annotateCtor`). */
export type CtorFactoryTs = {
  generics: string;
  paramTypes: string[];
  ret: string;
  retMono: string;
};

/** Per-call codegen context: built once at the top of `codegen` and threaded as the last parameter through the gen* family. Never mutated after construction. */
export type GenCtx = {
  // A constructor's runtime field keys (see `keysOf`) — populated per `codegen`
  // call from the program's `type` decls (plus imported and builtin ctors).
  readonly ctorKeys: Map<string, string[]>;

  // Optional per-binding type annotation for a top-level `let`, returning the text
  // to splice after the name (`: (x: A) => A`) or null for none. Set from
  // `CodegenOptions.annotate` per `codegen` call; the TS backend (`codegen-ts.ts`,
  // ADR 0026) supplies it, the JS backend leaves it null (byte-identical output).
  readonly annotateLet: ((name: string, value: Expr) => string | null) | null;

  // Optional typing for a variant's ctor factory in TS mode (ADR 0026): given the
  // type decl and one ctor, return the generic head, per-field param types, and
  // the variant return type, or null for the untyped JS shape. Supplied by the TS
  // backend (from dts's `ctorFactoryTs`); null for the JS backend.
  readonly annotateCtor: ((s: TypeStmt, c: Ctor) => CtorFactoryTs | null) | null;

  // TS backend (ADR 0026): lower `a |> f(x)` to the flattened call `f(x, a)`
  // instead of the curried `f(x)(a)`. Both are equivalent under `_curry`, but the
  // flat form lets `tsc` infer type args from ALL arguments at once — `xs |> map(f)`
  // as `map(f, xs)` pins the element type, where `map(f)(xs)` leaves it `unknown`.
  // Off for the JS backend, which stays byte-identical.
  readonly flattenPipe: boolean;

  // TS backend (ADR 0036): emit a tuple literal as `_tuple(a, b)` instead of the
  // bare array `[a, b]`. The runtime `_tuple` is an identity whose rest param is
  // inferred as a tuple, so tsc keeps `[A, B]` where a bare array literal would
  // widen to `(A | B)[]` (no contextual tuple type flows through `Some(…)`/`Ok(…)`
  // /@onrails/pattern arm returns). Off for the JS backend — output stays byte-identical.
  readonly tupleHelper: boolean;

  // TS backend (ADR 0028): given a lambda's span and its collapsed parameter count,
  // return a `generics` head (`<A, B>` or `""`) to scope over the arrow plus one
  // type annotation (the bare type text, no leading `:`) or null per param. The
  // head is non-empty only for a generic function binding's value lambda (ADR 0032),
  // where scoping the letters on the arrow lets its params name them; every other
  // lambda gets `""` and concrete-only params. Supplied by the TS backend from the
  // per-node inference table; null for the JS backend (byte-identical output).
  readonly annotateParams:
    | ((span: Span, arity: number) => { generics: string; params: (string | null)[] })
    | null;

  // TS backend (ADR 0031): given a match scrutinee expr, return its concrete TS
  // type text (the "base" the guard-form predicate narrows from), or null (generic
  // scrutinee / JS backend). Used to synthesize a type-predicate guard so the
  // handler input narrows — `@onrails/pattern`'s `Narrow` only refines for `x is U` guards,
  // not plain boolean ones, so nested-pattern handlers otherwise see the full union.
  readonly guardBaseType: ((scrutinee: Expr) => string | null) | null;

  // TS backend (ADR 0035): given an EMPTY collection literal expr, return its
  // fully-concrete TS type text (`Map<number, Ty>`, `Ty[]`), or null (element
  // type still generic / JS backend). An empty `#{}`/`[]` otherwise infers
  // `Map<unknown, unknown>`/`never[]` (and `Set.fromArray([])` → `Set<never>`),
  // which won't flow to a concretely-typed state field; the annotation pins it.
  readonly annotateEmpty: ((e: Expr) => string | null) | null;

  // TS backend (ADR 0035): given a `let x = v in …` value expr, return the
  // monomorphic TS type to annotate the emitted IIFE param `x`, or null. The
  // annotation flows contextual types into `v`'s empty collections through the
  // IIFE, which arg-based inference alone cannot do.
  readonly annotateLetin: ((value: Expr) => string | null) | null;

  // TS backend (ADR 0043): given an applied parametric constructor call (`Ok(x)`,
  // `Err(e)`), return its fully-concrete TS type text to cast the call to, or null.
  // A ctor's argument pins only some type params; a phantom one (`Ok`'s error, `Err`'s
  // ok) stays free and widens to `unknown` in a @onrails/pattern arm — annotating the call
  // (`Ok("") as Result<string, string>`) pins it. The applied-ctor analogue of the
  // nullary-ctor rule (`annotateEmpty` on a `ref`, ADR 0039).
  readonly annotateCall: ((e: Expr) => string | null) | null;

  // Extension for cross-module import specifiers: `.js` for the JS backend (the
  // compiled sibling), `""` for the TS backend (`import … from "./mod"`, which
  // tsc/bundlers resolve to the sibling `.ts`). Set per `codegen` call.
  readonly moduleExt: string;

  // Names referenced in let/expr values — not patterns. A local `| TLet =>`
  // arm only matches `_tag`, so `genType` can skip that ctor's factory unless
  // the name appears here (`tok == TGt`) or the type stmt is exported.
  readonly valueRefs: ReadonlySet<string>;
};

/** `Set.empty` / `Map.empty` / `List.empty` lower to the same runtime as `#{}` / `@{}` (ADR 0080). */
export const emptyNsEmit = (e: FieldExpr, ctx: GenCtx): string | null => {
  if (e.target.kind !== "ref" || e.name !== "empty") return null;
  switch (e.target.name) {
    case "Set": {
      const ann = ctx.annotateEmpty?.(e);
      return ann ? `new ${ann}()` : "new Set()";
    }
    case "Map": {
      const ann = ctx.annotateEmpty?.(e);
      return ann ? `new ${ann}()` : "new Map()";
    }
    case "List":
      return "_list(function* () {})";
    default:
      return null;
  }
};

/**
 * Collapse a curried lambda chain (`x => y => body`, or a mix with multi-param
 * lambdas) into one flat parameter list plus the final body. mochi types treat
 * `(x, y) => e` and `x => y => e` identically (`a -> b -> c`), so this is sound
 * — it lets a multi-arg function lower to a single `_curry`-wrapped JS function
 * instead of nested closures (CRITIQUE §4.4).
 */
export const collapseLambda = (l: LambdaExpr): { params: LamParam[]; body: Expr } => {
  const params = [...l.params];
  let body: Expr = l.body;
  while (body.kind === "lambda") {
    params.push(...body.params);
    body = body.body;
  }
  return { params, body };
};

/** Re-escape a decoded literal chunk for a JS template literal: backslashes first (else the escapes we're about to insert double-escape), then the two chars that would otherwise reopen JS template syntax. */
const escapeTemplateLiteral = (s: string): string =>
  s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

export const genExpr = (e: Expr, ctx: GenCtx): string =>
  match(e)
    .with({ kind: "num" }, (n) => n.raw)
    .with({ kind: "unit" }, () => "undefined")
    .with({ kind: "bool" }, (b) => String(b.value))
    .with({ kind: "str" }, (s) => JSON.stringify(s.value))
    // "…${x}…" (ADR 0023) → a native JS template literal — emitted JS reads
    // exactly like the source.
    .with({ kind: "interp" }, (interp) => {
      const body = interp.parts
        .map((p) => (typeof p === "string" ? escapeTemplateLiteral(p) : `\${${genExpr(p, ctx)}}`))
        .join("");
      return `\`${body}\``;
    })
    .with({ kind: "ref" }, (r) => {
      // A parametric nullary ctor (`None`) infers `Option<never>`, which won't
      // flow where a concrete `Option<C>` is expected — annotate it in place
      // (TS backend, ADR 0039), the Option/variant analogue of the empty-array
      // rule above. Gate on a 0-field ctor so plain value refs are untouched;
      // `annotateEmpty` returns null unless the recorded type is fully concrete.
      const nullaryCtor = ctx.ctorKeys.get(r.name)?.length === 0;
      const ann = nullaryCtor ? ctx.annotateEmpty?.(r) : null;
      return ann ? `(${r.name} as ${ann})` : r.name;
    })
    .with({ kind: "call" }, (c) => {
      const inner = `${genCallee(c.fn, ctx)}(${c.args.map((a) => genExpr(a, ctx)).join(", ")})`;
      // TS backend (ADR 0043): an applied parametric ctor (`Ok("")`, `Err(e)`)
      // leaves the type param its argument doesn't determine free, so tsc widens
      // it to `unknown` — in a @onrails/pattern arm that then clashes with a sibling
      // arm. Cast the call to its resolved concrete type. Gated on an uppercase
      // callee (a ctor; `annotateCall` itself yields null unless the type is a
      // fully-concrete `con`, so ordinary Capitalized calls stay bare).
      const ann = c.fn.kind === "ref" && /^[A-Z]/.test(c.fn.name) ? ctx.annotateCall?.(c) : null;
      return ann ? `(${inner} as ${ann})` : inner;
    })
    .with({ kind: "lambda" }, (l) => {
      const { params, body } = collapseLambda(l);
      // TS backend: annotate each param from the lambda's inferred curried type
      // (ADR 0028), so `(x) => …` becomes `(x: A) => …` — otherwise strict tsc
      // infers `any`. `l.span` (the outer, un-collapsed lambda) carries the full
      // `A -> B -> …` type; the callback peels it per collapsed param.
      const ann = ctx.annotateParams?.(l.span, params.length);
      const anns = ann?.params ?? [];
      const ps = params.map((p, i) => {
        const g = genParam(p);
        return anns[i] ? `${g}: ${anns[i]}` : g;
      });
      // A generic binding's value lambda scopes its letters here (ADR 0032), so
      // its (now fully annotated) params can name them; every other lambda: "".
      const arrow = `${ann?.generics ?? ""}(${ps.join(", ")}) => ${genLambdaBody(body, ctx, new Set(params.flatMap(paramNames)))}`;
      // Curried type, flat JS impl: arity ≥ 2 lowers to a `_curry`-wrapped
      // function so any call grouping works (CRITIQUE §4.4). Arity 1 needs none.
      return params.length >= 2 ? `_curry(${params.length}, ${arrow})` : arrow;
    })
    // let x = v in b  →  an IIFE binding x: `((x) => b)(v)`. Non-recursive, so
    // a plain arg-application is enough; nested let-ins chain as curried IIFEs.
    .with({ kind: "letin" }, (l) => {
      const ann = ctx.annotateLetin?.(l.value);
      const param = ann ? `${l.name}: ${ann}` : l.name;
      return `((${param}) => ${genLambdaBody(l.body, ctx)})(${genExpr(l.value, ctx)})`;
    })
    // let? / let! p = v in b  →  `_Option_flatMap` / `_Result_flatMap` /
    // `_Task_andThen`((p) => b)(v). Under `flattenPipe` (TS backend) the two
    // args go in ONE grouping — `_Result_flatMap((p) => b, v)` — so tsc infers
    // `p`'s type from `v` in the all-at-once overload; the curried `f(v)` split
    // leaves `p` unconstrained (`unknown`) across the two calls. Both are
    // equivalent under `_curry`.
    .with({ kind: "letbind" }, (l) => {
      const rt = bindRuntime(l.monad);
      const f = `(${genParam(l.param)}) => ${genLambdaBody(l.body, ctx)}`;
      const v = genExpr(l.value, ctx);
      return ctx.flattenPipe ? `${rt}(${f}, ${v})` : `${rt}(${f})(${v})`;
    })
    // desugar inline: a |> f  →  f(a). Under `flattenPipe` (TS backend), a pipe
    // into a call appends the arg — `a |> f(x)` → `f(x, a)` — so tsc infers type
    // args from every argument at once; otherwise the curried `f(x)(a)`.
    .with({ kind: "pipe", fast: true }, (p) => {
      const right = p.right;
      if (right.kind !== "call") throw new Error("fast pipe rhs must be a call");
      return `${genCallee(right.fn, ctx)}(${[p.left, ...right.args].map((a) => genExpr(a, ctx)).join(", ")})`;
    })
    .with({ kind: "pipe" }, (p) =>
      ctx.flattenPipe && p.right.kind === "call"
        ? `${genCallee(p.right.fn, ctx)}(${[...p.right.args, p.left].map((a) => genExpr(a, ctx)).join(", ")})`
        : `${genCallee(p.right, ctx)}(${genExpr(p.left, ctx)})`,
    )
    .with({ kind: "do" }, (block) => {
      const [last, ...reversedInit] = block.exprs.toReversed();
      const steps = reversedInit
        .toReversed()
        .map((expr) => `${genExpr(expr, ctx)};`)
        .join(" ");
      return `(() => { ${steps} return ${genExpr(last!, ctx)}; })()`;
    })
    // Always parenthesized, so the output nests safely in any JS position.
    .with(
      { kind: "ternary" },
      (t) => `(${genExpr(t.cond, ctx)} ? ${genExpr(t.then, ctx)} : ${genExpr(t.else, ctx)})`,
    )
    // Expression-position loop wraps in an IIFE; a loop sitting directly under
    // a lambda body takes the bare-block form instead (genLambdaBody).
    .with({ kind: "loop" }, (l) => `(() => { ${genLoopBlock(l, ctx)} })()`)
    // Only reachable inside a loop-tail switch arm (checkLoops): yields a step
    // object the enclosing while-loop dispatches on.
    .with({ kind: "recur" }, (r) => `_recur(${r.args.map((a) => genExpr(a, ctx)).join(", ")})`)
    .with({ kind: "match" }, (m) => genMatch(m, ctx))
    .with({ kind: "record" }, (r) => {
      const fields = r.fields.map((f) => `${f.name}: ${genExpr(f.value, ctx)}`);
      const parts = r.spread ? [`...${genExpr(r.spread, ctx)}`, ...fields] : fields;
      return parts.length === 0 ? "{}" : `{ ${parts.join(", ")} }`;
    })
    .with(
      { kind: "field" },
      (f) => emptyNsEmit(f, ctx) ?? nsRuntimeId(f) ?? `${genMember(f.target, ctx)}.${f.name}`,
    )
    // A tuple erases to a JS array `[a, b]` (like ReScript); the type system
    // keeps it distinct from an `mochi` Array, the runtime shares the shape. TS
    // emit wraps it in `_tuple(…)` so tsc infers a tuple, not a widened array
    // (ADR 0036); the JS backend keeps the bare literal (byte-identical).
    .with({ kind: "tuple" }, (t) => {
      const elems = t.elements.map((el) => genExpr(el, ctx)).join(", ");
      return ctx.tupleHelper ? `_tuple(${elems})` : `[${elems}]`;
    })
    .with({ kind: "arr" }, (l) => {
      const parts = l.elements.map((el) =>
        el.kind === "spread" ? `...${genExpr(el.expr, ctx)}` : genExpr(el.expr, ctx),
      );
      const body = `[${parts.join(", ")}]`;
      // Empty `[]` infers `never[]` — annotate with the resolved element type
      // (TS backend) so it flows where a concrete array is expected (ADR 0035).
      const ann = l.elements.length === 0 ? ctx.annotateEmpty?.(l) : null;
      return ann ? `(${body} as ${ann})` : body;
    })
    .with({ kind: "list" }, (l) => genList(l, ctx))
    .with({ kind: "set" }, (s) => {
      // Native `Set` constructor dedupes; spreads are iterable Sets.
      const parts = s.elements.map((el) =>
        el.kind === "spread" ? `...${genExpr(el.expr, ctx)}` : genExpr(el.expr, ctx),
      );
      return `new Set([${parts.join(", ")}])`;
    })
    .with({ kind: "map" }, (m) => {
      const entries = m.entries
        .map((e) => `[${genExpr(e.key, ctx)}, ${genExpr(e.value, ctx)}]`)
        .join(", ");
      // Empty `#{}` infers `Map<unknown, unknown>` — emit `new Map<K, V>()`
      // with the resolved key/value types (TS backend, ADR 0035).
      const ann = m.entries.length === 0 ? ctx.annotateEmpty?.(m) : null;
      return ann ? `new ${ann}()` : `new Map([${entries}])`;
    })
    .exhaustive();

/** A `@{...}` literal → a lazy iterable. Spreads `yield*` another List (iterable). */
const genList = (e: ListExpr, ctx: GenCtx): string => {
  const yields = e.elements
    .map((el) =>
      el.kind === "spread"
        ? `yield* (${genExpr(el.expr, ctx)});`
        : `yield (${genExpr(el.expr, ctx)});`,
    )
    .join(" ");
  return `_list(function* () {${yields ? ` ${yields} ` : ""}})`;
};

/** A lambda parameter lowers to JS: a name, or native object destructuring. */
export const genParam = (p: LamParam): string =>
  p.kind === "name"
    ? p.name
    : p.kind === "ptuple"
      ? `[${p.names.join(", ")}]`
      : `{ ${p.fields.join(", ")} }`;

/** Every JS binding a lambda parameter introduces — a `const` may not reuse one. */
export const paramNames = (p: LamParam): readonly string[] =>
  p.kind === "name" ? [p.name] : p.kind === "ptuple" ? p.names : p.fields;

/** A lambda in callee position must be parenthesized: `((x) => ...)(arg)`. */
export const genCallee = (e: Expr, ctx: GenCtx): string =>
  e.kind === "lambda" ? `(${genExpr(e, ctx)})` : genExpr(e, ctx);

/** A record or lambda in member-target position needs parens: `({...}).x`. */
export const genMember = (e: Expr, ctx: GenCtx): string =>
  e.kind === "record" || e.kind === "lambda" ? `(${genExpr(e, ctx)})` : genExpr(e, ctx);

/**
 * A `let x = v in …` chain directly under a lambda lowers to sequential `const`s
 * in a block body rather than nested IIFEs, so the emitted JS reads like the
 * source instead of nesting one closure per binding.
 *
 * Two links cannot take that form, because a `const` would bind a name the
 * source means to read from an enclosing scope — `letin` is non-recursive and
 * shadowing keeps the outer value:
 *
 * - one whose name is already taken by the arrow's parameters or an earlier
 *   link (`let x = 1 in let x = x + 1 in x`), which is also a JS redeclaration;
 * - a non-lambda value whose name is already taken. Lambda values are locally
 *   recursive (ADR 0067), so their own and adjacent lambda names deliberately
 *   resolve to these `const` bindings.
 *
 * The chain stops at the first such link and the remainder falls back to the
 * IIFE form, which scopes both correctly. The self-reference test
 * over-approximates (`exprRefs` ignores inner shadowing), so it can only cost
 * readability, never correctness.
 */
export const genLetBlock = (e: Expr, ctx: GenCtx, bound: ReadonlySet<string>): string | null => {
  const seen = new Set(bound);
  const decls: string[] = [];
  let body = e;
  while (
    body.kind === "letin" &&
    !seen.has(body.name) &&
    (body.value.kind === "lambda" || !mentions(body.value, body.name))
  ) {
    seen.add(body.name);
    const ann = ctx.annotateLetin?.(body.value);
    decls.push(`const ${body.name}${ann ? `: ${ann}` : ""} = ${genExpr(body.value, ctx)};`);
    body = body.body;
  }
  if (decls.length === 0) return null;
  // A loop as the chain's tail stays in statement form — its param `let`s are
  // block declarations, so the names must be free like any other link's.
  if (body.kind === "loop" && body.params.every((p) => !seen.has(p.name))) {
    return `{ ${decls.join(" ")} ${genLoopBlock(body, ctx)} }`;
  }
  return `{ ${decls.join(" ")} return ${genExpr(body, ctx)}; }`;
};

/** Does `e` reference `name` anywhere? Over-approximates — shadowing is ignored. */
const mentions = (e: Expr, name: string): boolean => {
  const refs = new Set<string>();
  exprRefs(e, refs);
  return refs.has(name);
};

/**
 * A record literal as a concise arrow body must be parenthesized, else JS parses
 * `=> { ... }` as a statement block: `=> ({ x: 1 })`. `bound` — the names the
 * arrow's own parameters already occupy — opts the body into the block form
 * above; call sites that cannot name their bindings omit it.
 */
export const genLambdaBody = (e: Expr, ctx: GenCtx, bound?: ReadonlySet<string>): string =>
  (bound && e.kind === "letin" ? genLetBlock(e, ctx, bound) : null) ??
  // A loop directly under a lambda emits as the arrow's block body — no IIFE.
  // Param names clashing with the arrow's own params would be a JS
  // redeclaration, so those fall through to the IIFE form.
  (bound && e.kind === "loop" && e.params.every((p) => !bound.has(p.name))
    ? `{ ${genLoopBlock(e, ctx)} }`
    : null) ??
  (e.kind === "record" ? `(${genExpr(e, ctx)})` : genExpr(e, ctx));
