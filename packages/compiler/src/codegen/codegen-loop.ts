/** Codegen for `loop`/`recur` (ADR 0056): lowers to a `while (true)` + rebind, with a step-protocol escape for a recur buried inside a tail `switch`. */
import type { Expr, LoopExpr, LoopParam } from "../ast/ast";
import { type GenCtx, genExpr } from "./codegen-core";

/**
 * Does this subtree contain a `recur` belonging to the CURRENT loop? Nested
 * loops own their recurs, and checkLoops forbids crossing a lambda/letbind, so
 * both cut the walk.
 */
export const hasRecur = (e: Expr): boolean => {
  switch (e.kind) {
    case "recur":
      return true;
    case "loop":
    case "lambda":
    case "letbind":
      return false;
    case "interp":
      return e.parts.some((p) => typeof p !== "string" && hasRecur(p));
    case "call":
      return hasRecur(e.fn) || e.args.some(hasRecur);
    case "letin":
      return hasRecur(e.value) || hasRecur(e.body);
    case "pipe":
      return hasRecur(e.left) || hasRecur(e.right);
    case "do":
      return e.exprs.some(hasRecur);
    case "ternary":
      return hasRecur(e.cond) || hasRecur(e.then) || hasRecur(e.else);
    case "match":
      return (
        hasRecur(e.scrutinee) ||
        e.arms.some((a) => (a.guard ? hasRecur(a.guard) : false) || hasRecur(a.body))
      );
    case "record":
      return (e.spread ? hasRecur(e.spread) : false) || e.fields.some((f) => hasRecur(f.value));
    case "field":
      return hasRecur(e.target);
    case "tuple":
      return e.elements.some(hasRecur);
    case "arr":
    case "list":
    case "set":
      return e.elements.some((el) => hasRecur(el.expr));
    case "map":
      return e.entries.some((en) => hasRecur(en.key) || hasRecur(en.value));
    default:
      return false; // num / bool / str / ref / unit
  }
};

/**
 * Will lowering this loop body need the `_recur`/`_done` step protocol? Only
 * when a `switch` sits in tail position with a recur inside — every other tail
 * lowers to plain statements.
 */
export const loopNeedsStep = (e: Expr): boolean => {
  switch (e.kind) {
    case "ternary":
      return loopNeedsStep(e.then) || loopNeedsStep(e.else);
    case "letin":
      return loopNeedsStep(e.body);
    case "do":
      return loopNeedsStep(e.exprs.at(-1)!);
    case "match":
      return hasRecur(e);
    default:
      return false;
  }
};

/** Rebind the loop params and continue — simultaneous via array destructuring. */
const genRebind = (params: readonly LoopParam[], args: readonly string[]): string =>
  params.length === 1
    ? `${params[0]!.name} = ${args[0]!}; continue;`
    : `[${params.map((p) => p.name).join(", ")}] = [${args.join(", ")}]; continue;`;

/**
 * Rewrite the tails of a loop-tail `switch` so every arm yields a step value:
 * `recur(…)` tails already emit `_recur(…)` (see genExpr), value tails wrap in
 * `_done(…)`. Recurses through everything checkLoops treats as tail-transparent
 * (ternary branches, letin bodies, nested switch arms).
 */
const wrapStepTails = (e: Expr): Expr => {
  switch (e.kind) {
    case "recur":
      return e;
    case "ternary":
      // biome-ignore lint/suspicious/noThenProperty: mirrors the AST field; plain data, never awaited
      return { ...e, then: wrapStepTails(e.then), else: wrapStepTails(e.else) };
    case "letin":
      return { ...e, body: wrapStepTails(e.body) };
    case "do":
      return {
        ...e,
        exprs: [...e.exprs.slice(0, -1), wrapStepTails(e.exprs.at(-1)!)],
      };
    case "match":
      return { ...e, arms: e.arms.map((a) => ({ ...a, body: wrapStepTails(a.body) })) };
    default:
      return {
        kind: "call",
        fn: { kind: "ref", name: "_done", span: e.span },
        args: [e],
        span: e.span,
      };
  }
};

/**
 * Lower one loop-body tail to statements inside `while (true)`:
 * plain value → `return v;` · `recur` → rebind + `continue` · ternary →
 * `if`/`else` · letin → `const` + recurse · switch containing a recur → the
 * step protocol: the ts-pattern chain stays an expression whose arms yield
 * `_recur(…)`/`_done(…)`, and the loop dispatches on `_tag`.
 */
const genLoopTail = (e: Expr, params: readonly LoopParam[], ctx: GenCtx): string => {
  if (e.kind === "recur") {
    return genRebind(
      params,
      e.args.map((a) => genExpr(a, ctx)),
    );
  }
  if (e.kind === "ternary" && hasRecur(e)) {
    return `if (${genExpr(e.cond, ctx)}) { ${genLoopTail(e.then, params, ctx)} } else { ${genLoopTail(e.else, params, ctx)} }`;
  }
  if (e.kind === "letin" && hasRecur(e)) {
    const ann = ctx.annotateLetin?.(e.value);
    // A let-in introduces a fresh lexical scope. Keep it as a JS block instead
    // of flattening it into the loop body: consecutive `let _ = … in` effects
    // and ordinary shadow-rebinds would otherwise redeclare the same `const`.
    return `{ const ${e.name}${ann ? `: ${ann}` : ""} = ${genExpr(e.value, ctx)}; ${genLoopTail(e.body, params, ctx)} }`;
  }
  if (e.kind === "do" && hasRecur(e)) {
    const [last, ...reversedInit] = e.exprs.toReversed();
    const steps = reversedInit
      .toReversed()
      .map((expr) => `${genExpr(expr, ctx)};`)
      .join(" ");
    return `{ ${steps} ${genLoopTail(last!, params, ctx)} }`;
  }
  if (e.kind === "match" && hasRecur(e)) {
    const step = genExpr(wrapStepTails(e), ctx);
    const rebind =
      params.length === 1
        ? `${params[0]!.name} = _step.args[0];`
        : `[${params.map((p) => p.name).join(", ")}] = _step.args;`;
    return `const _step = ${step}; if (_step._tag === "recur") { ${rebind} continue; } return _step.value;`;
  }
  return `return ${genExpr(e, ctx)};`;
};

/** The statement body of a lowered loop: param `let`s + `while (true)`. */
export const genLoopBlock = (l: LoopExpr, ctx: GenCtx): string => {
  const decls = l.params
    .map((p) => {
      const ann = ctx.annotateLetin?.(p.init);
      return `let ${p.name}${ann ? `: ${ann}` : ""} = ${genExpr(p.init, ctx)};`;
    })
    .join(" ");
  return `${decls} while (true) { ${genLoopTail(l.body, l.params, ctx)} }`;
};
