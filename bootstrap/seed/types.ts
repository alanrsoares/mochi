import type { Expr, Pattern, Span } from "./ast";
import type { Scheme } from "./schemes";

export type Ty =
  | { _tag: "TyVar"; id: number }
  | { _tag: "TyCon"; name: string; args: Ty[] }
  | { _tag: "TyFn"; from: Ty; to: Ty }
  | { _tag: "TyRecord"; row: Row }
  | { _tag: "TySingleton"; base: string; value: string }
  | { _tag: "TyOneOf"; members: Ty[] };
export type Row =
  | { _tag: "RowEmpty" }
  | { _tag: "RowVar"; id: number }
  | { _tag: "RowExtend"; label: string; fieldType: Ty; optional: boolean; rest: Row };
/**
 * TS's `Subst` (mutable Map pair) + `Fresh` (mutable counter) become one
 * immutable, threaded `St` — every fresh-var mint AND every unify call
 * returns a NEW St rather than mutating in place. Type vars and row vars
 * draw from the same `next` counter so ids never collide across the two
 * maps (mirrors types.ts's original Fresh).
 * Inferred type at a source span. Structural on purpose: types.mochi stays
 * AST-free (gen-prelude compiles it standalone), so ast.mochi's `Span` fits
 * this shape rather than being imported.
 */
export type SpanAt = { start: number; end: number };
export type TypeAt = { span: SpanAt; ty: Ty };
/**
 * `recorded` accumulates one entry per inferred Expr/Pattern node, newest
 * first (prepend is O(1)); `inferProgramImports` reverses it once so later
 * records win when two nodes share a span, matching src/infer.ts.
 *
 * `letSpans` / `letUses` are the ADR 0035 side-channel: every `let`'s VALUE
 * span, plus each type its body instantiated that binding at. src/infer.ts
 * keys both on the `Scheme` OBJECT (a JS `Map` over identities); Mochi has no
 * reference identity, so the key is the value span's `"start:end"` instead —
 * unique per binding by construction, and the same string the TS backend's
 * `spanKey` builds when it looks the annotation back up.
 */
export type St = {
  tv: Map<number, Ty>;
  rv: Map<number, Row>;
  next: number;
  recorded: TypeAt[];
  letSpans: Map<string, SpanAt>;
  letUses: Map<string, Ty[]>;
};
export type TypeErr = { message: string };

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  Err,
  None,
  Ok,
  Some,
  _Array_append,
  _Array_get,
  _Array_prepend,
  _Map_get,
  _Map_keys,
  _Map_set,
  _Result_flatMap,
  _Result_map,
  _Str_join,
  _curry,
  _tuple,
  add,
  and,
  eq,
  length,
  map,
  not,
  or,
  show,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

export const TyVar = (id: number): Ty => ({ _tag: "TyVar", id });
export const TyCon = _curry(2, (name, args) => ({ _tag: "TyCon", name, args })) as (
  name: string,
  args: Ty[],
) => Ty;
export const TyFn = _curry(2, (from, to) => ({ _tag: "TyFn", from, to })) as (
  from: Ty,
  to: Ty,
) => Ty;
export const TyRecord = (row: Row): Ty => ({ _tag: "TyRecord", row });
export const TySingleton = _curry(2, (base, value) => ({ _tag: "TySingleton", base, value })) as (
  base: string,
  value: string,
) => Ty;
export const TyOneOf = (members: Ty[]): Ty => ({ _tag: "TyOneOf", members });
export const RowEmpty: Row = { _tag: "RowEmpty" };
export const RowVar = (id: number): Row => ({ _tag: "RowVar", id });
export const RowExtend = _curry(4, (label, fieldType, optional, rest) => ({
  _tag: "RowExtend",
  label,
  fieldType,
  optional,
  rest,
})) as (label: string, fieldType: Ty, optional: boolean, rest: Row) => Row;
export const tVar: (id: number) => Ty = (id: number) => TyVar(id);
export const tCon: _Curry<[name: string, args: Ty[]], Ty> = _curry(2, (name: string, args: Ty[]) =>
  TyCon(name, args),
);
export const tArrow: _Curry<[fromT: Ty, toT: Ty], Ty> = _curry(2, (fromT: Ty, toT: Ty) =>
  TyFn(fromT, toT),
);
export const tRecord: (row: Row) => Ty = (row: Row) => TyRecord(row);
export const tPrim: (name: string) => Ty = (name: string) => TyCon(name, [] as Ty[]);
export const tLit: (value: string) => Ty = (value: string) => TySingleton("string", value);
const typeEq: _Curry<[a: Ty, b: Ty], boolean> = _curry(2, (a: Ty, b: Ty) =>
  match(a)
    .with({ _tag: "TyVar" }, ({ id: aid }) =>
      match(b)
        .with({ _tag: "TyVar" }, ({ id: bid }) => eq(aid, bid))
        .otherwise(() => false),
    )
    .with({ _tag: "TyCon" }, ({ name: aname, args: aargs }) =>
      match(b)
        .with({ _tag: "TyCon" }, ({ name: bname, args: bargs }) =>
          and(and(eq(aname, bname), eq(length(aargs), length(bargs))), typeEqList(aargs, bargs, 0)),
        )
        .otherwise(() => false),
    )
    .with({ _tag: "TyFn" }, ({ from: af, to: at }) =>
      match(b)
        .with({ _tag: "TyFn" }, ({ from: bf, to: bt }) => and(typeEq(af, bf), typeEq(at, bt)))
        .otherwise(() => false),
    )
    .with({ _tag: "TyRecord" }, ({ row: arow }) =>
      match(b)
        .with({ _tag: "TyRecord" }, ({ row: brow }) => rowEq(arow, brow))
        .otherwise(() => false),
    )
    .with({ _tag: "TySingleton" }, ({ base: abase, value: aval }) =>
      match(b)
        .with({ _tag: "TySingleton" }, ({ base: bbase, value: bval }) =>
          and(eq(abase, bbase), eq(aval, bval)),
        )
        .otherwise(() => false),
    )
    .with({ _tag: "TyOneOf" }, ({ members: am }) =>
      match(b)
        .with({ _tag: "TyOneOf" }, ({ members: bm }) =>
          and(eq(length(am), length(bm)), allMembersIn(am, bm, 0)),
        )
        .otherwise(() => false),
    )
    .exhaustive(),
);
const typeEqList: _Curry<[as_: Ty[], bs: Ty[], i: number], boolean> = _curry(
  3,
  (as_: Ty[], bs: Ty[], i: number) =>
    match(_Array_get(i, as_))
      .with({ _tag: "None" }, () => true)
      .with({ _tag: "Some" }, ({ value: a }) =>
        match(_Array_get(i, bs))
          .with({ _tag: "None" }, () => false)
          .with({ _tag: "Some" }, ({ value: b }) =>
            and(typeEq(a, b), typeEqList(as_, bs, add(i, 1))),
          )
          .exhaustive(),
      )
      .exhaustive(),
);
const memberEqIn: _Curry<[t: Ty, xs: Ty[], i: number], boolean> = _curry(
  3,
  (t: Ty, xs: Ty[], i: number) =>
    match(_Array_get(i, xs))
      .with({ _tag: "None" }, () => false)
      .with({ _tag: "Some" }, ({ value: x }) =>
        typeEq(t, x) ? true : memberEqIn(t, xs, add(i, 1)),
      )
      .exhaustive(),
);
const allMembersIn: _Curry<[am: Ty[], bm: Ty[], i: number], boolean> = _curry(
  3,
  (am: Ty[], bm: Ty[], i: number) =>
    match(_Array_get(i, am))
      .with({ _tag: "None" }, () => true)
      .with({ _tag: "Some" }, ({ value: m }) =>
        and(memberEqIn(m, bm, 0), allMembersIn(am, bm, add(i, 1))),
      )
      .exhaustive(),
);
const rowEq: _Curry<[a: Row, b: Row], boolean> = _curry(2, (a: Row, b: Row) =>
  match(a)
    .with({ _tag: "RowEmpty" }, () =>
      match(b)
        .with({ _tag: "RowEmpty" }, () => true)
        .otherwise(() => false),
    )
    .with({ _tag: "RowVar" }, ({ id: aid }) =>
      match(b)
        .with({ _tag: "RowVar" }, ({ id: bid }) => eq(aid, bid))
        .otherwise(() => false),
    )
    .with({ _tag: "RowExtend" }, ({ label: al, fieldType: at, optional: ao, rest: ar }) =>
      match(b)
        .with({ _tag: "RowExtend" }, ({ label: bl, fieldType: bt, optional: bo, rest: br }) =>
          and(and(and(eq(al, bl), eq(ao, bo)), typeEq(at, bt)), rowEq(ar, br)),
        )
        .otherwise(() => false),
    )
    .exhaustive(),
);
const flattenUnionFrom: _Curry<[members: Ty[], acc: Ty[], i: number], Ty[]> = _curry(
  3,
  (members: Ty[], acc: Ty[], i: number) =>
    match(_Array_get(i, members))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: t }) =>
        match(t)
          .with({ _tag: "TyOneOf" }, ({ members: ms }) =>
            flattenUnionFrom(members, flattenUnionFrom(ms, acc, 0), add(i, 1)),
          )
          .otherwise(() =>
            flattenUnionFrom(
              members,
              memberEqIn(t, acc, 0) ? acc : _Array_append(t, acc),
              add(i, 1),
            ),
          ),
      )
      .exhaustive(),
);
/**
 * Finite union. Flattens nested unions, dedupes, unwraps a singleton.
 */
export const tUnion: (members: Ty[]) => Ty = (members: Ty[]) => {
  const flat: Ty[] = flattenUnionFrom(members, [] as Ty[], 0);
  return match(flat)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => tPrim("string"),
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 1;
      },
      ([only]) => only,
    )
    .otherwise(() => TyOneOf(flat));
};
const TUPLE: string = "tuple";
export const tTuple: (elems: Ty[]) => Ty = (elems: Ty[]) => TyCon(TUPLE, elems);
/**
 * The one-inhabitant type (ADR 0054), also the nullary-function domain (ADR
 * 0014): surface `() => T` and the call `f()` both use `unit -> T`. `unit` is an
 * ordinary primitive type name and `()` is its literal — value, type, pattern.
 */
export const UNIT: string = "unit";
export const tUnit = TyCon(UNIT, [] as Ty[]);
export const isUnit: (t: Ty) => boolean = (t: Ty) =>
  match(t)
    .with({ _tag: "TyCon" }, ({ name, args }) => and(eq(name, UNIT), eq(length(args), 0)))
    .otherwise(() => false);
export const rVar: (id: number) => Row = (id: number) => RowVar(id);
export const rExtend: _Curry<[label: string, fieldType: Ty, rest: Row], Row> = _curry(
  3,
  (label: string, fieldType: Ty, rest: Row) => RowExtend(label, fieldType, false, rest),
);
export const rField: _Curry<[label: string, fieldType: Ty, rest: Row, optional: boolean], Row> =
  _curry(4, (label: string, fieldType: Ty, rest: Row, optional: boolean) =>
    RowExtend(label, fieldType, optional, rest),
  );
const showTypeArgs: (args: Ty[]) => string = (args: Ty[]) => _Str_join(", ", map(showType, args));
/**
 * `unit` renders as its literal `()` in every position (ADR 0054), which also
 * covers the nullary-arrow domain: `unit -> T` prints `() -> T` (ADR 0014).
 */
export const showType: (t: Ty) => string = (t: Ty) =>
  match(t)
    .with({ _tag: "TyVar" }, ({ id }) => `'t${show(id)}`)
    .with({ _tag: "TyCon" }, ({ name, args }) =>
      match(args)
        .with(
          (_v) => {
            const _g: any = _v;
            return _g.length === 1 && (([elem]) => eq(name, "Array"))(_g);
          },
          ([elem]) => `[${showType(elem)}]`,
        )
        .with(
          (_v) => {
            const _g: any = _v;
            return _g.length === 0 && eq(name, UNIT);
          },
          () => "()",
        )
        .otherwise(() =>
          eq(name, TUPLE)
            ? `(${showTypeArgs(args)})`
            : eq(length(args), 0)
              ? name
              : `${name}<${showTypeArgs(args)}>`,
        ),
    )
    .with({ _tag: "TyFn" }, ({ from, to }) =>
      ((fromS: string) => `${fromS} -> ${showType(to)}`)(
        match(from)
          .with({ _tag: "TyFn" }, () => `(${showType(from)})`)
          .otherwise(() => showType(from)),
      ),
    )
    .with({ _tag: "TyRecord" }, ({ row }) => showRow(row))
    .with({ _tag: "TySingleton" }, ({ base, value }) => (eq(base, "string") ? show(value) : value))
    .with({ _tag: "TyOneOf" }, ({ members }) => _Str_join(" | ", map(showType, members)))
    .exhaustive();
/**
 * walk a row to its tail, collecting `label: type` field strings on the way
 */
const showRowFields: (row: Row) => [string[], Option<number>] = (row: Row) =>
  match(row)
    .with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) =>
      (([fields, tailId]: [string[], Option<number>]) =>
        _tuple(
          _Array_prepend(`${label}${optional ? "?" : ""}: ${showType(fieldType)}`, fields),
          tailId,
        ))(showRowFields(rest)),
    )
    .with({ _tag: "RowVar" }, ({ id }) => _tuple([] as string[], Some(id) as Option<number>))
    .with({ _tag: "RowEmpty" }, () => _tuple([] as string[], None as Option<number>))
    .exhaustive();
const showRow: (row: Row) => string = (row: Row) =>
  (([fields, tailId]: [string[], Option<number>]) => {
    const tail: string = match(tailId)
      .with(
        { _tag: "Some" },
        ({ value: id }) => `${eq(length(fields), 0) ? "" : " "}| 'r${show(id)}`,
      )
      .with({ _tag: "None" }, () => "")
      .exhaustive();
    return and(eq(length(fields), 0), eq(tail, ""))
      ? "{}"
      : `{ ${_Str_join(", ", fields)}${tail} }`;
  })(showRowFields(row));
const someOfFrom: <A>(f: (a: A) => boolean, xs: A[], i: number) => boolean = _curry(
  3,
  <A>(f: (a: A) => boolean, xs: A[], i: number) =>
    match(_Array_get(i, xs))
      .with({ _tag: "None" }, () => false)
      .with({ _tag: "Some" }, ({ value: x }) => (f(x) ? true : someOfFrom(f, xs, add(i, 1))))
      .exhaustive(),
);
const someOf: <A>(f: (a: A) => boolean, xs: A[]) => boolean = _curry(
  2,
  <A>(f: (a: A) => boolean, xs: A[]) => someOfFrom(f, xs, 0),
);

export const mkSt: (start: number) => St = (start: number) => ({
  tv: new Map<number, Ty>(),
  rv: new Map<number, Row>(),
  next: start,
  recorded: [] as TypeAt[],
  letSpans: new Map<string, SpanAt>(),
  letUses: new Map<string, Ty[]>(),
});
/**
 * Prepend an inferred node type onto the threaded record log.
 */
export const recordAt: _Curry<[span: SpanAt, t: Ty, st: St], St> = _curry(
  3,
  (span: SpanAt, t: Ty, st: St) => ({
    ...st,
    recorded: _Array_prepend({ span: span, ty: t }, st.recorded),
  }),
);
const spanKeyOf: <A, B, C>(sp: { start: A; end: B } & C) => string = <A, B, C>(
  sp: { start: A; end: B } & C,
) => `${show(sp.start)}:${show(sp.end)}`;
/**
 * Register a `let`'s value span as an ADR 0035 annotation candidate. Resets its
 * use list, mirroring src/infer.ts's `noteLet` (a re-noted scheme starts over).
 */
export const noteLet: _Curry<[span: SpanAt, st: St], St> = _curry(2, (span: SpanAt, st: St) => {
  const k: string = spanKeyOf(span);
  return {
    ...st,
    letSpans: _Map_set(k, span, st.letSpans),
    letUses: _Map_set(k, [] as Ty[], st.letUses),
  };
});
/**
 * Record one instantiation of a noted `let`. A span that was never noted (a
 * builtin, an import, a lambda param) is not a candidate and is dropped.
 */
export const noteUse: <A, B, C>(span: { start: A; end: B } & C, t: Ty, st: St) => St = _curry(
  3,
  <A, B, C>(span: { start: A; end: B } & C, t: Ty, st: St) => {
    const k: string = spanKeyOf(span);
    return match(_Map_get(k, st.letUses))
      .with({ _tag: "None" }, () => st)
      .with({ _tag: "Some" }, ({ value: uses }) => ({
        ...st,
        letUses: _Map_set(k, _Array_append(t, uses), st.letUses),
      }))
      .exhaustive();
  },
);
export const fail: <A, B>(message: A) => Result<B, { message: A }> = <A, B>(message: A) =>
  Err({ message: message });
export const freshVar: <A>(st: { next: number } & A) => [Ty, { next: number } & A] = <A>(
  st: { next: number } & A,
) => _tuple(tVar(st.next), { ...st, next: add(st.next, 1) });
export const freshRowVar: <A>(st: { next: number } & A) => [Row, { next: number } & A] = <A>(
  st: { next: number } & A,
) => _tuple(rVar(st.next), { ...st, next: add(st.next, 1) });
export const resolve: _Curry<[t: Ty, st: St], Ty> = _curry(2, (t: Ty, st: St) =>
  match(t)
    .with({ _tag: "TyVar" }, ({ id }) =>
      match(_Map_get(id, st.tv))
        .with({ _tag: "Some" }, ({ value: next }) => resolve(next, st))
        .with({ _tag: "None" }, () => t)
        .exhaustive(),
    )
    .otherwise(() => t),
);
const resolveRow: _Curry<[r: Row, st: St], Row> = _curry(2, (r: Row, st: St) =>
  match(r)
    .with({ _tag: "RowVar" }, ({ id }) =>
      match(_Map_get(id, st.rv))
        .with({ _tag: "Some" }, ({ value: next }) => resolveRow(next, st))
        .with({ _tag: "None" }, () => r)
        .exhaustive(),
    )
    .otherwise(() => r),
);
/**
 * Fully apply the substitution ("zonk") — for display and assertions.
 */
export const zonk: _Curry<[t: Ty, st: St], Ty> = _curry(2, (t: Ty, st: St) =>
  match(resolve(t, st))
    .with({ _tag: "TyVar" }, ({ id }) => tVar(id))
    .with({ _tag: "TyCon" }, ({ name, args }) =>
      tCon(
        name,
        map((a: Ty) => zonk(a, st), args),
      ),
    )
    .with({ _tag: "TyFn" }, ({ from, to }) => tArrow(zonk(from, st), zonk(to, st)))
    .with({ _tag: "TyRecord" }, ({ row }) => tRecord(zonkRow(row, st)))
    .with({ _tag: "TySingleton" }, ({ base, value }) => TySingleton(base, value))
    .with({ _tag: "TyOneOf" }, ({ members }) => tUnion(map((m: Ty) => zonk(m, st), members)))
    .exhaustive(),
);
const zonkRow: _Curry<[row: Row, st: St], Row> = _curry(2, (row: Row, st: St) =>
  match(resolveRow(row, st))
    .with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) =>
      rField(label, zonk(fieldType, st), zonkRow(rest, st), optional),
    )
    .otherwise((r) => r),
);
export const occurs: _Curry<[id: number, t: Ty, st: St], boolean> = _curry(
  3,
  (id: number, t: Ty, st: St) =>
    match(resolve(t, st))
      .with({ _tag: "TyVar" }, ({ id: rid }) => eq(rid, id))
      .with({ _tag: "TyCon" }, ({ args }) => someOf((a: Ty) => occurs(id, a, st), args))
      .with({ _tag: "TyFn" }, ({ from, to }) => or(occurs(id, from, st), occurs(id, to, st)))
      .with({ _tag: "TyRecord" }, ({ row }) => occursRow(id, row, st))
      .with({ _tag: "TySingleton" }, () => false)
      .with({ _tag: "TyOneOf" }, ({ members }) => someOf((m: Ty) => occurs(id, m, st), members))
      .exhaustive(),
);
const occursRow: _Curry<[id: number, row: Row, st: St], boolean> = _curry(
  3,
  (id: number, row: Row, st: St) =>
    match(resolveRow(row, st))
      .with({ _tag: "RowExtend" }, ({ fieldType, rest }) =>
        or(occurs(id, fieldType, st), occursRow(id, rest, st)),
      )
      .otherwise(() => false),
);
export const rowVarOccurs: _Curry<[id: number, row: Row, st: St], boolean> = _curry(
  3,
  (id: number, row: Row, st: St) =>
    match(resolveRow(row, st))
      .with({ _tag: "RowVar" }, ({ id: rid }) => eq(rid, id))
      .with({ _tag: "RowExtend" }, ({ fieldType, rest }) =>
        or(rowVarOccursInType(id, fieldType, st), rowVarOccurs(id, rest, st)),
      )
      .with({ _tag: "RowEmpty" }, () => false)
      .exhaustive(),
);
const rowVarOccursInType: _Curry<[id: number, t: Ty, st: St], boolean> = _curry(
  3,
  (id: number, t: Ty, st: St) =>
    match(resolve(t, st))
      .with({ _tag: "TyVar" }, () => false)
      .with({ _tag: "TyCon" }, ({ args }) => someOf((a: Ty) => rowVarOccursInType(id, a, st), args))
      .with({ _tag: "TyFn" }, ({ from, to }) =>
        or(rowVarOccursInType(id, from, st), rowVarOccursInType(id, to, st)),
      )
      .with({ _tag: "TyRecord" }, ({ row }) => rowVarOccurs(id, row, st))
      .with({ _tag: "TySingleton" }, () => false)
      .with({ _tag: "TyOneOf" }, ({ members }) =>
        someOf((m: Ty) => rowVarOccursInType(id, m, st), members),
      )
      .exhaustive(),
);
const isArrowT: (t: Ty) => boolean = (t: Ty) =>
  match(t)
    .with({ _tag: "TyFn" }, () => true)
    .otherwise(() => false);
const isCollection: (name: string) => boolean = (name: string) =>
  or(or(or(eq(name, "Array"), eq(name, "List")), eq(name, "Set")), eq(name, "Map"));
const isTupleT: (t: Ty) => boolean = (t: Ty) =>
  match(t)
    .with({ _tag: "TyCon" }, ({ name }) => eq(name, TUPLE))
    .otherwise(() => false);
const tupleParenMsg: _Curry<[a: Ty, b: Ty, shown: string], string> = _curry(
  3,
  (a: Ty, b: Ty, shown: string) =>
    not(eq(isTupleT(a), isTupleT(b)))
      ? `${shown} — ((a, b)) => takes one tuple; (a, b) => takes two arguments`
      : shown,
);
const collectionUnifyMsg: _Curry<[aname: string, bname: string, shown: string], string> = _curry(
  3,
  (aname: string, bname: string, shown: string) =>
    or(or(eq(aname, bname), not(isCollection(aname))), not(isCollection(bname)))
      ? shown
      : ((other: string) =>
          ((hint: string) => `${shown} — ${hint}`)(
            eq(other, "List")
              ? "unqualified map/filter/length expect Array; use List.map"
              : eq(other, "Set")
                ? "unqualified map/filter/length expect Array; convert with Set.toArray or use Set.*"
                : eq(other, "Map")
                  ? "unqualified map/filter/length expect Array; use Map.*"
                  : `${aname} and ${bname} are distinct collections`,
          ))(eq(aname, "Array") ? bname : eq(bname, "Array") ? aname : ""),
);
const unifyMismatch: <A>(ra: Ty, rb: Ty) => Result<A, TypeErr> = _curry(2, <A>(ra: Ty, rb: Ty) =>
  not(eq(isArrowT(ra), isArrowT(rb)))
    ? (([fn, val]: [Ty, Ty]) =>
        fail(
          tupleParenMsg(
            ra,
            rb,
            `cannot unify ${showType(ra)} with ${showType(rb)} — a function (${showType(fn)}) was used where a ${showType(val)} was expected; a call may be missing an argument`,
          ),
        ))(isArrowT(ra) ? _tuple(ra, rb) : _tuple(rb, ra))
    : fail(tupleParenMsg(ra, rb, `cannot unify ${showType(ra)} with ${showType(rb)}`)),
);
const unifyArgs: _Curry<[as_: Ty[], bs: Ty[], i: number, st: St], Result<St, TypeErr>> = _curry(
  4,
  (as_: Ty[], bs: Ty[], i: number, st: St) =>
    match(_Array_get(i, as_))
      .with({ _tag: "None" }, () => Ok(st) as Result<St, TypeErr>)
      .with({ _tag: "Some" }, ({ value: a }) =>
        match(_Array_get(i, bs))
          .with({ _tag: "None" }, () => Ok(st) as Result<St, TypeErr>)
          .with({ _tag: "Some" }, ({ value: b }) =>
            _Result_flatMap((s1: St) => unifyArgs(as_, bs, add(i, 1), s1), unify(a, b, st)),
          )
          .exhaustive(),
      )
      .exhaustive(),
);
const isPrimT: _Curry<[t: Ty, name: string], boolean> = _curry(2, (t: Ty, name: string) =>
  match(t)
    .with({ _tag: "TyCon" }, ({ name: n, args }) => and(eq(n, name), eq(length(args), 0)))
    .otherwise(() => false),
);
const isLitOnlyUnion: (members: Ty[]) => boolean = (members: Ty[]) =>
  match(members)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => true,
    )
    .with(
      (_v): _v is [Extract<Ty[][number], { _tag: "TySingleton" }>, ...Ty[]] => {
        const _g: any = _v;
        return _g.length >= 1 && _g[0]._tag === "TySingleton";
      },
      ([, ...rest]) => isLitOnlyUnion(rest),
    )
    .otherwise(() => false);
const widenLitBindingsFrom: _Curry<[ids: number[], lit: Ty, st: St], St> = _curry(
  3,
  (ids: number[], lit: Ty, st: St) =>
    match(ids)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => st,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([id, ...rest]) =>
          match(_Map_get(id, st.tv))
            .with({ _tag: "Some" }, ({ value: t }) =>
              match(resolve(t, st))
                .with({ _tag: "TySingleton" }, ({ base, value }) =>
                  match(lit)
                    .with({ _tag: "TySingleton" }, ({ base: lbase, value: lvalue }) =>
                      and(eq(base, lbase), eq(value, lvalue))
                        ? widenLitBindingsFrom(rest, lit, {
                            ...st,
                            tv: _Map_set(id, tPrim(base), st.tv),
                          })
                        : widenLitBindingsFrom(rest, lit, st),
                    )
                    .otherwise(() => widenLitBindingsFrom(rest, lit, st)),
                )
                .otherwise(() => widenLitBindingsFrom(rest, lit, st)),
            )
            .with({ _tag: "None" }, () => widenLitBindingsFrom(rest, lit, st))
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const widenLitBindings: _Curry<[lit: Ty, st: St], St> = _curry(2, (lit: Ty, st: St) =>
  widenLitBindingsFrom(_Map_keys(st.tv), lit, st),
);
const litInUnionFrom: _Curry<
  [lit: Ty, members: Ty[], i: number, st: St],
  Result<St, TypeErr>
> = _curry(4, (lit: Ty, members: Ty[], i: number, st: St) =>
  match(_Array_get(i, members))
    .with({ _tag: "None" }, () =>
      fail(`cannot unify ${showType(lit)} with ${showType(TyOneOf(members))}`),
    )
    .with({ _tag: "Some" }, ({ value: m }) =>
      match(m)
        .with({ _tag: "TySingleton" }, ({ base, value }) =>
          match(lit)
            .with({ _tag: "TySingleton" }, ({ base: lbase, value: lvalue }) =>
              and(eq(base, lbase), eq(value, lvalue))
                ? (Ok(st) as Result<St, TypeErr>)
                : litInUnionFrom(lit, members, add(i, 1), st),
            )
            .otherwise(() => litInUnionFrom(lit, members, add(i, 1), st)),
        )
        .otherwise(() =>
          match(unify(lit, m, st))
            .with({ _tag: "Ok" }, ({ value: st1 }) => Ok(st1) as Result<St, TypeErr>)
            .with({ _tag: "Err" }, () => litInUnionFrom(lit, members, add(i, 1), st))
            .exhaustive(),
        ),
    )
    .exhaustive(),
);
const unifyMemberAgainstUnionFrom: _Curry<
  [member: Ty, members: Ty[], i: number, st: St],
  Result<St, TypeErr>
> = _curry(4, (member: Ty, members: Ty[], i: number, st: St) =>
  match(member)
    .with({ _tag: "TySingleton" }, () => litInUnionFrom(member, members, 0, st))
    .otherwise(() => unifyConcreteAgainstUnionFrom(member, members, i, st)),
);
/**
 * Split so `fail` sits beside `Ok` in one match (tsc-clean Result, ADR 0026).
 */
const unifyConcreteAgainstUnionFrom: _Curry<
  [member: Ty, members: Ty[], i: number, st: St],
  Result<St, TypeErr>
> = _curry(4, (member: Ty, members: Ty[], i: number, st: St) =>
  match(_Array_get(i, members))
    .with({ _tag: "None" }, () =>
      fail(`cannot unify ${showType(member)} with ${showType(TyOneOf(members))}`),
    )
    .with({ _tag: "Some" }, ({ value: m }) =>
      match(unify(member, m, st))
        .with({ _tag: "Ok" }, ({ value: st1 }) => Ok(st1) as Result<St, TypeErr>)
        .with({ _tag: "Err" }, () => unifyConcreteAgainstUnionFrom(member, members, add(i, 1), st))
        .exhaustive(),
    )
    .exhaustive(),
);
const unifyUnionMembersFrom: _Curry<
  [members: Ty[], u: Ty, i: number, st: St],
  Result<St, TypeErr>
> = _curry(4, (members: Ty[], u: Ty, i: number, st: St) =>
  match(_Array_get(i, members))
    .with({ _tag: "None" }, () => Ok(st) as Result<St, TypeErr>)
    .with({ _tag: "Some" }, ({ value: m }) =>
      match(u)
        .with({ _tag: "TyOneOf" }, ({ members: ums }) =>
          _Result_flatMap(
            (s1: St) => unifyUnionMembersFrom(members, u, add(i, 1), s1),
            unifyMemberAgainstUnionFrom(m, ums, 0, st),
          ),
        )
        .otherwise(() => Ok(st) as Result<St, TypeErr>),
    )
    .exhaustive(),
);
const unifyLitUnion: _Curry<[a: Ty, b: Ty, st: St], Result<St, TypeErr>> = _curry(
  3,
  (a: Ty, b: Ty, st: St) =>
    match(a)
      .with({ _tag: "TySingleton" }, ({ base: abase, value: aval }) =>
        match(b)
          .with({ _tag: "TySingleton" }, ({ base: bbase, value: bval }) =>
            and(eq(abase, bbase), eq(aval, bval))
              ? (Ok(st) as Result<St, TypeErr>)
              : eq(abase, bbase)
                ? (Ok(widenLitBindings(b, widenLitBindings(a, st))) as Result<St, TypeErr>)
                : fail(`cannot unify ${showType(a)} with ${showType(b)}`),
          )
          .with({ _tag: "TyOneOf" }, ({ members }) => litInUnionFrom(a, members, 0, st))
          .otherwise(() =>
            isPrimT(b, abase)
              ? (Ok(st) as Result<St, TypeErr>)
              : fail(`cannot unify ${showType(a)} with ${showType(b)}`),
          ),
      )
      .with({ _tag: "TyOneOf" }, ({ members: amembers }) =>
        match(b)
          .with({ _tag: "TySingleton" }, () => litInUnionFrom(b, amembers, 0, st))
          .with({ _tag: "TyOneOf" }, ({ members: bmembers }) =>
            _Result_flatMap(
              (s1: St) => unifyUnionMembersFrom(bmembers, a, 0, s1),
              unifyUnionMembersFrom(amembers, b, 0, st),
            ),
          )
          .otherwise(() =>
            isLitOnlyUnion(amembers)
              ? fail(`cannot unify ${showType(a)} with ${showType(b)}`)
              : unifyMemberAgainstUnionFrom(b, amembers, 0, st),
          ),
      )
      .otherwise(() =>
        match(b)
          .with({ _tag: "TySingleton" }, ({ base: bbase }) =>
            isPrimT(a, bbase)
              ? (Ok(st) as Result<St, TypeErr>)
              : fail(`cannot unify ${showType(a)} with ${showType(b)}`),
          )
          .with({ _tag: "TyOneOf" }, ({ members: bmembers }) =>
            isLitOnlyUnion(bmembers)
              ? fail(`cannot unify ${showType(a)} with ${showType(b)}`)
              : unifyMemberAgainstUnionFrom(a, bmembers, 0, st),
          )
          .otherwise(() => fail(`cannot unify ${showType(a)} with ${showType(b)}`)),
      ),
);
export const unify: _Curry<[a: Ty, b: Ty, st: St], Result<St, TypeErr>> = _curry(
  3,
  (a: Ty, b: Ty, st: St) => {
    const ra: Ty = resolve(a, st);
    const rb: Ty = resolve(b, st);
    return match(ra)
      .with({ _tag: "TyVar" }, ({ id: aid }) =>
        match(rb)
          .with({ _tag: "TyVar" }, ({ id: bid }) =>
            eq(aid, bid) ? (Ok(st) as Result<St, TypeErr>) : bindVar(aid, rb, st),
          )
          .otherwise(() => bindVar(aid, rb, st)),
      )
      .with({ _tag: "TyCon" }, ({ name: aname, args: aargs }) =>
        match(rb)
          .with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st))
          .with({ _tag: "TyCon" }, ({ name: bname, args: bargs }) =>
            and(eq(aname, bname), eq(length(aargs), length(bargs)))
              ? unifyArgs(aargs, bargs, 0, st)
              : fail(
                  tupleParenMsg(
                    ra,
                    rb,
                    collectionUnifyMsg(
                      aname,
                      bname,
                      `cannot unify ${showType(ra)} with ${showType(rb)}`,
                    ),
                  ),
                ),
          )
          .with({ _tag: "TySingleton" }, () => unifyLitUnion(ra, rb, st))
          .with({ _tag: "TyOneOf" }, () => unifyLitUnion(ra, rb, st))
          .otherwise(() => unifyMismatch(ra, rb)),
      )
      .with({ _tag: "TyFn" }, ({ from: afrom, to: ato }) =>
        match(rb)
          .with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st))
          .with({ _tag: "TyFn" }, ({ from: bfrom, to: bto }) =>
            _Result_flatMap((s1: St) => unify(ato, bto, s1), unify(afrom, bfrom, st)),
          )
          .with({ _tag: "TySingleton" }, () => unifyLitUnion(ra, rb, st))
          .with({ _tag: "TyOneOf" }, () => unifyLitUnion(ra, rb, st))
          .otherwise(() => unifyMismatch(ra, rb)),
      )
      .with({ _tag: "TyRecord" }, ({ row: arow }) =>
        match(rb)
          .with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st))
          .with({ _tag: "TyRecord" }, ({ row: brow }) => unifyRows(arow, brow, st))
          .with({ _tag: "TySingleton" }, () => unifyLitUnion(ra, rb, st))
          .with({ _tag: "TyOneOf" }, () => unifyLitUnion(ra, rb, st))
          .otherwise(() => unifyMismatch(ra, rb)),
      )
      .with({ _tag: "TySingleton" }, () =>
        match(rb)
          .with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st))
          .otherwise(() => unifyLitUnion(ra, rb, st)),
      )
      .with({ _tag: "TyOneOf" }, () =>
        match(rb)
          .with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st))
          .otherwise(() => unifyLitUnion(ra, rb, st)),
      )
      .exhaustive();
  },
);
const bindVar: _Curry<[id: number, t: Ty, st: St], Result<St, TypeErr>> = _curry(
  3,
  (id: number, t: Ty, st: St) =>
    occurs(id, t, st)
      ? fail(`infinite type: 't${show(id)} occurs in ${showType(zonk(t, st))}`)
      : (Ok({ ...st, tv: _Map_set(id, t, st.tv) }) as Result<St, TypeErr>),
);
/**
 * Bring `label` to the head of a row, extending an open tail if needed.
 * Returns the field's type, optionality, the remaining row, and state.
 */
const rewriteRow: _Curry<
  [row: Row, label: string, st: St],
  Result<[Ty, boolean, Row, St], TypeErr>
> = _curry(3, (row: Row, label: string, st: St) =>
  match(resolveRow(row, st))
    .with({ _tag: "RowEmpty" }, () => fail(`record missing field '${label}'`))
    .with(
      { _tag: "RowExtend" },
      ({ label: rlabel, fieldType: rtype, optional: ropt, rest: rrest }) =>
        eq(rlabel, label)
          ? (Ok(_tuple(rtype, ropt, rrest, st)) as Result<[Ty, boolean, Row, St], TypeErr>)
          : _Result_map(
              ([subType, subOpt, subRest, subSt]: [Ty, boolean, Row, St]) =>
                _tuple(subType, subOpt, rField(rlabel, rtype, subRest, ropt), subSt),
              rewriteRow(rrest, label, st),
            ),
    )
    .with({ _tag: "RowVar" }, ({ id: rid }) =>
      (([freshT, st1]: [Ty, St]) =>
        (([freshTail, st2]: [Row, St]) =>
          Ok(
            _tuple(freshT, false, freshTail, {
              ...st2,
              rv: _Map_set(rid, rExtend(label, freshT, freshTail), st2.rv),
            }),
          ) as Result<[Ty, boolean, Row, St], TypeErr>)(freshRowVar(st1)))(freshVar(st)),
    )
    .exhaustive(),
);
/**
 * both rows extend: pull a's label out of b, unify the field types, recurse
 */
export const unifyRows: _Curry<[r1: Row, r2: Row, st: St], Result<St, TypeErr>> = _curry(
  3,
  (r1: Row, r2: Row, st: St) => {
    const a: Row = resolveRow(r1, st);
    const b: Row = resolveRow(r2, st);
    return match(a)
      .with({ _tag: "RowEmpty" }, () =>
        match(b)
          .with({ _tag: "RowEmpty" }, () => Ok(st) as Result<St, TypeErr>)
          .with({ _tag: "RowVar" }, ({ id: bid }) => bindRowVar(bid, a, st))
          .with({ _tag: "RowExtend" }, ({ label }) => fail(`record missing field '${label}'`))
          .exhaustive(),
      )
      .with({ _tag: "RowVar" }, ({ id: aid }) => bindRowVar(aid, b, st))
      .with(
        { _tag: "RowExtend" },
        ({ label: alabel, fieldType: atype, optional: aopt, rest: arest }) =>
          match(b)
            .with({ _tag: "RowEmpty" }, () => fail(`record has extra field '${alabel}'`))
            .with({ _tag: "RowVar" }, ({ id: bid }) => bindRowVar(bid, a, st))
            .with({ _tag: "RowExtend" }, () =>
              _Result_flatMap(
                ([btype, bopt, brest, s1]: [Ty, boolean, Row, St]) =>
                  eq(aopt, bopt)
                    ? _Result_flatMap(
                        (s2: St) => unifyRows(arest, brest, s2),
                        unify(atype, btype, s1),
                      )
                    : fail(
                        aopt
                          ? `record field '${alabel}' is optional but required on the other side`
                          : `record field '${alabel}' is required but optional on the other side`,
                      ),
                rewriteRow(b, alabel, st),
              ),
            )
            .exhaustive(),
      )
      .exhaustive();
  },
);
const bindRowVar: _Curry<[id: number, row: Row, st: St], Result<St, TypeErr>> = _curry(
  3,
  (id: number, row: Row, st: St) =>
    match(resolveRow(row, st))
      .with(
        (_v): _v is Extract<Row, { _tag: "RowVar" }> => {
          const _g: any = _v;
          return _g._tag === "RowVar" && (({ id: rid }) => eq(rid, id))(_g);
        },
        ({ id: rid }) => Ok(st) as Result<St, TypeErr>,
      )
      .otherwise((r) =>
        rowVarOccurs(id, r, st)
          ? fail("infinite record type")
          : (Ok({ ...st, rv: _Map_set(id, r, st.rv) }) as Result<St, TypeErr>),
      ),
);
/**
 * Directional record check: `actual` may be used where `expected` is required
 * (ADR 0098). Missing optional expected fields are allowed; a required actual
 * field satisfies an optional expected one; the reverse is not.
 */
export const fits: _Curry<[actual: Ty, expected: Ty, st: St], Result<St, TypeErr>> = _curry(
  3,
  (actual: Ty, expected: Ty, st: St) => {
    const ra: Ty = resolve(actual, st);
    const rb: Ty = resolve(expected, st);
    return match(ra)
      .with({ _tag: "TyVar" }, ({ id: aid }) => bindVar(aid, rb, st))
      .otherwise(() =>
        match(rb)
          .with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st))
          .with({ _tag: "TyRecord" }, ({ row: erow }) =>
            match(ra)
              .with({ _tag: "TyRecord" }, ({ row: arow }) => fitsRows(arow, erow, st))
              .otherwise(() => unify(actual, expected, st)),
          )
          .otherwise(() => unify(actual, expected, st)),
      );
  },
);
const fitsRows: _Curry<[actual: Row, expected: Row, st: St], Result<St, TypeErr>> = _curry(
  3,
  (actual: Row, expected: Row, st: St) => {
    const exp: Row = resolveRow(expected, st);
    const act: Row = resolveRow(actual, st);
    return match(exp)
      .with({ _tag: "RowVar" }, ({ id: eid }) => bindRowVar(eid, act, st))
      .with({ _tag: "RowEmpty" }, () =>
        match(act)
          .with({ _tag: "RowEmpty" }, () => Ok(st) as Result<St, TypeErr>)
          .with({ _tag: "RowVar" }, ({ id: aid }) => bindRowVar(aid, exp, st))
          .with({ _tag: "RowExtend" }, ({ label }) => fail(`record has extra field '${label}'`))
          .exhaustive(),
      )
      .with(
        { _tag: "RowExtend" },
        ({ label: elabel, fieldType: etype, optional: eopt, rest: erest }) =>
          ((rw: Result<[Ty, boolean, Row, St], TypeErr>) =>
            match(rw)
              .with({ _tag: "Err" }, () =>
                eopt ? fitsRows(act, erest, st) : fail(`record missing field '${elabel}'`),
              )
              .with({ _tag: "Ok" }, ({ value: hit }) =>
                (([htype, hopt, hrest, s1]: [Ty, boolean, Row, St]) =>
                  and(hopt, not(eopt))
                    ? fail(`record field '${elabel}' is required but missing or optional`)
                    : _Result_flatMap(
                        (s2: St) => fitsRows(hrest, erest, s2),
                        unify(htype, etype, s1),
                      ))(hit),
              )
              .exhaustive())(rewriteRow(act, elabel, st)),
      )
      .exhaustive();
  },
);
