import type { TypeExpr } from "./ast";

import { _Str_chars, _Str_join, _curry, length, map } from "@mochi/compiler/runtime";

import * as Ast from "./ast";
const escChar: (c: string) => string = (c: string) =>
  ((_v) =>
    _v === "\\" ? "\\\\" : _v === '"' ? '\\"' : _v === "\n" ? "\\n" : _v === "\t" ? "\\t" : c)(c);
const strLit: (s: string) => string = (s: string) =>
  `"${_Str_join("", map(escChar, _Str_chars(s)))}"`;
const joinWith: <A>(f: (a: A) => string, sep: string, tes: A[]) => string = _curry(
  3,
  <A>(f: (a: A) => string, sep: string, tes: A[]) => _Str_join(sep, map(f, tes)),
);
/**
 * The left side of an arrow is parenthesised when it is itself an arrow
 * (`(a -> b) -> c`), and so is an arrow member of a union.
 */
export const showTypeExpr: (te: TypeExpr) => string = (te: TypeExpr) =>
  ((_v) =>
    _v._tag === "TyName"
      ? (({ name }) => (name === "unit" ? "()" : name))(_v)
      : _v._tag === "TyApp"
        ? (({ ctor, args }) => `${ctor}<${joinWith(showTypeExpr, ", ", args)}>`)(_v)
        : _v._tag === "TyTuple"
          ? (({ elems }) => `(${joinWith(showTypeExpr, ", ", elems)})`)(_v)
          : _v._tag === "TyList"
            ? (({ elem }) => `[${showTypeExpr(elem)}]`)(_v)
            : _v._tag === "TyQual"
              ? (({ alias, name, args }) =>
                  ((head: string) =>
                    length(args) === 0 ? head : `${head}<${joinWith(showTypeExpr, ", ", args)}>`)(
                    `${alias}.${name}`,
                  ))(_v)
              : _v._tag === "TyLit"
                ? (({ value }) => strLit(value))(_v)
                : _v._tag === "TyUnion"
                  ? (({ members }) => joinWith(parenArrow, " | ", members))(_v)
                  : _v._tag === "TyArrow"
                    ? (({ from, to }) => `${parenArrow(from)} -> ${showTypeExpr(to)}`)(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(te);
const parenArrow: (te: TypeExpr) => string = (te: TypeExpr) =>
  ((_v) => (_v._tag === "TyArrow" ? `(${showTypeExpr(te)})` : showTypeExpr(te)))(te);
