import type { Expr } from "../ast/ast";
import type { Doc } from "../doc/doc";

/**
 * The formatter's own printers, so a sub-expression keeps its comments and
 * re-enters the hooks. `sourceText` returns the source between two offsets,
 * for sugar that leaves no other trace in the tree (a JSX shorthand attribute).
 */
export type FormatApi = {
  exprD: (a: Expr) => Doc;
  memberD: (a: Expr) => Doc;
  flat: (a: Doc) => string;
  strLit: (a: string) => string;
  sourceText: (a: number, b: number) => string;
};

import * as Ast from "../ast/ast";
import * as Layout from "../doc/doc";
