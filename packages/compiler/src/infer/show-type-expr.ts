/** Pretty-print a `TypeExpr` surface (extern annots, type stmts). Core — used by infer and the formatter (ADR 0048). */
import type { TypeExpr } from "../ast/ast";

/** A type expression; the left side of an arrow is parenthesized when it is itself an arrow ((a -> b) -> c). */
export const showTypeExpr = (te: TypeExpr): string => {
  switch (te.kind) {
    case "tname":
      // `()` in TypeExpr lowers to reserved name `unit` (ADR 0014 / 0015).
      return te.name === "unit" ? "()" : te.name;
    case "tapp": {
      const arg = (a: TypeExpr): string =>
        a.kind === "tapp" || a.kind === "tarrow" ? `(${showTypeExpr(a)})` : showTypeExpr(a);
      return `${te.ctor} ${te.args.map(arg).join(" ")}`;
    }
    case "ttuple":
      return `(${te.elems.map(showTypeExpr).join(", ")})`;
    case "tlist":
      return `[${showTypeExpr(te.elem)}]`;
    case "tqual": {
      // `Alias.Name` (nullary) or `Alias.Name a b` (applied) — same arg-parenthesization
      // rule as `tapp` (ADR 0046).
      const arg = (a: TypeExpr): string =>
        a.kind === "tapp" || a.kind === "tarrow" || (a.kind === "tqual" && a.args.length > 0)
          ? `(${showTypeExpr(a)})`
          : showTypeExpr(a);
      const head = `${te.alias}.${te.name}`;
      return te.args.length ? `${head} ${te.args.map(arg).join(" ")}` : head;
    }
  }
  const from = te.from.kind === "tarrow" ? `(${showTypeExpr(te.from)})` : showTypeExpr(te.from);
  return `${from} -> ${showTypeExpr(te.to)}`;
};
