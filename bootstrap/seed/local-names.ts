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

import type { Option, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_get,
  _Set_add,
  _Set_fromArray,
  _curry,
  add,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "./ast";
const addNames: <A>(names: A[], out: Set<A>) => Set<A> = _curry(2, <A>(names: A[], out: Set<A>) =>
  match(names)
    .with(
      (_v) => _v.length === 0,
      () => out,
    )
    .with(
      (_v) => _v.length >= 1,
      ([n, ...rest]) => addNames(rest, _Set_add(n, out)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const patternNamesOpt: _Curry<[p: Option<Pattern>, out: Set<string>], Set<string>> = _curry(
  2,
  (p: Option<Pattern>, out: Set<string>) =>
    match(p)
      .with({ _tag: "None" }, () => out)
      .with({ _tag: "Some" }, ({ value: pat }) => patternNames(pat, out))
      .exhaustive(),
);
const patternNamesAll: _Curry<[pats: Pattern[], out: Set<string>], Set<string>> = _curry(
  2,
  (pats: Pattern[], out: Set<string>) =>
    match(pats)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => out,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([p, ...rest]) => patternNamesAll(rest, patternNames(p, out)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const patternNamesFields: _Curry<[fields: PatField[], out: Set<string>], Set<string>> = _curry(
  2,
  (fields: PatField[], out: Set<string>) =>
    match(fields)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => out,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([f, ...rest]) => patternNamesFields(rest, patternNames(f.pat, out)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const patternNames: _Curry<[p: Pattern, out: Set<string>], Set<string>> = _curry(
  2,
  (p: Pattern, out: Set<string>) =>
    match(p)
      .with({ _tag: "PAs" }, ({ pat, name }) => patternNames(pat, _Set_add(name, out)))
      .with({ _tag: "PBind" }, ({ name }) => _Set_add(name, out))
      .with({ _tag: "PTuple" }, ({ elems }) => patternNamesAll(elems, out))
      .with({ _tag: "PRecord" }, ({ fields }) => patternNamesFields(fields, out))
      .with({ _tag: "PCtor" }, ({ args }) => patternNamesAll(args, out))
      .with({ _tag: "PArr" }, ({ elems, rest }) =>
        patternNamesOpt(rest, patternNamesAll(elems, out)),
      )
      .with({ _tag: "PList" }, ({ elems, rest }) =>
        patternNamesOpt(rest, patternNamesAll(elems, out)),
      )
      .with({ _tag: "POr" }, ({ alts }) => patternNamesAll(alts, out))
      .with({ _tag: "PWild" }, () => out)
      .with({ _tag: "PUnit" }, () => out)
      .with({ _tag: "PLit" }, () => out)
      .with({ _tag: "PBool" }, () => out)
      .with({ _tag: "PStr" }, () => out)
      .exhaustive(),
);
const exprNamesAll: _Curry<[exprs: Expr[], out: Set<string>], Set<string>> = _curry(
  2,
  (exprs: Expr[], out: Set<string>) =>
    match(exprs)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => out,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([e, ...rest]) => exprNamesAll(rest, exprNames(e, out)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const exprNamesOpt: _Curry<[e: Option<Expr>, out: Set<string>], Set<string>> = _curry(
  2,
  (e: Option<Expr>, out: Set<string>) =>
    match(e)
      .with({ _tag: "None" }, () => out)
      .with({ _tag: "Some" }, ({ value: ex }) => exprNames(ex, out))
      .exhaustive(),
);
const seqNames: _Curry<[elems: SeqElem[], out: Set<string>], Set<string>> = _curry(
  2,
  (elems: SeqElem[], out: Set<string>) =>
    match(elems)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => out,
      )
      .with(
        (_v): _v is [Extract<SeqElem[][number], { _tag: "SEExpr" }>, ...SeqElem[]] => {
          const _g: any = _v;
          return _g.length >= 1 && _g[0]._tag === "SEExpr";
        },
        ([{ expr: e }, ...rest]) => seqNames(rest, exprNames(e, out)),
      )
      .with(
        (_v): _v is [Extract<SeqElem[][number], { _tag: "SESpread" }>, ...SeqElem[]] => {
          const _g: any = _v;
          return _g.length >= 1 && _g[0]._tag === "SESpread";
        },
        ([{ expr: e }, ...rest]) => seqNames(rest, exprNames(e, out)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const fieldNames: _Curry<[fields: Field[], out: Set<string>], Set<string>> = _curry(
  2,
  (fields: Field[], out: Set<string>) =>
    match(fields)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => out,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([f, ...rest]) => fieldNames(rest, exprNames(f.value, out)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const entryNames: _Curry<[entries: MapEntry[], out: Set<string>], Set<string>> = _curry(
  2,
  (entries: MapEntry[], out: Set<string>) =>
    match(entries)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => out,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([ent, ...rest]) => entryNames(rest, exprNames(ent.value, exprNames(ent.key, out))),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const interpNames: _Curry<[parts: InterpPart[], out: Set<string>], Set<string>> = _curry(
  2,
  (parts: InterpPart[], out: Set<string>) =>
    match(parts)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => out,
      )
      .with(
        (_v): _v is [Extract<InterpPart[][number], { _tag: "IPLit" }>, ...InterpPart[]] => {
          const _g: any = _v;
          return _g.length >= 1 && _g[0]._tag === "IPLit";
        },
        ([, ...rest]) => interpNames(rest, out),
      )
      .with(
        (_v): _v is [Extract<InterpPart[][number], { _tag: "IPExpr" }>, ...InterpPart[]] => {
          const _g: any = _v;
          return _g.length >= 1 && _g[0]._tag === "IPExpr";
        },
        ([{ expr: e }, ...rest]) => interpNames(rest, exprNames(e, out)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const armNames: _Curry<[arms: MatchArm[], out: Set<string>], Set<string>> = _curry(
  2,
  (arms: MatchArm[], out: Set<string>) =>
    match(arms)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => out,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([arm, ...rest]) =>
          ((out1: Set<string>) =>
            ((out2: Set<string>) => armNames(rest, exprNames(arm.body, out2)))(
              exprNamesOpt(arm.guard, out1),
            ))(patternNames(arm.pattern, out)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const loopParamNames: _Curry<[params: LoopParam[], out: Set<string>], Set<string>> = _curry(
  2,
  (params: LoopParam[], out: Set<string>) =>
    match(params)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => out,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([p, ...rest]) => loopParamNames(rest, exprNames(p.init, _Set_add(p.name, out))),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const paramNames: _Curry<[p: LamParam, out: Set<string>], Set<string>> = _curry(
  2,
  (p: LamParam, out: Set<string>) =>
    match(p)
      .with({ _tag: "LPSpanned" }, ({ param: inner }) => paramNames(inner, out))
      .with({ _tag: "LPName" }, ({ name }) => _Set_add(name, out))
      .with({ _tag: "LPTuple" }, ({ names }) => addNames(names, out))
      .with({ _tag: "LPRecord" }, ({ fields }) => addNames(fields, out))
      .with({ _tag: "LPLabeled" }, ({ name, defaultValue }) =>
        exprNamesOpt(defaultValue, _Set_add(name, out)),
      )
      .exhaustive(),
);
const paramNamesAll: _Curry<[params: LamParam[], out: Set<string>], Set<string>> = _curry(
  2,
  (params: LamParam[], out: Set<string>) =>
    match(params)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => out,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([p, ...rest]) => paramNamesAll(rest, paramNames(p, out)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const exprNames: _Curry<[e: Expr, out: Set<string>], Set<string>> = _curry(
  2,
  (e: Expr, out: Set<string>) =>
    match(e)
      .with({ _tag: "ENum" }, () => out)
      .with({ _tag: "EUnit" }, () => out)
      .with({ _tag: "EBool" }, () => out)
      .with({ _tag: "EStr" }, () => out)
      .with({ _tag: "ERef" }, () => out)
      .with({ _tag: "EInterp" }, ({ parts }) => interpNames(parts, out))
      .with({ _tag: "ECall" }, ({ fn, args }) => exprNamesAll(args, exprNames(fn, out)))
      .with({ _tag: "ELambda" }, ({ params, body }) => exprNames(body, paramNamesAll(params, out)))
      .with({ _tag: "ELetIn" }, ({ name, value, body }) =>
        exprNames(body, exprNames(value, _Set_add(name, out))),
      )
      .with({ _tag: "ELetBind" }, ({ param, value, body }) =>
        exprNames(body, paramNames(param, exprNames(value, out))),
      )
      .with({ _tag: "EPipe" }, ({ left, right }) => exprNames(right, exprNames(left, out)))
      .with({ _tag: "EDo" }, ({ exprs }) => exprNamesAll(exprs, out))
      .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) =>
        exprNames(elseE, exprNames(thenE, exprNames(cond, out))),
      )
      .with({ _tag: "EMatch" }, ({ scrutinee, arms }) => armNames(arms, exprNames(scrutinee, out)))
      .with({ _tag: "ERecord" }, ({ fields, spread }) =>
        fieldNames(fields, exprNamesOpt(spread, out)),
      )
      .with({ _tag: "EField" }, ({ target }) => exprNames(target, out))
      .with({ _tag: "ELoop" }, ({ params, body }) => exprNames(body, loopParamNames(params, out)))
      .with({ _tag: "ERecur" }, ({ args }) => exprNamesAll(args, out))
      .with({ _tag: "ETuple" }, ({ elements }) => exprNamesAll(elements, out))
      .with({ _tag: "EArr" }, ({ elements }) => seqNames(elements, out))
      .with({ _tag: "EList" }, ({ elements }) => seqNames(elements, out))
      .with({ _tag: "ESet" }, ({ elements }) => seqNames(elements, out))
      .with({ _tag: "EMap" }, ({ entries }) => entryNames(entries, out))
      .exhaustive(),
);
const namesFromStmts: _Curry<[stmts: Stmt[], i: number, out: Set<string>], Set<string>> = _curry(
  3,
  (stmts: Stmt[], i: number, out: Set<string>) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => out)
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SLet";
        },
        ({ value: { value } }) => namesFromStmts(stmts, i + 1, exprNames(value, out)),
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
        ({ value: { value } }) => namesFromStmts(stmts, i + 1, exprNames(value, out)),
      )
      .with({ _tag: "Some" }, () => namesFromStmts(stmts, i + 1, out))
      .exhaustive(),
);
/**
 * Every local binder in `stmts`.
 */
export const localBinderNames: (stmts: Stmt[]) => Set<string> = (stmts: Stmt[]) =>
  namesFromStmts(stmts, 0, _Set_fromArray([] as string[]));
