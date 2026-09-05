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
  | { _tag: "DGroup"; doc: Doc }
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
  eq,
  length,
  not,
  or,
  sub,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

export const DText = (s: string): Doc => ({ _tag: "DText", s });
export const DVerbatim = (s: string): Doc => ({ _tag: "DVerbatim", s });
export const DLine = _curry(2, (hard, soft) => ({ _tag: "DLine", hard, soft })) as (
  hard: boolean,
  soft: boolean,
) => Doc;
export const DCat = (parts: Doc[]): Doc => ({ _tag: "DCat", parts });
export const DIndent = (doc: Doc): Doc => ({ _tag: "DIndent", doc });
export const DGroup = (doc: Doc): Doc => ({ _tag: "DGroup", doc });
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
export const group: (doc: Doc) => Doc = (doc: Doc) => DGroup(doc);
export const lineSuffix: (doc: Doc) => Doc = (doc: Doc) => DLineSuffix(doc);
const joinFrom: <A>(sep: A, parts: A[], i: number, acc: A[]) => A[] = _curry(
  4,
  <A>(sep: A, parts: A[], i: number, acc: A[]) =>
    match(_Array_get(i, parts))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: p }) =>
        joinFrom(
          sep,
          parts,
          i + 1,
          eq(i, 0) ? _Array_append(p, acc) : _Array_append(p, _Array_append(sep, acc)),
        ),
      )
      .exhaustive(),
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
        const _step = match(_Array_get(k, parts))
          .with({ _tag: "None" }, () => _done(w))
          .with({ _tag: "Some" }, ({ value: d }) => _recur(k - 1, WCons({ i: i, m: m, d: d }, w)))
          .exhaustive();
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
        const _step = match(work)
          .with({ _tag: "WNil" }, () => _done(true))
          .with(
            (_v): _v is Extract<Work, { _tag: "WCons" }> => {
              const _g: any = _v;
              return _g._tag === "WCons";
            },
            ({ head: { i, m, d }, tail }) =>
              match(d)
                .with({ _tag: "DText" }, ({ s }) => _recur(rem - _Str_length(s), tail))
                .with({ _tag: "DVerbatim" }, () => _done(true))
                .with({ _tag: "DCat" }, ({ parts }) => _recur(rem, consParts(parts, i, m, tail)))
                .with({ _tag: "DIndent" }, ({ doc: inner }) =>
                  _recur(rem, WCons({ i: i + INDENT, m: m, d: inner }, tail)),
                )
                .with({ _tag: "DGroup" }, ({ doc: inner }) =>
                  _recur(rem, WCons({ i: i, m: "flat", d: inner }, tail)),
                )
                .with({ _tag: "DLine" }, ({ hard, soft }) =>
                  or(hard, eq(m, "break")) ? _done(true) : _recur(rem - (soft ? 0 : 1), tail),
                )
                .with({ _tag: "DLineSuffix" }, ({ doc: inner }) =>
                  _recur(rem, WCons({ i: i, m: m, d: inner }, tail)),
                )
                .with({ _tag: "DBreakParent" }, () => _recur(rem, tail))
                .exhaustive(),
          )
          .exhaustive();
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
    match(_Array_get(i, parts))
      .with({ _tag: "None" }, () => false)
      .with({ _tag: "Some" }, ({ value: p }) => or(forcesBreak(p), anyForcesBreak(parts, i + 1)))
      .exhaustive(),
);
/**
 * Does this document contain a hardline anywhere in its subtree? If so every
 * enclosing group must break — a group can never print flat across a forced
 * newline. Comments introduce hardlines, so a commented node breaks its parents.
 */
const forcesBreak: (d: Doc) => boolean = (d: Doc) =>
  match(d)
    .with({ _tag: "DBreakParent" }, () => true)
    .with({ _tag: "DVerbatim" }, () => true)
    .with({ _tag: "DLine" }, ({ hard }) => hard)
    .with({ _tag: "DCat" }, ({ parts }) => anyForcesBreak(parts, 0))
    .with({ _tag: "DIndent" }, ({ doc: inner }) => forcesBreak(inner))
    .with({ _tag: "DGroup" }, ({ doc: inner }) => forcesBreak(inner))
    .with({ _tag: "DLineSuffix" }, () => false)
    .with({ _tag: "DText" }, () => false)
    .exhaustive();
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
  return eq(length(parts), 1)
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
        const _step = match(_Array_get(k, items))
          .with({ _tag: "None" }, () => _done(w))
          .with({ _tag: "Some" }, ({ value: it }) => _recur(k - 1, WCons(it, w)))
          .exhaustive();
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
      const _step = match(work)
        .with({ _tag: "WNil" }, () =>
          eq(length(sfx), 0)
            ? _done(out)
            : _recur(out, pos, consItems(sfx, WNil as Work), [] as Item[]),
        )
        .with(
          (_v): _v is Extract<Work, { _tag: "WCons" }> => {
            const _g: any = _v;
            return _g._tag === "WCons";
          },
          ({ head: { i, m, d }, tail }) =>
            match(d)
              .with({ _tag: "DText" }, ({ s }) =>
                _recur(`${out}${s}`, pos + _Str_length(s), tail, sfx),
              )
              .with({ _tag: "DVerbatim" }, ({ s }) =>
                _recur(`${out}${s}`, posAfter(pos, s), tail, sfx),
              )
              .with({ _tag: "DCat" }, ({ parts }) =>
                _recur(out, pos, consParts(parts, i, m, tail), sfx),
              )
              .with({ _tag: "DIndent" }, ({ doc: inner }) =>
                _recur(out, pos, WCons({ i: i + INDENT, m: m, d: inner }, tail), sfx),
              )
              .with({ _tag: "DLine" }, ({ hard, soft }) =>
                and(eq(m, "flat"), not(hard))
                  ? ((s: string) => _recur(`${out}${s}`, pos + _Str_length(s), tail, sfx))(
                      soft ? "" : " ",
                    )
                  : eq(length(sfx), 0)
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
                      ),
              )
              .with({ _tag: "DGroup" }, ({ doc: inner }) =>
                forcesBreak(inner)
                  ? _recur(out, pos, WCons({ i: i, m: "break", d: inner }, tail), sfx)
                  : ((cand: Work) =>
                      fits(width - pos, cand)
                        ? _recur(out, pos, cand, sfx)
                        : _recur(out, pos, WCons({ i: i, m: "break", d: inner }, tail), sfx))(
                      WCons({ i: i, m: "flat", d: inner }, tail),
                    ),
              )
              .with({ _tag: "DLineSuffix" }, ({ doc: inner }) =>
                _recur(out, pos, tail, _Array_append({ i: i, m: m, d: inner }, sfx)),
              )
              .with({ _tag: "DBreakParent" }, () => _recur(out, pos, tail, sfx))
              .exhaustive(),
        )
        .exhaustive();
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
