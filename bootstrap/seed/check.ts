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
} from "./ast";
import type { SpanAt } from "./types";
import type { PErr } from "./parser";

export type CErr = { message: string; start: number; end: number };
export type CtorInfo = { owner: string; arity: number };
export type Registry = { ctors: Map<string, CtorInfo>; types: Map<string, string[]> };
export type SeqCheck = { _tag: "SeqNotSeq" } | { _tag: "SeqTotal" } | { _tag: "SeqFail"; e: PErr };
export type QualScope = { types: Set<string> };
export type LoopFrame = { arity: number; names: Set<string> };

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  Err,
  None,
  Ok,
  Some,
  _Array_append,
  _Array_contains,
  _Array_flatMap,
  _Array_get,
  _Array_head,
  _Map_get,
  _Map_getOr,
  _Map_has,
  _Map_keys,
  _Map_set,
  _Option_isNone,
  _Option_isSome,
  _Option_orElse,
  _Option_unwrapOr,
  _Result_flatMap,
  _Set_add,
  _Set_fromArray,
  _Set_has,
  _Str_codeAt,
  _Str_join,
  _curry,
  _done,
  _recur,
  _tuple,
  add,
  and,
  eq,
  filter,
  gt,
  length,
  lte,
  map,
  not,
  or,
  show,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "./ast";
import { buildRegistry, primTypeNames } from "./ctors";
import {
  checkExhaustiveM,
  isWideWitnessM,
  showWitness,
  ExOk,
  ExWitness,
  ExFuel,
} from "./usefulness";

const checkErr: <D>(message: string, sp: { end: number; start: number } & D) => PErr = _curry(
  2,
  <D>(message: string, sp: { end: number; start: number } & D) => ({
    message: message,
    start: sp.start,
    end: sp.end,
  }),
);
const firstSomeFrom: <A, B>(f: (a: A) => Option<B>, xs: A[], i0: number) => Option<B> = _curry(
  3,
  <A, B>(f: (a: A) => Option<B>, xs: A[], i0: number) => {
    let i: number = i0;
    while (true) {
      const _step = ((_v) =>
        _v._tag === "None"
          ? _done(None)
          : _v._tag === "Some"
            ? (({ value: x }) =>
                ((_v) =>
                  _v._tag === "Some"
                    ? (({ value: e }) => _done(Some(e)))(_v)
                    : _v._tag === "None"
                      ? _recur(i + 1)
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(f(x)))(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, xs));
      if (_step._tag === "recur") {
        i = _step.args[0];
        continue;
      }
      return _step.value;
    }
  },
);
const firstSome: <A, B>(f: (a: A) => Option<B>, xs: A[]) => Option<B> = _curry(
  2,
  <A, B>(f: (a: A) => Option<B>, xs: A[]) => firstSomeFrom(f, xs, 0),
);
const allOfFrom: <A>(f: (a: A) => boolean, xs: A[], i0: number) => boolean = _curry(
  3,
  <A>(f: (a: A) => boolean, xs: A[], i0: number) => {
    let i: number = i0;
    while (true) {
      const _step = ((_v) =>
        _v._tag === "None"
          ? _done(true)
          : _v._tag === "Some"
            ? (({ value: x }) => (f(x) ? _recur(i + 1) : _done(false)))(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, xs));
      if (_step._tag === "recur") {
        i = _step.args[0];
        continue;
      }
      return _step.value;
    }
  },
);
const allOf: <A>(f: (a: A) => boolean, xs: A[]) => boolean = _curry(
  2,
  <A>(f: (a: A) => boolean, xs: A[]) => allOfFrom(f, xs, 0),
);
const someOfFrom: <A>(f: (a: A) => boolean, xs: A[], i0: number) => boolean = _curry(
  3,
  <A>(f: (a: A) => boolean, xs: A[], i0: number) => {
    let i: number = i0;
    while (true) {
      const _step = ((_v) =>
        _v._tag === "None"
          ? _done(false)
          : _v._tag === "Some"
            ? (({ value: x }) => (f(x) ? _done(true) : _recur(i + 1)))(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, xs));
      if (_step._tag === "recur") {
        i = _step.args[0];
        continue;
      }
      return _step.value;
    }
  },
);
const someOf: <A>(f: (a: A) => boolean, xs: A[]) => boolean = _curry(
  2,
  <A>(f: (a: A) => boolean, xs: A[]) => someOfFrom(f, xs, 0),
);
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
                              : _v._tag === "ELoop"
                                ? (({ span: sp }) => sp)(_v)
                                : _v._tag === "ERecur"
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
                                                : _v._tag === "EInterp"
                                                  ? (({ span: sp }) => sp)(_v)
                                                  : (() => {
                                                      throw new Error("non-exhaustive match");
                                                    })())(e);
const patSpan: (p: Pattern) => SpanAt = (p: Pattern) =>
  ((_v) =>
    _v._tag === "PWild"
      ? (({ span: sp }) => sp)(_v)
      : _v._tag === "PUnit"
        ? (({ span: sp }) => sp)(_v)
        : _v._tag === "PBind"
          ? (({ span: sp }) => sp)(_v)
          : _v._tag === "PAs"
            ? (({ span: sp }) => sp)(_v)
            : _v._tag === "PLit"
              ? (({ span: sp }) => sp)(_v)
              : _v._tag === "PBool"
                ? (({ span: sp }) => sp)(_v)
                : _v._tag === "PStr"
                  ? (({ span: sp }) => sp)(_v)
                  : _v._tag === "PTuple"
                    ? (({ span: sp }) => sp)(_v)
                    : _v._tag === "PRecord"
                      ? (({ span: sp }) => sp)(_v)
                      : _v._tag === "PCtor"
                        ? (({ span: sp }) => sp)(_v)
                        : _v._tag === "PArr"
                          ? (({ span: sp }) => sp)(_v)
                          : _v._tag === "PList"
                            ? (({ span: sp }) => sp)(_v)
                            : _v._tag === "POr"
                              ? (({ span: sp }) => sp)(_v)
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(p);
const isCatchAll: (p: Pattern) => boolean = (p: Pattern) =>
  ((_v) =>
    _v._tag === "PWild"
      ? true
      : _v._tag === "PUnit"
        ? true
        : _v._tag === "PBind"
          ? true
          : _v._tag === "PAs"
            ? (({ pat }) => isCatchAll(pat))(_v)
            : _v._tag === "PRecord"
              ? (({ fields }) => allOf((f: PatField) => isCatchAll(f.pat), fields))(_v)
              : _v._tag === "PTuple"
                ? (({ elems }) => allOf(isCatchAll, elems))(_v)
                : _v._tag === "PArr"
                  ? (({ elems, rest }) => and(length(elems) === 0, _Option_isSome(rest)))(_v)
                  : _v._tag === "PList"
                    ? (({ elems, rest }) => and(length(elems) === 0, _Option_isSome(rest)))(_v)
                    : false)(p);
const isPList: (p: Pattern) => boolean = (p: Pattern) =>
  ((_v) => (_v._tag === "PList" ? true : false))(p);
const isPCtor: (p: Pattern) => boolean = (p: Pattern) =>
  ((_v) => (_v._tag === "PCtor" ? true : false))(p);
const ctorNameOf: (p: Pattern) => string = (p: Pattern) =>
  ((_v) => (_v._tag === "PCtor" ? (({ ctor: name }) => name)(_v) : ""))(p);
const patCtorKey: _Curry<[ctor: string, ns: Option<string>], string> = _curry(
  2,
  (ctor: string, ns: Option<string>) =>
    ((_v) =>
      _v._tag === "Some"
        ? (({ value: alias }) => `${alias}.${ctor}`)(_v)
        : _v._tag === "None"
          ? ctor
          : (() => {
              throw new Error("non-exhaustive match");
            })())(ns),
);
const seqElemsRest: (p: Pattern) => Option<[Pattern[], Option<Pattern>]> = (p: Pattern) =>
  ((_v) =>
    _v._tag === "PArr"
      ? (({ elems, rest }) => Some(_tuple(elems, rest)) as Option<[Pattern[], Option<Pattern>]>)(_v)
      : _v._tag === "PList"
        ? (({ elems, rest }) => Some(_tuple(elems, rest)) as Option<[Pattern[], Option<Pattern>]>)(
            _v,
          )
        : (None as Option<[Pattern[], Option<Pattern>]>))(p);
const checkPattern: <A, B>(
  p: Pattern,
  reg: { ctors: Map<string, { arity: number } & A> } & B,
  top: boolean,
) => Option<PErr> = _curry(
  3,
  <A, B>(p: Pattern, reg: { ctors: Map<string, { arity: number } & A> } & B, top: boolean) =>
    ((_v) =>
      _v._tag === "PAs"
        ? (({ pat }) => checkPattern(pat, reg, top))(_v)
        : _v._tag === "PCtor"
          ? (({ ctor, args, ns, span: sp }) =>
              ((key: string) =>
                ((_v) =>
                  _v._tag === "None"
                    ? (Some(checkErr(`unknown constructor '${key}'`, sp)) as Option<PErr>)
                    : _v._tag === "Some"
                      ? (({ value: info }) =>
                          eq(length(args), info.arity)
                            ? firstSome((a: Pattern) => checkPattern(a, reg, false), args)
                            : (Some(
                                checkErr(
                                  `constructor '${ctor}' expects ${show(info.arity)} arg(s), got ${show(length(args))}`,
                                  sp,
                                ),
                              ) as Option<PErr>))(_v)
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(_Map_get(key, reg.ctors)))(patCtorKey(ctor, ns)))(_v)
          : _v._tag === "PRecord"
            ? (({ fields }) => firstSome((f: PatField) => checkPattern(f.pat, reg, false), fields))(
                _v,
              )
            : _v._tag === "PTuple"
              ? (({ elems }) => firstSome((el: Pattern) => checkPattern(el, reg, false), elems))(_v)
              : _v._tag === "PArr"
                ? (({ elems, rest }) =>
                    _Option_orElse(
                      ((_v) =>
                        _v._tag === "Some"
                          ? (({ value: r }) => checkPattern(r, reg, false))(_v)
                          : _v._tag === "None"
                            ? (None as Option<PErr>)
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(rest),
                      firstSome((el: Pattern) => checkPattern(el, reg, false), elems),
                    ))(_v)
                : _v._tag === "PList"
                  ? (({ elems, rest, span: sp }) =>
                      top
                        ? _Option_orElse(
                            ((_v) =>
                              _v._tag === "Some"
                                ? (({ value: r }) => checkPattern(r, reg, false))(_v)
                                : _v._tag === "None"
                                  ? (None as Option<PErr>)
                                  : (() => {
                                      throw new Error("non-exhaustive match");
                                    })())(rest),
                            firstSome((el: Pattern) => checkPattern(el, reg, false), elems),
                          )
                        : (Some(
                            checkErr(
                              "lazy-List pattern cannot nest inside another pattern (matching pulls from the sequence)",
                              sp,
                            ),
                          ) as Option<PErr>))(_v)
                  : _v._tag === "POr"
                    ? (({ alts, span: sp }) => checkOrPattern(alts, sp, reg))(_v)
                    : (None as Option<PErr>))(p),
);
const binderPathsArgs: _Curry<
  [args: Pattern[], i: number, at: string, acc: Map<string, string>],
  Result<Map<string, string>, PErr>
> = _curry(4, (args: Pattern[], i: number, at: string, acc: Map<string, string>) =>
  ((_v) =>
    _v._tag === "None"
      ? (Ok(acc) as Result<Map<string, string>, PErr>)
      : _v._tag === "Some"
        ? (({ value: a }) =>
            _Result_flatMap(
              (acc2: Map<string, string>) => binderPathsArgs(args, i + 1, at, acc2),
              binderPaths(a, `${at}.a${show(i)}`, acc),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, args)),
);
const binderPathsFields: _Curry<
  [fields: PatField[], i: number, at: string, acc: Map<string, string>],
  Result<Map<string, string>, PErr>
> = _curry(4, (fields: PatField[], i: number, at: string, acc: Map<string, string>) =>
  ((_v) =>
    _v._tag === "None"
      ? (Ok(acc) as Result<Map<string, string>, PErr>)
      : _v._tag === "Some"
        ? (({ value: f }) =>
            _Result_flatMap(
              (acc2: Map<string, string>) => binderPathsFields(fields, i + 1, at, acc2),
              binderPaths(f.pat, `${at}.${f.label}`, acc),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, fields)),
);
const binderPathsElems: _Curry<
  [elems: Pattern[], i: number, at: string, acc: Map<string, string>],
  Result<Map<string, string>, PErr>
> = _curry(4, (elems: Pattern[], i: number, at: string, acc: Map<string, string>) =>
  ((_v) =>
    _v._tag === "None"
      ? (Ok(acc) as Result<Map<string, string>, PErr>)
      : _v._tag === "Some"
        ? (({ value: e }) =>
            _Result_flatMap(
              (acc2: Map<string, string>) => binderPathsElems(elems, i + 1, at, acc2),
              binderPaths(e, `${at}.t${show(i)}`, acc),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, elems)),
);
const binderPaths: _Curry<
  [p: Pattern, at: string, acc: Map<string, string>],
  Result<Map<string, string>, PErr>
> = _curry(3, (p: Pattern, at: string, acc: Map<string, string>) =>
  ((_v) =>
    _v._tag === "PAs"
      ? (({ pat, name, nameSpan: nameSp }) =>
          _Result_flatMap(
            (acc1: Map<string, string>) =>
              _Map_has(name, acc1)
                ? (Err(checkErr(`pattern binds '${name}' more than once`, nameSp)) as Result<
                    Map<string, string>,
                    PErr
                  >)
                : (Ok(_Map_set(name, at, acc1)) as Result<Map<string, string>, PErr>),
            binderPaths(pat, at, acc),
          ))(_v)
      : _v._tag === "PBind"
        ? (({ name, span: sp }) =>
            _Map_has(name, acc)
              ? (Err(checkErr(`pattern binds '${name}' more than once`, sp)) as Result<
                  Map<string, string>,
                  PErr
                >)
              : (Ok(_Map_set(name, at, acc)) as Result<Map<string, string>, PErr>))(_v)
        : _v._tag === "PCtor"
          ? (({ args }) => binderPathsArgs(args, 0, at, acc))(_v)
          : _v._tag === "PRecord"
            ? (({ fields }) => binderPathsFields(fields, 0, at, acc))(_v)
            : _v._tag === "PTuple"
              ? (({ elems }) => binderPathsElems(elems, 0, at, acc))(_v)
              : (Ok(acc) as Result<Map<string, string>, PErr>))(p),
);
const altMapsFrom: <A, B>(
  alts: Pattern[],
  i: number,
  reg: { ctors: Map<string, { arity: number } & A> } & B,
  acc: Map<string, string>[],
) => Result<Map<string, string>[], PErr> = _curry(
  4,
  <A, B>(
    alts: Pattern[],
    i: number,
    reg: { ctors: Map<string, { arity: number } & A> } & B,
    acc: Map<string, string>[],
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? (Ok(acc) as Result<Map<string, string>[], PErr>)
        : _v._tag === "Some"
          ? (({ value: alt }) =>
              isCatchAll(alt)
                ? (Err(
                    checkErr(
                      "an or-pattern alternative can't be a catch-all (`_` or a bare binding)",
                      patSpan(alt),
                    ),
                  ) as Result<Map<string, string>[], PErr>)
                : _Option_isSome(seqElemsRest(alt))
                  ? (Err(
                      checkErr(
                        "array/list patterns can't appear as an or-pattern alternative",
                        patSpan(alt),
                      ),
                    ) as Result<Map<string, string>[], PErr>)
                  : ((_v) =>
                      _v._tag === "Some"
                        ? (({ value: e }) => Err(e) as Result<Map<string, string>[], PErr>)(_v)
                        : _v._tag === "None"
                          ? _Result_flatMap(
                              (m) => altMapsFrom(alts, i + 1, reg, _Array_append(m, acc)),
                              binderPaths(alt, "", new Map<string, string>()),
                            )
                          : (() => {
                              throw new Error("non-exhaustive match");
                            })())(checkPattern(alt, reg, false)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, alts)),
);
const missingNameErr: <C>(name: string, sp: { end: number; start: number } & C) => PErr = _curry(
  2,
  <C>(name: string, sp: { end: number; start: number } & C) =>
    checkErr(
      `or-pattern alternatives must bind the same names ('${name}' is missing in an alternative)`,
      sp,
    ),
);
const consistentBindsFrom: <C>(
  maps: Map<string, string>[],
  i: number,
  ref: Map<string, string>,
  sp: { end: number; start: number } & C,
) => Option<PErr> = _curry(
  4,
  <C>(
    maps: Map<string, string>[],
    i: number,
    ref: Map<string, string>,
    sp: { end: number; start: number } & C,
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? None
        : _v._tag === "Some"
          ? (({ value: m }) =>
              _Option_orElse(
                consistentBindsFrom(maps, i + 1, ref, sp),
                _Option_orElse(
                  firstSome(
                    (name: string) =>
                      _Map_has(name, ref)
                        ? eq(_Map_getOr("", name, ref), _Map_getOr("", name, m))
                          ? None
                          : Some(
                              checkErr(
                                `or-pattern binds '${name}' at a differing position across alternatives`,
                                sp,
                              ),
                            )
                        : Some(missingNameErr(name, sp)),
                    _Map_keys(m),
                  ),
                  firstSome(
                    (name: string) => (_Map_has(name, m) ? None : Some(missingNameErr(name, sp))),
                    _Map_keys(ref),
                  ),
                ),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, maps)),
);
const checkOrPattern: <A, B>(
  alts: Pattern[],
  sp: SpanAt,
  reg: { ctors: Map<string, { arity: number } & A> } & B,
) => Option<PErr> = _curry(
  3,
  <A, B>(alts: Pattern[], sp: SpanAt, reg: { ctors: Map<string, { arity: number } & A> } & B) =>
    ((_v) =>
      _v._tag === "Err"
        ? (({ error: e }) => Some(e) as Option<PErr>)(_v)
        : _v._tag === "Ok"
          ? (({ value: maps }) =>
              ((_v) =>
                _v._tag === "None"
                  ? (None as Option<PErr>)
                  : _v._tag === "Some"
                    ? (({ value: ref }) => consistentBindsFrom(maps, 1, ref, sp))(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(_Array_head(maps)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(altMapsFrom(alts, 0, reg, [] as Map<string, string>[])),
);
const armUnguardedCatchAll: <A, B>(a: { pattern: Pattern; guard: Option<A> } & B) => boolean = <
  A,
  B,
>(
  a: { pattern: Pattern; guard: Option<A> } & B,
) => and(isCatchAll(a.pattern), _Option_isNone(a.guard));
const guardErrs: _Curry<[arms: MatchArm[], listSwitch: boolean], Option<PErr>> = _curry(
  2,
  (arms: MatchArm[], listSwitch: boolean) =>
    firstSome(
      (a: MatchArm) =>
        ((_v) =>
          _v._tag === "None"
            ? (None as Option<PErr>)
            : _v._tag === "Some"
              ? (({ value: g }) =>
                  or(isPList(a.pattern), listSwitch)
                    ? (Some(
                        checkErr(
                          "`when` guards are unsupported in a lazy-List switch (matching pulls from the sequence)",
                          exprSpan(g),
                        ),
                      ) as Option<PErr>)
                    : (None as Option<PErr>))(_v)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(a.guard),
      arms,
    ),
);
const firstCatchIdx: _Curry<[arms: MatchArm[], i0: number], Option<number>> = _curry(
  2,
  (arms: MatchArm[], i0: number) => {
    let i: number = i0;
    while (true) {
      const _step = ((_v) =>
        _v._tag === "None"
          ? _done(None as Option<number>)
          : _v._tag === "Some"
            ? (({ value: a }) =>
                armUnguardedCatchAll(a) ? _done(Some(i) as Option<number>) : _recur(i + 1))(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, arms));
      if (_step._tag === "recur") {
        i = _step.args[0];
        continue;
      }
      return _step.value;
    }
  },
);
const unreachableAfterCatch: (arms: MatchArm[]) => Option<PErr> = (arms: MatchArm[]) =>
  ((_v) =>
    _v._tag === "None"
      ? (None as Option<PErr>)
      : _v._tag === "Some"
        ? (({ value: i }) =>
            ((_v) =>
              _v._tag === "None"
                ? (None as Option<PErr>)
                : _v._tag === "Some"
                  ? (({ value: a }) =>
                      Some(
                        checkErr(
                          "unreachable arm: a catch-all arm above it matches first",
                          patSpan(a.pattern),
                        ),
                      ) as Option<PErr>)(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(_Array_get(i + 1, arms)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(firstCatchIdx(arms, 0));
const SeqNotSeq: SeqCheck = { _tag: "SeqNotSeq" };
const SeqTotal: SeqCheck = { _tag: "SeqTotal" };
const SeqFail = (e: PErr): SeqCheck => ({ _tag: "SeqFail", e });
const checkSeqExhaustive: <A>(
  arms: MatchArm[],
  mSpan: { end: number; start: number } & A,
) => SeqCheck = _curry(2, <A>(arms: MatchArm[], mSpan: { end: number; start: number } & A) => {
  const seqs: Pattern[] = map(
    (a: MatchArm) => a.pattern,
    filter(
      (a: MatchArm) => and(_Option_isNone(a.guard), _Option_isSome(seqElemsRest(a.pattern))),
      arms,
    ),
  );
  return length(seqs) === 0
    ? (SeqNotSeq as SeqCheck)
    : ((hasEmpty: boolean) =>
        ((hasCons: boolean) =>
          and(hasEmpty, hasCons)
            ? (SeqTotal as SeqCheck)
            : SeqFail(
                checkErr(
                  "non-exhaustive list switch: cover `[]` and `[x, ...xs]` (or add `_`)",
                  mSpan,
                ),
              ))(
          someOf(
            (p: Pattern) =>
              ((_v) =>
                _v._tag === "Some"
                  ? (({ value: [elems, rest] }) => and(length(elems) === 1, _Option_isSome(rest)))(
                      _v as Extract<Option<[Pattern[], Option<Pattern>]>, { _tag: "Some" }>,
                    )
                  : _v._tag === "None"
                    ? false
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(seqElemsRest(p)),
            seqs,
          ),
        ))(
        someOf(
          (p: Pattern) =>
            ((_v) =>
              _v._tag === "Some"
                ? (({ value: [elems, rest] }) => and(length(elems) === 0, _Option_isNone(rest)))(
                    _v as Extract<Option<[Pattern[], Option<Pattern>]>, { _tag: "Some" }>,
                  )
                : _v._tag === "None"
                  ? false
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(seqElemsRest(p)),
          seqs,
        ),
      );
});
const ctorLoop: <A, B, C, D>(
  arms: ({ pattern: Pattern; guard: Option<A> } & B)[],
  i: number,
  reg: { ctors: Map<string, { arity: number; owner: string } & C> } & D,
  owner: Option<string>,
  covered: Set<string>,
) => Result<[Option<string>, Set<string>], PErr> = _curry(
  5,
  <A, B, C, D>(
    arms: ({ pattern: Pattern; guard: Option<A> } & B)[],
    i: number,
    reg: { ctors: Map<string, { arity: number; owner: string } & C> } & D,
    owner: Option<string>,
    covered: Set<string>,
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? (Ok(_tuple(owner, covered)) as Result<[Option<string>, Set<string>], PErr>)
        : _v._tag === "Some"
          ? (({ value: a }) =>
              ((_v) =>
                _v._tag === "PCtor"
                  ? (({ ctor, args, ns, span: sp }) =>
                      ((key: string) =>
                        ((_v) =>
                          _v._tag === "None"
                            ? (Err(checkErr(`unknown constructor '${key}'`, sp)) as Result<
                                [Option<string>, Set<string>],
                                PErr
                              >)
                            : _v._tag === "Some"
                              ? (({ value: info }) =>
                                  !eq(length(args), info.arity)
                                    ? (Err(
                                        checkErr(
                                          `constructor '${ctor}' expects ${show(info.arity)} arg(s), got ${show(length(args))}`,
                                          sp,
                                        ),
                                      ) as Result<[Option<string>, Set<string>], PErr>)
                                    : ((_v) =>
                                        _v._tag === "Some" &&
                                        (({ value: own }) => !eq(own, info.owner))(_v)
                                          ? (({ value: own }) =>
                                              Err(
                                                checkErr(
                                                  `switch mixes variants of '${own}' and '${info.owner}'`,
                                                  sp,
                                                ),
                                              ) as Result<[Option<string>, Set<string>], PErr>)(_v)
                                          : ((covered2: Set<string>) =>
                                              ctorLoop(
                                                arms,
                                                i + 1,
                                                reg,
                                                Some(info.owner) as Option<string>,
                                                covered2,
                                              ))(
                                              and(allOf(isCatchAll, args), _Option_isNone(a.guard))
                                                ? _Set_add(ctor, covered)
                                                : covered,
                                            ))(owner))(_v)
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(_Map_get(key, reg.ctors)))(patCtorKey(ctor, ns)))(_v)
                  : ctorLoop(arms, i + 1, reg, owner, covered))(a.pattern))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, arms)),
);
const seqVerdict: <A>(arms: MatchArm[], mSpan: { end: number; start: number } & A) => Option<PErr> =
  _curry(2, <A>(arms: MatchArm[], mSpan: { end: number; start: number } & A) =>
    ((_v) =>
      _v._tag === "SeqTotal"
        ? (None as Option<PErr>)
        : _v._tag === "SeqFail"
          ? (({ e }) => Some(e) as Option<PErr>)(_v)
          : _v._tag === "SeqNotSeq"
            ? (None as Option<PErr>)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(checkSeqExhaustive(arms, mSpan)),
  );
const unguardedPatterns: <A, B, C>(arms: ({ guard: Option<A>; pattern: B } & C)[]) => B[] = <
  A,
  B,
  C,
>(
  arms: ({ guard: Option<A>; pattern: B } & C)[],
) =>
  _Array_flatMap(
    (a: { guard: Option<A>; pattern: B } & C) =>
      _Option_isNone(a.guard) ? [a.pattern] : ([] as B[]),
    arms,
  );
const namedUnguarded: <A, B>(
  leaves: ({ pattern: Pattern; guard: Option<A> } & B)[],
) => Set<string> = <A, B>(leaves: ({ pattern: Pattern; guard: Option<A> } & B)[]) =>
  _Set_fromArray(
    _Array_flatMap(
      (a: { pattern: Pattern; guard: Option<A> } & B) =>
        and(isPCtor(a.pattern), _Option_isNone(a.guard))
          ? [ctorNameOf(a.pattern)]
          : ([] as string[]),
      leaves,
    ),
  );
const matrixVerdict: <A, D, E>(
  arms: MatchArm[],
  leaves: ({ pattern: Pattern; guard: Option<A> } & D)[],
  ownerOpt: Option<string>,
  mSpan: { end: number; start: number } & E,
  reg: Registry,
) => Option<PErr> = _curry(
  5,
  <A, D, E>(
    arms: MatchArm[],
    leaves: ({ pattern: Pattern; guard: Option<A> } & D)[],
    ownerOpt: Option<string>,
    mSpan: { end: number; start: number } & E,
    reg: Registry,
  ) =>
    ((_v) =>
      _v._tag === "ExOk"
        ? None
        : _v._tag === "ExFuel"
          ? Some(
              checkErr("switch too complex to prove exhaustive — add a `_` catch-all arm", mSpan),
            )
          : _v._tag === "ExWitness"
            ? (({ witness: w }) =>
                ((own: string) =>
                  ((named: Set<string>) =>
                    ((absent: string[]) =>
                      and(and(isWideWitnessM(w), own !== ""), length(absent) > 0)
                        ? Some(
                            checkErr(
                              `non-exhaustive switch on '${own}': missing ${_Str_join(", ", absent)}`,
                              mSpan,
                            ),
                          )
                        : Some(
                            checkErr(
                              `non-exhaustive switch: '${showWitness(w)}' is not matched`,
                              mSpan,
                            ),
                          ))(
                      filter(
                        (c: string) => !_Set_has(c, named),
                        _Map_getOr([] as string[], own, reg.types),
                      ),
                    ))(namedUnguarded(leaves)))(_Option_unwrapOr("", ownerOpt)))(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(checkExhaustiveM(unguardedPatterns(arms), reg)),
);
const leavesOfArm: <A, B>(
  a: { pattern: Pattern; guard: A } & B,
) => { pattern: Pattern; guard: A }[] = <A, B>(a: { pattern: Pattern; guard: A } & B) =>
  ((_v) =>
    _v._tag === "POr"
      ? (({ alts }) => map((alt: Pattern) => ({ pattern: alt, guard: a.guard }), alts))(_v)
      : [{ pattern: a.pattern, guard: a.guard }])(a.pattern);
const checkMatch: <A>(
  arms: MatchArm[],
  mSpan: { end: number; start: number } & A,
  reg: Registry,
) => Option<PErr> = _curry(
  3,
  <A>(arms: MatchArm[], mSpan: { end: number; start: number } & A, reg: Registry) =>
    ((_v) =>
      _v._tag === "Some"
        ? (({ value: e }) => Some(e) as Option<PErr>)(_v)
        : _v._tag === "None"
          ? ((listSwitch: boolean) =>
              ((_v) =>
                _v._tag === "Some"
                  ? (({ value: e }) => Some(e) as Option<PErr>)(_v)
                  : _v._tag === "None"
                    ? ((_v) =>
                        _v._tag === "Some"
                          ? (({ value: e }) => Some(e) as Option<PErr>)(_v)
                          : _v._tag === "None"
                            ? ((hasCatchAll: boolean) =>
                                ((leaves: { pattern: Pattern; guard: Option<Expr> }[]) =>
                                  ((ctorArms: { pattern: Pattern; guard: Option<Expr> }[]) =>
                                    someOf((a: MatchArm) => isPList(a.pattern), arms)
                                      ? hasCatchAll
                                        ? (None as Option<PErr>)
                                        : seqVerdict(arms, mSpan)
                                      : ((_v) =>
                                          _v._tag === "Err"
                                            ? (({ error: e }) => Some(e) as Option<PErr>)(_v)
                                            : _v._tag === "Ok"
                                              ? (({ value: [ownerOpt] }) =>
                                                  matrixVerdict(
                                                    arms,
                                                    leaves,
                                                    ownerOpt,
                                                    mSpan,
                                                    reg,
                                                  ))(
                                                  _v as Extract<
                                                    Result<[Option<string>, Set<string>], PErr>,
                                                    { _tag: "Ok" }
                                                  >,
                                                )
                                              : (() => {
                                                  throw new Error("non-exhaustive match");
                                                })())(
                                          ctorLoop(
                                            ctorArms,
                                            0,
                                            reg,
                                            None as Option<string>,
                                            _Set_fromArray([] as string[]),
                                          ),
                                        ))(
                                    filter(
                                      (a: { pattern: Pattern; guard: Option<Expr> }) =>
                                        isPCtor(a.pattern),
                                      leaves,
                                    ),
                                  ))(_Array_flatMap(leavesOfArm, arms)))(
                                someOf(armUnguardedCatchAll, arms),
                              )
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(unreachableAfterCatch(arms))
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(guardErrs(arms, listSwitch)))(
              someOf((a: MatchArm) => and(isPList(a.pattern), !isCatchAll(a.pattern)), arms),
            )
          : (() => {
              throw new Error("non-exhaustive match");
            })())(firstSome((a: MatchArm) => checkPattern(a.pattern, reg, true), arms)),
);
const checkExpr: _Curry<[e: Expr, reg: Registry], Option<PErr>> = _curry(
  2,
  (e: Expr, reg: Registry) =>
    ((_v) =>
      _v._tag === "ENum"
        ? (None as Option<PErr>)
        : _v._tag === "EUnit"
          ? (None as Option<PErr>)
          : _v._tag === "EBool"
            ? (None as Option<PErr>)
            : _v._tag === "EStr"
              ? (None as Option<PErr>)
              : _v._tag === "ERef"
                ? (None as Option<PErr>)
                : _v._tag === "ECall"
                  ? (({ fn, args }) =>
                      _Option_orElse(
                        firstSome((a: Expr) => checkExpr(a, reg), args),
                        checkExpr(fn, reg),
                      ))(_v)
                  : _v._tag === "ELambda"
                    ? (({ body }) => checkExpr(body, reg))(_v)
                    : _v._tag === "ELetIn"
                      ? (({ value, body }) =>
                          _Option_orElse(checkExpr(body, reg), checkExpr(value, reg)))(_v)
                      : _v._tag === "ELetBind"
                        ? (({ value, body }) =>
                            _Option_orElse(checkExpr(body, reg), checkExpr(value, reg)))(_v)
                        : _v._tag === "EPipe"
                          ? (({ left, right }) =>
                              _Option_orElse(checkExpr(right, reg), checkExpr(left, reg)))(_v)
                          : _v._tag === "EDo"
                            ? (({ exprs }) => firstSome((x: Expr) => checkExpr(x, reg), exprs))(_v)
                            : _v._tag === "ETernary"
                              ? (({ cond, thenE, elseE }) =>
                                  _Option_orElse(
                                    checkExpr(elseE, reg),
                                    _Option_orElse(checkExpr(thenE, reg), checkExpr(cond, reg)),
                                  ))(_v)
                              : _v._tag === "EMatch"
                                ? (({ scrutinee, arms, span: sp }) =>
                                    _Option_orElse(
                                      checkMatch(arms, sp, reg),
                                      _Option_orElse(
                                        firstSome(
                                          (a: MatchArm) =>
                                            _Option_orElse(
                                              checkExpr(a.body, reg),
                                              ((_v) =>
                                                _v._tag === "Some"
                                                  ? (({ value: g }) => checkExpr(g, reg))(_v)
                                                  : _v._tag === "None"
                                                    ? (None as Option<PErr>)
                                                    : (() => {
                                                        throw new Error("non-exhaustive match");
                                                      })())(a.guard),
                                            ),
                                          arms,
                                        ),
                                        checkExpr(scrutinee, reg),
                                      ),
                                    ))(_v)
                                : _v._tag === "ERecord"
                                  ? (({ fields, spread }) =>
                                      _Option_orElse(
                                        firstSome((f: Field) => checkExpr(f.value, reg), fields),
                                        ((_v) =>
                                          _v._tag === "Some"
                                            ? (({ value: s }) => checkExpr(s, reg))(_v)
                                            : _v._tag === "None"
                                              ? (None as Option<PErr>)
                                              : (() => {
                                                  throw new Error("non-exhaustive match");
                                                })())(spread),
                                      ))(_v)
                                  : _v._tag === "EField"
                                    ? (({ target }) => checkExpr(target, reg))(_v)
                                    : _v._tag === "ELoop"
                                      ? (({ params, body }) =>
                                          _Option_orElse(
                                            checkExpr(body, reg),
                                            firstSome(
                                              (p: LoopParam) => checkExpr(p.init, reg),
                                              params,
                                            ),
                                          ))(_v)
                                      : _v._tag === "ERecur"
                                        ? (({ args }) =>
                                            firstSome((a: Expr) => checkExpr(a, reg), args))(_v)
                                        : _v._tag === "ETuple"
                                          ? (({ elements }) =>
                                              firstSome(
                                                (el: Expr) => checkExpr(el, reg),
                                                elements,
                                              ))(_v)
                                          : _v._tag === "EArr"
                                            ? (({ elements }) =>
                                                firstSome(
                                                  (el: SeqElem) =>
                                                    checkExpr(
                                                      ((_v) =>
                                                        _v._tag === "SEExpr"
                                                          ? (({ expr: e }) => e)(_v)
                                                          : _v._tag === "SESpread"
                                                            ? (({ expr: e }) => e)(_v)
                                                            : (() => {
                                                                throw new Error(
                                                                  "non-exhaustive match",
                                                                );
                                                              })())(el),
                                                      reg,
                                                    ),
                                                  elements,
                                                ))(_v)
                                            : _v._tag === "EList"
                                              ? (({ elements }) =>
                                                  firstSome(
                                                    (el: SeqElem) =>
                                                      checkExpr(
                                                        ((_v) =>
                                                          _v._tag === "SEExpr"
                                                            ? (({ expr: e }) => e)(_v)
                                                            : _v._tag === "SESpread"
                                                              ? (({ expr: e }) => e)(_v)
                                                              : (() => {
                                                                  throw new Error(
                                                                    "non-exhaustive match",
                                                                  );
                                                                })())(el),
                                                        reg,
                                                      ),
                                                    elements,
                                                  ))(_v)
                                              : _v._tag === "ESet"
                                                ? (({ elements }) =>
                                                    firstSome(
                                                      (el: SeqElem) =>
                                                        checkExpr(
                                                          ((_v) =>
                                                            _v._tag === "SEExpr"
                                                              ? (({ expr: e }) => e)(_v)
                                                              : _v._tag === "SESpread"
                                                                ? (({ expr: e }) => e)(_v)
                                                                : (() => {
                                                                    throw new Error(
                                                                      "non-exhaustive match",
                                                                    );
                                                                  })())(el),
                                                          reg,
                                                        ),
                                                      elements,
                                                    ))(_v)
                                                : _v._tag === "EMap"
                                                  ? (({ entries }) =>
                                                      firstSome(
                                                        (en: MapEntry) =>
                                                          _Option_orElse(
                                                            checkExpr(en.value, reg),
                                                            checkExpr(en.key, reg),
                                                          ),
                                                        entries,
                                                      ))(_v)
                                                  : _v._tag === "EInterp"
                                                    ? (({ parts }) =>
                                                        firstSome(
                                                          (p: InterpPart) =>
                                                            ((_v) =>
                                                              _v._tag === "IPLit"
                                                                ? (None as Option<PErr>)
                                                                : _v._tag === "IPExpr"
                                                                  ? (({ expr: ex }) =>
                                                                      checkExpr(ex, reg))(_v)
                                                                  : (() => {
                                                                      throw new Error(
                                                                        "non-exhaustive match",
                                                                      );
                                                                    })())(p),
                                                          parts,
                                                        ))(_v)
                                                    : (() => {
                                                        throw new Error("non-exhaustive match");
                                                      })())(e),
);
const checkExprs: _Curry<[e: Expr, reg: Registry], PErr[]> = _curry(2, (e: Expr, reg: Registry) =>
  ((_v) =>
    _v._tag === "ENum"
      ? ([] as PErr[])
      : _v._tag === "EUnit"
        ? ([] as PErr[])
        : _v._tag === "EBool"
          ? ([] as PErr[])
          : _v._tag === "EStr"
            ? ([] as PErr[])
            : _v._tag === "ERef"
              ? ([] as PErr[])
              : _v._tag === "ECall"
                ? (({ fn, args }) => [
                    ...checkExprs(fn, reg),
                    ..._Array_flatMap((a: Expr) => checkExprs(a, reg), args),
                  ])(_v)
                : _v._tag === "ELambda"
                  ? (({ body }) => checkExprs(body, reg))(_v)
                  : _v._tag === "ELetIn"
                    ? (({ value, body }) => [...checkExprs(value, reg), ...checkExprs(body, reg)])(
                        _v,
                      )
                    : _v._tag === "ELetBind"
                      ? (({ value, body }) => [
                          ...checkExprs(value, reg),
                          ...checkExprs(body, reg),
                        ])(_v)
                      : _v._tag === "EPipe"
                        ? (({ left, right }) => [
                            ...checkExprs(left, reg),
                            ...checkExprs(right, reg),
                          ])(_v)
                        : _v._tag === "EDo"
                          ? (({ exprs }) => _Array_flatMap((x: Expr) => checkExprs(x, reg), exprs))(
                              _v,
                            )
                          : _v._tag === "ETernary"
                            ? (({ cond, thenE, elseE }) => [
                                ...checkExprs(cond, reg),
                                ...checkExprs(thenE, reg),
                                ...checkExprs(elseE, reg),
                              ])(_v)
                            : _v._tag === "EMatch"
                              ? (({ scrutinee, arms, span: sp }) => [
                                  ...checkExprs(scrutinee, reg),
                                  ..._Array_flatMap(
                                    (a: MatchArm) => [
                                      ...((_v) =>
                                        _v._tag === "Some"
                                          ? (({ value: g }) => checkExprs(g, reg))(_v)
                                          : _v._tag === "None"
                                            ? ([] as PErr[])
                                            : (() => {
                                                throw new Error("non-exhaustive match");
                                              })())(a.guard),
                                      ...checkExprs(a.body, reg),
                                    ],
                                    arms,
                                  ),
                                  ...((_v) =>
                                    _v._tag === "Some"
                                      ? (({ value: e }) => [e])(_v)
                                      : _v._tag === "None"
                                        ? ([] as PErr[])
                                        : (() => {
                                            throw new Error("non-exhaustive match");
                                          })())(checkMatch(arms, sp, reg)),
                                ])(_v)
                              : _v._tag === "ERecord"
                                ? (({ fields, spread }) => [
                                    ...((_v) =>
                                      _v._tag === "Some"
                                        ? (({ value: s }) => checkExprs(s, reg))(_v)
                                        : _v._tag === "None"
                                          ? ([] as PErr[])
                                          : (() => {
                                              throw new Error("non-exhaustive match");
                                            })())(spread),
                                    ..._Array_flatMap(
                                      (f: Field) => checkExprs(f.value, reg),
                                      fields,
                                    ),
                                  ])(_v)
                                : _v._tag === "EField"
                                  ? (({ target }) => checkExprs(target, reg))(_v)
                                  : _v._tag === "ELoop"
                                    ? (({ params, body }) => [
                                        ..._Array_flatMap(
                                          (p: LoopParam) => checkExprs(p.init, reg),
                                          params,
                                        ),
                                        ...checkExprs(body, reg),
                                      ])(_v)
                                    : _v._tag === "ERecur"
                                      ? (({ args }) =>
                                          _Array_flatMap((a: Expr) => checkExprs(a, reg), args))(_v)
                                      : _v._tag === "ETuple"
                                        ? (({ elements }) =>
                                            _Array_flatMap(
                                              (el: Expr) => checkExprs(el, reg),
                                              elements,
                                            ))(_v)
                                        : _v._tag === "EArr"
                                          ? (({ elements }) =>
                                              _Array_flatMap(
                                                (el: SeqElem) =>
                                                  ((_v) =>
                                                    _v._tag === "SEExpr"
                                                      ? (({ expr: value }) =>
                                                          checkExprs(value, reg))(_v)
                                                      : _v._tag === "SESpread"
                                                        ? (({ expr: value }) =>
                                                            checkExprs(value, reg))(_v)
                                                        : (() => {
                                                            throw new Error("non-exhaustive match");
                                                          })())(el),
                                                elements,
                                              ))(_v)
                                          : _v._tag === "EList"
                                            ? (({ elements }) =>
                                                _Array_flatMap(
                                                  (el: SeqElem) =>
                                                    ((_v) =>
                                                      _v._tag === "SEExpr"
                                                        ? (({ expr: value }) =>
                                                            checkExprs(value, reg))(_v)
                                                        : _v._tag === "SESpread"
                                                          ? (({ expr: value }) =>
                                                              checkExprs(value, reg))(_v)
                                                          : (() => {
                                                              throw new Error(
                                                                "non-exhaustive match",
                                                              );
                                                            })())(el),
                                                  elements,
                                                ))(_v)
                                            : _v._tag === "ESet"
                                              ? (({ elements }) =>
                                                  _Array_flatMap(
                                                    (el: SeqElem) =>
                                                      ((_v) =>
                                                        _v._tag === "SEExpr"
                                                          ? (({ expr: value }) =>
                                                              checkExprs(value, reg))(_v)
                                                          : _v._tag === "SESpread"
                                                            ? (({ expr: value }) =>
                                                                checkExprs(value, reg))(_v)
                                                            : (() => {
                                                                throw new Error(
                                                                  "non-exhaustive match",
                                                                );
                                                              })())(el),
                                                    elements,
                                                  ))(_v)
                                              : _v._tag === "EMap"
                                                ? (({ entries }) =>
                                                    _Array_flatMap(
                                                      (entry: MapEntry) => [
                                                        ...checkExprs(entry.key, reg),
                                                        ...checkExprs(entry.value, reg),
                                                      ],
                                                      entries,
                                                    ))(_v)
                                                : _v._tag === "EInterp"
                                                  ? (({ parts }) =>
                                                      _Array_flatMap(
                                                        (part: InterpPart) =>
                                                          ((_v) =>
                                                            _v._tag === "IPLit"
                                                              ? ([] as PErr[])
                                                              : _v._tag === "IPExpr"
                                                                ? (({ expr: value }) =>
                                                                    checkExprs(value, reg))(_v)
                                                                : (() => {
                                                                    throw new Error(
                                                                      "non-exhaustive match",
                                                                    );
                                                                  })())(part),
                                                        parts,
                                                      ))(_v)
                                                  : (() => {
                                                      throw new Error("non-exhaustive match");
                                                    })())(e),
);
const reservedNames: string[] = ["Array", "List", "Set", "Map", "Option", "Result", "Task", "Str"];
const redeclarableTypes: string[] = ["Option", "Result"];
const reservedErr: <C>(name: string, sp: { end: number; start: number } & C) => PErr = _curry(
  2,
  <C>(name: string, sp: { end: number; start: number } & C) =>
    checkErr(`'${name}' is a reserved collection namespace and cannot be bound`, sp),
);
const checkReservedNames: (stmts: Stmt[]) => Option<PErr> = (stmts: Stmt[]) =>
  firstSome(
    (s: Stmt) =>
      ((_v) =>
        _v._tag === "SType"
          ? (({ name, span: sp }) =>
              _Array_contains(name, redeclarableTypes)
                ? (None as Option<PErr>)
                : _Array_contains(name, reservedNames)
                  ? (Some(reservedErr(name, sp)) as Option<PErr>)
                  : (None as Option<PErr>))(_v)
          : _v._tag === "SLet"
            ? (({ name, span: sp }) =>
                _Array_contains(name, reservedNames)
                  ? (Some(reservedErr(name, sp)) as Option<PErr>)
                  : (None as Option<PErr>))(_v)
            : _v._tag === "SExtern"
              ? (({ name, span: sp }) =>
                  _Array_contains(name, reservedNames)
                    ? (Some(reservedErr(name, sp)) as Option<PErr>)
                    : (None as Option<PErr>))(_v)
              : _v._tag === "SImport"
                ? (({ names }) =>
                    firstSome(
                      (n: Name) =>
                        _Array_contains(n.name, reservedNames)
                          ? (Some(
                              checkErr(
                                `'${n.name}' is a reserved collection namespace and cannot be imported`,
                                n.span,
                              ),
                            ) as Option<PErr>)
                          : (None as Option<PErr>),
                      names,
                    ))(_v)
                : _v._tag === "SImportNs"
                  ? (({ alias }) =>
                      _Array_contains(alias.name, reservedNames)
                        ? (Some(
                            checkErr(
                              `'${alias.name}' is a reserved collection namespace and cannot be imported`,
                              alias.span,
                            ),
                          ) as Option<PErr>)
                        : (None as Option<PErr>))(_v)
                  : _v._tag === "SError"
                    ? (None as Option<PErr>)
                    : _v._tag === "SExpr"
                      ? (None as Option<PErr>)
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(s),
    stmts,
  );
const checkReservedNamesAll: (stmts: Stmt[]) => PErr[] = (stmts: Stmt[]) =>
  _Array_flatMap(
    (s: Stmt) =>
      ((_v) =>
        _v._tag === "SType"
          ? (({ name, span: sp }) =>
              _Array_contains(name, redeclarableTypes)
                ? ([] as PErr[])
                : _Array_contains(name, reservedNames)
                  ? [reservedErr(name, sp)]
                  : ([] as PErr[]))(_v)
          : _v._tag === "SLet"
            ? (({ name, span: sp }) =>
                _Array_contains(name, reservedNames) ? [reservedErr(name, sp)] : ([] as PErr[]))(_v)
            : _v._tag === "SExtern"
              ? (({ name, span: sp }) =>
                  _Array_contains(name, reservedNames) ? [reservedErr(name, sp)] : ([] as PErr[]))(
                  _v,
                )
              : _v._tag === "SImport"
                ? (({ names }) =>
                    _Array_flatMap(
                      (n: Name) =>
                        _Array_contains(n.name, reservedNames)
                          ? [
                              checkErr(
                                `'${n.name}' is a reserved collection namespace and cannot be imported`,
                                n.span,
                              ),
                            ]
                          : ([] as PErr[]),
                      names,
                    ))(_v)
                : _v._tag === "SImportNs"
                  ? (({ alias }) =>
                      _Array_contains(alias.name, reservedNames)
                        ? [
                            checkErr(
                              `'${alias.name}' is a reserved collection namespace and cannot be imported`,
                              alias.span,
                            ),
                          ]
                        : ([] as PErr[]))(_v)
                  : ([] as PErr[]))(s),
    stmts,
  );
const jsReserved: string[] = [
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "null",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "let",
  "static",
  "implements",
  "interface",
  "package",
  "private",
  "protected",
  "public",
  "await",
];
const reservedWord: <C>(name: string, sp: { end: number; start: number } & C) => PErr[] = _curry(
  2,
  <C>(name: string, sp: { end: number; start: number } & C) =>
    _Array_contains(name, jsReserved)
      ? [
          checkErr(
            `'${name}' is a JavaScript reserved word and can't be used as a binding name; rename it`,
            sp,
          ),
        ]
      : ([] as PErr[]),
);
const typeExprSpan: (te: TypeExpr) => SpanAt = (te: TypeExpr) =>
  ((_v) =>
    _v._tag === "TyName"
      ? (({ span: sp }) => sp)(_v)
      : _v._tag === "TyArrow"
        ? (({ span: sp }) => sp)(_v)
        : _v._tag === "TyApp"
          ? (({ span: sp }) => sp)(_v)
          : _v._tag === "TyTuple"
            ? (({ span: sp }) => sp)(_v)
            : _v._tag === "TyList"
              ? (({ span: sp }) => sp)(_v)
              : _v._tag === "TyQual"
                ? (({ span: sp }) => sp)(_v)
                : _v._tag === "TyLit"
                  ? (({ span: sp }) => sp)(_v)
                  : _v._tag === "TyUnion"
                    ? (({ span: sp }) => sp)(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(te);
const checkReservedParam: _Curry<[param: LamParam, sp: SpanAt], PErr[]> = _curry(
  2,
  (param: LamParam, sp: SpanAt) =>
    ((_v) =>
      _v._tag === "LPName"
        ? (({ name }) => reservedWord(name, sp))(_v)
        : _v._tag === "LPRecord"
          ? (({ fields }) => _Array_flatMap((name: string) => reservedWord(name, sp), fields))(_v)
          : _v._tag === "LPTuple"
            ? (({ names }) => _Array_flatMap((name: string) => reservedWord(name, sp), names))(_v)
            : _v._tag === "LPLabeled"
              ? (({ name, defaultValue }) => [
                  ...reservedWord(name, sp),
                  ...((_v) =>
                    _v._tag === "Some"
                      ? (({ value }) => checkReservedExpr(value))(_v)
                      : _v._tag === "None"
                        ? ([] as PErr[])
                        : (() => {
                            throw new Error("non-exhaustive match");
                          })())(defaultValue),
                ])(_v)
              : _v._tag === "LPSpanned"
                ? (({ param: inner }) => checkReservedParam(inner, sp))(_v)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(param),
);
const checkReservedPattern: (pat: Pattern) => PErr[] = (pat: Pattern) =>
  ((_v) =>
    _v._tag === "PAs"
      ? (({ pat: inner, name, nameSpan: nameSp }) => [
          ...checkReservedPattern(inner),
          ...reservedWord(name, nameSp),
        ])(_v)
      : _v._tag === "PBind"
        ? (({ name, span: sp }) => reservedWord(name, sp))(_v)
        : _v._tag === "PTuple"
          ? (({ elems }) => _Array_flatMap(checkReservedPattern, elems))(_v)
          : _v._tag === "PRecord"
            ? (({ fields }) =>
                _Array_flatMap((field: PatField) => checkReservedPattern(field.pat), fields))(_v)
            : _v._tag === "PCtor"
              ? (({ args }) => _Array_flatMap(checkReservedPattern, args))(_v)
              : _v._tag === "PArr"
                ? (({ elems, rest }) => [
                    ..._Array_flatMap(checkReservedPattern, elems),
                    ...((_v) =>
                      _v._tag === "Some"
                        ? (({ value }) => checkReservedPattern(value))(_v)
                        : _v._tag === "None"
                          ? ([] as PErr[])
                          : (() => {
                              throw new Error("non-exhaustive match");
                            })())(rest),
                  ])(_v)
                : _v._tag === "PList"
                  ? (({ elems, rest }) => [
                      ..._Array_flatMap(checkReservedPattern, elems),
                      ...((_v) =>
                        _v._tag === "Some"
                          ? (({ value }) => checkReservedPattern(value))(_v)
                          : _v._tag === "None"
                            ? ([] as PErr[])
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(rest),
                    ])(_v)
                  : _v._tag === "POr"
                    ? (({ alts }) => _Array_flatMap(checkReservedPattern, alts))(_v)
                    : ([] as PErr[]))(pat);
const checkReservedSeqElem: (el: SeqElem) => PErr[] = (el: SeqElem) =>
  ((_v) =>
    _v._tag === "SEExpr"
      ? (({ expr: value }) => checkReservedExpr(value))(_v)
      : _v._tag === "SESpread"
        ? (({ expr: value }) => checkReservedExpr(value))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(el);
const checkReservedExpr: (expr: Expr) => PErr[] = (expr: Expr) =>
  ((_v) =>
    _v._tag === "ECall"
      ? (({ fn, args }) => [...checkReservedExpr(fn), ..._Array_flatMap(checkReservedExpr, args)])(
          _v,
        )
      : _v._tag === "ELambda"
        ? (({ params, body, span: sp }) => [
            ..._Array_flatMap((param: LamParam) => checkReservedParam(param, sp), params),
            ...checkReservedExpr(body),
          ])(_v)
        : _v._tag === "ELetIn"
          ? (({ name, nameSpan: nameSp, value, body }) => [
              ...reservedWord(name, nameSp),
              ...checkReservedExpr(value),
              ...checkReservedExpr(body),
            ])(_v)
          : _v._tag === "ELetBind"
            ? (({ param, paramSpan: paramSp, value, body }) => [
                ...checkReservedParam(param, paramSp),
                ...checkReservedExpr(value),
                ...checkReservedExpr(body),
              ])(_v)
            : _v._tag === "EPipe"
              ? (({ left, right }) => [...checkReservedExpr(left), ...checkReservedExpr(right)])(_v)
              : _v._tag === "EDo"
                ? (({ exprs }) => _Array_flatMap(checkReservedExpr, exprs))(_v)
                : _v._tag === "ETernary"
                  ? (({ cond, thenE, elseE }) => [
                      ...checkReservedExpr(cond),
                      ...checkReservedExpr(thenE),
                      ...checkReservedExpr(elseE),
                    ])(_v)
                  : _v._tag === "EMatch"
                    ? (({ scrutinee, arms }) => [
                        ...checkReservedExpr(scrutinee),
                        ..._Array_flatMap(
                          (arm: MatchArm) => [
                            ...checkReservedPattern(arm.pattern),
                            ...((_v) =>
                              _v._tag === "Some"
                                ? (({ value: guard }) => checkReservedExpr(guard))(_v)
                                : _v._tag === "None"
                                  ? ([] as PErr[])
                                  : (() => {
                                      throw new Error("non-exhaustive match");
                                    })())(arm.guard),
                            ...checkReservedExpr(arm.body),
                          ],
                          arms,
                        ),
                      ])(_v)
                    : _v._tag === "ERecord"
                      ? (({ fields, spread }) => [
                          ...((_v) =>
                            _v._tag === "Some"
                              ? (({ value }) => checkReservedExpr(value))(_v)
                              : _v._tag === "None"
                                ? ([] as PErr[])
                                : (() => {
                                    throw new Error("non-exhaustive match");
                                  })())(spread),
                          ..._Array_flatMap(
                            (field: Field) => checkReservedExpr(field.value),
                            fields,
                          ),
                        ])(_v)
                      : _v._tag === "EField"
                        ? (({ target }) => checkReservedExpr(target))(_v)
                        : _v._tag === "ELoop"
                          ? (({ params, body }) => [
                              ..._Array_flatMap(
                                (param: LoopParam) => reservedWord(param.name, param.nameSpan),
                                params,
                              ),
                              ..._Array_flatMap(
                                (param: LoopParam) => checkReservedExpr(param.init),
                                params,
                              ),
                              ...checkReservedExpr(body),
                            ])(_v)
                          : _v._tag === "ERecur"
                            ? (({ args }) => _Array_flatMap(checkReservedExpr, args))(_v)
                            : _v._tag === "ETuple"
                              ? (({ elements }) => _Array_flatMap(checkReservedExpr, elements))(_v)
                              : _v._tag === "EArr"
                                ? (({ elements }) =>
                                    _Array_flatMap(checkReservedSeqElem, elements))(_v)
                                : _v._tag === "EList"
                                  ? (({ elements }) =>
                                      _Array_flatMap(checkReservedSeqElem, elements))(_v)
                                  : _v._tag === "ESet"
                                    ? (({ elements }) =>
                                        _Array_flatMap(checkReservedSeqElem, elements))(_v)
                                    : _v._tag === "EMap"
                                      ? (({ entries }) =>
                                          _Array_flatMap(
                                            (entry: MapEntry) => [
                                              ...checkReservedExpr(entry.key),
                                              ...checkReservedExpr(entry.value),
                                            ],
                                            entries,
                                          ))(_v)
                                      : _v._tag === "EInterp"
                                        ? (({ parts }) =>
                                            _Array_flatMap(
                                              (part: InterpPart) =>
                                                ((_v) =>
                                                  _v._tag === "IPLit"
                                                    ? ([] as PErr[])
                                                    : _v._tag === "IPExpr"
                                                      ? (({ expr: value }) =>
                                                          checkReservedExpr(value))(_v)
                                                      : (() => {
                                                          throw new Error("non-exhaustive match");
                                                        })())(part),
                                              parts,
                                            ))(_v)
                                        : ([] as PErr[]))(expr);
const checkReservedWordsAll: (stmts: Stmt[]) => PErr[] = (stmts: Stmt[]) =>
  _Array_flatMap(
    (stmt: Stmt) =>
      ((_v) =>
        _v._tag === "SLet"
          ? (({ name, nameSpan: nameSp, value }) => [
              ...reservedWord(name, nameSp),
              ...checkReservedExpr(value),
            ])(_v)
          : _v._tag === "SExpr"
            ? (({ value }) => checkReservedExpr(value))(_v)
            : _v._tag === "SExtern"
              ? (({ name, nameSpan: nameSp }) => reservedWord(name, nameSp))(_v)
              : _v._tag === "SType"
                ? (({ ctors }) =>
                    _Array_flatMap(
                      (ctor: Ctor) =>
                        _Array_flatMap(
                          (field: CtorField) =>
                            ((_v) =>
                              _v._tag === "Some"
                                ? (({ value: name }) =>
                                    reservedWord(name, typeExprSpan(field.fieldType)))(_v)
                                : _v._tag === "None"
                                  ? ([] as PErr[])
                                  : (() => {
                                      throw new Error("non-exhaustive match");
                                    })())(field.name),
                          ctor.fields,
                        ),
                      ctors,
                    ))(_v)
                : ([] as PErr[]))(stmt),
    stmts,
  );
const checkReservedWords: (stmts: Stmt[]) => Option<PErr> = (stmts: Stmt[]) =>
  _Array_head(checkReservedWordsAll(stmts));
const isUpperStart: (s: string) => boolean = (s: string) =>
  ((_v) =>
    _v._tag === "Some"
      ? (({ value: c }) => and(c >= 65, c <= 90))(_v)
      : _v._tag === "None"
        ? false
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Str_codeAt(0, s));
const strayTypeVar: _Curry<[params: string[], te: TypeExpr], Option<[string, SpanAt]>> = _curry(
  2,
  (params: string[], te: TypeExpr) =>
    ((_v) =>
      _v._tag === "TyName"
        ? (({ name, span: sp }) =>
            or(
              isUpperStart(name),
              or(_Array_contains(name, primTypeNames), _Array_contains(name, params)),
            )
              ? (None as Option<[string, SpanAt]>)
              : (Some(_tuple(name, sp)) as Option<[string, SpanAt]>))(_v)
        : _v._tag === "TyArrow"
          ? (({ from, to }) =>
              _Option_orElse(strayTypeVar(params, to), strayTypeVar(params, from)))(_v)
          : _v._tag === "TyApp"
            ? (({ args }) => firstSome(strayTypeVar(params), args))(_v)
            : _v._tag === "TyTuple"
              ? (({ elems }) => firstSome(strayTypeVar(params), elems))(_v)
              : _v._tag === "TyList"
                ? (({ elem }) => strayTypeVar(params, elem))(_v)
                : _v._tag === "TyQual"
                  ? (({ args }) => firstSome(strayTypeVar(params), args))(_v)
                  : _v._tag === "TyLit"
                    ? (None as Option<[string, SpanAt]>)
                    : _v._tag === "TyUnion"
                      ? (({ members }) => firstSome(strayTypeVar(params), members))(_v)
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(te),
);
const checkCtorFieldVars: (stmts: Stmt[]) => Option<PErr> = (stmts: Stmt[]) =>
  firstSome(
    (s: Stmt) =>
      ((_v) =>
        _v._tag === "SType"
          ? (({ name, params, ctors }) =>
              firstSome(
                (c: Ctor) =>
                  firstSome(
                    (f: CtorField) =>
                      ((_v) =>
                        _v._tag === "Some"
                          ? (({ value: [vn, vsp] }) =>
                              Some(
                                checkErr(
                                  `unknown type parameter '${vn}' in constructor '${c.name}' — declare it: type ${name} ${_Str_join(" ", _Array_append(vn, params))} = ...`,
                                  vsp,
                                ),
                              ) as Option<PErr>)(
                              _v as Extract<Option<[string, SpanAt]>, { _tag: "Some" }>,
                            )
                          : _v._tag === "None"
                            ? (None as Option<PErr>)
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(strayTypeVar(params, f.fieldType)),
                    c.fields,
                  ),
                ctors,
              ))(_v)
          : (None as Option<PErr>))(s),
    stmts,
  );
const checkCtorFieldVarsAll: (stmts: Stmt[]) => PErr[] = (stmts: Stmt[]) =>
  _Array_flatMap(
    (s: Stmt) =>
      ((_v) =>
        _v._tag === "SType"
          ? (({ name, params, ctors }) =>
              _Array_flatMap(
                (c: Ctor) =>
                  _Array_flatMap(
                    (f: CtorField) =>
                      ((_v) =>
                        _v._tag === "Some"
                          ? (({ value: [vn, vsp] }) => [
                              checkErr(
                                `unknown type parameter '${vn}' in constructor '${c.name}' — declare it: type ${name} ${_Str_join(" ", _Array_append(vn, params))} = ...`,
                                vsp,
                              ),
                            ])(_v as Extract<Option<[string, SpanAt]>, { _tag: "Some" }>)
                          : _v._tag === "None"
                            ? ([] as PErr[])
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(strayTypeVar(params, f.fieldType)),
                    c.fields,
                  ),
                ctors,
              ))(_v)
          : ([] as PErr[]))(s),
    stmts,
  );
const qualRefsFrom: (
  te: TypeExpr,
) => { alias: string; name: string; nameSpan: SpanAt; qualSpan: SpanAt }[] = (te: TypeExpr) =>
  ((_v) =>
    _v._tag === "TyName"
      ? ([] as { alias: string; name: string; nameSpan: SpanAt; qualSpan: SpanAt }[])
      : _v._tag === "TyArrow"
        ? (({ from, to }) => [...qualRefsFrom(from), ...qualRefsFrom(to)])(_v)
        : _v._tag === "TyApp"
          ? (({ args }) => _Array_flatMap(qualRefsFrom, args))(_v)
          : _v._tag === "TyTuple"
            ? (({ elems }) => _Array_flatMap(qualRefsFrom, elems))(_v)
            : _v._tag === "TyList"
              ? (({ elem }) => qualRefsFrom(elem))(_v)
              : _v._tag === "TyQual"
                ? (({ alias, name, nameSpan, args, span: sp }) => [
                    { alias: alias, name: name, nameSpan: nameSpan, qualSpan: sp },
                    ..._Array_flatMap(qualRefsFrom, args),
                  ])(_v)
                : _v._tag === "TyLit"
                  ? ([] as { alias: string; name: string; nameSpan: SpanAt; qualSpan: SpanAt }[])
                  : _v._tag === "TyUnion"
                    ? (({ members }) => _Array_flatMap(qualRefsFrom, members))(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(te);
const letInAnnots: (e: Expr) => TypeExpr[] = (e: Expr) =>
  ((_v) =>
    _v._tag === "ENum"
      ? ([] as TypeExpr[])
      : _v._tag === "EUnit"
        ? ([] as TypeExpr[])
        : _v._tag === "EBool"
          ? ([] as TypeExpr[])
          : _v._tag === "EStr"
            ? ([] as TypeExpr[])
            : _v._tag === "ERef"
              ? ([] as TypeExpr[])
              : _v._tag === "ECall"
                ? (({ fn, args }) => [...letInAnnots(fn), ..._Array_flatMap(letInAnnots, args)])(_v)
                : _v._tag === "ELambda"
                  ? (({ params, body }) => [
                      ...letInAnnots(body),
                      ..._Array_flatMap(
                        (p: LamParam) =>
                          ((_v) =>
                            _v._tag === "LPSpanned" &&
                            _v.param._tag === "LPLabeled" &&
                            _v.param.defaultValue._tag === "Some"
                              ? (({
                                  param: {
                                    defaultValue: { value: d },
                                  },
                                }) => letInAnnots(d))(
                                  _v as Extract<LamParam, { _tag: "LPSpanned" }> & {
                                    param: Extract<
                                      Extract<LamParam, { _tag: "LPSpanned" }>["param"],
                                      { _tag: "LPLabeled" }
                                    > & {
                                      defaultValue: Extract<
                                        Extract<
                                          Extract<LamParam, { _tag: "LPSpanned" }>["param"],
                                          { _tag: "LPLabeled" }
                                        >["defaultValue"],
                                        { _tag: "Some" }
                                      >;
                                    };
                                  },
                                )
                              : _v._tag === "LPLabeled" && _v.defaultValue._tag === "Some"
                                ? (({ defaultValue: { value: d } }) => letInAnnots(d))(
                                    _v as Extract<LamParam, { _tag: "LPLabeled" }> & {
                                      defaultValue: Extract<
                                        Extract<LamParam, { _tag: "LPLabeled" }>["defaultValue"],
                                        { _tag: "Some" }
                                      >;
                                    },
                                  )
                                : ([] as TypeExpr[]))(p),
                        params,
                      ),
                    ])(_v)
                  : _v._tag === "ELetIn"
                    ? (({ annot, value, body }) => [
                        ...letInAnnots(value),
                        ...letInAnnots(body),
                        ...((_v) =>
                          _v._tag === "Some"
                            ? (({ value: te }) => [te])(_v)
                            : _v._tag === "None"
                              ? ([] as TypeExpr[])
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(annot),
                      ])(_v)
                    : _v._tag === "ELetBind"
                      ? (({ value, body }) => [...letInAnnots(value), ...letInAnnots(body)])(_v)
                      : _v._tag === "EPipe"
                        ? (({ left, right }) => [...letInAnnots(left), ...letInAnnots(right)])(_v)
                        : _v._tag === "EDo"
                          ? (({ exprs }) => _Array_flatMap(letInAnnots, exprs))(_v)
                          : _v._tag === "ETernary"
                            ? (({ cond, thenE, elseE }) => [
                                ...letInAnnots(cond),
                                ...letInAnnots(thenE),
                                ...letInAnnots(elseE),
                              ])(_v)
                            : _v._tag === "EMatch"
                              ? (({ scrutinee, arms }) => [
                                  ...letInAnnots(scrutinee),
                                  ..._Array_flatMap(
                                    (a: MatchArm) => [
                                      ...((_v) =>
                                        _v._tag === "Some"
                                          ? (({ value: g }) => letInAnnots(g))(_v)
                                          : _v._tag === "None"
                                            ? ([] as TypeExpr[])
                                            : (() => {
                                                throw new Error("non-exhaustive match");
                                              })())(a.guard),
                                      ...letInAnnots(a.body),
                                    ],
                                    arms,
                                  ),
                                ])(_v)
                              : _v._tag === "ERecord"
                                ? (({ fields, spread }) => [
                                    ...((_v) =>
                                      _v._tag === "Some"
                                        ? (({ value: sp }) => letInAnnots(sp))(_v)
                                        : _v._tag === "None"
                                          ? ([] as TypeExpr[])
                                          : (() => {
                                              throw new Error("non-exhaustive match");
                                            })())(spread),
                                    ..._Array_flatMap((f: Field) => letInAnnots(f.value), fields),
                                  ])(_v)
                                : _v._tag === "EField"
                                  ? (({ target }) => letInAnnots(target))(_v)
                                  : _v._tag === "ELoop"
                                    ? (({ params, body }) => [
                                        ..._Array_flatMap(
                                          (prm: LoopParam) => letInAnnots(prm.init),
                                          params,
                                        ),
                                        ...letInAnnots(body),
                                      ])(_v)
                                    : _v._tag === "ERecur"
                                      ? (({ args }) => _Array_flatMap(letInAnnots, args))(_v)
                                      : _v._tag === "ETuple"
                                        ? (({ elements }) => _Array_flatMap(letInAnnots, elements))(
                                            _v,
                                          )
                                        : _v._tag === "EArr"
                                          ? (({ elements }) =>
                                              _Array_flatMap(seqElemAnnots, elements))(_v)
                                          : _v._tag === "EList"
                                            ? (({ elements }) =>
                                                _Array_flatMap(seqElemAnnots, elements))(_v)
                                            : _v._tag === "ESet"
                                              ? (({ elements }) =>
                                                  _Array_flatMap(seqElemAnnots, elements))(_v)
                                              : _v._tag === "EMap"
                                                ? (({ entries }) =>
                                                    _Array_flatMap(
                                                      (en: MapEntry) => [
                                                        ...letInAnnots(en.key),
                                                        ...letInAnnots(en.value),
                                                      ],
                                                      entries,
                                                    ))(_v)
                                                : _v._tag === "EInterp"
                                                  ? (({ parts }) =>
                                                      _Array_flatMap(
                                                        (prt: InterpPart) =>
                                                          ((_v) =>
                                                            _v._tag === "IPLit"
                                                              ? ([] as TypeExpr[])
                                                              : _v._tag === "IPExpr"
                                                                ? (({ expr: ex }) =>
                                                                    letInAnnots(ex))(_v)
                                                                : (() => {
                                                                    throw new Error(
                                                                      "non-exhaustive match",
                                                                    );
                                                                  })())(prt),
                                                        parts,
                                                      ))(_v)
                                                  : (() => {
                                                      throw new Error("non-exhaustive match");
                                                    })())(e);
const seqElemAnnots: (el: SeqElem) => TypeExpr[] = (el: SeqElem) =>
  ((_v) =>
    _v._tag === "SEExpr"
      ? (({ expr: e }) => letInAnnots(e))(_v)
      : _v._tag === "SESpread"
        ? (({ expr: e }) => letInAnnots(e))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(el);
const writtenTypeExprs: (stmts: Stmt[]) => TypeExpr[] = (stmts: Stmt[]) =>
  _Array_flatMap(
    (s: Stmt) =>
      ((_v) =>
        _v._tag === "SExtern"
          ? (({ typeExpr: te }) => [te])(_v)
          : _v._tag === "SLet"
            ? (({ annot, value }) => [
                ...((_v) =>
                  _v._tag === "Some"
                    ? (({ value: te }) => [te])(_v)
                    : _v._tag === "None"
                      ? ([] as TypeExpr[])
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(annot),
                ...letInAnnots(value),
              ])(_v)
            : _v._tag === "SExpr"
              ? (({ value }) => letInAnnots(value))(_v)
              : _v._tag === "SType"
                ? (({ ctors, alias, aliasType }) => [
                    ..._Array_flatMap(
                      (c: Ctor) => map((f: CtorField) => f.fieldType, c.fields),
                      ctors,
                    ),
                    ...((_v) =>
                      _v._tag === "Some"
                        ? (({ value: fields }) => map((f: AliasField) => f.fieldType, fields))(_v)
                        : _v._tag === "None"
                          ? ([] as TypeExpr[])
                          : (() => {
                              throw new Error("non-exhaustive match");
                            })())(alias),
                    ...((_v) =>
                      _v._tag === "Some"
                        ? (({ value: te }) => [te])(_v)
                        : _v._tag === "None"
                          ? ([] as TypeExpr[])
                          : (() => {
                              throw new Error("non-exhaustive match");
                            })())(aliasType),
                  ])(_v)
                : ([] as TypeExpr[]))(s),
    stmts,
  );

const emptyQuals: Map<string, QualScope> = new Map<string, QualScope>();
const checkQualifiedTypeNames: <A>(
  stmts: Stmt[],
  quals: Map<string, { types: Set<string> } & A>,
) => Option<PErr> = _curry(
  2,
  <A>(stmts: Stmt[], quals: Map<string, { types: Set<string> } & A>) => {
    const nsAliases: Set<string> = _Set_fromArray(
      _Array_flatMap(
        (s: Stmt) =>
          ((_v) =>
            _v._tag === "SImportNs" ? (({ alias }) => [alias.name])(_v) : ([] as string[]))(s),
        stmts,
      ),
    );
    return firstSome(
      (q: { alias: string; name: string; nameSpan: SpanAt; qualSpan: SpanAt }) =>
        _Set_has(q.alias, nsAliases)
          ? ((_v) =>
              _v._tag === "None"
                ? (None as Option<PErr>)
                : _v._tag === "Some"
                  ? (({ value: dep }) =>
                      _Set_has(q.name, dep.types)
                        ? (None as Option<PErr>)
                        : (Some(
                            checkErr(
                              `module alias '${q.alias}' has no exported type '${q.name}' — export it from the imported module ('export type ${q.name} = …')`,
                              q.nameSpan,
                            ),
                          ) as Option<PErr>))(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(_Map_get(q.alias, quals))
          : (Some(
              checkErr(
                `unknown module alias '${q.alias}' in type '${q.alias}.${q.name}' — a qualified type name needs a matching 'import * as ${q.alias} from "…"'`,
                q.qualSpan,
              ),
            ) as Option<PErr>),
      _Array_flatMap(qualRefsFrom, writtenTypeExprs(stmts)),
    );
  },
);
const checkQualifiedTypeNamesAll: <A>(
  stmts: Stmt[],
  quals: Map<string, { types: Set<string> } & A>,
) => PErr[] = _curry(2, <A>(stmts: Stmt[], quals: Map<string, { types: Set<string> } & A>) => {
  const nsAliases: Set<string> = _Set_fromArray(
    _Array_flatMap(
      (s: Stmt) =>
        ((_v) => (_v._tag === "SImportNs" ? (({ alias }) => [alias.name])(_v) : ([] as string[])))(
          s,
        ),
      stmts,
    ),
  );
  return _Array_flatMap(
    (q: { alias: string; name: string; nameSpan: SpanAt; qualSpan: SpanAt }) =>
      _Set_has(q.alias, nsAliases)
        ? ((_v) =>
            _v._tag === "None"
              ? ([] as PErr[])
              : _v._tag === "Some"
                ? (({ value: dep }) =>
                    _Set_has(q.name, dep.types)
                      ? ([] as PErr[])
                      : [
                          checkErr(
                            `module alias '${q.alias}' has no exported type '${q.name}' — export it from the imported module ('export type ${q.name} = …')`,
                            q.nameSpan,
                          ),
                        ])(_v)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(_Map_get(q.alias, quals))
        : [
            checkErr(
              `unknown module alias '${q.alias}' in type '${q.alias}.${q.name}' — a qualified type name needs a matching 'import * as ${q.alias} from "…"'`,
              q.qualSpan,
            ),
          ],
    _Array_flatMap(qualRefsFrom, writtenTypeExprs(stmts)),
  );
});

const duplicateLoopParam: <C, D>(
  params: ({ name: string; nameSpan: { end: number; start: number } & C } & D)[],
) => Option<PErr> = <C, D>(
  params: ({ name: string; nameSpan: { end: number; start: number } & C } & D)[],
) => {
  let i: number = 0;
  let seen: Set<string> = _Set_fromArray([] as string[]);
  while (true) {
    const _step = ((_v) =>
      _v._tag === "None"
        ? _done(None)
        : _v._tag === "Some"
          ? (({ value: p }) =>
              _Set_has(p.name, seen)
                ? _done(Some(checkErr(`duplicate loop param '${p.name}'`, p.nameSpan)))
                : _recur(i + 1, _Set_add(p.name, seen)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, params));
    if (_step._tag === "recur") {
      [i, seen] = _step.args;
      continue;
    }
    return _step.value;
  }
};
const checkLoopDo: _Curry<
  [exprs: Expr[], frame: Option<LoopFrame>, tail: boolean],
  Option<PErr>
> = _curry(3, (exprs: Expr[], frame: Option<LoopFrame>, tail: boolean) => {
  let i: number = 0;
  while (true) {
    const _step = ((_v) =>
      _v._tag === "None"
        ? _done(None as Option<PErr>)
        : _v._tag === "Some"
          ? (({ value: expr }) =>
              _Option_isNone(_Array_get(i + 1, exprs))
                ? _done(checkLoopExpr(expr, frame, tail))
                : ((_v) =>
                    _v._tag === "Some"
                      ? (({ value: error }) => _done(Some(error) as Option<PErr>))(_v)
                      : _v._tag === "None"
                        ? _recur(i + 1)
                        : (() => {
                            throw new Error("non-exhaustive match");
                          })())(checkLoopExpr(expr, frame, false)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, exprs));
    if (_step._tag === "recur") {
      i = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
const checkLoopExpr: _Curry<
  [e: Expr, frame: Option<LoopFrame>, tail: boolean],
  Option<PErr>
> = _curry(3, (e: Expr, frame: Option<LoopFrame>, tail: boolean) =>
  ((_v) =>
    _v._tag === "ELoop"
      ? (({ params, body }) =>
          _Option_orElse(
            checkLoopExpr(
              body,
              Some({
                arity: length(params),
                names: _Set_fromArray(map((p: LoopParam) => p.name, params)),
              }) as Option<LoopFrame>,
              true,
            ),
            _Option_orElse(
              firstSome((p: LoopParam) => checkLoopExpr(p.init, frame, false), params),
              duplicateLoopParam(params),
            ),
          ))(_v)
      : _v._tag === "ERecur"
        ? (({ args, span: sp }) =>
            ((_v) =>
              _v._tag === "None"
                ? (Some(checkErr("'recur' is only legal inside a loop body", sp)) as Option<PErr>)
                : _v._tag === "Some"
                  ? (({ value: current }) =>
                      !tail
                        ? (Some(
                            checkErr("'recur' must be in tail position of its enclosing loop", sp),
                          ) as Option<PErr>)
                        : !eq(length(args), current.arity)
                          ? (Some(
                              checkErr(
                                `'recur' takes ${show(current.arity)} argument${current.arity === 1 ? "" : "s"} (one per loop param), got ${show(length(args))}`,
                                sp,
                              ),
                            ) as Option<PErr>)
                          : firstSome((a: Expr) => checkLoopExpr(a, frame, false), args))(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(frame))(_v)
        : _v._tag === "ETernary"
          ? (({ cond, thenE, elseE }) =>
              _Option_orElse(
                checkLoopExpr(elseE, frame, tail),
                _Option_orElse(
                  checkLoopExpr(thenE, frame, tail),
                  checkLoopExpr(cond, frame, false),
                ),
              ))(_v)
          : _v._tag === "EMatch"
            ? (({ scrutinee, arms }) =>
                _Option_orElse(
                  firstSome(
                    (arm: MatchArm) =>
                      ((_v) =>
                        _v._tag === "Some"
                          ? (({ value: guard }) =>
                              _Option_orElse(
                                checkLoopExpr(arm.body, frame, tail),
                                checkLoopExpr(guard, frame, false),
                              ))(_v)
                          : _v._tag === "None"
                            ? checkLoopExpr(arm.body, frame, tail)
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(arm.guard),
                    arms,
                  ),
                  checkLoopExpr(scrutinee, frame, false),
                ))(_v)
            : _v._tag === "ELetIn"
              ? (({ name, nameSpan: nameSp, value, body }) =>
                  _Option_orElse(
                    checkLoopExpr(body, frame, tail),
                    _Option_orElse(
                      ((_v) =>
                        _v._tag === "Some" &&
                        (({ value: current }) => _Set_has(name, current.names))(_v)
                          ? (({ value: current }) =>
                              Some(
                                checkErr(
                                  `'${name}' shadows a loop param inside the loop body; rename it`,
                                  nameSp,
                                ),
                              ) as Option<PErr>)(_v)
                          : (None as Option<PErr>))(frame),
                      checkLoopExpr(value, frame, false),
                    ),
                  ))(_v)
              : _v._tag === "ELetBind"
                ? (({ value, body }) =>
                    _Option_orElse(
                      checkLoopExpr(body, None as Option<LoopFrame>, false),
                      checkLoopExpr(value, frame, false),
                    ))(_v)
                : _v._tag === "ELambda"
                  ? (({ body }) => checkLoopExpr(body, None as Option<LoopFrame>, false))(_v)
                  : _v._tag === "ECall"
                    ? (({ fn, args }) =>
                        _Option_orElse(
                          firstSome((a: Expr) => checkLoopExpr(a, frame, false), args),
                          checkLoopExpr(fn, frame, false),
                        ))(_v)
                    : _v._tag === "EPipe"
                      ? (({ left, right }) =>
                          _Option_orElse(
                            checkLoopExpr(right, frame, false),
                            checkLoopExpr(left, frame, false),
                          ))(_v)
                      : _v._tag === "EDo"
                        ? (({ exprs }) => checkLoopDo(exprs, frame, tail))(_v)
                        : _v._tag === "ERecord"
                          ? (({ fields, spread }) =>
                              _Option_orElse(
                                firstSome(
                                  (field: Field) => checkLoopExpr(field.value, frame, false),
                                  fields,
                                ),
                                ((_v) =>
                                  _v._tag === "Some"
                                    ? (({ value }) => checkLoopExpr(value, frame, false))(_v)
                                    : _v._tag === "None"
                                      ? (None as Option<PErr>)
                                      : (() => {
                                          throw new Error("non-exhaustive match");
                                        })())(spread),
                              ))(_v)
                          : _v._tag === "EField"
                            ? (({ target }) => checkLoopExpr(target, frame, false))(_v)
                            : _v._tag === "ETuple"
                              ? (({ elements }) =>
                                  firstSome(
                                    (el: Expr) => checkLoopExpr(el, frame, false),
                                    elements,
                                  ))(_v)
                              : _v._tag === "EArr"
                                ? (({ elements }) =>
                                    firstSome(
                                      (el: SeqElem) =>
                                        ((_v) =>
                                          _v._tag === "SEExpr"
                                            ? (({ expr: value }) =>
                                                checkLoopExpr(value, frame, false))(_v)
                                            : _v._tag === "SESpread"
                                              ? (({ expr: value }) =>
                                                  checkLoopExpr(value, frame, false))(_v)
                                              : (() => {
                                                  throw new Error("non-exhaustive match");
                                                })())(el),
                                      elements,
                                    ))(_v)
                                : _v._tag === "EList"
                                  ? (({ elements }) =>
                                      firstSome(
                                        (el: SeqElem) =>
                                          ((_v) =>
                                            _v._tag === "SEExpr"
                                              ? (({ expr: value }) =>
                                                  checkLoopExpr(value, frame, false))(_v)
                                              : _v._tag === "SESpread"
                                                ? (({ expr: value }) =>
                                                    checkLoopExpr(value, frame, false))(_v)
                                                : (() => {
                                                    throw new Error("non-exhaustive match");
                                                  })())(el),
                                        elements,
                                      ))(_v)
                                  : _v._tag === "ESet"
                                    ? (({ elements }) =>
                                        firstSome(
                                          (el: SeqElem) =>
                                            ((_v) =>
                                              _v._tag === "SEExpr"
                                                ? (({ expr: value }) =>
                                                    checkLoopExpr(value, frame, false))(_v)
                                                : _v._tag === "SESpread"
                                                  ? (({ expr: value }) =>
                                                      checkLoopExpr(value, frame, false))(_v)
                                                  : (() => {
                                                      throw new Error("non-exhaustive match");
                                                    })())(el),
                                          elements,
                                        ))(_v)
                                    : _v._tag === "EMap"
                                      ? (({ entries }) =>
                                          firstSome(
                                            (entry: MapEntry) =>
                                              _Option_orElse(
                                                checkLoopExpr(entry.value, frame, false),
                                                checkLoopExpr(entry.key, frame, false),
                                              ),
                                            entries,
                                          ))(_v)
                                      : _v._tag === "EInterp"
                                        ? (({ parts }) =>
                                            firstSome(
                                              (part: InterpPart) =>
                                                ((_v) =>
                                                  _v._tag === "IPLit"
                                                    ? (None as Option<PErr>)
                                                    : _v._tag === "IPExpr"
                                                      ? (({ expr: value }) =>
                                                          checkLoopExpr(value, frame, false))(_v)
                                                      : (() => {
                                                          throw new Error("non-exhaustive match");
                                                        })())(part),
                                              parts,
                                            ))(_v)
                                        : (None as Option<PErr>))(e),
);
const checkLoops: (stmts: Stmt[]) => Option<PErr> = (stmts: Stmt[]) =>
  firstSome(
    (stmt: Stmt) =>
      ((_v) =>
        _v._tag === "SLet"
          ? (({ value }) => checkLoopExpr(value, None as Option<LoopFrame>, false))(_v)
          : _v._tag === "SExpr"
            ? (({ value }) => checkLoopExpr(value, None as Option<LoopFrame>, false))(_v)
            : (None as Option<PErr>))(stmt),
    stmts,
  );
const loopParamErrors: <C, D>(
  params: ({ name: string; nameSpan: { end: number; start: number } & C } & D)[],
) => PErr[] = <C, D>(
  params: ({ name: string; nameSpan: { end: number; start: number } & C } & D)[],
) => {
  let i: number = 0;
  let seen: Set<string> = _Set_fromArray([] as string[]);
  let errors = [] as PErr[];
  while (true) {
    const _step = ((_v) =>
      _v._tag === "None"
        ? _done(errors)
        : _v._tag === "Some"
          ? (({ value: p }) =>
              _recur(
                i + 1,
                _Set_add(p.name, seen),
                _Set_has(p.name, seen)
                  ? [...errors, checkErr(`duplicate loop param '${p.name}'`, p.nameSpan)]
                  : errors,
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, params));
    if (_step._tag === "recur") {
      [i, seen, errors] = _step.args;
      continue;
    }
    return _step.value;
  }
};
const checkLoopDoAll: _Curry<[exprs: Expr[], frame: Option<LoopFrame>, tail: boolean], PErr[]> =
  _curry(3, (exprs: Expr[], frame: Option<LoopFrame>, tail: boolean) => {
    let i: number = 0;
    let errors: PErr[] = [] as PErr[];
    while (true) {
      const _step = ((_v) =>
        _v._tag === "None"
          ? _done(errors)
          : _v._tag === "Some"
            ? (({ value: expr }) =>
                ((isLast: boolean) =>
                  _recur(i + 1, [
                    ...errors,
                    ...checkLoopExprs(expr, frame, isLast ? tail : false),
                  ]))(_Option_isNone(_Array_get(i + 1, exprs))))(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, exprs));
      if (_step._tag === "recur") {
        [i, errors] = _step.args;
        continue;
      }
      return _step.value;
    }
  });
const checkLoopExprs: _Curry<[e: Expr, frame: Option<LoopFrame>, tail: boolean], PErr[]> = _curry(
  3,
  (e: Expr, frame: Option<LoopFrame>, tail: boolean) =>
    ((_v) =>
      _v._tag === "ELoop"
        ? (({ params, body }) => [
            ...loopParamErrors(params),
            ..._Array_flatMap((p: LoopParam) => checkLoopExprs(p.init, frame, false), params),
            ...checkLoopExprs(
              body,
              Some({
                arity: length(params),
                names: _Set_fromArray(map((p: LoopParam) => p.name, params)),
              }) as Option<LoopFrame>,
              true,
            ),
          ])(_v)
        : _v._tag === "ERecur"
          ? (({ args, span: sp }) =>
              ((siteErrors: PErr[]) => [
                ...siteErrors,
                ..._Array_flatMap((a: Expr) => checkLoopExprs(a, frame, false), args),
              ])(
                ((_v) =>
                  _v._tag === "None"
                    ? [checkErr("'recur' is only legal inside a loop body", sp)]
                    : _v._tag === "Some"
                      ? (({ value: current }) => [
                          ...(!tail
                            ? [
                                checkErr(
                                  "'recur' must be in tail position of its enclosing loop",
                                  sp,
                                ),
                              ]
                            : ([] as PErr[])),
                          ...(!eq(length(args), current.arity)
                            ? [
                                checkErr(
                                  `'recur' takes ${show(current.arity)} argument${current.arity === 1 ? "" : "s"} (one per loop param), got ${show(length(args))}`,
                                  sp,
                                ),
                              ]
                            : ([] as PErr[])),
                        ])(_v)
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(frame),
              ))(_v)
          : _v._tag === "ETernary"
            ? (({ cond, thenE, elseE }) => [
                ...checkLoopExprs(cond, frame, false),
                ...checkLoopExprs(thenE, frame, tail),
                ...checkLoopExprs(elseE, frame, tail),
              ])(_v)
            : _v._tag === "EMatch"
              ? (({ scrutinee, arms }) => [
                  ...checkLoopExprs(scrutinee, frame, false),
                  ..._Array_flatMap(
                    (arm: MatchArm) => [
                      ...((_v) =>
                        _v._tag === "Some"
                          ? (({ value: guard }) => checkLoopExprs(guard, frame, false))(_v)
                          : _v._tag === "None"
                            ? ([] as PErr[])
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(arm.guard),
                      ...checkLoopExprs(arm.body, frame, tail),
                    ],
                    arms,
                  ),
                ])(_v)
              : _v._tag === "ELetIn"
                ? (({ name, nameSpan: nameSp, value, body }) => [
                    ...((_v) =>
                      _v._tag === "Some" &&
                      (({ value: current }) => _Set_has(name, current.names))(_v)
                        ? (({ value: current }) => [
                            checkErr(
                              `'${name}' shadows a loop param inside the loop body; rename it`,
                              nameSp,
                            ),
                          ])(_v)
                        : ([] as PErr[]))(frame),
                    ...checkLoopExprs(value, frame, false),
                    ...checkLoopExprs(body, frame, tail),
                  ])(_v)
                : _v._tag === "ELetBind"
                  ? (({ value, body }) => [
                      ...checkLoopExprs(value, frame, false),
                      ...checkLoopExprs(body, None as Option<LoopFrame>, false),
                    ])(_v)
                  : _v._tag === "ELambda"
                    ? (({ body }) => checkLoopExprs(body, None as Option<LoopFrame>, false))(_v)
                    : _v._tag === "ECall"
                      ? (({ fn, args }) => [
                          ...checkLoopExprs(fn, frame, false),
                          ..._Array_flatMap((a: Expr) => checkLoopExprs(a, frame, false), args),
                        ])(_v)
                      : _v._tag === "EPipe"
                        ? (({ left, right }) => [
                            ...checkLoopExprs(left, frame, false),
                            ...checkLoopExprs(right, frame, false),
                          ])(_v)
                        : _v._tag === "EDo"
                          ? (({ exprs }) => checkLoopDoAll(exprs, frame, tail))(_v)
                          : _v._tag === "ERecord"
                            ? (({ fields, spread }) => [
                                ...((_v) =>
                                  _v._tag === "Some"
                                    ? (({ value }) => checkLoopExprs(value, frame, false))(_v)
                                    : _v._tag === "None"
                                      ? ([] as PErr[])
                                      : (() => {
                                          throw new Error("non-exhaustive match");
                                        })())(spread),
                                ..._Array_flatMap(
                                  (field: Field) => checkLoopExprs(field.value, frame, false),
                                  fields,
                                ),
                              ])(_v)
                            : _v._tag === "EField"
                              ? (({ target }) => checkLoopExprs(target, frame, false))(_v)
                              : _v._tag === "ETuple"
                                ? (({ elements }) =>
                                    _Array_flatMap(
                                      (el: Expr) => checkLoopExprs(el, frame, false),
                                      elements,
                                    ))(_v)
                                : _v._tag === "EArr"
                                  ? (({ elements }) =>
                                      _Array_flatMap(
                                        (el: SeqElem) =>
                                          ((_v) =>
                                            _v._tag === "SEExpr"
                                              ? (({ expr: value }) =>
                                                  checkLoopExprs(value, frame, false))(_v)
                                              : _v._tag === "SESpread"
                                                ? (({ expr: value }) =>
                                                    checkLoopExprs(value, frame, false))(_v)
                                                : (() => {
                                                    throw new Error("non-exhaustive match");
                                                  })())(el),
                                        elements,
                                      ))(_v)
                                  : _v._tag === "EList"
                                    ? (({ elements }) =>
                                        _Array_flatMap(
                                          (el: SeqElem) =>
                                            ((_v) =>
                                              _v._tag === "SEExpr"
                                                ? (({ expr: value }) =>
                                                    checkLoopExprs(value, frame, false))(_v)
                                                : _v._tag === "SESpread"
                                                  ? (({ expr: value }) =>
                                                      checkLoopExprs(value, frame, false))(_v)
                                                  : (() => {
                                                      throw new Error("non-exhaustive match");
                                                    })())(el),
                                          elements,
                                        ))(_v)
                                    : _v._tag === "ESet"
                                      ? (({ elements }) =>
                                          _Array_flatMap(
                                            (el: SeqElem) =>
                                              ((_v) =>
                                                _v._tag === "SEExpr"
                                                  ? (({ expr: value }) =>
                                                      checkLoopExprs(value, frame, false))(_v)
                                                  : _v._tag === "SESpread"
                                                    ? (({ expr: value }) =>
                                                        checkLoopExprs(value, frame, false))(_v)
                                                    : (() => {
                                                        throw new Error("non-exhaustive match");
                                                      })())(el),
                                            elements,
                                          ))(_v)
                                      : _v._tag === "EMap"
                                        ? (({ entries }) =>
                                            _Array_flatMap(
                                              (entry: MapEntry) => [
                                                ...checkLoopExprs(entry.key, frame, false),
                                                ...checkLoopExprs(entry.value, frame, false),
                                              ],
                                              entries,
                                            ))(_v)
                                        : _v._tag === "EInterp"
                                          ? (({ parts }) =>
                                              _Array_flatMap(
                                                (part: InterpPart) =>
                                                  ((_v) =>
                                                    _v._tag === "IPLit"
                                                      ? ([] as PErr[])
                                                      : _v._tag === "IPExpr"
                                                        ? (({ expr: value }) =>
                                                            checkLoopExprs(value, frame, false))(_v)
                                                        : (() => {
                                                            throw new Error("non-exhaustive match");
                                                          })())(part),
                                                parts,
                                              ))(_v)
                                          : ([] as PErr[]))(e),
);
const checkLoopsAll: (stmts: Stmt[]) => PErr[] = (stmts: Stmt[]) =>
  _Array_flatMap(
    (stmt: Stmt) =>
      ((_v) =>
        _v._tag === "SLet"
          ? (({ value }) => checkLoopExprs(value, None as Option<LoopFrame>, false))(_v)
          : _v._tag === "SExpr"
            ? (({ value }) => checkLoopExprs(value, None as Option<LoopFrame>, false))(_v)
            : ([] as PErr[]))(stmt),
    stmts,
  );
const mergeMissing: <A, B>(keys: A[], from: Map<A, B>, into: Map<A, B>) => Map<A, B> = _curry(
  3,
  <A, B>(keys: A[], from: Map<A, B>, into: Map<A, B>) =>
    match(keys)
      .with(
        (_v) => _v.length === 0,
        () => into,
      )
      .with(
        (_v) => _v.length >= 1,
        ([k, ...rest]) =>
          ((_v) =>
            _v._tag === "Some"
              ? (({ value: v }) =>
                  mergeMissing(rest, from, _Map_has(k, into) ? into : _Map_set(k, v, into)))(_v)
              : _v._tag === "None"
                ? mergeMissing(rest, from, into)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(_Map_get(k, from)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * check threaded with an imported registry (dep modules' exported variant
 * types) so a `switch` on an imported variant is exhaustiveness-checked against
 * every constructor — even ones the importer never named (those force a
 * catch-all). Mirrors src/check.ts's `check(prog, imported)`.
 */
export const checkWith: <A, B>(
  stmts: Stmt[],
  imported: { types: Map<string, string[]>; ctors: Map<string, CtorInfo> } & A,
  quals: Map<string, { types: Set<string> } & B>,
) => Result<Stmt[], PErr> = _curry(
  3,
  <A, B>(
    stmts: Stmt[],
    imported: { types: Map<string, string[]>; ctors: Map<string, CtorInfo> } & A,
    quals: Map<string, { types: Set<string> } & B>,
  ) =>
    ((_v) =>
      _v._tag === "Some"
        ? (({ value: e }) => Err(e) as Result<Stmt[], PErr>)(_v)
        : _v._tag === "None"
          ? ((_v) =>
              _v._tag === "Some"
                ? (({ value: e }) => Err(e) as Result<Stmt[], PErr>)(_v)
                : _v._tag === "None"
                  ? ((_v) =>
                      _v._tag === "Some"
                        ? (({ value: e }) => Err(e) as Result<Stmt[], PErr>)(_v)
                        : _v._tag === "None"
                          ? ((_v) =>
                              _v._tag === "Some"
                                ? (({ value: e }) => Err(e) as Result<Stmt[], PErr>)(_v)
                                : _v._tag === "None"
                                  ? ((_v) =>
                                      _v._tag === "Some"
                                        ? (({ value: e }) => Err(e) as Result<Stmt[], PErr>)(_v)
                                        : _v._tag === "None"
                                          ? _Result_flatMap(
                                              (reg0) =>
                                                ((reg: Registry) =>
                                                  ((_v) =>
                                                    _v._tag === "Some"
                                                      ? (({ value: e }) =>
                                                          Err(e) as Result<Stmt[], PErr>)(_v)
                                                      : _v._tag === "None"
                                                        ? (Ok(stmts) as Result<Stmt[], PErr>)
                                                        : (() => {
                                                            throw new Error("non-exhaustive match");
                                                          })())(
                                                    firstSome(
                                                      (s: Stmt) =>
                                                        ((_v) =>
                                                          _v._tag === "SLet"
                                                            ? (({ value }) =>
                                                                checkExpr(value, reg))(_v)
                                                            : _v._tag === "SExpr"
                                                              ? (({ value }) =>
                                                                  checkExpr(value, reg))(_v)
                                                              : (None as Option<PErr>))(s),
                                                      stmts,
                                                    ),
                                                  ))({
                                                  ctors: mergeMissing(
                                                    _Map_keys(imported.ctors),
                                                    imported.ctors,
                                                    reg0.ctors,
                                                  ),
                                                  types: mergeMissing(
                                                    _Map_keys(imported.types),
                                                    imported.types,
                                                    reg0.types,
                                                  ),
                                                }),
                                              buildRegistry(stmts),
                                            )
                                          : (() => {
                                              throw new Error("non-exhaustive match");
                                            })())(checkLoops(stmts))
                                  : (() => {
                                      throw new Error("non-exhaustive match");
                                    })())(checkQualifiedTypeNames(stmts, quals))
                          : (() => {
                              throw new Error("non-exhaustive match");
                            })())(checkCtorFieldVars(stmts))
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(checkReservedWords(stmts))
          : (() => {
              throw new Error("non-exhaustive match");
            })())(checkReservedNames(stmts)),
);
export const check: (stmts: Stmt[]) => Result<Stmt[], PErr> = (stmts: Stmt[]) =>
  checkWith(
    stmts,
    { ctors: new Map<string, CtorInfo>(), types: new Map<string, string[]>() },
    emptyQuals,
  );
/**
 * Aggregate independent declaration, loop, and match diagnostics without
 * changing the legacy single-error check railway. Registry construction still
 * stops at its first duplicate, just as the TypeScript checker does.
 */
export const checkAllWith: <A, B>(
  stmts: Stmt[],
  imported: { types: Map<string, string[]>; ctors: Map<string, CtorInfo> } & A,
  quals: Map<string, { types: Set<string> } & B>,
) => Result<Stmt[], PErr[]> = _curry(
  3,
  <A, B>(
    stmts: Stmt[],
    imported: { types: Map<string, string[]>; ctors: Map<string, CtorInfo> } & A,
    quals: Map<string, { types: Set<string> } & B>,
  ) =>
    ((_v) =>
      _v._tag === "Err"
        ? (({ error: e }) =>
            ((errors: PErr[]) =>
              length(errors) === 0
                ? (Ok(stmts) as Result<Stmt[], PErr[]>)
                : (Err(errors) as Result<Stmt[], PErr[]>))([
              ...checkReservedNamesAll(stmts),
              ...checkReservedWordsAll(stmts),
              ...checkCtorFieldVarsAll(stmts),
              ...checkQualifiedTypeNamesAll(stmts, quals),
              ...checkLoopsAll(stmts),
              e,
            ]))(_v)
        : _v._tag === "Ok"
          ? (({ value: reg0 }) =>
              ((reg: Registry) =>
                ((errors: PErr[]) =>
                  length(errors) === 0
                    ? (Ok(stmts) as Result<Stmt[], PErr[]>)
                    : (Err(errors) as Result<Stmt[], PErr[]>))([
                  ...checkReservedNamesAll(stmts),
                  ...checkReservedWordsAll(stmts),
                  ...checkCtorFieldVarsAll(stmts),
                  ...checkQualifiedTypeNamesAll(stmts, quals),
                  ...checkLoopsAll(stmts),
                  ..._Array_flatMap(
                    (stmt: Stmt) =>
                      ((_v) =>
                        _v._tag === "SLet"
                          ? (({ value }) => checkExprs(value, reg))(_v)
                          : _v._tag === "SExpr"
                            ? (({ value }) => checkExprs(value, reg))(_v)
                            : ([] as PErr[]))(stmt),
                    stmts,
                  ),
                ]))({
                ctors: mergeMissing(_Map_keys(imported.ctors), imported.ctors, reg0.ctors),
                types: mergeMissing(_Map_keys(imported.types), imported.types, reg0.types),
              }))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(buildRegistry(stmts)),
);
export const checkAll: (stmts: Stmt[]) => Result<Stmt[], PErr[]> = (stmts: Stmt[]) =>
  checkAllWith(
    stmts,
    { ctors: new Map<string, CtorInfo>(), types: new Map<string, string[]>() },
    emptyQuals,
  );
