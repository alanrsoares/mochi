import type { TypeExpr } from "./ast";

import { _Str_chars, _Str_join, _curry, _keyOf, length, map } from "@mochi/compiler/runtime";

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
export const showTypeExpr: (te: TypeExpr) => string = (te: TypeExpr) => {
  const $match = te;
  switch ($match._tag) {
    case "TyName": {
      const { name } = $match;
      return name === "unit" ? "()" : name;
    }
    case "TyApp": {
      const { ctor, args } = $match;
      return `${ctor}<${joinWith(showTypeExpr, ", ", args)}>`;
    }
    case "TyTuple": {
      const { elems } = $match;
      return `(${joinWith(showTypeExpr, ", ", elems)})`;
    }
    case "TyList": {
      const { elem } = $match;
      return `[${showTypeExpr(elem)}]`;
    }
    case "TyQual": {
      const { alias, name, args } = $match;
      const head: string = `${alias}.${name}`;
      return length(args) === 0 ? head : `${head}<${joinWith(showTypeExpr, ", ", args)}>`;
    }
    case "TyLit": {
      const { value } = $match;
      return strLit(value);
    }
    case "TyUnion": {
      const { members } = $match;
      return joinWith(parenArrow, " | ", members);
    }
    case "TyArrow": {
      const { from, to } = $match;
      return `${parenArrow(from)} -> ${showTypeExpr(to)}`;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const parenArrow: (te: TypeExpr) => string = (te: TypeExpr) => {
  const $match = te;
  switch ($match._tag) {
    case "TyArrow": {
      return `(${showTypeExpr(te)})`;
    }
    default: {
      return showTypeExpr(te);
    }
  }
};
