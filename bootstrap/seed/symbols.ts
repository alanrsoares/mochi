import type {
  Expr,
  Field,
  InterpPart,
  LamParam,
  LoopParam,
  MapEntry,
  MatchArm,
  PatField,
  Pattern,
  SeqElem,
  Stmt,
} from "./ast";
import type { SpanAt } from "./types";

export type Binding = { name: string; start: number; end: number };
export type Occurrence = {
  name: string;
  defStart: number;
  defEnd: number;
  start: number;
  end: number;
  role: string;
};

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Array_concat,
  _Array_get,
  _Array_prepend,
  _Map_get,
  _Map_set,
  _curry,
  _tuple,
} from "@mochi/compiler/runtime";

import * as Ast from "./ast";

const def: <D>(name: string, span: { end: number; start: number } & D) => Occurrence = _curry(
  2,
  <D>(name: string, span: { end: number; start: number } & D) => ({
    name: name,
    defStart: span.start,
    defEnd: span.end,
    start: span.start,
    end: span.end,
    role: "def",
  }),
);
const use: <F, G>(
  name: string,
  span: { end: number; start: number } & F,
  env: Map<string, { end: number; start: number } & G>,
) => Occurrence[] = _curry(
  3,
  <F, G>(
    name: string,
    span: { end: number; start: number } & F,
    env: Map<string, { end: number; start: number } & G>,
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as Occurrence[])
        : _v._tag === "Some"
          ? (({ value: binding }) => [
              {
                name: name,
                defStart: binding.start,
                defEnd: binding.end,
                start: span.start,
                end: span.end,
                role: "use",
              },
            ])(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Map_get(name, env)),
);
const bind: <D>(
  name: string,
  span: { end: number; start: number } & D,
  env: Map<string, Binding>,
) => Map<string, Binding> = _curry(
  3,
  <D>(name: string, span: { end: number; start: number } & D, env: Map<string, Binding>) =>
    _Map_set(name, { name: name, start: span.start, end: span.end }, env),
);
const bindSpannedNames: _Curry<
  [names: string[], spans: SpanAt[], env: Map<string, Binding>, i: number],
  { env: Map<string, Binding>; occurrences: Occurrence[] }
> = _curry(4, (names: string[], spans: SpanAt[], env: Map<string, Binding>, i: number) =>
  ((_v) =>
    _v[0]._tag === "Some" && _v[1]._tag === "Some"
      ? (([{ value: name }, { value: span }]) =>
          ((tail: { occurrences: Occurrence[]; env: Map<string, Binding> }) => ({
            env: tail.env,
            occurrences: _Array_prepend(def(name, span), tail.occurrences),
          }))(bindSpannedNames(names, spans, bind(name, span, env), i + 1)))(
          _v as [
            Extract<[Option<string>, Option<SpanAt>][0], { _tag: "Some" }>,
            Extract<[Option<string>, Option<SpanAt>][1], { _tag: "Some" }>,
          ],
        )
      : { env: env, occurrences: [] as Occurrence[] })(
    _tuple(_Array_get(i, names), _Array_get(i, spans)),
  ),
);
const bindParam: _Curry<
  [param: LamParam, env: Map<string, Binding>],
  { env: Map<string, Binding>; occurrences: Occurrence[] }
> = _curry(2, (param: LamParam, env: Map<string, Binding>) =>
  ((_v) =>
    _v._tag === "LPSpanned" && _v.param._tag === "LPName" && _v.nameSpans.length === 1
      ? (({ param: { name }, nameSpans: [span] }) => ({
          env: bind(name, span, env),
          occurrences: [def(name, span)],
        }))(
          _v as Extract<LamParam, { _tag: "LPSpanned" }> & {
            param: Extract<Extract<LamParam, { _tag: "LPSpanned" }>["param"], { _tag: "LPName" }>;
          },
        )
      : _v._tag === "LPSpanned" && _v.param._tag === "LPLabeled" && _v.nameSpans.length === 1
        ? (({ param: { name }, nameSpans: [span] }) => ({
            env: bind(name, span, env),
            occurrences: [def(name, span)],
          }))(
            _v as Extract<LamParam, { _tag: "LPSpanned" }> & {
              param: Extract<
                Extract<LamParam, { _tag: "LPSpanned" }>["param"],
                { _tag: "LPLabeled" }
              >;
            },
          )
        : _v._tag === "LPSpanned" && _v.param._tag === "LPTuple"
          ? (({ param: { names }, nameSpans: spans }) => bindSpannedNames(names, spans, env, 0))(
              _v as Extract<LamParam, { _tag: "LPSpanned" }> & {
                param: Extract<
                  Extract<LamParam, { _tag: "LPSpanned" }>["param"],
                  { _tag: "LPTuple" }
                >;
              },
            )
          : _v._tag === "LPSpanned" && _v.param._tag === "LPRecord"
            ? (({ param: { fields: names }, nameSpans: spans }) =>
                bindSpannedNames(names, spans, env, 0))(
                _v as Extract<LamParam, { _tag: "LPSpanned" }> & {
                  param: Extract<
                    Extract<LamParam, { _tag: "LPSpanned" }>["param"],
                    { _tag: "LPRecord" }
                  >;
                },
              )
            : { env: env, occurrences: [] as Occurrence[] })(param),
);
const bindParams: _Curry<
  [params: LamParam[], env: Map<string, Binding>, i: number],
  { env: Map<string, Binding>; occurrences: Occurrence[] }
> = _curry(3, (params: LamParam[], env: Map<string, Binding>, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? { env: env, occurrences: [] as Occurrence[] }
      : _v._tag === "Some"
        ? (({ value: param }) =>
            ((head: { env: Map<string, Binding>; occurrences: Occurrence[] }) =>
              ((tail: { occurrences: Occurrence[]; env: Map<string, Binding> }) => ({
                env: tail.env,
                occurrences: _Array_concat(head.occurrences, tail.occurrences),
              }))(bindParams(params, head.env, i + 1)))(bindParam(param, env)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, params)),
);
const walkExprs: _Curry<[exprs: Expr[], env: Map<string, Binding>, i: number], Occurrence[]> =
  _curry(3, (exprs: Expr[], env: Map<string, Binding>, i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as Occurrence[])
        : _v._tag === "Some"
          ? (({ value: expr }) => _Array_concat(walkExpr(expr, env), walkExprs(exprs, env, i + 1)))(
              _v,
            )
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, exprs)),
  );
const walkSeqs: _Curry<[elems: SeqElem[], env: Map<string, Binding>, i: number], Occurrence[]> =
  _curry(3, (elems: SeqElem[], env: Map<string, Binding>, i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as Occurrence[])
        : _v._tag === "Some" && _v.value._tag === "SEExpr"
          ? (({ value: { expr } }) =>
              _Array_concat(walkExpr(expr, env), walkSeqs(elems, env, i + 1)))(
              _v as Extract<Option<SeqElem>, { _tag: "Some" }> & {
                value: Extract<
                  Extract<Option<SeqElem>, { _tag: "Some" }>["value"],
                  { _tag: "SEExpr" }
                >;
              },
            )
          : _v._tag === "Some" && _v.value._tag === "SESpread"
            ? (({ value: { expr } }) =>
                _Array_concat(walkExpr(expr, env), walkSeqs(elems, env, i + 1)))(
                _v as Extract<Option<SeqElem>, { _tag: "Some" }> & {
                  value: Extract<
                    Extract<Option<SeqElem>, { _tag: "Some" }>["value"],
                    { _tag: "SESpread" }
                  >;
                },
              )
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, elems)),
  );
const walkPattern: _Curry<
  [pat: Pattern, env: Map<string, Binding>],
  { env: Map<string, Binding>; occurrences: Occurrence[] }
> = _curry(2, (pat: Pattern, env: Map<string, Binding>) =>
  ((_v) =>
    _v._tag === "PBind"
      ? (({ name, span }) => ({ env: bind(name, span, env), occurrences: [def(name, span)] }))(_v)
      : _v._tag === "PAs"
        ? (({ pat: inner, name, nameSpan }) =>
            ((innerResult: { occurrences: Occurrence[]; env: Map<string, Binding> }) => ({
              env: bind(name, nameSpan, innerResult.env),
              occurrences: _Array_append(def(name, nameSpan), innerResult.occurrences),
            }))(walkPattern(inner, env)))(_v)
        : _v._tag === "PTuple"
          ? (({ elems }) => walkPatterns(elems, env, 0))(_v)
          : _v._tag === "PRecord"
            ? (({ fields }) => walkPatFields(fields, env, 0))(_v)
            : _v._tag === "PCtor"
              ? (({ args }) => walkPatterns(args, env, 0))(_v)
              : _v._tag === "PArr"
                ? (({ elems, rest }) =>
                    ((result: { env: Map<string, Binding>; occurrences: Occurrence[] }) =>
                      ((_v) =>
                        _v._tag === "None"
                          ? result
                          : _v._tag === "Some"
                            ? (({ value: tail }) =>
                                ((tailResult: {
                                  occurrences: Occurrence[];
                                  env: Map<string, Binding>;
                                }) => ({
                                  env: tailResult.env,
                                  occurrences: _Array_concat(
                                    result.occurrences,
                                    tailResult.occurrences,
                                  ),
                                }))(walkPattern(tail, result.env)))(_v)
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(rest))(walkPatterns(elems, env, 0)))(_v)
                : _v._tag === "PList"
                  ? (({ elems, rest }) =>
                      ((result: { env: Map<string, Binding>; occurrences: Occurrence[] }) =>
                        ((_v) =>
                          _v._tag === "None"
                            ? result
                            : _v._tag === "Some"
                              ? (({ value: tail }) =>
                                  ((tailResult: {
                                    occurrences: Occurrence[];
                                    env: Map<string, Binding>;
                                  }) => ({
                                    env: tailResult.env,
                                    occurrences: _Array_concat(
                                      result.occurrences,
                                      tailResult.occurrences,
                                    ),
                                  }))(walkPattern(tail, result.env)))(_v)
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(rest))(walkPatterns(elems, env, 0)))(_v)
                  : _v._tag === "POr" && _v.alts.length >= 1
                    ? (({ alts: [first] }) => walkPattern(first, env))(
                        _v as Extract<Pattern, { _tag: "POr" }>,
                      )
                    : { env: env, occurrences: [] as Occurrence[] })(pat),
);
const walkPatterns: _Curry<
  [patterns: Pattern[], env: Map<string, Binding>, i: number],
  { env: Map<string, Binding>; occurrences: Occurrence[] }
> = _curry(3, (patterns: Pattern[], env: Map<string, Binding>, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? { env: env, occurrences: [] as Occurrence[] }
      : _v._tag === "Some"
        ? (({ value: pat }) =>
            ((head: { occurrences: Occurrence[]; env: Map<string, Binding> }) =>
              ((tail: { env: Map<string, Binding>; occurrences: Occurrence[] }) => ({
                env: tail.env,
                occurrences: _Array_concat(head.occurrences, tail.occurrences),
              }))(walkPatterns(patterns, head.env, i + 1)))(walkPattern(pat, env)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, patterns)),
);
const walkPatFields: _Curry<
  [fields: PatField[], env: Map<string, Binding>, i: number],
  { env: Map<string, Binding>; occurrences: Occurrence[] }
> = _curry(3, (fields: PatField[], env: Map<string, Binding>, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? { env: env, occurrences: [] as Occurrence[] }
      : _v._tag === "Some"
        ? (({ value: field }) =>
            ((head: { occurrences: Occurrence[]; env: Map<string, Binding> }) =>
              ((tail: { env: Map<string, Binding>; occurrences: Occurrence[] }) => ({
                env: tail.env,
                occurrences: _Array_concat(head.occurrences, tail.occurrences),
              }))(walkPatFields(fields, head.env, i + 1)))(walkPattern(field.pat, env)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, fields)),
);
const walkArms: _Curry<[arms: MatchArm[], env: Map<string, Binding>, i: number], Occurrence[]> =
  _curry(3, (arms: MatchArm[], env: Map<string, Binding>, i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as Occurrence[])
        : _v._tag === "Some"
          ? (({ value: arm }) =>
              ((pat: { env: Map<string, Binding>; occurrences: Occurrence[] }) =>
                ((guard: Occurrence[]) =>
                  _Array_concat(
                    pat.occurrences,
                    _Array_concat(
                      guard,
                      _Array_concat(walkExpr(arm.body, pat.env), walkArms(arms, env, i + 1)),
                    ),
                  ))(
                  ((_v) =>
                    _v._tag === "None"
                      ? ([] as Occurrence[])
                      : _v._tag === "Some"
                        ? (({ value: expr }) => walkExpr(expr, pat.env))(_v)
                        : (() => {
                            throw new Error("non-exhaustive match");
                          })())(arm.guard),
                ))(walkPattern(arm.pattern, env)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, arms)),
  );
const walkFields: _Curry<[fields: Field[], env: Map<string, Binding>, i: number], Occurrence[]> =
  _curry(3, (fields: Field[], env: Map<string, Binding>, i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as Occurrence[])
        : _v._tag === "Some"
          ? (({ value: field }) =>
              _Array_concat(walkExpr(field.value, env), walkFields(fields, env, i + 1)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, fields)),
  );
const walkEntries: _Curry<
  [entries: MapEntry[], env: Map<string, Binding>, i: number],
  Occurrence[]
> = _curry(3, (entries: MapEntry[], env: Map<string, Binding>, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as Occurrence[])
      : _v._tag === "Some"
        ? (({ value: entry }) =>
            _Array_concat(
              walkExpr(entry.key, env),
              _Array_concat(walkExpr(entry.value, env), walkEntries(entries, env, i + 1)),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, entries)),
);
const walkLoopParams: _Curry<
  [params: LoopParam[], env: Map<string, Binding>, i: number],
  Occurrence[]
> = _curry(3, (params: LoopParam[], env: Map<string, Binding>, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as Occurrence[])
      : _v._tag === "Some"
        ? (({ value: param }) =>
            _Array_concat(walkExpr(param.init, env), walkLoopParams(params, env, i + 1)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, params)),
);
const loopEnv: <D, E>(
  params: ({ name: string; nameSpan: { end: number; start: number } & D } & E)[],
  env: Map<string, Binding>,
  i: number,
) => Map<string, Binding> = _curry(
  3,
  <D, E>(
    params: ({ name: string; nameSpan: { end: number; start: number } & D } & E)[],
    env: Map<string, Binding>,
    i: number,
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? env
        : _v._tag === "Some"
          ? (({ value: param }) => loopEnv(params, bind(param.name, param.nameSpan, env), i + 1))(
              _v,
            )
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, params)),
);
const loopDefs: <D, E>(
  params: ({ name: string; nameSpan: { end: number; start: number } & D } & E)[],
  i: number,
) => Occurrence[] = _curry(
  2,
  <D, E>(
    params: ({ name: string; nameSpan: { end: number; start: number } & D } & E)[],
    i: number,
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as Occurrence[])
        : _v._tag === "Some"
          ? (({ value: param }) =>
              _Array_concat([def(param.name, param.nameSpan)], loopDefs(params, i + 1)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, params)),
);
const walkExpr: _Curry<[expr: Expr, env: Map<string, Binding>], Occurrence[]> = _curry(
  2,
  (expr: Expr, env: Map<string, Binding>) =>
    ((_v) =>
      _v._tag === "ERef"
        ? (({ name, span }) => use(name, span, env))(_v)
        : _v._tag === "ECall"
          ? (({ fn, args }) => _Array_concat(walkExpr(fn, env), walkExprs(args, env, 0)))(_v)
          : _v._tag === "ELambda"
            ? (({ params, body }) =>
                ((bound: { env: Map<string, Binding>; occurrences: Occurrence[] }) =>
                  _Array_concat(bound.occurrences, walkExpr(body, bound.env)))(
                  bindParams(params, env, 0),
                ))(_v)
            : _v._tag === "ELetIn"
              ? (({ name, nameSpan, value, body }) =>
                  ((recursive: boolean) =>
                    ((bodyEnv: Map<string, Binding>) =>
                      recursive
                        ? _Array_concat(
                            [def(name, nameSpan)],
                            _Array_concat(walkExpr(value, bodyEnv), walkExpr(body, bodyEnv)),
                          )
                        : _Array_concat(
                            walkExpr(value, env),
                            _Array_concat([def(name, nameSpan)], walkExpr(body, bodyEnv)),
                          ))(bind(name, nameSpan, env)))(
                    ((_v) => (_v._tag === "ELambda" ? true : false))(value),
                  ))(_v)
              : _v._tag === "ELetBind"
                ? (({ param, value, body }) =>
                    ((bound: { env: Map<string, Binding>; occurrences: Occurrence[] }) =>
                      _Array_concat(
                        walkExpr(value, env),
                        _Array_concat(bound.occurrences, walkExpr(body, bound.env)),
                      ))(bindParam(param, env)))(_v)
                : _v._tag === "EPipe"
                  ? (({ left, right }) => _Array_concat(walkExpr(left, env), walkExpr(right, env)))(
                      _v,
                    )
                  : _v._tag === "EDo"
                    ? (({ exprs }) => walkExprs(exprs, env, 0))(_v)
                    : _v._tag === "ETernary"
                      ? (({ cond, thenE, elseE }) =>
                          _Array_concat(
                            walkExpr(cond, env),
                            _Array_concat(walkExpr(thenE, env), walkExpr(elseE, env)),
                          ))(_v)
                      : _v._tag === "EMatch"
                        ? (({ scrutinee, arms }) =>
                            _Array_concat(walkExpr(scrutinee, env), walkArms(arms, env, 0)))(_v)
                        : _v._tag === "ERecord"
                          ? (({ fields, spread }) =>
                              ((_v) =>
                                _v._tag === "None"
                                  ? walkFields(fields, env, 0)
                                  : _v._tag === "Some"
                                    ? (({ value: base }) =>
                                        _Array_concat(
                                          walkExpr(base, env),
                                          walkFields(fields, env, 0),
                                        ))(_v)
                                    : (() => {
                                        throw new Error("non-exhaustive match");
                                      })())(spread))(_v)
                          : _v._tag === "EField"
                            ? (({ target }) => walkExpr(target, env))(_v)
                            : _v._tag === "ETuple"
                              ? (({ elements }) => walkExprs(elements, env, 0))(_v)
                              : _v._tag === "EArr"
                                ? (({ elements }) => walkSeqs(elements, env, 0))(_v)
                                : _v._tag === "EList"
                                  ? (({ elements }) => walkSeqs(elements, env, 0))(_v)
                                  : _v._tag === "ESet"
                                    ? (({ elements }) => walkSeqs(elements, env, 0))(_v)
                                    : _v._tag === "EMap"
                                      ? (({ entries }) => walkEntries(entries, env, 0))(_v)
                                      : _v._tag === "ELoop"
                                        ? (({ params, body }) =>
                                            ((scoped: Map<string, Binding>) =>
                                              _Array_concat(
                                                walkLoopParams(params, env, 0),
                                                _Array_concat(
                                                  loopDefs(params, 0),
                                                  walkExpr(body, scoped),
                                                ),
                                              ))(loopEnv(params, env, 0)))(_v)
                                        : _v._tag === "ERecur"
                                          ? (({ args }) => walkExprs(args, env, 0))(_v)
                                          : _v._tag === "EInterp"
                                            ? (({ parts }) => walkInterp(parts, env, 0))(_v)
                                            : ([] as Occurrence[]))(expr),
);
const walkInterp: _Curry<
  [parts: InterpPart[], env: Map<string, Binding>, i: number],
  Occurrence[]
> = _curry(3, (parts: InterpPart[], env: Map<string, Binding>, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as Occurrence[])
      : _v._tag === "Some" && _v.value._tag === "IPLit"
        ? walkInterp(parts, env, i + 1)
        : _v._tag === "Some" && _v.value._tag === "IPExpr"
          ? (({ value: { expr } }) =>
              _Array_concat(walkExpr(expr, env), walkInterp(parts, env, i + 1)))(
              _v as Extract<Option<InterpPart>, { _tag: "Some" }> & {
                value: Extract<
                  Extract<Option<InterpPart>, { _tag: "Some" }>["value"],
                  { _tag: "IPExpr" }
                >;
              },
            )
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, parts)),
);
const topEnv: _Curry<
  [stmts: Stmt[], env: Map<string, Binding>, i: number],
  Map<string, Binding>
> = _curry(3, (stmts: Stmt[], env: Map<string, Binding>, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? env
      : _v._tag === "Some" && _v.value._tag === "SLet"
        ? (({ value: { name, nameSpan: span } }) => topEnv(stmts, bind(name, span, env), i + 1))(
            _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
              value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
            },
          )
        : _v._tag === "Some" && _v.value._tag === "SExtern"
          ? (({ value: { name, nameSpan: span } }) => topEnv(stmts, bind(name, span, env), i + 1))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<
                  Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                  { _tag: "SExtern" }
                >;
              },
            )
          : _v._tag === "Some"
            ? topEnv(stmts, env, i + 1)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, stmts)),
);
const topDefs: _Curry<[stmts: Stmt[], i: number], Occurrence[]> = _curry(
  2,
  (stmts: Stmt[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as Occurrence[])
        : _v._tag === "Some" && _v.value._tag === "SLet"
          ? (({ value: { name, nameSpan: span } }) =>
              _Array_concat([def(name, span)], topDefs(stmts, i + 1)))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
              },
            )
          : _v._tag === "Some" && _v.value._tag === "SExtern"
            ? (({ value: { name, nameSpan: span } }) =>
                _Array_concat([def(name, span)], topDefs(stmts, i + 1)))(
                _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                  value: Extract<
                    Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                    { _tag: "SExtern" }
                  >;
                },
              )
            : _v._tag === "Some"
              ? topDefs(stmts, i + 1)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(_Array_get(i, stmts)),
);
const walkStmts: _Curry<[stmts: Stmt[], env: Map<string, Binding>, i: number], Occurrence[]> =
  _curry(3, (stmts: Stmt[], env: Map<string, Binding>, i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as Occurrence[])
        : _v._tag === "Some" && _v.value._tag === "SLet"
          ? (({ value: { value } }) =>
              _Array_concat(walkExpr(value, env), walkStmts(stmts, env, i + 1)))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
              },
            )
          : _v._tag === "Some" && _v.value._tag === "SExpr"
            ? (({ value: { value } }) =>
                _Array_concat(walkExpr(value, env), walkStmts(stmts, env, i + 1)))(
                _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                  value: Extract<
                    Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                    { _tag: "SExpr" }
                  >;
                },
              )
            : _v._tag === "Some"
              ? walkStmts(stmts, env, i + 1)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(_Array_get(i, stmts)),
  );
/**
 * index : [Stmt] -> [Occurrence]
 * The returned list is declaration-first and uses declaration spans as identity.
 */
export const index: (stmts: Stmt[]) => Occurrence[] = (stmts: Stmt[]) => {
  const env: Map<string, Binding> = topEnv(stmts, new Map<string, Binding>(), 0);
  return _Array_concat(topDefs(stmts, 0), walkStmts(stmts, env, 0));
};
