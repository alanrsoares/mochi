import type { TypeExpr } from "./ast";

import {
  _Str_chars,
  _Str_endsWith,
  _Str_join,
  _curry,
  eq,
  length,
  map,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "./ast";
const escChar: (c: string) => string = (c: string) =>
  match(c)
    .with("\\", () => "\\\\")
    .with('"', () => '\\"')
    .with("\n", () => "\\n")
    .with("\t", () => "\\t")
    .otherwise(() => c);
const strLit: (s: string) => string = (s: string) =>
  `"${_Str_join("", map(escChar, _Str_chars(s)))}"`;
const typeArg: (te: TypeExpr) => string = (te: TypeExpr) => {
  const shown: string = showTypeExpr(te);
  return _Str_endsWith(">", shown) ? `${shown} ` : shown;
};
const joinWith: <A>(f: (a: A) => string, sep: string, tes: A[]) => string = _curry(
  3,
  <A>(f: (a: A) => string, sep: string, tes: A[]) => _Str_join(sep, map(f, tes)),
);
/**
 * The left side of an arrow is parenthesised when it is itself an arrow
 * (`(a -> b) -> c`), and so is an arrow member of a union.
 */
export const showTypeExpr: (te: TypeExpr) => string = (te: TypeExpr) =>
  match(te)
    .with({ _tag: "TyName" }, ({ name }) => (eq(name, "unit") ? "()" : name))
    .with({ _tag: "TyApp" }, ({ ctor, args }) => `${ctor}<${joinWith(typeArg, ", ", args)}>`)
    .with({ _tag: "TyTuple" }, ({ elems }) => `(${joinWith(showTypeExpr, ", ", elems)})`)
    .with({ _tag: "TyList" }, ({ elem }) => `[${showTypeExpr(elem)}]`)
    .with({ _tag: "TyQual" }, ({ alias, name, args }) =>
      ((head: string) =>
        eq(length(args), 0) ? head : `${head}<${joinWith(typeArg, ", ", args)}>`)(
        `${alias}.${name}`,
      ),
    )
    .with({ _tag: "TyLit" }, ({ value }) => strLit(value))
    .with({ _tag: "TyUnion" }, ({ members }) => joinWith(parenArrow, " | ", members))
    .with({ _tag: "TyArrow" }, ({ from, to }) => `${parenArrow(from)} -> ${showTypeExpr(to)}`)
    .exhaustive();
const parenArrow: (te: TypeExpr) => string = (te: TypeExpr) =>
  match(te)
    .with({ _tag: "TyArrow" }, () => `(${showTypeExpr(te)})`)
    .otherwise(() => showTypeExpr(te));
