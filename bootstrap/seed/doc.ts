/**
 * `DLine` is a space when its group prints flat and a newline+indent when it
 * breaks; `soft` prints nothing when flat; `hard` always breaks. `DGroup` asks
 * "does the flat rendering fit the rest of this line?" and picks a mode.
 * `DBreakParent` is zero-width but forces every enclosing group to break — used
 * after a trailing `//` comment so what follows lands on a fresh line (else it
 * would be commented out) without emitting a newline of its own.
 */
export type Doc =
  | { _tag: "DText"; s: string }
  | { _tag: "DVerbatim"; s: string }
  | { _tag: "DLine"; hard: boolean; soft: boolean }
  | { _tag: "DCat"; parts: Doc[] }
  | { _tag: "DIndent"; doc: Doc }
  | { _tag: "DGroup"; doc: Doc; breaks: boolean }
  | { _tag: "DLineSuffix"; doc: Doc }
  | { _tag: "DBreakParent" };
export type Item = { i: number; m: string; d: Doc };
export type Work = { _tag: "WNil" } | { _tag: "WCons"; head: Item; tail: Work };

import type { Option, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Array_get,
  _Option_unwrapOr,
  _Str_length,
  _Str_split,
  _curry,
  _done,
  _recur,
  and,
  length,
  or,
  sub,
} from "@mochi/compiler/runtime";

export const DText = (s: string): Doc => ({ _tag: "DText", s });
export const DVerbatim = (s: string): Doc => ({ _tag: "DVerbatim", s });
export const DLine = _curry(2, (hard, soft) => ({ _tag: "DLine", hard, soft })) as (
  hard: boolean,
  soft: boolean,
) => Doc;
export const DCat = (parts: Doc[]): Doc => ({ _tag: "DCat", parts });
export const DIndent = (doc: Doc): Doc => ({ _tag: "DIndent", doc });
export const DGroup = _curry(2, (doc, breaks) => ({ _tag: "DGroup", doc, breaks })) as (
  doc: Doc,
  breaks: boolean,
) => Doc;
export const DLineSuffix = (doc: Doc): Doc => ({ _tag: "DLineSuffix", doc });
export const DBreakParent: Doc = { _tag: "DBreakParent" };
const INDENT: number = 2;
export const txt: (s: string) => Doc = (s: string) => DText(s);
export const verbatim: (s: string) => Doc = (s: string) => DVerbatim(s);
export const cat: (parts: Doc[]) => Doc = (parts: Doc[]) => DCat(parts);
export const line = DLine(false, false);
export const softline = DLine(false, true);
export const hardline = DLine(true, false);
export const breakParent = DBreakParent as Doc;
export const indent: (doc: Doc) => Doc = (doc: Doc) => DIndent(doc);
export const group: (doc: Doc) => Doc = (doc: Doc) => DGroup(doc, forcesBreak(doc));
export const lineSuffix: (doc: Doc) => Doc = (doc: Doc) => DLineSuffix(doc);
const joinFrom: <A>(sep: A, parts: A[], i: number, acc: A[]) => A[] = _curry(
  4,
  <A>(sep: A, parts: A[], i: number, acc: A[]) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some"
          ? (({ value: p }) =>
              joinFrom(
                sep,
                parts,
                i + 1,
                i === 0 ? _Array_append(p, acc) : _Array_append(p, _Array_append(sep, acc)),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, parts)),
);
export const join: _Curry<[sep: Doc, parts: Doc[]], Doc> = _curry(2, (sep: Doc, parts: Doc[]) =>
  DCat(joinFrom(sep, parts, 0, [] as Doc[])),
);

const WNil: Work = { _tag: "WNil" };
const WCons = _curry(2, (head, tail) => ({ _tag: "WCons", head, tail })) as (
  head: Item,
  tail: Work,
) => Work;
/**
 * Prepend a cat's parts so `parts[0]` ends up at the head, processed first.
 */
const consParts: _Curry<[parts: Doc[], i: number, m: string, tail: Work], Work> = _curry(
  4,
  (parts: Doc[], i: number, m: string, tail: Work) => {
    let k: number = length(parts) - 1;
    let w: Work = tail;
    while (true) {
      if (k < 0) {
        return w;
      } else {
        const _step = ((_v) =>
          _v._tag === "None"
            ? _done(w)
            : _v._tag === "Some"
              ? (({ value: d }) => _recur(k - 1, WCons({ i: i, m: m, d: d }, w)))(_v)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(_Array_get(k, parts));
        if (_step._tag === "recur") {
          [k, w] = _step.args;
          continue;
        }
        return _step.value;
      }
    }
  },
);
/**
 * Would the documents on `work` (head-first, groups forced flat) stay within
 * `width` columns before the line ends? A break-mode line or a hardline ends
 * the line, so success is reported there.
 */
const fits: _Curry<[width: number, start: Work], boolean> = _curry(
  2,
  (width: number, start: Work) => {
    let rem: number = width;
    let work: Work = start;
    while (true) {
      if (rem < 0) {
        return false;
      } else {
        const _step = ((_v) =>
          _v._tag === "WNil"
            ? _done(true)
            : _v._tag === "WCons"
              ? (({ head: { i, m, d }, tail }) =>
                  ((_v) =>
                    _v._tag === "DText"
                      ? (({ s }) => _recur(rem - _Str_length(s), tail))(_v)
                      : _v._tag === "DVerbatim"
                        ? _done(true)
                        : _v._tag === "DCat"
                          ? (({ parts }) => _recur(rem, consParts(parts, i, m, tail)))(_v)
                          : _v._tag === "DIndent"
                            ? (({ doc: inner }) =>
                                _recur(rem, WCons({ i: i + INDENT, m: m, d: inner }, tail)))(_v)
                            : _v._tag === "DGroup"
                              ? (({ doc: inner }) =>
                                  _recur(rem, WCons({ i: i, m: "flat", d: inner }, tail)))(_v)
                              : _v._tag === "DLine"
                                ? (({ hard, soft }) =>
                                    or(hard, m === "break")
                                      ? _done(true)
                                      : _recur(rem - (soft ? 0 : 1), tail))(_v)
                                : _v._tag === "DLineSuffix"
                                  ? (({ doc: inner }) =>
                                      _recur(rem, WCons({ i: i, m: m, d: inner }, tail)))(_v)
                                  : _v._tag === "DBreakParent"
                                    ? _recur(rem, tail)
                                    : (() => {
                                        throw new Error("non-exhaustive match");
                                      })())(d))(_v as Extract<Work, { _tag: "WCons" }>)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(work);
        if (_step._tag === "recur") {
          [rem, work] = _step.args;
          continue;
        }
        return _step.value;
      }
    }
  },
);
const anyForcesBreak: _Curry<[parts: Doc[], i: number], boolean> = _curry(
  2,
  (parts: Doc[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? false
        : _v._tag === "Some"
          ? (({ value: p }) => or(forcesBreak(p), anyForcesBreak(parts, i + 1)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, parts)),
);
/**
 * Does this document contain a hardline anywhere in its subtree? If so every
 * enclosing group must break — a group can never print flat across a forced
 * newline. Comments introduce hardlines, so a commented node breaks its parents.
 * A nested group already knows its own answer, so the walk stops there.
 */
const forcesBreak: (d: Doc) => boolean = (d: Doc) =>
  ((_v) =>
    _v._tag === "DBreakParent"
      ? true
      : _v._tag === "DVerbatim"
        ? true
        : _v._tag === "DLine"
          ? (({ hard }) => hard)(_v)
          : _v._tag === "DCat"
            ? (({ parts }) => anyForcesBreak(parts, 0))(_v)
            : _v._tag === "DIndent"
              ? (({ doc: inner }) => forcesBreak(inner))(_v)
              : _v._tag === "DGroup"
                ? (({ breaks }) => breaks)(_v)
                : _v._tag === "DLineSuffix"
                  ? false
                  : _v._tag === "DText"
                    ? false
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(d);
const spaces: (n: number) => string = (n: number) => {
  let k: number = n;
  let acc: string = "";
  while (true) {
    if (k <= 0) {
      return acc;
    } else {
      [k, acc] = [k - 1, `${acc} `];
      continue;
    }
  }
};
/**
 * Column of the end of `s`, which may itself contain newlines.
 */
const posAfter: _Curry<[pos: number, s: string], number> = _curry(2, (pos: number, s: string) => {
  const parts: string[] = _Str_split("\n", s);
  return length(parts) === 1
    ? pos + _Str_length(s)
    : _Str_length(_Option_unwrapOr("", _Array_get(length(parts) - 1, parts)));
});
/**
 * Prepend deferred suffix items so the first one is processed first.
 */
const consItems: _Curry<[items: Item[], tail: Work], Work> = _curry(
  2,
  (items: Item[], tail: Work) => {
    let k: number = length(items) - 1;
    let w: Work = tail;
    while (true) {
      if (k < 0) {
        return w;
      } else {
        const _step = ((_v) =>
          _v._tag === "None"
            ? _done(w)
            : _v._tag === "Some"
              ? (({ value: it }) => _recur(k - 1, WCons(it, w)))(_v)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(_Array_get(k, items));
        if (_step._tag === "recur") {
          [k, w] = _step.args;
          continue;
        }
        return _step.value;
      }
    }
  },
);
export const render: _Curry<[root: Doc, width: number], string> = _curry(
  2,
  (root: Doc, width: number) => {
    let out: string = "";
    let pos: number = 0;
    let work: Work = WCons({ i: 0, m: "break", d: root }, WNil as Work);
    let sfx: Item[] = [] as Item[];
    while (true) {
      const _step = ((_v) =>
        _v._tag === "WNil"
          ? length(sfx) === 0
            ? _done(out)
            : _recur(out, pos, consItems(sfx, WNil as Work), [] as Item[])
          : _v._tag === "WCons"
            ? (({ head: { i, m, d }, tail }) =>
                ((_v) =>
                  _v._tag === "DText"
                    ? (({ s }) => _recur(`${out}${s}`, pos + _Str_length(s), tail, sfx))(_v)
                    : _v._tag === "DVerbatim"
                      ? (({ s }) => _recur(`${out}${s}`, posAfter(pos, s), tail, sfx))(_v)
                      : _v._tag === "DCat"
                        ? (({ parts }) => _recur(out, pos, consParts(parts, i, m, tail), sfx))(_v)
                        : _v._tag === "DIndent"
                          ? (({ doc: inner }) =>
                              _recur(
                                out,
                                pos,
                                WCons({ i: i + INDENT, m: m, d: inner }, tail),
                                sfx,
                              ))(_v)
                          : _v._tag === "DLine"
                            ? (({ hard, soft }) =>
                                and(m === "flat", !hard)
                                  ? ((s: string) =>
                                      _recur(`${out}${s}`, pos + _Str_length(s), tail, sfx))(
                                      soft ? "" : " ",
                                    )
                                  : length(sfx) === 0
                                    ? _recur(
                                        `${out}
${spaces(i)}`,
                                        i,
                                        tail,
                                        [] as Item[],
                                      )
                                    : _recur(
                                        out,
                                        pos,
                                        consItems(sfx, WCons({ i: i, m: m, d: d }, tail)),
                                        [] as Item[],
                                      ))(_v)
                            : _v._tag === "DGroup"
                              ? (({ doc: inner, breaks }) =>
                                  breaks
                                    ? _recur(
                                        out,
                                        pos,
                                        WCons({ i: i, m: "break", d: inner }, tail),
                                        sfx,
                                      )
                                    : ((cand: Work) =>
                                        fits(width - pos, cand)
                                          ? _recur(out, pos, cand, sfx)
                                          : _recur(
                                              out,
                                              pos,
                                              WCons({ i: i, m: "break", d: inner }, tail),
                                              sfx,
                                            ))(WCons({ i: i, m: "flat", d: inner }, tail)))(_v)
                              : _v._tag === "DLineSuffix"
                                ? (({ doc: inner }) =>
                                    _recur(
                                      out,
                                      pos,
                                      tail,
                                      _Array_append({ i: i, m: m, d: inner }, sfx),
                                    ))(_v)
                                : _v._tag === "DBreakParent"
                                  ? _recur(out, pos, tail, sfx)
                                  : (() => {
                                      throw new Error("non-exhaustive match");
                                    })())(d))(_v as Extract<Work, { _tag: "WCons" }>)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(work);
      if (_step._tag === "recur") {
        [out, pos, work, sfx] = _step.args;
        continue;
      }
      return _step.value;
    }
  },
);
/**
 * Render on a single line (every group flat) — for contexts that never wrap:
 * interpolation holes, `switch` scrutinees, and `when` guards.
 */
export const flat: (d: Doc) => string = (d: Doc) => render(d, 1000000000);
