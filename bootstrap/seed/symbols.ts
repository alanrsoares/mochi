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

import { match } from "@onrails/pattern";

import * as Ast from "./ast";

const def: <A, B, C, D>(
  name: A,
  span: { end: B; start: C } & D,
) => { name: A; defStart: C; defEnd: B; start: C; end: B; role: string } = _curry(
  2,
  <A, B, C, D>(name: A, span: { end: B; start: C } & D) => ({
    name: name,
    defStart: span.start,
    defEnd: span.end,
    start: span.start,
    end: span.end,
    role: "def",
  }),
);
const use: <A, B, C, D, E, F, G>(
  name: A,
  span: { end: B; start: C } & F,
  env: Map<A, { end: D; start: E } & G>,
) => { name: A; defStart: E; defEnd: D; start: C; end: B; role: string }[] = _curry(
  3,
  <A, B, C, D, E, F, G>(
    name: A,
    span: { end: B; start: C } & F,
    env: Map<A, { end: D; start: E } & G>,
  ) =>
    match(_Map_get(name, env))
      .with(
        { _tag: "None" },
        () => [] as { name: A; defStart: E; defEnd: D; start: C; end: B; role: string }[],
      )
      .with({ _tag: "Some" }, ({ value: binding }) => [
        {
          name: name,
          defStart: binding.start,
          defEnd: binding.end,
          start: span.start,
          end: span.end,
          role: "use",
        },
      ])
      .exhaustive(),
);
const bind: <A, B, C, D>(
  name: A,
  span: { end: B; start: C } & D,
  env: Map<A, { name: A; start: C; end: B }>,
) => Map<A, { name: A; start: C; end: B }> = _curry(
  3,
  <A, B, C, D>(
    name: A,
    span: { end: B; start: C } & D,
    env: Map<A, { name: A; start: C; end: B }>,
  ) => _Map_set(name, { name: name, start: span.start, end: span.end }, env),
);
const bindSpannedNames: _Curry<
  [names: string[], spans: SpanAt[], env: Map<string, Binding>, i: number],
  { env: Map<string, Binding>; occurrences: Occurrence[] }
> = _curry(4, (names: string[], spans: SpanAt[], env: Map<string, Binding>, i: number) =>
  match(_tuple(_Array_get(i, names), _Array_get(i, spans)))
    .with(
      (
        _v,
      ): _v is [
        Extract<[Option<string>, Option<SpanAt>][0], { _tag: "Some" }>,
        Extract<[Option<string>, Option<SpanAt>][1], { _tag: "Some" }>,
      ] => {
        const _g: any = _v;
        return _g[0]._tag === "Some" && _g[1]._tag === "Some";
      },
      ([{ value: name }, { value: span }]) =>
        ((tail: { occurrences: Occurrence[]; env: Map<string, Binding> }) => ({
          env: tail.env,
          occurrences: _Array_prepend(def(name, span), tail.occurrences),
        }))(bindSpannedNames(names, spans, bind(name, span, env), i + 1)),
    )
    .otherwise(() => ({ env: env, occurrences: [] as Occurrence[] })),
);
const bindParam: _Curry<
  [param: LamParam, env: Map<string, Binding>],
  { env: Map<string, Binding>; occurrences: Occurrence[] }
> = _curry(2, (param: LamParam, env: Map<string, Binding>) =>
  match(param)
    .with(
      (
        _v,
      ): _v is Extract<LamParam, { _tag: "LPSpanned" }> & {
        param: Extract<Extract<LamParam, { _tag: "LPSpanned" }>["param"], { _tag: "LPName" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "LPSpanned" && _g.param._tag === "LPName" && _g.nameSpans.length === 1;
      },
      ({ param: { name }, nameSpans: [span] }) => ({
        env: bind(name, span, env),
        occurrences: [def(name, span)],
      }),
    )
    .with(
      (
        _v,
      ): _v is Extract<LamParam, { _tag: "LPSpanned" }> & {
        param: Extract<Extract<LamParam, { _tag: "LPSpanned" }>["param"], { _tag: "LPLabeled" }>;
      } => {
        const _g: any = _v;
        return (
          _g._tag === "LPSpanned" && _g.param._tag === "LPLabeled" && _g.nameSpans.length === 1
        );
      },
      ({ param: { name }, nameSpans: [span] }) => ({
        env: bind(name, span, env),
        occurrences: [def(name, span)],
      }),
    )
    .with(
      (
        _v,
      ): _v is Extract<LamParam, { _tag: "LPSpanned" }> & {
        param: Extract<Extract<LamParam, { _tag: "LPSpanned" }>["param"], { _tag: "LPTuple" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "LPSpanned" && _g.param._tag === "LPTuple";
      },
      ({ param: { names }, nameSpans: spans }) => bindSpannedNames(names, spans, env, 0),
    )
    .with(
      (
        _v,
      ): _v is Extract<LamParam, { _tag: "LPSpanned" }> & {
        param: Extract<Extract<LamParam, { _tag: "LPSpanned" }>["param"], { _tag: "LPRecord" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "LPSpanned" && _g.param._tag === "LPRecord";
      },
      ({ param: { fields: names }, nameSpans: spans }) => bindSpannedNames(names, spans, env, 0),
    )
    .otherwise(() => ({ env: env, occurrences: [] as Occurrence[] })),
);
const bindParams: _Curry<
  [params: LamParam[], env: Map<string, Binding>, i: number],
  { env: Map<string, Binding>; occurrences: Occurrence[] }
> = _curry(3, (params: LamParam[], env: Map<string, Binding>, i: number) =>
  match(_Array_get(i, params))
    .with({ _tag: "None" }, () => ({ env: env, occurrences: [] as Occurrence[] }))
    .with({ _tag: "Some" }, ({ value: param }) =>
      ((head: { env: Map<string, Binding>; occurrences: Occurrence[] }) =>
        ((tail: { occurrences: Occurrence[]; env: Map<string, Binding> }) => ({
          env: tail.env,
          occurrences: _Array_concat(head.occurrences, tail.occurrences),
        }))(bindParams(params, head.env, i + 1)))(bindParam(param, env)),
    )
    .exhaustive(),
);
const walkExprs: _Curry<[exprs: Expr[], env: Map<string, Binding>, i: number], Occurrence[]> =
  _curry(3, (exprs: Expr[], env: Map<string, Binding>, i: number) =>
    match(_Array_get(i, exprs))
      .with({ _tag: "None" }, () => [] as Occurrence[])
      .with({ _tag: "Some" }, ({ value: expr }) =>
        _Array_concat(walkExpr(expr, env), walkExprs(exprs, env, i + 1)),
      )
      .exhaustive(),
  );
const walkSeqs: _Curry<[elems: SeqElem[], env: Map<string, Binding>, i: number], Occurrence[]> =
  _curry(3, (elems: SeqElem[], env: Map<string, Binding>, i: number) =>
    match(_Array_get(i, elems))
      .with({ _tag: "None" }, () => [] as Occurrence[])
      .with(
        (
          _v,
        ): _v is Extract<Option<SeqElem>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<SeqElem>, { _tag: "Some" }>["value"], { _tag: "SEExpr" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SEExpr";
        },
        ({ value: { expr } }) => _Array_concat(walkExpr(expr, env), walkSeqs(elems, env, i + 1)),
      )
      .with(
        (
          _v,
        ): _v is Extract<Option<SeqElem>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<SeqElem>, { _tag: "Some" }>["value"], { _tag: "SESpread" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SESpread";
        },
        ({ value: { expr } }) => _Array_concat(walkExpr(expr, env), walkSeqs(elems, env, i + 1)),
      )
      .exhaustive(),
  );
const walkPattern: _Curry<
  [pat: Pattern, env: Map<string, Binding>],
  { env: Map<string, Binding>; occurrences: Occurrence[] }
> = _curry(2, (pat: Pattern, env: Map<string, Binding>) =>
  match(pat)
    .with({ _tag: "PBind" }, ({ name, span }) => ({
      env: bind(name, span, env),
      occurrences: [def(name, span)],
    }))
    .with({ _tag: "PAs" }, ({ pat: inner, name, nameSpan }) =>
      ((innerResult: { occurrences: Occurrence[]; env: Map<string, Binding> }) => ({
        env: bind(name, nameSpan, innerResult.env),
        occurrences: _Array_append(def(name, nameSpan), innerResult.occurrences),
      }))(walkPattern(inner, env)),
    )
    .with({ _tag: "PTuple" }, ({ elems }) => walkPatterns(elems, env, 0))
    .with({ _tag: "PRecord" }, ({ fields }) => walkPatFields(fields, env, 0))
    .with({ _tag: "PCtor" }, ({ args }) => walkPatterns(args, env, 0))
    .with({ _tag: "PArr" }, ({ elems, rest }) =>
      ((result: { env: Map<string, Binding>; occurrences: Occurrence[] }) =>
        match(rest)
          .with({ _tag: "None" }, () => result)
          .with({ _tag: "Some" }, ({ value: tail }) =>
            ((tailResult: { occurrences: Occurrence[]; env: Map<string, Binding> }) => ({
              env: tailResult.env,
              occurrences: _Array_concat(result.occurrences, tailResult.occurrences),
            }))(walkPattern(tail, result.env)),
          )
          .exhaustive())(walkPatterns(elems, env, 0)),
    )
    .with({ _tag: "PList" }, ({ elems, rest }) =>
      ((result: { env: Map<string, Binding>; occurrences: Occurrence[] }) =>
        match(rest)
          .with({ _tag: "None" }, () => result)
          .with({ _tag: "Some" }, ({ value: tail }) =>
            ((tailResult: { occurrences: Occurrence[]; env: Map<string, Binding> }) => ({
              env: tailResult.env,
              occurrences: _Array_concat(result.occurrences, tailResult.occurrences),
            }))(walkPattern(tail, result.env)),
          )
          .exhaustive())(walkPatterns(elems, env, 0)),
    )
    .with(
      (_v): _v is Extract<Pattern, { _tag: "POr" }> => {
        const _g: any = _v;
        return _g._tag === "POr" && _g.alts.length >= 1;
      },
      ({ alts: [first] }) => walkPattern(first, env),
    )
    .otherwise(() => ({ env: env, occurrences: [] as Occurrence[] })),
);
const walkPatterns: _Curry<
  [patterns: Pattern[], env: Map<string, Binding>, i: number],
  { env: Map<string, Binding>; occurrences: Occurrence[] }
> = _curry(3, (patterns: Pattern[], env: Map<string, Binding>, i: number) =>
  match(_Array_get(i, patterns))
    .with({ _tag: "None" }, () => ({ env: env, occurrences: [] as Occurrence[] }))
    .with({ _tag: "Some" }, ({ value: pat }) =>
      ((head: { occurrences: Occurrence[]; env: Map<string, Binding> }) =>
        ((tail: { env: Map<string, Binding>; occurrences: Occurrence[] }) => ({
          env: tail.env,
          occurrences: _Array_concat(head.occurrences, tail.occurrences),
        }))(walkPatterns(patterns, head.env, i + 1)))(walkPattern(pat, env)),
    )
    .exhaustive(),
);
const walkPatFields: _Curry<
  [fields: PatField[], env: Map<string, Binding>, i: number],
  { env: Map<string, Binding>; occurrences: Occurrence[] }
> = _curry(3, (fields: PatField[], env: Map<string, Binding>, i: number) =>
  match(_Array_get(i, fields))
    .with({ _tag: "None" }, () => ({ env: env, occurrences: [] as Occurrence[] }))
    .with({ _tag: "Some" }, ({ value: field }) =>
      ((head: { occurrences: Occurrence[]; env: Map<string, Binding> }) =>
        ((tail: { env: Map<string, Binding>; occurrences: Occurrence[] }) => ({
          env: tail.env,
          occurrences: _Array_concat(head.occurrences, tail.occurrences),
        }))(walkPatFields(fields, head.env, i + 1)))(walkPattern(field.pat, env)),
    )
    .exhaustive(),
);
const walkArms: _Curry<[arms: MatchArm[], env: Map<string, Binding>, i: number], Occurrence[]> =
  _curry(3, (arms: MatchArm[], env: Map<string, Binding>, i: number) =>
    match(_Array_get(i, arms))
      .with({ _tag: "None" }, () => [] as Occurrence[])
      .with({ _tag: "Some" }, ({ value: arm }) =>
        ((pat: { env: Map<string, Binding>; occurrences: Occurrence[] }) =>
          ((guard: Occurrence[]) =>
            _Array_concat(
              pat.occurrences,
              _Array_concat(
                guard,
                _Array_concat(walkExpr(arm.body, pat.env), walkArms(arms, env, i + 1)),
              ),
            ))(
            match(arm.guard)
              .with({ _tag: "None" }, () => [] as Occurrence[])
              .with({ _tag: "Some" }, ({ value: expr }) => walkExpr(expr, pat.env))
              .exhaustive(),
          ))(walkPattern(arm.pattern, env)),
      )
      .exhaustive(),
  );
const walkFields: _Curry<[fields: Field[], env: Map<string, Binding>, i: number], Occurrence[]> =
  _curry(3, (fields: Field[], env: Map<string, Binding>, i: number) =>
    match(_Array_get(i, fields))
      .with({ _tag: "None" }, () => [] as Occurrence[])
      .with({ _tag: "Some" }, ({ value: field }) =>
        _Array_concat(walkExpr(field.value, env), walkFields(fields, env, i + 1)),
      )
      .exhaustive(),
  );
const walkEntries: _Curry<
  [entries: MapEntry[], env: Map<string, Binding>, i: number],
  Occurrence[]
> = _curry(3, (entries: MapEntry[], env: Map<string, Binding>, i: number) =>
  match(_Array_get(i, entries))
    .with({ _tag: "None" }, () => [] as Occurrence[])
    .with({ _tag: "Some" }, ({ value: entry }) =>
      _Array_concat(
        walkExpr(entry.key, env),
        _Array_concat(walkExpr(entry.value, env), walkEntries(entries, env, i + 1)),
      ),
    )
    .exhaustive(),
);
const walkLoopParams: _Curry<
  [params: LoopParam[], env: Map<string, Binding>, i: number],
  Occurrence[]
> = _curry(3, (params: LoopParam[], env: Map<string, Binding>, i: number) =>
  match(_Array_get(i, params))
    .with({ _tag: "None" }, () => [] as Occurrence[])
    .with({ _tag: "Some" }, ({ value: param }) =>
      _Array_concat(walkExpr(param.init, env), walkLoopParams(params, env, i + 1)),
    )
    .exhaustive(),
);
const loopEnv: <A, B, C, D, E>(
  params: ({ name: A; nameSpan: { end: B; start: C } & D } & E)[],
  env: Map<A, { name: A; start: C; end: B }>,
  i: number,
) => Map<A, { name: A; start: C; end: B }> = _curry(
  3,
  <A, B, C, D, E>(
    params: ({ name: A; nameSpan: { end: B; start: C } & D } & E)[],
    env: Map<A, { name: A; start: C; end: B }>,
    i: number,
  ) =>
    match(_Array_get(i, params))
      .with({ _tag: "None" }, () => env)
      .with({ _tag: "Some" }, ({ value: param }) =>
        loopEnv(params, bind(param.name, param.nameSpan, env), i + 1),
      )
      .exhaustive(),
);
const loopDefs: <A, B, C, D, E>(
  params: ({ name: A; nameSpan: { end: B; start: C } & D } & E)[],
  i: number,
) => { name: A; defStart: C; defEnd: B; start: C; end: B; role: string }[] = _curry(
  2,
  <A, B, C, D, E>(params: ({ name: A; nameSpan: { end: B; start: C } & D } & E)[], i: number) =>
    match(_Array_get(i, params))
      .with(
        { _tag: "None" },
        () => [] as { name: A; defStart: C; defEnd: B; start: C; end: B; role: string }[],
      )
      .with({ _tag: "Some" }, ({ value: param }) =>
        _Array_concat([def(param.name, param.nameSpan)], loopDefs(params, i + 1)),
      )
      .exhaustive(),
);
const walkExpr: _Curry<[expr: Expr, env: Map<string, Binding>], Occurrence[]> = _curry(
  2,
  (expr: Expr, env: Map<string, Binding>) =>
    match(expr)
      .with({ _tag: "ERef" }, ({ name, span }) => use(name, span, env))
      .with({ _tag: "ECall" }, ({ fn, args }) =>
        _Array_concat(walkExpr(fn, env), walkExprs(args, env, 0)),
      )
      .with({ _tag: "ELambda" }, ({ params, body }) =>
        ((bound: { env: Map<string, Binding>; occurrences: Occurrence[] }) =>
          _Array_concat(bound.occurrences, walkExpr(body, bound.env)))(bindParams(params, env, 0)),
      )
      .with({ _tag: "ELetIn" }, ({ name, nameSpan, value, body }) =>
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
          match(value)
            .with({ _tag: "ELambda" }, () => true)
            .otherwise(() => false),
        ),
      )
      .with({ _tag: "ELetBind" }, ({ value, body }) =>
        _Array_concat(walkExpr(value, env), walkExpr(body, env)),
      )
      .with({ _tag: "EPipe" }, ({ left, right }) =>
        _Array_concat(walkExpr(left, env), walkExpr(right, env)),
      )
      .with({ _tag: "EDo" }, ({ exprs }) => walkExprs(exprs, env, 0))
      .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) =>
        _Array_concat(
          walkExpr(cond, env),
          _Array_concat(walkExpr(thenE, env), walkExpr(elseE, env)),
        ),
      )
      .with({ _tag: "EMatch" }, ({ scrutinee, arms }) =>
        _Array_concat(walkExpr(scrutinee, env), walkArms(arms, env, 0)),
      )
      .with({ _tag: "ERecord" }, ({ fields, spread }) =>
        match(spread)
          .with({ _tag: "None" }, () => walkFields(fields, env, 0))
          .with({ _tag: "Some" }, ({ value: base }) =>
            _Array_concat(walkExpr(base, env), walkFields(fields, env, 0)),
          )
          .exhaustive(),
      )
      .with({ _tag: "EField" }, ({ target }) => walkExpr(target, env))
      .with({ _tag: "ETuple" }, ({ elements }) => walkExprs(elements, env, 0))
      .with({ _tag: "EArr" }, ({ elements }) => walkSeqs(elements, env, 0))
      .with({ _tag: "EList" }, ({ elements }) => walkSeqs(elements, env, 0))
      .with({ _tag: "ESet" }, ({ elements }) => walkSeqs(elements, env, 0))
      .with({ _tag: "EMap" }, ({ entries }) => walkEntries(entries, env, 0))
      .with({ _tag: "ELoop" }, ({ params, body }) =>
        ((scoped: Map<string, Binding>) =>
          _Array_concat(
            walkLoopParams(params, env, 0),
            _Array_concat(loopDefs(params, 0), walkExpr(body, scoped)),
          ))(loopEnv(params, env, 0)),
      )
      .with({ _tag: "ERecur" }, ({ args }) => walkExprs(args, env, 0))
      .with({ _tag: "EInterp" }, ({ parts }) => walkInterp(parts, env, 0))
      .otherwise(() => [] as Occurrence[]),
);
const walkInterp: _Curry<
  [parts: InterpPart[], env: Map<string, Binding>, i: number],
  Occurrence[]
> = _curry(3, (parts: InterpPart[], env: Map<string, Binding>, i: number) =>
  match(_Array_get(i, parts))
    .with({ _tag: "None" }, () => [] as Occurrence[])
    .with(
      (
        _v,
      ): _v is Extract<Option<InterpPart>, { _tag: "Some" }> & {
        value: Extract<Extract<Option<InterpPart>, { _tag: "Some" }>["value"], { _tag: "IPLit" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "Some" && _g.value._tag === "IPLit";
      },
      () => walkInterp(parts, env, i + 1),
    )
    .with(
      (
        _v,
      ): _v is Extract<Option<InterpPart>, { _tag: "Some" }> & {
        value: Extract<Extract<Option<InterpPart>, { _tag: "Some" }>["value"], { _tag: "IPExpr" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "Some" && _g.value._tag === "IPExpr";
      },
      ({ value: { expr } }) => _Array_concat(walkExpr(expr, env), walkInterp(parts, env, i + 1)),
    )
    .exhaustive(),
);
const topEnv: _Curry<
  [stmts: Stmt[], env: Map<string, Binding>, i: number],
  Map<string, Binding>
> = _curry(3, (stmts: Stmt[], env: Map<string, Binding>, i: number) =>
  match(_Array_get(i, stmts))
    .with({ _tag: "None" }, () => env)
    .with(
      (
        _v,
      ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
        value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "Some" && _g.value._tag === "SLet";
      },
      ({ value: { name, nameSpan: span } }) => topEnv(stmts, bind(name, span, env), i + 1),
    )
    .with(
      (
        _v,
      ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
        value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SExtern" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "Some" && _g.value._tag === "SExtern";
      },
      ({ value: { name, nameSpan: span } }) => topEnv(stmts, bind(name, span, env), i + 1),
    )
    .with({ _tag: "Some" }, () => topEnv(stmts, env, i + 1))
    .exhaustive(),
);
const topDefs: _Curry<[stmts: Stmt[], i: number], Occurrence[]> = _curry(
  2,
  (stmts: Stmt[], i: number) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => [] as Occurrence[])
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SLet";
        },
        ({ value: { name, nameSpan: span } }) =>
          _Array_concat([def(name, span)], topDefs(stmts, i + 1)),
      )
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SExtern" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SExtern";
        },
        ({ value: { name, nameSpan: span } }) =>
          _Array_concat([def(name, span)], topDefs(stmts, i + 1)),
      )
      .with({ _tag: "Some" }, () => topDefs(stmts, i + 1))
      .exhaustive(),
);
const walkStmts: _Curry<[stmts: Stmt[], env: Map<string, Binding>, i: number], Occurrence[]> =
  _curry(3, (stmts: Stmt[], env: Map<string, Binding>, i: number) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => [] as Occurrence[])
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SLet";
        },
        ({ value: { value } }) => _Array_concat(walkExpr(value, env), walkStmts(stmts, env, i + 1)),
      )
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SExpr" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SExpr";
        },
        ({ value: { value } }) => _Array_concat(walkExpr(value, env), walkStmts(stmts, env, i + 1)),
      )
      .with({ _tag: "Some" }, () => walkStmts(stmts, env, i + 1))
      .exhaustive(),
  );
/**
 * index : [Stmt] -> [Occurrence]
 * The returned list is declaration-first and uses declaration spans as identity.
 */
export const index: (stmts: Stmt[]) => Occurrence[] = (stmts: Stmt[]) => {
  const env: Map<string, Binding> = topEnv(stmts, new Map<string, Binding>(), 0);
  return _Array_concat(topDefs(stmts, 0), walkStmts(stmts, env, 0));
};
