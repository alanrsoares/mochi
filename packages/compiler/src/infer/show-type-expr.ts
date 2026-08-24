/** Pretty-print a `TypeExpr` surface (extern annots, type stmts). Core — used by infer and the formatter (ADR 0048). */
import type { TypeExpr } from "../ast/ast";

// `>>` is Mochi's composition token, so adjacent closing generic delimiters
// must be separated in source: `Map<string, Map<string, a> >`.
const typeArg = (te: TypeExpr): string => {
  const shown = showTypeExpr(te);
  return shown.endsWith(">") ? `${shown} ` : shown;
};

/** A type expression; the left side of an arrow is parenthesized when it is itself an arrow ((a -> b) -> c). */
export const showTypeExpr = (te: TypeExpr): string => {
  switch (te.kind) {
    case "tname":
      // `()` in TypeExpr lowers to reserved name `unit` (ADR 0014 / 0015).
      return te.name === "unit" ? "()" : te.name;
    case "tapp": {
      return `${te.ctor}<${te.args.map(typeArg).join(", ")}>`;
    }
    case "ttuple":
      return `(${te.elems.map(showTypeExpr).join(", ")})`;
    case "tlist":
      return `[${showTypeExpr(te.elem)}]`;
    case "tqual": {
      const head = `${te.alias}.${te.name}`;
      return te.args.length ? `${head}<${te.args.map(typeArg).join(", ")}>` : head;
    }
  }
  const from = te.from.kind === "tarrow" ? `(${showTypeExpr(te.from)})` : showTypeExpr(te.from);
  return `${from} -> ${showTypeExpr(te.to)}`;
};
