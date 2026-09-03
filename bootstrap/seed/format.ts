import type {
  Ctor,
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
} from "./ast";
import type { SpanAt } from "./types";
import type { QualAliasField } from "./infer";
import type { CtorFieldLike, CtorLike } from "./codegen";
import type { Doc } from "./doc";

export type Comment = {
  start: number;
  end: number;
  text: string;
  blankAfter: boolean;
  trailing: boolean;
};
export type Ctx = {
  leading: Map<string, Comment[]>;
  trailing: Map<string, Comment[]>;
  flatArity: Map<string, number>;
  shadowed: Set<string>;
  etaSkip: boolean;
};
export type Attached = { table: Ctx; tail: Comment[] };
export type StmtDoc = { doc: Doc; consumed: number };

import type { Option, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Array_concat,
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
  _Str_contains,
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
  eq,
  filter,
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

import { match } from "@onrails/pattern";

import * as Ast from "./ast";
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
} from "./doc";
import { skipStringLiteral } from "./str-scan";
import { showTypeExpr } from "./show-type-expr";
/**
 * `JSON.stringify` escaping, plus `${` — which would otherwise reopen an
 * interpolation hole on re-lex (ADR 0023), so a hole-free string round-trips
 * even when its decoded value happens to contain that sequence.
 */
const escChar: (c: string) => string = (c: string) =>
  match(c)
    .with("\\", () => "\\\\")
    .with('"', () => '\\"')
    .with("\n", () => "\\n")
    .with("\t", () => "\\t")
    .otherwise(() => c);
const escFrom: _Curry<[chars: string[], i: number, acc: string], string> = _curry(
  3,
  (chars: string[], i: number, acc: string) =>
    match(_Array_get(i, chars))
      .with({ _tag: "None" }, () => acc)
      .with(
        (_v): _v is Extract<Option<string>, { _tag: "Some" }> => {
          const _g: any = _v;
          return (
            _g._tag === "Some" &&
            _g.value === "$" &&
            _Option_contains("{", _Array_get(i + 1, chars))
          );
        },
        () => escFrom(chars, i + 2, `${acc}\\\${`),
      )
      .with({ _tag: "Some" }, ({ value: c }) => escFrom(chars, i + 1, `${acc}${escChar(c)}`))
      .exhaustive(),
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
  match(f.pat)
    .with(
      (_v): _v is Extract<Pattern, { _tag: "PBind" }> => {
        const _g: any = _v;
        return _g._tag === "PBind" && (({ name }) => eq(name, f.label))(_g);
      },
      ({ name }) => f.label,
    )
    .otherwise(() => `${f.label}: ${pattern(f.pat)}`);
const restOf: (rest: Option<Pattern>) => string[] = (rest: Option<Pattern>) =>
  match(rest)
    .with({ _tag: "None" }, () => [] as string[])
    .with({ _tag: "Some" }, ({ value: p }) => [`...${pattern(p)}`])
    .exhaustive();
export const pattern: (p: Pattern) => string = (p: Pattern) =>
  match(p)
    .with({ _tag: "PAs" }, ({ pat: inner, name }) => `${pattern(inner)} as ${name}`)
    .with({ _tag: "PWild" }, () => "_")
    .with({ _tag: "PUnit" }, () => "()")
    .with({ _tag: "PBind" }, ({ name }) => name)
    .with({ _tag: "PLit" }, ({ raw }) => raw)
    .with({ _tag: "PBool" }, ({ value }) => show(value))
    .with({ _tag: "PStr" }, ({ value }) => strLit(value))
    .with({ _tag: "PRecord" }, ({ fields }) => `{ ${commaJoin(patField, fields)} }`)
    .with({ _tag: "PTuple" }, ({ elems }) => `(${commaJoin(pattern, elems)})`)
    .with({ _tag: "PCtor" }, ({ ctor: ctorName, args, ns }) =>
      ((head: string) => (eq(length(args), 0) ? head : `${head}(${commaJoin(pattern, args)})`))(
        match(ns)
          .with({ _tag: "None" }, () => ctorName)
          .with({ _tag: "Some" }, ({ value: alias }) => `${alias}.${ctorName}`)
          .exhaustive(),
      ),
    )
    .with(
      { _tag: "PArr" },
      ({ elems, rest }) => `[${_Str_join(", ", _Array_concat(map(pattern, elems), restOf(rest)))}]`,
    )
    .with(
      { _tag: "PList" },
      ({ elems, rest }) =>
        `@{${_Str_join(", ", _Array_concat(map(pattern, elems), restOf(rest)))}}`,
    )
    .with({ _tag: "POr" }, ({ alts }) => _Str_join(" | ", map(pattern, alts)))
    .exhaustive();
const ctorField: (f: CtorFieldLike) => string = (f: CtorFieldLike) =>
  match(f.name)
    .with({ _tag: "None" }, () => showTypeExpr(f.fieldType))
    .with({ _tag: "Some" }, ({ value: name }) => `${name}: ${showTypeExpr(f.fieldType)}`)
    .exhaustive();
export const ctorText: (c: CtorLike) => string = (c: CtorLike) =>
  eq(length(c.fields), 0) ? c.name : `${c.name}(${commaJoin(ctorField, c.fields)})`;
const generics: (params: string[]) => string = (params: string[]) =>
  eq(length(params), 0) ? "" : `<${_Str_join(", ", params)}>`;
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
    return match(conventionOf(module))
      .with(
        { _tag: "None" },
        () => `${head}${curried ? "curried " : ""}${strLit(module)} ${strLit(imported)}`,
      )
      .with({ _tag: "Some" }, ({ value: convention }) =>
        ((first: string) =>
          ((second: string) => `${head}${convention} ${strLit(first)}${second}`)(
            eq(imported, "") ? "" : ` ${strLit(imported)}`,
          ))(_Str_slice(_Str_length(`mochi:${convention}:`), _Str_length(module), module)),
      )
      .exhaustive();
  },
);
const sepLine: Doc = cat([txt(","), line]);
/**
 * `[a, b]` / `(a, b)` — tight brackets; breaks one item per line.
 */
export const bracketed: _Curry<[open: string, close: string, items: Doc[]], Doc> = _curry(
  3,
  (open: string, close: string, items: Doc[]) =>
    eq(length(items), 0)
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
    eq(length(items), 0)
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
  match(e)
    .with({ _tag: "ETernary" }, () => true)
    .with({ _tag: "EPipe" }, () => true)
    .otherwise(() => printsAsLambda(cts, e)),
);
/**
 * `LPSpanned` carries binder spans for the IDE; the printer only wants the shape.
 */
const unspan: (p: LamParam) => LamParam = (p: LamParam) =>
  match(p)
    .with({ _tag: "LPSpanned" }, ({ param: inner }) => inner)
    .otherwise(() => p);
const exprSpan: (e: Expr) => SpanAt = (e: Expr) =>
  match(e)
    .with({ _tag: "ENum" }, ({ span: sp }) => sp)
    .with({ _tag: "EUnit" }, ({ span: sp }) => sp)
    .with({ _tag: "EBool" }, ({ span: sp }) => sp)
    .with({ _tag: "EStr" }, ({ span: sp }) => sp)
    .with({ _tag: "ERef" }, ({ span: sp }) => sp)
    .with({ _tag: "ECall" }, ({ span: sp }) => sp)
    .with({ _tag: "ELambda" }, ({ span: sp }) => sp)
    .with({ _tag: "ELetIn" }, ({ span: sp }) => sp)
    .with({ _tag: "ELetBind" }, ({ span: sp }) => sp)
    .with({ _tag: "EPipe" }, ({ span: sp }) => sp)
    .with({ _tag: "EDo" }, ({ span: sp }) => sp)
    .with({ _tag: "ETernary" }, ({ span: sp }) => sp)
    .with({ _tag: "EMatch" }, ({ span: sp }) => sp)
    .with({ _tag: "ERecord" }, ({ span: sp }) => sp)
    .with({ _tag: "EField" }, ({ span: sp }) => sp)
    .with({ _tag: "ETuple" }, ({ span: sp }) => sp)
    .with({ _tag: "EArr" }, ({ span: sp }) => sp)
    .with({ _tag: "EList" }, ({ span: sp }) => sp)
    .with({ _tag: "ESet" }, ({ span: sp }) => sp)
    .with({ _tag: "EMap" }, ({ span: sp }) => sp)
    .with({ _tag: "ELoop" }, ({ span: sp }) => sp)
    .with({ _tag: "ERecur" }, ({ span: sp }) => sp)
    .with({ _tag: "EInterp" }, ({ span: sp }) => sp)
    .exhaustive();

export const noComments: Ctx = {
  leading: new Map<string, Comment[]>(),
  trailing: new Map<string, Comment[]>(),
  flatArity: new Map<string, number>(),
  shadowed: _Set_fromArray([] as string[]),
  etaSkip: false,
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
    match(_Map_get(key, table))
      .with({ _tag: "Some" }, ({ value: cs }) => cs)
      .with({ _tag: "None" }, () => [] as B[])
      .exhaustive(),
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
  match(_Str_get(i, src))
    .with({ _tag: "None" }, () => i)
    .with({ _tag: "Some", value: "\n" }, () => i)
    .with({ _tag: "Some" }, () => lineEndFrom(src, i + 1))
    .exhaustive(),
);
/**
 * Trailing horizontal whitespace, by CHAR CODE: mochi string literals have no
 * `\r` escape (the lexer's `escChar` knows `\n` and `\t` only), so a literal
 * "\r" would be the letter `r` and this would eat the last letter of every
 * comment ending in one. Space 32, tab 9, carriage return 13.
 */
const trimEndFrom: _Curry<[s: string, n: number], string> = _curry(2, (s: string, n: number) =>
  eq(n, 0)
    ? ""
    : match(_Str_codeAt(n - 1, s))
        .with({ _tag: "Some", value: 32 }, () => trimEndFrom(s, n - 1))
        .with({ _tag: "Some", value: 9 }, () => trimEndFrom(s, n - 1))
        .with({ _tag: "Some", value: 13 }, () => trimEndFrom(s, n - 1))
        .otherwise(() => _Str_slice(0, n, s)),
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
      blankAfter: eq(_Str_trim(_Str_slice(end + 1, lineEnd, src)), ""),
      trailing: false,
    };
  },
);
const scanComments: _Curry<
  [src: string, i: number, lineHasToken: boolean, acc: Comment[]],
  Comment[]
> = _curry(4, (src: string, i: number, lineHasToken: boolean, acc: Comment[]) =>
  match(_Str_get(i, src))
    .with({ _tag: "None" }, () => acc)
    .with({ _tag: "Some", value: "\n" }, () => scanComments(src, i + 1, false, acc))
    .with({ _tag: "Some", value: " " }, () => scanComments(src, i + 1, lineHasToken, acc))
    .with({ _tag: "Some", value: "\t" }, () => scanComments(src, i + 1, lineHasToken, acc))
    .with(
      (_v): _v is Extract<Option<string>, { _tag: "Some" }> => {
        const _g: any = _v;
        return _g._tag === "Some" && eq(_Str_codeAt(i, src), Some(13) as Option<number>);
      },
      () => scanComments(src, i + 1, lineHasToken, acc),
    )
    .with({ _tag: "Some", value: '"' }, () =>
      match(skipStringLiteral(src, i))
        .with({ _tag: "Some" }, ({ value: end }) => scanComments(src, end, true, acc))
        .with({ _tag: "None" }, () => scanComments(src, i + 1, true, acc))
        .exhaustive(),
    )
    .with({ _tag: "Some", value: "/" }, () =>
      eq(_Str_get(i + 1, src), Some("/") as Option<string>)
        ? ((end: number) =>
            ((c: Comment) =>
              scanComments(
                src,
                end,
                lineHasToken,
                _Array_append({ ...c, trailing: lineHasToken }, acc),
              ))(commentAt(src, i, end)))(lineEndFrom(src, i))
        : scanComments(src, i + 1, true, acc),
    )
    .with({ _tag: "Some" }, () => scanComments(src, i + 1, true, acc))
    .exhaustive(),
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
  match(el)
    .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
    .with({ _tag: "SESpread" }, ({ expr: e }) => e)
    .exhaustive();
const exprAnchors: (e: Expr) => { kind: string; sp: SpanAt }[] = (e: Expr) =>
  _Array_append(
    { kind: EXPR, sp: exprSpan(e) },
    match(e)
      .with({ _tag: "ECall" }, ({ fn, args }) =>
        _Array_concat(exprAnchors(fn), _Array_flatMap(exprAnchors, args)),
      )
      .with({ _tag: "ELambda" }, ({ params, body }) =>
        _Array_concat(
          exprAnchors(body),
          _Array_flatMap(
            (p: LamParam) =>
              match(unspan(p))
                .with(
                  (
                    _v,
                  ): _v is Extract<LamParam, { _tag: "LPLabeled" }> & {
                    defaultValue: Extract<
                      Extract<LamParam, { _tag: "LPLabeled" }>["defaultValue"],
                      { _tag: "Some" }
                    >;
                  } => {
                    const _g: any = _v;
                    return _g._tag === "LPLabeled" && _g.defaultValue._tag === "Some";
                  },
                  ({ defaultValue: { value: d } }) => exprAnchors(d),
                )
                .otherwise(() => [] as { kind: string; sp: SpanAt }[]),
            params,
          ),
        ),
      )
      .with({ _tag: "ELetIn" }, ({ value, body }) =>
        _Array_concat(exprAnchors(value), exprAnchors(body)),
      )
      .with({ _tag: "ELetBind" }, ({ value, body }) =>
        _Array_concat(exprAnchors(value), exprAnchors(body)),
      )
      .with({ _tag: "EPipe" }, ({ left, right }) =>
        _Array_concat(exprAnchors(left), exprAnchors(right)),
      )
      .with({ _tag: "EDo" }, ({ exprs }) => _Array_flatMap(exprAnchors, exprs))
      .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) =>
        _Array_concat(exprAnchors(cond), _Array_concat(exprAnchors(thenE), exprAnchors(elseE))),
      )
      .with({ _tag: "EMatch" }, ({ scrutinee, arms }) =>
        _Array_concat(
          exprAnchors(scrutinee),
          _Array_flatMap(
            (a: MatchArm) =>
              _Array_concat(
                match(a.guard)
                  .with({ _tag: "Some" }, ({ value: g }) => exprAnchors(g))
                  .with({ _tag: "None" }, () => [] as { kind: string; sp: SpanAt }[])
                  .exhaustive(),
                exprAnchors(a.body),
              ),
            arms,
          ),
        ),
      )
      .with({ _tag: "ERecord" }, ({ fields, spread }) =>
        _Array_concat(
          match(spread)
            .with({ _tag: "Some" }, ({ value: sp }) => exprAnchors(sp))
            .with({ _tag: "None" }, () => [] as { kind: string; sp: SpanAt }[])
            .exhaustive(),
          _Array_flatMap((f: Field) => exprAnchors(f.value), fields),
        ),
      )
      .with({ _tag: "EField" }, ({ target }) => exprAnchors(target))
      .with({ _tag: "ELoop" }, ({ params, body }) =>
        _Array_concat(
          _Array_flatMap((prm: LoopParam) => exprAnchors(prm.init), params),
          exprAnchors(body),
        ),
      )
      .with({ _tag: "ERecur" }, ({ args }) => _Array_flatMap(exprAnchors, args))
      .with({ _tag: "ETuple" }, ({ elements }) => _Array_flatMap(exprAnchors, elements))
      .with({ _tag: "EArr" }, ({ elements }) =>
        _Array_flatMap((el: SeqElem) => exprAnchors(seqElemExpr(el)), elements),
      )
      .with({ _tag: "EList" }, ({ elements }) =>
        _Array_flatMap((el: SeqElem) => exprAnchors(seqElemExpr(el)), elements),
      )
      .with({ _tag: "ESet" }, ({ elements }) =>
        _Array_flatMap((el: SeqElem) => exprAnchors(seqElemExpr(el)), elements),
      )
      .with({ _tag: "EMap" }, ({ entries }) =>
        _Array_flatMap(
          (en: MapEntry) => _Array_concat(exprAnchors(en.key), exprAnchors(en.value)),
          entries,
        ),
      )
      .with({ _tag: "EInterp" }, ({ parts }) =>
        _Array_flatMap(
          (prt: InterpPart) =>
            match(prt)
              .with({ _tag: "IPLit" }, () => [] as { kind: string; sp: SpanAt }[])
              .with({ _tag: "IPExpr" }, ({ expr: ex }) => exprAnchors(ex))
              .exhaustive(),
          parts,
        ),
      )
      .otherwise(() => [] as { kind: string; sp: SpanAt }[]),
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
const sortAnchors: (a: { sp: SpanAt; kind: string }[]) => { sp: SpanAt; kind: string }[] =
  _Array_sortBy(anchorKey);
/**
 * The node a trailing comment most tightly follows ON ITS OWN LINE: the
 * largest `end` at or before the comment's start, with no newline between.
 * Index-based, not `[head, ...rest]`: a rest pattern copies the tail, which
 * turns one linear scan into a quadratic one.
 */
const trailedByFrom: <A, B>(
  anchors: ({ sp: { end: number } & A } & B)[],
  i: number,
  c: Comment,
  src: string,
  best: Option<{ sp: { end: number } & A } & B>,
) => Option<{ sp: { end: number } & A } & B> = _curry(
  5,
  <A, B>(
    anchors: ({ sp: { end: number } & A } & B)[],
    i: number,
    c: Comment,
    src: string,
    best: Option<{ sp: { end: number } & A } & B>,
  ) =>
    match(_Array_get(i, anchors))
      .with({ _tag: "None" }, () => best)
      .with({ _tag: "Some" }, ({ value: a }) =>
        ((fits: boolean) =>
          ((better: boolean) => trailedByFrom(anchors, i + 1, c, src, better ? Some(a) : best))(
            and(
              fits,
              match(best)
                .with({ _tag: "None" }, () => true)
                .with({ _tag: "Some" }, ({ value: b }) => a.sp.end > b.sp.end)
                .exhaustive(),
            ),
          ))(
          and(a.sp.end <= c.start, not(_Str_contains("\n", _Str_slice(a.sp.end, c.start, src)))),
        ),
      )
      .exhaustive(),
);
const trailedBy: <A, B>(
  anchors: ({ sp: { end: number } & A } & B)[],
  c: Comment,
  src: string,
) => Option<{ sp: { end: number } & A } & B> = _curry(
  3,
  <A, B>(anchors: ({ sp: { end: number } & A } & B)[], c: Comment, src: string) =>
    trailedByFrom(anchors, 0, c, src, None),
);
/**
 * The node an own-line comment most tightly precedes: the first anchor
 * starting at or after the comment ends (the sort puts outermost first).
 */
const leadTargetFrom: <A, B>(
  anchors: ({ sp: { start: number } & A } & B)[],
  i: number,
  c: Comment,
) => Option<{ sp: { start: number } & A } & B> = _curry(
  3,
  <A, B>(anchors: ({ sp: { start: number } & A } & B)[], i: number, c: Comment) =>
    match(_Array_get(i, anchors))
      .with({ _tag: "None" }, () => None)
      .with({ _tag: "Some" }, ({ value: a }) =>
        a.sp.start >= c.end ? Some(a) : leadTargetFrom(anchors, i + 1, c),
      )
      .exhaustive(),
);
const leadTarget: <A, B>(
  anchors: ({ sp: { start: number } & A } & B)[],
  c: Comment,
) => Option<{ sp: { start: number } & A } & B> = _curry(
  2,
  <A, B>(anchors: ({ sp: { start: number } & A } & B)[], c: Comment) =>
    leadTargetFrom(anchors, 0, c),
);

/**
 * `None` when the comment has no anchor at all (it sits past the last node) —
 * the program printer emits those after the final statement.
 */
const attachOne: <A>(
  anchors: ({ sp: SpanAt; kind: string } & A)[],
  src: string,
  c: Comment,
  tbl: Ctx,
) => Option<Ctx> = _curry(
  4,
  <A>(anchors: ({ sp: SpanAt; kind: string } & A)[], src: string, c: Comment, tbl: Ctx) => {
    const trailed = c.trailing ? trailedBy(anchors, c, src) : None;
    return match(trailed)
      .with(
        { _tag: "Some" },
        ({ value: a }) =>
          Some({ ...tbl, trailing: pushAt(spanKey(a.kind, a.sp), c, tbl.trailing) }) as Option<Ctx>,
      )
      .with({ _tag: "None" }, () =>
        match(leadTarget(anchors, c))
          .with({ _tag: "None" }, () => None as Option<Ctx>)
          .with(
            { _tag: "Some" },
            ({ value: a }) =>
              Some({
                ...tbl,
                leading: pushAt(spanKey(a.kind, a.sp), c, tbl.leading),
              }) as Option<Ctx>,
          )
          .exhaustive(),
      )
      .exhaustive();
  },
);
const attachFrom: <A>(
  comments: Comment[],
  i: number,
  anchors: ({ sp: SpanAt; kind: string } & A)[],
  src: string,
  acc: Attached,
) => Attached = _curry(
  5,
  <A>(
    comments: Comment[],
    i: number,
    anchors: ({ sp: SpanAt; kind: string } & A)[],
    src: string,
    acc: Attached,
  ) =>
    match(_Array_get(i, comments))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: c }) =>
        attachFrom(
          comments,
          i + 1,
          anchors,
          src,
          match(attachOne(anchors, src, c, acc.table))
            .with({ _tag: "Some" }, ({ value: table }) => ({ table: table, tail: acc.tail }))
            .with({ _tag: "None" }, () => ({ table: acc.table, tail: _Array_append(c, acc.tail) }))
            .exhaustive(),
        ),
      )
      .exhaustive(),
);
/**
 * Build the table for one expression: scan the source, anchor every node.
 */
export const commentsForExpr: _Curry<[src: string, e: Expr], Ctx> = _curry(
  2,
  (src: string, e: Expr) =>
    attachFrom(collectComments(src), 0, sortAnchors(exprAnchors(e)), src, {
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
    return and(eq(length(lead), 0), eq(length(trail), 0)) ? doc : cat([...lead, doc, ...trail]);
  },
);
import { namespaceRuntime } from "./prelude.gen.mjs";
import { preludeJsDefs } from "./prelude.gen.mjs";
/**
 * Digits of the leading `_curry(N,` in an emitted definition, or None.
 */
const curryArityFrom: _Curry<[def: string, i: number, acc: string], string> = _curry(
  3,
  (def: string, i: number, acc: string) =>
    match(_Str_codeAt(i, def))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: code }) =>
        and(code >= 48, code <= 57)
          ? curryArityFrom(def, i + 1, `${acc}${_Str_fromCode(code)}`)
          : acc,
      )
      .exhaustive(),
);
/**
 * Count the parameters of a bare `const name = (a, b) => …` definition.
 */
const commaCountFrom: _Curry<[s: string, i: number, acc: number], number> = _curry(
  3,
  (s: string, i: number, acc: number) =>
    match(_Str_get(i, s))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some", value: "," }, () => commaCountFrom(s, i + 1, acc + 1))
      .with({ _tag: "Some" }, () => commaCountFrom(s, i + 1, acc))
      .exhaustive(),
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
        eq(_Str_length(digits), 0) ? 0 : _Option_unwrapOr(0, _Str_toNumber(digits)))(
        curryArityFrom(def, curried + 7, ""),
      )
    : ((open: number) =>
        open < 0
          ? 0
          : ((close: number) =>
              close < 0
                ? 0
                : ((params: string) =>
                    eq(_Str_length(params), 0) ? 0 : commaCountFrom(params, 0, 1))(
                    _Str_trim(_Str_slice(open + 3, close, def)),
                  ))(indexOfFrom(") =>", def, open)))(indexOfFrom("= (", def, 0));
};
const runtimeArityOf: (jsId: string) => Option<number> = (jsId: string) =>
  match(_Map_get(jsId, preludeJsDefs))
    .with({ _tag: "None" }, () => None as Option<number>)
    .with({ _tag: "Some" }, ({ value: def }) =>
      ((n: number) => (n >= 2 ? (Some(n) as Option<number>) : (None as Option<number>)))(
        arityOfDef(def),
      ),
    )
    .exhaustive();
/**
 * `Array.map` -> its runtime's flat arity, or None when the namespace is
 * shadowed by a local binding or the member is unknown.
 */
const namespaceArity: _Curry<
  [shadowed: Set<string>, target: Expr, member: string],
  Option<number>
> = _curry(3, (shadowed: Set<string>, target: Expr, member: string) =>
  match(target)
    .with({ _tag: "ERef" }, ({ name: nsName }) =>
      _Set_has(nsName, shadowed)
        ? (None as Option<number>)
        : match(_Map_get(nsName, namespaceRuntime))
            .with({ _tag: "None" }, () => None as Option<number>)
            .with({ _tag: "Some" }, ({ value: members }) =>
              match(_Map_get(member, members))
                .with({ _tag: "None" }, () => None as Option<number>)
                .with({ _tag: "Some" }, ({ value: jsId }) => runtimeArityOf(jsId))
                .exhaustive(),
            )
            .exhaustive(),
    )
    .otherwise(() => None as Option<number>),
);
/**
 * Params codegen collapses into ONE flat JS function — `x => y => e` and
 * `(x, y) => e` alike.
 */
const labeledCount: (params: LamParam[]) => number = (params: LamParam[]) =>
  length(
    filter(
      (p: LamParam) =>
        match(unspan(p))
          .with({ _tag: "LPLabeled" }, () => true)
          .otherwise(() => false),
      params,
    ),
  );
/**
 * A trailing labeled group folds into ONE record parameter (ADR 0098 §2).
 */
const jsArity: (params: LamParam[]) => number = (params: LamParam[]) => {
  const labs: number = labeledCount(params);
  return length(params) - labs + (labs > 0 ? 1 : 0);
};
const collapsedArity: (e: Expr) => number = (e: Expr) =>
  match(e)
    .with({ _tag: "ELambda" }, ({ params, body }) => jsArity(params) + collapsedArity(body))
    .otherwise(() => 0);
/**
 * Every name a pattern binds.
 */
const patNames: (p: Pattern) => string[] = (p: Pattern) =>
  match(p)
    .with({ _tag: "PBind" }, ({ name }) => [name])
    .with({ _tag: "PAs" }, ({ pat: inner, name }) => _Array_append(name, patNames(inner)))
    .with({ _tag: "PTuple" }, ({ elems }) => _Array_flatMap(patNames, elems))
    .with({ _tag: "PRecord" }, ({ fields }) =>
      _Array_flatMap((f: PatField) => patNames(f.pat), fields),
    )
    .with({ _tag: "PCtor" }, ({ args }) => _Array_flatMap(patNames, args))
    .with({ _tag: "PArr" }, ({ elems, rest }) =>
      _Array_concat(
        _Array_flatMap(patNames, elems),
        match(rest)
          .with({ _tag: "Some" }, ({ value: r }) => patNames(r))
          .with({ _tag: "None" }, () => [] as string[])
          .exhaustive(),
      ),
    )
    .with({ _tag: "PList" }, ({ elems, rest }) =>
      _Array_concat(
        _Array_flatMap(patNames, elems),
        match(rest)
          .with({ _tag: "Some" }, ({ value: r }) => patNames(r))
          .with({ _tag: "None" }, () => [] as string[])
          .exhaustive(),
      ),
    )
    .with({ _tag: "POr" }, ({ alts }) => _Array_flatMap(patNames, alts))
    .otherwise(() => [] as string[]);
const paramNames: (p: LamParam) => string[] = (p: LamParam) =>
  match(unspan(p))
    .with({ _tag: "LPName" }, ({ name }) => [name])
    .with({ _tag: "LPLabeled" }, ({ name }) => [name])
    .with({ _tag: "LPTuple" }, ({ names }) => names)
    .with({ _tag: "LPRecord" }, ({ fields }) => fields)
    .otherwise(() => [] as string[]);
/**
 * Every name the file binds anywhere OTHER than a top-level `let` — the
 * over-approximation that guards against regrouping a shadowed callable.
 */
const innerNames: (e: Expr) => string[] = (e: Expr) =>
  match(e)
    .with({ _tag: "ELambda" }, ({ params, body }) =>
      _Array_concat(
        _Array_flatMap(paramNames, params),
        _Array_concat(
          innerNames(body),
          _Array_flatMap(
            (p: LamParam) =>
              match(unspan(p))
                .with(
                  (
                    _v,
                  ): _v is Extract<LamParam, { _tag: "LPLabeled" }> & {
                    defaultValue: Extract<
                      Extract<LamParam, { _tag: "LPLabeled" }>["defaultValue"],
                      { _tag: "Some" }
                    >;
                  } => {
                    const _g: any = _v;
                    return _g._tag === "LPLabeled" && _g.defaultValue._tag === "Some";
                  },
                  ({ defaultValue: { value: d } }) => innerNames(d),
                )
                .otherwise(() => [] as string[]),
            params,
          ),
        ),
      ),
    )
    .with({ _tag: "ELetIn" }, ({ name, value, body }) =>
      _Array_append(name, _Array_concat(innerNames(value), innerNames(body))),
    )
    .with({ _tag: "ELetBind" }, ({ param, value, body }) =>
      _Array_concat(paramNames(param), _Array_concat(innerNames(value), innerNames(body))),
    )
    .with({ _tag: "EMatch" }, ({ scrutinee, arms }) =>
      _Array_concat(
        innerNames(scrutinee),
        _Array_flatMap(
          (a: MatchArm) =>
            _Array_concat(
              patNames(a.pattern),
              _Array_concat(
                match(a.guard)
                  .with({ _tag: "Some" }, ({ value: g }) => innerNames(g))
                  .with({ _tag: "None" }, () => [] as string[])
                  .exhaustive(),
                innerNames(a.body),
              ),
            ),
          arms,
        ),
      ),
    )
    .with({ _tag: "ELoop" }, ({ params, body }) =>
      _Array_concat(
        map((p: LoopParam) => p.name, params),
        _Array_concat(
          _Array_flatMap((p: LoopParam) => innerNames(p.init), params),
          innerNames(body),
        ),
      ),
    )
    .with({ _tag: "ECall" }, ({ fn, args }) =>
      _Array_concat(innerNames(fn), _Array_flatMap(innerNames, args)),
    )
    .with({ _tag: "EPipe" }, ({ left: l, right: r }) => _Array_concat(innerNames(l), innerNames(r)))
    .with({ _tag: "EDo" }, ({ exprs }) => _Array_flatMap(innerNames, exprs))
    .with({ _tag: "ETernary" }, ({ cond: c, thenE: t, elseE: f }) =>
      _Array_concat(innerNames(c), _Array_concat(innerNames(t), innerNames(f))),
    )
    .with({ _tag: "ERecord" }, ({ fields, spread }) =>
      _Array_concat(
        match(spread)
          .with({ _tag: "Some" }, ({ value: s }) => innerNames(s))
          .with({ _tag: "None" }, () => [] as string[])
          .exhaustive(),
        _Array_flatMap((f: Field) => innerNames(f.value), fields),
      ),
    )
    .with({ _tag: "EField" }, ({ target }) => innerNames(target))
    .with({ _tag: "ETuple" }, ({ elements: els }) => _Array_flatMap(innerNames, els))
    .with({ _tag: "EArr" }, ({ elements: els }) =>
      _Array_flatMap((el: SeqElem) => innerNames(seqElemExpr(el)), els),
    )
    .with({ _tag: "EList" }, ({ elements: els }) =>
      _Array_flatMap((el: SeqElem) => innerNames(seqElemExpr(el)), els),
    )
    .with({ _tag: "ESet" }, ({ elements: els }) =>
      _Array_flatMap((el: SeqElem) => innerNames(seqElemExpr(el)), els),
    )
    .with({ _tag: "EMap" }, ({ entries }) =>
      _Array_flatMap(
        (en: MapEntry) => _Array_concat(innerNames(en.key), innerNames(en.value)),
        entries,
      ),
    )
    .with({ _tag: "ERecur" }, ({ args }) => _Array_flatMap(innerNames, args))
    .with({ _tag: "EInterp" }, ({ parts }) =>
      _Array_flatMap(
        (p: InterpPart) =>
          match(p)
            .with({ _tag: "IPLit" }, () => [] as string[])
            .with({ _tag: "IPExpr" }, ({ expr: ex }) => innerNames(ex))
            .exhaustive(),
        parts,
      ),
    )
    .otherwise(() => [] as string[]);
const stmtInnerNames: (s: Stmt) => string[] = (s: Stmt) =>
  match(s)
    .with({ _tag: "SLet" }, ({ value }) => innerNames(value))
    .with({ _tag: "SExpr" }, ({ value }) => innerNames(value))
    .with({ _tag: "SImport" }, ({ names }) => map((n: Name) => n.name, names))
    .with({ _tag: "SImportNs" }, ({ alias }) => [alias.name])
    .otherwise(() => [] as string[]);
const topLevelNames: (stmts: Stmt[]) => string[] = (stmts: Stmt[]) =>
  _Array_flatMap(
    (s: Stmt) =>
      match(s)
        .with({ _tag: "SLet" }, ({ name }) => [name])
        .with({ _tag: "SExtern" }, ({ name }) => [name])
        .otherwise(() => [] as string[]),
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
        : match(runtimeArityOf(name))
            .with({ _tag: "Some" }, ({ value: n }) => _Map_set(name, n, acc))
            .with({ _tag: "None" }, () => acc)
            .exhaustive(),
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
      match(s)
        .with({ _tag: "SLet" }, ({ name, value }) =>
          _Set_has(name, innerBound)
            ? _Map_delete(name, acc)
            : ((n: number) => (n >= 2 ? _Map_set(name, n, acc) : _Map_delete(name, acc)))(
                collapsedArity(value),
              ),
        )
        .with({ _tag: "SExtern" }, ({ name }) => _Map_delete(name, acc))
        .otherwise(() => acc),
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
  match(e)
    .with({ _tag: "ERef" }, () => true)
    .with({ _tag: "ENum" }, () => true)
    .with({ _tag: "EBool" }, () => true)
    .with({ _tag: "EStr" }, () => true)
    .with({ _tag: "EUnit" }, () => true)
    .with({ _tag: "EField" }, ({ target }) => isInert(target))
    .otherwise(() => false);
const mentionsRef: _Curry<[e: Expr, name: string], boolean> = _curry(2, (e: Expr, name: string) =>
  match(e)
    .with({ _tag: "ERef" }, ({ name: n }) => eq(n, name))
    .with({ _tag: "EField" }, ({ target }) => mentionsRef(target, name))
    .otherwise(() => false),
);
/**
 * Flat arity of a ref or namespace member, or None when ADR 0065 cannot see it.
 */
const calleeArity: _Curry<[ctx: Ctx, fn: Expr], Option<number>> = _curry(2, (ctx: Ctx, fn: Expr) =>
  match(fn)
    .with({ _tag: "ERef" }, ({ name }) => _Map_get(name, ctx.flatArity))
    .with({ _tag: "EField" }, ({ target, name: member }) =>
      namespaceArity(ctx.shadowed, target, member),
    )
    .otherwise(() => None as Option<number>),
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
    match(fn)
      .with({ _tag: "ERef" }, ({ name }) =>
        _Set_has(name, ctx.shadowed) ? (None as Option<number>) : runtimeArityOf(name),
      )
      .with({ _tag: "EField" }, ({ target, name: member }) =>
        namespaceArity(ctx.shadowed, target, member),
      )
      .otherwise(() => None as Option<number>),
);
const PIPE_PREC: number = 5;
const FAST_PIPE_PREC: number = 21;
const NEQ_PREC: number = 8;
const CONCAT_PREC: number = 10;
const binOpInfo: (name: string) => Option<{ symbol: string; prec: number }> = (name: string) =>
  match(name)
    .with("or", () => Some({ symbol: "||", prec: 7 }) as Option<{ symbol: string; prec: number }>)
    .with("and", () => Some({ symbol: "&&", prec: 7 }) as Option<{ symbol: string; prec: number }>)
    .with("eq", () => Some({ symbol: "==", prec: 8 }) as Option<{ symbol: string; prec: number }>)
    .with("lt", () => Some({ symbol: "<", prec: 8 }) as Option<{ symbol: string; prec: number }>)
    .with("lte", () => Some({ symbol: "<=", prec: 8 }) as Option<{ symbol: string; prec: number }>)
    .with("gt", () => Some({ symbol: ">", prec: 8 }) as Option<{ symbol: string; prec: number }>)
    .with("gte", () => Some({ symbol: ">=", prec: 8 }) as Option<{ symbol: string; prec: number }>)
    .with(
      "concat",
      () => Some({ symbol: "++", prec: 10 }) as Option<{ symbol: string; prec: number }>,
    )
    .with("add", () => Some({ symbol: "+", prec: 10 }) as Option<{ symbol: string; prec: number }>)
    .with("sub", () => Some({ symbol: "-", prec: 10 }) as Option<{ symbol: string; prec: number }>)
    .with("mul", () => Some({ symbol: "*", prec: 20 }) as Option<{ symbol: string; prec: number }>)
    .with("div", () => Some({ symbol: "/", prec: 20 }) as Option<{ symbol: string; prec: number }>)
    .with("mod", () => Some({ symbol: "%", prec: 20 }) as Option<{ symbol: string; prec: number }>)
    .otherwise(() => None as Option<{ symbol: string; prec: number }>);
const isLambdaExpr: (e: Expr) => boolean = (e: Expr) =>
  match(e)
    .with({ _tag: "ELambda" }, () => true)
    .otherwise(() => false);
/**
 * False when the lambda eta-contracts to a partial: it then prints as a call,
 * which needs no parens. Keeping this in step with `lambdaD` is what makes the
 * layout a fixpoint (ADR 0091).
 */
const printsAsLambda: _Curry<[cts: Ctx, e: Expr], boolean> = _curry(2, (cts: Ctx, e: Expr) =>
  match(e)
    .with({ _tag: "ELambda" }, ({ params, body }) =>
      or(cts.etaSkip, _Option_isNone(etaPartial(cts, params, body))),
    )
    .otherwise(() => false),
);
/**
 * Forced parens for an infix operand: a lambda or ternary binds looser than
 * any operator. A pipe is NOT here — it carries a precedence of its own.
 */
const isLambdaOrTernary: _Curry<[cts: Ctx, e: Expr], boolean> = _curry(2, (cts: Ctx, e: Expr) =>
  match(e)
    .with({ _tag: "ETernary" }, () => true)
    .otherwise(() => printsAsLambda(cts, e)),
);
const binOpFor: _Curry<[fn: Expr, args: Expr[]], Option<{ symbol: string; prec: number }>> = _curry(
  2,
  (fn: Expr, args: Expr[]) =>
    match(_tuple(fn, args))
      .with(
        (_v): _v is [Extract<[Expr, Expr[]][0], { _tag: "ERef" }>, [Expr, Expr[]][1]] => {
          const _g: any = _v;
          return _g[0]._tag === "ERef" && _g[1].length === 2;
        },
        ([{ name }]) => binOpInfo(name),
      )
      .otherwise(() => None as Option<{ symbol: string; prec: number }>),
);
const binOpOf: (e: Expr) => Option<{ symbol: string; prec: number }> = (e: Expr) =>
  match(e)
    .with({ _tag: "ECall" }, ({ fn, args }) => binOpFor(fn, args))
    .otherwise(() => None as Option<{ symbol: string; prec: number }>);
const unaryOpOf: (name: string) => Option<string> = (name: string) =>
  match(name)
    .with("not", () => Some("!") as Option<string>)
    .with("negate", () => Some("-") as Option<string>)
    .otherwise(() => None as Option<string>);
const pipePrecOf: (e: Expr) => Option<number> = (e: Expr) =>
  match(e)
    .with(
      { _tag: "EPipe" },
      ({ fast }) => Some(fast ? FAST_PIPE_PREC : PIPE_PREC) as Option<number>,
    )
    .otherwise(() => None as Option<number>);
/**
 * `!=` desugars to `not(eq(a, b))`, and an explicit `!(a == b)` desugars to the
 * exact same shape — so folding either back to `!=` is a deliberate (lossy)
 * simplification, in the same spirit as the composition re-fold.
 */
const neqFor: _Curry<[fn: Expr, args: Expr[]], Option<[Expr, Expr]>> = _curry(
  2,
  (fn: Expr, args: Expr[]) =>
    match(_tuple(fn, args))
      .with(
        (
          _v,
        ): _v is [
          Extract<[Expr, Expr[]][0], { _tag: "ERef" }>,
          [
            Extract<[Expr, Expr[]][1][number], { _tag: "ECall" }> & {
              fn: Extract<
                Extract<[Expr, Expr[]][1][number], { _tag: "ECall" }>["fn"],
                { _tag: "ERef" }
              >;
            },
          ],
        ] => {
          const _g: any = _v;
          return (
            _g[0]._tag === "ERef" &&
            _g[0].name === "not" &&
            _g[1].length === 1 &&
            _g[1][0]._tag === "ECall" &&
            _g[1][0].fn._tag === "ERef" &&
            _g[1][0].fn.name === "eq" &&
            _g[1][0].args.length === 2
          );
        },
        ([
          ,
          [
            {
              args: [l, r],
            },
          ],
        ]) => Some(_tuple(l, r)) as Option<[Expr, Expr]>,
      )
      .otherwise(() => None as Option<[Expr, Expr]>),
);
const neqOperands: (e: Expr) => Option<[Expr, Expr]> = (e: Expr) =>
  match(e)
    .with({ _tag: "ECall" }, ({ fn, args }) => neqFor(fn, args))
    .otherwise(() => None as Option<[Expr, Expr]>);
const infixPrec: (e: Expr) => Option<number> = (e: Expr) =>
  match(pipePrecOf(e))
    .with({ _tag: "Some" }, ({ value: p }) => Some(p) as Option<number>)
    .with({ _tag: "None" }, () =>
      match(binOpOf(e))
        .with({ _tag: "Some" }, ({ value: info }) => Some(info.prec) as Option<number>)
        .with({ _tag: "None" }, () =>
          match(neqOperands(e))
            .with({ _tag: "Some" }, () => Some(NEQ_PREC) as Option<number>)
            .with({ _tag: "None" }, () => None as Option<number>)
            .exhaustive(),
        )
        .exhaustive(),
    )
    .exhaustive();
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
      : match(infixPrec(e))
          .with({ _tag: "Some" }, ({ value: prec }) =>
            parenIf(isRight ? prec <= parentPrec : prec < parentPrec, exprD(cts, e)),
          )
          .with({ _tag: "None" }, () => exprD(cts, e))
          .exhaustive(),
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
      : match(infixPrec(e))
          .with({ _tag: "Some" }, ({ value: prec }) => parenIf(prec < parentPrec, exprD(cts, e)))
          .with({ _tag: "None" }, () => exprD(cts, e))
          .exhaustive(),
);
/**
 * `++` is left-associative (`concat(concat(a, b), c)`); flatten it like `|>` so
 * a long string build breaks one segment per line instead of overflowing.
 */
const concatSegmentsFrom: _Curry<[e: Expr, acc: Expr[]], Expr[]> = _curry(
  2,
  (e: Expr, acc: Expr[]) =>
    match(e)
      .with(
        (
          _v,
        ): _v is Extract<Expr, { _tag: "ECall" }> & {
          fn: Extract<Extract<Expr, { _tag: "ECall" }>["fn"], { _tag: "ERef" }>;
        } => {
          const _g: any = _v;
          return (
            _g._tag === "ECall" &&
            _g.fn._tag === "ERef" &&
            _g.fn.name === "concat" &&
            _g.args.length === 2
          );
        },
        ({ args: [l, r] }) => concatSegmentsFrom(l, _Array_prepend(r, acc)),
      )
      .otherwise(() => _Array_prepend(e, acc)),
);
const concatD: _Curry<[cts: Ctx, l: Expr, r: Expr], Doc> = _curry(3, (cts: Ctx, l: Expr, r: Expr) =>
  match(concatSegmentsFrom(l, [r]))
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => txt(""),
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([head, ...rest]) =>
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
        ),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const binaryD: _Curry<[cts: Ctx, fn: Expr, args: Expr[]], Option<Doc>> = _curry(
  3,
  (cts: Ctx, fn: Expr, args: Expr[]) =>
    match(neqFor(fn, args))
      .with(
        (_v): _v is Extract<Option<[Expr, Expr]>, { _tag: "Some" }> => {
          const _g: any = _v;
          return _g._tag === "Some";
        },
        ({ value: [l, r] }) =>
          Some(
            group(
              cat([
                binOperandD(cts, l, NEQ_PREC, false),
                txt(" != "),
                binOperandD(cts, r, NEQ_PREC, true),
              ]),
            ),
          ) as Option<Doc>,
      )
      .with({ _tag: "None" }, () =>
        match(binOpFor(fn, args))
          .with({ _tag: "None" }, () => None as Option<Doc>)
          .with({ _tag: "Some" }, ({ value: info }) =>
            match(args)
              .with(
                (_v) => {
                  const _g: any = _v;
                  return _g.length === 2;
                },
                ([l, r]) =>
                  eq(info.symbol, "++")
                    ? (Some(concatD(cts, l, r)) as Option<Doc>)
                    : (Some(
                        group(
                          cat([
                            binOperandD(cts, l, info.prec, false),
                            txt(` ${info.symbol} `),
                            binOperandD(cts, r, info.prec, true),
                          ]),
                        ),
                      ) as Option<Doc>),
              )
              .otherwise(() => None as Option<Doc>),
          )
          .exhaustive(),
      )
      .exhaustive(),
);
/**
 * `not(x)` → `!x`, `negate(x)` → `-x`. Unary binds tighter than every infix
 * operator (its operand parses at atom level), so an operator-shaped operand
 * always needs parens regardless of precedence.
 */
const unaryD: _Curry<[cts: Ctx, fn: Expr, args: Expr[]], Option<Doc>> = _curry(
  3,
  (cts: Ctx, fn: Expr, args: Expr[]) =>
    match(_tuple(fn, args))
      .with(
        (_v): _v is [Extract<[Expr, Expr[]][0], { _tag: "ERef" }>, [Expr, Expr[]][1]] => {
          const _g: any = _v;
          return _g[0]._tag === "ERef" && _g[1].length === 1;
        },
        ([{ name }, [operand]]) =>
          match(unaryOpOf(name))
            .with({ _tag: "None" }, () => None as Option<Doc>)
            .with({ _tag: "Some" }, ({ value: symbol }) =>
              ((forced: boolean) =>
                Some(cat([txt(symbol), parenIf(forced, exprD(cts, operand))])) as Option<Doc>)(
                or(
                  or(loosePrefix(cts, operand), _Option_isSome(binOpOf(operand))),
                  _Option_isSome(neqOperands(operand)),
                ),
              ),
            )
            .exhaustive(),
      )
      .otherwise(() => None as Option<Doc>),
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
    match(params)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 1;
        },
        ([only]) =>
          match(unspan(only))
            .with(
              (
                _v,
              ): _v is Extract<LamParam, { _tag: "LPName" }> & {
                annot: Extract<Extract<LamParam, { _tag: "LPName" }>["annot"], { _tag: "None" }>;
              } => {
                const _g: any = _v;
                return _g._tag === "LPName" && _g.annot._tag === "None";
              },
              ({ name }) =>
                _Str_startsWith("$", name)
                  ? (None as Option<Expr>)
                  : match(body)
                      .with({ _tag: "ECall" }, () =>
                        ((flat: Expr) =>
                          match(flat)
                            .with(
                              (
                                _v,
                              ): _v is Extract<Expr, { _tag: "ECall" }> & {
                                origin: Extract<
                                  Extract<Expr, { _tag: "ECall" }>["origin"],
                                  { _tag: "None" }
                                >;
                              } => {
                                const _g: any = _v;
                                return _g._tag === "ECall" && _g.origin._tag === "None";
                              },
                              ({ fn, args, span: sp }) =>
                                ((n: number) =>
                                  eq(n, 0)
                                    ? (None as Option<Expr>)
                                    : match(_Array_get(n - 1, args))
                                        .with(
                                          (
                                            _v,
                                          ): _v is Extract<Option<Expr>, { _tag: "Some" }> & {
                                            value: Extract<
                                              Extract<Option<Expr>, { _tag: "Some" }>["value"],
                                              { _tag: "ERef" }
                                            >;
                                          } => {
                                            const _g: any = _v;
                                            return _g._tag === "Some" && _g.value._tag === "ERef";
                                          },
                                          ({ value: { name: lastName } }) =>
                                            not(eq(lastName, name))
                                              ? (None as Option<Expr>)
                                              : ((prefix: Expr[]) =>
                                                  and(
                                                    and(
                                                      and(isInert(fn), allInert(prefix)),
                                                      not(mentionsRef(fn, name)),
                                                    ),
                                                    not(anyMentions(prefix, name)),
                                                  )
                                                    ? match(etaCalleeArity(ctx, fn))
                                                        .with(
                                                          { _tag: "Some" },
                                                          ({ value: arity }) =>
                                                            eq(n, arity)
                                                              ? (Some(
                                                                  Ast.ECall(
                                                                    fn,
                                                                    prefix,
                                                                    None as Option<string>,
                                                                    sp,
                                                                  ),
                                                                ) as Option<Expr>)
                                                              : (None as Option<Expr>),
                                                        )
                                                        .with(
                                                          { _tag: "None" },
                                                          () => None as Option<Expr>,
                                                        )
                                                        .exhaustive()
                                                    : (None as Option<Expr>))(
                                                  _Array_take(n - 1, args),
                                                ),
                                        )
                                        .otherwise(() => None as Option<Expr>))(length(args)),
                            )
                            .otherwise(() => None as Option<Expr>))(
                          match(flattenCallSpine(ctx, body))
                            .with({ _tag: "Some" }, ({ value: f }) => f)
                            .with({ _tag: "None" }, () => body)
                            .exhaustive(),
                        ),
                      )
                      .otherwise(() => None as Option<Expr>),
            )
            .otherwise(() => None as Option<Expr>),
      )
      .otherwise(() => None as Option<Expr>),
);
const allInert: (args: Expr[]) => boolean = (args: Expr[]) =>
  eq(length(filter((a: Expr) => not(isInert(a)), args)), 0);
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
    match(e)
      .with(
        (
          _v,
        ): _v is Extract<Expr, { _tag: "ECall" }> & {
          origin: Extract<Extract<Expr, { _tag: "ECall" }>["origin"], { _tag: "Some" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "ECall" && _g.origin._tag === "Some";
        },
        () => None as Option<[Expr, Expr[][]]>,
      )
      .with(
        (
          _v,
        ): _v is Extract<Expr, { _tag: "ECall" }> & {
          origin: Extract<Extract<Expr, { _tag: "ECall" }>["origin"], { _tag: "None" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "ECall" && _g.origin._tag === "None";
        },
        ({ fn, args }) => spineGroups(fn, _Array_prepend(args, acc)),
      )
      .otherwise(() => Some(_tuple(e, acc)) as Option<[Expr, Expr[][]]>),
);
const flattenCallSpine: _Curry<[ctx: Ctx, e: Expr], Option<Expr>> = _curry(2, (ctx: Ctx, e: Expr) =>
  match(spineGroups(e, [] as Expr[][]))
    .with({ _tag: "None" }, () => None as Option<Expr>)
    .with(
      (_v): _v is Extract<Option<[Expr, Expr[][]]>, { _tag: "Some" }> => {
        const _g: any = _v;
        return _g._tag === "Some";
      },
      ({ value: [head, groups] }) =>
        (([callee, allGroups]: [Expr, Expr[][]]) =>
          or(length(allGroups) < 2, anyEmptyGroup(allGroups))
            ? (None as Option<Expr>)
            : match(calleeArity(ctx, callee))
                .with({ _tag: "None" }, () => None as Option<Expr>)
                .with({ _tag: "Some" }, ({ value: arity }) =>
                  ((args: Expr[]) =>
                    or(length(args) > arity, anyUnit(args))
                      ? (None as Option<Expr>)
                      : (Some(
                          Ast.ECall(callee, args, None as Option<string>, exprSpan(e)),
                        ) as Option<Expr>))(_Array_flatMap((g: Expr[]) => g, allGroups)),
                )
                .exhaustive())(
          match(head)
            .with({ _tag: "ELambda" }, ({ params, body: lbody }) =>
              match(etaPartial(ctx, params, lbody))
                .with(
                  (
                    _v,
                  ): _v is Extract<Option<Expr>, { _tag: "Some" }> & {
                    value: Extract<
                      Extract<Option<Expr>, { _tag: "Some" }>["value"],
                      { _tag: "ECall" }
                    >;
                  } => {
                    const _g: any = _v;
                    return _g._tag === "Some" && _g.value._tag === "ECall";
                  },
                  ({ value: { fn: efn, args: eargs } }) =>
                    _tuple(efn, _Array_prepend(eargs, groups)),
                )
                .otherwise(() => _tuple(head, groups)),
            )
            .otherwise(() => _tuple(head, groups)),
        ),
    )
    .exhaustive(),
);
const anyEmptyGroup: <A>(groups: A[][]) => boolean = <A>(groups: A[][]) =>
  length(filter((g: A[]) => eq(length(g), 0), groups)) > 0;
const anyUnit: (args: Expr[]) => boolean = (args: Expr[]) =>
  length(
    filter(
      (a: Expr) =>
        match(a)
          .with({ _tag: "EUnit" }, () => true)
          .otherwise(() => false),
      args,
    ),
  ) > 0;
/**
 * `($s) => op($s, y)` → `(op y)` (right section); `($s) => op(x, $s)` →
 * `(x op)` (left section) — mirrors parser.mochi's section productions.
 */
const isSectionParam: (p: LamParam) => boolean = (p: LamParam) =>
  match(unspan(p))
    .with({ _tag: "LPName", name: "$s" }, () => true)
    .otherwise(() => false);
const isRef: _Curry<[e: Expr, name: string], boolean> = _curry(2, (e: Expr, name: string) =>
  match(e)
    .with({ _tag: "ERef" }, ({ name: n }) => eq(n, name))
    .otherwise(() => false),
);
const sectionParts: (body: Expr) => Option<[{ symbol: string; prec: number }, Expr, Expr]> = (
  body: Expr,
) =>
  match(neqOperands(body))
    .with(
      (_v): _v is Extract<Option<[Expr, Expr]>, { _tag: "Some" }> => {
        const _g: any = _v;
        return _g._tag === "Some";
      },
      ({ value: [l, r] }) =>
        Some(_tuple({ symbol: "!=", prec: NEQ_PREC }, l, r)) as Option<
          [{ symbol: string; prec: number }, Expr, Expr]
        >,
    )
    .with({ _tag: "None" }, () =>
      match(binOpOf(body))
        .with(
          { _tag: "None" },
          () => None as Option<[{ symbol: string; prec: number }, Expr, Expr]>,
        )
        .with({ _tag: "Some" }, ({ value: info }) =>
          match(body)
            .with(
              (_v): _v is Extract<Expr, { _tag: "ECall" }> => {
                const _g: any = _v;
                return _g._tag === "ECall" && _g.args.length === 2;
              },
              ({ args: [l, r] }) =>
                Some(_tuple(info, l, r)) as Option<[{ symbol: string; prec: number }, Expr, Expr]>,
            )
            .otherwise(() => None as Option<[{ symbol: string; prec: number }, Expr, Expr]>),
        )
        .exhaustive(),
    )
    .exhaustive();
const sectionOf: _Curry<[cts: Ctx, params: LamParam[], body: Expr], Option<Doc>> = _curry(
  3,
  (cts: Ctx, params: LamParam[], body: Expr) =>
    match(params)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 1;
        },
        ([only]) =>
          isSectionParam(only)
            ? match(sectionParts(body))
                .with({ _tag: "None" }, () => None as Option<Doc>)
                .with(
                  (
                    _v,
                  ): _v is Extract<
                    Option<[{ symbol: string; prec: number }, Expr, Expr]>,
                    { _tag: "Some" }
                  > => {
                    const _g: any = _v;
                    return _g._tag === "Some";
                  },
                  ({ value: [info, l, r] }) =>
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
                              ) as Option<Doc>))(isRef(r, "$s")))(isRef(l, "$s")),
                )
                .exhaustive()
            : (None as Option<Doc>),
      )
      .otherwise(() => None as Option<Doc>),
);
/**
 * `($x) => g(f($x))` — the shape `>>` desugars to.
 */
const composeParts: _Curry<[params: LamParam[], body: Expr], Option<[Expr, Expr]>> = _curry(
  2,
  (params: LamParam[], body: Expr) =>
    match(_tuple(params, body))
      .with(
        (
          _v,
        ): _v is [
          [LamParam[], Expr][0],
          Extract<[LamParam[], Expr][1], { _tag: "ECall" }> & {
            args: [
              Extract<
                Extract<[LamParam[], Expr][1], { _tag: "ECall" }>["args"][number],
                { _tag: "ECall" }
              >,
            ];
          },
        ] => {
          const _g: any = _v;
          return (
            _g[0].length === 1 &&
            _g[1]._tag === "ECall" &&
            _g[1].args.length === 1 &&
            _g[1].args[0]._tag === "ECall" &&
            _g[1].args[0].args.length === 1
          );
        },
        ([
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
          match(unspan(p))
            .with({ _tag: "LPName", name: "$x" }, () =>
              isRef(inner, "$x")
                ? (Some(_tuple(left, right)) as Option<[Expr, Expr]>)
                : (None as Option<[Expr, Expr]>),
            )
            .otherwise(() => None as Option<[Expr, Expr]>),
      )
      .otherwise(() => None as Option<[Expr, Expr]>),
);
/**
 * `>>` is left-associative, so `a >> b >> c` nests to the left; flatten it.
 */
const composeSegmentsFrom: _Curry<[e: Expr, acc: Expr[]], Expr[]> = _curry(
  2,
  (e: Expr, acc: Expr[]) =>
    match(e)
      .with({ _tag: "ELambda" }, ({ params, body }) =>
        match(composeParts(params, body))
          .with(
            (_v): _v is Extract<Option<[Expr, Expr]>, { _tag: "Some" }> => {
              const _g: any = _v;
              return _g._tag === "Some";
            },
            ({ value: [left, right] }) => composeSegmentsFrom(left, _Array_prepend(right, acc)),
          )
          .with({ _tag: "None" }, () => _Array_prepend(e, acc))
          .exhaustive(),
      )
      .otherwise(() => _Array_prepend(e, acc)),
);
/**
 * A destructuring `let (a, b) = e in body` reaches the printer as the IIFE the
 * parser desugared it to; fold it back. Kept in step with `printsAsLet`.
 */
const destructureLetD: _Curry<[cts: Ctx, fn: Expr, args: Expr[]], Option<Doc>> = _curry(
  3,
  (cts: Ctx, fn: Expr, args: Expr[]) =>
    match(_tuple(fn, args))
      .with(
        (_v): _v is [Extract<[Expr, Expr[]][0], { _tag: "ELambda" }>, [Expr, Expr[]][1]] => {
          const _g: any = _v;
          return _g[0]._tag === "ELambda" && _g[0].params.length === 1 && _g[1].length === 1;
        },
        ([
          {
            params: [p],
            body: lbody,
          },
          [value],
        ]) =>
          match(unspan(p))
            .with({ _tag: "LPName" }, () => None as Option<Doc>)
            .otherwise(
              () => Some(letLikeD(cts, `let ${paramText(cts, p)}`, value, lbody)) as Option<Doc>,
            ),
      )
      .otherwise(() => None as Option<Doc>),
);
const refoldCall: _Curry<[cts: Ctx, fn: Expr, args: Expr[]], Option<Doc>> = _curry(
  3,
  (cts: Ctx, fn: Expr, args: Expr[]) =>
    match(destructureLetD(cts, fn, args))
      .with({ _tag: "Some" }, ({ value: d }) => Some(d) as Option<Doc>)
      .with({ _tag: "None" }, () =>
        match(binaryD(cts, fn, args))
          .with({ _tag: "Some" }, ({ value: d }) => Some(d) as Option<Doc>)
          .with({ _tag: "None" }, () => unaryD(cts, fn, args))
          .exhaustive(),
      )
      .exhaustive(),
);
/**
 * `f(~tone="amber")` — a labeled call is lowered to a record argument tagged
 * `origin: "labeled"` (ADR 0098 §2); print the labels back.
 */
const labeledFieldD: _Curry<[cts: Ctx, f: Field], Doc> = _curry(2, (cts: Ctx, f: Field) =>
  match(f.value)
    .with(
      (_v): _v is Extract<Expr, { _tag: "ERef" }> => {
        const _g: any = _v;
        return _g._tag === "ERef" && (({ name }) => eq(name, f.name))(_g);
      },
      ({ name }) => txt(`~${f.name}`),
    )
    .otherwise(() => cat([txt(`~${f.name}=`), exprD(cts, f.value)])),
);
const callArgDocs: _Curry<[cts: Ctx, args: Expr[], origin: Option<string>], Doc[]> = _curry(
  3,
  (cts: Ctx, args: Expr[], origin: Option<string>) =>
    match(origin)
      .with({ _tag: "Some", value: "labeled" }, () =>
        match(_Array_get(length(args) - 1, args))
          .with(
            (
              _v,
            ): _v is Extract<Option<Expr>, { _tag: "Some" }> & {
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
            } => {
              const _g: any = _v;
              return (
                _g._tag === "Some" && _g.value._tag === "ERecord" && _g.value.spread._tag === "None"
              );
            },
            ({ value: { fields } }) =>
              _Array_concat(
                map((x: Expr) => exprD(cts, x), _Array_take(length(args) - 1, args)),
                map((f: Field) => labeledFieldD(cts, f), fields),
              ),
          )
          .otherwise(() => map((x: Expr) => exprD(cts, x), args)),
      )
      .otherwise(() => map((x: Expr) => exprD(cts, x), args)),
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
    const ann: string = match(annot)
      .with({ _tag: "Some" }, ({ value: te }) => `: ${showTypeExpr(te)}`)
      .with({ _tag: "None" }, () => "")
      .exhaustive();
    const def: string = match(defaultValue)
      .with({ _tag: "Some" }, ({ value: d }) => ` = ${flat(exprD(cts, d))}`)
      .with({ _tag: "None" }, () => "")
      .exhaustive();
    return `~${name}${optional ? "?" : ""}${ann}${def}`;
  },
);
const paramText: _Curry<[cts: Ctx, p: LamParam], string> = _curry(2, (cts: Ctx, p: LamParam) =>
  match(unspan(p))
    .with({ _tag: "LPName" }, ({ name, annot }) =>
      match(annot)
        .with({ _tag: "Some" }, ({ value: te }) => `${name}: ${showTypeExpr(te)}`)
        .with({ _tag: "None" }, () => name)
        .exhaustive(),
    )
    .with({ _tag: "LPTuple" }, ({ names }) => `(${_Str_join(", ", names)})`)
    .with({ _tag: "LPRecord" }, ({ fields }) => `{ ${_Str_join(", ", fields)} }`)
    .with({ _tag: "LPLabeled" }, ({ name, annot, optional, defaultValue }) =>
      labeledParamText(cts, name, annot, optional, defaultValue),
    )
    .with({ _tag: "LPSpanned" }, () => "")
    .exhaustive(),
);
/**
 * A lone un-annotated name drops its parens (`x => …`); annotations and every
 * other shape keep them (`(x: number) => …`, `(a, b) => …`, `({ x }) => …`).
 */
const paramsText: _Curry<[cts: Ctx, ps: LamParam[]], string> = _curry(
  2,
  (cts: Ctx, ps: LamParam[]) =>
    match(ps)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 1;
        },
        ([only]) =>
          match(unspan(only))
            .with(
              (
                _v,
              ): _v is Extract<LamParam, { _tag: "LPName" }> & {
                annot: Extract<Extract<LamParam, { _tag: "LPName" }>["annot"], { _tag: "None" }>;
              } => {
                const _g: any = _v;
                return _g._tag === "LPName" && _g.annot._tag === "None";
              },
              ({ name }) => name,
            )
            .otherwise(() => `(${commaJoin((p: LamParam) => paramText(cts, p), ps)})`),
      )
      .otherwise(() => `(${commaJoin((p: LamParam) => paramText(cts, p), ps)})`),
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
            match(p)
              .with({ _tag: "IPLit" }, ({ value }) => escStrBody(value))
              .with({ _tag: "IPExpr" }, ({ expr: ex }) => hole(ex))
              .exhaustive(),
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
    match(e)
      .with({ _tag: "ELetIn", name: "_" }, ({ value, body }) =>
        discardedFrom(body, _Array_append(value, acc)),
      )
      .otherwise(() =>
        eq(length(acc), 0)
          ? (None as Option<Expr[]>)
          : (Some(_Array_append(e, acc)) as Option<Expr[]>),
      ),
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
    match(sectionOf(cts, params, body))
      .with({ _tag: "Some" }, ({ value: section }) => section)
      .with({ _tag: "None" }, () =>
        match(cts.etaSkip ? (None as Option<Expr>) : etaPartial(cts, params, body))
          .with({ _tag: "Some" }, ({ value: eta }) => exprD(cts, eta))
          .with({ _tag: "None" }, () =>
            match(composeParts(params, body))
              .with({ _tag: "Some" }, () =>
                match(
                  composeSegmentsFrom(
                    Ast.ELambda(params, body, { start: 0, end: 0 }),
                    [] as Expr[],
                  ),
                )
                  .with(
                    (_v) => {
                      const _g: any = _v;
                      return _g.length === 0;
                    },
                    () => txt(""),
                  )
                  .with(
                    (_v) => {
                      const _g: any = _v;
                      return _g.length >= 1;
                    },
                    ([head, ...rest]) =>
                      group(
                        cat([
                          operandD(cts, head),
                          indent(
                            cat(map((s: Expr) => cat([line, txt(">> "), operandD(cts, s)]), rest)),
                          ),
                        ]),
                      ),
                  )
                  .otherwise(() => {
                    throw new Error("non-exhaustive match");
                  }),
              )
              .with({ _tag: "None" }, () =>
                plainLambdaD({ ...cts, etaSkip: isLambdaExpr(body) }, params, body),
              )
              .exhaustive(),
          )
          .exhaustive(),
      )
      .exhaustive(),
);
const plainLambdaD: _Curry<[cts: Ctx, params: LamParam[], body: Expr], Doc> = _curry(
  3,
  (cts: Ctx, params: LamParam[], body: Expr) => {
    const head: Doc = txt(`${paramsText(cts, params)} =>`);
    return match(body)
      .with({ _tag: "EDo" }, ({ exprs }) => cat([head, txt(" "), doBlockD(cts, exprs)]))
      .otherwise(() =>
        match(discardedLetExprs(body))
          .with({ _tag: "Some" }, ({ value: exprs }) => cat([head, txt(" "), doBlockD(cts, exprs)]))
          .with({ _tag: "None" }, () =>
            match(body)
              .with(
                (_v): _v is Extract<Expr, { _tag: "EMatch" }> => {
                  const _g: any = _v;
                  return _g._tag === "EMatch" && not(hasLead(cts, EXPR, exprSpan(body)));
                },
                () => cat([head, txt(" "), exprD(cts, body)]),
              )
              .otherwise(() => group(cat([head, indent(cat([line, exprD(cts, body)]))]))),
          )
          .exhaustive(),
      );
  },
);
const condD: _Curry<[cts: Ctx, c: Expr], Doc> = _curry(2, (cts: Ctx, c: Expr) =>
  match(c)
    .with({ _tag: "ETernary" }, () => cat([txt("("), exprD(cts, c), txt(")")]))
    .otherwise(() => exprD(cts, c)),
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
  match(e)
    .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) =>
      ternaryArmsFrom(elseE, _Array_append({ cond: cond, thenE: thenE }, acc)),
    )
    .otherwise(() => _tuple(acc, e)),
);
const ternaryRestParts: _Curry<[cts: Ctx, arms: { cond: Expr; thenE: Expr }[], i: number], Doc[]> =
  _curry(3, (cts: Ctx, arms: { cond: Expr; thenE: Expr }[], i: number) =>
    match(_Array_get(i, arms))
      .with({ _tag: "None" }, () => [] as Doc[])
      .with({ _tag: "Some" }, ({ value: a }) => [
        line,
        hasLead(cts, EXPR, exprSpan(a.cond))
          ? cat([txt(":"), indent(cat([hardline, condD(cts, a.cond)]))])
          : cat([txt(": "), condD(cts, a.cond)]),
        line,
        branchD(cts, "?", a.thenE),
        ...ternaryRestParts(cts, arms, i + 1),
      ])
      .exhaustive(),
  );
/**
 * Inline when it fits; else `cond` / `? then` / `: cond` / `? then` / `: else`
 * at one indent — a flat chain, not a nested pyramid.
 */
const ternaryD: _Curry<[cts: Ctx, e: Expr], Doc> = _curry(2, (cts: Ctx, e: Expr) =>
  (([arms, elseE]: [{ cond: Expr; thenE: Expr }[], Expr]) =>
    match(_Array_get(0, arms))
      .with({ _tag: "None" }, () => txt(""))
      .with({ _tag: "Some" }, ({ value: first }) =>
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
        ),
      )
      .exhaustive())(ternaryArmsFrom(e, [] as { cond: Expr; thenE: Expr }[])),
);
/**
 * Does this expression PRINT as `let … in …`? A destructuring
 * `let (a, b) = v in body` reaches the formatter as the IIFE the parser
 * desugared it to, and the chain rule has to see through that or every
 * destructure in a chain adds an indent step.
 */
const printsAsLet: (e: Expr) => boolean = (e: Expr) =>
  match(e)
    .with({ _tag: "ELetIn" }, () => _Option_isNone(discardedLetExprs(e)))
    .with({ _tag: "ELetBind" }, () => true)
    .with(
      (
        _v,
      ): _v is Extract<Expr, { _tag: "ECall" }> & {
        fn: Extract<Extract<Expr, { _tag: "ECall" }>["fn"], { _tag: "ELambda" }>;
      } => {
        const _g: any = _v;
        return (
          _g._tag === "ECall" &&
          _g.fn._tag === "ELambda" &&
          _g.fn.params.length === 1 &&
          _g.args.length === 1
        );
      },
      ({
        fn: {
          params: [p],
        },
      }) =>
        match(unspan(p))
          .with({ _tag: "LPName" }, () => false)
          .otherwise(() => true),
    )
    .otherwise(() => false);
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
  match(f.value)
    .with(
      (_v): _v is Extract<Expr, { _tag: "ERef" }> => {
        const _g: any = _v;
        return _g._tag === "ERef" && (({ name }) => eq(name, f.name))(_g);
      },
      ({ name }) => exprD(cts, f.value),
    )
    .otherwise(() => cat([txt(`${f.name}: `), exprD(cts, f.value)])),
);
const recordD: _Curry<[cts: Ctx, fields: Field[], spread: Option<Expr>], Doc> = _curry(
  3,
  (cts: Ctx, fields: Field[], spread: Option<Expr>) => {
    const fieldDocs: Doc[] = map((f: Field) => recordFieldD(cts, f), fields);
    return braced(
      "{",
      "}",
      match(spread)
        .with({ _tag: "Some" }, ({ value: s }) =>
          _Array_prepend(cat([txt("..."), exprD(cts, s)]), fieldDocs),
        )
        .with({ _tag: "None" }, () => fieldDocs)
        .exhaustive(),
    );
  },
);
const seqElemD: _Curry<[cts: Ctx, el: SeqElem], Doc> = _curry(2, (cts: Ctx, el: SeqElem) =>
  match(el)
    .with({ _tag: "SEExpr" }, ({ expr: e }) => exprD(cts, e))
    .with({ _tag: "SESpread" }, ({ expr: e }) => cat([txt("..."), exprD(cts, e)]))
    .exhaustive(),
);
/**
 * `|>` is left-associative, so `a |> b |> c` is pipe(pipe(a, b), c); flatten it
 * back to source order. Do NOT walk into `->`: the fast pipe inserts first
 * (ADR 0069) while `|>` is data-last, so flattening a mixed chain would rewrite
 * `val->fn(a, b) |> g(c)` into `val |> fn(a, b) |> g(c)`.
 */
const pipeSegmentsFrom: _Curry<[e: Expr, acc: Expr[]], Expr[]> = _curry(2, (e: Expr, acc: Expr[]) =>
  match(e)
    .with({ _tag: "EPipe", fast: false }, ({ left, right }) =>
      pipeSegmentsFrom(left, _Array_prepend(right, acc)),
    )
    .otherwise(() => _Array_prepend(e, acc)),
);
const matchArmD: _Curry<[cts: Ctx, a: MatchArm], Doc> = _curry(2, (cts: Ctx, a: MatchArm) => {
  const guard: string = match(a.guard)
    .with({ _tag: "Some" }, ({ value: g }) => ` when ${flat(exprD(cts, g))}`)
    .with({ _tag: "None" }, () => "")
    .exhaustive();
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
  match(body)
    .with({ _tag: "EMatch" }, () => true)
    .with({ _tag: "ELoop" }, () => true)
    .with({ _tag: "EDo" }, () => true)
    .otherwise(() => _Option_isSome(discardedLetExprs(body)));
const callArgsD: _Curry<
  [cts: Ctx, fn: Expr, args: Expr[], origin: Option<string>, asCallee: boolean],
  Doc
> = _curry(5, (cts: Ctx, fn: Expr, args: Expr[], origin: Option<string>, asCallee: boolean) =>
  match(refoldCall(cts, fn, args))
    .with({ _tag: "Some" }, ({ value: d }) => d)
    .with({ _tag: "None" }, () =>
      match(flattenCallSpine(cts, Ast.ECall(fn, args, origin, { start: 0, end: 0 })))
        .with(
          (
            _v,
          ): _v is Extract<Option<Expr>, { _tag: "Some" }> & {
            value: Extract<Extract<Option<Expr>, { _tag: "Some" }>["value"], { _tag: "ECall" }>;
          } => {
            const _g: any = _v;
            return _g._tag === "Some" && _g.value._tag === "ECall";
          },
          ({ value: { fn: ffn, args: fargs, origin: forigin } }) =>
            plainCallD(cts, ffn, fargs, forigin, asCallee),
        )
        .otherwise(() => plainCallD(cts, fn, args, origin, asCallee)),
    )
    .exhaustive(),
);
const plainCallD: _Curry<
  [cts: Ctx, fn: Expr, args: Expr[], origin: Option<string>, asCallee: boolean],
  Doc
> = _curry(5, (cts: Ctx, fn: Expr, args: Expr[], origin: Option<string>, asCallee: boolean) => {
  const fnD: Doc = calleeD(cts, fn);
  return match(args)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => cat([fnD, txt("()")]),
    )
    .with(
      (_v): _v is [Extract<Expr[][number], { _tag: "ETuple" }>] => {
        const _g: any = _v;
        return _g.length === 1 && _g[0]._tag === "ETuple";
      },
      ([{ elements, span: tsp }]) =>
        group(cat([fnD, txt("("), exprD(cts, Ast.ETuple(elements, tsp)), txt(")")])),
    )
    .otherwise(() =>
      ((argDocs: Doc[]) =>
        match(_Array_get(length(args) - 1, args))
          .with(
            (
              _v,
            ): _v is Extract<Option<Expr>, { _tag: "Some" }> & {
              value: Extract<Extract<Option<Expr>, { _tag: "Some" }>["value"], { _tag: "ELambda" }>;
            } => {
              const _g: any = _v;
              return _g._tag === "Some" && _g.value._tag === "ELambda";
            },
            ({ value: { body: lbody } }) =>
              group(
                cat([
                  fnD,
                  txt("("),
                  join(txt(", "), argDocs),
                  or(lastArgHugs(lbody), not(asCallee)) ? txt(")") : cat([softline, txt(")")]),
                ]),
              ),
          )
          .otherwise(() =>
            cat([
              fnD,
              group(
                cat([
                  txt("("),
                  indent(cat([softline, join(cat([txt(","), line]), argDocs)])),
                  softline,
                  txt(")"),
                ]),
              ),
            ]),
          ))(callArgDocs(cts, args, origin)),
    );
});
const callD: _Curry<[cts: Ctx, fn: Expr, args: Expr[], origin: Option<string>], Doc> = _curry(
  4,
  (cts: Ctx, fn: Expr, args: Expr[], origin: Option<string>) =>
    callArgsD(cts, fn, args, origin, false),
);
const calleeD: _Curry<[cts: Ctx, e: Expr], Doc> = _curry(2, (cts: Ctx, e: Expr) =>
  match(e)
    .with({ _tag: "ECall" }, ({ fn, args, origin }) => callArgsD(cts, fn, args, origin, true))
    .otherwise(() => parenIf(loosePrefix(cts, e), exprD(cts, e))),
);
const operandD: _Curry<[cts: Ctx, e: Expr], Doc> = _curry(2, (cts: Ctx, e: Expr) =>
  parenIf(loosePrefix(cts, e), exprD(cts, e)),
);
/**
 * A record in member position is ambiguous with a block, so it parenthesizes
 * where a callee would not.
 */
const memberD: _Curry<[cts: Ctx, e: Expr], Doc> = _curry(2, (cts: Ctx, e: Expr) =>
  match(e)
    .with({ _tag: "ERecord" }, () => cat([txt("("), exprD(cts, e), txt(")")]))
    .otherwise(() => parenIf(loosePrefix(cts, e), exprD(cts, e))),
);
/**
 * Inline when it fits, else one `|> stage` per line indented under the head.
 */
const pipeD: _Curry<[cts: Ctx, e: Expr], Doc> = _curry(2, (cts: Ctx, e: Expr) =>
  match(e)
    .with(
      (
        _v,
      ): _v is Extract<Expr, { _tag: "EPipe" }> & {
        right: Extract<Extract<Expr, { _tag: "EPipe" }>["right"], { _tag: "ECall" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "EPipe" && _g.right._tag === "ECall" && _g.fast === true;
      },
      ({ left, right: { fn: rfn, args: rargs, origin: rorigin } }) =>
        cat([pipeLeftD(cts, left, FAST_PIPE_PREC), txt("->"), callD(cts, rfn, rargs, rorigin)]),
    )
    .otherwise(() =>
      ((segments: Expr[]) =>
        match(segments)
          .with(
            (_v) => {
              const _g: any = _v;
              return _g.length === 0;
            },
            () => txt(""),
          )
          .with(
            (_v) => {
              const _g: any = _v;
              return _g.length >= 1;
            },
            ([head, ...rest]) =>
              group(
                cat([
                  pipeLeftD(cts, head, PIPE_PREC),
                  indent(cat(map((s: Expr) => cat([line, txt("|> "), operandD(cts, s)]), rest))),
                ]),
              ),
          )
          .otherwise(() => {
            throw new Error("non-exhaustive match");
          }))(pipeSegmentsFrom(e, [] as Expr[])),
    ),
);
const letBindHead: _Curry<[cts: Ctx, monad: string, param: LamParam], string> = _curry(
  3,
  (cts: Ctx, monad: string, param: LamParam) =>
    `let${eq(monad, "Task") ? "!" : "?"} ${paramText(cts, param)}`,
);
const exprRaw: _Curry<[cts: Ctx, e: Expr], Doc> = _curry(2, (cts: Ctx, e: Expr) =>
  match(e)
    .with({ _tag: "ENum" }, ({ raw }) => txt(raw))
    .with({ _tag: "EUnit" }, () => txt("()"))
    .with({ _tag: "EBool" }, ({ value }) => txt(show(value)))
    .with({ _tag: "EStr" }, ({ value }) => txt(strLit(value)))
    .with({ _tag: "EInterp" }, ({ parts }) => txt(interpText(cts, parts)))
    .with({ _tag: "ERef" }, ({ name }) => txt(name))
    .with({ _tag: "ECall" }, ({ fn, args, origin }) => callD(cts, fn, args, origin))
    .with({ _tag: "ELambda" }, ({ params, body }) => lambdaD(cts, params, body))
    .with({ _tag: "EPipe" }, () => pipeD(cts, e))
    .with({ _tag: "EDo" }, ({ exprs }) => doD(cts, exprs))
    .with({ _tag: "ETernary" }, () => ternaryD(cts, e))
    .with({ _tag: "ERecord" }, ({ fields, spread }) => recordD(cts, fields, spread))
    .with({ _tag: "EField" }, ({ target, name }) => cat([memberD(cts, target), txt(`.${name}`)]))
    .with({ _tag: "EMatch" }, ({ scrutinee, arms }) => matchD(cts, scrutinee, arms))
    .with({ _tag: "ELetIn" }, ({ name, annot, value, body }) =>
      match(discardedLetExprs(e))
        .with({ _tag: "Some" }, ({ value: exprs }) => doD(cts, exprs))
        .with({ _tag: "None" }, () =>
          ((ann: string) => letLikeD(cts, `let ${name}${ann}`, value, body))(
            match(annot)
              .with({ _tag: "Some" }, ({ value: te }) => ` : ${showTypeExpr(te)}`)
              .with({ _tag: "None" }, () => "")
              .exhaustive(),
          ),
        )
        .exhaustive(),
    )
    .with({ _tag: "ELetBind" }, ({ param, monad, value, body }) =>
      letLikeD(cts, letBindHead(cts, monad, param), value, body),
    )
    .with({ _tag: "ELoop" }, ({ params, body }) => loopD(cts, params, body))
    .with({ _tag: "ERecur" }, ({ args }) =>
      cat([
        txt("recur"),
        bracketed(
          "(",
          ")",
          map((x: Expr) => exprD(cts, x), args),
        ),
      ]),
    )
    .with({ _tag: "ETuple" }, ({ elements }) =>
      bracketed(
        "(",
        ")",
        map((x: Expr) => exprD(cts, x), elements),
      ),
    )
    .with({ _tag: "EArr" }, ({ elements }) =>
      bracketed(
        "[",
        "]",
        map((el: SeqElem) => seqElemD(cts, el), elements),
      ),
    )
    .with({ _tag: "EList" }, ({ elements }) =>
      bracketed(
        "@{",
        "}",
        map((el: SeqElem) => seqElemD(cts, el), elements),
      ),
    )
    .with({ _tag: "ESet" }, ({ elements }) =>
      bracketed(
        "#{",
        "}",
        map((el: SeqElem) => seqElemD(cts, el), elements),
      ),
    )
    .with({ _tag: "EMap" }, ({ entries }) =>
      braced(
        "#{",
        "}",
        map((en: MapEntry) => cat([exprD(cts, en.key), txt(": "), exprD(cts, en.value)]), entries),
      ),
    )
    .exhaustive(),
);
const aliasFieldText: (f: QualAliasField) => string = (f: QualAliasField) =>
  `${f.name}${f.optional ? "?" : ""}: ${showTypeExpr(f.fieldType)}`;
const ctorArms: _Curry<[cts: Ctx, ctors: CtorLike[], i: number], Doc[]> = _curry(
  3,
  (cts: Ctx, ctors: CtorLike[], i: number) =>
    match(_Array_get(i, ctors))
      .with({ _tag: "None" }, () => [] as Doc[])
      .with({ _tag: "Some" }, ({ value: c }) =>
        _Array_prepend(
          cat([hardline, withComments(cts, CTOR, c.span, txt(`| ${ctorText(c)}`))]),
          ctorArms(cts, ctors, i + 1),
        ),
      )
      .exhaustive(),
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
    ctors: CtorLike[],
    alias: Option<QualAliasField[]>,
    aliasType: Option<TypeExpr>,
  ],
  Doc
> = _curry(
  6,
  (
    cts: Ctx,
    name: string,
    params: string[],
    ctors: CtorLike[],
    alias: Option<QualAliasField[]>,
    aliasType: Option<TypeExpr>,
  ) => {
    const head: string = `type ${name}${generics(params)}`;
    return match(alias)
      .with({ _tag: "Some" }, ({ value: fields }) =>
        cat([
          txt(`${head} = `),
          braced(
            "{",
            "}",
            map((f: QualAliasField) => txt(aliasFieldText(f)), fields),
          ),
        ]),
      )
      .with({ _tag: "None" }, () =>
        match(aliasType)
          .with({ _tag: "Some" }, ({ value: te }) => txt(`${head} = ${showTypeExpr(te)}`))
          .with({ _tag: "None" }, () =>
            eq(length(ctors), 0)
              ? txt(`extern ${head}`)
              : cat([txt(`${head} =`), indent(cat(ctorArms(cts, ctors, 0)))]),
          )
          .exhaustive(),
      )
      .exhaustive();
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
 */
export const exprD: _Curry<[cts: Ctx, e: Expr], Doc> = _curry(2, (cts: Ctx, e: Expr) =>
  withComments(cts, EXPR, exprSpan(e), exprRaw(cts, e)),
);
const expPrefix: (exported: boolean) => string = (exported: boolean) => (exported ? "export " : "");
/**
 * A field access `<tmp>.<name>` reading the given destructuring temp.
 */
const fieldOf: _Curry<[e: Expr, tmp: string], Option<string>> = _curry(2, (e: Expr, tmp: string) =>
  match(e)
    .with(
      (
        _v,
      ): _v is Extract<Expr, { _tag: "EField" }> & {
        target: Extract<Extract<Expr, { _tag: "EField" }>["target"], { _tag: "ERef" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "EField" && _g.target._tag === "ERef";
      },
      ({ target: { name: target }, name }) =>
        eq(target, tmp) ? (Some(name) as Option<string>) : (None as Option<string>),
    )
    .otherwise(() => None as Option<string>),
);
/**
 * How many of the `$d` temp's shorthand field-access lets follow it, so the
 * group re-folds into a single `let { x, y } = e`.
 */
const destructureFieldsFrom: _Curry<
  [stmts: Stmt[], j: number, tmp: string, acc: string[]],
  string[]
> = _curry(4, (stmts: Stmt[], j: number, tmp: string, acc: string[]) =>
  match(_Array_get(j, stmts))
    .with(
      (
        _v,
      ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
        value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "Some" && _g.value._tag === "SLet";
      },
      ({ value: { name, value } }) =>
        match(fieldOf(value, tmp))
          .with({ _tag: "Some" }, ({ value: f }) =>
            eq(f, name) ? destructureFieldsFrom(stmts, j + 1, tmp, _Array_append(f, acc)) : acc,
          )
          .with({ _tag: "None" }, () => acc)
          .exhaustive(),
    )
    .otherwise(() => acc),
);

/**
 * Print one statement, re-folding a `$d` destructuring temp plus its
 * field-access lets back into one `let { … } = e`. Reports how many
 * statements it consumed.
 */
const stmtDoc: _Curry<[cts: Ctx, stmts: Stmt[], i: number, src: string], StmtDoc> = _curry(
  4,
  (cts: Ctx, stmts: Stmt[], i: number, src: string) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => ({ doc: txt(""), consumed: 1 }))
      .with({ _tag: "Some" }, ({ value: s }) =>
        match(s)
          .with({ _tag: "SImport" }, ({ names, from }) => ({
            doc: importStmtD(names, from),
            consumed: 1,
          }))
          .with({ _tag: "SImportNs" }, ({ alias, from }) => ({
            doc: importNsStmtD(alias.name, from),
            consumed: 1,
          }))
          .with({ _tag: "SType" }, ({ name, params, ctors, alias, aliasType, exported }) => ({
            doc: cat([
              txt(expPrefix(exported)),
              typeStmtD(cts, name, params, ctors, alias, aliasType),
            ]),
            consumed: 1,
          }))
          .with(
            { _tag: "SExtern" },
            ({ name, params, typeExpr: te, module, imported, curried, exported }) => ({
              doc: txt(
                `${expPrefix(exported)}${externStmt(name, params, te, module, imported, curried)}`,
              ),
              consumed: 1,
            }),
          )
          .with({ _tag: "SError" }, ({ span: sp }) => ({
            doc: verbatim(_Str_slice(sp.start, sp.end, src)),
            consumed: 1,
          }))
          .with({ _tag: "SExpr" }, ({ value }) => ({ doc: exprD(cts, value), consumed: 1 }))
          .with({ _tag: "SLet" }, ({ name, annot, value, exported }) =>
            _Str_startsWith("$", name)
              ? ((fields: string[]) => ({
                  doc: cat([
                    txt(`${expPrefix(exported)}let { ${_Str_join(", ", fields)} } = `),
                    exprD(cts, value),
                  ]),
                  consumed: length(fields) + 1,
                }))(destructureFieldsFrom(stmts, i + 1, name, [] as string[]))
              : ((ann: string) => ({
                  doc: cat([txt(`${expPrefix(exported)}let ${name}${ann} = `), exprD(cts, value)]),
                  consumed: 1,
                }))(
                  match(annot)
                    .with({ _tag: "Some" }, ({ value: te }) => ` : ${showTypeExpr(te)}`)
                    .with({ _tag: "None" }, () => "")
                    .exhaustive(),
                ),
          )
          .exhaustive(),
      )
      .exhaustive(),
);
const stmtSpan: (s: Stmt) => SpanAt = (s: Stmt) =>
  match(s)
    .with({ _tag: "SLet" }, ({ span: sp }) => sp)
    .with({ _tag: "SType" }, ({ span: sp }) => sp)
    .with({ _tag: "SExtern" }, ({ span: sp }) => sp)
    .with({ _tag: "SImport" }, ({ span: sp }) => sp)
    .with({ _tag: "SImportNs" }, ({ span: sp }) => sp)
    .with({ _tag: "SExpr" }, ({ span: sp }) => sp)
    .with({ _tag: "SError" }, ({ span: sp }) => sp)
    .exhaustive();
/**
 * A blank separator between two statements: a newline, only whitespace, then
 * another newline somewhere in the source gap. Any run of blank lines
 * collapses to one; a doc comment is not whitespace, so `let a\n/// d\nlet b`
 * reads as adjacent.
 */
const blankBetweenFrom: _Curry<[s: string, i: number, seenNl: boolean], boolean> = _curry(
  3,
  (s: string, i: number, seenNl: boolean) =>
    match(_Str_get(i, s))
      .with({ _tag: "None" }, () => false)
      .with({ _tag: "Some", value: "\n" }, () => or(seenNl, blankBetweenFrom(s, i + 1, true)))
      .with({ _tag: "Some", value: " " }, () => blankBetweenFrom(s, i + 1, seenNl))
      .with({ _tag: "Some", value: "\t" }, () => blankBetweenFrom(s, i + 1, seenNl))
      .with({ _tag: "Some", value: "r" }, () => blankBetweenFrom(s, i + 1, seenNl))
      .with({ _tag: "Some" }, () => blankBetweenFrom(s, i + 1, false))
      .exhaustive(),
);
const blankBetween: (gap: string) => boolean = (gap: string) => blankBetweenFrom(gap, 0, false);
/**
 * Where a statement's rendering begins in source: its first leading comment
 * when it has one, else its own token — so a kept blank line lands before the
 * comment block rather than inside it.
 */
const anchorStart: _Curry<[cts: Ctx, s: Stmt], number> = _curry(2, (cts: Ctx, s: Stmt) => {
  const sp: SpanAt = stmtSpan(s);
  return match(_Array_get(0, atKey(cts.leading, spanKey(STMT, sp))))
    .with({ _tag: "Some" }, ({ value: c }) => c.start)
    .with({ _tag: "None" }, () => sp.start)
    .exhaustive();
});
const stmtParts: _Curry<
  [cts: Ctx, stmts: Stmt[], i: number, src: string, prevEnd: Option<number>, acc: Doc[]],
  [Doc[], Option<number>]
> = _curry(
  6,
  (cts: Ctx, stmts: Stmt[], i: number, src: string, prevEnd: Option<number>, acc: Doc[]) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => _tuple(acc, prevEnd))
      .with({ _tag: "Some" }, ({ value: cur }) =>
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
                match(_Array_get(lastIdx, stmts))
                  .with({ _tag: "Some" }, ({ value: last }) => stmtSpan(last).end)
                  .with({ _tag: "None" }, () => 0)
                  .exhaustive(),
              ))(i + printed.consumed - 1))(stmtDoc(cts, stmts, i, src)))(
          match(prevEnd)
            .with({ _tag: "None" }, () => [] as Doc[])
            .with({ _tag: "Some" }, ({ value: pe }) =>
              blankBetween(_Str_slice(pe, anchorStart(cts, cur), src))
                ? [hardline, hardline]
                : [hardline],
            )
            .exhaustive(),
        ),
      )
      .exhaustive(),
);
/**
 * Comments after the last statement have no node to attach to; they print
 * after it, keeping a blank line if the source had one.
 */
const tailParts: _Curry<[tail: Comment[], src: string, prevEnd: Option<number>], Doc[]> = _curry(
  3,
  (tail: Comment[], src: string, prevEnd: Option<number>) =>
    match(_Array_get(0, tail))
      .with({ _tag: "None" }, () => [] as Doc[])
      .with({ _tag: "Some" }, ({ value: first }) =>
        ((sep: Doc[]) =>
          _Array_append(
            join(
              hardline,
              map((c: Comment) => txt(c.text), tail),
            ),
            sep,
          ))(
          match(prevEnd)
            .with({ _tag: "None" }, () => [] as Doc[])
            .with({ _tag: "Some" }, ({ value: pe }) =>
              blankBetween(_Str_slice(pe, first.start, src)) ? [hardline, hardline] : [hardline],
            )
            .exhaustive(),
        ),
      )
      .exhaustive(),
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
const stmtAnchors: (s: Stmt) => { kind: string; sp: SpanAt }[] = (s: Stmt) =>
  _Array_append(
    { kind: STMT, sp: stmtSpan(s) },
    match(s)
      .with({ _tag: "SLet" }, ({ value }) => exprAnchors(value))
      .with({ _tag: "SExpr" }, ({ value }) => exprAnchors(value))
      .with({ _tag: "SType" }, ({ ctors }) =>
        map((c: CtorLike) => ({ kind: CTOR, sp: c.span }), ctors),
      )
      .otherwise(() => [] as { kind: string; sp: SpanAt }[]),
  );
/**
 * A comment inside an unparsable region is part of the bytes `SError` re-emits
 * verbatim; attaching it too would print it twice.
 */
const inErrorSpanFrom: _Curry<[stmts: Stmt[], i: number, c: Comment], boolean> = _curry(
  3,
  (stmts: Stmt[], i: number, c: Comment) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => false)
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SError" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SError";
        },
        ({ value: { span: sp } }) =>
          or(and(c.start >= sp.start, c.start < sp.end), inErrorSpanFrom(stmts, i + 1, c)),
      )
      .with({ _tag: "Some" }, () => inErrorSpanFrom(stmts, i + 1, c))
      .exhaustive(),
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
  match(_Array_get(0, _Str_split("\n", _Str_trim(src))))
    .with({ _tag: "Some" }, ({ value: first }) => eq(_Str_trim(first), '"use open"'))
    .with({ _tag: "None" }, () => false)
    .exhaustive();
/**
 * Print an already-parsed program with comment and blank-line fidelity to `src`.
 */
export const formatProgram: _Curry<[stmts: Stmt[], src: string], string> = _curry(
  2,
  (stmts: Stmt[], src: string) => {
    const innerBound: Set<string> = _Set_fromArray(_Array_flatMap(stmtInnerNames, stmts));
    const shadowed: Set<string> = _Set_union(innerBound, _Set_fromArray(topLevelNames(stmts)));
    const base: Ctx = {
      ...noComments,
      flatArity: buildFlatArity(stmts, innerBound),
      shadowed: shadowed,
    };
    const attached: Attached = attachFrom(
      filter((c: Comment) => not(inErrorSpan(stmts, c)), collectComments(src)),
      0,
      sortAnchors(_Array_flatMap(stmtAnchors, stmts)),
      src,
      { table: base, tail: [] as Comment[] },
    );
    const body: string = render(programDoc(attached.table, stmts, src, attached.tail), WIDTH);
    return hasOpenDirective(src)
      ? `"use open"

${body}`
      : body;
  },
);
