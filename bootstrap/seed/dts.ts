import type { Tok } from "./lexer";
import type { AliasField, Ctor, CtorField, Expr, Span, Stmt, TypeExpr } from "./ast";
import type { Row, St, Ty, TypeAt } from "./types";
import type { Doc } from "./doc";
import type { FormatApi } from "./format-api";
import type { Scheme } from "./schemes";
import type { IErr, InferApi, QualAliasInfo, TsApi } from "./infer";
import type { StageErr, Stamped } from "./compile";

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Ok,
  Some,
  _Array_concat,
  _Array_contains,
  _Array_get,
  _Array_prepend,
  _Map_get,
  _Map_getOr,
  _Map_has,
  _Map_keys,
  _Map_set,
  _Option_unwrapOr,
  _Result_map,
  _Set_add,
  _Set_fromArray,
  _Set_has,
  _Set_toArray,
  _Str_contains,
  _Str_endsWith,
  _Str_join,
  _Str_length,
  _Str_slice,
  _Str_startsWith,
  _curry,
  add,
  and,
  gt,
  length,
  map,
  not,
  or,
} from "@mochi/compiler/runtime";

import * as Ast from "./ast";
import { builtinTypeDecls } from "./ctors";
import {
  aliasTsDecl,
  bindingTsType,
  builtinTypeNamesFor,
  declaredTypeNames,
  nullaryLocalNames,
  recordAliasIndex,
  referencedCons,
  withoutAmbiguousAlias,
  opaqueTypeDecl,
  recordAliasDecl,
  tsApiFor,
  typeDecl,
  withoutOwnShape,
} from "./codegen-ts";
import {
  RowEmpty,
  RowExtend,
  RowVar,
  TyCon,
  TyFn,
  TyOneOf,
  TyRecord,
  TySingleton,
  TyVar,
} from "./types";
import { jsDoc } from "./codegen";
import { defaultOpts, typedProgramWith } from "./compile";
import { bindingHooksFor, dtsHooksFor, runDtsHooks } from "./extensions";
/**
 * Fold `D.Shape` written in this file back to a name the emitted `.d.ts` can
 * resolve, without needing the module graph: single-file dts sees the `tqual`
 * nodes even though it cannot see the dependency's exports.
 */
const writtenQualsIn: _Curry<
  [te: TypeExpr, local: Set<string>, acc: Map<string, string>],
  Map<string, string>
> = _curry(3, (te: TypeExpr, local: Set<string>, acc: Map<string, string>) =>
  ((_v) =>
    _v._tag === "TyName"
      ? acc
      : _v._tag === "TyLit"
        ? acc
        : _v._tag === "TyArrow"
          ? (({ from, to }) => writtenQualsIn(to, local, writtenQualsIn(from, local, acc)))(_v)
          : _v._tag === "TyApp"
            ? (({ args }) => writtenQualsInAll(args, local, acc, 0))(_v)
            : _v._tag === "TyTuple"
              ? (({ elems }) => writtenQualsInAll(elems, local, acc, 0))(_v)
              : _v._tag === "TyList"
                ? (({ elem }) => writtenQualsIn(elem, local, acc))(_v)
                : _v._tag === "TyUnion"
                  ? (({ members }) => writtenQualsInAll(members, local, acc, 0))(_v)
                  : _v._tag === "TyQual"
                    ? (({ alias, name, args }) =>
                        ((acc1: Map<string, string>) => writtenQualsInAll(args, local, acc1, 0))(
                          or(_Set_has(name, local), _Map_has(name, acc))
                            ? acc
                            : _Map_set(name, `${alias}.${name}`, acc),
                        ))(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(te),
);
const writtenQualsInAll: _Curry<
  [tes: TypeExpr[], local: Set<string>, acc: Map<string, string>, i: number],
  Map<string, string>
> = _curry(4, (tes: TypeExpr[], local: Set<string>, acc: Map<string, string>, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some"
        ? (({ value: te }) => writtenQualsInAll(tes, local, writtenQualsIn(te, local, acc), i + 1))(
            _v,
          )
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, tes)),
);
const ctorQualsFrom: _Curry<
  [ctors: Ctor[], local: Set<string>, acc: Map<string, string>, i: number],
  Map<string, string>
> = _curry(4, (ctors: Ctor[], local: Set<string>, acc: Map<string, string>, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some"
        ? (({ value: c }) =>
            ctorQualsFrom(
              ctors,
              local,
              writtenQualsInAll(
                map((f: CtorField) => f.fieldType, c.fields),
                local,
                acc,
                0,
              ),
              i + 1,
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, ctors)),
);
const writtenQualsFrom: _Curry<
  [stmts: Stmt[], local: Set<string>, acc: Map<string, string>, i: number],
  Map<string, string>
> = _curry(4, (stmts: Stmt[], local: Set<string>, acc: Map<string, string>, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some" && _v.value._tag === "SExtern"
        ? (({ value: { typeExpr: te } }) =>
            writtenQualsFrom(stmts, local, writtenQualsIn(te, local, acc), i + 1))(
            _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
              value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SExtern" }>;
            },
          )
        : _v._tag === "Some" && _v.value._tag === "SLet"
          ? (({ value: { annot } }) =>
              writtenQualsFrom(
                stmts,
                local,
                ((_v) =>
                  _v._tag === "None"
                    ? acc
                    : _v._tag === "Some"
                      ? (({ value: te }) => writtenQualsIn(te, local, acc))(_v)
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(annot),
                i + 1,
              ))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
              },
            )
          : _v._tag === "Some" && _v.value._tag === "SType"
            ? (({ value: { ctors, alias, aliasType } }) =>
                ((acc1: Map<string, string>) =>
                  ((acc2: Map<string, string>) =>
                    ((acc3: Map<string, string>) => writtenQualsFrom(stmts, local, acc3, i + 1))(
                      ((_v) =>
                        _v._tag === "None"
                          ? acc2
                          : _v._tag === "Some"
                            ? (({ value: te }) => writtenQualsIn(te, local, acc2))(_v)
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(aliasType),
                    ))(
                    ((_v) =>
                      _v._tag === "None"
                        ? acc1
                        : _v._tag === "Some"
                          ? (({ value: fields }) =>
                              writtenQualsInAll(
                                map((f: AliasField) => f.fieldType, fields),
                                local,
                                acc1,
                                0,
                              ))(_v)
                          : (() => {
                              throw new Error("non-exhaustive match");
                            })())(alias),
                  ))(ctorQualsFrom(ctors, local, acc, 0)))(
                _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                  value: Extract<
                    Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                    { _tag: "SType" }
                  >;
                },
              )
            : _v._tag === "Some"
              ? writtenQualsFrom(stmts, local, acc, i + 1)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(_Array_get(i, stmts)),
);
/**
 * `Shape` -> `D.Shape` for a type an `import * as D` brings into type position
 * (ADR 0046). Applied to inferred types before they print; the printers stay
 * qualification-free so the `.ts` backend is untouched.
 */
const qualifyRow: _Curry<[row: Row, qualify: Map<string, string>], Row> = _curry(
  2,
  (row: Row, qualify: Map<string, string>) =>
    ((_v) =>
      _v._tag === "RowEmpty"
        ? (RowEmpty as Row)
        : _v._tag === "RowVar"
          ? (({ id }) => RowVar(id))(_v)
          : _v._tag === "RowExtend"
            ? (({ label, fieldType, optional, rest }) =>
                RowExtend(
                  label,
                  qualifyTy(fieldType, qualify),
                  optional,
                  qualifyRow(rest, qualify),
                ))(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(row),
);
const qualifyTy: _Curry<[t: Ty, qualify: Map<string, string>], Ty> = _curry(
  2,
  (t: Ty, qualify: Map<string, string>) =>
    ((_v) =>
      _v._tag === "TyVar"
        ? (({ id }) => TyVar(id))(_v)
        : _v._tag === "TyCon"
          ? (({ name, args }) =>
              TyCon(
                _Map_getOr(name, name, qualify),
                map((a: Ty) => qualifyTy(a, qualify), args),
              ))(_v)
          : _v._tag === "TyFn"
            ? (({ from, to }) => TyFn(qualifyTy(from, qualify), qualifyTy(to, qualify)))(_v)
            : _v._tag === "TyRecord"
              ? (({ row }) => TyRecord(qualifyRow(row, qualify)))(_v)
              : _v._tag === "TySingleton"
                ? (({ base, value }) => TySingleton(base, value))(_v)
                : _v._tag === "TyOneOf"
                  ? (({ members }) => TyOneOf(map((m: Ty) => qualifyTy(m, qualify), members)))(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(t),
);
/**
 * The same rename on a written `TypeExpr` — ctor and alias field types print
 * from the AST, not from an inferred `Ty`.
 */
const qualifyTe: _Curry<[te: TypeExpr, qualify: Map<string, string>], TypeExpr> = _curry(
  2,
  (te: TypeExpr, qualify: Map<string, string>) =>
    ((_v) =>
      _v._tag === "TyName"
        ? (({ name, span }) => Ast.TyName(_Map_getOr(name, name, qualify), span))(_v)
        : _v._tag === "TyArrow"
          ? (({ from, to, span }) =>
              Ast.TyArrow(qualifyTe(from, qualify), qualifyTe(to, qualify), span))(_v)
          : _v._tag === "TyApp"
            ? (({ ctor, args, span }) =>
                Ast.TyApp(
                  _Map_getOr(ctor, ctor, qualify),
                  map((a: TypeExpr) => qualifyTe(a, qualify), args),
                  span,
                ))(_v)
            : _v._tag === "TyTuple"
              ? (({ elems, span }) =>
                  Ast.TyTuple(
                    map((e: TypeExpr) => qualifyTe(e, qualify), elems),
                    span,
                  ))(_v)
              : _v._tag === "TyList"
                ? (({ elem, span }) => Ast.TyList(qualifyTe(elem, qualify), span))(_v)
                : _v._tag === "TyQual"
                  ? (({ alias, name, nameSpan, args, span }) =>
                      Ast.TyQual(
                        alias,
                        name,
                        nameSpan,
                        map((a: TypeExpr) => qualifyTe(a, qualify), args),
                        span,
                      ))(_v)
                  : _v._tag === "TyLit"
                    ? (({ value, span }) => Ast.TyLit(value, span))(_v)
                    : _v._tag === "TyUnion"
                      ? (({ members, span }) =>
                          Ast.TyUnion(
                            map((m: TypeExpr) => qualifyTe(m, qualify), members),
                            span,
                          ))(_v)
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(te),
);
const qualifyField: _Curry<[f: CtorField, qualify: Map<string, string>], CtorField> = _curry(
  2,
  (f: CtorField, qualify: Map<string, string>) => ({
    name: f.name,
    fieldType: qualifyTe(f.fieldType, qualify),
  }),
);
const qualifyCtor: _Curry<[c: Ctor, qualify: Map<string, string>], Ctor> = _curry(
  2,
  (c: Ctor, qualify: Map<string, string>) => ({
    name: c.name,
    fields: map((f: CtorField) => qualifyField(f, qualify), c.fields),
    span: c.span,
  }),
);
const qualifyAliasField: _Curry<[f: AliasField, qualify: Map<string, string>], AliasField> = _curry(
  2,
  (f: AliasField, qualify: Map<string, string>) => ({
    name: f.name,
    nameSpan: f.nameSpan,
    fieldType: qualifyTe(f.fieldType, qualify),
    optional: f.optional,
  }),
);
/**
 * One `export`ed declaration per `type` statement. `codegen-ts`'s own walker
 * emits these module-locally for the `.ts` backend; a `.d.ts` exports them, and
 * an opaque `extern type` goes through `opaqueTypeDecl` for the same reason.
 */
const typeDeclsFrom: _Curry<
  [
    stmts: Stmt[],
    aliases: Map<string, QualAliasInfo>,
    recs: Map<string, string>,
    qualify: Map<string, string>,
    docs: boolean,
    i: number,
  ],
  string[]
> = _curry(
  6,
  (
    stmts: Stmt[],
    aliases: Map<string, QualAliasInfo>,
    recs: Map<string, string>,
    qualify: Map<string, string>,
    docs: boolean,
    i: number,
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some" && _v.value._tag === "SType"
          ? (({ value: { name, params, ctors, alias, aliasType, doc } }) =>
              ((rest: string[]) =>
                ((docComment: string) =>
                  ((_v) =>
                    _v._tag === "Some"
                      ? (({ value: fields }) =>
                          _Array_prepend(
                            `${docComment}${recordAliasDecl(
                              name,
                              params,
                              map((f: AliasField) => qualifyAliasField(f, qualify), fields),
                              aliases,
                              withoutOwnShape(fields, params, aliases, recs),
                            )}`,
                            rest,
                          ))(_v)
                      : _v._tag === "None"
                        ? ((_v) =>
                            _v._tag === "Some"
                              ? (({ value: te }) =>
                                  _Array_prepend(
                                    `${docComment}${aliasTsDecl(name, params, qualifyTe(te, qualify), aliases, recs)}`,
                                    rest,
                                  ))(_v)
                              : _v._tag === "None"
                                ? length(ctors) === 0
                                  ? _Array_prepend(`${docComment}${opaqueTypeDecl(name)}`, rest)
                                  : _Array_prepend(
                                      `${docComment}${typeDecl(
                                        name,
                                        params,
                                        map((c: Ctor) => qualifyCtor(c, qualify), ctors),
                                        aliases,
                                        recs,
                                      )}`,
                                      rest,
                                    )
                                : (() => {
                                    throw new Error("non-exhaustive match");
                                  })())(aliasType)
                        : (() => {
                            throw new Error("non-exhaustive match");
                          })())(alias))(docs ? jsDoc(doc) : ""))(
                typeDeclsFrom(stmts, aliases, recs, qualify, docs, i + 1),
              ))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
              },
            )
          : _v._tag === "Some"
            ? typeDeclsFrom(stmts, aliases, recs, qualify, docs, i + 1)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, stmts)),
);
/**
 * `export declare const` per top-level binding that has an inferred scheme.
 * `$`-prefixed synthetic binders declare nothing.
 * A plugin `dtsBinding` hook (ADR 0109) may supply the type text instead.
 */
const bindingDeclsFrom: <A>(
  stmts: Stmt[],
  env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>,
  recs: Map<string, string>,
  qualify: Map<string, string>,
  docs: boolean,
  dtsHooks: ((a: string, b: Expr, c: Ty, d: TsApi) => Option<string>)[],
  bindingHooks: ((a: Expr, b: Ty, c: TsApi) => Option<string>)[],
  i: number,
) => string[] = _curry(
  8,
  <A>(
    stmts: Stmt[],
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>,
    recs: Map<string, string>,
    qualify: Map<string, string>,
    docs: boolean,
    dtsHooks: ((a: string, b: Expr, c: Ty, d: TsApi) => Option<string>)[],
    bindingHooks: ((a: Expr, b: Ty, c: TsApi) => Option<string>)[],
    i: number,
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some" && _v.value._tag === "SLet"
          ? (({ value: { name, value, doc } }) =>
              ((rest: string[]) =>
                ((decl: (a: string) => string) =>
                  _Str_startsWith("$", name)
                    ? rest
                    : ((_v) =>
                        _v._tag === "None"
                          ? rest
                          : _v._tag === "Some"
                            ? (({ value: sc }) =>
                                ((ty: Ty) =>
                                  _Array_prepend(
                                    decl(
                                      _Option_unwrapOr(
                                        bindingTsType(
                                          { vars: sc.vars, rvars: sc.rvars, ty: ty },
                                          value,
                                          recs,
                                          bindingHooks,
                                        ),
                                        runDtsHooks(dtsHooks, name, value, ty, tsApiFor(recs)),
                                      ),
                                    ),
                                    rest,
                                  ))(qualifyTy(sc.ty, qualify)))(_v)
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(_Map_get(name, env)))(
                  (ts: string) => `${docs ? jsDoc(doc) : ""}export declare const ${name}: ${ts};`,
                ))(
                bindingDeclsFrom(stmts, env, recs, qualify, docs, dtsHooks, bindingHooks, i + 1),
              ))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
              },
            )
          : _v._tag === "Some"
            ? bindingDeclsFrom(stmts, env, recs, qualify, docs, dtsHooks, bindingHooks, i + 1)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, stmts)),
);
/**
 * A builtin variant named in an exported type (`Option<number>` from `Map.get`)
 * has to be DECLARED here — unlike the `.ts` backend, which imports it from the
 * runtime instead (ADR 0093).
 */
const builtinDeclsFor: _Curry<
  [names: string[], aliases: Map<string, QualAliasInfo>, recs: Map<string, string>, i: number],
  string[]
> = _curry(
  4,
  (names: string[], aliases: Map<string, QualAliasInfo>, recs: Map<string, string>, i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: bt }) =>
              ((rest: string[]) =>
                _Array_contains(bt.name, names)
                  ? _Array_prepend(typeDecl(bt.name, bt.params, bt.ctors, aliases, recs), rest)
                  : rest)(builtinDeclsFor(names, aliases, recs, i + 1)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, builtinTypeDecls)),
);
/**
 * Sidecar imports keep the `.mochi` specifier so `allowArbitraryExtensions`
 * maps `./shapes.mochi` onto `shapes.d.mochi.ts`. Package specs stay untouched.
 */
const mochiDtsSpec: (from: string) => string = (from: string) => {
  const bare: string = _Str_endsWith(".mochi", from)
    ? _Str_slice(0, _Str_length(from) - 6, from)
    : from;
  return or(_Str_startsWith("./", bare), _Str_startsWith("../", bare)) ? `${bare}.mochi` : from;
};
/**
 * `import type * as D from "./shapes.mochi"` for each namespace alias the body names.
 */
const nsTypeImportsFrom: _Curry<
  [stmts: Stmt[], body: string, seen: Set<string>, i: number],
  string[]
> = _curry(4, (stmts: Stmt[], body: string, seen: Set<string>, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some" && _v.value._tag === "SImportNs"
        ? (({ value: { alias, from } }) =>
            or(_Set_has(alias.name, seen), !_Str_contains(`${alias.name}.`, body))
              ? nsTypeImportsFrom(stmts, body, seen, i + 1)
              : _Array_prepend(
                  `import type * as ${alias.name} from "${mochiDtsSpec(from)}";`,
                  nsTypeImportsFrom(stmts, body, _Set_add(alias.name, seen), i + 1),
                ))(
            _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
              value: Extract<
                Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                { _tag: "SImportNs" }
              >;
            },
          )
        : _v._tag === "Some"
          ? nsTypeImportsFrom(stmts, body, seen, i + 1)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, stmts)),
);
/**
 * A `.d.ts` has no named-import pass. `recordAliasIndex` stores `bareName`,
 * so `Ast.Span` is printed as `Span` — a type this file never imports.
 * Blank every printed name the file does not itself declare; the row then
 * prints structurally. A local nullary alias stays, so `export type Span`
 * still names `Span` at use sites in the same file.
 */
const blankNonLocal: <A>(
  keys: A[],
  recs: Map<A, string>,
  locals: Set<string>,
  i: number,
) => Map<A, string> = _curry(
  4,
  <A>(keys: A[], recs: Map<A, string>, locals: Set<string>, i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? recs
        : _v._tag === "Some"
          ? (({ value: k }) =>
              ((_v) =>
                _v._tag === "None"
                  ? blankNonLocal(keys, recs, locals, i + 1)
                  : _v._tag === "Some"
                    ? (({ value: name }) =>
                        blankNonLocal(
                          keys,
                          and(name !== "", !_Set_has(name, locals)) ? _Map_set(k, "", recs) : recs,
                          locals,
                          i + 1,
                        ))(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(_Map_get(k, recs)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, keys)),
);
export const declarationRecs: _Curry<
  [stmts: Stmt[], aliases: Map<string, QualAliasInfo>],
  Map<string, string>
> = _curry(2, (stmts: Stmt[], aliases: Map<string, QualAliasInfo>) => {
  const locals: Set<string> = nullaryLocalNames(stmts, 0, _Set_fromArray([] as string[]));
  const indexed: Map<string, string> = recordAliasIndex(aliases);
  return blankNonLocal(
    _Map_keys(indexed),
    withoutAmbiguousAlias(indexed, aliases, locals),
    locals,
    0,
  );
});
/**
 * A recursive non-local alias cannot print structurally: the cycle hole is a
 * bare con (`Node`), and this file never imports that name. Point the hole at
 * the qualified spelling (`Ast.Node`) so the declaration keeps a reference the
 * `import type * as` line can resolve. Inference is unchanged — `aliasRow`
 * still falls back to the bare con.
 */
const qualConRecs: <A, B, C, D, E>(
  keys: A[],
  qualify: Map<A, B>,
  aliases: Map<B, { expr: Option<C>; fields: D[] } & E>,
  recs: Map<A, B>,
  i: number,
) => Map<A, B> = _curry(
  5,
  <A, B, C, D, E>(
    keys: A[],
    qualify: Map<A, B>,
    aliases: Map<B, { expr: Option<C>; fields: D[] } & E>,
    recs: Map<A, B>,
    i: number,
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? recs
        : _v._tag === "Some"
          ? (({ value: name }) =>
              qualConRecs(
                keys,
                qualify,
                aliases,
                ((_v) =>
                  _v._tag === "None"
                    ? recs
                    : _v._tag === "Some"
                      ? (({ value: qual }) =>
                          ((_v) =>
                            _v._tag === "None"
                              ? recs
                              : _v._tag === "Some"
                                ? (({ value: info }) =>
                                    ((_v) =>
                                      _v._tag === "Some"
                                        ? recs
                                        : _v._tag === "None"
                                          ? and(length(info.fields) > 0, !_Map_has(name, recs))
                                            ? _Map_set(name, qual, recs)
                                            : recs
                                          : (() => {
                                              throw new Error("non-exhaustive match");
                                            })())(info.expr))(_v)
                                : (() => {
                                    throw new Error("non-exhaustive match");
                                  })())(_Map_get(qual, aliases)))(_v)
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(_Map_get(name, qualify)),
                i + 1,
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, keys)),
);
/**
 * Emit `.d.ts` text from an already-typed program.
 */
export const emitDtsFromTypedWith: <A>(
  stmts: Stmt[],
  env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>,
  aliases: Map<string, QualAliasInfo>,
  qualify: Map<string, string>,
  runtimeImport: string,
  docs: boolean,
  dtsHooks: ((a: string, b: Expr, c: Ty, d: TsApi) => Option<string>)[],
  bindingHooks: ((a: Expr, b: Ty, c: TsApi) => Option<string>)[],
) => string = _curry(
  8,
  <A>(
    stmts: Stmt[],
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>,
    aliases: Map<string, QualAliasInfo>,
    qualify: Map<string, string>,
    runtimeImport: string,
    docs: boolean,
    dtsHooks: ((a: string, b: Expr, c: Ty, d: TsApi) => Option<string>)[],
    bindingHooks: ((a: Expr, b: Ty, c: TsApi) => Option<string>)[],
  ) => {
    const local: Set<string> = declaredTypeNames(stmts, 0, _Set_fromArray([] as string[]));
    const quals: Map<string, string> = writtenQualsFrom(stmts, local, qualify, 0);
    const recs: Map<string, string> = qualConRecs(
      _Map_keys(quals),
      quals,
      aliases,
      declarationRecs(stmts, aliases),
      0,
    );
    const types: string[] = typeDeclsFrom(stmts, aliases, recs, quals, docs, 0);
    const bindings: string[] = bindingDeclsFrom(
      stmts,
      env,
      recs,
      quals,
      docs,
      dtsHooks,
      bindingHooks,
      0,
    );
    const declared: Set<string> = declaredTypeNames(stmts, 0, _Set_fromArray([] as string[]));
    const wanted: Set<string> = referencedCons(stmts, env, 0, _Set_fromArray([] as string[]));
    const core: string = _Str_join("\n", _Array_concat(types, bindings));
    const builtinNames: string[] = builtinTypeNamesFor(declared, wanted, core, 0);
    const body: string = `${_Str_join("\n", _Array_concat(builtinDeclsFor(builtinNames, aliases, recs, 0), _Array_concat(types, bindings)))}
`;
    const curry: string[] = _Str_contains("_Curry<", body)
      ? [`import type { _Curry } from "${runtimeImport}";`]
      : ([] as string[]);
    const imports: string[] = _Array_concat(
      curry,
      nsTypeImportsFrom(stmts, body, _Set_fromArray([] as string[]), 0),
    );
    return length(imports) === 0
      ? body
      : `${_Str_join("\n", imports)}
${body}`;
  },
);
/**
 * `Shape` -> `D.Shape` for every type an `import * as D` brings into type
 * position (ADR 0046). A name the file declares itself wins — it is already
 * writable bare, and it shadows. First alias wins on a collision.
 */
const addQuals: _Curry<
  [alias: string, names: string[], local: Set<string>, acc: Map<string, string>, i: number],
  Map<string, string>
> = _curry(
  5,
  (alias: string, names: string[], local: Set<string>, acc: Map<string, string>, i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some"
          ? (({ value: name }) =>
              addQuals(
                alias,
                names,
                local,
                or(_Set_has(name, local), _Map_has(name, acc))
                  ? acc
                  : _Map_set(name, `${alias}.${name}`, acc),
                i + 1,
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, names)),
);
const qualsFromAliases: <A>(
  aliases: string[],
  quals: Map<string, { types: Set<string> } & A>,
  local: Set<string>,
  acc: Map<string, string>,
  i: number,
) => Map<string, string> = _curry(
  5,
  <A>(
    aliases: string[],
    quals: Map<string, { types: Set<string> } & A>,
    local: Set<string>,
    acc: Map<string, string>,
    i: number,
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some"
          ? (({ value: alias }) =>
              ((_v) =>
                _v._tag === "None"
                  ? qualsFromAliases(aliases, quals, local, acc, i + 1)
                  : _v._tag === "Some"
                    ? (({ value: scope }) =>
                        qualsFromAliases(
                          aliases,
                          quals,
                          local,
                          addQuals(alias, _Set_toArray(scope.types), local, acc, 0),
                          i + 1,
                        ))(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(_Map_get(alias, quals)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, aliases)),
);
/**
 * The graph's contribution to the qualify map: what each namespace alias
 * exports. `emitDtsFromTyped` merges this file's own written quals over it.
 */
export const qualifierMapOf: <A>(
  quals: Map<string, { types: Set<string> } & A>,
  local: Set<string>,
) => Map<string, string> = _curry(
  2,
  <A>(quals: Map<string, { types: Set<string> } & A>, local: Set<string>) =>
    qualsFromAliases(_Map_keys(quals), quals, local, new Map<string, string>(), 0),
);
/**
 * Source -> `.d.ts` text. Infers first; type errors surface as diagnostics.
 */
export const emitDtsFromTyped: <A>(
  stmts: Stmt[],
  env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>,
  aliases: Map<string, QualAliasInfo>,
  qualify: Map<string, string>,
  runtimeImport: string,
) => string = _curry(
  5,
  <A>(
    stmts: Stmt[],
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>,
    aliases: Map<string, QualAliasInfo>,
    qualify: Map<string, string>,
    runtimeImport: string,
  ) =>
    emitDtsFromTypedWith(
      stmts,
      env,
      aliases,
      qualify,
      runtimeImport,
      true,
      [] as ((a: string, b: Expr, c: Ty, d: TsApi) => Option<string>)[],
      bindingHooksFor(None),
    ),
);
/**
 * Source -> `.d.ts` text under caller options. Infers first; type errors
 * surface as diagnostics.
 */
export const emitDtsTextWith: _Curry<
  [
    src: string,
    runtimeImport: string,
    opts: {
      docs: boolean;
      plugins: Option<
        {
          name: string;
          parse: Option<
            (
              a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
              b: number,
              c: (
                a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
                b: number,
              ) => Result<[Expr, number], StageErr>,
            ) => Result<Option<[Expr, number]>, StageErr>
          >;
          inferCall: Option<
            (
              a: Expr,
              b: Expr[],
              c: Option<string>,
              d: St,
              e: InferApi,
            ) => Result<Option<[Ty, St]>, IErr>
          >;
          format: Option<(a: Expr) => Option<Expr>>;
          formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
          dtsBinding: Option<(a: string, b: Expr, c: Ty, d: TsApi) => Option<string>>;
          bindingType: Option<(a: Expr, b: Ty, c: TsApi) => Option<string>>;
        }[]
      >;
      open: boolean;
      runtime: boolean;
      moduleExt: string;
      strictEntry: boolean;
    },
  ],
  Result<string, Stamped[]>
> = _curry(
  3,
  (
    src: string,
    runtimeImport: string,
    opts: {
      docs: boolean;
      plugins: Option<
        {
          name: string;
          parse: Option<
            (
              a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
              b: number,
              c: (
                a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
                b: number,
              ) => Result<[Expr, number], StageErr>,
            ) => Result<Option<[Expr, number]>, StageErr>
          >;
          inferCall: Option<
            (
              a: Expr,
              b: Expr[],
              c: Option<string>,
              d: St,
              e: InferApi,
            ) => Result<Option<[Ty, St]>, IErr>
          >;
          format: Option<(a: Expr) => Option<Expr>>;
          formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
          dtsBinding: Option<(a: string, b: Expr, c: Ty, d: TsApi) => Option<string>>;
          bindingType: Option<(a: Expr, b: Ty, c: TsApi) => Option<string>>;
        }[]
      >;
      open: boolean;
      runtime: boolean;
      moduleExt: string;
      strictEntry: boolean;
    },
  ) =>
    _Result_map(
      ([stmts, r]: [
        Stmt[],
        {
          env: Map<string, Scheme>;
          aliases: Map<string, QualAliasInfo>;
          types: TypeAt[];
          letParams: TypeAt[];
        },
      ]) =>
        emitDtsFromTypedWith(
          stmts,
          r.env,
          r.aliases,
          new Map<string, string>(),
          runtimeImport,
          opts.docs,
          dtsHooksFor(opts.plugins),
          bindingHooksFor(opts.plugins),
        ),
      typedProgramWith(src, opts),
    ),
);
export const emitDtsText: _Curry<
  [src: string, runtimeImport: string],
  Result<string, Stamped[]>
> = _curry(2, (src: string, runtimeImport: string) =>
  emitDtsTextWith(src, runtimeImport, defaultOpts),
);
