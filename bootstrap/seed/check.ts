import type {
  AliasField,
  Ctor,
  CtorField,
  Expr,
  Field,
  InterpPart,
  LoopParam,
  MapEntry,
  MatchArm,
  Name,
  PatField,
  Pattern,
  SeqElem,
  Span,
  Stmt,
  TypeExpr,
} from "./ast";

export type Option<A> = { _tag: "Some"; value: A } | { _tag: "None" };
export type Result<A, B> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: B };
export type CErr = { message: string; start: number; end: number };
export type CtorInfo = { owner: string; arity: number };
export type Registry = { ctors: Map<string, CtorInfo>; types: Map<string, string[]> };
export type SeqCheck = { _tag: "SeqNotSeq" } | { _tag: "SeqTotal" } | { _tag: "SeqFail"; e: CErr };
export type QualScope = { types: Set<string> };

import type { _Curry } from "@mochi/compiler/runtime";

import {
  _curry,
  _recur,
  _done,
  Some,
  None,
  Ok,
  Err,
  add,
  eq,
  show,
  gt,
  gte,
  lte,
  not,
  and,
  or,
  length,
  map,
  filter,
  _Set_has,
  _Set_add,
  _Set_fromArray,
  _Map_has,
  _Map_getOr,
  _Map_set,
  _Map_keys,
  _Map_get,
  _Option_unwrapOr,
  _Option_orElse,
  _Option_isSome,
  _Option_isNone,
  _Result_flatMap,
  _Array_head,
  _Array_get,
  _Array_append,
  _Array_flatMap,
  _Array_contains,
  _Str_join,
  _Str_codeAt,
  _tuple,
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

const checkErr: <A, B, C, D>(
  message: A,
  sp: { end: B; start: C } & D,
) => { message: A; start: C; end: B } = _curry(
  2,
  <A, B, C, D>(message: A, sp: { end: B; start: C } & D) => ({
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
      const _step = match(_Array_get(i, xs))
        .with({ _tag: "None" }, () => _done(None))
        .with({ _tag: "Some" }, ({ value: x }) =>
          match(f(x))
            .with({ _tag: "Some" }, ({ value: e }) => _done(Some(e)))
            .with({ _tag: "None" }, () => _recur(add(i, 1)))
            .exhaustive(),
        )
        .exhaustive();
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
      const _step = match(_Array_get(i, xs))
        .with({ _tag: "None" }, () => _done(true))
        .with({ _tag: "Some" }, ({ value: x }) => (f(x) ? _recur(add(i, 1)) : _done(false)))
        .exhaustive();
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
      const _step = match(_Array_get(i, xs))
        .with({ _tag: "None" }, () => _done(false))
        .with({ _tag: "Some" }, ({ value: x }) => (f(x) ? _done(true) : _recur(add(i, 1))))
        .exhaustive();
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
const exprSpan: (e: Expr) => Span = (e: Expr) =>
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
    .with({ _tag: "ELoop" }, ({ span: sp }) => sp)
    .with({ _tag: "ERecur" }, ({ span: sp }) => sp)
    .with({ _tag: "ERecord" }, ({ span: sp }) => sp)
    .with({ _tag: "EField" }, ({ span: sp }) => sp)
    .with({ _tag: "ETuple" }, ({ span: sp }) => sp)
    .with({ _tag: "EArr" }, ({ span: sp }) => sp)
    .with({ _tag: "EList" }, ({ span: sp }) => sp)
    .with({ _tag: "ESet" }, ({ span: sp }) => sp)
    .with({ _tag: "EMap" }, ({ span: sp }) => sp)
    .with({ _tag: "EInterp" }, ({ span: sp }) => sp)
    .exhaustive();
const patSpan: (p: Pattern) => Span = (p: Pattern) =>
  match(p)
    .with({ _tag: "PWild" }, ({ span: sp }) => sp)
    .with({ _tag: "PUnit" }, ({ span: sp }) => sp)
    .with({ _tag: "PBind" }, ({ span: sp }) => sp)
    .with({ _tag: "PAs" }, ({ span: sp }) => sp)
    .with({ _tag: "PLit" }, ({ span: sp }) => sp)
    .with({ _tag: "PBool" }, ({ span: sp }) => sp)
    .with({ _tag: "PStr" }, ({ span: sp }) => sp)
    .with({ _tag: "PTuple" }, ({ span: sp }) => sp)
    .with({ _tag: "PRecord" }, ({ span: sp }) => sp)
    .with({ _tag: "PCtor" }, ({ span: sp }) => sp)
    .with({ _tag: "PArr" }, ({ span: sp }) => sp)
    .with({ _tag: "PList" }, ({ span: sp }) => sp)
    .with({ _tag: "POr" }, ({ span: sp }) => sp)
    .exhaustive();
const isCatchAll: (p: Pattern) => boolean = (p: Pattern) =>
  match(p)
    .with({ _tag: "PWild" }, () => true)
    .with({ _tag: "PUnit" }, () => true)
    .with({ _tag: "PBind" }, () => true)
    .with({ _tag: "PAs" }, ({ pat }) => isCatchAll(pat))
    .with({ _tag: "PRecord" }, ({ fields }) => allOf((f: PatField) => isCatchAll(f.pat), fields))
    .with({ _tag: "PTuple" }, ({ elems }) => allOf(isCatchAll, elems))
    .with({ _tag: "PArr" }, ({ elems, rest }) => and(eq(length(elems), 0), _Option_isSome(rest)))
    .with({ _tag: "PList" }, ({ elems, rest }) => and(eq(length(elems), 0), _Option_isSome(rest)))
    .otherwise(() => false);
const isPList: (p: Pattern) => boolean = (p: Pattern) =>
  match(p)
    .with({ _tag: "PList" }, () => true)
    .otherwise(() => false);
const isPCtor: (p: Pattern) => boolean = (p: Pattern) =>
  match(p)
    .with({ _tag: "PCtor" }, () => true)
    .otherwise(() => false);
const ctorNameOf: (p: Pattern) => string = (p: Pattern) =>
  match(p)
    .with({ _tag: "PCtor" }, ({ ctor: name }) => name)
    .otherwise(() => "");
const patCtorKey: _Curry<[ctor: string, ns: Option<string>], string> = _curry(
  2,
  (ctor: string, ns: Option<string>) =>
    match(ns)
      .with({ _tag: "Some" }, ({ value: alias }) => `${alias}.${ctor}`)
      .with({ _tag: "None" }, () => ctor)
      .exhaustive(),
);
const seqElemsRest: (p: Pattern) => Option<[Pattern[], Option<Pattern>]> = (p: Pattern) =>
  match(p)
    .with(
      { _tag: "PArr" },
      ({ elems, rest }) => Some(_tuple(elems, rest)) as Option<[Pattern[], Option<Pattern>]>,
    )
    .with(
      { _tag: "PList" },
      ({ elems, rest }) => Some(_tuple(elems, rest)) as Option<[Pattern[], Option<Pattern>]>,
    )
    .otherwise(() => None as Option<[Pattern[], Option<Pattern>]>);
const checkPattern: <A, B>(
  p: Pattern,
  reg: { ctors: Map<string, { arity: number } & A> } & B,
  top: boolean,
) => Option<CErr> = _curry(
  3,
  <A, B>(p: Pattern, reg: { ctors: Map<string, { arity: number } & A> } & B, top: boolean) =>
    match(p)
      .with({ _tag: "PAs" }, ({ pat }) => checkPattern(pat, reg, top))
      .with({ _tag: "PCtor" }, ({ ctor, args, ns, span: sp }) =>
        ((key: string) =>
          match(_Map_get(key, reg.ctors))
            .with(
              { _tag: "None" },
              () => Some(checkErr(`unknown constructor '${key}'`, sp)) as Option<CErr>,
            )
            .with({ _tag: "Some" }, ({ value: info }) =>
              eq(length(args), info.arity)
                ? firstSome((a: Pattern) => checkPattern(a, reg, false), args)
                : (Some(
                    checkErr(
                      `constructor '${ctor}' expects ${show(info.arity)} arg(s), got ${show(length(args))}`,
                      sp,
                    ),
                  ) as Option<CErr>),
            )
            .exhaustive())(patCtorKey(ctor, ns)),
      )
      .with({ _tag: "PRecord" }, ({ fields }) =>
        firstSome((f: PatField) => checkPattern(f.pat, reg, false), fields),
      )
      .with({ _tag: "PTuple" }, ({ elems }) =>
        firstSome((el: Pattern) => checkPattern(el, reg, false), elems),
      )
      .with({ _tag: "PArr" }, ({ elems, rest }) =>
        _Option_orElse(
          match(rest)
            .with({ _tag: "Some" }, ({ value: r }) => checkPattern(r, reg, false))
            .with({ _tag: "None" }, () => None as Option<CErr>)
            .exhaustive(),
          firstSome((el: Pattern) => checkPattern(el, reg, false), elems),
        ),
      )
      .with({ _tag: "PList" }, ({ elems, rest, span: sp }) =>
        top
          ? _Option_orElse(
              match(rest)
                .with({ _tag: "Some" }, ({ value: r }) => checkPattern(r, reg, false))
                .with({ _tag: "None" }, () => None as Option<CErr>)
                .exhaustive(),
              firstSome((el: Pattern) => checkPattern(el, reg, false), elems),
            )
          : (Some(
              checkErr(
                "lazy-List pattern cannot nest inside another pattern (matching pulls from the sequence)",
                sp,
              ),
            ) as Option<{ message: string; start: number; end: number }>),
      )
      .with({ _tag: "POr" }, ({ alts, span: sp }) => checkOrPattern(alts, sp, reg))
      .otherwise(() => None as Option<CErr>),
);
const binderPathsArgs: _Curry<
  [args: Pattern[], i: number, at: string, acc: Map<string, string>],
  Result<Map<string, string>, CErr>
> = _curry(4, (args: Pattern[], i: number, at: string, acc: Map<string, string>) =>
  match(_Array_get(i, args))
    .with({ _tag: "None" }, () => Ok(acc) as Result<Map<string, string>, CErr>)
    .with({ _tag: "Some" }, ({ value: a }) =>
      _Result_flatMap(
        (acc2: Map<string, string>) => binderPathsArgs(args, add(i, 1), at, acc2),
        binderPaths(a, `${at}.a${show(i)}`, acc),
      ),
    )
    .exhaustive(),
);
const binderPathsFields: _Curry<
  [fields: PatField[], i: number, at: string, acc: Map<string, string>],
  Result<Map<string, string>, CErr>
> = _curry(4, (fields: PatField[], i: number, at: string, acc: Map<string, string>) =>
  match(_Array_get(i, fields))
    .with({ _tag: "None" }, () => Ok(acc) as Result<Map<string, string>, CErr>)
    .with({ _tag: "Some" }, ({ value: f }) =>
      _Result_flatMap(
        (acc2: Map<string, string>) => binderPathsFields(fields, add(i, 1), at, acc2),
        binderPaths(f.pat, `${at}.${f.label}`, acc),
      ),
    )
    .exhaustive(),
);
const binderPathsElems: _Curry<
  [elems: Pattern[], i: number, at: string, acc: Map<string, string>],
  Result<Map<string, string>, CErr>
> = _curry(4, (elems: Pattern[], i: number, at: string, acc: Map<string, string>) =>
  match(_Array_get(i, elems))
    .with({ _tag: "None" }, () => Ok(acc) as Result<Map<string, string>, CErr>)
    .with({ _tag: "Some" }, ({ value: e }) =>
      _Result_flatMap(
        (acc2: Map<string, string>) => binderPathsElems(elems, add(i, 1), at, acc2),
        binderPaths(e, `${at}.t${show(i)}`, acc),
      ),
    )
    .exhaustive(),
);
const binderPaths: _Curry<
  [p: Pattern, at: string, acc: Map<string, string>],
  Result<Map<string, string>, CErr>
> = _curry(3, (p: Pattern, at: string, acc: Map<string, string>) =>
  match(p)
    .with({ _tag: "PAs" }, ({ pat, name, nameSpan: nameSp }) =>
      _Result_flatMap(
        (acc1: Map<string, string>) =>
          _Map_has(name, acc1)
            ? (Err(checkErr(`pattern binds '${name}' more than once`, nameSp)) as Result<
                Map<string, string>,
                CErr
              >)
            : (Ok(_Map_set(name, at, acc1)) as Result<Map<string, string>, CErr>),
        binderPaths(pat, at, acc),
      ),
    )
    .with({ _tag: "PBind" }, ({ name, span: sp }) =>
      _Map_has(name, acc)
        ? (Err(checkErr(`pattern binds '${name}' more than once`, sp)) as Result<
            Map<string, string>,
            CErr
          >)
        : (Ok(_Map_set(name, at, acc)) as Result<Map<string, string>, CErr>),
    )
    .with({ _tag: "PCtor" }, ({ args }) => binderPathsArgs(args, 0, at, acc))
    .with({ _tag: "PRecord" }, ({ fields }) => binderPathsFields(fields, 0, at, acc))
    .with({ _tag: "PTuple" }, ({ elems }) => binderPathsElems(elems, 0, at, acc))
    .otherwise(() => Ok(acc) as Result<Map<string, string>, CErr>),
);
const altMapsFrom: <A, B>(
  alts: Pattern[],
  i: number,
  reg: { ctors: Map<string, { arity: number } & A> } & B,
  acc: Map<string, string>[],
) => Result<Map<string, string>[], CErr> = _curry(
  4,
  <A, B>(
    alts: Pattern[],
    i: number,
    reg: { ctors: Map<string, { arity: number } & A> } & B,
    acc: Map<string, string>[],
  ) =>
    match(_Array_get(i, alts))
      .with({ _tag: "None" }, () => Ok(acc) as Result<Map<string, string>[], CErr>)
      .with({ _tag: "Some" }, ({ value: alt }) =>
        isCatchAll(alt)
          ? (Err(
              checkErr(
                "an or-pattern alternative can't be a catch-all (`_` or a bare binding)",
                patSpan(alt),
              ),
            ) as Result<Map<string, string>[], CErr>)
          : _Option_isSome(seqElemsRest(alt))
            ? (Err(
                checkErr(
                  "array/list patterns can't appear as an or-pattern alternative",
                  patSpan(alt),
                ),
              ) as Result<Map<string, string>[], CErr>)
            : match(checkPattern(alt, reg, false))
                .with(
                  { _tag: "Some" },
                  ({ value: e }) => Err(e) as Result<Map<string, string>[], CErr>,
                )
                .with({ _tag: "None" }, () =>
                  _Result_flatMap(
                    (m) => altMapsFrom(alts, add(i, 1), reg, _Array_append(m, acc)),
                    binderPaths(alt, "", new Map<string, string>()),
                  ),
                )
                .exhaustive(),
      )
      .exhaustive(),
);
const missingNameErr: <A, B, C>(
  name: string,
  sp: { end: A; start: B } & C,
) => { message: string; start: B; end: A } = _curry(
  2,
  <A, B, C>(name: string, sp: { end: A; start: B } & C) =>
    checkErr(
      `or-pattern alternatives must bind the same names ('${name}' is missing in an alternative)`,
      sp,
    ),
);
const consistentBindsFrom: <A, B, C>(
  maps: Map<string, string>[],
  i: number,
  ref: Map<string, string>,
  sp: { end: A; start: B } & C,
) => Option<{ message: string; start: B; end: A }> = _curry(
  4,
  <A, B, C>(
    maps: Map<string, string>[],
    i: number,
    ref: Map<string, string>,
    sp: { end: A; start: B } & C,
  ) =>
    match(_Array_get(i, maps))
      .with({ _tag: "None" }, () => None)
      .with({ _tag: "Some" }, ({ value: m }) =>
        _Option_orElse(
          consistentBindsFrom(maps, add(i, 1), ref, sp),
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
        ),
      )
      .exhaustive(),
);
const checkOrPattern: <A, B>(
  alts: Pattern[],
  sp: Span,
  reg: { ctors: Map<string, { arity: number } & A> } & B,
) => Option<CErr> = _curry(
  3,
  <A, B>(alts: Pattern[], sp: Span, reg: { ctors: Map<string, { arity: number } & A> } & B) =>
    match(altMapsFrom(alts, 0, reg, [] as Map<string, string>[]))
      .with({ _tag: "Err" }, ({ error: e }) => Some(e) as Option<CErr>)
      .with({ _tag: "Ok" }, ({ value: maps }) =>
        match(_Array_head(maps))
          .with({ _tag: "None" }, () => None as Option<CErr>)
          .with({ _tag: "Some" }, ({ value: ref }) => consistentBindsFrom(maps, 1, ref, sp))
          .exhaustive(),
      )
      .exhaustive(),
);
const armUnguardedCatchAll: <A, B>(a: { pattern: Pattern; guard: Option<A> } & B) => boolean = <
  A,
  B,
>(
  a: { pattern: Pattern; guard: Option<A> } & B,
) => and(isCatchAll(a.pattern), _Option_isNone(a.guard));
const guardErrs: _Curry<[arms: MatchArm[], listSwitch: boolean], Option<CErr>> = _curry(
  2,
  (arms: MatchArm[], listSwitch: boolean) =>
    firstSome(
      (a: MatchArm) =>
        match(a.guard)
          .with(
            { _tag: "None" },
            () => None as Option<{ message: string; start: number; end: number }>,
          )
          .with({ _tag: "Some" }, ({ value: g }) =>
            or(isPList(a.pattern), listSwitch)
              ? (Some(
                  checkErr(
                    "`when` guards are unsupported in a lazy-List switch (matching pulls from the sequence)",
                    exprSpan(g),
                  ),
                ) as Option<{ message: string; start: number; end: number }>)
              : (None as Option<{ message: string; start: number; end: number }>),
          )
          .exhaustive(),
      arms,
    ),
);
const firstCatchIdx: _Curry<[arms: MatchArm[], i0: number], Option<number>> = _curry(
  2,
  (arms: MatchArm[], i0: number) => {
    let i: number = i0;
    while (true) {
      const _step = match(_Array_get(i, arms))
        .with({ _tag: "None" }, () => _done(None as Option<number>))
        .with({ _tag: "Some" }, ({ value: a }) =>
          armUnguardedCatchAll(a) ? _done(Some(i) as Option<number>) : _recur(add(i, 1)),
        )
        .exhaustive();
      if (_step._tag === "recur") {
        i = _step.args[0];
        continue;
      }
      return _step.value;
    }
  },
);
const unreachableAfterCatch: (arms: MatchArm[]) => Option<CErr> = (arms: MatchArm[]) =>
  match(firstCatchIdx(arms, 0))
    .with({ _tag: "None" }, () => None as Option<{ message: string; start: number; end: number }>)
    .with({ _tag: "Some" }, ({ value: i }) =>
      match(_Array_get(add(i, 1), arms))
        .with(
          { _tag: "None" },
          () => None as Option<{ message: string; start: number; end: number }>,
        )
        .with(
          { _tag: "Some" },
          ({ value: a }) =>
            Some(
              checkErr(
                "unreachable arm: a catch-all arm above it matches first",
                patSpan(a.pattern),
              ),
            ) as Option<{ message: string; start: number; end: number }>,
        )
        .exhaustive(),
    )
    .exhaustive();
const SeqNotSeq: SeqCheck = { _tag: "SeqNotSeq" };
const SeqTotal: SeqCheck = { _tag: "SeqTotal" };
const SeqFail = (e: CErr): SeqCheck => ({ _tag: "SeqFail", e });
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
  return eq(length(seqs), 0)
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
              match(seqElemsRest(p))
                .with(
                  (_v): _v is Extract<Option<[Pattern[], Option<Pattern>]>, { _tag: "Some" }> => {
                    const _g: any = _v;
                    return _g._tag === "Some";
                  },
                  ({ value: [elems, rest] }) => and(eq(length(elems), 1), _Option_isSome(rest)),
                )
                .with({ _tag: "None" }, () => false)
                .exhaustive(),
            seqs,
          ),
        ))(
        someOf(
          (p: Pattern) =>
            match(seqElemsRest(p))
              .with(
                (_v): _v is Extract<Option<[Pattern[], Option<Pattern>]>, { _tag: "Some" }> => {
                  const _g: any = _v;
                  return _g._tag === "Some";
                },
                ({ value: [elems, rest] }) => and(eq(length(elems), 0), _Option_isNone(rest)),
              )
              .with({ _tag: "None" }, () => false)
              .exhaustive(),
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
) => Result<[Option<string>, Set<string>], CErr> = _curry(
  5,
  <A, B, C, D>(
    arms: ({ pattern: Pattern; guard: Option<A> } & B)[],
    i: number,
    reg: { ctors: Map<string, { arity: number; owner: string } & C> } & D,
    owner: Option<string>,
    covered: Set<string>,
  ) =>
    match(_Array_get(i, arms))
      .with(
        { _tag: "None" },
        () => Ok(_tuple(owner, covered)) as Result<[Option<string>, Set<string>], CErr>,
      )
      .with({ _tag: "Some" }, ({ value: a }) =>
        match(a.pattern)
          .with({ _tag: "PCtor" }, ({ ctor, args, ns, span: sp }) =>
            ((key: string) =>
              match(_Map_get(key, reg.ctors))
                .with(
                  { _tag: "None" },
                  () =>
                    Err(checkErr(`unknown constructor '${key}'`, sp)) as Result<
                      [Option<string>, Set<string>],
                      CErr
                    >,
                )
                .with({ _tag: "Some" }, ({ value: info }) =>
                  not(eq(length(args), info.arity))
                    ? (Err(
                        checkErr(
                          `constructor '${ctor}' expects ${show(info.arity)} arg(s), got ${show(length(args))}`,
                          sp,
                        ),
                      ) as Result<[Option<string>, Set<string>], CErr>)
                    : match(owner)
                        .with(
                          (_v): _v is Extract<Option<string>, { _tag: "Some" }> => {
                            const _g: any = _v;
                            return (
                              _g._tag === "Some" &&
                              (({ value: own }) => not(eq(own, info.owner)))(_g)
                            );
                          },
                          ({ value: own }) =>
                            Err(
                              checkErr(`switch mixes variants of '${own}' and '${info.owner}'`, sp),
                            ) as Result<[Option<string>, Set<string>], CErr>,
                        )
                        .otherwise(() =>
                          ((covered2: Set<string>) =>
                            ctorLoop(
                              arms,
                              add(i, 1),
                              reg,
                              Some(info.owner) as Option<string>,
                              covered2,
                            ))(
                            and(allOf(isCatchAll, args), _Option_isNone(a.guard))
                              ? _Set_add(ctor, covered)
                              : covered,
                          ),
                        ),
                )
                .exhaustive())(patCtorKey(ctor, ns)),
          )
          .otherwise(() => ctorLoop(arms, add(i, 1), reg, owner, covered)),
      )
      .exhaustive(),
);
const seqVerdict: <A>(arms: MatchArm[], mSpan: { end: number; start: number } & A) => Option<CErr> =
  _curry(2, <A>(arms: MatchArm[], mSpan: { end: number; start: number } & A) =>
    match(checkSeqExhaustive(arms, mSpan))
      .with({ _tag: "SeqTotal" }, () => None as Option<CErr>)
      .with({ _tag: "SeqFail" }, ({ e }) => Some(e) as Option<CErr>)
      .with({ _tag: "SeqNotSeq" }, () => None as Option<CErr>)
      .exhaustive(),
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
const matrixVerdict: <A, B, C, D, E>(
  arms: MatchArm[],
  leaves: ({ pattern: Pattern; guard: Option<A> } & D)[],
  ownerOpt: Option<string>,
  mSpan: { end: B; start: C } & E,
  reg: Registry,
) => Option<{ message: string; start: C; end: B }> = _curry(
  5,
  <A, B, C, D, E>(
    arms: MatchArm[],
    leaves: ({ pattern: Pattern; guard: Option<A> } & D)[],
    ownerOpt: Option<string>,
    mSpan: { end: B; start: C } & E,
    reg: Registry,
  ) =>
    match(checkExhaustiveM(unguardedPatterns(arms), reg))
      .with({ _tag: "ExOk" }, () => None)
      .with({ _tag: "ExFuel" }, () =>
        Some(checkErr("switch too complex to prove exhaustive — add a `_` catch-all arm", mSpan)),
      )
      .with({ _tag: "ExWitness" }, ({ witness: w }) =>
        ((own: string) =>
          ((named: Set<string>) =>
            ((absent: string[]) =>
              and(and(isWideWitnessM(w), not(eq(own, ""))), gt(length(absent), 0))
                ? Some(
                    checkErr(
                      `non-exhaustive switch on '${own}': missing ${_Str_join(", ", absent)}`,
                      mSpan,
                    ),
                  )
                : Some(
                    checkErr(`non-exhaustive switch: '${showWitness(w)}' is not matched`, mSpan),
                  ))(
              filter(
                (c: string) => not(_Set_has(c, named)),
                _Map_getOr([] as string[], own, reg.types),
              ),
            ))(namedUnguarded(leaves)))(_Option_unwrapOr("", ownerOpt)),
      )
      .exhaustive(),
);
const leavesOfArm: <A, B>(
  a: { pattern: Pattern; guard: A } & B,
) => { pattern: Pattern; guard: A }[] = <A, B>(a: { pattern: Pattern; guard: A } & B) =>
  match(a.pattern)
    .with({ _tag: "POr" }, ({ alts }) =>
      map((alt: Pattern) => ({ pattern: alt, guard: a.guard }), alts),
    )
    .otherwise(() => [{ pattern: a.pattern, guard: a.guard }]);
const checkMatch: <A>(
  arms: MatchArm[],
  mSpan: { end: number; start: number } & A,
  reg: Registry,
) => Option<CErr> = _curry(
  3,
  <A>(arms: MatchArm[], mSpan: { end: number; start: number } & A, reg: Registry) =>
    match(firstSome((a: MatchArm) => checkPattern(a.pattern, reg, true), arms))
      .with({ _tag: "Some" }, ({ value: e }) => Some(e) as Option<CErr>)
      .with({ _tag: "None" }, () =>
        ((listSwitch: boolean) =>
          match(guardErrs(arms, listSwitch))
            .with({ _tag: "Some" }, ({ value: e }) => Some(e) as Option<CErr>)
            .with({ _tag: "None" }, () =>
              match(unreachableAfterCatch(arms))
                .with({ _tag: "Some" }, ({ value: e }) => Some(e) as Option<CErr>)
                .with({ _tag: "None" }, () =>
                  ((hasCatchAll: boolean) =>
                    ((leaves: { pattern: Pattern; guard: Option<Expr> }[]) =>
                      ((ctorArms: { pattern: Pattern; guard: Option<Expr> }[]) =>
                        someOf((a: MatchArm) => isPList(a.pattern), arms)
                          ? hasCatchAll
                            ? (None as Option<CErr>)
                            : seqVerdict(arms, mSpan)
                          : match(
                              ctorLoop(
                                ctorArms,
                                0,
                                reg,
                                None as Option<string>,
                                _Set_fromArray([] as string[]),
                              ),
                            )
                              .with({ _tag: "Err" }, ({ error: e }) => Some(e) as Option<CErr>)
                              .with(
                                (
                                  _v,
                                ): _v is Extract<
                                  Result<[Option<string>, Set<string>], CErr>,
                                  { _tag: "Ok" }
                                > => {
                                  const _g: any = _v;
                                  return _g._tag === "Ok";
                                },
                                ({ value: [ownerOpt] }) =>
                                  matrixVerdict(arms, leaves, ownerOpt, mSpan, reg),
                              )
                              .exhaustive())(
                        filter(
                          (a: { pattern: Pattern; guard: Option<Expr> }) => isPCtor(a.pattern),
                          leaves,
                        ),
                      ))(_Array_flatMap(leavesOfArm, arms)))(someOf(armUnguardedCatchAll, arms)),
                )
                .exhaustive(),
            )
            .exhaustive())(
          someOf((a: MatchArm) => and(isPList(a.pattern), not(isCatchAll(a.pattern))), arms),
        ),
      )
      .exhaustive(),
);
const checkExpr: _Curry<[e: Expr, reg: Registry], Option<CErr>> = _curry(
  2,
  (e: Expr, reg: Registry) =>
    match(e)
      .with({ _tag: "ENum" }, () => None as Option<CErr>)
      .with({ _tag: "EUnit" }, () => None as Option<CErr>)
      .with({ _tag: "EBool" }, () => None as Option<CErr>)
      .with({ _tag: "EStr" }, () => None as Option<CErr>)
      .with({ _tag: "ERef" }, () => None as Option<CErr>)
      .with({ _tag: "ECall" }, ({ fn, args }) =>
        _Option_orElse(
          firstSome((a: Expr) => checkExpr(a, reg), args),
          checkExpr(fn, reg),
        ),
      )
      .with({ _tag: "ELambda" }, ({ body }) => checkExpr(body, reg))
      .with({ _tag: "ELetIn" }, ({ value, body }) =>
        _Option_orElse(checkExpr(body, reg), checkExpr(value, reg)),
      )
      .with({ _tag: "ELetBind" }, ({ value, body }) =>
        _Option_orElse(checkExpr(body, reg), checkExpr(value, reg)),
      )
      .with({ _tag: "EPipe" }, ({ left, right }) =>
        _Option_orElse(checkExpr(right, reg), checkExpr(left, reg)),
      )
      .with({ _tag: "EDo" }, ({ exprs }) => firstSome((x: Expr) => checkExpr(x, reg), exprs))
      .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) =>
        _Option_orElse(
          checkExpr(elseE, reg),
          _Option_orElse(checkExpr(thenE, reg), checkExpr(cond, reg)),
        ),
      )
      .with({ _tag: "EMatch" }, ({ scrutinee, arms, span: sp }) =>
        _Option_orElse(
          checkMatch(arms, sp, reg),
          _Option_orElse(
            firstSome(
              (a: MatchArm) =>
                _Option_orElse(
                  checkExpr(a.body, reg),
                  match(a.guard)
                    .with({ _tag: "Some" }, ({ value: g }) => checkExpr(g, reg))
                    .with({ _tag: "None" }, () => None as Option<CErr>)
                    .exhaustive(),
                ),
              arms,
            ),
            checkExpr(scrutinee, reg),
          ),
        ),
      )
      .with({ _tag: "ERecord" }, ({ fields, spread }) =>
        _Option_orElse(
          firstSome((f: Field) => checkExpr(f.value, reg), fields),
          match(spread)
            .with({ _tag: "Some" }, ({ value: s }) => checkExpr(s, reg))
            .with({ _tag: "None" }, () => None as Option<CErr>)
            .exhaustive(),
        ),
      )
      .with({ _tag: "EField" }, ({ target }) => checkExpr(target, reg))
      .with({ _tag: "ELoop" }, ({ params, body }) =>
        _Option_orElse(
          checkExpr(body, reg),
          firstSome((p: LoopParam) => checkExpr(p.init, reg), params),
        ),
      )
      .with({ _tag: "ERecur" }, ({ args }) => firstSome((a: Expr) => checkExpr(a, reg), args))
      .with({ _tag: "ETuple" }, ({ elements }) =>
        firstSome((el: Expr) => checkExpr(el, reg), elements),
      )
      .with({ _tag: "EArr" }, ({ elements }) =>
        firstSome(
          (el: SeqElem) =>
            checkExpr(
              match(el)
                .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
                .with({ _tag: "SESpread" }, ({ expr: e }) => e)
                .exhaustive(),
              reg,
            ),
          elements,
        ),
      )
      .with({ _tag: "EList" }, ({ elements }) =>
        firstSome(
          (el: SeqElem) =>
            checkExpr(
              match(el)
                .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
                .with({ _tag: "SESpread" }, ({ expr: e }) => e)
                .exhaustive(),
              reg,
            ),
          elements,
        ),
      )
      .with({ _tag: "ESet" }, ({ elements }) =>
        firstSome(
          (el: SeqElem) =>
            checkExpr(
              match(el)
                .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
                .with({ _tag: "SESpread" }, ({ expr: e }) => e)
                .exhaustive(),
              reg,
            ),
          elements,
        ),
      )
      .with({ _tag: "EMap" }, ({ entries }) =>
        firstSome(
          (en: MapEntry) => _Option_orElse(checkExpr(en.value, reg), checkExpr(en.key, reg)),
          entries,
        ),
      )
      .with({ _tag: "EInterp" }, ({ parts }) =>
        firstSome(
          (p: InterpPart) =>
            match(p)
              .with({ _tag: "IPLit" }, () => None as Option<CErr>)
              .with({ _tag: "IPExpr" }, ({ expr: ex }) => checkExpr(ex, reg))
              .exhaustive(),
          parts,
        ),
      )
      .exhaustive(),
);
const reservedNames: string[] = ["Array", "List", "Set", "Map", "Option", "Result", "Str"];
const redeclarableTypes: string[] = ["Option", "Result"];
const reservedErr: <A, B, C>(
  name: string,
  sp: { end: A; start: B } & C,
) => { message: string; start: B; end: A } = _curry(
  2,
  <A, B, C>(name: string, sp: { end: A; start: B } & C) =>
    checkErr(`'${name}' is a reserved collection namespace and cannot be bound`, sp),
);
const checkReservedNames: (stmts: Stmt[]) => Option<CErr> = (stmts: Stmt[]) =>
  firstSome(
    (s: Stmt) =>
      match(s)
        .with({ _tag: "SType" }, ({ name, span: sp }) =>
          _Array_contains(name, redeclarableTypes)
            ? (None as Option<CErr>)
            : _Array_contains(name, reservedNames)
              ? (Some(reservedErr(name, sp)) as Option<CErr>)
              : (None as Option<CErr>),
        )
        .with({ _tag: "SLet" }, ({ name, span: sp }) =>
          _Array_contains(name, reservedNames)
            ? (Some(reservedErr(name, sp)) as Option<CErr>)
            : (None as Option<CErr>),
        )
        .with({ _tag: "SExtern" }, ({ name, span: sp }) =>
          _Array_contains(name, reservedNames)
            ? (Some(reservedErr(name, sp)) as Option<CErr>)
            : (None as Option<CErr>),
        )
        .with({ _tag: "SImport" }, ({ names }) =>
          firstSome(
            (n: Name) =>
              _Array_contains(n.name, reservedNames)
                ? (Some(
                    checkErr(
                      `'${n.name}' is a reserved collection namespace and cannot be imported`,
                      n.span,
                    ),
                  ) as Option<CErr>)
                : (None as Option<CErr>),
            names,
          ),
        )
        .with({ _tag: "SImportNs" }, ({ alias }) =>
          _Array_contains(alias.name, reservedNames)
            ? (Some(
                checkErr(
                  `'${alias.name}' is a reserved collection namespace and cannot be imported`,
                  alias.span,
                ),
              ) as Option<CErr>)
            : (None as Option<CErr>),
        )
        .with({ _tag: "SError" }, () => None as Option<CErr>)
        .with({ _tag: "SExpr" }, () => None as Option<CErr>)
        .exhaustive(),
    stmts,
  );
const isUpperStart: (s: string) => boolean = (s: string) =>
  match(_Str_codeAt(0, s))
    .with({ _tag: "Some" }, ({ value: c }) => and(gte(c, 65), lte(c, 90)))
    .with({ _tag: "None" }, () => false)
    .exhaustive();
const strayTypeVar: _Curry<[params: string[], te: TypeExpr], Option<[string, Span]>> = _curry(
  2,
  (params: string[], te: TypeExpr) =>
    match(te)
      .with({ _tag: "TyName" }, ({ name, span: sp }) =>
        or(
          isUpperStart(name),
          or(_Array_contains(name, primTypeNames), _Array_contains(name, params)),
        )
          ? (None as Option<[string, Span]>)
          : (Some(_tuple(name, sp)) as Option<[string, Span]>),
      )
      .with({ _tag: "TyArrow" }, ({ from, to }) =>
        _Option_orElse(strayTypeVar(params, to), strayTypeVar(params, from)),
      )
      .with({ _tag: "TyApp" }, ({ args }) => firstSome(strayTypeVar(params), args))
      .with({ _tag: "TyTuple" }, ({ elems }) => firstSome(strayTypeVar(params), elems))
      .with({ _tag: "TyList" }, ({ elem }) => strayTypeVar(params, elem))
      .with({ _tag: "TyQual" }, ({ args }) => firstSome(strayTypeVar(params), args))
      .with({ _tag: "TyLit" }, () => None as Option<[string, Span]>)
      .with({ _tag: "TyUnion" }, ({ members }) => firstSome(strayTypeVar(params), members))
      .exhaustive(),
);
const checkCtorFieldVars: (stmts: Stmt[]) => Option<CErr> = (stmts: Stmt[]) =>
  firstSome(
    (s: Stmt) =>
      match(s)
        .with({ _tag: "SType" }, ({ name, params, ctors }) =>
          firstSome(
            (c: Ctor) =>
              firstSome(
                (f: CtorField) =>
                  match(strayTypeVar(params, f.fieldType))
                    .with(
                      (_v): _v is Extract<Option<[string, Span]>, { _tag: "Some" }> => {
                        const _g: any = _v;
                        return _g._tag === "Some";
                      },
                      ({ value: [vn, vsp] }) =>
                        Some(
                          checkErr(
                            `unknown type parameter '${vn}' in constructor '${c.name}' — declare it: type ${name} ${_Str_join(" ", _Array_append(vn, params))} = ...`,
                            vsp,
                          ),
                        ) as Option<CErr>,
                    )
                    .with({ _tag: "None" }, () => None as Option<CErr>)
                    .exhaustive(),
                c.fields,
              ),
            ctors,
          ),
        )
        .otherwise(() => None as Option<CErr>),
    stmts,
  );
const qualRefsFrom: (
  te: TypeExpr,
) => { alias: string; name: string; nameSpan: Span; qualSpan: Span }[] = (te: TypeExpr) =>
  match(te)
    .with(
      { _tag: "TyName" },
      () => [] as { alias: string; name: string; nameSpan: Span; qualSpan: Span }[],
    )
    .with({ _tag: "TyArrow" }, ({ from, to }) => [...qualRefsFrom(from), ...qualRefsFrom(to)])
    .with({ _tag: "TyApp" }, ({ args }) => _Array_flatMap(qualRefsFrom, args))
    .with({ _tag: "TyTuple" }, ({ elems }) => _Array_flatMap(qualRefsFrom, elems))
    .with({ _tag: "TyList" }, ({ elem }) => qualRefsFrom(elem))
    .with({ _tag: "TyQual" }, ({ alias, name, nameSpan, args, span: sp }) => [
      { alias: alias, name: name, nameSpan: nameSpan, qualSpan: sp },
      ..._Array_flatMap(qualRefsFrom, args),
    ])
    .with(
      { _tag: "TyLit" },
      () => [] as { alias: string; name: string; nameSpan: Span; qualSpan: Span }[],
    )
    .with({ _tag: "TyUnion" }, ({ members }) => _Array_flatMap(qualRefsFrom, members))
    .exhaustive();
const writtenTypeExprs: (stmts: Stmt[]) => TypeExpr[] = (stmts: Stmt[]) =>
  _Array_flatMap(
    (s: Stmt) =>
      match(s)
        .with({ _tag: "SExtern" }, ({ typeExpr: te }) => [te])
        .with({ _tag: "SLet" }, ({ annot }) =>
          match(annot)
            .with({ _tag: "Some" }, ({ value: te }) => [te])
            .with({ _tag: "None" }, () => [] as TypeExpr[])
            .exhaustive(),
        )
        .with({ _tag: "SType" }, ({ ctors, alias, aliasType }) => [
          ..._Array_flatMap((c: Ctor) => map((f: CtorField) => f.fieldType, c.fields), ctors),
          ...match(alias)
            .with({ _tag: "Some" }, ({ value: fields }) =>
              map((f: AliasField) => f.fieldType, fields),
            )
            .with({ _tag: "None" }, () => [] as TypeExpr[])
            .exhaustive(),
          ...match(aliasType)
            .with({ _tag: "Some" }, ({ value: te }) => [te])
            .with({ _tag: "None" }, () => [] as TypeExpr[])
            .exhaustive(),
        ])
        .otherwise(() => [] as TypeExpr[]),
    stmts,
  );

const emptyQuals: Map<string, QualScope> = new Map<string, QualScope>();
const checkQualifiedTypeNames: <A>(
  stmts: Stmt[],
  quals: Map<string, { types: Set<string> } & A>,
) => Option<CErr> = _curry(
  2,
  <A>(stmts: Stmt[], quals: Map<string, { types: Set<string> } & A>) => {
    const nsAliases: Set<string> = _Set_fromArray(
      _Array_flatMap(
        (s: Stmt) =>
          match(s)
            .with({ _tag: "SImportNs" }, ({ alias }) => [alias.name])
            .otherwise(() => [] as string[]),
        stmts,
      ),
    );
    return firstSome(
      (q: { alias: string; name: string; nameSpan: Span; qualSpan: Span }) =>
        _Set_has(q.alias, nsAliases)
          ? match(_Map_get(q.alias, quals))
              .with({ _tag: "None" }, () => None as Option<CErr>)
              .with({ _tag: "Some" }, ({ value: dep }) =>
                _Set_has(q.name, dep.types)
                  ? (None as Option<CErr>)
                  : (Some(
                      checkErr(
                        `module alias '${q.alias}' has no exported type '${q.name}' — export it from the imported module ('export type ${q.name} = …')`,
                        q.nameSpan,
                      ),
                    ) as Option<CErr>),
              )
              .exhaustive()
          : (Some(
              checkErr(
                `unknown module alias '${q.alias}' in type '${q.alias}.${q.name}' — a qualified type name needs a matching 'import * as ${q.alias} from "…"'`,
                q.qualSpan,
              ),
            ) as Option<CErr>),
      _Array_flatMap(qualRefsFrom, writtenTypeExprs(stmts)),
    );
  },
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
          match(_Map_get(k, from))
            .with({ _tag: "Some" }, ({ value: v }) =>
              mergeMissing(rest, from, _Map_has(k, into) ? into : _Map_set(k, v, into)),
            )
            .with({ _tag: "None" }, () => mergeMissing(rest, from, into))
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
export const checkWith: <A, B>(
  stmts: Stmt[],
  imported: { types: Map<string, string[]>; ctors: Map<string, CtorInfo> } & A,
  quals: Map<string, { types: Set<string> } & B>,
) => Result<Stmt[], CErr> = _curry(
  3,
  <A, B>(
    stmts: Stmt[],
    imported: { types: Map<string, string[]>; ctors: Map<string, CtorInfo> } & A,
    quals: Map<string, { types: Set<string> } & B>,
  ) =>
    match(checkReservedNames(stmts))
      .with({ _tag: "Some" }, ({ value: e }) => Err(e) as Result<Stmt[], CErr>)
      .with({ _tag: "None" }, () =>
        match(checkCtorFieldVars(stmts))
          .with({ _tag: "Some" }, ({ value: e }) => Err(e) as Result<Stmt[], CErr>)
          .with({ _tag: "None" }, () =>
            match(checkQualifiedTypeNames(stmts, quals))
              .with({ _tag: "Some" }, ({ value: e }) => Err(e) as Result<Stmt[], CErr>)
              .with({ _tag: "None" }, () =>
                _Result_flatMap(
                  (reg0) =>
                    ((reg: Registry) =>
                      match(
                        firstSome(
                          (s: Stmt) =>
                            match(s)
                              .with({ _tag: "SLet" }, ({ value }) => checkExpr(value, reg))
                              .with({ _tag: "SExpr" }, ({ value }) => checkExpr(value, reg))
                              .otherwise(() => None as Option<CErr>),
                          stmts,
                        ),
                      )
                        .with({ _tag: "Some" }, ({ value: e }) => Err(e) as Result<Stmt[], CErr>)
                        .with({ _tag: "None" }, () => Ok(stmts) as Result<Stmt[], CErr>)
                        .exhaustive())({
                      ctors: mergeMissing(_Map_keys(imported.ctors), imported.ctors, reg0.ctors),
                      types: mergeMissing(_Map_keys(imported.types), imported.types, reg0.types),
                    }),
                  buildRegistry(stmts),
                ),
              )
              .exhaustive(),
          )
          .exhaustive(),
      )
      .exhaustive(),
);
export const check: (stmts: Stmt[]) => Result<Stmt[], CErr> = (stmts: Stmt[]) =>
  checkWith(
    stmts,
    { ctors: new Map<string, CtorInfo>(), types: new Map<string, string[]>() },
    emptyQuals,
  );
