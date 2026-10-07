import type { Expr, Pattern, Span } from "../ast/ast";
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
/**
 * Who a binder span names, for hover's `let x: T` / `(parameter) x: T` lead
 * (ADR 0119). Mirrors src/infer.ts's `SymbolInfo`: `kind` is "let",
 * "parameter", "property" or "extern"; `doc` is a top-level `///` comment.
 */
export type BinderSym = { kind: string; name: string; doc: Option<string> };
/**
 * `sym` is set only where a name is bound (or a field read), never on a
 * plain expression or pattern node.
 */
export type TypeAt = { span: SpanAt; ty: Ty; sym: Option<BinderSym> };
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
 *
 * `St` is copied on every step, so its growing parts are chunked:
 * `tv` / `rv` hold `ID_CHUNK` variable ids per inner map (`idGet` / `idSet`),
 * and `recorded` appends to a short `cur` array that moves to `full` when it
 * reaches `ID_CHUNK` entries (`recordedTypes` flattens it).
 */
export type Recorded = { cur: TypeAt[]; full: TypeAt[][] };
export type St = {
  tv: Map<number, Map<number, Ty>>;
  rv: Map<number, Map<number, Row>>;
  next: number;
  recorded: Recorded;
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
  _Array_concat,
  _Array_flatMap,
  _Array_get,
  _Array_prepend,
  _Map_get,
  _Map_getOr,
  _Map_keys,
  _Map_set,
  _Map_values,
  _Option_match,
  _Result_flatMap,
  _Result_map,
  _Result_match,
  _Str_join,
  _curry,
  _keyOf,
  _tuple,
  and,
  eq,
  floor,
  length,
  lt,
  map,
  not,
  or,
  show,
} from "@mochi/compiler/runtime";

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
const tCon$ = (name: string, args: Ty[]): Ty => TyCon(name, args);
export const tCon: _Curry<[name: string, args: Ty[]], Ty> = _curry(2, tCon$);
const tArrow$ = (fromT: Ty, toT: Ty): Ty => TyFn(fromT, toT);
export const tArrow: _Curry<[fromT: Ty, toT: Ty], Ty> = _curry(2, tArrow$);
export const tRecord: (row: Row) => Ty = (row: Row) => TyRecord(row);
export const tPrim: (name: string) => Ty = (name: string) => TyCon(name, [] as Ty[]);
export const tLit: (value: string) => Ty = (value: string) => TySingleton("string", value);
const typeEq$ = (a: Ty, b: Ty): boolean => {
  const $match = a;
  switch ($match._tag) {
    case "TyVar": {
      const { id: aid } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return eq(aid, bid);
        }
        default: {
          return false;
        }
      }
    }
    case "TyCon": {
      const { name: aname, args: aargs } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TyCon": {
          const { name: bname, args: bargs } = $match$;
          return and(
            and(eq(aname, bname), eq(length(aargs), length(bargs))),
            typeEqList$(aargs, bargs, 0),
          );
        }
        default: {
          return false;
        }
      }
    }
    case "TyFn": {
      const { from: af, to: at } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TyFn": {
          const { from: bf, to: bt } = $match$;
          return and(typeEq$(af, bf), typeEq$(at, bt));
        }
        default: {
          return false;
        }
      }
    }
    case "TyRecord": {
      const { row: arow } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TyRecord": {
          const { row: brow } = $match$;
          return rowEq$(arow, brow);
        }
        default: {
          return false;
        }
      }
    }
    case "TySingleton": {
      const { base: abase, value: aval } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TySingleton": {
          const { base: bbase, value: bval } = $match$;
          return and(eq(abase, bbase), eq(aval, bval));
        }
        default: {
          return false;
        }
      }
    }
    case "TyOneOf": {
      const { members: am } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TyOneOf": {
          const { members: bm } = $match$;
          return and(eq(length(am), length(bm)), allMembersIn$(am, bm, 0));
        }
        default: {
          return false;
        }
      }
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const typeEqList$ = (as_: Ty[], bs: Ty[], i: number): boolean =>
  _Option_match(
    _Array_get(i, as_),
    () => true,
    (a) =>
      _Option_match(
        _Array_get(i, bs),
        () => false,
        (b) => and(typeEq$(a, b), typeEqList$(as_, bs, i + 1)),
      ),
  );
const memberEqIn$ = (t: Ty, xs: Ty[], i: number): boolean =>
  _Option_match(
    _Array_get(i, xs),
    () => false,
    (x) => (typeEq$(t, x) ? true : memberEqIn$(t, xs, i + 1)),
  );
const allMembersIn$ = (am: Ty[], bm: Ty[], i: number): boolean =>
  _Option_match(
    _Array_get(i, am),
    () => true,
    (m) => and(memberEqIn$(m, bm, 0), allMembersIn$(am, bm, i + 1)),
  );
const rowEq$ = (a: Row, b: Row): boolean => {
  const $match = a;
  switch ($match._tag) {
    case "RowEmpty": {
      const $match$ = b;
      switch ($match$._tag) {
        case "RowEmpty": {
          return true;
        }
        default: {
          return false;
        }
      }
    }
    case "RowVar": {
      const { id: aid } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "RowVar": {
          const { id: bid } = $match$;
          return eq(aid, bid);
        }
        default: {
          return false;
        }
      }
    }
    case "RowExtend": {
      const { label: al, fieldType: at, optional: ao, rest: ar } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "RowExtend": {
          const { label: bl, fieldType: bt, optional: bo, rest: br } = $match$;
          return and(and(and(eq(al, bl), eq(ao, bo)), typeEq$(at, bt)), rowEq$(ar, br));
        }
        default: {
          return false;
        }
      }
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const flattenUnionFrom$ = (members: Ty[], acc: Ty[], i: number): Ty[] =>
  _Option_match(
    _Array_get(i, members),
    () => acc,
    (t) => {
      const $match = t;
      switch ($match._tag) {
        case "TyOneOf": {
          const { members: ms } = $match;
          return flattenUnionFrom$(members, flattenUnionFrom$(ms, acc, 0), i + 1);
        }
        default: {
          return flattenUnionFrom$(
            members,
            memberEqIn$(t, acc, 0) ? acc : _Array_append(t, acc),
            i + 1,
          );
        }
      }
    },
  );
/**
 * Finite union. Keep singleton literal unions precise through generalization.
 */
export const tUnion: (members: Ty[]) => Ty = (members: Ty[]) => {
  const flat: Ty[] = flattenUnionFrom$(members, [] as Ty[], 0);
  return ((_v) =>
    _v.length === 0
      ? tPrim("string")
      : _v.length === 1 && _v[0]._tag === "TySingleton"
        ? TyOneOf(flat)
        : _v.length === 1
          ? (([only]) => only)(_v)
          : TyOneOf(flat))(flat);
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
export const isUnit: (t: Ty) => boolean = (t: Ty) => {
  const $match = t;
  switch ($match._tag) {
    case "TyCon": {
      const { name, args } = $match;
      return and(eq(name, UNIT), length(args) === 0);
    }
    default: {
      return false;
    }
  }
};
export const rVar: (id: number) => Row = (id: number) => RowVar(id);
const rExtend$ = (label: string, fieldType: Ty, rest: Row): Row =>
  RowExtend(label, fieldType, false, rest);
export const rExtend: _Curry<[label: string, fieldType: Ty, rest: Row], Row> = _curry(3, rExtend$);
const rField$ = (label: string, fieldType: Ty, rest: Row, optional: boolean): Row =>
  RowExtend(label, fieldType, optional, rest);
export const rField: _Curry<[label: string, fieldType: Ty, rest: Row, optional: boolean], Row> =
  _curry(4, rField$);
const showTypeArgs: (args: Ty[]) => string = (args: Ty[]) => _Str_join(", ", map(showType, args));
/**
 * `unit` renders as its literal `()` in every position (ADR 0054), which also
 * covers the nullary-arrow domain: `unit -> T` prints `() -> T` (ADR 0014).
 */
export const showType: (t: Ty) => string = (t: Ty) => {
  const $match = t;
  switch ($match._tag) {
    case "TyVar": {
      const { id } = $match;
      return `'t${show(id)}`;
    }
    case "TyCon": {
      const { name, args } = $match;
      return ((_v) =>
        _v.length === 1 && (([elem]) => name === "Array")(_v)
          ? (([elem]) => `[${showType(elem)}]`)(_v)
          : _v.length === 0 && eq(name, UNIT)
            ? "()"
            : eq(name, TUPLE)
              ? `(${showTypeArgs(args)})`
              : length(args) === 0
                ? name
                : `${name}<${showTypeArgs(args)}>`)(args);
    }
    case "TyFn": {
      const { from, to } = $match;
      const fromS: string = ((_v) => (_v._tag === "TyFn" ? `(${showType(from)})` : showType(from)))(
        from,
      );
      return `${fromS} -> ${showType(to)}`;
    }
    case "TyRecord": {
      const { row } = $match;
      return showRow(row);
    }
    case "TySingleton": {
      const { base, value } = $match;
      return base === "string" ? show(value) : value;
    }
    case "TyOneOf": {
      const { members } = $match;
      return _Str_join(" | ", map(showType, members));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
/**
 * walk a row to its tail, collecting `label: type` field strings on the way
 */
const showRowFields: (row: Row) => [string[], Option<number>] = (row: Row) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return (([fields, tailId]: [string[], Option<number>]) =>
        _tuple(
          _Array_prepend(`${label}${optional ? "?" : ""}: ${showType(fieldType)}`, fields),
          tailId,
        ))(showRowFields(rest));
    }
    case "RowVar": {
      const { id } = $match;
      return _tuple([] as string[], Some(id) as Option<number>);
    }
    case "RowEmpty": {
      return _tuple([] as string[], None as Option<number>);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const showRow: (row: Row) => string = (row: Row) =>
  (([fields, tailId]: [string[], Option<number>]) => {
    const tail: string = _Option_match(
      tailId,
      () => "",
      (id) => `${length(fields) === 0 ? "" : " "}| 'r${show(id)}`,
    );
    return and(length(fields) === 0, tail === "") ? "{}" : `{ ${_Str_join(", ", fields)}${tail} }`;
  })(showRowFields(row));
const someOfFrom: <A>(f: (a: A) => boolean, xs: A[], i: number) => boolean = _curry(
  3,
  <A>(f: (a: A) => boolean, xs: A[], i: number) =>
    _Option_match(
      _Array_get(i, xs),
      () => false,
      (x) => (f(x) ? true : someOfFrom(f, xs, i + 1)),
    ),
);
const someOf: <A>(f: (a: A) => boolean, xs: A[]) => boolean = _curry(
  2,
  <A>(f: (a: A) => boolean, xs: A[]) => someOfFrom(f, xs, 0),
);

export const mkSt: (start: number) => St = (start: number) => ({
  tv: new Map<number, Map<number, Ty>>(),
  rv: new Map<number, Map<number, Row>>(),
  next: start,
  recorded: { cur: [] as TypeAt[], full: [] as TypeAt[][] },
  letSpans: new Map<string, SpanAt>(),
  letUses: new Map<string, Ty[]>(),
});
const ID_CHUNK: number = 64;
/**
 * The binding for variable `id` in a chunked substitution.
 */
export const idGet: <A>(id: number, m: Map<number, Map<number, A>>) => Option<A> = _curry(
  2,
  <A>(id: number, m: Map<number, Map<number, A>>) =>
    _Option_match(
      _Map_get(floor(id / ID_CHUNK), m),
      () => None,
      (chunk) => _Map_get(id, chunk),
    ),
);
/**
 * Bind `id`, copying the outer map and one chunk rather than every binding.
 */
export const idSet: <A>(
  id: number,
  v: A,
  m: Map<number, Map<number, A>>,
) => Map<number, Map<number, A>> = _curry(
  3,
  <A>(id: number, v: A, m: Map<number, Map<number, A>>) => {
    const k: number = floor(id / ID_CHUNK);
    return _Map_set(k, _Map_set(id, v, _Map_getOr(new Map<number, A>(), k, m)), m);
  },
);
/**
 * Every bound id.
 */
export const idKeys: <A, B, C>(m: Map<A, Map<B, C>>) => B[] = <A, B, C>(m: Map<A, Map<B, C>>) =>
  _Array_flatMap(_Map_keys, _Map_values(m));
/**
 * Append an inferred type, and the binder it names if any, to the record log.
 */
const recordSymAt$ = (span: SpanAt, t: Ty, sym: Option<BinderSym>, st: St): St => {
  const rec: Recorded = st.recorded;
  const at: TypeAt = { span: span, ty: t, sym: sym };
  return {
    ...st,
    recorded:
      length(rec.cur) < ID_CHUNK
        ? { cur: _Array_append(at, rec.cur), full: rec.full }
        : { cur: [at], full: _Array_append(rec.cur, rec.full) },
  };
};
const recordAt$ = (span: SpanAt, t: Ty, st: St): St =>
  recordSymAt$(span, t, None as Option<BinderSym>, st);
/**
 * Append an inferred node type to the threaded record log.
 */
export const recordAt: _Curry<[span: SpanAt, t: Ty, st: St], St> = _curry(3, recordAt$);
const recordBinder$ = (
  span: SpanAt,
  t: Ty,
  kind: string,
  name: string,
  doc: Option<string>,
  st: St,
): St => recordSymAt$(span, t, Some({ kind: kind, name: name, doc: doc }) as Option<BinderSym>, st);
/**
 * Record the type bound at a binder's name span (ADR 0119).
 */
export const recordBinder: _Curry<
  [span: SpanAt, t: Ty, kind: string, name: string, doc: Option<string>, st: St],
  St
> = _curry(6, recordBinder$);
/**
 * The record log in the order it was written.
 */
export const recordedTypes: (st: St) => TypeAt[] = (st: St) =>
  _Array_concat(
    _Array_flatMap((c: TypeAt[]) => c, st.recorded.full),
    st.recorded.cur,
  );
const spanKeyOf: <A, B, C>(sp: { start: A; end: B } & C) => string = <A, B, C>(
  sp: { start: A; end: B } & C,
) => `${show(sp.start)}:${show(sp.end)}`;
const noteLet$ = (span: SpanAt, st: St): St => {
  const k: string = spanKeyOf(span);
  return {
    ...st,
    letSpans: _Map_set(k, span, st.letSpans),
    letUses: _Map_set(k, [] as Ty[], st.letUses),
  };
};
/**
 * Register a `let`'s value span as an ADR 0035 annotation candidate. Resets its
 * use list, mirroring src/infer.ts's `noteLet` (a re-noted scheme starts over).
 */
export const noteLet: _Curry<[span: SpanAt, st: St], St> = _curry(2, noteLet$);
/**
 * Record one instantiation of a noted `let`. A span that was never noted (a
 * builtin, an import, a lambda param) is not a candidate and is dropped.
 */
export const noteUse: <A, B, C>(span: { start: A; end: B } & C, t: Ty, st: St) => St = _curry(
  3,
  <A, B, C>(span: { start: A; end: B } & C, t: Ty, st: St) => {
    const k: string = spanKeyOf(span);
    return _Option_match(
      _Map_get(k, st.letUses),
      () => st,
      (uses) => ({ ...st, letUses: _Map_set(k, _Array_append(t, uses), st.letUses) }),
    );
  },
);
export const fail: <B>(message: string) => Result<B, TypeErr> = <B>(message: string) =>
  Err({ message: message });
export const freshVar: <A>(st: { next: number } & A) => [Ty, { next: number } & A] = <A>(
  st: { next: number } & A,
) => _tuple(tVar(st.next), { ...st, next: st.next + 1 });
export const freshRowVar: <A>(st: { next: number } & A) => [Row, { next: number } & A] = <A>(
  st: { next: number } & A,
) => _tuple(rVar(st.next), { ...st, next: st.next + 1 });
const resolve$ = (t: Ty, st: St): Ty => {
  const $match = t;
  switch ($match._tag) {
    case "TyVar": {
      const { id } = $match;
      return _Option_match(
        idGet(id, st.tv),
        () => t,
        (next) => resolve$(next, st),
      );
    }
    default: {
      return t;
    }
  }
};
export const resolve: _Curry<[t: Ty, st: St], Ty> = _curry(2, resolve$);
const resolveRow$ = (r: Row, st: St): Row => {
  const $match = r;
  switch ($match._tag) {
    case "RowVar": {
      const { id } = $match;
      return _Option_match(
        idGet(id, st.rv),
        () => r,
        (next) => resolveRow$(next, st),
      );
    }
    default: {
      return r;
    }
  }
};
const zonk$ = (t: Ty, st: St): Ty => {
  const $match = resolve$(t, st);
  switch ($match._tag) {
    case "TyVar": {
      const { id } = $match;
      return tVar(id);
    }
    case "TyCon": {
      const { name, args } = $match;
      return tCon$(
        name,
        map((a: Ty) => zonk$(a, st), args),
      );
    }
    case "TyFn": {
      const { from, to } = $match;
      return tArrow$(zonk$(from, st), zonk$(to, st));
    }
    case "TyRecord": {
      const { row } = $match;
      return tRecord(zonkRow$(row, st));
    }
    case "TySingleton": {
      const { base, value } = $match;
      return TySingleton(base, value);
    }
    case "TyOneOf": {
      const { members } = $match;
      return tUnion(map((m: Ty) => zonk$(m, st), members));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
/**
 * Fully apply the substitution ("zonk") — for display and assertions.
 */
export const zonk: _Curry<[t: Ty, st: St], Ty> = _curry(2, zonk$);
const zonkRow$ = (row: Row, st: St): Row => {
  const $match = resolveRow$(row, st);
  switch ($match._tag) {
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return rField$(label, zonk$(fieldType, st), zonkRow$(rest, st), optional);
    }
    default: {
      const r = $match;
      return r;
    }
  }
};
const occurs$ = (id: number, t: Ty, st: St): boolean => {
  const $match = resolve$(t, st);
  switch ($match._tag) {
    case "TyVar": {
      const { id: rid } = $match;
      return eq(rid, id);
    }
    case "TyCon": {
      const { args } = $match;
      return someOf((a: Ty) => occurs$(id, a, st), args);
    }
    case "TyFn": {
      const { from, to } = $match;
      return or(occurs$(id, from, st), occurs$(id, to, st));
    }
    case "TyRecord": {
      const { row } = $match;
      return occursRow$(id, row, st);
    }
    case "TySingleton": {
      return false;
    }
    case "TyOneOf": {
      const { members } = $match;
      return someOf((m: Ty) => occurs$(id, m, st), members);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
export const occurs: _Curry<[id: number, t: Ty, st: St], boolean> = _curry(3, occurs$);
const occursRow$ = (id: number, row: Row, st: St): boolean => {
  const $match = resolveRow$(row, st);
  switch ($match._tag) {
    case "RowExtend": {
      const { fieldType, rest } = $match;
      return or(occurs$(id, fieldType, st), occursRow$(id, rest, st));
    }
    default: {
      return false;
    }
  }
};
const rowVarOccurs$ = (id: number, row: Row, st: St): boolean => {
  const $match = resolveRow$(row, st);
  switch ($match._tag) {
    case "RowVar": {
      const { id: rid } = $match;
      return eq(rid, id);
    }
    case "RowExtend": {
      const { fieldType, rest } = $match;
      return or(rowVarOccursInType$(id, fieldType, st), rowVarOccurs$(id, rest, st));
    }
    case "RowEmpty": {
      return false;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
export const rowVarOccurs: _Curry<[id: number, row: Row, st: St], boolean> = _curry(
  3,
  rowVarOccurs$,
);
const rowVarOccursInType$ = (id: number, t: Ty, st: St): boolean => {
  const $match = resolve$(t, st);
  switch ($match._tag) {
    case "TyVar": {
      return false;
    }
    case "TyCon": {
      const { args } = $match;
      return someOf((a: Ty) => rowVarOccursInType$(id, a, st), args);
    }
    case "TyFn": {
      const { from, to } = $match;
      return or(rowVarOccursInType$(id, from, st), rowVarOccursInType$(id, to, st));
    }
    case "TyRecord": {
      const { row } = $match;
      return rowVarOccurs$(id, row, st);
    }
    case "TySingleton": {
      return false;
    }
    case "TyOneOf": {
      const { members } = $match;
      return someOf((m: Ty) => rowVarOccursInType$(id, m, st), members);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const isArrowT: (t: Ty) => boolean = (t: Ty) => {
  const $match = t;
  switch ($match._tag) {
    case "TyFn": {
      return true;
    }
    default: {
      return false;
    }
  }
};
const isCollection: (name: string) => boolean = (name: string) =>
  or(
    or(or(or(name === "Array", name === "List"), name === "Set"), name === "Map"),
    name === "Dict",
  );
const isTupleT: (t: Ty) => boolean = (t: Ty) => {
  const $match = t;
  switch ($match._tag) {
    case "TyCon": {
      const { name } = $match;
      return eq(name, TUPLE);
    }
    default: {
      return false;
    }
  }
};
const tupleParenMsg$ = (a: Ty, b: Ty, shown: string): string =>
  !eq(isTupleT(a), isTupleT(b))
    ? `${shown} — ((a, b)) => takes one tuple; (a, b) => takes two arguments`
    : shown;
const collectionUnifyMsg$ = (aname: string, bname: string, shown: string): string =>
  or(or(eq(aname, bname), !isCollection(aname)), !isCollection(bname))
    ? shown
    : ((other: string) =>
        ((hint: string) => `${shown} — ${hint}`)(
          other === "List"
            ? "unqualified map/filter/length expect Array; use List.map"
            : other === "Set"
              ? "unqualified map/filter/length expect Array; convert with Set.toArray or use Set.*"
              : other === "Map"
                ? "unqualified map/filter/length expect Array; use Map.*"
                : `${aname} and ${bname} are distinct collections`,
        ))(aname === "Array" ? bname : bname === "Array" ? aname : "");
const unifyMismatch: <A>(ra: Ty, rb: Ty) => Result<A, TypeErr> = _curry(2, <A>(ra: Ty, rb: Ty) =>
  !eq(isArrowT(ra), isArrowT(rb))
    ? (([fn, val]: [Ty, Ty]) =>
        fail(
          tupleParenMsg$(
            ra,
            rb,
            `cannot unify ${showType(ra)} with ${showType(rb)} — a function (${showType(fn)}) was used where a ${showType(val)} was expected; a call may be missing an argument`,
          ),
        ))(isArrowT(ra) ? _tuple(ra, rb) : _tuple(rb, ra))
    : fail(tupleParenMsg$(ra, rb, `cannot unify ${showType(ra)} with ${showType(rb)}`)),
);
const unifyArgs$ = (as_: Ty[], bs: Ty[], i: number, st: St): Result<St, TypeErr> =>
  _Option_match(
    _Array_get(i, as_),
    () => Ok(st) as Result<St, TypeErr>,
    (a) =>
      _Option_match(
        _Array_get(i, bs),
        () => Ok(st) as Result<St, TypeErr>,
        (b) => _Result_flatMap((s1: St) => unifyArgs$(as_, bs, i + 1, s1), unify$(a, b, st)),
      ),
  );
const isPrimT$ = (t: Ty, name: string): boolean => {
  const $match = t;
  switch ($match._tag) {
    case "TyCon": {
      const { name: n, args } = $match;
      return and(eq(n, name), length(args) === 0);
    }
    default: {
      return false;
    }
  }
};
const isLitOnlyUnion: (members: Ty[]) => boolean = (members: Ty[]) =>
  ((_v) =>
    _v.length === 0
      ? true
      : _v.length >= 1 && _v[0]._tag === "TySingleton"
        ? (([, ...rest]) => isLitOnlyUnion(rest))(
            _v as [Extract<Ty[][number], { _tag: "TySingleton" }>, ...Ty[]],
          )
        : false)(members);
/**
 * Walks `ids` by index: a `[id, ...rest]` walk copies the rest of the array at
 * every step, and `ids` is every bound variable.
 */
const widenLitBindingsFrom$ = (ids: number[], i: number, lit: Ty, st: St): St =>
  _Option_match(
    _Array_get(i, ids),
    () => st,
    (id) =>
      _Option_match(
        idGet(id, st.tv),
        () => widenLitBindingsFrom$(ids, i + 1, lit, st),
        (t) => {
          const $match = resolve$(t, st);
          switch ($match._tag) {
            case "TySingleton": {
              const { base, value } = $match;
              const $match$ = lit;
              switch ($match$._tag) {
                case "TySingleton": {
                  const { base: lbase, value: lvalue } = $match$;
                  return and(eq(base, lbase), eq(value, lvalue))
                    ? widenLitBindingsFrom$(ids, i + 1, lit, {
                        ...st,
                        tv: idSet(id, tPrim(base), st.tv),
                      })
                    : widenLitBindingsFrom$(ids, i + 1, lit, st);
                }
                default: {
                  return widenLitBindingsFrom$(ids, i + 1, lit, st);
                }
              }
            }
            default: {
              return widenLitBindingsFrom$(ids, i + 1, lit, st);
            }
          }
        },
      ),
  );
const widenLitBindings$ = (lit: Ty, st: St): St => widenLitBindingsFrom$(idKeys(st.tv), 0, lit, st);
const litInUnionFrom$ = (lit: Ty, members: Ty[], i: number, st: St): Result<St, TypeErr> =>
  _Option_match(
    _Array_get(i, members),
    () => fail(`cannot unify ${showType(lit)} with ${showType(TyOneOf(members))}`),
    (m) => {
      const $match = m;
      switch ($match._tag) {
        case "TySingleton": {
          const { base, value } = $match;
          const $match$ = lit;
          switch ($match$._tag) {
            case "TySingleton": {
              const { base: lbase, value: lvalue } = $match$;
              return and(eq(base, lbase), eq(value, lvalue))
                ? (Ok(st) as Result<St, TypeErr>)
                : litInUnionFrom$(lit, members, i + 1, st);
            }
            default: {
              return litInUnionFrom$(lit, members, i + 1, st);
            }
          }
        }
        default: {
          return _Result_match(
            unify$(lit, m, st),
            () => litInUnionFrom$(lit, members, i + 1, st),
            (st1) => Ok(st1) as Result<St, TypeErr>,
          );
        }
      }
    },
  );
const unifyMemberAgainstUnionFrom$ = (
  member: Ty,
  members: Ty[],
  i: number,
  st: St,
): Result<St, TypeErr> => {
  const $match = member;
  switch ($match._tag) {
    case "TySingleton": {
      return litInUnionFrom$(member, members, 0, st);
    }
    default: {
      return unifyConcreteAgainstUnionFrom$(member, members, i, st);
    }
  }
};
/**
 * Split so `fail` sits beside `Ok` in one match (tsc-clean Result, ADR 0026).
 */
const unifyConcreteAgainstUnionFrom$ = (
  member: Ty,
  members: Ty[],
  i: number,
  st: St,
): Result<St, TypeErr> =>
  _Option_match(
    _Array_get(i, members),
    () => fail(`cannot unify ${showType(member)} with ${showType(TyOneOf(members))}`),
    (m) =>
      _Result_match(
        unify$(member, m, st),
        () => unifyConcreteAgainstUnionFrom$(member, members, i + 1, st),
        (st1) => Ok(st1) as Result<St, TypeErr>,
      ),
  );
const unifyUnionMembersFrom$ = (members: Ty[], u: Ty, i: number, st: St): Result<St, TypeErr> =>
  _Option_match(
    _Array_get(i, members),
    () => Ok(st) as Result<St, TypeErr>,
    (m) => {
      const $match = u;
      switch ($match._tag) {
        case "TyOneOf": {
          const { members: ums } = $match;
          return _Result_flatMap(
            (s1: St) => unifyUnionMembersFrom$(members, u, i + 1, s1),
            unifyMemberAgainstUnionFrom$(m, ums, 0, st),
          );
        }
        default: {
          return Ok(st) as Result<St, TypeErr>;
        }
      }
    },
  );
const unifyLitUnion$ = (a: Ty, b: Ty, st: St): Result<St, TypeErr> => {
  const $match = a;
  switch ($match._tag) {
    case "TySingleton": {
      const { base: abase, value: aval } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TySingleton": {
          const { base: bbase, value: bval } = $match$;
          return and(eq(abase, bbase), eq(aval, bval))
            ? (Ok(st) as Result<St, TypeErr>)
            : eq(abase, bbase)
              ? (Ok(widenLitBindings$(b, widenLitBindings$(a, st))) as Result<St, TypeErr>)
              : fail(`cannot unify ${showType(a)} with ${showType(b)}`);
        }
        case "TyOneOf": {
          const { members } = $match$;
          return litInUnionFrom$(a, members, 0, st);
        }
        default: {
          return isPrimT$(b, abase)
            ? (Ok(st) as Result<St, TypeErr>)
            : fail(`cannot unify ${showType(a)} with ${showType(b)}`);
        }
      }
    }
    case "TyOneOf": {
      const { members: amembers } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TySingleton": {
          return litInUnionFrom$(b, amembers, 0, st);
        }
        case "TyOneOf": {
          const { members: bmembers } = $match$;
          return _Result_flatMap(
            (s1: St) => unifyUnionMembersFrom$(bmembers, a, 0, s1),
            unifyUnionMembersFrom$(amembers, b, 0, st),
          );
        }
        default: {
          return isLitOnlyUnion(amembers)
            ? fail(`cannot unify ${showType(a)} with ${showType(b)}`)
            : unifyMemberAgainstUnionFrom$(b, amembers, 0, st);
        }
      }
    }
    default: {
      const $match$ = b;
      switch ($match$._tag) {
        case "TySingleton": {
          const { base: bbase } = $match$;
          return isPrimT$(a, bbase)
            ? (Ok(st) as Result<St, TypeErr>)
            : fail(`cannot unify ${showType(a)} with ${showType(b)}`);
        }
        case "TyOneOf": {
          const { members: bmembers } = $match$;
          return isLitOnlyUnion(bmembers)
            ? fail(`cannot unify ${showType(a)} with ${showType(b)}`)
            : unifyMemberAgainstUnionFrom$(a, bmembers, 0, st);
        }
        default: {
          return fail(`cannot unify ${showType(a)} with ${showType(b)}`);
        }
      }
    }
  }
};
const unify$ = (a: Ty, b: Ty, st: St): Result<St, TypeErr> => {
  const ra: Ty = resolve$(a, st);
  const rb: Ty = resolve$(b, st);
  const $match = ra;
  switch ($match._tag) {
    case "TyVar": {
      const { id: aid } = $match;
      const $match$ = rb;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return eq(aid, bid) ? (Ok(st) as Result<St, TypeErr>) : bindVar$(aid, rb, st);
        }
        default: {
          return bindVar$(aid, rb, st);
        }
      }
    }
    case "TyCon": {
      const { name: aname, args: aargs } = $match;
      const $match$ = rb;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return bindVar$(bid, ra, st);
        }
        case "TyCon": {
          const { name: bname, args: bargs } = $match$;
          return and(eq(aname, bname), eq(length(aargs), length(bargs)))
            ? unifyArgs$(aargs, bargs, 0, st)
            : fail(
                tupleParenMsg$(
                  ra,
                  rb,
                  collectionUnifyMsg$(
                    aname,
                    bname,
                    `cannot unify ${showType(ra)} with ${showType(rb)}`,
                  ),
                ),
              );
        }
        case "TySingleton": {
          return unifyLitUnion$(ra, rb, st);
        }
        case "TyOneOf": {
          return unifyLitUnion$(ra, rb, st);
        }
        default: {
          return unifyMismatch(ra, rb);
        }
      }
    }
    case "TyFn": {
      const { from: afrom, to: ato } = $match;
      const $match$ = rb;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return bindVar$(bid, ra, st);
        }
        case "TyFn": {
          const { from: bfrom, to: bto } = $match$;
          return _Result_flatMap((s1: St) => unify$(ato, bto, s1), unify$(afrom, bfrom, st));
        }
        case "TySingleton": {
          return unifyLitUnion$(ra, rb, st);
        }
        case "TyOneOf": {
          return unifyLitUnion$(ra, rb, st);
        }
        default: {
          return unifyMismatch(ra, rb);
        }
      }
    }
    case "TyRecord": {
      const { row: arow } = $match;
      const $match$ = rb;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return bindVar$(bid, ra, st);
        }
        case "TyRecord": {
          const { row: brow } = $match$;
          return unifyRows$(arow, brow, st);
        }
        case "TySingleton": {
          return unifyLitUnion$(ra, rb, st);
        }
        case "TyOneOf": {
          return unifyLitUnion$(ra, rb, st);
        }
        default: {
          return unifyMismatch(ra, rb);
        }
      }
    }
    case "TySingleton": {
      const $match$ = rb;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return bindVar$(bid, ra, st);
        }
        default: {
          return unifyLitUnion$(ra, rb, st);
        }
      }
    }
    case "TyOneOf": {
      const $match$ = rb;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return bindVar$(bid, ra, st);
        }
        default: {
          return unifyLitUnion$(ra, rb, st);
        }
      }
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
export const unify: _Curry<[a: Ty, b: Ty, st: St], Result<St, TypeErr>> = _curry(3, unify$);
const bindVar$ = (id: number, t: Ty, st: St): Result<St, TypeErr> =>
  occurs$(id, t, st)
    ? fail(`infinite type: 't${show(id)} occurs in ${showType(zonk$(t, st))}`)
    : (Ok({ ...st, tv: idSet(id, t, st.tv) }) as Result<St, TypeErr>);
/**
 * Bring `label` to the head of a row, extending an open tail if needed.
 * Returns the field's type, optionality, the remaining row, and state.
 */
const rewriteRow$ = (row: Row, label: string, st: St): Result<[Ty, boolean, Row, St], TypeErr> => {
  const $match = resolveRow$(row, st);
  switch ($match._tag) {
    case "RowEmpty": {
      return fail(`record missing field '${label}'`);
    }
    case "RowExtend": {
      const { label: rlabel, fieldType: rtype, optional: ropt, rest: rrest } = $match;
      return eq(rlabel, label)
        ? (Ok(_tuple(rtype, ropt, rrest, st)) as Result<[Ty, boolean, Row, St], TypeErr>)
        : _Result_map(
            ([subType, subOpt, subRest, subSt]: [Ty, boolean, Row, St]) =>
              _tuple(subType, subOpt, rField$(rlabel, rtype, subRest, ropt), subSt),
            rewriteRow$(rrest, label, st),
          );
    }
    case "RowVar": {
      const { id: rid } = $match;
      return (([freshT, st1]: [Ty, St]) =>
        (([freshTail, st2]: [Row, St]) =>
          Ok(
            _tuple(freshT, false, freshTail, {
              ...st2,
              rv: idSet(rid, rExtend$(label, freshT, freshTail), st2.rv),
            }),
          ) as Result<[Ty, boolean, Row, St], TypeErr>)(freshRowVar(st1)))(freshVar(st));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const unifyRows$ = (r1: Row, r2: Row, st: St): Result<St, TypeErr> => {
  const a: Row = resolveRow$(r1, st);
  const b: Row = resolveRow$(r2, st);
  const $match = a;
  switch ($match._tag) {
    case "RowEmpty": {
      const $match$ = b;
      switch ($match$._tag) {
        case "RowEmpty": {
          return Ok(st) as Result<St, TypeErr>;
        }
        case "RowVar": {
          const { id: bid } = $match$;
          return bindRowVar$(bid, a, st);
        }
        case "RowExtend": {
          const { label } = $match$;
          return fail(`record missing field '${label}'`);
        }
        default: {
          throw new Error("non-exhaustive match");
        }
      }
    }
    case "RowVar": {
      const { id: aid } = $match;
      return bindRowVar$(aid, b, st);
    }
    case "RowExtend": {
      const { label: alabel, fieldType: atype, optional: aopt, rest: arest } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "RowEmpty": {
          return fail(`record has extra field '${alabel}'`);
        }
        case "RowVar": {
          const { id: bid } = $match$;
          return bindRowVar$(bid, a, st);
        }
        case "RowExtend": {
          return _Result_flatMap(
            ([btype, bopt, brest, s1]: [Ty, boolean, Row, St]) =>
              eq(aopt, bopt)
                ? _Result_flatMap(
                    (s2: St) => unifyRows$(arest, brest, s2),
                    unify$(atype, btype, s1),
                  )
                : fail(
                    aopt
                      ? `record field '${alabel}' is optional but required on the other side`
                      : `record field '${alabel}' is required but optional on the other side`,
                  ),
            rewriteRow$(b, alabel, st),
          );
        }
        default: {
          throw new Error("non-exhaustive match");
        }
      }
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
/**
 * both rows extend: pull a's label out of b, unify the field types, recurse
 */
export const unifyRows: _Curry<[r1: Row, r2: Row, st: St], Result<St, TypeErr>> = _curry(
  3,
  unifyRows$,
);
const bindRowVar$ = (id: number, row: Row, st: St): Result<St, TypeErr> =>
  ((_v) =>
    _v._tag === "RowVar" && (({ id: rid }) => eq(rid, id))(_v)
      ? (({ id: rid }) => Ok(st) as Result<St, TypeErr>)(_v)
      : ((r) =>
          rowVarOccurs$(id, r, st)
            ? fail("infinite record type")
            : (Ok({ ...st, rv: idSet(id, r, st.rv) }) as Result<St, TypeErr>))(_v))(
    resolveRow$(row, st),
  );
const fits$ = (actual: Ty, expected: Ty, st: St): Result<St, TypeErr> => {
  const ra: Ty = resolve$(actual, st);
  const rb: Ty = resolve$(expected, st);
  const $match = ra;
  switch ($match._tag) {
    case "TyVar": {
      const { id: aid } = $match;
      return bindVar$(aid, rb, st);
    }
    default: {
      const $match$ = rb;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return bindVar$(bid, ra, st);
        }
        case "TyRecord": {
          const { row: erow } = $match$;
          const $match$$ = ra;
          switch ($match$$._tag) {
            case "TyRecord": {
              const { row: arow } = $match$$;
              return fitsRows$(arow, erow, st);
            }
            default: {
              return unify$(actual, expected, st);
            }
          }
        }
        default: {
          return unify$(actual, expected, st);
        }
      }
    }
  }
};
/**
 * Directional record check: `actual` may be used where `expected` is required
 * (ADR 0098). Missing optional expected fields are allowed; a required actual
 * field satisfies an optional expected one; the reverse is not.
 */
export const fits: _Curry<[actual: Ty, expected: Ty, st: St], Result<St, TypeErr>> = _curry(
  3,
  fits$,
);
const fitsRows$ = (actual: Row, expected: Row, st: St): Result<St, TypeErr> => {
  const exp: Row = resolveRow$(expected, st);
  const act: Row = resolveRow$(actual, st);
  const $match = exp;
  switch ($match._tag) {
    case "RowVar": {
      const { id: eid } = $match;
      return bindRowVar$(eid, act, st);
    }
    case "RowEmpty": {
      const $match$ = act;
      switch ($match$._tag) {
        case "RowEmpty": {
          return Ok(st) as Result<St, TypeErr>;
        }
        case "RowVar": {
          const { id: aid } = $match$;
          return bindRowVar$(aid, exp, st);
        }
        case "RowExtend": {
          const { label } = $match$;
          return fail(`record has extra field '${label}'`);
        }
        default: {
          throw new Error("non-exhaustive match");
        }
      }
    }
    case "RowExtend": {
      const { label: elabel, fieldType: etype, optional: eopt, rest: erest } = $match;
      const rw: Result<[Ty, boolean, Row, St], TypeErr> = rewriteRow$(act, elabel, st);
      return _Result_match(
        rw,
        () => (eopt ? fitsRows$(act, erest, st) : fail(`record missing field '${elabel}'`)),
        (hit) =>
          (([htype, hopt, hrest, s1]: [Ty, boolean, Row, St]) =>
            and(hopt, !eopt)
              ? fail(`record field '${elabel}' is required but missing or optional`)
              : _Result_flatMap((s2: St) => fitsRows$(hrest, erest, s2), unify$(htype, etype, s1)))(
            hit,
          ),
      );
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
