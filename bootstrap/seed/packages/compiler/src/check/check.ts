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
import type { PErr } from "../parser/parser";

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
  _Option_match,
  _Option_orElse,
  _Option_unwrapOr,
  _Result_flatMap,
  _Result_match,
  _Set_add,
  _Set_fromArray,
  _Set_has,
  _Str_codeAt,
  _Str_join,
  _curry,
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

import * as Ast from "../ast/ast";
import { buildRegistry, primTypeNames } from "../ast/ctors";
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
      {
        const $loopMatch = _Array_get(i, xs);
        if ($loopMatch._tag === "None") {
          return None;
        }
        if ($loopMatch._tag === "Some") {
          const { value: x } = $loopMatch;
          {
            const $loopMatch = f(x);
            if ($loopMatch._tag === "Some") {
              const { value: e } = $loopMatch;
              return Some(e);
            }
            if ($loopMatch._tag === "None") {
              i = i + 1;
              continue;
            }
            throw new Error("non-exhaustive match");
          }
        }
        throw new Error("non-exhaustive match");
      }
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
      {
        const $loopMatch = _Array_get(i, xs);
        if ($loopMatch._tag === "None") {
          return true;
        }
        if ($loopMatch._tag === "Some") {
          const { value: x } = $loopMatch;
          if (f(x)) {
            i = i + 1;
            continue;
          } else {
            return false;
          }
        }
        throw new Error("non-exhaustive match");
      }
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
      {
        const $loopMatch = _Array_get(i, xs);
        if ($loopMatch._tag === "None") {
          return false;
        }
        if ($loopMatch._tag === "Some") {
          const { value: x } = $loopMatch;
          if (f(x)) {
            return true;
          } else {
            i = i + 1;
            continue;
          }
        }
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const someOf: <A>(f: (a: A) => boolean, xs: A[]) => boolean = _curry(
  2,
  <A>(f: (a: A) => boolean, xs: A[]) => someOfFrom(f, xs, 0),
);
const exprSpan: (e: Expr) => SpanAt = (e: Expr) => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      const { span: sp } = $match;
      return sp;
    }
    case "EUnit": {
      const { span: sp } = $match;
      return sp;
    }
    case "EBool": {
      const { span: sp } = $match;
      return sp;
    }
    case "EStr": {
      const { span: sp } = $match;
      return sp;
    }
    case "ERef": {
      const { span: sp } = $match;
      return sp;
    }
    case "ECall": {
      const { span: sp } = $match;
      return sp;
    }
    case "ELambda": {
      const { span: sp } = $match;
      return sp;
    }
    case "ELetIn": {
      const { span: sp } = $match;
      return sp;
    }
    case "ELetBind": {
      const { span: sp } = $match;
      return sp;
    }
    case "EPipe": {
      const { span: sp } = $match;
      return sp;
    }
    case "EDo": {
      const { span: sp } = $match;
      return sp;
    }
    case "ETernary": {
      const { span: sp } = $match;
      return sp;
    }
    case "EMatch": {
      const { span: sp } = $match;
      return sp;
    }
    case "ELoop": {
      const { span: sp } = $match;
      return sp;
    }
    case "ERecur": {
      const { span: sp } = $match;
      return sp;
    }
    case "ERecord": {
      const { span: sp } = $match;
      return sp;
    }
    case "EField": {
      const { span: sp } = $match;
      return sp;
    }
    case "ETuple": {
      const { span: sp } = $match;
      return sp;
    }
    case "EArr": {
      const { span: sp } = $match;
      return sp;
    }
    case "EList": {
      const { span: sp } = $match;
      return sp;
    }
    case "ESet": {
      const { span: sp } = $match;
      return sp;
    }
    case "EMap": {
      const { span: sp } = $match;
      return sp;
    }
    case "EInterp": {
      const { span: sp } = $match;
      return sp;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const patSpan: (p: Pattern) => SpanAt = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PWild": {
      const { span: sp } = $match;
      return sp;
    }
    case "PUnit": {
      const { span: sp } = $match;
      return sp;
    }
    case "PBind": {
      const { span: sp } = $match;
      return sp;
    }
    case "PAs": {
      const { span: sp } = $match;
      return sp;
    }
    case "PLit": {
      const { span: sp } = $match;
      return sp;
    }
    case "PBool": {
      const { span: sp } = $match;
      return sp;
    }
    case "PStr": {
      const { span: sp } = $match;
      return sp;
    }
    case "PTuple": {
      const { span: sp } = $match;
      return sp;
    }
    case "PRecord": {
      const { span: sp } = $match;
      return sp;
    }
    case "PCtor": {
      const { span: sp } = $match;
      return sp;
    }
    case "PArr": {
      const { span: sp } = $match;
      return sp;
    }
    case "PList": {
      const { span: sp } = $match;
      return sp;
    }
    case "POr": {
      const { span: sp } = $match;
      return sp;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const isCatchAll: (p: Pattern) => boolean = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PWild": {
      return true;
    }
    case "PUnit": {
      return true;
    }
    case "PBind": {
      return true;
    }
    case "PAs": {
      const { pat } = $match;
      return isCatchAll(pat);
    }
    case "PRecord": {
      const { fields } = $match;
      return allOf((f: PatField) => isCatchAll(f.pat), fields);
    }
    case "PTuple": {
      const { elems } = $match;
      return allOf(isCatchAll, elems);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return and(length(elems) === 0, _Option_isSome(rest));
    }
    case "PList": {
      const { elems, rest } = $match;
      return and(length(elems) === 0, _Option_isSome(rest));
    }
    default: {
      return false;
    }
  }
};
const isPList: (p: Pattern) => boolean = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PList": {
      return true;
    }
    default: {
      return false;
    }
  }
};
const isPCtor: (p: Pattern) => boolean = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PCtor": {
      return true;
    }
    default: {
      return false;
    }
  }
};
const ctorNameOf: (p: Pattern) => string = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PCtor": {
      const { ctor: name } = $match;
      return name;
    }
    default: {
      return "";
    }
  }
};
const patCtorKey: _Curry<[ctor: string, ns: Option<string>], string> = _curry(
  2,
  (ctor: string, ns: Option<string>) =>
    _Option_match(
      ns,
      () => ctor,
      (alias) => `${alias}.${ctor}`,
    ),
);
const seqElemsRest: (p: Pattern) => Option<[Pattern[], Option<Pattern>]> = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PArr": {
      const { elems, rest } = $match;
      return Some(_tuple(elems, rest)) as Option<[Pattern[], Option<Pattern>]>;
    }
    case "PList": {
      const { elems, rest } = $match;
      return Some(_tuple(elems, rest)) as Option<[Pattern[], Option<Pattern>]>;
    }
    default: {
      return None as Option<[Pattern[], Option<Pattern>]>;
    }
  }
};
const checkPattern: <A, B>(
  p: Pattern,
  reg: { ctors: Map<string, { arity: number } & A> } & B,
  top: boolean,
) => Option<PErr> = _curry(
  3,
  <A, B>(p: Pattern, reg: { ctors: Map<string, { arity: number } & A> } & B, top: boolean) => {
    const $match = p;
    switch ($match._tag) {
      case "PAs": {
        const { pat } = $match;
        return checkPattern(pat, reg, top);
      }
      case "PCtor": {
        const { ctor, args, ns, span: sp } = $match;
        const key: string = patCtorKey(ctor, ns);
        return _Option_match(
          _Map_get(key, reg.ctors),
          () => Some(checkErr(`unknown constructor '${key}'`, sp)) as Option<PErr>,
          (info) =>
            eq(length(args), info.arity)
              ? firstSome((a: Pattern) => checkPattern(a, reg, false), args)
              : (Some(
                  checkErr(
                    `constructor '${ctor}' expects ${show(info.arity)} arg(s), got ${show(length(args))}`,
                    sp,
                  ),
                ) as Option<PErr>),
        );
      }
      case "PRecord": {
        const { fields } = $match;
        return firstSome((f: PatField) => checkPattern(f.pat, reg, false), fields);
      }
      case "PTuple": {
        const { elems } = $match;
        return firstSome((el: Pattern) => checkPattern(el, reg, false), elems);
      }
      case "PArr": {
        const { elems, rest } = $match;
        return _Option_orElse(
          _Option_match(
            rest,
            () => None as Option<PErr>,
            (r) => checkPattern(r, reg, false),
          ),
          firstSome((el: Pattern) => checkPattern(el, reg, false), elems),
        );
      }
      case "PList": {
        const { elems, rest, span: sp } = $match;
        return top
          ? _Option_orElse(
              _Option_match(
                rest,
                () => None as Option<PErr>,
                (r) => checkPattern(r, reg, false),
              ),
              firstSome((el: Pattern) => checkPattern(el, reg, false), elems),
            )
          : (Some(
              checkErr(
                "lazy-List pattern cannot nest inside another pattern (matching pulls from the sequence)",
                sp,
              ),
            ) as Option<PErr>);
      }
      case "POr": {
        const { alts, span: sp } = $match;
        return checkOrPattern(alts, sp, reg);
      }
      default: {
        return None as Option<PErr>;
      }
    }
  },
);
const binderPathsArgs: _Curry<
  [args: Pattern[], i: number, at: string, acc: Map<string, string>],
  Result<Map<string, string>, PErr>
> = _curry(4, (args: Pattern[], i: number, at: string, acc: Map<string, string>) =>
  _Option_match(
    _Array_get(i, args),
    () => Ok(acc) as Result<Map<string, string>, PErr>,
    (a) =>
      _Result_flatMap(
        (acc2: Map<string, string>) => binderPathsArgs(args, i + 1, at, acc2),
        binderPaths(a, `${at}.a${show(i)}`, acc),
      ),
  ),
);
const binderPathsFields: _Curry<
  [fields: PatField[], i: number, at: string, acc: Map<string, string>],
  Result<Map<string, string>, PErr>
> = _curry(4, (fields: PatField[], i: number, at: string, acc: Map<string, string>) =>
  _Option_match(
    _Array_get(i, fields),
    () => Ok(acc) as Result<Map<string, string>, PErr>,
    (f) =>
      _Result_flatMap(
        (acc2: Map<string, string>) => binderPathsFields(fields, i + 1, at, acc2),
        binderPaths(f.pat, `${at}.${f.label}`, acc),
      ),
  ),
);
const binderPathsElems: _Curry<
  [elems: Pattern[], i: number, at: string, acc: Map<string, string>],
  Result<Map<string, string>, PErr>
> = _curry(4, (elems: Pattern[], i: number, at: string, acc: Map<string, string>) =>
  _Option_match(
    _Array_get(i, elems),
    () => Ok(acc) as Result<Map<string, string>, PErr>,
    (e) =>
      _Result_flatMap(
        (acc2: Map<string, string>) => binderPathsElems(elems, i + 1, at, acc2),
        binderPaths(e, `${at}.t${show(i)}`, acc),
      ),
  ),
);
const binderPaths: _Curry<
  [p: Pattern, at: string, acc: Map<string, string>],
  Result<Map<string, string>, PErr>
> = _curry(3, (p: Pattern, at: string, acc: Map<string, string>) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat, name, nameSpan: nameSp } = $match;
      return _Result_flatMap(
        (acc1: Map<string, string>) =>
          _Map_has(name, acc1)
            ? (Err(checkErr(`pattern binds '${name}' more than once`, nameSp)) as Result<
                Map<string, string>,
                PErr
              >)
            : (Ok(_Map_set(name, at, acc1)) as Result<Map<string, string>, PErr>),
        binderPaths(pat, at, acc),
      );
    }
    case "PBind": {
      const { name, span: sp } = $match;
      return _Map_has(name, acc)
        ? (Err(checkErr(`pattern binds '${name}' more than once`, sp)) as Result<
            Map<string, string>,
            PErr
          >)
        : (Ok(_Map_set(name, at, acc)) as Result<Map<string, string>, PErr>);
    }
    case "PCtor": {
      const { args } = $match;
      return binderPathsArgs(args, 0, at, acc);
    }
    case "PRecord": {
      const { fields } = $match;
      return binderPathsFields(fields, 0, at, acc);
    }
    case "PTuple": {
      const { elems } = $match;
      return binderPathsElems(elems, 0, at, acc);
    }
    default: {
      return Ok(acc) as Result<Map<string, string>, PErr>;
    }
  }
});
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
    _Option_match(
      _Array_get(i, alts),
      () => Ok(acc) as Result<Map<string, string>[], PErr>,
      (alt) =>
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
            : _Option_match(
                checkPattern(alt, reg, false),
                () =>
                  _Result_flatMap(
                    (m) => altMapsFrom(alts, i + 1, reg, _Array_append(m, acc)),
                    binderPaths(alt, "", new Map<string, string>()),
                  ),
                (e) => Err(e) as Result<Map<string, string>[], PErr>,
              ),
    ),
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
    _Option_match(
      _Array_get(i, maps),
      () => None,
      (m) =>
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
        ),
    ),
);
const checkOrPattern: <A, B>(
  alts: Pattern[],
  sp: SpanAt,
  reg: { ctors: Map<string, { arity: number } & A> } & B,
) => Option<PErr> = _curry(
  3,
  <A, B>(alts: Pattern[], sp: SpanAt, reg: { ctors: Map<string, { arity: number } & A> } & B) =>
    _Result_match(
      altMapsFrom(alts, 0, reg, [] as Map<string, string>[]),
      (e) => Some(e) as Option<PErr>,
      (maps) =>
        _Option_match(
          _Array_head(maps),
          () => None as Option<PErr>,
          (ref) => consistentBindsFrom(maps, 1, ref, sp),
        ),
    ),
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
        _Option_match(
          a.guard,
          () => None as Option<PErr>,
          (g) =>
            or(isPList(a.pattern), listSwitch)
              ? (Some(
                  checkErr(
                    "`when` guards are unsupported in a lazy-List switch (matching pulls from the sequence)",
                    exprSpan(g),
                  ),
                ) as Option<PErr>)
              : (None as Option<PErr>),
        ),
      arms,
    ),
);
const firstCatchIdx: _Curry<[arms: MatchArm[], i0: number], Option<number>> = _curry(
  2,
  (arms: MatchArm[], i0: number) => {
    let i: number = i0;
    while (true) {
      {
        const $loopMatch = _Array_get(i, arms);
        if ($loopMatch._tag === "None") {
          return None as Option<number>;
        }
        if ($loopMatch._tag === "Some") {
          const { value: a } = $loopMatch;
          if (armUnguardedCatchAll(a)) {
            return Some(i) as Option<number>;
          } else {
            i = i + 1;
            continue;
          }
        }
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const unreachableAfterCatch: (arms: MatchArm[]) => Option<PErr> = (arms: MatchArm[]) =>
  _Option_match(
    firstCatchIdx(arms, 0),
    () => None as Option<PErr>,
    (i) =>
      _Option_match(
        _Array_get(i + 1, arms),
        () => None as Option<PErr>,
        (a) =>
          Some(
            checkErr("unreachable arm: a catch-all arm above it matches first", patSpan(a.pattern)),
          ) as Option<PErr>,
      ),
  );
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
    _Option_match(
      _Array_get(i, arms),
      () => Ok(_tuple(owner, covered)) as Result<[Option<string>, Set<string>], PErr>,
      (a) => {
        const $match = a.pattern;
        switch ($match._tag) {
          case "PCtor": {
            const { ctor, args, ns, span: sp } = $match;
            const key: string = patCtorKey(ctor, ns);
            return _Option_match(
              _Map_get(key, reg.ctors),
              () =>
                Err(checkErr(`unknown constructor '${key}'`, sp)) as Result<
                  [Option<string>, Set<string>],
                  PErr
                >,
              (info) =>
                !eq(length(args), info.arity)
                  ? (Err(
                      checkErr(
                        `constructor '${ctor}' expects ${show(info.arity)} arg(s), got ${show(length(args))}`,
                        sp,
                      ),
                    ) as Result<[Option<string>, Set<string>], PErr>)
                  : ((_v) =>
                      _v._tag === "Some" && (({ value: own }) => !eq(own, info.owner))(_v)
                        ? (({ value: own }) =>
                            Err(
                              checkErr(`switch mixes variants of '${own}' and '${info.owner}'`, sp),
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
                          ))(owner),
            );
          }
          default: {
            return ctorLoop(arms, i + 1, reg, owner, covered);
          }
        }
      },
    ),
);
const seqVerdict: <A>(arms: MatchArm[], mSpan: { end: number; start: number } & A) => Option<PErr> =
  _curry(2, <A>(arms: MatchArm[], mSpan: { end: number; start: number } & A) => {
    const $match = checkSeqExhaustive(arms, mSpan);
    switch ($match._tag) {
      case "SeqTotal": {
        return None as Option<PErr>;
      }
      case "SeqFail": {
        const { e } = $match;
        return Some(e) as Option<PErr>;
      }
      case "SeqNotSeq": {
        return None as Option<PErr>;
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  });
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
  ) => {
    const $match = checkExhaustiveM(unguardedPatterns(arms), reg);
    switch ($match._tag) {
      case "ExOk": {
        return None;
      }
      case "ExFuel": {
        return Some(
          checkErr("switch too complex to prove exhaustive — add a `_` catch-all arm", mSpan),
        );
      }
      case "ExWitness": {
        const { witness: w } = $match;
        const own: string = _Option_unwrapOr("", ownerOpt);
        const named: Set<string> = namedUnguarded(leaves);
        const absent: string[] = filter(
          (c: string) => !_Set_has(c, named),
          _Map_getOr([] as string[], own, reg.types),
        );
        return and(and(isWideWitnessM(w), own !== ""), length(absent) > 0)
          ? Some(
              checkErr(
                `non-exhaustive switch on '${own}': missing ${_Str_join(", ", absent)}`,
                mSpan,
              ),
            )
          : Some(checkErr(`non-exhaustive switch: '${showWitness(w)}' is not matched`, mSpan));
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const leavesOfArm: <A, B>(
  a: { pattern: Pattern; guard: A } & B,
) => { pattern: Pattern; guard: A }[] = <A, B>(a: { pattern: Pattern; guard: A } & B) => {
  const $match = a.pattern;
  switch ($match._tag) {
    case "POr": {
      const { alts } = $match;
      return map((alt: Pattern) => ({ pattern: alt, guard: a.guard }), alts);
    }
    default: {
      return [{ pattern: a.pattern, guard: a.guard }];
    }
  }
};
const checkMatch: <A>(
  arms: MatchArm[],
  mSpan: { end: number; start: number } & A,
  reg: Registry,
) => Option<PErr> = _curry(
  3,
  <A>(arms: MatchArm[], mSpan: { end: number; start: number } & A, reg: Registry) =>
    _Option_match(
      firstSome((a: MatchArm) => checkPattern(a.pattern, reg, true), arms),
      () => {
        const listSwitch: boolean = someOf(
          (a: MatchArm) => and(isPList(a.pattern), !isCatchAll(a.pattern)),
          arms,
        );
        return _Option_match(
          guardErrs(arms, listSwitch),
          () =>
            _Option_match(
              unreachableAfterCatch(arms),
              () => {
                const hasCatchAll: boolean = someOf(armUnguardedCatchAll, arms);
                const leaves: { pattern: Pattern; guard: Option<Expr> }[] = _Array_flatMap(
                  leavesOfArm,
                  arms,
                );
                const ctorArms: { pattern: Pattern; guard: Option<Expr> }[] = filter(
                  (a: { pattern: Pattern; guard: Option<Expr> }) => isPCtor(a.pattern),
                  leaves,
                );
                return someOf((a: MatchArm) => isPList(a.pattern), arms)
                  ? hasCatchAll
                    ? (None as Option<PErr>)
                    : seqVerdict(arms, mSpan)
                  : ((_v) =>
                      _v._tag === "Err"
                        ? (({ error: e }) => Some(e) as Option<PErr>)(_v)
                        : _v._tag === "Ok"
                          ? (({ value: [ownerOpt] }) =>
                              matrixVerdict(arms, leaves, ownerOpt, mSpan, reg))(
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
                    );
              },
              (e) => Some(e) as Option<PErr>,
            ),
          (e) => Some(e) as Option<PErr>,
        );
      },
      (e) => Some(e) as Option<PErr>,
    ),
);
const checkExpr: _Curry<[e: Expr, reg: Registry], Option<PErr>> = _curry(
  2,
  (e: Expr, reg: Registry) => {
    const $match = e;
    switch ($match._tag) {
      case "ENum": {
        return None as Option<PErr>;
      }
      case "EUnit": {
        return None as Option<PErr>;
      }
      case "EBool": {
        return None as Option<PErr>;
      }
      case "EStr": {
        return None as Option<PErr>;
      }
      case "ERef": {
        return None as Option<PErr>;
      }
      case "ECall": {
        const { fn, args } = $match;
        return _Option_orElse(
          firstSome((a: Expr) => checkExpr(a, reg), args),
          checkExpr(fn, reg),
        );
      }
      case "ELambda": {
        const { body } = $match;
        return checkExpr(body, reg);
      }
      case "ELetIn": {
        const { value, body } = $match;
        return _Option_orElse(checkExpr(body, reg), checkExpr(value, reg));
      }
      case "ELetBind": {
        const { value, body } = $match;
        return _Option_orElse(checkExpr(body, reg), checkExpr(value, reg));
      }
      case "EPipe": {
        const { left, right } = $match;
        return _Option_orElse(checkExpr(right, reg), checkExpr(left, reg));
      }
      case "EDo": {
        const { exprs } = $match;
        return firstSome((x: Expr) => checkExpr(x, reg), exprs);
      }
      case "ETernary": {
        const { cond, thenE, elseE } = $match;
        return _Option_orElse(
          checkExpr(elseE, reg),
          _Option_orElse(checkExpr(thenE, reg), checkExpr(cond, reg)),
        );
      }
      case "EMatch": {
        const { scrutinee, arms, span: sp } = $match;
        return _Option_orElse(
          checkMatch(arms, sp, reg),
          _Option_orElse(
            firstSome(
              (a: MatchArm) =>
                _Option_orElse(
                  checkExpr(a.body, reg),
                  _Option_match(
                    a.guard,
                    () => None as Option<PErr>,
                    (g) => checkExpr(g, reg),
                  ),
                ),
              arms,
            ),
            checkExpr(scrutinee, reg),
          ),
        );
      }
      case "ERecord": {
        const { fields, spread } = $match;
        return _Option_orElse(
          firstSome((f: Field) => checkExpr(f.value, reg), fields),
          _Option_match(
            spread,
            () => None as Option<PErr>,
            (s) => checkExpr(s, reg),
          ),
        );
      }
      case "EField": {
        const { target } = $match;
        return checkExpr(target, reg);
      }
      case "ELoop": {
        const { params, body } = $match;
        return _Option_orElse(
          checkExpr(body, reg),
          firstSome((p: LoopParam) => checkExpr(p.init, reg), params),
        );
      }
      case "ERecur": {
        const { args } = $match;
        return firstSome((a: Expr) => checkExpr(a, reg), args);
      }
      case "ETuple": {
        const { elements } = $match;
        return firstSome((el: Expr) => checkExpr(el, reg), elements);
      }
      case "EArr": {
        const { elements } = $match;
        return firstSome(
          (el: SeqElem) =>
            checkExpr(
              ((_v) =>
                _v._tag === "SEExpr"
                  ? (({ expr: e }) => e)(_v)
                  : _v._tag === "SESpread"
                    ? (({ expr: e }) => e)(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(el),
              reg,
            ),
          elements,
        );
      }
      case "EList": {
        const { elements } = $match;
        return firstSome(
          (el: SeqElem) =>
            checkExpr(
              ((_v) =>
                _v._tag === "SEExpr"
                  ? (({ expr: e }) => e)(_v)
                  : _v._tag === "SESpread"
                    ? (({ expr: e }) => e)(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(el),
              reg,
            ),
          elements,
        );
      }
      case "ESet": {
        const { elements } = $match;
        return firstSome(
          (el: SeqElem) =>
            checkExpr(
              ((_v) =>
                _v._tag === "SEExpr"
                  ? (({ expr: e }) => e)(_v)
                  : _v._tag === "SESpread"
                    ? (({ expr: e }) => e)(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(el),
              reg,
            ),
          elements,
        );
      }
      case "EMap": {
        const { entries } = $match;
        return firstSome(
          (en: MapEntry) => _Option_orElse(checkExpr(en.value, reg), checkExpr(en.key, reg)),
          entries,
        );
      }
      case "EInterp": {
        const { parts } = $match;
        return firstSome((p: InterpPart) => {
          const $match$ = p;
          switch ($match$._tag) {
            case "IPLit": {
              return None as Option<PErr>;
            }
            case "IPExpr": {
              const { expr: ex } = $match$;
              return checkExpr(ex, reg);
            }
            default: {
              throw new Error("non-exhaustive match");
            }
          }
        }, parts);
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const checkExprs: _Curry<[e: Expr, reg: Registry], PErr[]> = _curry(2, (e: Expr, reg: Registry) => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      return [] as PErr[];
    }
    case "EUnit": {
      return [] as PErr[];
    }
    case "EBool": {
      return [] as PErr[];
    }
    case "EStr": {
      return [] as PErr[];
    }
    case "ERef": {
      return [] as PErr[];
    }
    case "ECall": {
      const { fn, args } = $match;
      return [...checkExprs(fn, reg), ..._Array_flatMap((a: Expr) => checkExprs(a, reg), args)];
    }
    case "ELambda": {
      const { body } = $match;
      return checkExprs(body, reg);
    }
    case "ELetIn": {
      const { value, body } = $match;
      return [...checkExprs(value, reg), ...checkExprs(body, reg)];
    }
    case "ELetBind": {
      const { value, body } = $match;
      return [...checkExprs(value, reg), ...checkExprs(body, reg)];
    }
    case "EPipe": {
      const { left, right } = $match;
      return [...checkExprs(left, reg), ...checkExprs(right, reg)];
    }
    case "EDo": {
      const { exprs } = $match;
      return _Array_flatMap((x: Expr) => checkExprs(x, reg), exprs);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return [...checkExprs(cond, reg), ...checkExprs(thenE, reg), ...checkExprs(elseE, reg)];
    }
    case "EMatch": {
      const { scrutinee, arms, span: sp } = $match;
      return [
        ...checkExprs(scrutinee, reg),
        ..._Array_flatMap(
          (a: MatchArm) => [
            ..._Option_match(
              a.guard,
              () => [] as PErr[],
              (g) => checkExprs(g, reg),
            ),
            ...checkExprs(a.body, reg),
          ],
          arms,
        ),
        ..._Option_match(
          checkMatch(arms, sp, reg),
          () => [] as PErr[],
          (e) => [e],
        ),
      ];
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return [
        ..._Option_match(
          spread,
          () => [] as PErr[],
          (s) => checkExprs(s, reg),
        ),
        ..._Array_flatMap((f: Field) => checkExprs(f.value, reg), fields),
      ];
    }
    case "EField": {
      const { target } = $match;
      return checkExprs(target, reg);
    }
    case "ELoop": {
      const { params, body } = $match;
      return [
        ..._Array_flatMap((p: LoopParam) => checkExprs(p.init, reg), params),
        ...checkExprs(body, reg),
      ];
    }
    case "ERecur": {
      const { args } = $match;
      return _Array_flatMap((a: Expr) => checkExprs(a, reg), args);
    }
    case "ETuple": {
      const { elements } = $match;
      return _Array_flatMap((el: Expr) => checkExprs(el, reg), elements);
    }
    case "EArr": {
      const { elements } = $match;
      return _Array_flatMap((el: SeqElem) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: value } = $match$;
            return checkExprs(value, reg);
          }
          case "SESpread": {
            const { expr: value } = $match$;
            return checkExprs(value, reg);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements);
    }
    case "EList": {
      const { elements } = $match;
      return _Array_flatMap((el: SeqElem) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: value } = $match$;
            return checkExprs(value, reg);
          }
          case "SESpread": {
            const { expr: value } = $match$;
            return checkExprs(value, reg);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements);
    }
    case "ESet": {
      const { elements } = $match;
      return _Array_flatMap((el: SeqElem) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: value } = $match$;
            return checkExprs(value, reg);
          }
          case "SESpread": {
            const { expr: value } = $match$;
            return checkExprs(value, reg);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements);
    }
    case "EMap": {
      const { entries } = $match;
      return _Array_flatMap(
        (entry: MapEntry) => [...checkExprs(entry.key, reg), ...checkExprs(entry.value, reg)],
        entries,
      );
    }
    case "EInterp": {
      const { parts } = $match;
      return _Array_flatMap((part: InterpPart) => {
        const $match$ = part;
        switch ($match$._tag) {
          case "IPLit": {
            return [] as PErr[];
          }
          case "IPExpr": {
            const { expr: value } = $match$;
            return checkExprs(value, reg);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, parts);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
const reservedNames: string[] = ["Array", "List", "Set", "Map", "Option", "Result", "Task", "Str"];
const redeclarableTypes: string[] = ["Option", "Result"];
const reservedErr: <C>(name: string, sp: { end: number; start: number } & C) => PErr = _curry(
  2,
  <C>(name: string, sp: { end: number; start: number } & C) =>
    checkErr(`'${name}' is a reserved collection namespace and cannot be bound`, sp),
);
const checkReservedNames: (stmts: Stmt[]) => Option<PErr> = (stmts: Stmt[]) =>
  firstSome((s: Stmt) => {
    const $match = s;
    switch ($match._tag) {
      case "SType": {
        const { name, span: sp } = $match;
        return _Array_contains(name, redeclarableTypes)
          ? (None as Option<PErr>)
          : _Array_contains(name, reservedNames)
            ? (Some(reservedErr(name, sp)) as Option<PErr>)
            : (None as Option<PErr>);
      }
      case "SLet": {
        const { name, span: sp } = $match;
        return _Array_contains(name, reservedNames)
          ? (Some(reservedErr(name, sp)) as Option<PErr>)
          : (None as Option<PErr>);
      }
      case "SExtern": {
        const { name, span: sp } = $match;
        return _Array_contains(name, reservedNames)
          ? (Some(reservedErr(name, sp)) as Option<PErr>)
          : (None as Option<PErr>);
      }
      case "SImport": {
        const { names } = $match;
        return firstSome(
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
        );
      }
      case "SImportNs": {
        const { alias } = $match;
        return _Array_contains(alias.name, reservedNames)
          ? (Some(
              checkErr(
                `'${alias.name}' is a reserved collection namespace and cannot be imported`,
                alias.span,
              ),
            ) as Option<PErr>)
          : (None as Option<PErr>);
      }
      case "SError": {
        return None as Option<PErr>;
      }
      case "SExpr": {
        return None as Option<PErr>;
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  }, stmts);
const checkReservedNamesAll: (stmts: Stmt[]) => PErr[] = (stmts: Stmt[]) =>
  _Array_flatMap((s: Stmt) => {
    const $match = s;
    switch ($match._tag) {
      case "SType": {
        const { name, span: sp } = $match;
        return _Array_contains(name, redeclarableTypes)
          ? ([] as PErr[])
          : _Array_contains(name, reservedNames)
            ? [reservedErr(name, sp)]
            : ([] as PErr[]);
      }
      case "SLet": {
        const { name, span: sp } = $match;
        return _Array_contains(name, reservedNames) ? [reservedErr(name, sp)] : ([] as PErr[]);
      }
      case "SExtern": {
        const { name, span: sp } = $match;
        return _Array_contains(name, reservedNames) ? [reservedErr(name, sp)] : ([] as PErr[]);
      }
      case "SImport": {
        const { names } = $match;
        return _Array_flatMap(
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
        );
      }
      case "SImportNs": {
        const { alias } = $match;
        return _Array_contains(alias.name, reservedNames)
          ? [
              checkErr(
                `'${alias.name}' is a reserved collection namespace and cannot be imported`,
                alias.span,
              ),
            ]
          : ([] as PErr[]);
      }
      default: {
        return [] as PErr[];
      }
    }
  }, stmts);
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
const typeExprSpan: (te: TypeExpr) => SpanAt = (te: TypeExpr) => {
  const $match = te;
  switch ($match._tag) {
    case "TyName": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyArrow": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyApp": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyTuple": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyList": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyQual": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyLit": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyUnion": {
      const { span: sp } = $match;
      return sp;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const checkReservedParam: _Curry<[param: LamParam, sp: SpanAt], PErr[]> = _curry(
  2,
  (param: LamParam, sp: SpanAt) => {
    const $match = param;
    switch ($match._tag) {
      case "LPName": {
        const { name } = $match;
        return reservedWord(name, sp);
      }
      case "LPRecord": {
        const { fields } = $match;
        return _Array_flatMap((name: string) => reservedWord(name, sp), fields);
      }
      case "LPTuple": {
        const { names } = $match;
        return _Array_flatMap((name: string) => reservedWord(name, sp), names);
      }
      case "LPLabeled": {
        const { name, defaultValue } = $match;
        return [
          ...reservedWord(name, sp),
          ..._Option_match(
            defaultValue,
            () => [] as PErr[],
            (value) => checkReservedExpr(value),
          ),
        ];
      }
      case "LPSpanned": {
        const { param: inner } = $match;
        return checkReservedParam(inner, sp);
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const checkReservedPattern: (pat: Pattern) => PErr[] = (pat: Pattern) => {
  const $match = pat;
  switch ($match._tag) {
    case "PAs": {
      const { pat: inner, name, nameSpan: nameSp } = $match;
      return [...checkReservedPattern(inner), ...reservedWord(name, nameSp)];
    }
    case "PBind": {
      const { name, span: sp } = $match;
      return reservedWord(name, sp);
    }
    case "PTuple": {
      const { elems } = $match;
      return _Array_flatMap(checkReservedPattern, elems);
    }
    case "PRecord": {
      const { fields } = $match;
      return _Array_flatMap((field: PatField) => checkReservedPattern(field.pat), fields);
    }
    case "PCtor": {
      const { args } = $match;
      return _Array_flatMap(checkReservedPattern, args);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return [
        ..._Array_flatMap(checkReservedPattern, elems),
        ..._Option_match(
          rest,
          () => [] as PErr[],
          (value) => checkReservedPattern(value),
        ),
      ];
    }
    case "PList": {
      const { elems, rest } = $match;
      return [
        ..._Array_flatMap(checkReservedPattern, elems),
        ..._Option_match(
          rest,
          () => [] as PErr[],
          (value) => checkReservedPattern(value),
        ),
      ];
    }
    case "POr": {
      const { alts } = $match;
      return _Array_flatMap(checkReservedPattern, alts);
    }
    default: {
      return [] as PErr[];
    }
  }
};
const checkReservedSeqElem: (el: SeqElem) => PErr[] = (el: SeqElem) => {
  const $match = el;
  switch ($match._tag) {
    case "SEExpr": {
      const { expr: value } = $match;
      return checkReservedExpr(value);
    }
    case "SESpread": {
      const { expr: value } = $match;
      return checkReservedExpr(value);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const checkReservedExpr: (expr: Expr) => PErr[] = (expr: Expr) => {
  const $match = expr;
  switch ($match._tag) {
    case "ECall": {
      const { fn, args } = $match;
      return [...checkReservedExpr(fn), ..._Array_flatMap(checkReservedExpr, args)];
    }
    case "ELambda": {
      const { params, body, span: sp } = $match;
      return [
        ..._Array_flatMap((param: LamParam) => checkReservedParam(param, sp), params),
        ...checkReservedExpr(body),
      ];
    }
    case "ELetIn": {
      const { name, nameSpan: nameSp, value, body } = $match;
      return [
        ...reservedWord(name, nameSp),
        ...checkReservedExpr(value),
        ...checkReservedExpr(body),
      ];
    }
    case "ELetBind": {
      const { param, paramSpan: paramSp, value, body } = $match;
      return [
        ...checkReservedParam(param, paramSp),
        ...checkReservedExpr(value),
        ...checkReservedExpr(body),
      ];
    }
    case "EPipe": {
      const { left, right } = $match;
      return [...checkReservedExpr(left), ...checkReservedExpr(right)];
    }
    case "EDo": {
      const { exprs } = $match;
      return _Array_flatMap(checkReservedExpr, exprs);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return [...checkReservedExpr(cond), ...checkReservedExpr(thenE), ...checkReservedExpr(elseE)];
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return [
        ...checkReservedExpr(scrutinee),
        ..._Array_flatMap(
          (arm: MatchArm) => [
            ...checkReservedPattern(arm.pattern),
            ..._Option_match(
              arm.guard,
              () => [] as PErr[],
              (guard) => checkReservedExpr(guard),
            ),
            ...checkReservedExpr(arm.body),
          ],
          arms,
        ),
      ];
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return [
        ..._Option_match(
          spread,
          () => [] as PErr[],
          (value) => checkReservedExpr(value),
        ),
        ..._Array_flatMap((field: Field) => checkReservedExpr(field.value), fields),
      ];
    }
    case "EField": {
      const { target } = $match;
      return checkReservedExpr(target);
    }
    case "ELoop": {
      const { params, body } = $match;
      return [
        ..._Array_flatMap((param: LoopParam) => reservedWord(param.name, param.nameSpan), params),
        ..._Array_flatMap((param: LoopParam) => checkReservedExpr(param.init), params),
        ...checkReservedExpr(body),
      ];
    }
    case "ERecur": {
      const { args } = $match;
      return _Array_flatMap(checkReservedExpr, args);
    }
    case "ETuple": {
      const { elements } = $match;
      return _Array_flatMap(checkReservedExpr, elements);
    }
    case "EArr": {
      const { elements } = $match;
      return _Array_flatMap(checkReservedSeqElem, elements);
    }
    case "EList": {
      const { elements } = $match;
      return _Array_flatMap(checkReservedSeqElem, elements);
    }
    case "ESet": {
      const { elements } = $match;
      return _Array_flatMap(checkReservedSeqElem, elements);
    }
    case "EMap": {
      const { entries } = $match;
      return _Array_flatMap(
        (entry: MapEntry) => [...checkReservedExpr(entry.key), ...checkReservedExpr(entry.value)],
        entries,
      );
    }
    case "EInterp": {
      const { parts } = $match;
      return _Array_flatMap((part: InterpPart) => {
        const $match$ = part;
        switch ($match$._tag) {
          case "IPLit": {
            return [] as PErr[];
          }
          case "IPExpr": {
            const { expr: value } = $match$;
            return checkReservedExpr(value);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, parts);
    }
    default: {
      return [] as PErr[];
    }
  }
};
const checkReservedWordsAll: (stmts: Stmt[]) => PErr[] = (stmts: Stmt[]) =>
  _Array_flatMap((stmt: Stmt) => {
    const $match = stmt;
    switch ($match._tag) {
      case "SLet": {
        const { name, nameSpan: nameSp, value } = $match;
        return [...reservedWord(name, nameSp), ...checkReservedExpr(value)];
      }
      case "SExpr": {
        const { value } = $match;
        return checkReservedExpr(value);
      }
      case "SExtern": {
        const { name, nameSpan: nameSp } = $match;
        return reservedWord(name, nameSp);
      }
      case "SType": {
        const { ctors } = $match;
        return _Array_flatMap(
          (ctor: Ctor) =>
            _Array_flatMap(
              (field: CtorField) =>
                _Option_match(
                  field.name,
                  () => [] as PErr[],
                  (name) => reservedWord(name, typeExprSpan(field.fieldType)),
                ),
              ctor.fields,
            ),
          ctors,
        );
      }
      default: {
        return [] as PErr[];
      }
    }
  }, stmts);
const checkReservedWords: (stmts: Stmt[]) => Option<PErr> = (stmts: Stmt[]) =>
  _Array_head(checkReservedWordsAll(stmts));
const isUpperStart: (s: string) => boolean = (s: string) =>
  _Option_match(
    _Str_codeAt(0, s),
    () => false,
    (c) => and(c >= 65, c <= 90),
  );
const strayTypeVar: _Curry<[params: string[], te: TypeExpr], Option<[string, SpanAt]>> = _curry(
  2,
  (params: string[], te: TypeExpr) => {
    const $match = te;
    switch ($match._tag) {
      case "TyName": {
        const { name, span: sp } = $match;
        return or(
          isUpperStart(name),
          or(_Array_contains(name, primTypeNames), _Array_contains(name, params)),
        )
          ? (None as Option<[string, SpanAt]>)
          : (Some(_tuple(name, sp)) as Option<[string, SpanAt]>);
      }
      case "TyArrow": {
        const { from, to } = $match;
        return _Option_orElse(strayTypeVar(params, to), strayTypeVar(params, from));
      }
      case "TyApp": {
        const { args } = $match;
        return firstSome(strayTypeVar(params), args);
      }
      case "TyTuple": {
        const { elems } = $match;
        return firstSome(strayTypeVar(params), elems);
      }
      case "TyList": {
        const { elem } = $match;
        return strayTypeVar(params, elem);
      }
      case "TyQual": {
        const { args } = $match;
        return firstSome(strayTypeVar(params), args);
      }
      case "TyLit": {
        return None as Option<[string, SpanAt]>;
      }
      case "TyUnion": {
        const { members } = $match;
        return firstSome(strayTypeVar(params), members);
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const checkCtorFieldVars: (stmts: Stmt[]) => Option<PErr> = (stmts: Stmt[]) =>
  firstSome((s: Stmt) => {
    const $match = s;
    switch ($match._tag) {
      case "SType": {
        const { name, params, ctors } = $match;
        return firstSome(
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
        );
      }
      default: {
        return None as Option<PErr>;
      }
    }
  }, stmts);
const checkCtorFieldVarsAll: (stmts: Stmt[]) => PErr[] = (stmts: Stmt[]) =>
  _Array_flatMap((s: Stmt) => {
    const $match = s;
    switch ($match._tag) {
      case "SType": {
        const { name, params, ctors } = $match;
        return _Array_flatMap(
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
        );
      }
      default: {
        return [] as PErr[];
      }
    }
  }, stmts);
const qualRefsFrom: (
  te: TypeExpr,
) => { alias: string; name: string; nameSpan: SpanAt; qualSpan: SpanAt }[] = (te: TypeExpr) => {
  const $match = te;
  switch ($match._tag) {
    case "TyName": {
      return [] as { alias: string; name: string; nameSpan: SpanAt; qualSpan: SpanAt }[];
    }
    case "TyArrow": {
      const { from, to } = $match;
      return [...qualRefsFrom(from), ...qualRefsFrom(to)];
    }
    case "TyApp": {
      const { args } = $match;
      return _Array_flatMap(qualRefsFrom, args);
    }
    case "TyTuple": {
      const { elems } = $match;
      return _Array_flatMap(qualRefsFrom, elems);
    }
    case "TyList": {
      const { elem } = $match;
      return qualRefsFrom(elem);
    }
    case "TyQual": {
      const { alias, name, nameSpan, args, span: sp } = $match;
      return [
        { alias: alias, name: name, nameSpan: nameSpan, qualSpan: sp },
        ..._Array_flatMap(qualRefsFrom, args),
      ];
    }
    case "TyLit": {
      return [] as { alias: string; name: string; nameSpan: SpanAt; qualSpan: SpanAt }[];
    }
    case "TyUnion": {
      const { members } = $match;
      return _Array_flatMap(qualRefsFrom, members);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const letInAnnots: (e: Expr) => TypeExpr[] = (e: Expr) => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      return [] as TypeExpr[];
    }
    case "EUnit": {
      return [] as TypeExpr[];
    }
    case "EBool": {
      return [] as TypeExpr[];
    }
    case "EStr": {
      return [] as TypeExpr[];
    }
    case "ERef": {
      return [] as TypeExpr[];
    }
    case "ECall": {
      const { fn, args } = $match;
      return [...letInAnnots(fn), ..._Array_flatMap(letInAnnots, args)];
    }
    case "ELambda": {
      const { params, body } = $match;
      return [
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
      ];
    }
    case "ELetIn": {
      const { annot, value, body } = $match;
      return [
        ...letInAnnots(value),
        ...letInAnnots(body),
        ..._Option_match(
          annot,
          () => [] as TypeExpr[],
          (te) => [te],
        ),
      ];
    }
    case "ELetBind": {
      const { value, body } = $match;
      return [...letInAnnots(value), ...letInAnnots(body)];
    }
    case "EPipe": {
      const { left, right } = $match;
      return [...letInAnnots(left), ...letInAnnots(right)];
    }
    case "EDo": {
      const { exprs } = $match;
      return _Array_flatMap(letInAnnots, exprs);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return [...letInAnnots(cond), ...letInAnnots(thenE), ...letInAnnots(elseE)];
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return [
        ...letInAnnots(scrutinee),
        ..._Array_flatMap(
          (a: MatchArm) => [
            ..._Option_match(
              a.guard,
              () => [] as TypeExpr[],
              (g) => letInAnnots(g),
            ),
            ...letInAnnots(a.body),
          ],
          arms,
        ),
      ];
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return [
        ..._Option_match(
          spread,
          () => [] as TypeExpr[],
          (sp) => letInAnnots(sp),
        ),
        ..._Array_flatMap((f: Field) => letInAnnots(f.value), fields),
      ];
    }
    case "EField": {
      const { target } = $match;
      return letInAnnots(target);
    }
    case "ELoop": {
      const { params, body } = $match;
      return [
        ..._Array_flatMap((prm: LoopParam) => letInAnnots(prm.init), params),
        ...letInAnnots(body),
      ];
    }
    case "ERecur": {
      const { args } = $match;
      return _Array_flatMap(letInAnnots, args);
    }
    case "ETuple": {
      const { elements } = $match;
      return _Array_flatMap(letInAnnots, elements);
    }
    case "EArr": {
      const { elements } = $match;
      return _Array_flatMap(seqElemAnnots, elements);
    }
    case "EList": {
      const { elements } = $match;
      return _Array_flatMap(seqElemAnnots, elements);
    }
    case "ESet": {
      const { elements } = $match;
      return _Array_flatMap(seqElemAnnots, elements);
    }
    case "EMap": {
      const { entries } = $match;
      return _Array_flatMap(
        (en: MapEntry) => [...letInAnnots(en.key), ...letInAnnots(en.value)],
        entries,
      );
    }
    case "EInterp": {
      const { parts } = $match;
      return _Array_flatMap((prt: InterpPart) => {
        const $match$ = prt;
        switch ($match$._tag) {
          case "IPLit": {
            return [] as TypeExpr[];
          }
          case "IPExpr": {
            const { expr: ex } = $match$;
            return letInAnnots(ex);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, parts);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const seqElemAnnots: (el: SeqElem) => TypeExpr[] = (el: SeqElem) => {
  const $match = el;
  switch ($match._tag) {
    case "SEExpr": {
      const { expr: e } = $match;
      return letInAnnots(e);
    }
    case "SESpread": {
      const { expr: e } = $match;
      return letInAnnots(e);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const writtenTypeExprs: (stmts: Stmt[]) => TypeExpr[] = (stmts: Stmt[]) =>
  _Array_flatMap((s: Stmt) => {
    const $match = s;
    switch ($match._tag) {
      case "SExtern": {
        const { typeExpr: te } = $match;
        return [te];
      }
      case "SLet": {
        const { annot, value } = $match;
        return [
          ..._Option_match(
            annot,
            () => [] as TypeExpr[],
            (te) => [te],
          ),
          ...letInAnnots(value),
        ];
      }
      case "SExpr": {
        const { value } = $match;
        return letInAnnots(value);
      }
      case "SType": {
        const { ctors, alias, aliasType } = $match;
        return [
          ..._Array_flatMap((c: Ctor) => map((f: CtorField) => f.fieldType, c.fields), ctors),
          ..._Option_match(
            alias,
            () => [] as TypeExpr[],
            (fields) => map((f: AliasField) => f.fieldType, fields),
          ),
          ..._Option_match(
            aliasType,
            () => [] as TypeExpr[],
            (te) => [te],
          ),
        ];
      }
      default: {
        return [] as TypeExpr[];
      }
    }
  }, stmts);

const emptyQuals: Map<string, QualScope> = new Map<string, QualScope>();
const checkQualifiedTypeNames: <A>(
  stmts: Stmt[],
  quals: Map<string, { types: Set<string> } & A>,
) => Option<PErr> = _curry(
  2,
  <A>(stmts: Stmt[], quals: Map<string, { types: Set<string> } & A>) => {
    const nsAliases: Set<string> = _Set_fromArray(
      _Array_flatMap((s: Stmt) => {
        const $match = s;
        switch ($match._tag) {
          case "SImportNs": {
            const { alias } = $match;
            return [alias.name];
          }
          default: {
            return [] as string[];
          }
        }
      }, stmts),
    );
    return firstSome(
      (q: { alias: string; name: string; nameSpan: SpanAt; qualSpan: SpanAt }) =>
        _Set_has(q.alias, nsAliases)
          ? _Option_match(
              _Map_get(q.alias, quals),
              () => None as Option<PErr>,
              (dep) =>
                _Set_has(q.name, dep.types)
                  ? (None as Option<PErr>)
                  : (Some(
                      checkErr(
                        `module alias '${q.alias}' has no exported type '${q.name}' — export it from the imported module ('export type ${q.name} = …')`,
                        q.nameSpan,
                      ),
                    ) as Option<PErr>),
            )
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
    _Array_flatMap((s: Stmt) => {
      const $match = s;
      switch ($match._tag) {
        case "SImportNs": {
          const { alias } = $match;
          return [alias.name];
        }
        default: {
          return [] as string[];
        }
      }
    }, stmts),
  );
  return _Array_flatMap(
    (q: { alias: string; name: string; nameSpan: SpanAt; qualSpan: SpanAt }) =>
      _Set_has(q.alias, nsAliases)
        ? _Option_match(
            _Map_get(q.alias, quals),
            () => [] as PErr[],
            (dep) =>
              _Set_has(q.name, dep.types)
                ? ([] as PErr[])
                : [
                    checkErr(
                      `module alias '${q.alias}' has no exported type '${q.name}' — export it from the imported module ('export type ${q.name} = …')`,
                      q.nameSpan,
                    ),
                  ],
          )
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
    {
      const $loopMatch = _Array_get(i, params);
      if ($loopMatch._tag === "None") {
        return None;
      }
      if ($loopMatch._tag === "Some") {
        const { value: p } = $loopMatch;
        if (_Set_has(p.name, seen)) {
          return Some(checkErr(`duplicate loop param '${p.name}'`, p.nameSpan));
        } else {
          {
            const $recur0: number = i + 1;
            const $recur1: Set<string> = _Set_add(p.name, seen);
            i = $recur0;
            seen = $recur1;
            continue;
          }
        }
      }
      throw new Error("non-exhaustive match");
    }
  }
};
const checkLoopDo: _Curry<
  [exprs: Expr[], frame: Option<LoopFrame>, tail: boolean],
  Option<PErr>
> = _curry(3, (exprs: Expr[], frame: Option<LoopFrame>, tail: boolean) => {
  let i: number = 0;
  while (true) {
    {
      const $loopMatch = _Array_get(i, exprs);
      if ($loopMatch._tag === "None") {
        return None as Option<PErr>;
      }
      if ($loopMatch._tag === "Some") {
        const { value: expr } = $loopMatch;
        if (_Option_isNone(_Array_get(i + 1, exprs))) {
          return checkLoopExpr(expr, frame, tail);
        } else {
          {
            const $loopMatch = checkLoopExpr(expr, frame, false);
            if ($loopMatch._tag === "Some") {
              const { value: error } = $loopMatch;
              return Some(error) as Option<PErr>;
            }
            if ($loopMatch._tag === "None") {
              i = i + 1;
              continue;
            }
            throw new Error("non-exhaustive match");
          }
        }
      }
      throw new Error("non-exhaustive match");
    }
  }
});
const checkLoopExpr: _Curry<
  [e: Expr, frame: Option<LoopFrame>, tail: boolean],
  Option<PErr>
> = _curry(3, (e: Expr, frame: Option<LoopFrame>, tail: boolean) => {
  const $match = e;
  switch ($match._tag) {
    case "ELoop": {
      const { params, body } = $match;
      return _Option_orElse(
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
      );
    }
    case "ERecur": {
      const { args, span: sp } = $match;
      return _Option_match(
        frame,
        () => Some(checkErr("'recur' is only legal inside a loop body", sp)) as Option<PErr>,
        (current) =>
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
              : firstSome((a: Expr) => checkLoopExpr(a, frame, false), args),
      );
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return _Option_orElse(
        checkLoopExpr(elseE, frame, tail),
        _Option_orElse(checkLoopExpr(thenE, frame, tail), checkLoopExpr(cond, frame, false)),
      );
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return _Option_orElse(
        firstSome(
          (arm: MatchArm) =>
            _Option_match(
              arm.guard,
              () => checkLoopExpr(arm.body, frame, tail),
              (guard) =>
                _Option_orElse(
                  checkLoopExpr(arm.body, frame, tail),
                  checkLoopExpr(guard, frame, false),
                ),
            ),
          arms,
        ),
        checkLoopExpr(scrutinee, frame, false),
      );
    }
    case "ELetIn": {
      const { name, nameSpan: nameSp, value, body } = $match;
      return _Option_orElse(
        checkLoopExpr(body, frame, tail),
        _Option_orElse(
          ((_v) =>
            _v._tag === "Some" && (({ value: current }) => _Set_has(name, current.names))(_v)
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
      );
    }
    case "ELetBind": {
      const { value, body } = $match;
      return _Option_orElse(
        checkLoopExpr(body, None as Option<LoopFrame>, false),
        checkLoopExpr(value, frame, false),
      );
    }
    case "ELambda": {
      const { body } = $match;
      return checkLoopExpr(body, None as Option<LoopFrame>, false);
    }
    case "ECall": {
      const { fn, args } = $match;
      return _Option_orElse(
        firstSome((a: Expr) => checkLoopExpr(a, frame, false), args),
        checkLoopExpr(fn, frame, false),
      );
    }
    case "EPipe": {
      const { left, right } = $match;
      return _Option_orElse(checkLoopExpr(right, frame, false), checkLoopExpr(left, frame, false));
    }
    case "EDo": {
      const { exprs } = $match;
      return checkLoopDo(exprs, frame, tail);
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return _Option_orElse(
        firstSome((field: Field) => checkLoopExpr(field.value, frame, false), fields),
        _Option_match(
          spread,
          () => None as Option<PErr>,
          (value) => checkLoopExpr(value, frame, false),
        ),
      );
    }
    case "EField": {
      const { target } = $match;
      return checkLoopExpr(target, frame, false);
    }
    case "ETuple": {
      const { elements } = $match;
      return firstSome((el: Expr) => checkLoopExpr(el, frame, false), elements);
    }
    case "EArr": {
      const { elements } = $match;
      return firstSome((el: SeqElem) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: value } = $match$;
            return checkLoopExpr(value, frame, false);
          }
          case "SESpread": {
            const { expr: value } = $match$;
            return checkLoopExpr(value, frame, false);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements);
    }
    case "EList": {
      const { elements } = $match;
      return firstSome((el: SeqElem) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: value } = $match$;
            return checkLoopExpr(value, frame, false);
          }
          case "SESpread": {
            const { expr: value } = $match$;
            return checkLoopExpr(value, frame, false);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements);
    }
    case "ESet": {
      const { elements } = $match;
      return firstSome((el: SeqElem) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: value } = $match$;
            return checkLoopExpr(value, frame, false);
          }
          case "SESpread": {
            const { expr: value } = $match$;
            return checkLoopExpr(value, frame, false);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements);
    }
    case "EMap": {
      const { entries } = $match;
      return firstSome(
        (entry: MapEntry) =>
          _Option_orElse(
            checkLoopExpr(entry.value, frame, false),
            checkLoopExpr(entry.key, frame, false),
          ),
        entries,
      );
    }
    case "EInterp": {
      const { parts } = $match;
      return firstSome((part: InterpPart) => {
        const $match$ = part;
        switch ($match$._tag) {
          case "IPLit": {
            return None as Option<PErr>;
          }
          case "IPExpr": {
            const { expr: value } = $match$;
            return checkLoopExpr(value, frame, false);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, parts);
    }
    default: {
      return None as Option<PErr>;
    }
  }
});
const checkLoops: (stmts: Stmt[]) => Option<PErr> = (stmts: Stmt[]) =>
  firstSome((stmt: Stmt) => {
    const $match = stmt;
    switch ($match._tag) {
      case "SLet": {
        const { value } = $match;
        return checkLoopExpr(value, None as Option<LoopFrame>, false);
      }
      case "SExpr": {
        const { value } = $match;
        return checkLoopExpr(value, None as Option<LoopFrame>, false);
      }
      default: {
        return None as Option<PErr>;
      }
    }
  }, stmts);
const loopParamErrors: <C, D>(
  params: ({ name: string; nameSpan: { end: number; start: number } & C } & D)[],
) => PErr[] = <C, D>(
  params: ({ name: string; nameSpan: { end: number; start: number } & C } & D)[],
) => {
  let i: number = 0;
  let seen: Set<string> = _Set_fromArray([] as string[]);
  let errors = [] as PErr[];
  while (true) {
    {
      const $loopMatch = _Array_get(i, params);
      if ($loopMatch._tag === "None") {
        return errors;
      }
      if ($loopMatch._tag === "Some") {
        const { value: p } = $loopMatch;
        {
          const $recur0: number = i + 1;
          const $recur1: Set<string> = _Set_add(p.name, seen);
          const $recur2 = _Set_has(p.name, seen)
            ? [...errors, checkErr(`duplicate loop param '${p.name}'`, p.nameSpan)]
            : errors;
          i = $recur0;
          seen = $recur1;
          errors = $recur2;
          continue;
        }
      }
      throw new Error("non-exhaustive match");
    }
  }
};
const checkLoopDoAll: _Curry<[exprs: Expr[], frame: Option<LoopFrame>, tail: boolean], PErr[]> =
  _curry(3, (exprs: Expr[], frame: Option<LoopFrame>, tail: boolean) => {
    let i: number = 0;
    let errors: PErr[] = [] as PErr[];
    while (true) {
      {
        const $loopMatch = _Array_get(i, exprs);
        if ($loopMatch._tag === "None") {
          return errors;
        }
        if ($loopMatch._tag === "Some") {
          const { value: expr } = $loopMatch;
          {
            const isLast: boolean = _Option_isNone(_Array_get(i + 1, exprs));
            {
              const $recur0: number = i + 1;
              const $recur1: PErr[] = [
                ...errors,
                ...checkLoopExprs(expr, frame, isLast ? tail : false),
              ];
              i = $recur0;
              errors = $recur1;
              continue;
            }
          }
        }
        throw new Error("non-exhaustive match");
      }
    }
  });
const checkLoopExprs: _Curry<[e: Expr, frame: Option<LoopFrame>, tail: boolean], PErr[]> = _curry(
  3,
  (e: Expr, frame: Option<LoopFrame>, tail: boolean) => {
    const $match = e;
    switch ($match._tag) {
      case "ELoop": {
        const { params, body } = $match;
        return [
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
        ];
      }
      case "ERecur": {
        const { args, span: sp } = $match;
        const siteErrors: PErr[] = _Option_match(
          frame,
          () => [checkErr("'recur' is only legal inside a loop body", sp)],
          (current) => [
            ...(!tail
              ? [checkErr("'recur' must be in tail position of its enclosing loop", sp)]
              : ([] as PErr[])),
            ...(!eq(length(args), current.arity)
              ? [
                  checkErr(
                    `'recur' takes ${show(current.arity)} argument${current.arity === 1 ? "" : "s"} (one per loop param), got ${show(length(args))}`,
                    sp,
                  ),
                ]
              : ([] as PErr[])),
          ],
        );
        return [
          ...siteErrors,
          ..._Array_flatMap((a: Expr) => checkLoopExprs(a, frame, false), args),
        ];
      }
      case "ETernary": {
        const { cond, thenE, elseE } = $match;
        return [
          ...checkLoopExprs(cond, frame, false),
          ...checkLoopExprs(thenE, frame, tail),
          ...checkLoopExprs(elseE, frame, tail),
        ];
      }
      case "EMatch": {
        const { scrutinee, arms } = $match;
        return [
          ...checkLoopExprs(scrutinee, frame, false),
          ..._Array_flatMap(
            (arm: MatchArm) => [
              ..._Option_match(
                arm.guard,
                () => [] as PErr[],
                (guard) => checkLoopExprs(guard, frame, false),
              ),
              ...checkLoopExprs(arm.body, frame, tail),
            ],
            arms,
          ),
        ];
      }
      case "ELetIn": {
        const { name, nameSpan: nameSp, value, body } = $match;
        return [
          ...((_v) =>
            _v._tag === "Some" && (({ value: current }) => _Set_has(name, current.names))(_v)
              ? (({ value: current }) => [
                  checkErr(
                    `'${name}' shadows a loop param inside the loop body; rename it`,
                    nameSp,
                  ),
                ])(_v)
              : ([] as PErr[]))(frame),
          ...checkLoopExprs(value, frame, false),
          ...checkLoopExprs(body, frame, tail),
        ];
      }
      case "ELetBind": {
        const { value, body } = $match;
        return [
          ...checkLoopExprs(value, frame, false),
          ...checkLoopExprs(body, None as Option<LoopFrame>, false),
        ];
      }
      case "ELambda": {
        const { body } = $match;
        return checkLoopExprs(body, None as Option<LoopFrame>, false);
      }
      case "ECall": {
        const { fn, args } = $match;
        return [
          ...checkLoopExprs(fn, frame, false),
          ..._Array_flatMap((a: Expr) => checkLoopExprs(a, frame, false), args),
        ];
      }
      case "EPipe": {
        const { left, right } = $match;
        return [...checkLoopExprs(left, frame, false), ...checkLoopExprs(right, frame, false)];
      }
      case "EDo": {
        const { exprs } = $match;
        return checkLoopDoAll(exprs, frame, tail);
      }
      case "ERecord": {
        const { fields, spread } = $match;
        return [
          ..._Option_match(
            spread,
            () => [] as PErr[],
            (value) => checkLoopExprs(value, frame, false),
          ),
          ..._Array_flatMap((field: Field) => checkLoopExprs(field.value, frame, false), fields),
        ];
      }
      case "EField": {
        const { target } = $match;
        return checkLoopExprs(target, frame, false);
      }
      case "ETuple": {
        const { elements } = $match;
        return _Array_flatMap((el: Expr) => checkLoopExprs(el, frame, false), elements);
      }
      case "EArr": {
        const { elements } = $match;
        return _Array_flatMap((el: SeqElem) => {
          const $match$ = el;
          switch ($match$._tag) {
            case "SEExpr": {
              const { expr: value } = $match$;
              return checkLoopExprs(value, frame, false);
            }
            case "SESpread": {
              const { expr: value } = $match$;
              return checkLoopExprs(value, frame, false);
            }
            default: {
              throw new Error("non-exhaustive match");
            }
          }
        }, elements);
      }
      case "EList": {
        const { elements } = $match;
        return _Array_flatMap((el: SeqElem) => {
          const $match$ = el;
          switch ($match$._tag) {
            case "SEExpr": {
              const { expr: value } = $match$;
              return checkLoopExprs(value, frame, false);
            }
            case "SESpread": {
              const { expr: value } = $match$;
              return checkLoopExprs(value, frame, false);
            }
            default: {
              throw new Error("non-exhaustive match");
            }
          }
        }, elements);
      }
      case "ESet": {
        const { elements } = $match;
        return _Array_flatMap((el: SeqElem) => {
          const $match$ = el;
          switch ($match$._tag) {
            case "SEExpr": {
              const { expr: value } = $match$;
              return checkLoopExprs(value, frame, false);
            }
            case "SESpread": {
              const { expr: value } = $match$;
              return checkLoopExprs(value, frame, false);
            }
            default: {
              throw new Error("non-exhaustive match");
            }
          }
        }, elements);
      }
      case "EMap": {
        const { entries } = $match;
        return _Array_flatMap(
          (entry: MapEntry) => [
            ...checkLoopExprs(entry.key, frame, false),
            ...checkLoopExprs(entry.value, frame, false),
          ],
          entries,
        );
      }
      case "EInterp": {
        const { parts } = $match;
        return _Array_flatMap((part: InterpPart) => {
          const $match$ = part;
          switch ($match$._tag) {
            case "IPLit": {
              return [] as PErr[];
            }
            case "IPExpr": {
              const { expr: value } = $match$;
              return checkLoopExprs(value, frame, false);
            }
            default: {
              throw new Error("non-exhaustive match");
            }
          }
        }, parts);
      }
      default: {
        return [] as PErr[];
      }
    }
  },
);
const checkLoopsAll: (stmts: Stmt[]) => PErr[] = (stmts: Stmt[]) =>
  _Array_flatMap((stmt: Stmt) => {
    const $match = stmt;
    switch ($match._tag) {
      case "SLet": {
        const { value } = $match;
        return checkLoopExprs(value, None as Option<LoopFrame>, false);
      }
      case "SExpr": {
        const { value } = $match;
        return checkLoopExprs(value, None as Option<LoopFrame>, false);
      }
      default: {
        return [] as PErr[];
      }
    }
  }, stmts);
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
          _Option_match(
            _Map_get(k, from),
            () => mergeMissing(rest, from, into),
            (v) => mergeMissing(rest, from, _Map_has(k, into) ? into : _Map_set(k, v, into)),
          ),
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
    _Option_match(
      checkReservedNames(stmts),
      () =>
        _Option_match(
          checkReservedWords(stmts),
          () =>
            _Option_match(
              checkCtorFieldVars(stmts),
              () =>
                _Option_match(
                  checkQualifiedTypeNames(stmts, quals),
                  () =>
                    _Option_match(
                      checkLoops(stmts),
                      () =>
                        _Result_flatMap(
                          (reg0) =>
                            ((reg: Registry) =>
                              _Option_match(
                                firstSome((s: Stmt) => {
                                  const $match = s;
                                  switch ($match._tag) {
                                    case "SLet": {
                                      const { value } = $match;
                                      return checkExpr(value, reg);
                                    }
                                    case "SExpr": {
                                      const { value } = $match;
                                      return checkExpr(value, reg);
                                    }
                                    default: {
                                      return None as Option<PErr>;
                                    }
                                  }
                                }, stmts),
                                () => Ok(stmts) as Result<Stmt[], PErr>,
                                (e) => Err(e) as Result<Stmt[], PErr>,
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
                        ),
                      (e) => Err(e) as Result<Stmt[], PErr>,
                    ),
                  (e) => Err(e) as Result<Stmt[], PErr>,
                ),
              (e) => Err(e) as Result<Stmt[], PErr>,
            ),
          (e) => Err(e) as Result<Stmt[], PErr>,
        ),
      (e) => Err(e) as Result<Stmt[], PErr>,
    ),
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
    _Result_match(
      buildRegistry(stmts),
      (e) => {
        const errors: PErr[] = [
          ...checkReservedNamesAll(stmts),
          ...checkReservedWordsAll(stmts),
          ...checkCtorFieldVarsAll(stmts),
          ...checkQualifiedTypeNamesAll(stmts, quals),
          ...checkLoopsAll(stmts),
          e,
        ];
        return length(errors) === 0
          ? (Ok(stmts) as Result<Stmt[], PErr[]>)
          : (Err(errors) as Result<Stmt[], PErr[]>);
      },
      (reg0) => {
        const reg: Registry = {
          ctors: mergeMissing(_Map_keys(imported.ctors), imported.ctors, reg0.ctors),
          types: mergeMissing(_Map_keys(imported.types), imported.types, reg0.types),
        };
        const errors: PErr[] = [
          ...checkReservedNamesAll(stmts),
          ...checkReservedWordsAll(stmts),
          ...checkCtorFieldVarsAll(stmts),
          ...checkQualifiedTypeNamesAll(stmts, quals),
          ...checkLoopsAll(stmts),
          ..._Array_flatMap((stmt: Stmt) => {
            const $match = stmt;
            switch ($match._tag) {
              case "SLet": {
                const { value } = $match;
                return checkExprs(value, reg);
              }
              case "SExpr": {
                const { value } = $match;
                return checkExprs(value, reg);
              }
              default: {
                return [] as PErr[];
              }
            }
          }, stmts),
        ];
        return length(errors) === 0
          ? (Ok(stmts) as Result<Stmt[], PErr[]>)
          : (Err(errors) as Result<Stmt[], PErr[]>);
      },
    ),
);
export const checkAll: (stmts: Stmt[]) => Result<Stmt[], PErr[]> = (stmts: Stmt[]) =>
  checkAllWith(
    stmts,
    { ctors: new Map<string, CtorInfo>(), types: new Map<string, string[]>() },
    emptyQuals,
  );
