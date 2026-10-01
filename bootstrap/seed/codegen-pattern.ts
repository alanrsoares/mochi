import type { PatField, Pattern } from "./ast";

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

import * as Ast from "./ast";
import { jsStringLit, litValue } from "./codegen-literals";
const someOfFrom: <A>(f: (a: A) => boolean, xs: A[], i: number) => boolean = _curry(
  3,
  <A>(f: (a: A) => boolean, xs: A[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? false
        : _v._tag === "Some"
          ? (({ value: x }) => (f(x) ? true : someOfFrom(f, xs, i + 1)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, xs)),
);
const someOf: <A>(f: (a: A) => boolean, xs: A[]) => boolean = _curry(
  2,
  <A>(f: (a: A) => boolean, xs: A[]) => someOfFrom(f, xs, 0),
);
const patternKeyAt: _Curry<[ctorKeys: Map<string, string[]>, ctor: string, i: number], string> =
  _curry(3, (ctorKeys: Map<string, string[]>, ctor: string, i: number) =>
    ((_v) =>
      _v._tag === "Some"
        ? (({ value: ks }) => _Option_unwrapOr(`_${show(i)}`, _Array_get(i, ks)))(_v)
        : _v._tag === "None"
          ? `_${show(i)}`
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Map_get(ctor, ctorKeys)),
  );
const keyedSlot: _Curry<[key: string, sub: string], string> = _curry(
  2,
  (key: string, sub: string) => (eq(sub, key) ? key : `${key}: ${sub}`),
);
const pctorEntries: _Curry<
  [ctorKeys: Map<string, string[]>, ctor: string, args: Pattern[], i: number],
  string[]
> = _curry(4, (ctorKeys: Map<string, string[]>, ctor: string, args: Pattern[], i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some"
        ? (({ value: a }) =>
            ((s: string) =>
              ((restEntries: string[]) =>
                s === ""
                  ? restEntries
                  : _Array_prepend(keyedSlot(patternKeyAt(ctorKeys, ctor, i), s), restEntries))(
                pctorEntries(ctorKeys, ctor, args, i + 1),
              ))(patSlot(ctorKeys, a)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, args)),
);
const precordEntries: _Curry<
  [ctorKeys: Map<string, string[]>, fields: PatField[], i: number],
  string[]
> = _curry(3, (ctorKeys: Map<string, string[]>, fields: PatField[], i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some"
        ? (({ value: f }) =>
            ((s: string) =>
              ((restEntries: string[]) =>
                s === "" ? restEntries : _Array_prepend(keyedSlot(f.label, s), restEntries))(
                precordEntries(ctorKeys, fields, i + 1),
              ))(patSlot(ctorKeys, f.pat)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, fields)),
);
export const patSlot: _Curry<[ctorKeys: Map<string, string[]>, p: Pattern], string> = _curry(
  2,
  (ctorKeys: Map<string, string[]>, p: Pattern) =>
    ((_v) =>
      _v._tag === "PAs"
        ? (({ pat, name }) =>
            ((inner: string) => (inner === "" ? name : `${inner}, ${name}`))(
              patSlot(ctorKeys, pat),
            ))(_v)
        : _v._tag === "PBind"
          ? (({ name }) => name)(_v)
          : _v._tag === "PWild"
            ? ""
            : _v._tag === "PUnit"
              ? ""
              : _v._tag === "PLit"
                ? ""
                : _v._tag === "PBool"
                  ? ""
                  : _v._tag === "PStr"
                    ? ""
                    : _v._tag === "PList"
                      ? ""
                      : _v._tag === "PCtor"
                        ? (({ ctor, args }) =>
                            ((entries: string[]) =>
                              length(entries) === 0 ? "" : `{ ${_Str_join(", ", entries)} }`)(
                              pctorEntries(ctorKeys, ctor, args, 0),
                            ))(_v)
                        : _v._tag === "PRecord"
                          ? (({ fields }) =>
                              ((entries: string[]) =>
                                length(entries) === 0 ? "" : `{ ${_Str_join(", ", entries)} }`)(
                                precordEntries(ctorKeys, fields, 0),
                              ))(_v)
                          : _v._tag === "PTuple"
                            ? (({ elems }) =>
                                ((slots: string[]) =>
                                  someOf((s: string) => s !== "", slots)
                                    ? `[${_Str_join(", ", slots)}]`
                                    : "")(map((el: Pattern) => patSlot(ctorKeys, el), elems)))(_v)
                            : _v._tag === "PArr"
                              ? (({ elems, rest }) =>
                                  ((slots: string[]) =>
                                    ((slots2: string[]) =>
                                      someOf((s: string) => s !== "", slots2)
                                        ? `[${_Str_join(", ", slots2)}]`
                                        : "")(
                                      ((_v) =>
                                        _v._tag === "Some" && _v.value._tag === "PBind"
                                          ? (({ value: { name } }) =>
                                              _Array_append(`...${name}`, slots))(
                                              _v as Extract<Option<Pattern>, { _tag: "Some" }> & {
                                                value: Extract<
                                                  Extract<
                                                    Option<Pattern>,
                                                    { _tag: "Some" }
                                                  >["value"],
                                                  { _tag: "PBind" }
                                                >;
                                              },
                                            )
                                          : slots)(rest),
                                    ))(map((el: Pattern) => patSlot(ctorKeys, el), elems)))(_v)
                              : _v._tag === "POr"
                                ? (({ alts }) =>
                                    ((_v) =>
                                      _v._tag === "Some"
                                        ? (({ value: first }) => patSlot(ctorKeys, first))(_v)
                                        : _v._tag === "None"
                                          ? ""
                                          : (() => {
                                              throw new Error("non-exhaustive match");
                                            })())(_Array_head(alts)))(_v)
                                : (() => {
                                    throw new Error("non-exhaustive match");
                                  })())(p),
);
const pctorConds: _Curry<
  [ctorKeys: Map<string, string[]>, ctor: string, args: Pattern[], i: number, path: string],
  string[]
> = _curry(
  5,
  (ctorKeys: Map<string, string[]>, ctor: string, args: Pattern[], i: number, path: string) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: a }) =>
              _Array_concat(
                patConds(ctorKeys, a, `${path}.${patternKeyAt(ctorKeys, ctor, i)}`),
                pctorConds(ctorKeys, ctor, args, i + 1, path),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, args)),
);
const precordConds: _Curry<
  [ctorKeys: Map<string, string[]>, fields: PatField[], i: number, path: string],
  string[]
> = _curry(4, (ctorKeys: Map<string, string[]>, fields: PatField[], i: number, path: string) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some"
        ? (({ value: f }) =>
            _Array_concat(
              patConds(ctorKeys, f.pat, `${path}.${f.label}`),
              precordConds(ctorKeys, fields, i + 1, path),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, fields)),
);
const ptupleConds: _Curry<
  [ctorKeys: Map<string, string[]>, elems: Pattern[], i: number, path: string],
  string[]
> = _curry(4, (ctorKeys: Map<string, string[]>, elems: Pattern[], i: number, path: string) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some"
        ? (({ value: el }) =>
            _Array_concat(
              patConds(ctorKeys, el, `${path}[${show(i)}]`),
              ptupleConds(ctorKeys, elems, i + 1, path),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, elems)),
);
const parrConds: _Curry<
  [ctorKeys: Map<string, string[]>, elems: Pattern[], i: number, path: string],
  string[]
> = _curry(4, (ctorKeys: Map<string, string[]>, elems: Pattern[], i: number, path: string) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some"
        ? (({ value: el }) =>
            _Array_concat(
              patConds(ctorKeys, el, `${path}[${show(i)}]`),
              parrConds(ctorKeys, elems, i + 1, path),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, elems)),
);
export const patConds: _Curry<
  [ctorKeys: Map<string, string[]>, p: Pattern, path: string],
  string[]
> = _curry(3, (ctorKeys: Map<string, string[]>, p: Pattern, path: string) =>
  ((_v) =>
    _v._tag === "PAs"
      ? (({ pat }) => patConds(ctorKeys, pat, path))(_v)
      : _v._tag === "PWild"
        ? ([] as string[])
        : _v._tag === "PUnit"
          ? ([] as string[])
          : _v._tag === "PBind"
            ? ([] as string[])
            : _v._tag === "PList"
              ? ([] as string[])
              : _v._tag === "PLit"
                ? [`${path} === ${litValue(p)}`]
                : _v._tag === "PBool"
                  ? [`${path} === ${litValue(p)}`]
                  : _v._tag === "PStr"
                    ? [`${path} === ${litValue(p)}`]
                    : _v._tag === "PCtor"
                      ? (({ ctor, args }) =>
                          _Array_prepend(
                            `${path}._tag === ${jsStringLit(ctor)}`,
                            pctorConds(ctorKeys, ctor, args, 0, path),
                          ))(_v)
                      : _v._tag === "PRecord"
                        ? (({ fields }) => precordConds(ctorKeys, fields, 0, path))(_v)
                        : _v._tag === "PTuple"
                          ? (({ elems }) => ptupleConds(ctorKeys, elems, 0, path))(_v)
                          : _v._tag === "PArr"
                            ? (({ elems, rest }) =>
                                _Array_prepend(
                                  `${path}.length ${_Option_isSome(rest) ? ">=" : "==="} ${show(length(elems))}`,
                                  parrConds(ctorKeys, elems, 0, path),
                                ))(_v)
                            : _v._tag === "POr"
                              ? (({ alts }) =>
                                  ((altCond: (a: Pattern) => string) => [
                                    _Str_join(
                                      " || ",
                                      map((alt: Pattern) => `(${altCond(alt)})`, alts),
                                    ),
                                  ])((alt: Pattern) => {
                                    const conds: string[] = patConds(ctorKeys, alt, path);
                                    return length(conds) === 0
                                      ? "true"
                                      : _Str_join(
                                          " && ",
                                          map((c: string) => `(${c})`, conds),
                                        );
                                  }))(_v)
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(p),
);
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
> = _curry(3, (ctorKeys: Map<string, string[]>, p: Pattern, fieldBase: string) =>
  ((_v) =>
    _v._tag === "PCtor"
      ? (Some(patTarget(ctorKeys, p, fieldBase)) as Option<string>)
      : _v._tag === "PRecord"
        ? ((t: string) =>
            eq(t, fieldBase) ? (None as Option<string>) : (Some(t) as Option<string>))(
            patTarget(ctorKeys, p, fieldBase),
          )
        : _v._tag === "PTuple"
          ? ((t: string) =>
              eq(t, fieldBase) ? (None as Option<string>) : (Some(t) as Option<string>))(
              patTarget(ctorKeys, p, fieldBase),
            )
          : _v._tag === "PArr"
            ? ((t: string) =>
                eq(t, fieldBase) ? (None as Option<string>) : (Some(t) as Option<string>))(
                patTarget(ctorKeys, p, fieldBase),
              )
            : (None as Option<string>))(p),
);
const ctorRefines: _Curry<
  [ctorKeys: Map<string, string[]>, args: Pattern[], keys: string[], member: string, i: number],
  string[]
> = _curry(
  5,
  (ctorKeys: Map<string, string[]>, args: Pattern[], keys: string[], member: string, i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: a }) =>
              ((rest: string[]) =>
                ((key: string) =>
                  ((_v) =>
                    _v._tag === "Some"
                      ? (({ value: sub }) => _Array_prepend(`${jsStringLit(key)}: ${sub}`, rest))(
                          _v,
                        )
                      : _v._tag === "None"
                        ? rest
                        : (() => {
                            throw new Error("non-exhaustive match");
                          })())(fieldRefine(ctorKeys, a, `${member}[${jsStringLit(key)}]`)))(
                  _Option_unwrapOr(`_${show(i)}`, _Array_get(i, keys)),
                ))(ctorRefines(ctorKeys, args, keys, member, i + 1)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, args)),
);
const recordRefines: _Curry<
  [ctorKeys: Map<string, string[]>, fields: PatField[], base: string, i: number],
  string[]
> = _curry(4, (ctorKeys: Map<string, string[]>, fields: PatField[], base: string, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some"
        ? (({ value: f }) =>
            ((rest: string[]) =>
              ((_v) =>
                _v._tag === "Some"
                  ? (({ value: sub }) => _Array_prepend(`${jsStringLit(f.label)}: ${sub}`, rest))(
                      _v,
                    )
                  : _v._tag === "None"
                    ? rest
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(fieldRefine(ctorKeys, f.pat, `${base}[${jsStringLit(f.label)}]`)))(
              recordRefines(ctorKeys, fields, base, i + 1),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, fields)),
);
/**
 * A tuple slot is indexed positionally, so each element has its own base.
 */
const tupleSlotBase: <A>(base: string, i: A) => string = _curry(
  2,
  <A>(base: string, i: A) => `(${base})[${show(i)}]`,
);
const tupleTargets: _Curry<
  [ctorKeys: Map<string, string[]>, elems: Pattern[], base: string, i: number],
  string[]
> = _curry(4, (ctorKeys: Map<string, string[]>, elems: Pattern[], base: string, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some"
        ? (({ value: el }) =>
            ((slotBase: string) =>
              _Array_prepend(
                _Option_unwrapOr(slotBase, fieldRefine(ctorKeys, el, slotBase)),
                tupleTargets(ctorKeys, elems, base, i + 1),
              ))(tupleSlotBase(base, i)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, elems)),
);
const tupleRefines: _Curry<
  [ctorKeys: Map<string, string[]>, elems: Pattern[], base: string, i: number],
  boolean
> = _curry(4, (ctorKeys: Map<string, string[]>, elems: Pattern[], base: string, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? false
      : _v._tag === "Some"
        ? (({ value: el }) =>
            or(
              _Option_isSome(fieldRefine(ctorKeys, el, tupleSlotBase(base, i))),
              tupleRefines(ctorKeys, elems, base, i + 1),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, elems)),
);
/**
 * Array elements all share one element base (`T[number]`).
 */
const arrTargets: _Curry<
  [ctorKeys: Map<string, string[]>, elems: Pattern[], elemBase: string, i: number],
  string[]
> = _curry(4, (ctorKeys: Map<string, string[]>, elems: Pattern[], elemBase: string, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some"
        ? (({ value: el }) =>
            _Array_prepend(
              _Option_unwrapOr(elemBase, fieldRefine(ctorKeys, el, elemBase)),
              arrTargets(ctorKeys, elems, elemBase, i + 1),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, elems)),
);
const arrRefines: _Curry<
  [ctorKeys: Map<string, string[]>, elems: Pattern[], elemBase: string, i: number],
  boolean
> = _curry(4, (ctorKeys: Map<string, string[]>, elems: Pattern[], elemBase: string, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? false
      : _v._tag === "Some"
        ? (({ value: el }) =>
            or(
              _Option_isSome(fieldRefine(ctorKeys, el, elemBase)),
              arrRefines(ctorKeys, elems, elemBase, i + 1),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, elems)),
);
/**
 * Refine `base` by everything the pattern structurally tests. An or-pattern
 * keeps the base — per-alternative narrowing would need a union target.
 */
export const patTarget: _Curry<
  [ctorKeys: Map<string, string[]>, p: Pattern, base: string],
  string
> = _curry(3, (ctorKeys: Map<string, string[]>, p: Pattern, base: string) =>
  ((_v) =>
    _v._tag === "PAs"
      ? (({ pat }) => patTarget(ctorKeys, pat, base))(_v)
      : _v._tag === "PCtor"
        ? (({ ctor, args }) =>
            ((member: string) =>
              ((keys: string[]) =>
                ((refines: string[]) =>
                  length(refines) === 0 ? member : `${member} & { ${_Str_join("; ", refines)} }`)(
                  ctorRefines(ctorKeys, args, keys, member, 0),
                ))(_Option_unwrapOr([] as string[], _Map_get(ctor, ctorKeys))))(
              `Extract<${base}, { _tag: ${jsStringLit(ctor)} }>`,
            ))(_v)
        : _v._tag === "PRecord"
          ? (({ fields }) =>
              ((refines: string[]) =>
                length(refines) === 0 ? base : `${base} & { ${_Str_join("; ", refines)} }`)(
                recordRefines(ctorKeys, fields, base, 0),
              ))(_v)
          : _v._tag === "PTuple"
            ? (({ elems }) =>
                !tupleRefines(ctorKeys, elems, base, 0)
                  ? base
                  : `[${_Str_join(", ", tupleTargets(ctorKeys, elems, base, 0))}]`)(_v)
            : _v._tag === "PArr"
              ? (({ elems, rest: restOpt }) =>
                  ((elemBase: string) =>
                    !arrRefines(ctorKeys, elems, elemBase, 0)
                      ? base
                      : ((heads: string) =>
                          ((_v) =>
                            _v._tag === "Some"
                              ? `[${heads}, ...${base}]`
                              : _v._tag === "None"
                                ? `[${heads}]`
                                : (() => {
                                    throw new Error("non-exhaustive match");
                                  })())(restOpt))(
                          _Str_join(", ", arrTargets(ctorKeys, elems, elemBase, 0)),
                        ))(`(${base})[number]`))(_v)
              : base)(p),
);
