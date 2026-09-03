import type { Option, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Option_contains,
  _Str_get,
  _curry,
  _done,
  _recur,
  eq,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

const skipStrLoop: _Curry<[src: string, j0: number], Option<number>> = _curry(
  2,
  (src: string, j0: number) => {
    let j: number = j0;
    while (true) {
      const _step = match(_Str_get(j, src))
        .with({ _tag: "None" }, () => _done(None as Option<number>))
        .with({ _tag: "Some", value: '"' }, () => _done(Some(j + 1) as Option<number>))
        .with({ _tag: "Some", value: "\\" }, () =>
          match(_Str_get(j + 1, src))
            .with({ _tag: "Some" }, () => _recur(j + 2))
            .with({ _tag: "None" }, () => _recur(j + 1))
            .exhaustive(),
        )
        .with(
          (_v): _v is Extract<Option<string>, { _tag: "Some" }> => {
            const _g: any = _v;
            return (
              _g._tag === "Some" && _g.value === "$" && _Option_contains("{", _Str_get(j + 1, src))
            );
          },
          () =>
            match(findHoleEnd(src, j + 2))
              .with({ _tag: "Some" }, ({ value: hEnd }) => _recur(hEnd))
              .with({ _tag: "None" }, () => _done(None as Option<number>))
              .exhaustive(),
        )
        .with({ _tag: "Some" }, () => _recur(j + 1))
        .exhaustive();
      if (_step._tag === "recur") {
        j = _step.args[0];
        continue;
      }
      return _step.value;
    }
  },
);
export const skipStringLiteral: _Curry<[src: string, i: number], Option<number>> = _curry(
  2,
  (src: string, i: number) => skipStrLoop(src, i + 1),
);
export const skipLineCommentTo: _Curry<[src: string, j: number], number> = _curry(
  2,
  (src: string, j: number) =>
    match(_Str_get(j, src))
      .with({ _tag: "None" }, () => j)
      .with({ _tag: "Some", value: "\n" }, () => j)
      .with({ _tag: "Some" }, () => skipLineCommentTo(src, j + 1))
      .exhaustive(),
);
const findHoleLoop: _Curry<[src: string, j0: number, depth0: number], Option<number>> = _curry(
  3,
  (src: string, j0: number, depth0: number) => {
    let j: number = j0;
    let depth: number = depth0;
    while (true) {
      const _step = match(_Str_get(j, src))
        .with({ _tag: "None" }, () => _done(None as Option<number>))
        .with({ _tag: "Some", value: '"' }, () =>
          match(skipStringLiteral(src, j))
            .with({ _tag: "Some" }, ({ value: stop }) => _recur(stop, depth))
            .with({ _tag: "None" }, () => _done(None as Option<number>))
            .exhaustive(),
        )
        .with(
          (_v): _v is Extract<Option<string>, { _tag: "Some" }> => {
            const _g: any = _v;
            return (
              _g._tag === "Some" && _g.value === "/" && _Option_contains("/", _Str_get(j + 1, src))
            );
          },
          () => _recur(skipLineCommentTo(src, j), depth),
        )
        .with({ _tag: "Some", value: "{" }, () => _recur(j + 1, depth + 1))
        .with({ _tag: "Some", value: "}" }, () =>
          eq(depth, 1) ? _done(Some(j + 1) as Option<number>) : _recur(j + 1, depth - 1),
        )
        .with({ _tag: "Some" }, () => _recur(j + 1, depth))
        .exhaustive();
      if (_step._tag === "recur") {
        [j, depth] = _step.args;
        continue;
      }
      return _step.value;
    }
  },
);
export const findHoleEnd: _Curry<[src: string, start: number], Option<number>> = _curry(
  2,
  (src: string, start: number) => findHoleLoop(src, start, 1),
);
