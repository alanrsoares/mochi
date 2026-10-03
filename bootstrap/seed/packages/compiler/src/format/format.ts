import type {
  AliasField,
  Ctor,
  CtorField,
  Expr,
  Field,
  InterpPart,
  LamParam,
  LoopParam,
  MapEntry,
  MatchArm,
  Name,
  PatField,
  Pattern,
  SeqElem,
  Stmt,
  TypeExpr,
} from "../ast/ast";
import type { SpanAt } from "../infer/types";
import type { Doc } from "../doc/doc";
import type { FormatApi } from "./format-api";
import type { Plugin } from "../infer/infer";

export type Comment = {
  start: number;
  end: number;
  text: string;
  blankAfter: boolean;
  trailing: boolean;
};
/**
 * A plugin list's two kinds of format hook (`formatHooksFor`, ADR 0112).
 */
export type FormatHooks = {
  rewrite: ((a: Expr) => Option<Expr>)[];
  layout: ((a: Expr, b: FormatApi) => Option<Doc>)[];
};
export type Ctx = {
  leading: Map<string, Comment[]>;
  trailing: Map<string, Comment[]>;
  flatArity: Map<string, number>;
  shadowed: Set<string>;
  etaSkip: boolean;
  formatHooks: ((a: Expr) => Option<Expr>)[];
  formatDocHooks: ((a: Expr, b: FormatApi) => Option<Doc>)[];
  commentStarts: number[];
  src: string;
};
export type Anchor = { kind: string; sp: SpanAt };
/**
 * The anchors twice over: by start (`sortAnchors`) for leading comments, and
 * stably by end for trailing ones. Both lookups bisect. The linear scans they
 * replace also sliced the source once per anchor, and were most of the
 * printer's time on a large file.
 */
export type AnchorIndex = { byStart: Anchor[]; byEnd: Anchor[] };
export type Attached = { table: Ctx; tail: Comment[] };
export type StmtDoc = { doc: Doc; consumed: number };

import type { Option, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Array_concat,
  _Array_find,
  _Array_flatMap,
  _Array_get,
  _Array_prepend,
  _Array_sortBy,
  _Array_take,
  _List_concat,
  _Map_delete,
  _Map_get,
  _Map_keys,
  _Map_set,
  _Option_contains,
  _Option_isNone,
  _Option_isSome,
  _Option_unwrapOr,
  _Set_fromArray,
  _Set_has,
  _Set_union,
  _Str_chars,
  _Str_codeAt,
  _Str_fromCode,
  _Str_get,
  _Str_join,
  _Str_length,
  _Str_slice,
  _Str_split,
  _Str_startsWith,
  _Str_toNumber,
  _Str_trim,
  _curry,
  _list,
  _tuple,
  add,
  and,
  compare,
  concat,
  div,
  eq,
  filter,
  floor,
  gt,
  gte,
  length,
  lt,
  lte,
  map,
  mul,
  not,
  or,
  reduce,
  show,
  sub,
} from "@mochi/compiler/runtime";

import * as Ast from "../ast/ast";
import {
  breakParent,
  cat,
  flat,
  group,
  hardline,
  indent,
  join,
  line,
  lineSuffix,
  render,
  softline,
  txt,
  verbatim,
} from "../doc/doc";
import { skipStringLiteral } from "../lexer/str-scan";
import { showTypeExpr } from "../ast/show-type-expr";
import * as Layout from "../doc/doc";
import * as Fmt from "./format-api";
import { formatHooksFor, runFormatDocHooks, runFormatHooks } from "../extensions/extensions";
/**
 * `JSON.stringify` escaping, plus `${` — which would otherwise reopen an
 * interpolation hole on re-lex (ADR 0023), so a hole-free string round-trips
 * even when its decoded value happens to contain that sequence.
 */
const escChar: (c: string) => string = (c: string) =>
  ((_v) =>
    _v === "\\" ? "\\\\" : _v === '"' ? '\\"' : _v === "\n" ? "\\n" : _v === "\t" ? "\\t" : c)(c);
const escFrom: _Curry<[chars: string[], i: number, acc: string], string> = _curry(
  3,
  (chars: string[], i: number, acc: string) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some" && _v.value === "$" && _Option_contains("{", _Array_get(i + 1, chars))
          ? escFrom(chars, i + 2, `${acc}\\\${`)
          : _v._tag === "Some"
            ? (({ value: c }) => escFrom(chars, i + 1, `${acc}${escChar(c)}`))(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, chars)),
);
export const escStrBody: (s: string) => string = (s: string) => escFrom(_Str_chars(s), 0, "");
export const strLit: (s: string) => string = (s: string) => `"${escStrBody(s)}"`;
const WIDTH: number = 80;
const commaJoin: <A>(f: (a: A) => string, xs: A[]) => string = _curry(
  2,
  <A>(f: (a: A) => string, xs: A[]) => _Str_join(", ", map(f, xs)),
);
/**
 * `{ x }` when the field puns to its own name, else `{ label: pat }`.
 */
const patField: (f: PatField) => string = (f: PatField) =>
  ((_v) =>
    _v._tag === "PBind" && (({ name }) => eq(name, f.label))(_v)
      ? (({ name }) => f.label)(_v)
      : `${f.label}: ${pattern(f.pat)}`)(f.pat);
const restOf: (rest: Option<Pattern>) => string[] = (rest: Option<Pattern>) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some"
        ? (({ value: p }) => [`...${pattern(p)}`])(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(rest);
export const pattern: (p: Pattern) => string = (p: Pattern) =>
  ((_v) =>
    _v._tag === "PAs"
      ? (({ pat: inner, name }) => `${pattern(inner)} as ${name}`)(_v)
      : _v._tag === "PWild"
        ? "_"
        : _v._tag === "PUnit"
          ? "()"
          : _v._tag === "PBind"
            ? (({ name }) => name)(_v)
            : _v._tag === "PLit"
              ? (({ raw }) => raw)(_v)
              : _v._tag === "PBool"
                ? (({ value }) => show(value))(_v)
                : _v._tag === "PStr"
                  ? (({ value }) => strLit(value))(_v)
                  : _v._tag === "PRecord"
                    ? (({ fields }) => `{ ${commaJoin(patField, fields)} }`)(_v)
                    : _v._tag === "PTuple"
                      ? (({ elems }) => `(${commaJoin(pattern, elems)})`)(_v)
                      : _v._tag === "PCtor"
                        ? (({ ctor: ctorName, args, ns }) =>
                            ((head: string) =>
                              length(args) === 0 ? head : `${head}(${commaJoin(pattern, args)})`)(
                              ((_v) =>
                                _v._tag === "None"
                                  ? ctorName
                                  : _v._tag === "Some"
                                    ? (({ value: alias }) => `${alias}.${ctorName}`)(_v)
                                    : (() => {
                                        throw new Error("non-exhaustive match");
                                      })())(ns),
                            ))(_v)
                        : _v._tag === "PArr"
                          ? (({ elems, rest }) =>
                              `[${_Str_join(", ", _Array_concat(map(pattern, elems), restOf(rest)))}]`)(
                              _v,
                            )
                          : _v._tag === "PList"
                            ? (({ elems, rest }) =>
                                `@{${_Str_join(", ", _Array_concat(map(pattern, elems), restOf(rest)))}}`)(
                                _v,
                              )
                            : _v._tag === "POr"
                              ? (({ alts }) => _Str_join(" | ", map(pattern, alts)))(_v)
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(p);
const ctorField: (f: CtorField) => string = (f: CtorField) =>
  ((_v) =>
    _v._tag === "None"
      ? showTypeExpr(f.fieldType)
      : _v._tag === "Some"
        ? (({ value: name }) => `${name}: ${showTypeExpr(f.fieldType)}`)(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(f.name);
export const ctorText: (c: Ctor) => string = (c: Ctor) =>
  length(c.fields) === 0 ? c.name : `${c.name}(${commaJoin(ctorField, c.fields)})`;
const generics: (params: string[]) => string = (params: string[]) =>
  length(params) === 0 ? "" : `<${_Str_join(", ", params)}>`;
/**
 * `extern x : T = "mod" "name"`, or one of the host conventions
 * (`global`/`send`/`get`/`set`/`new`), which print without the module string.
 */
const conventionOf: (module: string) => Option<string> = (module: string) =>
  _Array_get(
    0,
    filter(
      (c: string) => _Str_startsWith(`mochi:${c}:`, module),
      ["global", "send", "get", "set", "new"],
    ),
  );
export const externStmt: _Curry<
  [
    name: string,
    params: string[],
    typeExpr: TypeExpr,
    module: string,
    imported: string,
    curried: boolean,
  ],
  string
> = _curry(
  6,
  (
    name: string,
    params: string[],
    typeExpr: TypeExpr,
    module: string,
    imported: string,
    curried: boolean,
  ) => {
    const head: string = `extern ${name}${generics(params)} : ${showTypeExpr(typeExpr)} = `;
    return ((_v) =>
      _v._tag === "None"
        ? `${head}${curried ? "curried " : ""}${strLit(module)} ${strLit(imported)}`
        : _v._tag === "Some"
          ? (({ value: convention }) =>
              ((first: string) =>
                ((second: string) => `${head}${convention} ${strLit(first)}${second}`)(
                  imported === "" ? "" : ` ${strLit(imported)}`,
                ))(_Str_slice(_Str_length(`mochi:${convention}:`), _Str_length(module), module)))(
              _v,
            )
          : (() => {
              throw new Error("non-exhaustive match");
            })())(conventionOf(module));
  },
);
const sepLine: Doc = cat([txt(","), line]);
/**
 * `[a, b]` / `(a, b)` — tight brackets; breaks one item per line.
 */
export const bracketed: _Curry<[open: string, close: string, items: Doc[]], Doc> = _curry(
  3,
  (open: string, close: string, items: Doc[]) =>
    length(items) === 0
      ? txt(`${open}${close}`)
      : group(
          cat([txt(open), indent(cat([softline, join(sepLine, items)])), softline, txt(close)]),
        ),
);
/**
 * `{ a: 1, b: 2 }` / `#{ k: v }` — padded braces; breaks one entry per line.
 */
export const braced: _Curry<[open: string, close: string, items: Doc[]], Doc> = _curry(
  3,
  (open: string, close: string, items: Doc[]) =>
    length(items) === 0
      ? txt(`${open}${close}`)
      : group(cat([txt(open), indent(cat([line, join(sepLine, items)])), line, txt(close)])),
);
const parenIf: _Curry<[cond: boolean, d: Doc], Doc> = _curry(2, (cond: boolean, d: Doc) =>
  cond ? cat([txt("("), d, txt(")")]) : d,
);
/**
 * A callee / operand needs parens when dropping them would reparse to a
 * different tree: a lambda or ternary binds looser than application, and a
 * nested pipe would re-associate.
 */
const loosePrefix: _Curry<[cts: Ctx, e: Expr], boolean> = _curry(2, (cts: Ctx, e: Expr) =>
  ((_v) => (_v._tag === "ETernary" ? true : _v._tag === "EPipe" ? true : printsAsLambda(cts, e)))(
    e,
  ),
);
/**
 * `LPSpanned` carries binder spans for the IDE; the printer only wants the shape.
 */
const unspan: (p: LamParam) => LamParam = (p: LamParam) =>
  ((_v) => (_v._tag === "LPSpanned" ? (({ param: inner }) => inner)(_v) : p))(p);
const exprSpan: (e: Expr) => SpanAt = (e: Expr) =>
  ((_v) =>
    _v._tag === "ENum"
      ? (({ span: sp }) => sp)(_v)
      : _v._tag === "EUnit"
        ? (({ span: sp }) => sp)(_v)
        : _v._tag === "EBool"
          ? (({ span: sp }) => sp)(_v)
          : _v._tag === "EStr"
            ? (({ span: sp }) => sp)(_v)
            : _v._tag === "ERef"
              ? (({ span: sp }) => sp)(_v)
              : _v._tag === "ECall"
                ? (({ span: sp }) => sp)(_v)
                : _v._tag === "ELambda"
                  ? (({ span: sp }) => sp)(_v)
                  : _v._tag === "ELetIn"
                    ? (({ span: sp }) => sp)(_v)
                    : _v._tag === "ELetBind"
                      ? (({ span: sp }) => sp)(_v)
                      : _v._tag === "EPipe"
                        ? (({ span: sp }) => sp)(_v)
                        : _v._tag === "EDo"
                          ? (({ span: sp }) => sp)(_v)
                          : _v._tag === "ETernary"
                            ? (({ span: sp }) => sp)(_v)
                            : _v._tag === "EMatch"
                              ? (({ span: sp }) => sp)(_v)
                              : _v._tag === "ERecord"
                                ? (({ span: sp }) => sp)(_v)
                                : _v._tag === "EField"
                                  ? (({ span: sp }) => sp)(_v)
                                  : _v._tag === "ETuple"
                                    ? (({ span: sp }) => sp)(_v)
                                    : _v._tag === "EArr"
                                      ? (({ span: sp }) => sp)(_v)
                                      : _v._tag === "EList"
                                        ? (({ span: sp }) => sp)(_v)
                                        : _v._tag === "ESet"
                                          ? (({ span: sp }) => sp)(_v)
                                          : _v._tag === "EMap"
                                            ? (({ span: sp }) => sp)(_v)
                                            : _v._tag === "ELoop"
                                              ? (({ span: sp }) => sp)(_v)
                                              : _v._tag === "ERecur"
                                                ? (({ span: sp }) => sp)(_v)
                                                : _v._tag === "EInterp"
                                                  ? (({ span: sp }) => sp)(_v)
                                                  : (() => {
                                                      throw new Error("non-exhaustive match");
                                                    })())(e);

export const noComments: Ctx = {
  leading: new Map<string, Comment[]>(),
  trailing: new Map<string, Comment[]>(),
  flatArity: new Map<string, number>(),
  shadowed: _Set_fromArray([] as string[]),
  etaSkip: false,
  formatHooks: [] as ((a: Expr) => Option<Expr>)[],
  formatDocHooks: [] as ((a: Expr, b: FormatApi) => Option<Doc>)[],
  commentStarts: [] as number[],
  src: "",
};
/**
 * A statement and its expression can carry the SAME span (`test(…)` as an
 * expression statement), and TypeScript tells them apart by node identity.
 * The kind tag restores that: without it the comment attaches once but prints
 * twice, at the statement and again at the expression.
 */
const spanKey: _Curry<[kind: string, sp: SpanAt], string> = _curry(
  2,
  (kind: string, sp: SpanAt) => `${kind}:${show(sp.start)}:${show(sp.end)}`,
);
const STMT: string = "s";
const EXPR: string = "e";
const CTOR: string = "c";
const atKey: <A, B>(table: Map<A, B[]>, key: A) => B[] = _curry(
  2,
  <A, B>(table: Map<A, B[]>, key: A) =>
    ((_v) =>
      _v._tag === "Some"
        ? (({ value: cs }) => cs)(_v)
        : _v._tag === "None"
          ? ([] as B[])
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Map_get(key, table)),
);
const pushAt: <A, B>(key: A, c: B, table: Map<A, B[]>) => Map<A, B[]> = _curry(
  3,
  <A, B>(key: A, c: B, table: Map<A, B[]>) =>
    _Map_set(key, _Array_append(c, atKey(table, key)), table),
);
/**
 * Scan every `//` / `///` comment, string-aware: a `//` inside a string
 * literal (or a `${…}` hole) is not a comment. Uses the lexer's own string
 * skipper, so the two agree exactly on where a literal ends.
 * Index of the next newline at or after `i`, or the end of source.
 */
const lineEndFrom: _Curry<[src: string, i: number], number> = _curry(2, (src: string, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? i
      : _v._tag === "Some" && _v.value === "\n"
        ? i
        : _v._tag === "Some"
          ? lineEndFrom(src, i + 1)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Str_get(i, src)),
);
/**
 * Trailing horizontal whitespace, by CHAR CODE: mochi string literals have no
 * `\r` escape (the lexer's `escChar` knows `\n` and `\t` only), so a literal
 * "\r" would be the letter `r` and this would eat the last letter of every
 * comment ending in one. Space 32, tab 9, carriage return 13.
 */
const trimEndFrom: _Curry<[s: string, n: number], string> = _curry(2, (s: string, n: number) =>
  n === 0
    ? ""
    : ((_v) =>
        _v._tag === "Some" && _v.value === 32
          ? trimEndFrom(s, n - 1)
          : _v._tag === "Some" && _v.value === 9
            ? trimEndFrom(s, n - 1)
            : _v._tag === "Some" && _v.value === 13
              ? trimEndFrom(s, n - 1)
              : _Str_slice(0, n, s))(_Str_codeAt(n - 1, s)),
);
const trimEnd: (s: string) => string = (s: string) => trimEndFrom(s, _Str_length(s));
const commentAt: _Curry<[src: string, i: number, end: number], Comment> = _curry(
  3,
  (src: string, i: number, end: number) => {
    const lineEnd: number = lineEndFrom(src, end + 1);
    return {
      start: i,
      end: end,
      text: trimEnd(_Str_slice(i, end, src)),
      blankAfter: _Str_trim(_Str_slice(end + 1, lineEnd, src)) === "",
      trailing: false,
    };
  },
);
const scanComments: _Curry<
  [src: string, i: number, lineHasToken: boolean, acc: Comment[]],
  Comment[]
> = _curry(4, (src: string, i: number, lineHasToken: boolean, acc: Comment[]) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some" && _v.value === "\n"
        ? scanComments(src, i + 1, false, acc)
        : _v._tag === "Some" && _v.value === " "
          ? scanComments(src, i + 1, lineHasToken, acc)
          : _v._tag === "Some" && _v.value === "\t"
            ? scanComments(src, i + 1, lineHasToken, acc)
            : _v._tag === "Some" && eq(_Str_codeAt(i, src), Some(13) as Option<number>)
              ? scanComments(src, i + 1, lineHasToken, acc)
              : _v._tag === "Some" && _v.value === '"'
                ? ((_v) =>
                    _v._tag === "Some"
                      ? (({ value: end }) => scanComments(src, end, true, acc))(_v)
                      : _v._tag === "None"
                        ? scanComments(src, i + 1, true, acc)
                        : (() => {
                            throw new Error("non-exhaustive match");
                          })())(skipStringLiteral(src, i))
                : _v._tag === "Some" && _v.value === "/"
                  ? eq(_Str_get(i + 1, src), Some("/") as Option<string>)
                    ? ((end: number) =>
                        ((c: Comment) =>
                          scanComments(
                            src,
                            end,
                            lineHasToken,
                            _Array_append({ ...c, trailing: lineHasToken }, acc),
                          ))(commentAt(src, i, end)))(lineEndFrom(src, i))
                    : scanComments(src, i + 1, true, acc)
                  : _v._tag === "Some"
                    ? scanComments(src, i + 1, true, acc)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(_Str_get(i, src)),
);
export const collectComments: (src: string) => Comment[] = (src: string) =>
  scanComments(src, 0, false, [] as Comment[]);
/**
 * Every span-carrying node a comment may attach to: each statement, every
 * expression under it, and — for a `type` decl — nothing more, since the
 * bootstrap `Ctor` record carries no span (the TS AST anchors those too, so a
 * comment between constructors migrates to the next statement here).
 */
const seqElemExpr: (el: SeqElem) => Expr = (el: SeqElem) =>
  ((_v) =>
    _v._tag === "SEExpr"
      ? (({ expr: e }) => e)(_v)
      : _v._tag === "SESpread"
        ? (({ expr: e }) => e)(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(el);
const exprAnchors: (e: Expr) => Anchor[] = (e: Expr) =>
  _Array_append(
    { kind: EXPR, sp: exprSpan(e) },
    ((_v) =>
      _v._tag === "ECall"
        ? (({ fn, args }) => _Array_concat(exprAnchors(fn), _Array_flatMap(exprAnchors, args)))(_v)
        : _v._tag === "ELambda"
          ? (({ params, body }) =>
              _Array_concat(
                exprAnchors(body),
                _Array_flatMap(
                  (p: LamParam) =>
                    ((_v) =>
                      _v._tag === "LPLabeled" && _v.defaultValue._tag === "Some"
                        ? (({ defaultValue: { value: d } }) => exprAnchors(d))(
                            _v as Extract<LamParam, { _tag: "LPLabeled" }> & {
                              defaultValue: Extract<
                                Extract<LamParam, { _tag: "LPLabeled" }>["defaultValue"],
                                { _tag: "Some" }
                              >;
                            },
                          )
                        : ([] as Anchor[]))(unspan(p)),
                  params,
                ),
              ))(_v)
          : _v._tag === "ELetIn"
            ? (({ value, body }) => _Array_concat(exprAnchors(value), exprAnchors(body)))(_v)
            : _v._tag === "ELetBind"
              ? (({ value, body }) => _Array_concat(exprAnchors(value), exprAnchors(body)))(_v)
              : _v._tag === "EPipe"
                ? (({ left, right }) => _Array_concat(exprAnchors(left), exprAnchors(right)))(_v)
                : _v._tag === "EDo"
                  ? (({ exprs }) => _Array_flatMap(exprAnchors, exprs))(_v)
                  : _v._tag === "ETernary"
                    ? (({ cond, thenE, elseE }) =>
                        _Array_concat(
                          exprAnchors(cond),
                          _Array_concat(exprAnchors(thenE), exprAnchors(elseE)),
                        ))(_v)
                    : _v._tag === "EMatch"
                      ? (({ scrutinee, arms }) =>
                          _Array_concat(
                            exprAnchors(scrutinee),
                            _Array_flatMap(
                              (a: MatchArm) =>
                                _Array_concat(
                                  ((_v) =>
                                    _v._tag === "Some"
                                      ? (({ value: g }) => exprAnchors(g))(_v)
                                      : _v._tag === "None"
                                        ? ([] as Anchor[])
                                        : (() => {
                                            throw new Error("non-exhaustive match");
                                          })())(a.guard),
                                  exprAnchors(a.body),
                                ),
                              arms,
                            ),
                          ))(_v)
                      : _v._tag === "ERecord"
                        ? (({ fields, spread }) =>
                            _Array_concat(
                              ((_v) =>
                                _v._tag === "Some"
                                  ? (({ value: sp }) => exprAnchors(sp))(_v)
                                  : _v._tag === "None"
                                    ? ([] as Anchor[])
                                    : (() => {
                                        throw new Error("non-exhaustive match");
                                      })())(spread),
                              _Array_flatMap((f: Field) => exprAnchors(f.value), fields),
                            ))(_v)
                        : _v._tag === "EField"
                          ? (({ target }) => exprAnchors(target))(_v)
                          : _v._tag === "ELoop"
                            ? (({ params, body }) =>
                                _Array_concat(
                                  _Array_flatMap((prm: LoopParam) => exprAnchors(prm.init), params),
                                  exprAnchors(body),
                                ))(_v)
                            : _v._tag === "ERecur"
                              ? (({ args }) => _Array_flatMap(exprAnchors, args))(_v)
                              : _v._tag === "ETuple"
                                ? (({ elements }) => _Array_flatMap(exprAnchors, elements))(_v)
                                : _v._tag === "EArr"
                                  ? (({ elements }) =>
                                      _Array_flatMap(
                                        (el: SeqElem) => exprAnchors(seqElemExpr(el)),
                                        elements,
                                      ))(_v)
                                  : _v._tag === "EList"
                                    ? (({ elements }) =>
                                        _Array_flatMap(
                                          (el: SeqElem) => exprAnchors(seqElemExpr(el)),
                                          elements,
                                        ))(_v)
                                    : _v._tag === "ESet"
                                      ? (({ elements }) =>
                                          _Array_flatMap(
                                            (el: SeqElem) => exprAnchors(seqElemExpr(el)),
                                            elements,
                                          ))(_v)
                                      : _v._tag === "EMap"
                                        ? (({ entries }) =>
                                            _Array_flatMap(
                                              (en: MapEntry) =>
                                                _Array_concat(
                                                  exprAnchors(en.key),
                                                  exprAnchors(en.value),
                                                ),
                                              entries,
                                            ))(_v)
                                        : _v._tag === "EInterp"
                                          ? (({ parts }) =>
                                              _Array_flatMap(
                                                (prt: InterpPart) =>
                                                  ((_v) =>
                                                    _v._tag === "IPLit"
                                                      ? ([] as Anchor[])
                                                      : _v._tag === "IPExpr"
                                                        ? (({ expr: ex }) => exprAnchors(ex))(_v)
                                                        : (() => {
                                                            throw new Error("non-exhaustive match");
                                                          })())(prt),
                                                parts,
                                              ))(_v)
                                          : ([] as Anchor[]))(e),
  );
/**
 * Sorted so the tightest enclosing anchor wins: by start ascending, then by
 * end DESCENDING, which puts the outermost node first among equal starts.
 * Sorted by start ascending, then end DESCENDING so the outermost node comes
 * first among anchors that share a start. One numeric key encodes both, which
 * lets the native sort do the work: hand-rolled sorts here were quadratic
 * (`Array.append` copies), and cost 12 seconds on a 1k-line file.
 */
const SPAN_SCALE: number = 10000000;
const anchorKey: <A, B>(a: { sp: { start: number; end: number } & A } & B) => number = <A, B>(
  a: { sp: { start: number; end: number } & A } & B,
) => a.sp.start * SPAN_SCALE - a.sp.end;
/**
 * `sortBy` is stable, so a statement and its own expression — same span, and
 * therefore the same key — keep collection order, statement first. That order
 * is what decides which of the two a leading comment attaches to.
 */
const sortAnchors: (a: Anchor[]) => Anchor[] = _Array_sortBy(anchorKey);

const anchorIndex: (sorted: Anchor[]) => AnchorIndex = (sorted: Anchor[]) => ({
  byStart: sorted,
  byEnd: _Array_sortBy((a: Anchor) => a.sp.end, sorted),
});
/**
 * The first index in `[lo, hi)` whose anchor has `key(a) >= target`, for a
 * `key` that `anchors` is sorted by; `hi` when there is none.
 */
const lowerBound: _Curry<
  [anchors: Anchor[], key: (a: Anchor) => number, target: number, lo: number, hi: number],
  number
> = _curry(
  5,
  (anchors: Anchor[], key: (a: Anchor) => number, target: number, lo: number, hi: number) =>
    lo >= hi
      ? lo
      : ((mid: number) =>
          ((_v) =>
            _v._tag === "Some" && (({ value: a }) => key(a) < target)(_v)
              ? (({ value: a }) => lowerBound(anchors, key, target, mid + 1, hi))(_v)
              : lowerBound(anchors, key, target, lo, mid))(_Array_get(mid, anchors)))(
          floor((lo + hi) / 2),
        ),
);
const startOf: (a: Anchor) => number = (a: Anchor) => a.sp.start;
const endOf: (a: Anchor) => number = (a: Anchor) => a.sp.end;
/**
 * Where the line holding offset `i` starts.
 */
const lineStartOf: _Curry<[src: string, i: number], number> = _curry(2, (src: string, i: number) =>
  i <= 0 ? 0 : _Option_contains("\n", _Str_get(i - 1, src)) ? i : lineStartOf(src, i - 1),
);
/**
 * The node a trailing comment most tightly follows ON ITS OWN LINE: the
 * largest `end` at or before the comment's start, with no newline between.
 * Among anchors sharing that end, the first in `byStart` order wins; the
 * stable sort keeps that order within `byEnd`.
 */
const trailedBy: _Curry<[idx: AnchorIndex, c: Comment, src: string], Option<Anchor>> = _curry(
  3,
  (idx: AnchorIndex, c: Comment, src: string) => {
    const n: number = length(idx.byEnd);
    const past: number = lowerBound(idx.byEnd, endOf, c.start + 1, 0, n);
    return ((_v) =>
      _v._tag === "Some" && (({ value: last }) => last.sp.end >= lineStartOf(src, c.start))(_v)
        ? (({ value: last }) =>
            _Array_get(lowerBound(idx.byEnd, endOf, last.sp.end, 0, n), idx.byEnd))(_v)
        : (None as Option<Anchor>))(_Array_get(past - 1, idx.byEnd));
  },
);
/**
 * The node an own-line comment most tightly precedes: the first anchor
 * starting at or after the comment ends (the sort puts outermost first).
 */
const leadTarget: _Curry<[idx: AnchorIndex, c: Comment], Option<Anchor>> = _curry(
  2,
  (idx: AnchorIndex, c: Comment) =>
    _Array_get(lowerBound(idx.byStart, startOf, c.end, 0, length(idx.byStart)), idx.byStart),
);

/**
 * `None` when the comment has no anchor at all (it sits past the last node) —
 * the program printer emits those after the final statement.
 */
const attachOne: _Curry<
  [idx: AnchorIndex, src: string, c: Comment, tbl: Ctx],
  Option<Ctx>
> = _curry(4, (idx: AnchorIndex, src: string, c: Comment, tbl: Ctx) => {
  const trailed: Option<Anchor> = c.trailing ? trailedBy(idx, c, src) : (None as Option<Anchor>);
  return ((_v) =>
    _v._tag === "Some"
      ? (({ value: a }) =>
          Some({
            ...tbl,
            trailing: pushAt(spanKey(a.kind, a.sp), c, tbl.trailing),
          }) as Option<Ctx>)(_v)
      : _v._tag === "None"
        ? ((_v) =>
            _v._tag === "None"
              ? (None as Option<Ctx>)
              : _v._tag === "Some"
                ? (({ value: a }) =>
                    Some({
                      ...tbl,
                      leading: pushAt(spanKey(a.kind, a.sp), c, tbl.leading),
                    }) as Option<Ctx>)(_v)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(leadTarget(idx, c))
        : (() => {
            throw new Error("non-exhaustive match");
          })())(trailed);
});
const attachFrom: _Curry<
  [comments: Comment[], i: number, idx: AnchorIndex, src: string, acc: Attached],
  Attached
> = _curry(5, (comments: Comment[], i: number, idx: AnchorIndex, src: string, acc: Attached) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some"
        ? (({ value: c }) =>
            attachFrom(
              comments,
              i + 1,
              idx,
              src,
              ((_v) =>
                _v._tag === "Some"
                  ? (({ value: table }) => ({ table: table, tail: acc.tail }))(_v)
                  : _v._tag === "None"
                    ? { table: acc.table, tail: _Array_append(c, acc.tail) }
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(attachOne(idx, src, c, acc.table)),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, comments)),
);
/**
 * Build the table for one expression: scan the source, anchor every node.
 */
export const commentsForExpr: _Curry<[src: string, e: Expr], Ctx> = _curry(
  2,
  (src: string, e: Expr) =>
    attachFrom(collectComments(src), 0, anchorIndex(sortAnchors(exprAnchors(e))), src, {
      table: noComments,
      tail: [] as Comment[],
    }).table,
);
/**
 * Leading comment lines for a node: each on its own line, with a blank line
 * kept after any comment the source separated from what follows.
 */
const leadingDocs: _Curry<[cts: Ctx, kind: string, sp: SpanAt], Doc[]> = _curry(
  3,
  (cts: Ctx, kind: string, sp: SpanAt) =>
    _Array_flatMap(
      (c: Comment) => (c.blankAfter ? [txt(c.text), hardline, hardline] : [txt(c.text), hardline]),
      atKey(cts.leading, spanKey(kind, sp)),
    ),
);
/**
 * A trailing comment prints ` // text` after the node, then `breakParent` so
 * whatever follows lands on a new line (otherwise it would be commented out)
 * without emitting a newline here — the enclosing group supplies it.
 */
const trailingDocs: _Curry<[cts: Ctx, kind: string, sp: SpanAt], Doc[]> = _curry(
  3,
  (cts: Ctx, kind: string, sp: SpanAt) =>
    _Array_flatMap(
      (c: Comment) => [lineSuffix(txt(` ${c.text}`)), breakParent],
      atKey(cts.trailing, spanKey(kind, sp)),
    ),
);
const hasLead: _Curry<[cts: Ctx, kind: string, sp: SpanAt], boolean> = _curry(
  3,
  (cts: Ctx, kind: string, sp: SpanAt) => length(atKey(cts.leading, spanKey(kind, sp))) > 0,
);
const withComments: _Curry<[cts: Ctx, kind: string, sp: SpanAt, doc: Doc], Doc> = _curry(
  4,
  (cts: Ctx, kind: string, sp: SpanAt, doc: Doc) => {
    const lead: Doc[] = leadingDocs(cts, kind, sp);
    const trail: Doc[] = trailingDocs(cts, kind, sp);
    return and(length(lead) === 0, length(trail) === 0) ? doc : cat([...lead, doc, ...trail]);
  },
);
import { namespaceRuntime } from "../prelude/prelude.gen.mjs";
import { preludeJsDefs } from "../prelude/prelude.gen.mjs";
/**
 * Digits of the leading `_curry(N,` in an emitted definition, or None.
 */
const curryArityFrom: _Curry<[def: string, i: number, acc: string], string> = _curry(
  3,
  (def: string, i: number, acc: string) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some"
          ? (({ value: code }) =>
              and(code >= 48, code <= 57)
                ? curryArityFrom(def, i + 1, `${acc}${_Str_fromCode(code)}`)
                : acc)(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Str_codeAt(i, def)),
);
/**
 * Count the parameters of a bare `const name = (a, b) => …` definition.
 */
const commaCountFrom: _Curry<[s: string, i: number, acc: number], number> = _curry(
  3,
  (s: string, i: number, acc: number) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some" && _v.value === ","
          ? commaCountFrom(s, i + 1, acc + 1)
          : _v._tag === "Some"
            ? commaCountFrom(s, i + 1, acc)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Str_get(i, s)),
);
const indexOfFrom: _Curry<[needle: string, s: string, i: number], number> = _curry(
  3,
  (needle: string, s: string, i: number) =>
    i + _Str_length(needle) > _Str_length(s)
      ? -1
      : eq(_Str_slice(i, i + _Str_length(needle), s), needle)
        ? i
        : indexOfFrom(needle, s, i + 1),
);
/**
 * The emitted arity of one runtime definition: `_curry(N, …)` states it, a
 * bare `(a, b) => …` counts its outer params, anything else (a value like
 * `pi`, a nullary ctor) is 0. Mirrors `arityOfDef` in prelude.ts.
 */
const arityOfDef: (def: string) => number = (def: string) => {
  const curried: number = indexOfFrom("_curry(", def, 0);
  return curried >= 0
    ? ((digits: string) =>
        _Str_length(digits) === 0 ? 0 : _Option_unwrapOr(0, _Str_toNumber(digits)))(
        curryArityFrom(def, curried + 7, ""),
      )
    : ((open: number) =>
        open < 0
          ? 0
          : ((close: number) =>
              close < 0
                ? 0
                : ((params: string) =>
                    _Str_length(params) === 0 ? 0 : commaCountFrom(params, 0, 1))(
                    _Str_trim(_Str_slice(open + 3, close, def)),
                  ))(indexOfFrom(") =>", def, open)))(indexOfFrom("= (", def, 0));
};
const runtimeArityOf: (jsId: string) => Option<number> = (jsId: string) =>
  ((_v) =>
    _v._tag === "None"
      ? (None as Option<number>)
      : _v._tag === "Some"
        ? (({ value: def }) =>
            ((n: number) => (n >= 2 ? (Some(n) as Option<number>) : (None as Option<number>)))(
              arityOfDef(def),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Map_get(jsId, preludeJsDefs));
/**
 * `Array.map` -> its runtime's flat arity, or None when the namespace is
 * shadowed by a local binding or the member is unknown.
 */
const namespaceArity: _Curry<
  [shadowed: Set<string>, target: Expr, member: string],
  Option<number>
> = _curry(3, (shadowed: Set<string>, target: Expr, member: string) =>
  ((_v) =>
    _v._tag === "ERef"
      ? (({ name: nsName }) =>
          _Set_has(nsName, shadowed)
            ? (None as Option<number>)
            : ((_v) =>
                _v._tag === "None"
                  ? (None as Option<number>)
                  : _v._tag === "Some"
                    ? (({ value: members }) =>
                        ((_v) =>
                          _v._tag === "None"
                            ? (None as Option<number>)
                            : _v._tag === "Some"
                              ? (({ value: jsId }) => runtimeArityOf(jsId))(_v)
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(_Map_get(member, members)))(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(_Map_get(nsName, namespaceRuntime)))(_v)
      : (None as Option<number>))(target),
);
/**
 * Params codegen collapses into ONE flat JS function — `x => y => e` and
 * `(x, y) => e` alike.
 */
const labeledCount: (params: LamParam[]) => number = (params: LamParam[]) =>
  length(
    filter((p: LamParam) => ((_v) => (_v._tag === "LPLabeled" ? true : false))(unspan(p)), params),
  );
/**
 * A trailing labeled group folds into ONE record parameter (ADR 0098 §2).
 */
const jsArity: (params: LamParam[]) => number = (params: LamParam[]) => {
  const labs: number = labeledCount(params);
  return length(params) - labs + (labs > 0 ? 1 : 0);
};
const collapsedArity: (e: Expr) => number = (e: Expr) =>
  ((_v) =>
    _v._tag === "ELambda" ? (({ params, body }) => jsArity(params) + collapsedArity(body))(_v) : 0)(
    e,
  );
/**
 * Every name a pattern binds.
 */
const patNames: (p: Pattern) => string[] = (p: Pattern) =>
  ((_v) =>
    _v._tag === "PBind"
      ? (({ name }) => [name])(_v)
      : _v._tag === "PAs"
        ? (({ pat: inner, name }) => _Array_append(name, patNames(inner)))(_v)
        : _v._tag === "PTuple"
          ? (({ elems }) => _Array_flatMap(patNames, elems))(_v)
          : _v._tag === "PRecord"
            ? (({ fields }) => _Array_flatMap((f: PatField) => patNames(f.pat), fields))(_v)
            : _v._tag === "PCtor"
              ? (({ args }) => _Array_flatMap(patNames, args))(_v)
              : _v._tag === "PArr"
                ? (({ elems, rest }) =>
                    _Array_concat(
                      _Array_flatMap(patNames, elems),
                      ((_v) =>
                        _v._tag === "Some"
                          ? (({ value: r }) => patNames(r))(_v)
                          : _v._tag === "None"
                            ? ([] as string[])
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(rest),
                    ))(_v)
                : _v._tag === "PList"
                  ? (({ elems, rest }) =>
                      _Array_concat(
                        _Array_flatMap(patNames, elems),
                        ((_v) =>
                          _v._tag === "Some"
                            ? (({ value: r }) => patNames(r))(_v)
                            : _v._tag === "None"
                              ? ([] as string[])
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(rest),
                      ))(_v)
                  : _v._tag === "POr"
                    ? (({ alts }) => _Array_flatMap(patNames, alts))(_v)
                    : ([] as string[]))(p);
const paramNames: (p: LamParam) => string[] = (p: LamParam) =>
  ((_v) =>
    _v._tag === "LPName"
      ? (({ name }) => [name])(_v)
      : _v._tag === "LPLabeled"
        ? (({ name }) => [name])(_v)
        : _v._tag === "LPTuple"
          ? (({ names }) => names)(_v)
          : _v._tag === "LPRecord"
            ? (({ fields }) => fields)(_v)
            : ([] as string[]))(unspan(p));
/**
 * Every name the file binds anywhere OTHER than a top-level `let` — the
 * over-approximation that guards against regrouping a shadowed callable.
 */
const innerNames: (e: Expr) => string[] = (e: Expr) =>
  ((_v) =>
    _v._tag === "ELambda"
      ? (({ params, body }) =>
          _Array_concat(
            _Array_flatMap(paramNames, params),
            _Array_concat(
              innerNames(body),
              _Array_flatMap(
                (p: LamParam) =>
                  ((_v) =>
                    _v._tag === "LPLabeled" && _v.defaultValue._tag === "Some"
                      ? (({ defaultValue: { value: d } }) => innerNames(d))(
                          _v as Extract<LamParam, { _tag: "LPLabeled" }> & {
                            defaultValue: Extract<
                              Extract<LamParam, { _tag: "LPLabeled" }>["defaultValue"],
                              { _tag: "Some" }
                            >;
                          },
                        )
                      : ([] as string[]))(unspan(p)),
                params,
              ),
            ),
          ))(_v)
      : _v._tag === "ELetIn"
        ? (({ name, value, body }) =>
            _Array_append(name, _Array_concat(innerNames(value), innerNames(body))))(_v)
        : _v._tag === "ELetBind"
          ? (({ param, value, body }) =>
              _Array_concat(paramNames(param), _Array_concat(innerNames(value), innerNames(body))))(
              _v,
            )
          : _v._tag === "EMatch"
            ? (({ scrutinee, arms }) =>
                _Array_concat(
                  innerNames(scrutinee),
                  _Array_flatMap(
                    (a: MatchArm) =>
                      _Array_concat(
                        patNames(a.pattern),
                        _Array_concat(
                          ((_v) =>
                            _v._tag === "Some"
                              ? (({ value: g }) => innerNames(g))(_v)
                              : _v._tag === "None"
                                ? ([] as string[])
                                : (() => {
                                    throw new Error("non-exhaustive match");
                                  })())(a.guard),
                          innerNames(a.body),
                        ),
                      ),
                    arms,
                  ),
                ))(_v)
            : _v._tag === "ELoop"
              ? (({ params, body }) =>
                  _Array_concat(
                    map((p: LoopParam) => p.name, params),
                    _Array_concat(
                      _Array_flatMap((p: LoopParam) => innerNames(p.init), params),
                      innerNames(body),
                    ),
                  ))(_v)
              : _v._tag === "ECall"
                ? (({ fn, args }) =>
                    _Array_concat(innerNames(fn), _Array_flatMap(innerNames, args)))(_v)
                : _v._tag === "EPipe"
                  ? (({ left: l, right: r }) => _Array_concat(innerNames(l), innerNames(r)))(_v)
                  : _v._tag === "EDo"
                    ? (({ exprs }) => _Array_flatMap(innerNames, exprs))(_v)
                    : _v._tag === "ETernary"
                      ? (({ cond: c, thenE: t, elseE: f }) =>
                          _Array_concat(
                            innerNames(c),
                            _Array_concat(innerNames(t), innerNames(f)),
                          ))(_v)
                      : _v._tag === "ERecord"
                        ? (({ fields, spread }) =>
                            _Array_concat(
                              ((_v) =>
                                _v._tag === "Some"
                                  ? (({ value: s }) => innerNames(s))(_v)
                                  : _v._tag === "None"
                                    ? ([] as string[])
                                    : (() => {
                                        throw new Error("non-exhaustive match");
                                      })())(spread),
                              _Array_flatMap((f: Field) => innerNames(f.value), fields),
                            ))(_v)
                        : _v._tag === "EField"
                          ? (({ target }) => innerNames(target))(_v)
                          : _v._tag === "ETuple"
                            ? (({ elements: els }) => _Array_flatMap(innerNames, els))(_v)
                            : _v._tag === "EArr"
                              ? (({ elements: els }) =>
                                  _Array_flatMap(
                                    (el: SeqElem) => innerNames(seqElemExpr(el)),
                                    els,
                                  ))(_v)
                              : _v._tag === "EList"
                                ? (({ elements: els }) =>
                                    _Array_flatMap(
                                      (el: SeqElem) => innerNames(seqElemExpr(el)),
                                      els,
                                    ))(_v)
                                : _v._tag === "ESet"
                                  ? (({ elements: els }) =>
                                      _Array_flatMap(
                                        (el: SeqElem) => innerNames(seqElemExpr(el)),
                                        els,
                                      ))(_v)
                                  : _v._tag === "EMap"
                                    ? (({ entries }) =>
                                        _Array_flatMap(
                                          (en: MapEntry) =>
                                            _Array_concat(innerNames(en.key), innerNames(en.value)),
                                          entries,
                                        ))(_v)
                                    : _v._tag === "ERecur"
                                      ? (({ args }) => _Array_flatMap(innerNames, args))(_v)
                                      : _v._tag === "EInterp"
                                        ? (({ parts }) =>
                                            _Array_flatMap(
                                              (p: InterpPart) =>
                                                ((_v) =>
                                                  _v._tag === "IPLit"
                                                    ? ([] as string[])
                                                    : _v._tag === "IPExpr"
                                                      ? (({ expr: ex }) => innerNames(ex))(_v)
                                                      : (() => {
                                                          throw new Error("non-exhaustive match");
                                                        })())(p),
                                              parts,
                                            ))(_v)
                                        : ([] as string[]))(e);
const stmtInnerNames: (s: Stmt) => string[] = (s: Stmt) =>
  ((_v) =>
    _v._tag === "SLet"
      ? (({ value }) => innerNames(value))(_v)
      : _v._tag === "SExpr"
        ? (({ value }) => innerNames(value))(_v)
        : _v._tag === "SImport"
          ? (({ names }) => map((n: Name) => n.name, names))(_v)
          : _v._tag === "SImportNs"
            ? (({ alias }) => [alias.name])(_v)
            : ([] as string[]))(s);
const topLevelNames: (stmts: Stmt[]) => string[] = (stmts: Stmt[]) =>
  _Array_flatMap(
    (s: Stmt) =>
      ((_v) =>
        _v._tag === "SLet"
          ? (({ name }) => [name])(_v)
          : _v._tag === "SExtern"
            ? (({ name }) => [name])(_v)
            : ([] as string[]))(s),
    stmts,
  );
/**
 * Prelude builtins first — their arity is fixed by the emitted runtime — then
 * top-level lambda bindings, which shadow the prelude entry either way: with
 * their own arity, or with nothing when the binding is a value. An extern's
 * host arity is a seam fact the printer must not guess at.
 */
const preludeArity: (innerBound: Set<string>) => Map<string, number> = (innerBound: Set<string>) =>
  reduce(
    _curry(2, (acc: Map<string, number>, name: string) =>
      _Set_has(name, innerBound)
        ? acc
        : ((_v) =>
            _v._tag === "Some"
              ? (({ value: n }) => _Map_set(name, n, acc))(_v)
              : _v._tag === "None"
                ? acc
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(runtimeArityOf(name)),
    ),
    new Map<string, number>(),
    _Map_keys(preludeJsDefs),
  );
const withLetArities: _Curry<
  [stmts: Stmt[], innerBound: Set<string>, base: Map<string, number>],
  Map<string, number>
> = _curry(3, (stmts: Stmt[], innerBound: Set<string>, base: Map<string, number>) =>
  reduce(
    _curry(2, (acc: Map<string, number>, s: Stmt) =>
      ((_v) =>
        _v._tag === "SLet"
          ? (({ name, value }) =>
              _Set_has(name, innerBound)
                ? _Map_delete(name, acc)
                : ((n: number) => (n >= 2 ? _Map_set(name, n, acc) : _Map_delete(name, acc)))(
                    collapsedArity(value),
                  ))(_v)
          : _v._tag === "SExtern"
            ? (({ name }) => _Map_delete(name, acc))(_v)
            : acc)(s),
    ),
    base,
    stmts,
  ),
);
const buildFlatArity: _Curry<
  [stmts: Stmt[], innerBound: Set<string>],
  Map<string, number>
> = _curry(2, (stmts: Stmt[], innerBound: Set<string>) =>
  withLetArities(stmts, innerBound, preludeArity(innerBound)),
);
/**
 * Values whose evaluation is observationally the same once or per call —
 * lifting one out of a lambda cannot change how often it runs.
 */
const isInert: (e: Expr) => boolean = (e: Expr) =>
  ((_v) =>
    _v._tag === "ERef"
      ? true
      : _v._tag === "ENum"
        ? true
        : _v._tag === "EBool"
          ? true
          : _v._tag === "EStr"
            ? true
            : _v._tag === "EUnit"
              ? true
              : _v._tag === "EField"
                ? (({ target }) => isInert(target))(_v)
                : false)(e);
const mentionsRef: _Curry<[e: Expr, name: string], boolean> = _curry(2, (e: Expr, name: string) =>
  ((_v) =>
    _v._tag === "ERef"
      ? (({ name: n }) => eq(n, name))(_v)
      : _v._tag === "EField"
        ? (({ target }) => mentionsRef(target, name))(_v)
        : false)(e),
);
/**
 * Flat arity of a ref or namespace member, or None when ADR 0065 cannot see it.
 */
const calleeArity: _Curry<[ctx: Ctx, fn: Expr], Option<number>> = _curry(2, (ctx: Ctx, fn: Expr) =>
  ((_v) =>
    _v._tag === "ERef"
      ? (({ name }) => _Map_get(name, ctx.flatArity))(_v)
      : _v._tag === "EField"
        ? (({ target, name: member }) => namespaceArity(ctx.shadowed, target, member))(_v)
        : (None as Option<number>))(fn),
);
/**
 * Prelude and namespace arity ONLY. Same-file lets are fine for ADR 0065
 * flattening, but eta of a generic user binding is tsc-unclean: ADR 0037 emits
 * partial-application overloads for concrete functions only, and `fmt` cannot
 * see schemes.
 */
const etaCalleeArity: _Curry<[ctx: Ctx, fn: Expr], Option<number>> = _curry(
  2,
  (ctx: Ctx, fn: Expr) =>
    ((_v) =>
      _v._tag === "ERef"
        ? (({ name }) =>
            _Set_has(name, ctx.shadowed) ? (None as Option<number>) : runtimeArityOf(name))(_v)
        : _v._tag === "EField"
          ? (({ target, name: member }) => namespaceArity(ctx.shadowed, target, member))(_v)
          : (None as Option<number>))(fn),
);
const PIPE_PREC: number = 5;
const FAST_PIPE_PREC: number = 21;
const NEQ_PREC: number = 8;
const CONCAT_PREC: number = 10;
const binOpInfo: (name: string) => Option<{ symbol: string; prec: number }> = (name: string) =>
  ((_v) =>
    _v === "or"
      ? (Some({ symbol: "||", prec: 7 }) as Option<{ symbol: string; prec: number }>)
      : _v === "and"
        ? (Some({ symbol: "&&", prec: 7 }) as Option<{ symbol: string; prec: number }>)
        : _v === "eq"
          ? (Some({ symbol: "==", prec: 8 }) as Option<{ symbol: string; prec: number }>)
          : _v === "lt"
            ? (Some({ symbol: "<", prec: 8 }) as Option<{ symbol: string; prec: number }>)
            : _v === "lte"
              ? (Some({ symbol: "<=", prec: 8 }) as Option<{ symbol: string; prec: number }>)
              : _v === "gt"
                ? (Some({ symbol: ">", prec: 8 }) as Option<{ symbol: string; prec: number }>)
                : _v === "gte"
                  ? (Some({ symbol: ">=", prec: 8 }) as Option<{ symbol: string; prec: number }>)
                  : _v === "concat"
                    ? (Some({ symbol: "++", prec: 10 }) as Option<{ symbol: string; prec: number }>)
                    : _v === "add"
                      ? (Some({ symbol: "+", prec: 10 }) as Option<{
                          symbol: string;
                          prec: number;
                        }>)
                      : _v === "sub"
                        ? (Some({ symbol: "-", prec: 10 }) as Option<{
                            symbol: string;
                            prec: number;
                          }>)
                        : _v === "mul"
                          ? (Some({ symbol: "*", prec: 20 }) as Option<{
                              symbol: string;
                              prec: number;
                            }>)
                          : _v === "div"
                            ? (Some({ symbol: "/", prec: 20 }) as Option<{
                                symbol: string;
                                prec: number;
                              }>)
                            : _v === "mod"
                              ? (Some({ symbol: "%", prec: 20 }) as Option<{
                                  symbol: string;
                                  prec: number;
                                }>)
                              : (None as Option<{ symbol: string; prec: number }>))(name);
const isLambdaExpr: (e: Expr) => boolean = (e: Expr) =>
  ((_v) => (_v._tag === "ELambda" ? true : false))(e);
/**
 * False when the lambda eta-contracts to a partial: it then prints as a call,
 * which needs no parens. Keeping this in step with `lambdaD` is what makes the
 * layout a fixpoint (ADR 0091).
 */
const printsAsLambda: _Curry<[cts: Ctx, e: Expr], boolean> = _curry(2, (cts: Ctx, e: Expr) =>
  ((_v) =>
    _v._tag === "ELambda"
      ? (({ params, body }) => or(cts.etaSkip, _Option_isNone(etaPartial(cts, params, body))))(_v)
      : false)(e),
);
/**
 * Forced parens for an infix operand: a lambda or ternary binds looser than
 * any operator. A pipe is NOT here — it carries a precedence of its own.
 */
const isLambdaOrTernary: _Curry<[cts: Ctx, e: Expr], boolean> = _curry(2, (cts: Ctx, e: Expr) =>
  ((_v) => (_v._tag === "ETernary" ? true : printsAsLambda(cts, e)))(e),
);
const binOpFor: _Curry<[fn: Expr, args: Expr[]], Option<{ symbol: string; prec: number }>> = _curry(
  2,
  (fn: Expr, args: Expr[]) =>
    ((_v) =>
      _v[0]._tag === "ERef" && _v[1].length === 2
        ? (([{ name }]) => binOpInfo(name))(
            _v as [Extract<[Expr, Expr[]][0], { _tag: "ERef" }>, [Expr, Expr[]][1]],
          )
        : (None as Option<{ symbol: string; prec: number }>))(_tuple(fn, args)),
);
const binOpOf: (e: Expr) => Option<{ symbol: string; prec: number }> = (e: Expr) =>
  ((_v) =>
    _v._tag === "ECall"
      ? (({ fn, args }) => binOpFor(fn, args))(_v)
      : (None as Option<{ symbol: string; prec: number }>))(e);
const unaryOpOf: (name: string) => Option<string> = (name: string) =>
  ((_v) =>
    _v === "not"
      ? (Some("!") as Option<string>)
      : _v === "negate"
        ? (Some("-") as Option<string>)
        : (None as Option<string>))(name);
const pipePrecOf: (e: Expr) => Option<number> = (e: Expr) =>
  ((_v) =>
    _v._tag === "EPipe"
      ? (({ fast }) => Some(fast ? FAST_PIPE_PREC : PIPE_PREC) as Option<number>)(_v)
      : (None as Option<number>))(e);
/**
 * `!=` desugars to `not(eq(a, b))`, and an explicit `!(a == b)` desugars to the
 * exact same shape — so folding either back to `!=` is a deliberate (lossy)
 * simplification, in the same spirit as the composition re-fold.
 */
const neqFor: _Curry<[fn: Expr, args: Expr[]], Option<[Expr, Expr]>> = _curry(
  2,
  (fn: Expr, args: Expr[]) =>
    ((_v) =>
      _v[0]._tag === "ERef" &&
      _v[0].name === "not" &&
      _v[1].length === 1 &&
      _v[1][0]._tag === "ECall" &&
      _v[1][0].fn._tag === "ERef" &&
      _v[1][0].fn.name === "eq" &&
      _v[1][0].args.length === 2
        ? (([
            ,
            [
              {
                args: [l, r],
              },
            ],
          ]) => Some(_tuple(l, r)) as Option<[Expr, Expr]>)(
            _v as [
              Extract<[Expr, Expr[]][0], { _tag: "ERef" }>,
              [
                Extract<[Expr, Expr[]][1][number], { _tag: "ECall" }> & {
                  fn: Extract<
                    Extract<[Expr, Expr[]][1][number], { _tag: "ECall" }>["fn"],
                    { _tag: "ERef" }
                  >;
                },
              ],
            ],
          )
        : (None as Option<[Expr, Expr]>))(_tuple(fn, args)),
);
const neqOperands: (e: Expr) => Option<[Expr, Expr]> = (e: Expr) =>
  ((_v) =>
    _v._tag === "ECall"
      ? (({ fn, args }) => neqFor(fn, args))(_v)
      : (None as Option<[Expr, Expr]>))(e);
const infixPrec: (e: Expr) => Option<number> = (e: Expr) =>
  ((_v) =>
    _v._tag === "Some"
      ? (({ value: p }) => Some(p) as Option<number>)(_v)
      : _v._tag === "None"
        ? ((_v) =>
            _v._tag === "Some"
              ? (({ value: info }) => Some(info.prec) as Option<number>)(_v)
              : _v._tag === "None"
                ? ((_v) =>
                    _v._tag === "Some"
                      ? (Some(NEQ_PREC) as Option<number>)
                      : _v._tag === "None"
                        ? (None as Option<number>)
                        : (() => {
                            throw new Error("non-exhaustive match");
                          })())(neqOperands(e))
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(binOpOf(e))
        : (() => {
            throw new Error("non-exhaustive match");
          })())(pipePrecOf(e));
/**
 * An operand of an infix operator. A lambda or ternary always parenthesizes;
 * otherwise precedence decides, with the right operand also parenthesizing at
 * EQUAL precedence, since every infix operator here is left-associative.
 */
const binOperandD: _Curry<[cts: Ctx, e: Expr, parentPrec: number, isRight: boolean], Doc> = _curry(
  4,
  (cts: Ctx, e: Expr, parentPrec: number, isRight: boolean) =>
    isLambdaOrTernary(cts, e)
      ? cat([txt("("), exprD(cts, e), txt(")")])
      : ((_v) =>
          _v._tag === "Some"
            ? (({ value: prec }) =>
                parenIf(isRight ? prec <= parentPrec : prec < parentPrec, exprD(cts, e)))(_v)
            : _v._tag === "None"
              ? exprD(cts, e)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(infixPrec(e)),
);
/**
 * A pipe's left operand parenthesizes when dropping the parens would reparse:
 * a looser infix (`(a ++ b)->f`), a nested pipe, or a lambda / ternary.
 */
const pipeLeftD: _Curry<[cts: Ctx, e: Expr, parentPrec: number], Doc> = _curry(
  3,
  (cts: Ctx, e: Expr, parentPrec: number) =>
    isLambdaOrTernary(cts, e)
      ? cat([txt("("), exprD(cts, e), txt(")")])
      : ((_v) =>
          _v._tag === "Some"
            ? (({ value: prec }) => parenIf(prec < parentPrec, exprD(cts, e)))(_v)
            : _v._tag === "None"
              ? exprD(cts, e)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(infixPrec(e)),
);
/**
 * `++` is left-associative (`concat(concat(a, b), c)`); flatten it like `|>` so
 * a long string build breaks one segment per line instead of overflowing.
 */
const concatSegmentsFrom: _Curry<[e: Expr, acc: Expr[]], Expr[]> = _curry(
  2,
  (e: Expr, acc: Expr[]) =>
    ((_v) =>
      _v._tag === "ECall" &&
      _v.fn._tag === "ERef" &&
      _v.fn.name === "concat" &&
      _v.args.length === 2
        ? (({ args: [l, r] }) => concatSegmentsFrom(l, _Array_prepend(r, acc)))(
            _v as Extract<Expr, { _tag: "ECall" }> & {
              fn: Extract<Extract<Expr, { _tag: "ECall" }>["fn"], { _tag: "ERef" }>;
            },
          )
        : _Array_prepend(e, acc))(e),
);
const concatD: _Curry<[cts: Ctx, l: Expr, r: Expr], Doc> = _curry(3, (cts: Ctx, l: Expr, r: Expr) =>
  ((_v) =>
    _v.length === 0
      ? txt("")
      : _v.length >= 1
        ? (([head, ...rest]) =>
            group(
              cat([
                binOperandD(cts, head, CONCAT_PREC, false),
                indent(
                  cat(
                    map(
                      (s: Expr) => cat([line, txt("++ "), binOperandD(cts, s, CONCAT_PREC, true)]),
                      rest,
                    ),
                  ),
                ),
              ]),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(concatSegmentsFrom(l, [r])),
);
const binaryD: _Curry<[cts: Ctx, fn: Expr, args: Expr[]], Option<Doc>> = _curry(
  3,
  (cts: Ctx, fn: Expr, args: Expr[]) =>
    ((_v) =>
      _v._tag === "Some"
        ? (({ value: [l, r] }) =>
            Some(
              group(
                cat([
                  binOperandD(cts, l, NEQ_PREC, false),
                  txt(" != "),
                  binOperandD(cts, r, NEQ_PREC, true),
                ]),
              ),
            ) as Option<Doc>)(_v as Extract<Option<[Expr, Expr]>, { _tag: "Some" }>)
        : _v._tag === "None"
          ? ((_v) =>
              _v._tag === "None"
                ? (None as Option<Doc>)
                : _v._tag === "Some"
                  ? (({ value: info }) =>
                      ((_v) =>
                        _v.length === 2
                          ? (([l, r]) =>
                              info.symbol === "++"
                                ? (Some(concatD(cts, l, r)) as Option<Doc>)
                                : (Some(
                                    group(
                                      cat([
                                        binOperandD(cts, l, info.prec, false),
                                        txt(` ${info.symbol} `),
                                        binOperandD(cts, r, info.prec, true),
                                      ]),
                                    ),
                                  ) as Option<Doc>))(_v)
                          : (None as Option<Doc>))(args))(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(binOpFor(fn, args))
          : (() => {
              throw new Error("non-exhaustive match");
            })())(neqFor(fn, args)),
);
/**
 * `not(x)` → `!x`, `negate(x)` → `-x`. Unary binds tighter than every infix
 * operator (its operand parses at atom level), so an operator-shaped operand
 * always needs parens regardless of precedence.
 */
const unaryD: _Curry<[cts: Ctx, fn: Expr, args: Expr[]], Option<Doc>> = _curry(
  3,
  (cts: Ctx, fn: Expr, args: Expr[]) =>
    ((_v) =>
      _v[0]._tag === "ERef" && _v[1].length === 1
        ? (([{ name }, [operand]]) =>
            ((_v) =>
              _v._tag === "None"
                ? (None as Option<Doc>)
                : _v._tag === "Some"
                  ? (({ value: symbol }) =>
                      ((forced: boolean) =>
                        Some(
                          cat([txt(symbol), parenIf(forced, exprD(cts, operand))]),
                        ) as Option<Doc>)(
                        or(
                          or(loosePrefix(cts, operand), _Option_isSome(binOpOf(operand))),
                          _Option_isSome(neqOperands(operand)),
                        ),
                      ))(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(unaryOpOf(name)))(
            _v as [Extract<[Expr, Expr[]][0], { _tag: "ERef" }>, [Expr, Expr[]][1]],
          )
        : (None as Option<Doc>))(_tuple(fn, args)),
);
/**
 * `x => f(a, x)` -> `f(a)` when that is a clean refactor (ADR 0091): `f` is a
 * prelude or namespace builtin, the eta argument saturates the last slot, the
 * prefix args are inert (so lifting them out of the lambda cannot change how
 * often they run), and `x` is free in neither `f` nor the prefix. A `$`-prefixed
 * param belongs to sections / compose, and an annotation is load-bearing.
 */
const etaPartial: _Curry<[ctx: Ctx, params: LamParam[], body: Expr], Option<Expr>> = _curry(
  3,
  (ctx: Ctx, params: LamParam[], body: Expr) =>
    ((_v) =>
      _v.length === 1
        ? (([only]) =>
            ((_v) =>
              _v._tag === "LPName" && _v.annot._tag === "None"
                ? (({ name }) =>
                    _Str_startsWith("$", name)
                      ? (None as Option<Expr>)
                      : ((_v) =>
                          _v._tag === "ECall"
                            ? ((flat: Expr) =>
                                ((_v) =>
                                  _v._tag === "ECall" && _v.origin._tag === "None"
                                    ? (({ fn, args, span: sp }) =>
                                        ((n: number) =>
                                          n === 0
                                            ? (None as Option<Expr>)
                                            : ((_v) =>
                                                _v._tag === "Some" && _v.value._tag === "ERef"
                                                  ? (({ value: { name: lastName } }) =>
                                                      !eq(lastName, name)
                                                        ? (None as Option<Expr>)
                                                        : ((prefix: Expr[]) =>
                                                            and(
                                                              and(
                                                                and(isInert(fn), allInert(prefix)),
                                                                !mentionsRef(fn, name),
                                                              ),
                                                              !anyMentions(prefix, name),
                                                            )
                                                              ? ((_v) =>
                                                                  _v._tag === "Some"
                                                                    ? (({ value: arity }) =>
                                                                        eq(n, arity)
                                                                          ? (Some(
                                                                              Ast.ECall(
                                                                                fn,
                                                                                prefix,
                                                                                None as Option<string>,
                                                                                sp,
                                                                              ),
                                                                            ) as Option<Expr>)
                                                                          : (None as Option<Expr>))(
                                                                        _v,
                                                                      )
                                                                    : _v._tag === "None"
                                                                      ? (None as Option<Expr>)
                                                                      : (() => {
                                                                          throw new Error(
                                                                            "non-exhaustive match",
                                                                          );
                                                                        })())(
                                                                  etaCalleeArity(ctx, fn),
                                                                )
                                                              : (None as Option<Expr>))(
                                                            _Array_take(n - 1, args),
                                                          ))(
                                                      _v as Extract<
                                                        Option<Expr>,
                                                        { _tag: "Some" }
                                                      > & {
                                                        value: Extract<
                                                          Extract<
                                                            Option<Expr>,
                                                            { _tag: "Some" }
                                                          >["value"],
                                                          { _tag: "ERef" }
                                                        >;
                                                      },
                                                    )
                                                  : (None as Option<Expr>))(
                                                _Array_get(n - 1, args),
                                              ))(length(args)))(
                                        _v as Extract<Expr, { _tag: "ECall" }> & {
                                          origin: Extract<
                                            Extract<Expr, { _tag: "ECall" }>["origin"],
                                            { _tag: "None" }
                                          >;
                                        },
                                      )
                                    : (None as Option<Expr>))(flat))(
                                ((_v) =>
                                  _v._tag === "Some"
                                    ? (({ value: f }) => f)(_v)
                                    : _v._tag === "None"
                                      ? body
                                      : (() => {
                                          throw new Error("non-exhaustive match");
                                        })())(flattenCallSpine(ctx, body)),
                              )
                            : (None as Option<Expr>))(body))(
                    _v as Extract<LamParam, { _tag: "LPName" }> & {
                      annot: Extract<
                        Extract<LamParam, { _tag: "LPName" }>["annot"],
                        { _tag: "None" }
                      >;
                    },
                  )
                : (None as Option<Expr>))(unspan(only)))(_v)
        : (None as Option<Expr>))(params),
);
const allInert: (args: Expr[]) => boolean = (args: Expr[]) =>
  length(filter((a: Expr) => !isInert(a), args)) === 0;
const anyMentions: _Curry<[args: Expr[], name: string], boolean> = _curry(
  2,
  (args: Expr[], name: string) => length(filter((a: Expr) => mentionsRef(a, name), args)) > 0,
);
/**
 * `f(a)(b)` -> `f(a, b)` when `f`'s flat arity is known (ADR 0065): both lower
 * to one `_curry`-wrapped flat function, so every grouping of the same
 * arguments is the same call and the flat one is canonical. Purely syntactic.
 *
 * Bails on anything it cannot see through: an unknown callee, a sugar-provenance
 * call, a nullary group (`f()(x)` passes `unit`, which merging would drop), and
 * over-application past the known arity, where the extra groups apply the RESULT.
 */
const spineGroups: _Curry<[e: Expr, acc: Expr[][]], Option<[Expr, Expr[][]]>> = _curry(
  2,
  (e: Expr, acc: Expr[][]) =>
    ((_v) =>
      _v._tag === "ECall" && _v.origin._tag === "Some"
        ? (None as Option<[Expr, Expr[][]]>)
        : _v._tag === "ECall" && _v.origin._tag === "None"
          ? (({ fn, args }) => spineGroups(fn, _Array_prepend(args, acc)))(
              _v as Extract<Expr, { _tag: "ECall" }> & {
                origin: Extract<Extract<Expr, { _tag: "ECall" }>["origin"], { _tag: "None" }>;
              },
            )
          : (Some(_tuple(e, acc)) as Option<[Expr, Expr[][]]>))(e),
);
const flattenCallSpine: _Curry<[ctx: Ctx, e: Expr], Option<Expr>> = _curry(2, (ctx: Ctx, e: Expr) =>
  ((_v) =>
    _v._tag === "None"
      ? (None as Option<Expr>)
      : _v._tag === "Some"
        ? (({ value: [head, groups] }) =>
            (([callee, allGroups]: [Expr, Expr[][]]) =>
              or(length(allGroups) < 2, anyEmptyGroup(allGroups))
                ? (None as Option<Expr>)
                : ((_v) =>
                    _v._tag === "None"
                      ? (None as Option<Expr>)
                      : _v._tag === "Some"
                        ? (({ value: arity }) =>
                            ((args: Expr[]) =>
                              or(length(args) > arity, anyUnit(args))
                                ? (None as Option<Expr>)
                                : (Some(
                                    Ast.ECall(callee, args, None as Option<string>, exprSpan(e)),
                                  ) as Option<Expr>))(_Array_flatMap((g: Expr[]) => g, allGroups)))(
                            _v,
                          )
                        : (() => {
                            throw new Error("non-exhaustive match");
                          })())(calleeArity(ctx, callee)))(
              ((_v) =>
                _v._tag === "ELambda"
                  ? (({ params, body: lbody }) =>
                      ((_v) =>
                        _v._tag === "Some" && _v.value._tag === "ECall"
                          ? (({ value: { fn: efn, args: eargs } }) =>
                              _tuple(efn, _Array_prepend(eargs, groups)))(
                              _v as Extract<Option<Expr>, { _tag: "Some" }> & {
                                value: Extract<
                                  Extract<Option<Expr>, { _tag: "Some" }>["value"],
                                  { _tag: "ECall" }
                                >;
                              },
                            )
                          : _tuple(head, groups))(etaPartial(ctx, params, lbody)))(_v)
                  : _tuple(head, groups))(head),
            ))(_v as Extract<Option<[Expr, Expr[][]]>, { _tag: "Some" }>)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(spineGroups(e, [] as Expr[][])),
);
const anyEmptyGroup: <A>(groups: A[][]) => boolean = <A>(groups: A[][]) =>
  length(filter((g: A[]) => length(g) === 0, groups)) > 0;
const anyUnit: (args: Expr[]) => boolean = (args: Expr[]) =>
  length(filter((a: Expr) => ((_v) => (_v._tag === "EUnit" ? true : false))(a), args)) > 0;
/**
 * `($s) => op($s, y)` → `(op y)` (right section); `($s) => op(x, $s)` →
 * `(x op)` (left section) — mirrors parser.mochi's section productions.
 */
const isSectionParam: (p: LamParam) => boolean = (p: LamParam) =>
  ((_v) => (_v._tag === "LPName" && _v.name === "$s" ? true : false))(unspan(p));
const isRef: _Curry<[e: Expr, name: string], boolean> = _curry(2, (e: Expr, name: string) =>
  ((_v) => (_v._tag === "ERef" ? (({ name: n }) => eq(n, name))(_v) : false))(e),
);
const sectionParts: (body: Expr) => Option<[{ symbol: string; prec: number }, Expr, Expr]> = (
  body: Expr,
) =>
  ((_v) =>
    _v._tag === "Some"
      ? (({ value: [l, r] }) =>
          Some(_tuple({ symbol: "!=", prec: NEQ_PREC }, l, r)) as Option<
            [{ symbol: string; prec: number }, Expr, Expr]
          >)(_v as Extract<Option<[Expr, Expr]>, { _tag: "Some" }>)
      : _v._tag === "None"
        ? ((_v) =>
            _v._tag === "None"
              ? (None as Option<[{ symbol: string; prec: number }, Expr, Expr]>)
              : _v._tag === "Some"
                ? (({ value: info }) =>
                    ((_v) =>
                      _v._tag === "ECall" && _v.args.length === 2
                        ? (({ args: [l, r] }) =>
                            Some(_tuple(info, l, r)) as Option<
                              [{ symbol: string; prec: number }, Expr, Expr]
                            >)(_v as Extract<Expr, { _tag: "ECall" }>)
                        : (None as Option<[{ symbol: string; prec: number }, Expr, Expr]>))(body))(
                    _v,
                  )
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(binOpOf(body))
        : (() => {
            throw new Error("non-exhaustive match");
          })())(neqOperands(body));
const sectionOf: _Curry<[cts: Ctx, params: LamParam[], body: Expr], Option<Doc>> = _curry(
  3,
  (cts: Ctx, params: LamParam[], body: Expr) =>
    ((_v) =>
      _v.length === 1
        ? (([only]) =>
            isSectionParam(only)
              ? ((_v) =>
                  _v._tag === "None"
                    ? (None as Option<Doc>)
                    : _v._tag === "Some"
                      ? (({ value: [info, l, r] }) =>
                          ((lIsParam: boolean) =>
                            ((rIsParam: boolean) =>
                              eq(lIsParam, rIsParam)
                                ? (None as Option<Doc>)
                                : lIsParam
                                  ? (Some(
                                      cat([
                                        txt(`(${info.symbol} `),
                                        binOperandD(cts, r, info.prec, true),
                                        txt(")"),
                                      ]),
                                    ) as Option<Doc>)
                                  : (Some(
                                      cat([
                                        txt("("),
                                        binOperandD(cts, l, info.prec, false),
                                        txt(` ${info.symbol})`),
                                      ]),
                                    ) as Option<Doc>))(isRef(r, "$s")))(isRef(l, "$s")))(
                          _v as Extract<
                            Option<[{ symbol: string; prec: number }, Expr, Expr]>,
                            { _tag: "Some" }
                          >,
                        )
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(sectionParts(body))
              : (None as Option<Doc>))(_v)
        : (None as Option<Doc>))(params),
);
/**
 * `($x) => g(f($x))` — the shape `>>` desugars to.
 */
const composeParts: _Curry<[params: LamParam[], body: Expr], Option<[Expr, Expr]>> = _curry(
  2,
  (params: LamParam[], body: Expr) =>
    ((_v) =>
      _v[0].length === 1 &&
      _v[1]._tag === "ECall" &&
      _v[1].args.length === 1 &&
      _v[1].args[0]._tag === "ECall" &&
      _v[1].args[0].args.length === 1
        ? (([
            [p],
            {
              fn: right,
              args: [
                {
                  fn: left,
                  args: [inner],
                },
              ],
            },
          ]) =>
            ((_v) =>
              _v._tag === "LPName" && _v.name === "$x"
                ? isRef(inner, "$x")
                  ? (Some(_tuple(left, right)) as Option<[Expr, Expr]>)
                  : (None as Option<[Expr, Expr]>)
                : (None as Option<[Expr, Expr]>))(unspan(p)))(
            _v as [
              [LamParam[], Expr][0],
              Extract<[LamParam[], Expr][1], { _tag: "ECall" }> & {
                args: [
                  Extract<
                    Extract<[LamParam[], Expr][1], { _tag: "ECall" }>["args"][number],
                    { _tag: "ECall" }
                  >,
                ];
              },
            ],
          )
        : (None as Option<[Expr, Expr]>))(_tuple(params, body)),
);
/**
 * `>>` is left-associative, so `a >> b >> c` nests to the left; flatten it.
 */
const composeSegmentsFrom: _Curry<[e: Expr, acc: Expr[]], Expr[]> = _curry(
  2,
  (e: Expr, acc: Expr[]) =>
    ((_v) =>
      _v._tag === "ELambda"
        ? (({ params, body }) =>
            ((_v) =>
              _v._tag === "Some"
                ? (({ value: [left, right] }) =>
                    composeSegmentsFrom(left, _Array_prepend(right, acc)))(
                    _v as Extract<Option<[Expr, Expr]>, { _tag: "Some" }>,
                  )
                : _v._tag === "None"
                  ? _Array_prepend(e, acc)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(composeParts(params, body)))(_v)
        : _Array_prepend(e, acc))(e),
);
/**
 * A destructuring `let (a, b) = e in body` reaches the printer as the IIFE the
 * parser desugared it to; fold it back. Kept in step with `printsAsLet`.
 */
const destructureLetD: _Curry<[cts: Ctx, fn: Expr, args: Expr[]], Option<Doc>> = _curry(
  3,
  (cts: Ctx, fn: Expr, args: Expr[]) =>
    ((_v) =>
      _v[0]._tag === "ELambda" && _v[0].params.length === 1 && _v[1].length === 1
        ? (([
            {
              params: [p],
              body: lbody,
            },
            [value],
          ]) =>
            ((_v) =>
              _v._tag === "LPName"
                ? (None as Option<Doc>)
                : (Some(letLikeD(cts, `let ${paramText(cts, p)}`, value, lbody)) as Option<Doc>))(
              unspan(p),
            ))(_v as [Extract<[Expr, Expr[]][0], { _tag: "ELambda" }>, [Expr, Expr[]][1]])
        : (None as Option<Doc>))(_tuple(fn, args)),
);
const refoldCall: _Curry<[cts: Ctx, fn: Expr, args: Expr[]], Option<Doc>> = _curry(
  3,
  (cts: Ctx, fn: Expr, args: Expr[]) =>
    ((_v) =>
      _v._tag === "Some"
        ? (({ value: d }) => Some(d) as Option<Doc>)(_v)
        : _v._tag === "None"
          ? ((_v) =>
              _v._tag === "Some"
                ? (({ value: d }) => Some(d) as Option<Doc>)(_v)
                : _v._tag === "None"
                  ? unaryD(cts, fn, args)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(binaryD(cts, fn, args))
          : (() => {
              throw new Error("non-exhaustive match");
            })())(destructureLetD(cts, fn, args)),
);
/**
 * `f(~tone="amber")` — a labeled call is lowered to a record argument tagged
 * `origin: "labeled"` (ADR 0098 §2); print the labels back.
 */
const labeledFieldD: _Curry<[cts: Ctx, f: Field], Doc> = _curry(2, (cts: Ctx, f: Field) =>
  ((_v) =>
    _v._tag === "ERef" && (({ name }) => eq(name, f.name))(_v)
      ? (({ name }) => txt(`~${f.name}`))(_v)
      : cat([txt(`~${f.name}=`), exprD(cts, f.value)]))(f.value),
);
const callArgDocs: _Curry<[cts: Ctx, args: Expr[], origin: Option<string>], Doc[]> = _curry(
  3,
  (cts: Ctx, args: Expr[], origin: Option<string>) =>
    ((_v) =>
      _v._tag === "Some" && _v.value === "labeled"
        ? ((_v) =>
            _v._tag === "Some" && _v.value._tag === "ERecord" && _v.value.spread._tag === "None"
              ? (({ value: { fields } }) =>
                  _Array_concat(
                    map((x: Expr) => exprD(cts, x), _Array_take(length(args) - 1, args)),
                    map((f: Field) => labeledFieldD(cts, f), fields),
                  ))(
                  _v as Extract<Option<Expr>, { _tag: "Some" }> & {
                    value: Extract<
                      Extract<Option<Expr>, { _tag: "Some" }>["value"],
                      { _tag: "ERecord" }
                    > & {
                      spread: Extract<
                        Extract<
                          Extract<Option<Expr>, { _tag: "Some" }>["value"],
                          { _tag: "ERecord" }
                        >["spread"],
                        { _tag: "None" }
                      >;
                    };
                  },
                )
              : map((x: Expr) => exprD(cts, x), args))(_Array_get(length(args) - 1, args))
        : map((x: Expr) => exprD(cts, x), args))(origin),
);
const labeledParamText: _Curry<
  [cts: Ctx, name: string, annot: Option<TypeExpr>, optional: boolean, defaultValue: Option<Expr>],
  string
> = _curry(
  5,
  (
    cts: Ctx,
    name: string,
    annot: Option<TypeExpr>,
    optional: boolean,
    defaultValue: Option<Expr>,
  ) => {
    const ann: string = ((_v) =>
      _v._tag === "Some"
        ? (({ value: te }) => `: ${showTypeExpr(te)}`)(_v)
        : _v._tag === "None"
          ? ""
          : (() => {
              throw new Error("non-exhaustive match");
            })())(annot);
    const def: string = ((_v) =>
      _v._tag === "Some"
        ? (({ value: d }) => ` = ${flat(exprD(cts, d))}`)(_v)
        : _v._tag === "None"
          ? ""
          : (() => {
              throw new Error("non-exhaustive match");
            })())(defaultValue);
    return `~${name}${optional ? "?" : ""}${ann}${def}`;
  },
);
const paramText: _Curry<[cts: Ctx, p: LamParam], string> = _curry(2, (cts: Ctx, p: LamParam) =>
  ((_v) =>
    _v._tag === "LPName"
      ? (({ name, annot }) =>
          ((_v) =>
            _v._tag === "Some"
              ? (({ value: te }) => `${name}: ${showTypeExpr(te)}`)(_v)
              : _v._tag === "None"
                ? name
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(annot))(_v)
      : _v._tag === "LPTuple"
        ? (({ names }) => `(${_Str_join(", ", names)})`)(_v)
        : _v._tag === "LPRecord"
          ? (({ fields }) => `{ ${_Str_join(", ", fields)} }`)(_v)
          : _v._tag === "LPLabeled"
            ? (({ name, annot, optional, defaultValue }) =>
                labeledParamText(cts, name, annot, optional, defaultValue))(_v)
            : _v._tag === "LPSpanned"
              ? ""
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(unspan(p)),
);
/**
 * A lone un-annotated name drops its parens (`x => …`); annotations and every
 * other shape keep them (`(x: number) => …`, `(a, b) => …`, `({ x }) => …`).
 */
const paramsText: _Curry<[cts: Ctx, ps: LamParam[]], string> = _curry(
  2,
  (cts: Ctx, ps: LamParam[]) =>
    ((_v) =>
      _v.length === 1
        ? (([only]) =>
            ((_v) =>
              _v._tag === "LPName" && _v.annot._tag === "None"
                ? (({ name }) => name)(
                    _v as Extract<LamParam, { _tag: "LPName" }> & {
                      annot: Extract<
                        Extract<LamParam, { _tag: "LPName" }>["annot"],
                        { _tag: "None" }
                      >;
                    },
                  )
                : `(${commaJoin((p: LamParam) => paramText(cts, p), ps)})`)(unspan(only)))(_v)
        : `(${commaJoin((p: LamParam) => paramText(cts, p), ps)})`)(ps),
);
/**
 * `"…${x}…"` (ADR 0023) — round-trip the sugar; holes render flat. The body is
 * escaped per part, so it wraps in quotes directly rather than through `strLit`.
 */
const quoted: (body: string) => string = (body: string) => concat(concat('"', body), '"');
const interpText: _Curry<[cts: Ctx, parts: InterpPart[]], string> = _curry(
  2,
  (cts: Ctx, parts: InterpPart[]) => {
    const hole: (a: Expr) => string = (ex: Expr) =>
      concat(concat(concat("$", "{"), flat(exprD(cts, ex))), "}");
    return quoted(
      _Str_join(
        "",
        map(
          (p: InterpPart) =>
            ((_v) =>
              _v._tag === "IPLit"
                ? (({ value }) => escStrBody(value))(_v)
                : _v._tag === "IPExpr"
                  ? (({ expr: ex }) => hole(ex))(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(p),
          parts,
        ),
      ),
    );
  },
);
/**
 * `let _ = a in let _ = b in result` is sequencing, not value binding — it
 * prints as `do { … }`, so the chain collapses to its expression list.
 */
const discardedFrom: _Curry<[e: Expr, acc: Expr[]], Option<Expr[]>> = _curry(
  2,
  (e: Expr, acc: Expr[]) =>
    ((_v) =>
      _v._tag === "ELetIn" && _v.name === "_"
        ? (({ value, body }) => discardedFrom(body, _Array_append(value, acc)))(_v)
        : length(acc) === 0
          ? (None as Option<Expr[]>)
          : (Some(_Array_append(e, acc)) as Option<Expr[]>))(e),
);
const discardedLetExprs: (e: Expr) => Option<Expr[]> = (e: Expr) => discardedFrom(e, [] as Expr[]);
const doBlockD: _Curry<[cts: Ctx, exprs: Expr[]], Doc> = _curry(2, (cts: Ctx, exprs: Expr[]) =>
  cat([
    txt("{"),
    indent(
      cat([
        hardline,
        join(
          cat([txt(";"), hardline]),
          map((x: Expr) => exprD(cts, x), exprs),
        ),
      ]),
    ),
    hardline,
    txt("}"),
  ]),
);
const doD: _Curry<[cts: Ctx, exprs: Expr[]], Doc> = _curry(2, (cts: Ctx, exprs: Expr[]) =>
  cat([txt("do "), doBlockD(cts, exprs)]),
);
const lambdaD: _Curry<[cts: Ctx, params: LamParam[], body: Expr], Doc> = _curry(
  3,
  (cts: Ctx, params: LamParam[], body: Expr) =>
    ((_v) =>
      _v._tag === "Some"
        ? (({ value: section }) => section)(_v)
        : _v._tag === "None"
          ? ((_v) =>
              _v._tag === "Some"
                ? (({ value: eta }) => exprD(cts, eta))(_v)
                : _v._tag === "None"
                  ? ((_v) =>
                      _v._tag === "Some"
                        ? ((_v) =>
                            _v.length === 0
                              ? txt("")
                              : _v.length >= 1
                                ? (([head, ...rest]) =>
                                    group(
                                      cat([
                                        operandD(cts, head),
                                        indent(
                                          cat(
                                            map(
                                              (s: Expr) =>
                                                cat([line, txt(">> "), operandD(cts, s)]),
                                              rest,
                                            ),
                                          ),
                                        ),
                                      ]),
                                    ))(_v)
                                : (() => {
                                    throw new Error("non-exhaustive match");
                                  })())(
                            composeSegmentsFrom(
                              Ast.ELambda(params, body, { start: 0, end: 0 }),
                              [] as Expr[],
                            ),
                          )
                        : _v._tag === "None"
                          ? plainLambdaD({ ...cts, etaSkip: isLambdaExpr(body) }, params, body)
                          : (() => {
                              throw new Error("non-exhaustive match");
                            })())(composeParts(params, body))
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(cts.etaSkip ? (None as Option<Expr>) : etaPartial(cts, params, body))
          : (() => {
              throw new Error("non-exhaustive match");
            })())(sectionOf(cts, params, body)),
);
const plainLambdaD: _Curry<[cts: Ctx, params: LamParam[], body: Expr], Doc> = _curry(
  3,
  (cts: Ctx, params: LamParam[], body: Expr) => {
    const head: Doc = txt(`${paramsText(cts, params)} =>`);
    return ((_v) =>
      _v._tag === "EDo"
        ? (({ exprs }) => cat([head, txt(" "), doBlockD(cts, exprs)]))(_v)
        : ((_v) =>
            _v._tag === "Some"
              ? (({ value: exprs }) => cat([head, txt(" "), doBlockD(cts, exprs)]))(_v)
              : _v._tag === "None"
                ? ((_v) =>
                    _v._tag === "EMatch" && !hasLead(cts, EXPR, exprSpan(body))
                      ? cat([head, txt(" "), exprD(cts, body)])
                      : group(cat([head, indent(cat([line, exprD(cts, body)]))])))(body)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(discardedLetExprs(body)))(body);
  },
);
const condD: _Curry<[cts: Ctx, c: Expr], Doc> = _curry(2, (cts: Ctx, c: Expr) =>
  ((_v) => (_v._tag === "ETernary" ? cat([txt("("), exprD(cts, c), txt(")")]) : exprD(cts, c)))(c),
);
/**
 * A commented branch drops to its own indented line, so the comment stays
 * own-line and the layout stays idempotent.
 */
const branchD: _Curry<[cts: Ctx, marker: string, e: Expr], Doc> = _curry(
  3,
  (cts: Ctx, marker: string, e: Expr) =>
    hasLead(cts, EXPR, exprSpan(e))
      ? cat([txt(marker), indent(cat([hardline, exprD(cts, e)]))])
      : cat([txt(`${marker} `), exprD(cts, e)]),
);
/**
 * Right-nested `a ? b : c ? d : e` flattens to one arm list, so a cascading
 * conditional shares a single indent instead of staircasing.
 */
const ternaryArmsFrom: _Curry<
  [e: Expr, acc: { cond: Expr; thenE: Expr }[]],
  [{ cond: Expr; thenE: Expr }[], Expr]
> = _curry(2, (e: Expr, acc: { cond: Expr; thenE: Expr }[]) =>
  ((_v) =>
    _v._tag === "ETernary"
      ? (({ cond, thenE, elseE }) =>
          ternaryArmsFrom(elseE, _Array_append({ cond: cond, thenE: thenE }, acc)))(_v)
      : _tuple(acc, e))(e),
);
const ternaryRestParts: _Curry<[cts: Ctx, arms: { cond: Expr; thenE: Expr }[], i: number], Doc[]> =
  _curry(3, (cts: Ctx, arms: { cond: Expr; thenE: Expr }[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as Doc[])
        : _v._tag === "Some"
          ? (({ value: a }) => [
              line,
              hasLead(cts, EXPR, exprSpan(a.cond))
                ? cat([txt(":"), indent(cat([hardline, condD(cts, a.cond)]))])
                : cat([txt(": "), condD(cts, a.cond)]),
              line,
              branchD(cts, "?", a.thenE),
              ...ternaryRestParts(cts, arms, i + 1),
            ])(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, arms)),
  );
/**
 * Inline when it fits; else `cond` / `? then` / `: cond` / `? then` / `: else`
 * at one indent — a flat chain, not a nested pyramid.
 */
const ternaryD: _Curry<[cts: Ctx, e: Expr], Doc> = _curry(2, (cts: Ctx, e: Expr) =>
  (([arms, elseE]: [{ cond: Expr; thenE: Expr }[], Expr]) =>
    ((_v) =>
      _v._tag === "None"
        ? txt("")
        : _v._tag === "Some"
          ? (({ value: first }) =>
              group(
                cat([
                  condD(cts, first.cond),
                  indent(
                    cat([
                      line,
                      branchD(cts, "?", first.thenE),
                      ...ternaryRestParts(cts, arms, 1),
                      line,
                      branchD(cts, ":", elseE),
                    ]),
                  ),
                ]),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(0, arms)))(ternaryArmsFrom(e, [] as { cond: Expr; thenE: Expr }[])),
);
/**
 * Does this expression PRINT as `let … in …`? A destructuring
 * `let (a, b) = v in body` reaches the formatter as the IIFE the parser
 * desugared it to, and the chain rule has to see through that or every
 * destructure in a chain adds an indent step.
 */
const printsAsLet: (e: Expr) => boolean = (e: Expr) =>
  ((_v) =>
    _v._tag === "ELetIn"
      ? _Option_isNone(discardedLetExprs(e))
      : _v._tag === "ELetBind"
        ? true
        : _v._tag === "ECall" &&
            _v.fn._tag === "ELambda" &&
            _v.fn.params.length === 1 &&
            _v.args.length === 1
          ? (({
              fn: {
                params: [p],
              },
            }) => ((_v) => (_v._tag === "LPName" ? false : true))(unspan(p)))(
              _v as Extract<Expr, { _tag: "ECall" }> & {
                fn: Extract<Extract<Expr, { _tag: "ECall" }>["fn"], { _tag: "ELambda" }>;
              },
            )
          : false)(e);
/**
 * `let x = v in body`; when it overflows, `in` stays at the end of the value
 * line. A chain of `let … in let … in …` stays left-aligned, but a terminal
 * non-let body indents under `in` so a ternary branch's payload looks bound.
 */
const letLikeD: _Curry<[cts: Ctx, head: string, value: Expr, body: Expr], Doc> = _curry(
  4,
  (cts: Ctx, head: string, value: Expr, body: Expr) => {
    const cont: Doc = printsAsLet(body)
      ? cat([line, exprD(cts, body)])
      : indent(cat([line, exprD(cts, body)]));
    return group(
      cat([
        txt(`${head} = `),
        ...leadingDocs(cts, EXPR, exprSpan(value)),
        exprRaw(cts, value),
        txt(" in"),
        ...trailingDocs(cts, EXPR, exprSpan(value)),
        cont,
      ]),
    );
  },
);
/**
 * `{ x }` when the value is a same-name ref, else `{ x: e }` (ADR 0068).
 */
const recordFieldD: _Curry<[cts: Ctx, f: Field], Doc> = _curry(2, (cts: Ctx, f: Field) =>
  ((_v) =>
    _v._tag === "ERef" && (({ name }) => eq(name, f.name))(_v)
      ? (({ name }) => exprD(cts, f.value))(_v)
      : cat([txt(`${f.name}: `), exprD(cts, f.value)]))(f.value),
);
const recordD: _Curry<[cts: Ctx, fields: Field[], spread: Option<Expr>], Doc> = _curry(
  3,
  (cts: Ctx, fields: Field[], spread: Option<Expr>) => {
    const fieldDocs: Doc[] = map((f: Field) => recordFieldD(cts, f), fields);
    return braced(
      "{",
      "}",
      ((_v) =>
        _v._tag === "Some"
          ? (({ value: s }) => _Array_prepend(cat([txt("..."), exprD(cts, s)]), fieldDocs))(_v)
          : _v._tag === "None"
            ? fieldDocs
            : (() => {
                throw new Error("non-exhaustive match");
              })())(spread),
    );
  },
);
const seqElemD: _Curry<[cts: Ctx, el: SeqElem], Doc> = _curry(2, (cts: Ctx, el: SeqElem) =>
  ((_v) =>
    _v._tag === "SEExpr"
      ? (({ expr: e }) => exprD(cts, e))(_v)
      : _v._tag === "SESpread"
        ? (({ expr: e }) => cat([txt("..."), exprD(cts, e)]))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(el),
);
/**
 * `|>` is left-associative, so `a |> b |> c` is pipe(pipe(a, b), c); flatten it
 * back to source order. Do NOT walk into `->`: the fast pipe inserts first
 * (ADR 0069) while `|>` is data-last, so flattening a mixed chain would rewrite
 * `val->fn(a, b) |> g(c)` into `val |> fn(a, b) |> g(c)`.
 */
const pipeSegmentsFrom: _Curry<[e: Expr, acc: Expr[]], Expr[]> = _curry(2, (e: Expr, acc: Expr[]) =>
  ((_v) =>
    _v._tag === "EPipe" && _v.fast === false
      ? (({ left, right }) => pipeSegmentsFrom(left, _Array_prepend(right, acc)))(_v)
      : _Array_prepend(e, acc))(e),
);
const matchArmD: _Curry<[cts: Ctx, a: MatchArm], Doc> = _curry(2, (cts: Ctx, a: MatchArm) => {
  const guard: string = ((_v) =>
    _v._tag === "Some"
      ? (({ value: g }) => ` when ${flat(exprD(cts, g))}`)(_v)
      : _v._tag === "None"
        ? ""
        : (() => {
            throw new Error("non-exhaustive match");
          })())(a.guard);
  const head: Doc = txt(`| ${pattern(a.pattern)}${guard} =>`);
  return hasLead(cts, EXPR, exprSpan(a.body))
    ? cat([head, indent(cat([hardline, exprD(cts, a.body)]))])
    : cat([head, txt(" "), indent(exprD(cts, a.body))]);
});
/**
 * Inline `switch s { | A => x | _ => y }` when it fits, else one arm per line.
 * A multi-line arm body nests one level past the arm's `|`, so its own lines
 * never align with the parent's arms.
 */
const matchD: _Curry<[cts: Ctx, scrutinee: Expr, arms: MatchArm[]], Doc> = _curry(
  3,
  (cts: Ctx, scrutinee: Expr, arms: MatchArm[]) =>
    group(
      cat([
        txt(`switch ${flat(exprD(cts, scrutinee))} {`),
        indent(cat(map((a: MatchArm) => cat([line, matchArmD(cts, a)]), arms))),
        line,
        txt("}"),
      ]),
    ),
);
/**
 * `loop (acc = 0, i = 0) { body }` (ADR 0056) — inline when it fits, else the
 * body indents on its own lines, brace layout matching `switch`.
 */
const loopD: _Curry<[cts: Ctx, params: LoopParam[], body: Expr], Doc> = _curry(
  3,
  (cts: Ctx, params: LoopParam[], body: Expr) =>
    group(
      cat([
        txt("loop ("),
        join(
          txt(", "),
          map((p: LoopParam) => cat([txt(`${p.name} = `), exprD(cts, p.init)]), params),
        ),
        txt(") {"),
        indent(cat([line, exprD(cts, body)])),
        line,
        txt("}"),
      ]),
    ),
);
/**
 * A lambda argument in last position hugs its closing paren, so a `switch` or
 * `do` body ends `})` rather than staircasing a lone closer onto its own line.
 */
const lastArgHugs: (body: Expr) => boolean = (body: Expr) =>
  ((_v) =>
    _v._tag === "EMatch"
      ? true
      : _v._tag === "ELoop"
        ? true
        : _v._tag === "EDo"
          ? true
          : _Option_isSome(discardedLetExprs(body)))(body);
const callArgsD: _Curry<
  [cts: Ctx, fn: Expr, args: Expr[], origin: Option<string>, asCallee: boolean],
  Doc
> = _curry(5, (cts: Ctx, fn: Expr, args: Expr[], origin: Option<string>, asCallee: boolean) =>
  ((_v) =>
    _v._tag === "Some"
      ? (({ value: d }) => d)(_v)
      : _v._tag === "None"
        ? ((_v) =>
            _v._tag === "Some" && _v.value._tag === "ECall"
              ? (({ value: { fn: ffn, args: fargs, origin: forigin } }) =>
                  callArgsD(cts, ffn, fargs, forigin, asCallee))(
                  _v as Extract<Option<Expr>, { _tag: "Some" }> & {
                    value: Extract<
                      Extract<Option<Expr>, { _tag: "Some" }>["value"],
                      { _tag: "ECall" }
                    >;
                  },
                )
              : plainCallD(cts, fn, args, origin, asCallee))(
            flattenCallSpine(cts, Ast.ECall(fn, args, origin, { start: 0, end: 0 })),
          )
        : (() => {
            throw new Error("non-exhaustive match");
          })())(refoldCall(cts, fn, args)),
);
const plainCallD: _Curry<
  [cts: Ctx, fn: Expr, args: Expr[], origin: Option<string>, asCallee: boolean],
  Doc
> = _curry(5, (cts: Ctx, fn: Expr, args: Expr[], origin: Option<string>, asCallee: boolean) => {
  const fnD: Doc = calleeD(cts, fn);
  return ((_v) =>
    _v.length === 0
      ? cat([fnD, txt("()")])
      : _v.length === 1 && _v[0]._tag === "ETuple"
        ? (([{ elements, span: tsp }]) =>
            group(cat([fnD, txt("("), exprD(cts, Ast.ETuple(elements, tsp)), txt(")")])))(
            _v as [Extract<Expr[][number], { _tag: "ETuple" }>],
          )
        : ((argDocs: Doc[]) =>
            ((_v) =>
              _v._tag === "Some" && _v.value._tag === "ELambda"
                ? (({ value: { body: lbody } }) =>
                    group(
                      cat([
                        fnD,
                        txt("("),
                        join(txt(", "), argDocs),
                        or(lastArgHugs(lbody), !asCallee) ? txt(")") : cat([softline, txt(")")]),
                      ]),
                    ))(
                    _v as Extract<Option<Expr>, { _tag: "Some" }> & {
                      value: Extract<
                        Extract<Option<Expr>, { _tag: "Some" }>["value"],
                        { _tag: "ELambda" }
                      >;
                    },
                  )
                : cat([
                    fnD,
                    group(
                      cat([
                        txt("("),
                        indent(cat([softline, join(cat([txt(","), line]), argDocs)])),
                        softline,
                        txt(")"),
                      ]),
                    ),
                  ]))(_Array_get(length(args) - 1, args)))(callArgDocs(cts, args, origin)))(args);
});
const callD: _Curry<[cts: Ctx, fn: Expr, args: Expr[], origin: Option<string>], Doc> = _curry(
  4,
  (cts: Ctx, fn: Expr, args: Expr[], origin: Option<string>) =>
    callArgsD(cts, fn, args, origin, false),
);
const calleeD: _Curry<[cts: Ctx, e: Expr], Doc> = _curry(2, (cts: Ctx, e: Expr) =>
  ((_v) =>
    _v._tag === "ECall"
      ? (({ fn, args, origin }) => callArgsD(cts, fn, args, origin, true))(_v)
      : parenIf(loosePrefix(cts, e), exprD(cts, e)))(hooked(cts, e)),
);
const operandD: _Curry<[cts: Ctx, e: Expr], Doc> = _curry(2, (cts: Ctx, e: Expr) =>
  parenIf(loosePrefix(cts, e), exprD(cts, e)),
);
/**
 * A record in member position is ambiguous with a block, so it parenthesizes
 * where a callee would not.
 */
const memberD: _Curry<[cts: Ctx, e: Expr], Doc> = _curry(2, (cts: Ctx, e: Expr) =>
  ((_v) =>
    _v._tag === "ERecord"
      ? cat([txt("("), exprD(cts, e), txt(")")])
      : parenIf(loosePrefix(cts, e), exprD(cts, e)))(e),
);
/**
 * Inline when it fits, else one `|> stage` per line indented under the head.
 */
const pipeD: _Curry<[cts: Ctx, e: Expr], Doc> = _curry(2, (cts: Ctx, e: Expr) =>
  ((_v) =>
    _v._tag === "EPipe" && _v.right._tag === "ECall" && _v.fast === true
      ? (({ left, right: { fn: rfn, args: rargs, origin: rorigin } }) =>
          cat([pipeLeftD(cts, left, FAST_PIPE_PREC), txt("->"), callD(cts, rfn, rargs, rorigin)]))(
          _v as Extract<Expr, { _tag: "EPipe" }> & {
            right: Extract<Extract<Expr, { _tag: "EPipe" }>["right"], { _tag: "ECall" }>;
          },
        )
      : ((segments: Expr[]) =>
          ((_v) =>
            _v.length === 0
              ? txt("")
              : _v.length >= 1
                ? (([head, ...rest]) =>
                    group(
                      cat([
                        pipeLeftD(cts, head, PIPE_PREC),
                        indent(
                          cat(map((s: Expr) => cat([line, txt("|> "), operandD(cts, s)]), rest)),
                        ),
                      ]),
                    ))(_v)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(segments))(pipeSegmentsFrom(e, [] as Expr[])))(e),
);
const letBindHead: _Curry<[cts: Ctx, monad: string, param: LamParam], string> = _curry(
  3,
  (cts: Ctx, monad: string, param: LamParam) =>
    `let${monad === "Task" ? "!" : "?"} ${paramText(cts, param)}`,
);
/**
 * Plugin `format` hooks may rewrite a node before layout (ADR 0109), except
 * when a comment sits inside it: the rewrite would drop or duplicate it.
 */
const hooked: _Curry<[cts: Ctx, e: Expr], Expr> = _curry(2, (cts: Ctx, e: Expr) =>
  length(cts.formatHooks) === 0
    ? e
    : ((sp: SpanAt) =>
        _Option_isSome(_Array_find((s: number) => and(s > sp.start, s < sp.end), cts.commentStarts))
          ? e
          : _Option_unwrapOr(e, runFormatHooks(cts.formatHooks, e)))(exprSpan(e)),
);
/**
 * What a `formatDoc` hook is handed: the printers below, bound to `cts`.
 */
const formatApi: (cts: Ctx) => FormatApi = (cts: Ctx) => ({
  exprD: (e: Expr) => exprD(cts, e),
  memberD: (e: Expr) => memberD(cts, e),
  flat: flat,
  strLit: strLit,
  sourceText: _curry(2, (start: number, end: number) => _Str_slice(start, end, cts.src)),
});
/**
 * Every expression prints through here, so every path sees the hooks. A
 * `formatDoc` hook sees the node after any `format` rewrite.
 */
const exprRaw: _Curry<[cts: Ctx, e: Expr], Doc> = _curry(2, (cts: Ctx, e: Expr) => {
  const node: Expr = hooked(cts, e);
  return length(cts.formatDocHooks) === 0
    ? exprRawOf(cts, node)
    : ((_v) =>
        _v._tag === "Some"
          ? (({ value: doc }) => doc)(_v)
          : _v._tag === "None"
            ? exprRawOf(cts, node)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(runFormatDocHooks(cts.formatDocHooks, node, formatApi(cts)));
});
const exprRawOf: _Curry<[cts: Ctx, e: Expr], Doc> = _curry(2, (cts: Ctx, e: Expr) =>
  ((_v) =>
    _v._tag === "ENum"
      ? (({ raw }) => txt(raw))(_v)
      : _v._tag === "EUnit"
        ? txt("()")
        : _v._tag === "EBool"
          ? (({ value }) => txt(show(value)))(_v)
          : _v._tag === "EStr"
            ? (({ value }) => txt(strLit(value)))(_v)
            : _v._tag === "EInterp"
              ? (({ parts }) => txt(interpText(cts, parts)))(_v)
              : _v._tag === "ERef"
                ? (({ name }) => txt(name))(_v)
                : _v._tag === "ECall"
                  ? (({ fn, args, origin }) => callD(cts, fn, args, origin))(_v)
                  : _v._tag === "ELambda"
                    ? (({ params, body }) => lambdaD(cts, params, body))(_v)
                    : _v._tag === "EPipe"
                      ? pipeD(cts, e)
                      : _v._tag === "EDo"
                        ? (({ exprs }) => doD(cts, exprs))(_v)
                        : _v._tag === "ETernary"
                          ? ternaryD(cts, e)
                          : _v._tag === "ERecord"
                            ? (({ fields, spread }) => recordD(cts, fields, spread))(_v)
                            : _v._tag === "EField"
                              ? (({ target, name }) =>
                                  cat([memberD(cts, target), txt(`.${name}`)]))(_v)
                              : _v._tag === "EMatch"
                                ? (({ scrutinee, arms }) => matchD(cts, scrutinee, arms))(_v)
                                : _v._tag === "ELetIn"
                                  ? (({ name, annot, value, body }) =>
                                      ((_v) =>
                                        _v._tag === "Some"
                                          ? (({ value: exprs }) => doD(cts, exprs))(_v)
                                          : _v._tag === "None"
                                            ? ((ann: string) =>
                                                letLikeD(cts, `let ${name}${ann}`, value, body))(
                                                ((_v) =>
                                                  _v._tag === "Some"
                                                    ? (({ value: te }) => ` : ${showTypeExpr(te)}`)(
                                                        _v,
                                                      )
                                                    : _v._tag === "None"
                                                      ? ""
                                                      : (() => {
                                                          throw new Error("non-exhaustive match");
                                                        })())(annot),
                                              )
                                            : (() => {
                                                throw new Error("non-exhaustive match");
                                              })())(discardedLetExprs(e)))(_v)
                                  : _v._tag === "ELetBind"
                                    ? (({ param, monad, value, body }) =>
                                        letLikeD(cts, letBindHead(cts, monad, param), value, body))(
                                        _v,
                                      )
                                    : _v._tag === "ELoop"
                                      ? (({ params, body }) => loopD(cts, params, body))(_v)
                                      : _v._tag === "ERecur"
                                        ? (({ args }) =>
                                            cat([
                                              txt("recur"),
                                              bracketed(
                                                "(",
                                                ")",
                                                map((x: Expr) => exprD(cts, x), args),
                                              ),
                                            ]))(_v)
                                        : _v._tag === "ETuple"
                                          ? (({ elements }) =>
                                              bracketed(
                                                "(",
                                                ")",
                                                map((x: Expr) => exprD(cts, x), elements),
                                              ))(_v)
                                          : _v._tag === "EArr"
                                            ? (({ elements }) =>
                                                bracketed(
                                                  "[",
                                                  "]",
                                                  map((el: SeqElem) => seqElemD(cts, el), elements),
                                                ))(_v)
                                            : _v._tag === "EList"
                                              ? (({ elements }) =>
                                                  bracketed(
                                                    "@{",
                                                    "}",
                                                    map(
                                                      (el: SeqElem) => seqElemD(cts, el),
                                                      elements,
                                                    ),
                                                  ))(_v)
                                              : _v._tag === "ESet"
                                                ? (({ elements }) =>
                                                    bracketed(
                                                      "#{",
                                                      "}",
                                                      map(
                                                        (el: SeqElem) => seqElemD(cts, el),
                                                        elements,
                                                      ),
                                                    ))(_v)
                                                : _v._tag === "EMap"
                                                  ? (({ entries }) =>
                                                      braced(
                                                        "#{",
                                                        "}",
                                                        map(
                                                          (en: MapEntry) =>
                                                            cat([
                                                              exprD(cts, en.key),
                                                              txt(": "),
                                                              exprD(cts, en.value),
                                                            ]),
                                                          entries,
                                                        ),
                                                      ))(_v)
                                                  : (() => {
                                                      throw new Error("non-exhaustive match");
                                                    })())(e),
);
const aliasFieldText: (f: AliasField) => string = (f: AliasField) =>
  `${f.name}${f.optional ? "?" : ""}: ${showTypeExpr(f.fieldType)}`;
const ctorArms: _Curry<[cts: Ctx, ctors: Ctor[], i: number], Doc[]> = _curry(
  3,
  (cts: Ctx, ctors: Ctor[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as Doc[])
        : _v._tag === "Some"
          ? (({ value: c }) =>
              _Array_prepend(
                cat([hardline, withComments(cts, CTOR, c.span, txt(`| ${ctorText(c)}`))]),
                ctorArms(cts, ctors, i + 1),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, ctors)),
);
/**
 * A Doc rather than a flat string: a record alias with many or long fields must
 * break one per line like a record literal does, and a comment between
 * constructors needs a slot to print a leading line into.
 */
export const typeStmtD: _Curry<
  [
    cts: Ctx,
    name: string,
    params: string[],
    ctors: Ctor[],
    alias: Option<AliasField[]>,
    aliasType: Option<TypeExpr>,
  ],
  Doc
> = _curry(
  6,
  (
    cts: Ctx,
    name: string,
    params: string[],
    ctors: Ctor[],
    alias: Option<AliasField[]>,
    aliasType: Option<TypeExpr>,
  ) => {
    const head: string = `type ${name}${generics(params)}`;
    return ((_v) =>
      _v._tag === "Some"
        ? (({ value: fields }) =>
            cat([
              txt(`${head} = `),
              braced(
                "{",
                "}",
                map((f: AliasField) => txt(aliasFieldText(f)), fields),
              ),
            ]))(_v)
        : _v._tag === "None"
          ? ((_v) =>
              _v._tag === "Some"
                ? (({ value: te }) => txt(`${head} = ${showTypeExpr(te)}`))(_v)
                : _v._tag === "None"
                  ? length(ctors) === 0
                    ? txt(`extern ${head}`)
                    : cat([txt(`${head} =`), indent(cat(ctorArms(cts, ctors, 0)))])
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(aliasType)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(alias);
  },
);
export const importStmtD: <A>(names: ({ name: string } & A)[], from: string) => Doc = _curry(
  2,
  <A>(names: ({ name: string } & A)[], from: string) =>
    group(
      cat([
        txt("import "),
        braced(
          "{",
          "}",
          map((n: { name: string } & A) => txt(n.name), names),
        ),
        txt(` from ${strLit(from)}`),
      ]),
    ),
);
export const importNsStmtD: _Curry<[alias: string, from: string], Doc> = _curry(
  2,
  (alias: string, from: string) => txt(`import * as ${alias} from ${strLit(from)}`),
);
/**
 * Leading comments print above the node, trailing ones inline after it.
 * Leading comments print above the node, trailing ones inline after it.
 */
export const exprD: _Curry<[cts: Ctx, e: Expr], Doc> = _curry(2, (cts: Ctx, e: Expr) =>
  withComments(cts, EXPR, exprSpan(e), exprRaw(cts, e)),
);
const expPrefix: (exported: boolean) => string = (exported: boolean) => (exported ? "export " : "");
/**
 * A field access `<tmp>.<name>` reading the given destructuring temp.
 */
const fieldOf: _Curry<[e: Expr, tmp: string], Option<string>> = _curry(2, (e: Expr, tmp: string) =>
  ((_v) =>
    _v._tag === "EField" && _v.target._tag === "ERef"
      ? (({ target: { name: target }, name }) =>
          eq(target, tmp) ? (Some(name) as Option<string>) : (None as Option<string>))(
          _v as Extract<Expr, { _tag: "EField" }> & {
            target: Extract<Extract<Expr, { _tag: "EField" }>["target"], { _tag: "ERef" }>;
          },
        )
      : (None as Option<string>))(e),
);
/**
 * How many of the `$d` temp's shorthand field-access lets follow it, so the
 * group re-folds into a single `let { x, y } = e`.
 */
const destructureFieldsFrom: _Curry<
  [stmts: Stmt[], j: number, tmp: string, acc: string[]],
  string[]
> = _curry(4, (stmts: Stmt[], j: number, tmp: string, acc: string[]) =>
  ((_v) =>
    _v._tag === "Some" && _v.value._tag === "SLet"
      ? (({ value: { name, value } }) =>
          ((_v) =>
            _v._tag === "Some"
              ? (({ value: f }) =>
                  eq(f, name)
                    ? destructureFieldsFrom(stmts, j + 1, tmp, _Array_append(f, acc))
                    : acc)(_v)
              : _v._tag === "None"
                ? acc
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(fieldOf(value, tmp)))(
          _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
            value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
          },
        )
      : acc)(_Array_get(j, stmts)),
);

/**
 * Print one statement, re-folding a `$d` destructuring temp plus its
 * field-access lets back into one `let { … } = e`. Reports how many
 * statements it consumed.
 */
const stmtDoc: _Curry<[cts: Ctx, stmts: Stmt[], i: number, src: string], StmtDoc> = _curry(
  4,
  (cts: Ctx, stmts: Stmt[], i: number, src: string) =>
    ((_v) =>
      _v._tag === "None"
        ? { doc: txt(""), consumed: 1 }
        : _v._tag === "Some"
          ? (({ value: s }) =>
              ((_v) =>
                _v._tag === "SImport"
                  ? (({ names, from }) => ({ doc: importStmtD(names, from), consumed: 1 }))(_v)
                  : _v._tag === "SImportNs"
                    ? (({ alias, from }) => ({
                        doc: importNsStmtD(alias.name, from),
                        consumed: 1,
                      }))(_v)
                    : _v._tag === "SType"
                      ? (({ name, params, ctors, alias, aliasType, exported }) => ({
                          doc: cat([
                            txt(expPrefix(exported)),
                            typeStmtD(cts, name, params, ctors, alias, aliasType),
                          ]),
                          consumed: 1,
                        }))(_v)
                      : _v._tag === "SExtern"
                        ? (({
                            name,
                            params,
                            typeExpr: te,
                            module,
                            imported,
                            curried,
                            exported,
                          }) => ({
                            doc: txt(
                              `${expPrefix(exported)}${externStmt(name, params, te, module, imported, curried)}`,
                            ),
                            consumed: 1,
                          }))(_v)
                        : _v._tag === "SError"
                          ? (({ span: sp }) => ({
                              doc: verbatim(_Str_slice(sp.start, sp.end, src)),
                              consumed: 1,
                            }))(_v)
                          : _v._tag === "SExpr"
                            ? (({ value }) => ({ doc: exprD(cts, value), consumed: 1 }))(_v)
                            : _v._tag === "SLet"
                              ? (({ name, annot, value, exported }) =>
                                  _Str_startsWith("$", name)
                                    ? ((fields: string[]) => ({
                                        doc: cat([
                                          txt(
                                            `${expPrefix(exported)}let { ${_Str_join(", ", fields)} } = `,
                                          ),
                                          exprD(cts, value),
                                        ]),
                                        consumed: length(fields) + 1,
                                      }))(destructureFieldsFrom(stmts, i + 1, name, [] as string[]))
                                    : ((ann: string) => ({
                                        doc: cat([
                                          txt(`${expPrefix(exported)}let ${name}${ann} = `),
                                          exprD(cts, value),
                                        ]),
                                        consumed: 1,
                                      }))(
                                        ((_v) =>
                                          _v._tag === "Some"
                                            ? (({ value: te }) => ` : ${showTypeExpr(te)}`)(_v)
                                            : _v._tag === "None"
                                              ? ""
                                              : (() => {
                                                  throw new Error("non-exhaustive match");
                                                })())(annot),
                                      ))(_v)
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(s))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, stmts)),
);
const stmtSpan: (s: Stmt) => SpanAt = (s: Stmt) =>
  ((_v) =>
    _v._tag === "SLet"
      ? (({ span: sp }) => sp)(_v)
      : _v._tag === "SType"
        ? (({ span: sp }) => sp)(_v)
        : _v._tag === "SExtern"
          ? (({ span: sp }) => sp)(_v)
          : _v._tag === "SImport"
            ? (({ span: sp }) => sp)(_v)
            : _v._tag === "SImportNs"
              ? (({ span: sp }) => sp)(_v)
              : _v._tag === "SExpr"
                ? (({ span: sp }) => sp)(_v)
                : _v._tag === "SError"
                  ? (({ span: sp }) => sp)(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(s);
/**
 * A blank separator between two statements: a newline, only whitespace, then
 * another newline somewhere in the source gap. Any run of blank lines
 * collapses to one; a doc comment is not whitespace, so `let a\n/// d\nlet b`
 * reads as adjacent.
 */
const blankBetweenFrom: _Curry<[s: string, i: number, seenNl: boolean], boolean> = _curry(
  3,
  (s: string, i: number, seenNl: boolean) =>
    ((_v) =>
      _v._tag === "None"
        ? false
        : _v._tag === "Some" && _v.value === "\n"
          ? or(seenNl, blankBetweenFrom(s, i + 1, true))
          : _v._tag === "Some" && _v.value === " "
            ? blankBetweenFrom(s, i + 1, seenNl)
            : _v._tag === "Some" && _v.value === "\t"
              ? blankBetweenFrom(s, i + 1, seenNl)
              : _v._tag === "Some" && _v.value === "r"
                ? blankBetweenFrom(s, i + 1, seenNl)
                : _v._tag === "Some"
                  ? blankBetweenFrom(s, i + 1, false)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(_Str_get(i, s)),
);
const blankBetween: (gap: string) => boolean = (gap: string) => blankBetweenFrom(gap, 0, false);
/**
 * Where a statement's rendering begins in source: its first leading comment
 * when it has one, else its own token — so a kept blank line lands before the
 * comment block rather than inside it.
 */
const anchorStart: _Curry<[cts: Ctx, s: Stmt], number> = _curry(2, (cts: Ctx, s: Stmt) => {
  const sp: SpanAt = stmtSpan(s);
  return ((_v) =>
    _v._tag === "Some"
      ? (({ value: c }) => c.start)(_v)
      : _v._tag === "None"
        ? sp.start
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(0, atKey(cts.leading, spanKey(STMT, sp))));
});
const stmtParts: _Curry<
  [cts: Ctx, stmts: Stmt[], i: number, src: string, prevEnd: Option<number>, acc: Doc[]],
  [Doc[], Option<number>]
> = _curry(
  6,
  (cts: Ctx, stmts: Stmt[], i: number, src: string, prevEnd: Option<number>, acc: Doc[]) =>
    ((_v) =>
      _v._tag === "None"
        ? _tuple(acc, prevEnd)
        : _v._tag === "Some"
          ? (({ value: cur }) =>
              ((sep: Doc[]) =>
                ((printed: StmtDoc) =>
                  ((lastIdx: number) =>
                    ((end: number) =>
                      stmtParts(
                        cts,
                        stmts,
                        i + printed.consumed,
                        src,
                        Some(end) as Option<number>,
                        _Array_concat(
                          acc,
                          _Array_append(withComments(cts, STMT, stmtSpan(cur), printed.doc), sep),
                        ),
                      ))(
                      ((_v) =>
                        _v._tag === "Some"
                          ? (({ value: last }) => stmtSpan(last).end)(_v)
                          : _v._tag === "None"
                            ? 0
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(_Array_get(lastIdx, stmts)),
                    ))(i + printed.consumed - 1))(stmtDoc(cts, stmts, i, src)))(
                ((_v) =>
                  _v._tag === "None"
                    ? ([] as Doc[])
                    : _v._tag === "Some"
                      ? (({ value: pe }) =>
                          blankBetween(_Str_slice(pe, anchorStart(cts, cur), src))
                            ? [hardline, hardline]
                            : [hardline])(_v)
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(prevEnd),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, stmts)),
);
/**
 * Comments after the last statement have no node to attach to; they print
 * after it, keeping a blank line if the source had one.
 */
const tailParts: _Curry<[tail: Comment[], src: string, prevEnd: Option<number>], Doc[]> = _curry(
  3,
  (tail: Comment[], src: string, prevEnd: Option<number>) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as Doc[])
        : _v._tag === "Some"
          ? (({ value: first }) =>
              ((sep: Doc[]) =>
                _Array_append(
                  join(
                    hardline,
                    map((c: Comment) => txt(c.text), tail),
                  ),
                  sep,
                ))(
                ((_v) =>
                  _v._tag === "None"
                    ? ([] as Doc[])
                    : _v._tag === "Some"
                      ? (({ value: pe }) =>
                          blankBetween(_Str_slice(pe, first.start, src))
                            ? [hardline, hardline]
                            : [hardline])(_v)
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(prevEnd),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(0, tail)),
);
const programDoc: _Curry<[cts: Ctx, stmts: Stmt[], src: string, tail: Comment[]], Doc> = _curry(
  4,
  (cts: Ctx, stmts: Stmt[], src: string, tail: Comment[]) =>
    (([parts, prevEnd]: [Doc[], Option<number>]) =>
      cat(_Array_concat(_Array_concat(parts, tailParts(tail, src, prevEnd)), [hardline])))(
      stmtParts(cts, stmts, 0, src, None as Option<number>, [] as Doc[]),
    ),
);
/**
 * Every anchor in a program: each statement span plus every expression under
 * it, so a comment binds to the tightest node that follows (or precedes) it.
 */
const stmtAnchors: (s: Stmt) => Anchor[] = (s: Stmt) =>
  _Array_append(
    { kind: STMT, sp: stmtSpan(s) },
    ((_v) =>
      _v._tag === "SLet"
        ? (({ value }) => exprAnchors(value))(_v)
        : _v._tag === "SExpr"
          ? (({ value }) => exprAnchors(value))(_v)
          : _v._tag === "SType"
            ? (({ ctors }) => map((c: Ctor) => ({ kind: CTOR, sp: c.span }), ctors))(_v)
            : ([] as Anchor[]))(s),
  );
/**
 * A comment inside an unparsable region is part of the bytes `SError` re-emits
 * verbatim; attaching it too would print it twice.
 */
const inErrorSpanFrom: _Curry<[stmts: Stmt[], i: number, c: Comment], boolean> = _curry(
  3,
  (stmts: Stmt[], i: number, c: Comment) =>
    ((_v) =>
      _v._tag === "None"
        ? false
        : _v._tag === "Some" && _v.value._tag === "SError"
          ? (({ value: { span: sp } }) =>
              or(and(c.start >= sp.start, c.start < sp.end), inErrorSpanFrom(stmts, i + 1, c)))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<
                  Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                  { _tag: "SError" }
                >;
              },
            )
          : _v._tag === "Some"
            ? inErrorSpanFrom(stmts, i + 1, c)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, stmts)),
);
const inErrorSpan: _Curry<[stmts: Stmt[], c: Comment], boolean> = _curry(
  2,
  (stmts: Stmt[], c: Comment) => inErrorSpanFrom(stmts, 0, c),
);
/**
 * `"use open"` is a directive, not a statement — the parser skips it, so the
 * printer restores it verbatim.
 */
const hasOpenDirective: (src: string) => boolean = (src: string) =>
  ((_v) =>
    _v._tag === "Some"
      ? (({ value: first }) => _Str_trim(first) === '"use open"')(_v)
      : _v._tag === "None"
        ? false
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(0, _Str_split("\n", _Str_trim(src))));
/**
 * Print an already-parsed program with comment and blank-line fidelity to `src`.
 */
export const formatProgram: _Curry<[stmts: Stmt[], src: string], string> = _curry(
  2,
  (stmts: Stmt[], src: string) => {
    const hooks: FormatHooks = formatHooksFor(None);
    return formatProgramWith(stmts, src, hooks);
  },
);
/**
 * `formatProgram` with a plugin list's format hooks (`formatHooksFor`).
 */
export const formatProgramWith: _Curry<[stmts: Stmt[], src: string, hooks: FormatHooks], string> =
  _curry(3, (stmts: Stmt[], src: string, hooks: FormatHooks) => {
    const innerBound: Set<string> = _Set_fromArray(_Array_flatMap(stmtInnerNames, stmts));
    const shadowed: Set<string> = _Set_union(innerBound, _Set_fromArray(topLevelNames(stmts)));
    const comments: Comment[] = filter(
      (c: Comment) => !inErrorSpan(stmts, c),
      collectComments(src),
    );
    const base: Ctx = {
      ...noComments,
      flatArity: buildFlatArity(stmts, innerBound),
      shadowed: shadowed,
      formatHooks: hooks.rewrite,
      formatDocHooks: hooks.layout,
      commentStarts: map((c: Comment) => c.start, comments),
      src: src,
    };
    const attached: Attached = attachFrom(
      comments,
      0,
      anchorIndex(sortAnchors(_Array_flatMap(stmtAnchors, stmts))),
      src,
      { table: base, tail: [] as Comment[] },
    );
    const body: string = render(programDoc(attached.table, stmts, src, attached.tail), WIDTH);
    return hasOpenDirective(src)
      ? `"use open"

${body}`
      : body;
  });
