import type { Pattern } from "./ast";

import { _Str_chars, _Str_join, _curry, map } from "@mochi/compiler/runtime";

import * as Ast from "./ast";
const escChar: (c: string) => string = (c: string) =>
  ((_v) =>
    _v === "\\" ? "\\\\" : _v === '"' ? '\\"' : _v === "\n" ? "\\n" : _v === "\t" ? "\\t" : c)(c);
export const jsStringLit: (s: string) => string = (s: string) =>
  `"${_Str_join("", map(escChar, _Str_chars(s)))}"`;
export const litValue: (p: Pattern) => string = (p: Pattern) =>
  ((_v) =>
    _v._tag === "PStr"
      ? (({ value: v }) => jsStringLit(v))(_v)
      : _v._tag === "PLit"
        ? (({ raw }) => raw)(_v)
        : _v._tag === "PBool"
          ? (({ value: v }) => (v ? "true" : "false"))(_v)
          : "")(p);
