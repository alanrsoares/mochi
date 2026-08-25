/** Runtime-dependency analysis: which prelude builtins and libraries (`@onrails/pattern`, `_list`, …) a program's emitted JS actually needs. */
import { match } from "@onrails/pattern";
import type { Expr, Program } from "../ast/ast";
import { preludeJsDefs, runtimeDeps } from "../prelude/prelude";
import { collapseLambda, nsRuntimeId, typeExprArity } from "./codegen-core";
import { loopNeedsStep } from "./codegen-loop";
import { isListMatch } from "./codegen-match";

/**
 * Does the program need the `@onrails/pattern` import? Only if it has a match
 * that lowers to a `match()` chain. A lazy-List switch lowers to a plain IIFE
 * instead, so a program that only ever destructures Lists imports nothing.
 */
export const usesMatchLib = (e: Expr): boolean =>
  match(e)
    .withOneOf(
      [{ kind: "num" }, { kind: "bool" }, { kind: "str" }, { kind: "ref" }, { kind: "unit" }],
      () => false,
    )
    .with({ kind: "interp" }, (i) => i.parts.some((p) => typeof p !== "string" && usesMatchLib(p)))
    .with({ kind: "call" }, (c) => usesMatchLib(c.fn) || c.args.some(usesMatchLib))
    .with({ kind: "lambda" }, (l) => usesMatchLib(l.body))
    .with({ kind: "letin" }, (l) => usesMatchLib(l.value) || usesMatchLib(l.body))
    .with({ kind: "letbind" }, (l) => usesMatchLib(l.value) || usesMatchLib(l.body))
    .with(
      { kind: "loop" },
      (l) => l.params.some((p) => usesMatchLib(p.init)) || usesMatchLib(l.body),
    )
    .with({ kind: "recur" }, (r) => r.args.some(usesMatchLib))
    .with({ kind: "pipe" }, (p) => usesMatchLib(p.left) || usesMatchLib(p.right))
    .with({ kind: "do" }, (block) => block.exprs.some(usesMatchLib))
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
    .with({ kind: "arr" }, (l) => l.elements.some((el) => usesMatchLib(el.expr)))
    .with({ kind: "list" }, (l) => l.elements.some((el) => usesMatchLib(el.expr)))
    .with({ kind: "set" }, (s) => s.elements.some((el) => usesMatchLib(el.expr)))
    .with({ kind: "map" }, (m) =>
      m.entries.some((e) => usesMatchLib(e.key) || usesMatchLib(e.value)),
    )
    .exhaustive();

/**
 * Every name referenced anywhere in an expression. Coarse — it counts locally
 * shadowed uses too — but only ever consulted for prelude names, which are never
 * worth shadowing, so the over-count is harmless.
 */
export const exprRefs = (e: Expr, acc: Set<string>): void => {
  match(e)
    .withOneOf([{ kind: "num" }, { kind: "bool" }, { kind: "str" }, { kind: "unit" }], () => {})
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
      acc.add(l.monad === "Result" ? "_Result_flatMap" : "_Task_andThen");
      exprRefs(l.value, acc);
      exprRefs(l.body, acc);
    })
    .with({ kind: "loop" }, (l) => {
      // A switch in tail position with a recur lowers via the step protocol.
      if (loopNeedsStep(l.body)) {
        acc.add("_recur");
        acc.add("_done");
      }
      for (const p of l.params) exprRefs(p.init, acc);
      exprRefs(l.body, acc);
    })
    .with({ kind: "recur" }, (r) => {
      for (const a of r.args) exprRefs(a, acc);
    })
    .with({ kind: "pipe" }, (p) => {
      exprRefs(p.left, acc);
      exprRefs(p.right, acc);
    })
    .with({ kind: "do" }, (block) => {
      for (const expr of block.exprs) exprRefs(expr, acc);
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
      for (const el of l.elements) exprRefs(el.expr, acc);
    })
    .with({ kind: "list" }, (l) => {
      acc.add("_list"); // a `@{...}` literal calls the List core at runtime
      for (const el of l.elements) exprRefs(el.expr, acc);
    })
    .with({ kind: "set" }, (s) => {
      for (const el of s.elements) exprRefs(el.expr, acc);
    })
    .with({ kind: "map" }, (m) => {
      for (const e of m.entries) {
        exprRefs(e.key, acc);
        exprRefs(e.value, acc);
      }
    })
    .exhaustive();
};

/**
 * The names a program binds at module scope — anything that would shadow a
 * prelude builtin, so its runtime def must NOT be inlined (else a duplicate
 * `const` and a JS SyntaxError, e.g. a user `let hypot = …`).
 */
const boundNames = (prog: Program): Set<string> => {
  const bound = new Set<string>();
  for (const s of prog.stmts) {
    if (s.kind === "let" || s.kind === "extern") bound.add(s.name);
    else if (s.kind === "type") for (const c of s.ctors) bound.add(c.name);
    else if (s.kind === "import") {
      for (const n of s.names) bound.add(n.name);
      if (s.alias) bound.add(s.alias.name);
    }
  }
  return bound;
};

/**
 * The prelude runtime names a program needs: every builtin it references and
 * does not itself define, in prelude declaration order. Shared by the JS backend
 * (inlines the defs) and the TS backend (imports them from the typed runtime).
 */
export const collectRuntimeDeps = (prog: Program): string[] => {
  const refs = new Set<string>();
  for (const s of prog.stmts) {
    if (s.kind === "let") exprRefs(s.value, refs);
    // A multi-field constructor lowers to `_curry(...)` in genType (which
    // exprRefs never walks), so seed the dep here.
    else if (s.kind === "type" && s.ctors.some((c) => c.fields.length >= 2)) refs.add("_curry");
    // Multi-arg externs wrap the host import in `_curry` (genExtern).
    else if (s.kind === "extern" && typeExprArity(s.typeExpr) >= 2) refs.add("_curry");
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

/** The prelude runtime a program needs inlined, emitted in declaration order. */
export const preludePreamble = (prog: Program): string => {
  const defs = collectRuntimeDeps(prog).map((name) => preludeJsDefs[name]!);
  return defs.length ? `${defs.join("\n")}\n\n` : "";
};
