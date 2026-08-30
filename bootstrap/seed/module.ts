import type { Tok } from "./lexer";
import type { AliasField, Expr, Span, Stmt, TypeExpr } from "./ast";
import type { Row, Ty } from "./types";

export type Loaded = { path: string; stmts: Stmt[] };
export type MErr = { message: string; start: number; end: number };
export type Acc = { state: Map<string, string>; order: Loaded[] };
export type CtorInfo = { owner: string; arity: number };
export type Registry = { ctors: Map<string, CtorInfo>; types: Map<string, string[]> };

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
  _Array_sort,
  _Map_get,
  _Map_getOr,
  _Map_keys,
  _Map_set,
  _Option_mapOr,
  _Option_unwrapOr,
  _Result_flatMap,
  _Set_add,
  _Set_fromArray,
  _Set_has,
  _Str_codeAt,
  _Str_get,
  _Str_join,
  _Str_length,
  _Str_split,
  _Str_startsWith,
  _Str_trim,
  _curry,
  add,
  and,
  compare,
  eq,
  filter,
  gte,
  length,
  lte,
  map,
  not,
  or,
  reduce,
  sub,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import { lex } from "./lexer";
import { parse } from "./parser";
import { checkWith } from "./check";
import { exportedRegistry, exportedCtorKeys } from "./ctors";
import { inferProgramImports, inferProgramImportsTypes, exportedSchemes } from "./infer";
import { codegen } from "./codegen";
import { emitTsModule, externModuleDts } from "./codegen-ts";
import { builtins } from "./prelude.gen.mjs";
import { namespaces } from "./prelude.gen.mjs";
import { namespaceRuntime } from "./prelude.gen.mjs";
import { preludeJsDefs } from "./prelude.gen.mjs";
import { runtimeDeps } from "./prelude.gen.mjs";
import * as Ast from "./ast";

import { readFile } from "./host.mjs";
import { resolveImport as $resolveImport } from "./host.mjs";
const resolveImport = _curry(2, $resolveImport);
import { absPath } from "./host.mjs";
const mErr: <A>(message: A) => { message: A; start: number; end: number } = <A>(message: A) => ({
  message: message,
  start: 0,
  end: 0,
});
const parseModule: ($x: string) => Result<Stmt[], MErr> = ($x: string) =>
  _Result_flatMap(parse)(lex($x));
const importFromsFrom: _Curry<[stmts: Stmt[], i: number, acc: string[]], string[]> = _curry(
  3,
  (stmts: Stmt[], i: number, acc: string[]) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: s }) =>
        match(s)
          .with({ _tag: "SImport" }, ({ from }) =>
            importFromsFrom(stmts, add(i, 1), _Array_append(from, acc)),
          )
          .with({ _tag: "SImportNs" }, ({ from }) =>
            importFromsFrom(stmts, add(i, 1), _Array_append(from, acc)),
          )
          .otherwise(() => importFromsFrom(stmts, add(i, 1), acc)),
      )
      .exhaustive(),
);
const importFroms: (stmts: Stmt[]) => string[] = (stmts: Stmt[]) =>
  importFromsFrom(stmts, 0, [] as string[]);

const visit: _Curry<[path: string, acc: Acc], Result<Acc, MErr>> = _curry(
  2,
  (path: string, acc: Acc) =>
    match(_Map_get(path, acc.state))
      .with({ _tag: "Some", value: "done" }, () => Ok(acc) as Result<Acc, MErr>)
      .with(
        { _tag: "Some", value: "loading" },
        () => Err(mErr(`import cycle through '${path}'`)) as Result<Acc, MErr>,
      )
      .otherwise(() =>
        ((acc1: Acc) =>
          match(readFile(path))
            .with(
              { _tag: "Err" },
              () => Err(mErr(`cannot read module '${path}'`)) as Result<Acc, MErr>,
            )
            .with({ _tag: "Ok" }, ({ value: src }) =>
              match(parseModule(src))
                .with({ _tag: "Err" }, ({ error: e }) => Err(e) as Result<Acc, MErr>)
                .with({ _tag: "Ok" }, ({ value: stmts }) =>
                  match(visitAll(importFroms(stmts), path, acc1))
                    .with({ _tag: "Err" }, ({ error: e }) => Err(e) as Result<Acc, MErr>)
                    .with(
                      { _tag: "Ok" },
                      ({ value: acc2 }) =>
                        Ok({
                          state: _Map_set(path, "done", acc2.state),
                          order: _Array_append({ path: path, stmts: stmts }, acc2.order),
                        }) as Result<Acc, MErr>,
                    )
                    .exhaustive(),
                )
                .exhaustive(),
            )
            .exhaustive())({ state: _Map_set(path, "loading", acc.state), order: acc.order }),
      ),
);
const visitAll: _Curry<[froms: string[], importer: string, acc: Acc], Result<Acc, MErr>> = _curry(
  3,
  (froms: string[], importer: string, acc: Acc) =>
    match(froms)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(acc) as Result<Acc, MErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([from, ...rest]) =>
          match(visit(resolveImport(importer, from), acc))
            .with({ _tag: "Err" }, ({ error: e }) => Err(e) as Result<Acc, MErr>)
            .with({ _tag: "Ok" }, ({ value: acc1 }) => visitAll(rest, importer, acc1))
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * loadGraph : string -> Result [Loaded] MErr
 * Load every module reachable from `entry`, in dependency order.
 */
export const loadGraph: (entry: string) => Result<Loaded[], MErr> = (entry: string) =>
  _Result_flatMap(
    (acc) => Ok(acc.order) as Result<Loaded[], MErr>,
    visit(absPath(entry), { state: new Map<string, string>(), order: [] as Loaded[] }),
  );

const emptyReg: Registry = {
  ctors: new Map<string, CtorInfo>(),
  types: new Map<string, string[]>(),
};
const mergeInto: <A, B>(keys: A[], from: Map<A, B>, into: Map<A, B>) => Map<A, B> = _curry(
  3,
  <A, B>(keys: A[], from: Map<A, B>, into: Map<A, B>) =>
    match(keys)
      .with(
        (_v) => _v.length === 0,
        () => into,
      )
      .with(
        (_v) => _v.length >= 1,
        ([k, ...rest]) =>
          mergeInto(
            rest,
            from,
            match(_Map_get(k, from))
              .with({ _tag: "Some" }, ({ value: v }) => _Map_set(k, v, into))
              .with({ _tag: "None" }, () => into)
              .exhaustive(),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const mergeMap: <A, B>(from: Map<A, B>, into: Map<A, B>) => Map<A, B> = _curry(
  2,
  <A, B>(from: Map<A, B>, into: Map<A, B>) => mergeInto(_Map_keys(from), from, into),
);
const exportedTypeNames: (stmts: Stmt[]) => Set<string> = (stmts: Stmt[]) =>
  _Set_fromArray(
    _Array_flatMap(
      (s: Stmt) =>
        match(s)
          .with({ _tag: "SType", exported: true }, ({ name }) => [name])
          .otherwise(() => [] as string[]),
      stmts,
    ),
  );
const aliasesOf: (
  stmts: Stmt[],
) => Map<string, { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> }> = (
  stmts: Stmt[],
) =>
  reduce(
    _curry(
      2,
      (
        acc: Map<string, { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> }>,
        s: Stmt,
      ) =>
        match(s)
          .with(
            (
              _v,
            ): _v is Extract<Stmt, { _tag: "SType" }> & {
              alias: Extract<Extract<Stmt, { _tag: "SType" }>["alias"], { _tag: "Some" }>;
            } => {
              const _g: any = _v;
              return _g._tag === "SType" && _g.alias._tag === "Some";
            },
            ({ name, params, alias: { value: fields } }) =>
              _Map_set(
                name,
                { params: params, fields: fields, expr: None as Option<TypeExpr> },
                acc,
              ),
          )
          .with(
            (
              _v,
            ): _v is Extract<Stmt, { _tag: "SType" }> & {
              aliasType: Extract<Extract<Stmt, { _tag: "SType" }>["aliasType"], { _tag: "Some" }>;
            } => {
              const _g: any = _v;
              return _g._tag === "SType" && _g.aliasType._tag === "Some";
            },
            ({ name, params, aliasType: { value: te } }) =>
              _Map_set(
                name,
                { params: params, fields: [] as AliasField[], expr: Some(te) as Option<TypeExpr> },
                acc,
              ),
          )
          .otherwise(() => acc),
    ),
    new Map<string, { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> }>(),
    stmts,
  );
const qualScopeOf: (stmts: Stmt[]) => {
  types: Set<string>;
  aliases: Map<string, { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> }>;
} = (stmts: Stmt[]) => ({ types: exportedTypeNames(stmts), aliases: aliasesOf(stmts) });
const withNamedCtor: <A, B, C, D, E, F, G, H, I, J, K>(
  name: A,
  info: { owner: B } & H,
  depReg: { types: Map<B, C> } & I,
  depKeys: Map<A, D>,
  res: {
    quals: E;
    keys: Map<A, D>;
    reg: { types: Map<B, C>; ctors: Map<A, { owner: B } & H> } & J;
    nsImports: F;
    imports: G;
  } & K,
) => {
  imports: G;
  nsImports: F;
  reg: { ctors: Map<A, { owner: B } & H>; types: Map<B, C> };
  keys: Map<A, D>;
  quals: E;
} = _curry(
  5,
  <A, B, C, D, E, F, G, H, I, J, K>(
    name: A,
    info: { owner: B } & H,
    depReg: { types: Map<B, C> } & I,
    depKeys: Map<A, D>,
    res: {
      quals: E;
      keys: Map<A, D>;
      reg: { types: Map<B, C>; ctors: Map<A, { owner: B } & H> } & J;
      nsImports: F;
      imports: G;
    } & K,
  ) => ({
    imports: res.imports,
    nsImports: res.nsImports,
    reg: {
      ctors: _Map_set(name, info, res.reg.ctors),
      types: match(_Map_get(info.owner, depReg.types))
        .with({ _tag: "Some" }, ({ value: cs }) => _Map_set(info.owner, cs, res.reg.types))
        .with({ _tag: "None" }, () => res.reg.types)
        .exhaustive(),
    },
    keys: match(_Map_get(name, depKeys))
      .with({ _tag: "Some" }, ({ value: ks }) => _Map_set(name, ks, res.keys))
      .with({ _tag: "None" }, () => res.keys)
      .exhaustive(),
    quals: res.quals,
  }),
);
const takeNamedCtor: <A, B, C, D, E, F, G, H, I, J, K>(
  name: string,
  span: { end: A; start: B } & I,
  depReg: { ctors: Map<string, { owner: C } & J>; types: Map<C, D> } & K,
  depKeys: Map<string, E>,
  res: {
    reg: { ctors: Map<string, { owner: C } & J>; types: Map<C, D> };
    quals: F;
    keys: Map<string, E>;
    nsImports: G;
    imports: H;
  },
) => Result<
  {
    reg: { ctors: Map<string, { owner: C } & J>; types: Map<C, D> };
    quals: F;
    keys: Map<string, E>;
    nsImports: G;
    imports: H;
  },
  { message: string; start: B; end: A }
> = _curry(
  5,
  <A, B, C, D, E, F, G, H, I, J, K>(
    name: string,
    span: { end: A; start: B } & I,
    depReg: { ctors: Map<string, { owner: C } & J>; types: Map<C, D> } & K,
    depKeys: Map<string, E>,
    res: {
      reg: { ctors: Map<string, { owner: C } & J>; types: Map<C, D> };
      quals: F;
      keys: Map<string, E>;
      nsImports: G;
      imports: H;
    },
  ) =>
    match(_Map_get(name, depReg.ctors))
      .with({ _tag: "None" }, () => Ok(res))
      .with({ _tag: "Some" }, ({ value: info }) =>
        match(_Map_get(name, res.reg.ctors))
          .with({ _tag: "Some" }, ({ value: prior }) =>
            not(eq(prior.owner, info.owner))
              ? Err({
                  message: `duplicate constructor '${name}'`,
                  start: span.start,
                  end: span.end,
                })
              : Ok(withNamedCtor(name, info, depReg, depKeys, res)),
          )
          .with({ _tag: "None" }, () => Ok(withNamedCtor(name, info, depReg, depKeys, res)))
          .exhaustive(),
      )
      .exhaustive(),
);
const prefixCtorsInto: <A>(
  keys: string[],
  alias: string,
  from: Map<string, A>,
  into: Map<string, A>,
) => Map<string, A> = _curry(
  4,
  <A>(keys: string[], alias: string, from: Map<string, A>, into: Map<string, A>) =>
    match(keys)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => into,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([k, ...rest]) =>
          prefixCtorsInto(
            rest,
            alias,
            from,
            match(_Map_get(k, from))
              .with({ _tag: "Some" }, ({ value: v }) => _Map_set(`${alias}.${k}`, v, into))
              .with({ _tag: "None" }, () => into)
              .exhaustive(),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const resolveNames: <A, B, C, D, E, F, G, H, I, J, K, L>(
  names: ({ name: string; span: { end: A; start: B } & I } & J)[],
  from: string,
  depExports: Map<string, C>,
  depReg: { ctors: Map<string, { owner: D } & K>; types: Map<D, E> } & L,
  depKeys: Map<string, F>,
  res: {
    quals: G;
    keys: Map<string, F>;
    reg: { ctors: Map<string, { owner: D } & K>; types: Map<D, E> };
    nsImports: H;
    imports: Map<string, C>;
  },
) => Result<
  {
    quals: G;
    keys: Map<string, F>;
    reg: { ctors: Map<string, { owner: D } & K>; types: Map<D, E> };
    nsImports: H;
    imports: Map<string, C>;
  },
  { message: string; start: B; end: A }
> = _curry(
  6,
  <A, B, C, D, E, F, G, H, I, J, K, L>(
    names: ({ name: string; span: { end: A; start: B } & I } & J)[],
    from: string,
    depExports: Map<string, C>,
    depReg: { ctors: Map<string, { owner: D } & K>; types: Map<D, E> } & L,
    depKeys: Map<string, F>,
    res: {
      quals: G;
      keys: Map<string, F>;
      reg: { ctors: Map<string, { owner: D } & K>; types: Map<D, E> };
      nsImports: H;
      imports: Map<string, C>;
    },
  ) =>
    match(names)
      .with(
        (_v) => _v.length === 0,
        () => Ok(res),
      )
      .with(
        (_v) => _v.length >= 1,
        ([n, ...rest]) =>
          match(_Map_get(n.name, depExports))
            .with({ _tag: "None" }, () =>
              Err({
                message: `'${from}' has no export '${n.name}'`,
                start: n.span.start,
                end: n.span.end,
              }),
            )
            .with({ _tag: "Some" }, ({ value: sc }) =>
              match(
                takeNamedCtor(n.name, n.span, depReg, depKeys, {
                  imports: _Map_set(n.name, sc, res.imports),
                  nsImports: res.nsImports,
                  reg: res.reg,
                  keys: res.keys,
                  quals: res.quals,
                }),
              )
                .with({ _tag: "Err" }, ({ error: e }) => Err(e))
                .with({ _tag: "Ok" }, ({ value: res1 }) =>
                  resolveNames(rest, from, depExports, depReg, depKeys, res1),
                )
                .exhaustive(),
            )
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const resolveImportsFrom: <A, B, C, D>(
  ctx: {
    exportsByPath: Map<string, Map<string, A>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, B>>;
    qualsByPath: Map<string, C>;
  } & D,
  stmts: Stmt[],
  i: number,
  path: string,
  res: {
    quals: Map<string, C>;
    keys: Map<string, B>;
    reg: Registry;
    nsImports: Map<string, Map<string, A>>;
    imports: Map<string, A>;
  },
) => Result<
  {
    quals: Map<string, C>;
    keys: Map<string, B>;
    reg: Registry;
    nsImports: Map<string, Map<string, A>>;
    imports: Map<string, A>;
  },
  MErr
> = _curry(
  5,
  <A, B, C, D>(
    ctx: {
      exportsByPath: Map<string, Map<string, A>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, B>>;
      qualsByPath: Map<string, C>;
    } & D,
    stmts: Stmt[],
    i: number,
    path: string,
    res: {
      quals: Map<string, C>;
      keys: Map<string, B>;
      reg: Registry;
      nsImports: Map<string, Map<string, A>>;
      imports: Map<string, A>;
    },
  ) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => Ok(res))
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SImport" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SImport";
        },
        ({ value: { names, from } }) =>
          ((dp: string) =>
            ((depExports) =>
              ((depReg: Registry) =>
                ((depKeys) =>
                  match(resolveNames(names, from, depExports, depReg, depKeys, res))
                    .with({ _tag: "Err" }, ({ error: e }) => Err(e))
                    .with({ _tag: "Ok" }, ({ value: res1 }) =>
                      resolveImportsFrom(ctx, stmts, add(i, 1), path, res1),
                    )
                    .exhaustive())(_Map_getOr(new Map<string, B>(), dp, ctx.keysByPath)))(
                _Map_getOr(emptyReg, dp, ctx.regByPath),
              ))(_Map_getOr(new Map<string, A>(), dp, ctx.exportsByPath)))(
            resolveImport(path, from),
          ),
      )
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SImportNs" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SImportNs";
        },
        ({ value: { alias, from } }) =>
          ((dp: string) =>
            ((depExports) =>
              ((depReg: Registry) =>
                ((depKeys) =>
                  resolveImportsFrom(ctx, stmts, add(i, 1), path, {
                    imports: res.imports,
                    nsImports: _Map_set(alias.name, depExports, res.nsImports),
                    reg: {
                      ctors: prefixCtorsInto(
                        _Map_keys(depReg.ctors),
                        alias.name,
                        depReg.ctors,
                        res.reg.ctors,
                      ),
                      types: mergeMap(depReg.types, res.reg.types),
                    },
                    keys: mergeMap(depKeys, res.keys),
                    quals: match(_Map_get(dp, ctx.qualsByPath))
                      .with({ _tag: "Some" }, ({ value: q }) => _Map_set(alias.name, q, res.quals))
                      .with({ _tag: "None" }, () => res.quals)
                      .exhaustive(),
                  }))(_Map_getOr(new Map<string, B>(), dp, ctx.keysByPath)))(
                _Map_getOr(emptyReg, dp, ctx.regByPath),
              ))(_Map_getOr(new Map<string, A>(), dp, ctx.exportsByPath)))(
            resolveImport(path, from),
          ),
      )
      .with({ _tag: "Some" }, () => resolveImportsFrom(ctx, stmts, add(i, 1), path, res))
      .exhaustive(),
);
const compileOne: <A>(
  ctx: {
    exportsByPath: Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<
      string,
      {
        types: Set<string>;
        aliases: Map<string, { expr: Option<TypeExpr>; fields: AliasField[]; params: string[] }>;
      }
    >;
    outputs: { path: string; js: string }[];
  } & A,
  loaded: Loaded,
) => Result<
  {
    exportsByPath: Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<
      string,
      {
        types: Set<string>;
        aliases: Map<string, { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> }>;
      }
    >;
    outputs: { path: string; js: string }[];
  },
  MErr
> = _curry(
  2,
  <A>(
    ctx: {
      exportsByPath: Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<
        string,
        {
          types: Set<string>;
          aliases: Map<string, { expr: Option<TypeExpr>; fields: AliasField[]; params: string[] }>;
        }
      >;
      outputs: { path: string; js: string }[];
    } & A,
    loaded: Loaded,
  ) =>
    match(
      resolveImportsFrom(ctx, loaded.stmts, 0, loaded.path, {
        imports: new Map<string, { vars: number[]; rvars: number[]; ty: Ty }>(),
        nsImports: new Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>(),
        reg: emptyReg,
        keys: new Map<string, string[]>(),
        quals: new Map<
          string,
          {
            types: Set<string>;
            aliases: Map<
              string,
              { expr: Option<TypeExpr>; fields: AliasField[]; params: string[] }
            >;
          }
        >(),
      }),
    )
      .with(
        { _tag: "Err" },
        ({ error: e }) =>
          Err(e) as Result<
            {
              exportsByPath: Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>;
              regByPath: Map<string, Registry>;
              keysByPath: Map<string, Map<string, string[]>>;
              qualsByPath: Map<
                string,
                {
                  types: Set<string>;
                  aliases: Map<
                    string,
                    { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> }
                  >;
                }
              >;
              outputs: { path: string; js: string }[];
            },
            MErr
          >,
      )
      .with({ _tag: "Ok" }, ({ value: res }) =>
        match(checkWith(loaded.stmts, res.reg, res.quals))
          .with(
            { _tag: "Err" },
            ({ error: e }) =>
              Err(e) as Result<
                {
                  exportsByPath: Map<
                    string,
                    Map<string, { vars: number[]; rvars: number[]; ty: Ty }>
                  >;
                  regByPath: Map<string, Registry>;
                  keysByPath: Map<string, Map<string, string[]>>;
                  qualsByPath: Map<
                    string,
                    {
                      types: Set<string>;
                      aliases: Map<
                        string,
                        { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> }
                      >;
                    }
                  >;
                  outputs: { path: string; js: string }[];
                },
                MErr
              >,
          )
          .with({ _tag: "Ok" }, () =>
            match(
              inferProgramImports(
                loaded.stmts,
                builtins,
                namespaces,
                true,
                res.imports,
                res.nsImports,
                res.quals,
                None as Option<
                  {
                    name: string;
                    parse: Option<
                      (
                        a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
                        b: number,
                        c: (
                          a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
                          b: number,
                        ) => Result<[Expr, number], MErr>,
                      ) => Result<Option<[Expr, number]>, MErr>
                    >;
                    inferCall: Option<
                      (
                        a: Expr,
                        b: Expr[],
                        c: Option<string>,
                        d: {
                          tv: Map<number, Ty>;
                          rv: Map<number, Row>;
                          next: number;
                          recorded: { span: Span; ty: Ty }[];
                          letSpans: Map<string, Span>;
                          letUses: Map<string, Ty[]>;
                        },
                        e: {
                          inferExpr: (
                            a: Expr,
                            b: {
                              tv: Map<number, Ty>;
                              rv: Map<number, Row>;
                              next: number;
                              recorded: { span: Span; ty: Ty }[];
                              letSpans: Map<string, Span>;
                              letUses: Map<string, Ty[]>;
                            },
                          ) => Result<
                            [
                              Ty,
                              {
                                tv: Map<number, Ty>;
                                rv: Map<number, Row>;
                                next: number;
                                recorded: { span: Span; ty: Ty }[];
                                letSpans: Map<string, Span>;
                                letUses: Map<string, Ty[]>;
                              },
                            ],
                            MErr
                          >;
                          unify: (
                            a: Ty,
                            b: Ty,
                            c: {
                              tv: Map<number, Ty>;
                              rv: Map<number, Row>;
                              next: number;
                              recorded: { span: Span; ty: Ty }[];
                              letSpans: Map<string, Span>;
                              letUses: Map<string, Ty[]>;
                            },
                            d: Span,
                          ) => Result<
                            {
                              tv: Map<number, Ty>;
                              rv: Map<number, Row>;
                              next: number;
                              recorded: { span: Span; ty: Ty }[];
                              letSpans: Map<string, Span>;
                              letUses: Map<string, Ty[]>;
                            },
                            MErr
                          >;
                        },
                      ) => Result<
                        Option<
                          [
                            Ty,
                            {
                              tv: Map<number, Ty>;
                              rv: Map<number, Row>;
                              next: number;
                              recorded: { span: Span; ty: Ty }[];
                              letSpans: Map<string, Span>;
                              letUses: Map<string, Ty[]>;
                            },
                          ]
                        >,
                        MErr
                      >
                    >;
                  }[]
                >,
              ),
            )
              .with(
                { _tag: "Err" },
                ({ error: e }) =>
                  Err(e) as Result<
                    {
                      exportsByPath: Map<
                        string,
                        Map<string, { vars: number[]; rvars: number[]; ty: Ty }>
                      >;
                      regByPath: Map<string, Registry>;
                      keysByPath: Map<string, Map<string, string[]>>;
                      qualsByPath: Map<
                        string,
                        {
                          types: Set<string>;
                          aliases: Map<
                            string,
                            { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> }
                          >;
                        }
                      >;
                      outputs: { path: string; js: string }[];
                    },
                    MErr
                  >,
              )
              .with({ _tag: "Ok" }, ({ value: env }) =>
                ((js: string) =>
                  Ok({
                    exportsByPath: _Map_set(
                      loaded.path,
                      exportedSchemes(loaded.stmts, env),
                      ctx.exportsByPath,
                    ),
                    regByPath: _Map_set(loaded.path, exportedRegistry(loaded.stmts), ctx.regByPath),
                    keysByPath: _Map_set(
                      loaded.path,
                      exportedCtorKeys(loaded.stmts),
                      ctx.keysByPath,
                    ),
                    qualsByPath: _Map_set(loaded.path, qualScopeOf(loaded.stmts), ctx.qualsByPath),
                    outputs: [...ctx.outputs, { path: loaded.path, js: js }],
                  }) as Result<
                    {
                      exportsByPath: Map<
                        string,
                        Map<string, { vars: number[]; rvars: number[]; ty: Ty }>
                      >;
                      regByPath: Map<string, Registry>;
                      keysByPath: Map<string, Map<string, string[]>>;
                      qualsByPath: Map<
                        string,
                        {
                          types: Set<string>;
                          aliases: Map<
                            string,
                            { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> }
                          >;
                        }
                      >;
                      outputs: { path: string; js: string }[];
                    },
                    MErr
                  >)(
                  codegen(
                    loaded.stmts,
                    res.keys,
                    true,
                    namespaceRuntime,
                    preludeJsDefs,
                    runtimeDeps,
                  ),
                ),
              )
              .exhaustive(),
          )
          .exhaustive(),
      )
      .exhaustive(),
);
const compileAll: _Curry<
  [
    ctx: {
      outputs: { path: string; js: string }[];
      exportsByPath: Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<
        string,
        {
          types: Set<string>;
          aliases: Map<string, { expr: Option<TypeExpr>; fields: AliasField[]; params: string[] }>;
        }
      >;
    },
    graph: Loaded[],
  ],
  Result<{ path: string; js: string }[], MErr>
> = _curry(
  2,
  (
    ctx: {
      outputs: { path: string; js: string }[];
      exportsByPath: Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<
        string,
        {
          types: Set<string>;
          aliases: Map<string, { expr: Option<TypeExpr>; fields: AliasField[]; params: string[] }>;
        }
      >;
    },
    graph: Loaded[],
  ) =>
    match(graph)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(ctx.outputs) as Result<{ path: string; js: string }[], MErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([m, ...rest]) =>
          match(compileOne(ctx, m))
            .with(
              { _tag: "Err" },
              ({ error: e }) => Err(e) as Result<{ path: string; js: string }[], MErr>,
            )
            .with({ _tag: "Ok" }, ({ value: ctx1 }) => compileAll(ctx1, rest))
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * compileGraph : [Loaded] -> Result [ModuleOutput] MErr
 * Spelled out (not point-free `compileAll(ctx0)`): the TS backend types a
 * multi-param function uncurried, so a partial application is a tsc error.
 */
export const compileGraph: (graph: Loaded[]) => Result<{ path: string; js: string }[], MErr> = (
  graph: Loaded[],
) =>
  compileAll(
    {
      exportsByPath: new Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>(),
      regByPath: new Map<string, Registry>(),
      keysByPath: new Map<string, Map<string, string[]>>(),
      qualsByPath: new Map<
        string,
        {
          types: Set<string>;
          aliases: Map<string, { expr: Option<TypeExpr>; fields: AliasField[]; params: string[] }>;
        }
      >(),
      outputs: [] as { path: string; js: string }[],
    },
    graph,
  );
/**
 * buildModules : string -> Result [ModuleOutput] MErr
 * Resolve the graph then compile it — one sync railway (host IO is sync).
 */
export const buildModules: (entry: string) => Result<{ path: string; js: string }[], MErr> = (
  entry: string,
) => _Result_flatMap((graph) => compileGraph(graph), loadGraph(entry));
import { relSpec as $relSpec } from "./host.mjs";
const relSpec = _curry(2, $relSpec);
import { externDtsPath as $externDtsPath } from "./host.mjs";
const externDtsPath = _curry(2, $externDtsPath);
const isIdentChar: (c: string) => boolean = (c: string) =>
  match(_Str_codeAt(0, c))
    .with({ _tag: "None" }, () => false)
    .with({ _tag: "Some" }, ({ value: n }) =>
      or(
        or(
          or(
            or(and(gte(n, 48), lte(n, 57)), and(gte(n, 65), lte(n, 90))),
            and(gte(n, 97), lte(n, 122)),
          ),
          eq(n, 95),
        ),
        eq(n, 36),
      ),
    )
    .exhaustive();
const endsAtBoundary: (part: string) => boolean = (part: string) =>
  eq(_Str_length(part), 0)
    ? true
    : not(isIdentChar(_Option_unwrapOr("", _Str_get(sub(_Str_length(part), 1), part))));
const startsAtBoundary: (part: string) => boolean = (part: string) =>
  eq(_Str_length(part), 0) ? true : not(isIdentChar(_Option_unwrapOr("", _Str_get(0, part))));
const occursAsWordFrom: _Curry<[parts: string[], i: number], boolean> = _curry(
  2,
  (parts: string[], i: number) =>
    match(_Array_get(i, parts))
      .with({ _tag: "None" }, () => false)
      .with({ _tag: "Some" }, ({ value: after }) =>
        and(
          _Option_mapOr(false, endsAtBoundary, _Array_get(sub(i, 1), parts)),
          startsAtBoundary(after),
        )
          ? true
          : occursAsWordFrom(parts, add(i, 1)),
      )
      .exhaustive(),
);
const occursAsWord: _Curry<[name: string, text: string], boolean> = _curry(
  2,
  (name: string, text: string) => occursAsWordFrom(_Str_split(name, text), 1),
);
const importedBinding: (spec: string) => string = (spec: string) => {
  const parts: string[] = _Str_split(" as ", spec);
  return _Str_trim(_Option_unwrapOr(spec, _Array_get(sub(length(parts), 1), parts)));
};
const bindingsInLine: _Curry<[line: string, acc: Set<string>], Set<string>> = _curry(
  2,
  (line: string, acc: Set<string>) =>
    match(_Array_get(1, _Str_split("{", line)))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: rest }) =>
        match(_Array_get(0, _Str_split("}", rest)))
          .with({ _tag: "None" }, () => acc)
          .with({ _tag: "Some" }, ({ value: names }) =>
            reduce(
              _curry(2, (a: Set<string>, n: string) => _Set_add(importedBinding(n), a)),
              acc,
              _Str_split(",", names),
            ),
          )
          .exhaustive(),
      )
      .exhaustive(),
);
const valueImported: (ts: string) => Set<string> = (ts: string) =>
  reduce(
    _curry(2, (acc: Set<string>, line: string) => bindingsInLine(line, acc)),
    _Set_fromArray([] as string[]),
    filter(_Str_startsWith("import {"), _Str_split("\n", ts)),
  );
const ownTypesInto: <A>(stmts: Stmt[], path: A, acc: Map<string, A>) => Map<string, A> = _curry(
  3,
  <A>(stmts: Stmt[], path: A, acc: Map<string, A>) =>
    reduce(
      _curry(2, (a: Map<string, A>, s: Stmt) =>
        match(s)
          .with({ _tag: "SType" }, ({ name }) => _Map_set(name, path, a))
          .otherwise(() => a),
      ),
      acc,
      stmts,
    ),
);
const typeOwnerOf: <A, B>(graph: ({ stmts: Stmt[]; path: A } & B)[]) => Map<string, A> = <A, B>(
  graph: ({ stmts: Stmt[]; path: A } & B)[],
) =>
  reduce(
    _curry(2, (acc: Map<string, A>, m: { stmts: Stmt[]; path: A } & B) =>
      ownTypesInto(m.stmts, m.path, acc),
    ),
    new Map<string, A>(),
    graph,
  );
const localTypeNames: (stmts: Stmt[]) => Set<string> = (stmts: Stmt[]) =>
  _Set_fromArray(
    _Array_flatMap(
      (s: Stmt) =>
        match(s)
          .with({ _tag: "SType" }, ({ name }) => [name])
          .otherwise(() => [] as string[]),
      stmts,
    ),
  );
const groupByOwner: <A>(
  names: string[],
  ctx: {
    typeOwner: Map<string, string>;
    importer: string;
    localTypes: Set<string>;
    bound: Set<string>;
    ts: string;
  } & A,
) => Map<string, string[]> = _curry(
  2,
  <A>(
    names: string[],
    ctx: {
      typeOwner: Map<string, string>;
      importer: string;
      localTypes: Set<string>;
      bound: Set<string>;
      ts: string;
    } & A,
  ) =>
    reduce(
      _curry(2, (acc: Map<string, string[]>, name: string) => {
        const owner: string = _Map_getOr("", name, ctx.typeOwner);
        return or(
          or(
            or(eq(owner, ctx.importer), _Set_has(name, ctx.localTypes)),
            _Set_has(name, ctx.bound),
          ),
          not(occursAsWord(name, ctx.ts)),
        )
          ? acc
          : ((spec: string) =>
              _Map_set(spec, _Array_append(name, _Map_getOr([] as string[], spec, acc)), acc))(
              relSpec(ctx.importer, owner),
            );
      }),
      new Map<string, string[]>(),
      names,
    ),
);
/**
 * `import type { … }` lines for every non-local type name the EMITTED text
 * references, grouped by declaring module. Builtin variants never appear in
 * `typeOwner` — the emitter inlines their decls instead (ADR 0031).
 */
const crossModuleTypeImports: _Curry<
  [ts: string, importer: string, localTypes: Set<string>, typeOwner: Map<string, string>],
  string[]
> = _curry(
  4,
  (ts: string, importer: string, localTypes: Set<string>, typeOwner: Map<string, string>) => {
    const byOwner: Map<string, string[]> = groupByOwner(_Map_keys(typeOwner), {
      ts: ts,
      importer: importer,
      localTypes: localTypes,
      typeOwner: typeOwner,
      bound: valueImported(ts),
    });
    return map(
      (spec: string) =>
        `import type { ${_Str_join(", ", _Array_sort(_Map_getOr([] as string[], spec, byOwner)))} } from "${spec}";`,
      _Map_keys(byOwner),
    );
  },
);
const externBindingsInto: <A>(
  stmts: Stmt[],
  path: string,
  env: Map<string, A>,
  acc: Map<string, { imported: string; scheme: A; curried: boolean }[]>,
) => Map<string, { imported: string; scheme: A; curried: boolean }[]> = _curry(
  4,
  <A>(
    stmts: Stmt[],
    path: string,
    env: Map<string, A>,
    acc: Map<string, { imported: string; scheme: A; curried: boolean }[]>,
  ) =>
    reduce(
      _curry(2, (a: Map<string, { imported: string; scheme: A; curried: boolean }[]>, s: Stmt) =>
        match(s)
          .with({ _tag: "SExtern" }, ({ name, module: hostModule, imported, curried }) =>
            _Str_startsWith("mochi:", hostModule)
              ? a
              : match(_Map_get(name, env))
                  .with({ _tag: "None" }, () => a)
                  .with({ _tag: "Some" }, ({ value: sc }) =>
                    ((dp: string) =>
                      _Map_set(
                        dp,
                        _Array_append(
                          { imported: imported, scheme: sc, curried: curried },
                          _Map_getOr(
                            [] as { imported: string; scheme: A; curried: boolean }[],
                            dp,
                            a,
                          ),
                        ),
                        a,
                      ))(externDtsPath(path, hostModule)),
                  )
                  .exhaustive(),
          )
          .otherwise(() => a),
      ),
      acc,
      stmts,
    ),
);
const compileOneTs: <A, B>(
  ctx: {
    exportsByPath: Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<
      string,
      {
        types: Set<string>;
        aliases: Map<string, { expr: Option<TypeExpr>; fields: AliasField[]; params: string[] }>;
      }
    >;
    runtimeImport: string;
    typeOwner: Map<string, string>;
    outputs: { path: string; js: string }[];
    externs: Map<
      string,
      { imported: string; scheme: { vars: number[]; rvars: number[]; ty: Ty }; curried: boolean }[]
    >;
  } & A,
  loaded: { stmts: Stmt[]; path: string } & B,
) => Result<
  {
    exportsByPath: Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<
      string,
      {
        types: Set<string>;
        aliases: Map<string, { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> }>;
      }
    >;
    typeOwner: Map<string, string>;
    runtimeImport: string;
    externs: Map<
      string,
      { imported: string; scheme: { vars: number[]; rvars: number[]; ty: Ty }; curried: boolean }[]
    >;
    outputs: { path: string; js: string }[];
  },
  MErr
> = _curry(
  2,
  <A, B>(
    ctx: {
      exportsByPath: Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<
        string,
        {
          types: Set<string>;
          aliases: Map<string, { expr: Option<TypeExpr>; fields: AliasField[]; params: string[] }>;
        }
      >;
      runtimeImport: string;
      typeOwner: Map<string, string>;
      outputs: { path: string; js: string }[];
      externs: Map<
        string,
        {
          imported: string;
          scheme: { vars: number[]; rvars: number[]; ty: Ty };
          curried: boolean;
        }[]
      >;
    } & A,
    loaded: { stmts: Stmt[]; path: string } & B,
  ) =>
    match(
      resolveImportsFrom(ctx, loaded.stmts, 0, loaded.path, {
        imports: new Map<string, { vars: number[]; rvars: number[]; ty: Ty }>(),
        nsImports: new Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>(),
        reg: emptyReg,
        keys: new Map<string, string[]>(),
        quals: new Map<
          string,
          {
            types: Set<string>;
            aliases: Map<
              string,
              { expr: Option<TypeExpr>; fields: AliasField[]; params: string[] }
            >;
          }
        >(),
      }),
    )
      .with(
        { _tag: "Err" },
        ({ error: e }) =>
          Err(e) as Result<
            {
              exportsByPath: Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>;
              regByPath: Map<string, Registry>;
              keysByPath: Map<string, Map<string, string[]>>;
              qualsByPath: Map<
                string,
                {
                  types: Set<string>;
                  aliases: Map<
                    string,
                    { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> }
                  >;
                }
              >;
              typeOwner: Map<string, string>;
              runtimeImport: string;
              externs: Map<
                string,
                {
                  imported: string;
                  scheme: { vars: number[]; rvars: number[]; ty: Ty };
                  curried: boolean;
                }[]
              >;
              outputs: { path: string; js: string }[];
            },
            MErr
          >,
      )
      .with({ _tag: "Ok" }, ({ value: res }) =>
        match(checkWith(loaded.stmts, res.reg, res.quals))
          .with(
            { _tag: "Err" },
            ({ error: e }) =>
              Err(e) as Result<
                {
                  exportsByPath: Map<
                    string,
                    Map<string, { vars: number[]; rvars: number[]; ty: Ty }>
                  >;
                  regByPath: Map<string, Registry>;
                  keysByPath: Map<string, Map<string, string[]>>;
                  qualsByPath: Map<
                    string,
                    {
                      types: Set<string>;
                      aliases: Map<
                        string,
                        { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> }
                      >;
                    }
                  >;
                  typeOwner: Map<string, string>;
                  runtimeImport: string;
                  externs: Map<
                    string,
                    {
                      imported: string;
                      scheme: { vars: number[]; rvars: number[]; ty: Ty };
                      curried: boolean;
                    }[]
                  >;
                  outputs: { path: string; js: string }[];
                },
                MErr
              >,
          )
          .with({ _tag: "Ok" }, () =>
            match(
              inferProgramImportsTypes(
                loaded.stmts,
                builtins,
                namespaces,
                true,
                res.imports,
                res.nsImports,
                res.quals,
                None as Option<
                  {
                    name: string;
                    parse: Option<
                      (
                        a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
                        b: number,
                        c: (
                          a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
                          b: number,
                        ) => Result<[Expr, number], MErr>,
                      ) => Result<Option<[Expr, number]>, MErr>
                    >;
                    inferCall: Option<
                      (
                        a: Expr,
                        b: Expr[],
                        c: Option<string>,
                        d: {
                          tv: Map<number, Ty>;
                          rv: Map<number, Row>;
                          next: number;
                          recorded: { span: Span; ty: Ty }[];
                          letSpans: Map<string, Span>;
                          letUses: Map<string, Ty[]>;
                        },
                        e: {
                          inferExpr: (
                            a: Expr,
                            b: {
                              tv: Map<number, Ty>;
                              rv: Map<number, Row>;
                              next: number;
                              recorded: { span: Span; ty: Ty }[];
                              letSpans: Map<string, Span>;
                              letUses: Map<string, Ty[]>;
                            },
                          ) => Result<
                            [
                              Ty,
                              {
                                tv: Map<number, Ty>;
                                rv: Map<number, Row>;
                                next: number;
                                recorded: { span: Span; ty: Ty }[];
                                letSpans: Map<string, Span>;
                                letUses: Map<string, Ty[]>;
                              },
                            ],
                            MErr
                          >;
                          unify: (
                            a: Ty,
                            b: Ty,
                            c: {
                              tv: Map<number, Ty>;
                              rv: Map<number, Row>;
                              next: number;
                              recorded: { span: Span; ty: Ty }[];
                              letSpans: Map<string, Span>;
                              letUses: Map<string, Ty[]>;
                            },
                            d: Span,
                          ) => Result<
                            {
                              tv: Map<number, Ty>;
                              rv: Map<number, Row>;
                              next: number;
                              recorded: { span: Span; ty: Ty }[];
                              letSpans: Map<string, Span>;
                              letUses: Map<string, Ty[]>;
                            },
                            MErr
                          >;
                        },
                      ) => Result<
                        Option<
                          [
                            Ty,
                            {
                              tv: Map<number, Ty>;
                              rv: Map<number, Row>;
                              next: number;
                              recorded: { span: Span; ty: Ty }[];
                              letSpans: Map<string, Span>;
                              letUses: Map<string, Ty[]>;
                            },
                          ]
                        >,
                        MErr
                      >
                    >;
                  }[]
                >,
              ),
            )
              .with(
                { _tag: "Err" },
                ({ error: e }) =>
                  Err(e) as Result<
                    {
                      exportsByPath: Map<
                        string,
                        Map<string, { vars: number[]; rvars: number[]; ty: Ty }>
                      >;
                      regByPath: Map<string, Registry>;
                      keysByPath: Map<string, Map<string, string[]>>;
                      qualsByPath: Map<
                        string,
                        {
                          types: Set<string>;
                          aliases: Map<
                            string,
                            { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> }
                          >;
                        }
                      >;
                      typeOwner: Map<string, string>;
                      runtimeImport: string;
                      externs: Map<
                        string,
                        {
                          imported: string;
                          scheme: { vars: number[]; rvars: number[]; ty: Ty };
                          curried: boolean;
                        }[]
                      >;
                      outputs: { path: string; js: string }[];
                    },
                    MErr
                  >,
              )
              .with({ _tag: "Ok" }, ({ value: r }) =>
                ((body: string) =>
                  ((lines: string[]) =>
                    ((ts: string) =>
                      Ok({
                        exportsByPath: _Map_set(
                          loaded.path,
                          exportedSchemes(loaded.stmts, r.env),
                          ctx.exportsByPath,
                        ),
                        regByPath: _Map_set(
                          loaded.path,
                          exportedRegistry(loaded.stmts),
                          ctx.regByPath,
                        ),
                        keysByPath: _Map_set(
                          loaded.path,
                          exportedCtorKeys(loaded.stmts),
                          ctx.keysByPath,
                        ),
                        qualsByPath: _Map_set(
                          loaded.path,
                          qualScopeOf(loaded.stmts),
                          ctx.qualsByPath,
                        ),
                        typeOwner: ctx.typeOwner,
                        runtimeImport: ctx.runtimeImport,
                        externs: externBindingsInto(loaded.stmts, loaded.path, r.env, ctx.externs),
                        outputs: [...ctx.outputs, { path: loaded.path, js: ts }],
                      }) as Result<
                        {
                          exportsByPath: Map<
                            string,
                            Map<string, { vars: number[]; rvars: number[]; ty: Ty }>
                          >;
                          regByPath: Map<string, Registry>;
                          keysByPath: Map<string, Map<string, string[]>>;
                          qualsByPath: Map<
                            string,
                            {
                              types: Set<string>;
                              aliases: Map<
                                string,
                                { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> }
                              >;
                            }
                          >;
                          typeOwner: Map<string, string>;
                          runtimeImport: string;
                          externs: Map<
                            string,
                            {
                              imported: string;
                              scheme: { vars: number[]; rvars: number[]; ty: Ty };
                              curried: boolean;
                            }[]
                          >;
                          outputs: { path: string; js: string }[];
                        },
                        MErr
                      >)(
                      eq(length(lines), 0)
                        ? body
                        : `${_Str_join("\n", lines)}

${body}`,
                    ))(
                    crossModuleTypeImports(
                      body,
                      loaded.path,
                      localTypeNames(loaded.stmts),
                      ctx.typeOwner,
                    ),
                  ))(
                  emitTsModule(
                    loaded.stmts,
                    r.env,
                    r.types,
                    r.letParams,
                    r.aliases,
                    res.keys,
                    [] as string[],
                    namespaceRuntime,
                    preludeJsDefs,
                    runtimeDeps,
                    ctx.runtimeImport,
                  ),
                ),
              )
              .exhaustive(),
          )
          .exhaustive(),
      )
      .exhaustive(),
);
const noAliases: Map<string, { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> }> =
  aliasesOf([] as Stmt[]);
const externOutputs: <A, B, C>(
  externs: Map<A, ({ scheme: { ty: Ty } & B; imported: string; curried: boolean } & C)[]>,
) => { path: A; js: string }[] = <A, B, C>(
  externs: Map<A, ({ scheme: { ty: Ty } & B; imported: string; curried: boolean } & C)[]>,
) =>
  map(
    (dp: A) => ({
      path: dp,
      js: externModuleDts(
        _Map_getOr(
          [] as ({ scheme: { ty: Ty } & B; imported: string; curried: boolean } & C)[],
          dp,
          externs,
        ),
        noAliases,
      ),
    }),
    _Map_keys(externs),
  );
const compileAllTs: <A>(
  ctx: {
    outputs: { path: string; js: string }[];
    externs: Map<
      string,
      { scheme: { ty: Ty; vars: number[]; rvars: number[] }; imported: string; curried: boolean }[]
    >;
    exportsByPath: Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<
      string,
      {
        types: Set<string>;
        aliases: Map<string, { expr: Option<TypeExpr>; fields: AliasField[]; params: string[] }>;
      }
    >;
    runtimeImport: string;
    typeOwner: Map<string, string>;
  },
  graph: ({ stmts: Stmt[]; path: string } & A)[],
) => Result<{ path: string; js: string }[], MErr> = _curry(
  2,
  <A>(
    ctx: {
      outputs: { path: string; js: string }[];
      externs: Map<
        string,
        {
          scheme: { ty: Ty; vars: number[]; rvars: number[] };
          imported: string;
          curried: boolean;
        }[]
      >;
      exportsByPath: Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<
        string,
        {
          types: Set<string>;
          aliases: Map<string, { expr: Option<TypeExpr>; fields: AliasField[]; params: string[] }>;
        }
      >;
      runtimeImport: string;
      typeOwner: Map<string, string>;
    },
    graph: ({ stmts: Stmt[]; path: string } & A)[],
  ) =>
    match(graph)
      .with(
        (_v) => _v.length === 0,
        () =>
          Ok(_Array_concat(ctx.outputs, externOutputs(ctx.externs))) as Result<
            { path: string; js: string }[],
            MErr
          >,
      )
      .with(
        (_v) => _v.length >= 1,
        ([m, ...rest]) =>
          match(compileOneTs(ctx, m))
            .with(
              { _tag: "Err" },
              ({ error: e }) => Err(e) as Result<{ path: string; js: string }[], MErr>,
            )
            .with({ _tag: "Ok" }, ({ value: ctx1 }) => compileAllTs(ctx1, rest))
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * compileGraphTs : [Loaded] -> string -> Result [ModuleOutput] MErr
 * Emit the whole ordered graph as typed TypeScript (ADR 0090). Outputs are the
 * `.mochi` module paths (the writer swaps the extension) followed by the extern
 * sidecars, which already carry their own `.d.ts` / `.d.mts` extension.
 */
export const compileGraphTs: <A>(
  graph: ({ stmts: Stmt[]; path: string } & A)[],
  runtimeImport: string,
) => Result<{ path: string; js: string }[], MErr> = _curry(
  2,
  <A>(graph: ({ stmts: Stmt[]; path: string } & A)[], runtimeImport: string) =>
    compileAllTs(
      {
        exportsByPath: new Map<string, Map<string, { vars: number[]; rvars: number[]; ty: Ty }>>(),
        regByPath: new Map<string, Registry>(),
        keysByPath: new Map<string, Map<string, string[]>>(),
        qualsByPath: new Map<
          string,
          {
            types: Set<string>;
            aliases: Map<
              string,
              { expr: Option<TypeExpr>; fields: AliasField[]; params: string[] }
            >;
          }
        >(),
        typeOwner: typeOwnerOf(graph),
        runtimeImport: runtimeImport,
        externs: new Map<
          string,
          {
            scheme: { ty: Ty; vars: number[]; rvars: number[] };
            imported: string;
            curried: boolean;
          }[]
        >(),
        outputs: [] as { path: string; js: string }[],
      },
      graph,
    ),
);
/**
 * buildModulesTs : string -> string -> Result [ModuleOutput] MErr
 */
export const buildModulesTs: _Curry<
  [entry: string, runtimeImport: string],
  Result<{ path: string; js: string }[], MErr>
> = _curry(2, (entry: string, runtimeImport: string) =>
  _Result_flatMap((graph) => compileGraphTs(graph, runtimeImport), loadGraph(entry)),
);
