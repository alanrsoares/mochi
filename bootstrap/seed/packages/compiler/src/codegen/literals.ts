import type { Pattern } from "../ast/ast";

import { _Str_chars, _Str_join, _curry, map } from "@mochi/compiler/runtime";

import * as Ast from "../ast/ast";
const escChar: (c: string) => string = (c: string) =>
  ((_v) =>
    _v === "\\" ? "\\\\" : _v === '"' ? '\\"' : _v === "\n" ? "\\n" : _v === "\t" ? "\\t" : c)(c);
export const jsStringLit: (s: string) => string = (s: string) =>
  `"${_Str_join("", map(escChar, _Str_chars(s)))}"`;
export const litValue: (p: Pattern) => string = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PStr": {
      const { value: v } = $match;
      return jsStringLit(v);
    }
    case "PLit": {
      const { raw } = $match;
      return raw;
    }
    case "PBool": {
      const { value: v } = $match;
      return v ? "true" : "false";
    }
    default: {
      return "";
    }
  }
};
