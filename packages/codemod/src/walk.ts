import type { Expr, Program, Stmt } from "@mochi/compiler/ast";

/** Map every top-level statement. */
export const mapStmts = (prog: Program, fn: (stmt: Stmt) => Stmt): Program => ({
  stmts: prog.stmts.map(fn),
});

/** Map every expression subtree (statements are not entered). */
export const mapExpr = (expr: Expr, fn: (e: Expr) => Expr): Expr => {
  const walk = (e: Expr): Expr => {
    const next = fn(e);
    switch (next.kind) {
      case "num":
      case "bool":
      case "str":
      case "ref":
      case "unit":
        return next;
      case "interp":
        return { ...next, parts: next.parts.map((p) => (typeof p === "string" ? p : walk(p))) };
      case "call":
        return { ...next, fn: walk(next.fn), args: next.args.map(walk) };
      case "lambda":
        return { ...next, body: walk(next.body) };
      case "loop":
        return {
          ...next,
          params: next.params.map((lp) => ({ ...lp, init: walk(lp.init) })),
          body: walk(next.body),
        };
      case "recur":
        return { ...next, args: next.args.map(walk) };
      case "letin":
        return { ...next, value: walk(next.value), body: walk(next.body) };
      case "letbind":
        return { ...next, value: walk(next.value), body: walk(next.body) };
      case "pipe":
        return { ...next, left: walk(next.left), right: walk(next.right) };
      case "do":
        return { ...next, exprs: next.exprs.map(walk) };
      case "ternary":
        // biome-ignore lint/suspicious/noThenProperty: mirrors the AST field; plain data, never awaited
        return { ...next, cond: walk(next.cond), then: walk(next.then), else: walk(next.else) };
      case "match":
        return {
          ...next,
          scrutinee: walk(next.scrutinee),
          arms: next.arms.map((a) => ({ ...a, body: walk(a.body) })),
        };
      case "record":
        return {
          ...next,
          fields: next.fields.map((f) => ({ ...f, value: walk(f.value) })),
          spread: next.spread ? walk(next.spread) : undefined,
        };
      case "field":
        return { ...next, target: walk(next.target) };
      case "tuple":
        return { ...next, elements: next.elements.map(walk) };
      case "arr":
      case "list":
      case "set":
        return {
          ...next,
          elements: next.elements.map((el) =>
            el.kind === "spread"
              ? { ...el, expr: walk(el.expr) }
              : { kind: "expr", expr: walk(el.expr) },
          ),
        };
      case "map":
        return {
          ...next,
          entries: next.entries.map((e) => ({ key: walk(e.key), value: walk(e.value) })),
        };
    }
  };
  return walk(expr);
};

/** Map expressions inside every statement. */
export const mapProgramExprs = (prog: Program, fn: (e: Expr) => Expr): Program =>
  mapStmts(prog, (stmt) => {
    switch (stmt.kind) {
      case "let":
        return { ...stmt, value: mapExpr(stmt.value, fn) };
      case "expr":
        return { ...stmt, value: mapExpr(stmt.value, fn) };
      case "type":
      case "extern":
      case "import":
      case "error":
        return stmt;
    }
  });
