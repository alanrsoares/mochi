import type { PatField, Pattern } from "../ast/ast";

import type { Option, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Array_concat,
  _Array_get,
  _Array_head,
  _Array_prepend,
  _Map_get,
  _Option_isSome,
  _Option_match,
  _Option_unwrapOr,
  _Str_join,
  _curry,
  eq,
  length,
  map,
  or,
  show,
  sub,
} from "@mochi/compiler/runtime";

import * as Ast from "../ast/ast";
import { jsStringLit, litValue } from "./literals";
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
const patternKeyAt$ = (ctorKeys: Map<string, string[]>, ctor: string, i: number): string =>
  _Option_match(
    _Map_get(ctor, ctorKeys),
    () => `_${show(i)}`,
    (ks) => _Option_unwrapOr(`_${show(i)}`, _Array_get(i, ks)),
  );
const patternKeyAt: _Curry<[ctorKeys: Map<string, string[]>, ctor: string, i: number], string> =
  _curry(3, patternKeyAt$);
const keyedSlot$ = (key: string, sub: string): string => (eq(sub, key) ? key : `${key}: ${sub}`);
const keyedSlot: _Curry<[key: string, sub: string], string> = _curry(2, keyedSlot$);
const pctorEntries$ = (
  ctorKeys: Map<string, string[]>,
  ctor: string,
  args: Pattern[],
  i: number,
): string[] =>
  _Option_match(
    _Array_get(i, args),
    () => [] as string[],
    (a) => {
      const s: string = patSlot$(ctorKeys, a);
      const restEntries: string[] = pctorEntries$(ctorKeys, ctor, args, i + 1);
      return s === ""
        ? restEntries
        : _Array_prepend(keyedSlot$(patternKeyAt$(ctorKeys, ctor, i), s), restEntries);
    },
  );
const pctorEntries: _Curry<
  [ctorKeys: Map<string, string[]>, ctor: string, args: Pattern[], i: number],
  string[]
> = _curry(4, pctorEntries$);
const precordEntries$ = (
  ctorKeys: Map<string, string[]>,
  fields: PatField[],
  i: number,
): string[] =>
  _Option_match(
    _Array_get(i, fields),
    () => [] as string[],
    (f) => {
      const s: string = patSlot$(ctorKeys, f.pat);
      const restEntries: string[] = precordEntries$(ctorKeys, fields, i + 1);
      return s === "" ? restEntries : _Array_prepend(keyedSlot$(f.label, s), restEntries);
    },
  );
const precordEntries: _Curry<
  [ctorKeys: Map<string, string[]>, fields: PatField[], i: number],
  string[]
> = _curry(3, precordEntries$);
const patSlot$ = (ctorKeys: Map<string, string[]>, p: Pattern): string => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat, name } = $match;
      const inner: string = patSlot$(ctorKeys, pat);
      return inner === "" ? name : `${inner}, ${name}`;
    }
    case "PBind": {
      const { name } = $match;
      return name;
    }
    case "PWild": {
      return "";
    }
    case "PUnit": {
      return "";
    }
    case "PLit": {
      return "";
    }
    case "PBool": {
      return "";
    }
    case "PStr": {
      return "";
    }
    case "PList": {
      return "";
    }
    case "PCtor": {
      const { ctor, args } = $match;
      const entries: string[] = pctorEntries$(ctorKeys, ctor, args, 0);
      return length(entries) === 0 ? "" : `{ ${_Str_join(", ", entries)} }`;
    }
    case "PRecord": {
      const { fields } = $match;
      const entries: string[] = precordEntries$(ctorKeys, fields, 0);
      return length(entries) === 0 ? "" : `{ ${_Str_join(", ", entries)} }`;
    }
    case "PTuple": {
      const { elems } = $match;
      const slots: string[] = map((el: Pattern) => patSlot$(ctorKeys, el), elems);
      return someOf((s: string) => s !== "", slots) ? `[${_Str_join(", ", slots)}]` : "";
    }
    case "PArr": {
      const { elems, rest } = $match;
      const slots: string[] = map((el: Pattern) => patSlot$(ctorKeys, el), elems);
      const slots2: string[] = ((_v) =>
        _v._tag === "Some" && _v.value._tag === "PBind"
          ? (({ value: { name } }) => _Array_append(`...${name}`, slots))(
              _v as Extract<Option<Pattern>, { _tag: "Some" }> & {
                value: Extract<
                  Extract<Option<Pattern>, { _tag: "Some" }>["value"],
                  { _tag: "PBind" }
                >;
              },
            )
          : slots)(rest);
      return someOf((s: string) => s !== "", slots2) ? `[${_Str_join(", ", slots2)}]` : "";
    }
    case "POr": {
      const { alts } = $match;
      return _Option_match(
        _Array_head(alts),
        () => "",
        (first) => patSlot$(ctorKeys, first),
      );
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
export const patSlot: _Curry<[ctorKeys: Map<string, string[]>, p: Pattern], string> = _curry(
  2,
  patSlot$,
);
const pctorConds$ = (
  ctorKeys: Map<string, string[]>,
  ctor: string,
  args: Pattern[],
  i: number,
  path: string,
): string[] =>
  _Option_match(
    _Array_get(i, args),
    () => [] as string[],
    (a) =>
      _Array_concat(
        patConds$(ctorKeys, a, `${path}.${patternKeyAt$(ctorKeys, ctor, i)}`),
        pctorConds$(ctorKeys, ctor, args, i + 1, path),
      ),
  );
const pctorConds: _Curry<
  [ctorKeys: Map<string, string[]>, ctor: string, args: Pattern[], i: number, path: string],
  string[]
> = _curry(5, pctorConds$);
const precordConds$ = (
  ctorKeys: Map<string, string[]>,
  fields: PatField[],
  i: number,
  path: string,
): string[] =>
  _Option_match(
    _Array_get(i, fields),
    () => [] as string[],
    (f) =>
      _Array_concat(
        patConds$(ctorKeys, f.pat, `${path}.${f.label}`),
        precordConds$(ctorKeys, fields, i + 1, path),
      ),
  );
const precordConds: _Curry<
  [ctorKeys: Map<string, string[]>, fields: PatField[], i: number, path: string],
  string[]
> = _curry(4, precordConds$);
const ptupleConds$ = (
  ctorKeys: Map<string, string[]>,
  elems: Pattern[],
  i: number,
  path: string,
): string[] =>
  _Option_match(
    _Array_get(i, elems),
    () => [] as string[],
    (el) =>
      _Array_concat(
        patConds$(ctorKeys, el, `${path}[${show(i)}]`),
        ptupleConds$(ctorKeys, elems, i + 1, path),
      ),
  );
const ptupleConds: _Curry<
  [ctorKeys: Map<string, string[]>, elems: Pattern[], i: number, path: string],
  string[]
> = _curry(4, ptupleConds$);
const parrConds$ = (
  ctorKeys: Map<string, string[]>,
  elems: Pattern[],
  i: number,
  path: string,
): string[] =>
  _Option_match(
    _Array_get(i, elems),
    () => [] as string[],
    (el) =>
      _Array_concat(
        patConds$(ctorKeys, el, `${path}[${show(i)}]`),
        parrConds$(ctorKeys, elems, i + 1, path),
      ),
  );
const parrConds: _Curry<
  [ctorKeys: Map<string, string[]>, elems: Pattern[], i: number, path: string],
  string[]
> = _curry(4, parrConds$);
const patConds$ = (ctorKeys: Map<string, string[]>, p: Pattern, path: string): string[] => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat } = $match;
      return patConds$(ctorKeys, pat, path);
    }
    case "PWild": {
      return [] as string[];
    }
    case "PUnit": {
      return [] as string[];
    }
    case "PBind": {
      return [] as string[];
    }
    case "PList": {
      return [] as string[];
    }
    case "PLit": {
      return [`${path} === ${litValue(p)}`];
    }
    case "PBool": {
      return [`${path} === ${litValue(p)}`];
    }
    case "PStr": {
      return [`${path} === ${litValue(p)}`];
    }
    case "PCtor": {
      const { ctor, args } = $match;
      return _Array_prepend(
        `${path}._tag === ${jsStringLit(ctor)}`,
        pctorConds$(ctorKeys, ctor, args, 0, path),
      );
    }
    case "PRecord": {
      const { fields } = $match;
      return precordConds$(ctorKeys, fields, 0, path);
    }
    case "PTuple": {
      const { elems } = $match;
      return ptupleConds$(ctorKeys, elems, 0, path);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return _Array_prepend(
        `${path}.length ${_Option_isSome(rest) ? ">=" : "==="} ${show(length(elems))}`,
        parrConds$(ctorKeys, elems, 0, path),
      );
    }
    case "POr": {
      const { alts } = $match;
      const altCond: (a: Pattern) => string = (alt: Pattern) => {
        const conds: string[] = patConds$(ctorKeys, alt, path);
        return length(conds) === 0
          ? "true"
          : _Str_join(
              " && ",
              map((c: string) => `(${c})`, conds),
            );
      };
      return [
        _Str_join(
          " || ",
          map((alt: Pattern) => `(${altCond(alt)})`, alts),
        ),
      ];
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
export const patConds: _Curry<
  [ctorKeys: Map<string, string[]>, p: Pattern, path: string],
  string[]
> = _curry(3, patConds$);
const fieldRefine$ = (
  ctorKeys: Map<string, string[]>,
  p: Pattern,
  fieldBase: string,
): Option<string> => {
  const $match = p;
  switch ($match._tag) {
    case "PCtor": {
      return Some(patTarget$(ctorKeys, p, fieldBase)) as Option<string>;
    }
    case "PRecord": {
      const t: string = patTarget$(ctorKeys, p, fieldBase);
      return eq(t, fieldBase) ? (None as Option<string>) : (Some(t) as Option<string>);
    }
    case "PTuple": {
      const t: string = patTarget$(ctorKeys, p, fieldBase);
      return eq(t, fieldBase) ? (None as Option<string>) : (Some(t) as Option<string>);
    }
    case "PArr": {
      const t: string = patTarget$(ctorKeys, p, fieldBase);
      return eq(t, fieldBase) ? (None as Option<string>) : (Some(t) as Option<string>);
    }
    default: {
      return None as Option<string>;
    }
  }
};
/**
 * A field's refined type when its sub-pattern narrows it, else `None` — a
 * bind/wildcard/literal needs no narrowing and keeps its declared type.
 * Tuple and array sub-patterns recurse: a ctor under `[Call(f, [g], _, _)]`
 * is two slots down, and without this the predicate stopped at the top level
 * while the handler destructured all the way (TS2339 on the inner field).
 */
const fieldRefine: _Curry<
  [ctorKeys: Map<string, string[]>, p: Pattern, fieldBase: string],
  Option<string>
> = _curry(3, fieldRefine$);
const ctorRefines$ = (
  ctorKeys: Map<string, string[]>,
  args: Pattern[],
  keys: string[],
  member: string,
  i: number,
): string[] =>
  _Option_match(
    _Array_get(i, args),
    () => [] as string[],
    (a) => {
      const rest: string[] = ctorRefines$(ctorKeys, args, keys, member, i + 1);
      const key: string = _Option_unwrapOr(`_${show(i)}`, _Array_get(i, keys));
      return _Option_match(
        fieldRefine$(ctorKeys, a, `${member}[${jsStringLit(key)}]`),
        () => rest,
        (sub) => _Array_prepend(`${jsStringLit(key)}: ${sub}`, rest),
      );
    },
  );
const ctorRefines: _Curry<
  [ctorKeys: Map<string, string[]>, args: Pattern[], keys: string[], member: string, i: number],
  string[]
> = _curry(5, ctorRefines$);
const recordRefines$ = (
  ctorKeys: Map<string, string[]>,
  fields: PatField[],
  base: string,
  i: number,
): string[] =>
  _Option_match(
    _Array_get(i, fields),
    () => [] as string[],
    (f) => {
      const rest: string[] = recordRefines$(ctorKeys, fields, base, i + 1);
      return _Option_match(
        fieldRefine$(ctorKeys, f.pat, `${base}[${jsStringLit(f.label)}]`),
        () => rest,
        (sub) => _Array_prepend(`${jsStringLit(f.label)}: ${sub}`, rest),
      );
    },
  );
const recordRefines: _Curry<
  [ctorKeys: Map<string, string[]>, fields: PatField[], base: string, i: number],
  string[]
> = _curry(4, recordRefines$);
/**
 * A tuple slot is indexed positionally, so each element has its own base.
 */
const tupleSlotBase: <A>(base: string, i: A) => string = _curry(
  2,
  <A>(base: string, i: A) => `(${base})[${show(i)}]`,
);
const tupleTargets$ = (
  ctorKeys: Map<string, string[]>,
  elems: Pattern[],
  base: string,
  i: number,
): string[] =>
  _Option_match(
    _Array_get(i, elems),
    () => [] as string[],
    (el) => {
      const slotBase: string = tupleSlotBase(base, i);
      return _Array_prepend(
        _Option_unwrapOr(slotBase, fieldRefine$(ctorKeys, el, slotBase)),
        tupleTargets$(ctorKeys, elems, base, i + 1),
      );
    },
  );
const tupleTargets: _Curry<
  [ctorKeys: Map<string, string[]>, elems: Pattern[], base: string, i: number],
  string[]
> = _curry(4, tupleTargets$);
const tupleRefines$ = (
  ctorKeys: Map<string, string[]>,
  elems: Pattern[],
  base: string,
  i: number,
): boolean =>
  _Option_match(
    _Array_get(i, elems),
    () => false,
    (el) =>
      or(
        _Option_isSome(fieldRefine$(ctorKeys, el, tupleSlotBase(base, i))),
        tupleRefines$(ctorKeys, elems, base, i + 1),
      ),
  );
const tupleRefines: _Curry<
  [ctorKeys: Map<string, string[]>, elems: Pattern[], base: string, i: number],
  boolean
> = _curry(4, tupleRefines$);
const arrTargets$ = (
  ctorKeys: Map<string, string[]>,
  elems: Pattern[],
  elemBase: string,
  i: number,
): string[] =>
  _Option_match(
    _Array_get(i, elems),
    () => [] as string[],
    (el) =>
      _Array_prepend(
        _Option_unwrapOr(elemBase, fieldRefine$(ctorKeys, el, elemBase)),
        arrTargets$(ctorKeys, elems, elemBase, i + 1),
      ),
  );
/**
 * Array elements all share one element base (`T[number]`).
 */
const arrTargets: _Curry<
  [ctorKeys: Map<string, string[]>, elems: Pattern[], elemBase: string, i: number],
  string[]
> = _curry(4, arrTargets$);
const arrRefines$ = (
  ctorKeys: Map<string, string[]>,
  elems: Pattern[],
  elemBase: string,
  i: number,
): boolean =>
  _Option_match(
    _Array_get(i, elems),
    () => false,
    (el) =>
      or(
        _Option_isSome(fieldRefine$(ctorKeys, el, elemBase)),
        arrRefines$(ctorKeys, elems, elemBase, i + 1),
      ),
  );
const arrRefines: _Curry<
  [ctorKeys: Map<string, string[]>, elems: Pattern[], elemBase: string, i: number],
  boolean
> = _curry(4, arrRefines$);
const patTarget$ = (ctorKeys: Map<string, string[]>, p: Pattern, base: string): string => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat } = $match;
      return patTarget$(ctorKeys, pat, base);
    }
    case "PCtor": {
      const { ctor, args } = $match;
      const member: string = `Extract<${base}, { _tag: ${jsStringLit(ctor)} }>`;
      const keys: string[] = _Option_unwrapOr([] as string[], _Map_get(ctor, ctorKeys));
      const refines: string[] = ctorRefines$(ctorKeys, args, keys, member, 0);
      return length(refines) === 0 ? member : `${member} & { ${_Str_join("; ", refines)} }`;
    }
    case "PRecord": {
      const { fields } = $match;
      const refines: string[] = recordRefines$(ctorKeys, fields, base, 0);
      return length(refines) === 0 ? base : `${base} & { ${_Str_join("; ", refines)} }`;
    }
    case "PTuple": {
      const { elems } = $match;
      return !tupleRefines$(ctorKeys, elems, base, 0)
        ? base
        : `[${_Str_join(", ", tupleTargets$(ctorKeys, elems, base, 0))}]`;
    }
    case "PArr": {
      const { elems, rest: restOpt } = $match;
      const elemBase: string = `(${base})[number]`;
      return !arrRefines$(ctorKeys, elems, elemBase, 0)
        ? base
        : ((heads: string) =>
            _Option_match(
              restOpt,
              () => `[${heads}]`,
              () => `[${heads}, ...${base}]`,
            ))(_Str_join(", ", arrTargets$(ctorKeys, elems, elemBase, 0)));
    }
    default: {
      return base;
    }
  }
};
/**
 * Refine `base` by everything the pattern structurally tests. An or-pattern
 * keeps the base — per-alternative narrowing would need a union target.
 */
export const patTarget: _Curry<
  [ctorKeys: Map<string, string[]>, p: Pattern, base: string],
  string
> = _curry(3, patTarget$);
