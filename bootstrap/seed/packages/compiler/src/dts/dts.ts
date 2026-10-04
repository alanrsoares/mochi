import type { Tok } from "../lexer/lexer";
import type { AliasField, Ctor, CtorField, Expr, Span, Stmt, TypeExpr } from "../ast/ast";
import type { Row, St, Ty, TypeAt } from "../infer/types";
import type { Doc } from "../doc/doc";
import type { FormatApi } from "../format/format-api";
import type { Scheme } from "../infer/schemes";
import type { IErr, InferApi, TsApi } from "../infer/infer";
import type { StageErr, Stamped } from "../compile/compile";

/**
 * A declared alias as inference records it; a local copy of schemes.mochi's,
 * so the two unify structurally (ADR 0044).
 */
export type AliasInfo = { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> };

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Ok,
  Some,
  _Array_append,
  _Array_concat,
  _Array_contains,
  _Array_get,
  _Array_prepend,
  _Map_get,
  _Map_getOr,
  _Map_has,
  _Map_keys,
  _Map_set,
  _Option_isSome,
  _Option_match,
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
  reduce,
} from "@mochi/compiler/runtime";

import * as Ast from "../ast/ast";
import { builtinTypeDecls } from "../ast/ctors";
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
} from "../codegen/typescript";
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
} from "../infer/types";
import { jsDoc } from "../codegen/codegen";
import { foldAliasesAt } from "../infer/schemes";
import { defaultOpts, emitJsWith, emitTsWith, typedProgramWith } from "../compile/compile";
import { bindingHooksFor, dtsHooksFor, runDtsHooks } from "../extensions/extensions";
const writtenQualsIn$ = (
  te: TypeExpr,
  local: Set<string>,
  acc: Map<string, string>,
): Map<string, string> => {
  const $match = te;
  switch ($match._tag) {
    case "TyName": {
      return acc;
    }
    case "TyLit": {
      return acc;
    }
    case "TyArrow": {
      const { from, to } = $match;
      return writtenQualsIn$(to, local, writtenQualsIn$(from, local, acc));
    }
    case "TyApp": {
      const { args } = $match;
      return writtenQualsInAll$(args, local, acc, 0);
    }
    case "TyTuple": {
      const { elems } = $match;
      return writtenQualsInAll$(elems, local, acc, 0);
    }
    case "TyList": {
      const { elem } = $match;
      return writtenQualsIn$(elem, local, acc);
    }
    case "TyUnion": {
      const { members } = $match;
      return writtenQualsInAll$(members, local, acc, 0);
    }
    case "TyQual": {
      const { alias, name, args } = $match;
      const acc1: Map<string, string> = or(_Set_has(name, local), _Map_has(name, acc))
        ? acc
        : _Map_set(name, `${alias}.${name}`, acc);
      return writtenQualsInAll$(args, local, acc1, 0);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
/**
 * Fold `D.Shape` written in this file back to a name the emitted `.d.ts` can
 * resolve, without needing the module graph: single-file dts sees the `tqual`
 * nodes even though it cannot see the dependency's exports.
 */
const writtenQualsIn: _Curry<
  [te: TypeExpr, local: Set<string>, acc: Map<string, string>],
  Map<string, string>
> = _curry(3, writtenQualsIn$);
const writtenQualsInAll$ = (
  tes: TypeExpr[],
  local: Set<string>,
  acc: Map<string, string>,
  i: number,
): Map<string, string> =>
  _Option_match(
    _Array_get(i, tes),
    () => acc,
    (te) => writtenQualsInAll$(tes, local, writtenQualsIn$(te, local, acc), i + 1),
  );
const writtenQualsInAll: _Curry<
  [tes: TypeExpr[], local: Set<string>, acc: Map<string, string>, i: number],
  Map<string, string>
> = _curry(4, writtenQualsInAll$);
const ctorQualsFrom$ = (
  ctors: Ctor[],
  local: Set<string>,
  acc: Map<string, string>,
  i: number,
): Map<string, string> =>
  _Option_match(
    _Array_get(i, ctors),
    () => acc,
    (c) =>
      ctorQualsFrom$(
        ctors,
        local,
        writtenQualsInAll$(
          map((f: CtorField) => f.fieldType, c.fields),
          local,
          acc,
          0,
        ),
        i + 1,
      ),
  );
const ctorQualsFrom: _Curry<
  [ctors: Ctor[], local: Set<string>, acc: Map<string, string>, i: number],
  Map<string, string>
> = _curry(4, ctorQualsFrom$);
const writtenQualsFrom$ = (
  stmts: Stmt[],
  local: Set<string>,
  acc: Map<string, string>,
  i: number,
): Map<string, string> =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some" && _v.value._tag === "SExtern"
        ? (({ value: { typeExpr: te } }) =>
            writtenQualsFrom$(stmts, local, writtenQualsIn$(te, local, acc), i + 1))(
            _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
              value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SExtern" }>;
            },
          )
        : _v._tag === "Some" && _v.value._tag === "SLet"
          ? (({ value: { annot } }) =>
              writtenQualsFrom$(
                stmts,
                local,
                _Option_match(
                  annot,
                  () => acc,
                  (te) => writtenQualsIn$(te, local, acc),
                ),
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
                    ((acc3: Map<string, string>) => writtenQualsFrom$(stmts, local, acc3, i + 1))(
                      _Option_match(
                        aliasType,
                        () => acc2,
                        (te) => writtenQualsIn$(te, local, acc2),
                      ),
                    ))(
                    _Option_match(
                      alias,
                      () => acc1,
                      (fields) =>
                        writtenQualsInAll$(
                          map((f: AliasField) => f.fieldType, fields),
                          local,
                          acc1,
                          0,
                        ),
                    ),
                  ))(ctorQualsFrom$(ctors, local, acc, 0)))(
                _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                  value: Extract<
                    Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                    { _tag: "SType" }
                  >;
                },
              )
            : _v._tag === "Some"
              ? writtenQualsFrom$(stmts, local, acc, i + 1)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(_Array_get(i, stmts));
const writtenQualsFrom: _Curry<
  [stmts: Stmt[], local: Set<string>, acc: Map<string, string>, i: number],
  Map<string, string>
> = _curry(4, writtenQualsFrom$);
const qualifyRow$ = (row: Row, qualify: Map<string, string>): Row => {
  const $match = row;
  switch ($match._tag) {
    case "RowEmpty": {
      return RowEmpty as Row;
    }
    case "RowVar": {
      const { id } = $match;
      return RowVar(id);
    }
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return RowExtend(label, qualifyTy$(fieldType, qualify), optional, qualifyRow$(rest, qualify));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
/**
 * `Shape` -> `D.Shape` for a type an `import * as D` brings into type position
 * (ADR 0046). Applied to inferred types before they print; the printers stay
 * qualification-free so the `.ts` backend is untouched.
 */
const qualifyRow: _Curry<[row: Row, qualify: Map<string, string>], Row> = _curry(2, qualifyRow$);
const qualifyTy$ = (t: Ty, qualify: Map<string, string>): Ty => {
  const $match = t;
  switch ($match._tag) {
    case "TyVar": {
      const { id } = $match;
      return TyVar(id);
    }
    case "TyCon": {
      const { name, args } = $match;
      return TyCon(
        _Map_getOr(name, name, qualify),
        map((a: Ty) => qualifyTy$(a, qualify), args),
      );
    }
    case "TyFn": {
      const { from, to } = $match;
      return TyFn(qualifyTy$(from, qualify), qualifyTy$(to, qualify));
    }
    case "TyRecord": {
      const { row } = $match;
      return TyRecord(qualifyRow$(row, qualify));
    }
    case "TySingleton": {
      const { base, value } = $match;
      return TySingleton(base, value);
    }
    case "TyOneOf": {
      const { members } = $match;
      return TyOneOf(map((m: Ty) => qualifyTy$(m, qualify), members));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const qualifyTy: _Curry<[t: Ty, qualify: Map<string, string>], Ty> = _curry(2, qualifyTy$);
const qualifyTe$ = (te: TypeExpr, qualify: Map<string, string>): TypeExpr => {
  const $match = te;
  switch ($match._tag) {
    case "TyName": {
      const { name, span } = $match;
      return Ast.TyName(_Map_getOr(name, name, qualify), span);
    }
    case "TyArrow": {
      const { from, to, span } = $match;
      return Ast.TyArrow(qualifyTe$(from, qualify), qualifyTe$(to, qualify), span);
    }
    case "TyApp": {
      const { ctor, args, span } = $match;
      return Ast.TyApp(
        _Map_getOr(ctor, ctor, qualify),
        map((a: TypeExpr) => qualifyTe$(a, qualify), args),
        span,
      );
    }
    case "TyTuple": {
      const { elems, span } = $match;
      return Ast.TyTuple(
        map((e: TypeExpr) => qualifyTe$(e, qualify), elems),
        span,
      );
    }
    case "TyList": {
      const { elem, span } = $match;
      return Ast.TyList(qualifyTe$(elem, qualify), span);
    }
    case "TyQual": {
      const { alias, name, nameSpan, args, span } = $match;
      return Ast.TyQual(
        alias,
        name,
        nameSpan,
        map((a: TypeExpr) => qualifyTe$(a, qualify), args),
        span,
      );
    }
    case "TyLit": {
      const { value, span } = $match;
      return Ast.TyLit(value, span);
    }
    case "TyUnion": {
      const { members, span } = $match;
      return Ast.TyUnion(
        map((m: TypeExpr) => qualifyTe$(m, qualify), members),
        span,
      );
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
/**
 * The same rename on a written `TypeExpr` — ctor and alias field types print
 * from the AST, not from an inferred `Ty`.
 */
const qualifyTe: _Curry<[te: TypeExpr, qualify: Map<string, string>], TypeExpr> = _curry(
  2,
  qualifyTe$,
);
const qualifyField$ = (f: CtorField, qualify: Map<string, string>): CtorField => ({
  name: f.name,
  fieldType: qualifyTe$(f.fieldType, qualify),
});
const qualifyField: _Curry<[f: CtorField, qualify: Map<string, string>], CtorField> = _curry(
  2,
  qualifyField$,
);
const qualifyCtor$ = (c: Ctor, qualify: Map<string, string>): Ctor => ({
  name: c.name,
  fields: map((f: CtorField) => qualifyField$(f, qualify), c.fields),
  span: c.span,
});
const qualifyCtor: _Curry<[c: Ctor, qualify: Map<string, string>], Ctor> = _curry(2, qualifyCtor$);
const qualifyAliasField$ = (f: AliasField, qualify: Map<string, string>): AliasField => ({
  name: f.name,
  nameSpan: f.nameSpan,
  fieldType: qualifyTe$(f.fieldType, qualify),
  optional: f.optional,
});
const qualifyAliasField: _Curry<[f: AliasField, qualify: Map<string, string>], AliasField> = _curry(
  2,
  qualifyAliasField$,
);
const typeDeclsFrom$ = (
  stmts: Stmt[],
  aliases: Map<string, AliasInfo>,
  recs: Map<string, string>,
  qualify: Map<string, string>,
  docs: boolean,
  i: number,
): string[] =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some" && _v.value._tag === "SType"
        ? (({ value: { name, params, ctors, alias, aliasType, doc } }) =>
            ((rest: string[]) =>
              ((docComment: string) =>
                _Option_match(
                  alias,
                  () =>
                    _Option_match(
                      aliasType,
                      () =>
                        length(ctors) === 0
                          ? _Array_prepend(`${docComment}${opaqueTypeDecl(name)}`, rest)
                          : _Array_prepend(
                              `${docComment}${typeDecl(
                                name,
                                params,
                                map((c: Ctor) => qualifyCtor$(c, qualify), ctors),
                                aliases,
                                recs,
                              )}`,
                              rest,
                            ),
                      (te) =>
                        _Array_prepend(
                          `${docComment}${aliasTsDecl(name, params, qualifyTe$(te, qualify), aliases, recs)}`,
                          rest,
                        ),
                    ),
                  (fields) =>
                    _Array_prepend(
                      `${docComment}${recordAliasDecl(
                        name,
                        params,
                        map((f: AliasField) => qualifyAliasField$(f, qualify), fields),
                        aliases,
                        withoutOwnShape(fields, params, aliases, recs),
                      )}`,
                      rest,
                    ),
                ))(docs ? jsDoc(doc) : ""))(
              typeDeclsFrom$(stmts, aliases, recs, qualify, docs, i + 1),
            ))(
            _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
              value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
            },
          )
        : _v._tag === "Some"
          ? typeDeclsFrom$(stmts, aliases, recs, qualify, docs, i + 1)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, stmts));
/**
 * One `export`ed declaration per `type` statement. `typescript`'s own walker
 * emits these module-locally for the `.ts` backend; a `.d.ts` exports them, and
 * an opaque `extern type` goes through `opaqueTypeDecl` for the same reason.
 */
const typeDeclsFrom: _Curry<
  [
    stmts: Stmt[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    qualify: Map<string, string>,
    docs: boolean,
    i: number,
  ],
  string[]
> = _curry(6, typeDeclsFrom$);

const localAliasKeys$ = (stmts: Stmt[], i: number, acc: string[]): string[] =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some" && _v.value._tag === "SType"
        ? (({ value: { name, alias, aliasType } }) =>
            localAliasKeys$(
              stmts,
              i + 1,
              or(_Option_isSome(alias), _Option_isSome(aliasType)) ? _Array_append(name, acc) : acc,
            ))(
            _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
              value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
            },
          )
        : _v._tag === "Some"
          ? localAliasKeys$(stmts, i + 1, acc)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, stmts));
/**
 * The file's own aliases (record and expression forms), in declaration order
 * — the order `foldAliasesAt` tries them, as src/dts/dts.ts folds with the
 * inference result's local alias list.
 */
const localAliasKeys: _Curry<[stmts: Stmt[], i: number, acc: string[]], string[]> = _curry(
  3,
  localAliasKeys$,
);
/**
 * `export declare const` per top-level binding that has an inferred scheme.
 * `$`-prefixed synthetic binders declare nothing.
 * A plugin `dtsBinding` hook (ADR 0109) may supply the type text instead; it
 * sees the unfolded type. The fallback folds every local alias the type fits
 * (`{ value: number }` -> `Box<number>`), parametric ones included.
 */
const bindingDeclsFrom: <A>(
  stmts: Stmt[],
  env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>,
  aliases: Map<string, AliasInfo>,
  keys: string[],
  recs: Map<string, string>,
  qualify: Map<string, string>,
  docs: boolean,
  dtsHooks: ((a: string, b: Expr, c: Ty, d: TsApi) => Option<string>)[],
  bindingHooks: ((a: Expr, b: Ty, c: TsApi) => Option<string>)[],
  i: number,
) => string[] = _curry(
  10,
  <A>(
    stmts: Stmt[],
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>,
    aliases: Map<string, AliasInfo>,
    keys: string[],
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
                    : _Option_match(
                        _Map_get(name, env),
                        () => rest,
                        (sc) => {
                          const ty: Ty = qualifyTy$(sc.ty, qualify);
                          return _Array_prepend(
                            decl(
                              _Option_unwrapOr(
                                bindingTsType(
                                  {
                                    vars: sc.vars,
                                    rvars: sc.rvars,
                                    ty: foldAliasesAt(ty, keys, aliases),
                                  },
                                  value,
                                  recs,
                                  bindingHooks,
                                ),
                                runDtsHooks(dtsHooks, name, value, ty, tsApiFor(recs)),
                              ),
                            ),
                            rest,
                          );
                        },
                      ))(
                  (ts: string) => `${docs ? jsDoc(doc) : ""}export declare const ${name}: ${ts};`,
                ))(
                bindingDeclsFrom(
                  stmts,
                  env,
                  aliases,
                  keys,
                  recs,
                  qualify,
                  docs,
                  dtsHooks,
                  bindingHooks,
                  i + 1,
                ),
              ))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
              },
            )
          : _v._tag === "Some"
            ? bindingDeclsFrom(
                stmts,
                env,
                aliases,
                keys,
                recs,
                qualify,
                docs,
                dtsHooks,
                bindingHooks,
                i + 1,
              )
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, stmts)),
);
const builtinDeclsFor$ = (
  names: string[],
  aliases: Map<string, AliasInfo>,
  recs: Map<string, string>,
  i: number,
): string[] =>
  _Option_match(
    _Array_get(i, builtinTypeDecls),
    () => [] as string[],
    (bt) => {
      const rest: string[] = builtinDeclsFor$(names, aliases, recs, i + 1);
      return _Array_contains(bt.name, names)
        ? _Array_prepend(typeDecl(bt.name, bt.params, bt.ctors, aliases, recs), rest)
        : rest;
    },
  );
/**
 * A builtin variant named in an exported type (`Option<number>` from `Map.get`)
 * has to be DECLARED here — unlike the `.ts` backend, which imports it from the
 * runtime instead (ADR 0093).
 */
const builtinDeclsFor: _Curry<
  [names: string[], aliases: Map<string, AliasInfo>, recs: Map<string, string>, i: number],
  string[]
> = _curry(4, builtinDeclsFor$);
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
const nsTypeImportsFrom$ = (stmts: Stmt[], body: string, seen: Set<string>, i: number): string[] =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some" && _v.value._tag === "SImportNs"
        ? (({ value: { alias, from } }) =>
            or(_Set_has(alias.name, seen), !_Str_contains(`${alias.name}.`, body))
              ? nsTypeImportsFrom$(stmts, body, seen, i + 1)
              : _Array_prepend(
                  `import type * as ${alias.name} from "${mochiDtsSpec(from)}";`,
                  nsTypeImportsFrom$(stmts, body, _Set_add(alias.name, seen), i + 1),
                ))(
            _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
              value: Extract<
                Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                { _tag: "SImportNs" }
              >;
            },
          )
        : _v._tag === "Some"
          ? nsTypeImportsFrom$(stmts, body, seen, i + 1)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, stmts));
/**
 * `import type * as D from "./shapes.mochi"` for each namespace alias the body names.
 */
const nsTypeImportsFrom: _Curry<
  [stmts: Stmt[], body: string, seen: Set<string>, i: number],
  string[]
> = _curry(4, nsTypeImportsFrom$);
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
    _Option_match(
      _Array_get(i, keys),
      () => recs,
      (k) =>
        _Option_match(
          _Map_get(k, recs),
          () => blankNonLocal(keys, recs, locals, i + 1),
          (name) =>
            blankNonLocal(
              keys,
              and(name !== "", !_Set_has(name, locals)) ? _Map_set(k, "", recs) : recs,
              locals,
              i + 1,
            ),
        ),
    ),
);
const declarationRecs$ = (stmts: Stmt[], aliases: Map<string, AliasInfo>): Map<string, string> => {
  const locals: Set<string> = nullaryLocalNames(stmts, 0, _Set_fromArray([] as string[]));
  const indexed: Map<string, string> = recordAliasIndex(aliases);
  return blankNonLocal(
    _Map_keys(indexed),
    withoutAmbiguousAlias(indexed, aliases, locals),
    locals,
    0,
  );
};
export const declarationRecs: _Curry<
  [stmts: Stmt[], aliases: Map<string, AliasInfo>],
  Map<string, string>
> = _curry(2, declarationRecs$);
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
    _Option_match(
      _Array_get(i, keys),
      () => recs,
      (name) =>
        qualConRecs(
          keys,
          qualify,
          aliases,
          _Option_match(
            _Map_get(name, qualify),
            () => recs,
            (qual) =>
              _Option_match(
                _Map_get(qual, aliases),
                () => recs,
                (info) =>
                  _Option_match(
                    info.expr,
                    () =>
                      and(length(info.fields) > 0, !_Map_has(name, recs))
                        ? _Map_set(name, qual, recs)
                        : recs,
                    () => recs,
                  ),
              ),
          ),
          i + 1,
        ),
    ),
);
/**
 * Host spellings use the same nominal-name index as namespace qualifications.
 * A local declaration or imported type keeps its own meaning.
 */
const hostTypeRecs: <A>(
  names: Map<A, string>,
  local: Set<A>,
  recs: Map<A, string>,
) => Map<A, string> = _curry(3, <A>(names: Map<A, string>, local: Set<A>, recs: Map<A, string>) =>
  reduce(
    _curry(2, (acc: Map<A, string>, name: A) =>
      or(_Set_has(name, local), _Map_has(name, acc))
        ? acc
        : _Map_set(name, _Map_getOr("", name, names), acc),
    ),
    recs,
    _Map_keys(names),
  ),
);
/**
 * Emit `.d.ts` text from an already-typed program.
 */
export const emitDtsFromTypedWith: <A>(
  stmts: Stmt[],
  env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>,
  aliases: Map<string, AliasInfo>,
  qualify: Map<string, string>,
  runtimeImport: string,
  docs: boolean,
  dtsHooks: ((a: string, b: Expr, c: Ty, d: TsApi) => Option<string>)[],
  bindingHooks: ((a: Expr, b: Ty, c: TsApi) => Option<string>)[],
  dtsTypeNames: Map<string, string>,
) => string = _curry(
  9,
  <A>(
    stmts: Stmt[],
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>,
    aliases: Map<string, AliasInfo>,
    qualify: Map<string, string>,
    runtimeImport: string,
    docs: boolean,
    dtsHooks: ((a: string, b: Expr, c: Ty, d: TsApi) => Option<string>)[],
    bindingHooks: ((a: Expr, b: Ty, c: TsApi) => Option<string>)[],
    dtsTypeNames: Map<string, string>,
  ) => {
    const local: Set<string> = declaredTypeNames(stmts, 0, _Set_fromArray([] as string[]));
    const quals: Map<string, string> = writtenQualsFrom$(stmts, local, qualify, 0);
    const recs: Map<string, string> = hostTypeRecs(
      dtsTypeNames,
      local,
      qualConRecs(_Map_keys(quals), quals, aliases, declarationRecs$(stmts, aliases), 0),
    );
    const types: string[] = typeDeclsFrom$(stmts, aliases, recs, quals, docs, 0);
    const bindings: string[] = bindingDeclsFrom(
      stmts,
      env,
      aliases,
      localAliasKeys$(stmts, 0, [] as string[]),
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
    const body: string = `${_Str_join("\n", _Array_concat(builtinDeclsFor$(builtinNames, aliases, recs, 0), _Array_concat(types, bindings)))}
`;
    const curry: string[] = _Str_contains("_Curry<", body)
      ? [`import type { _Curry } from "${runtimeImport}";`]
      : ([] as string[]);
    const imports: string[] = _Array_concat(
      curry,
      nsTypeImportsFrom$(stmts, body, _Set_fromArray([] as string[]), 0),
    );
    return length(imports) === 0
      ? body
      : `${_Str_join("\n", imports)}
${body}`;
  },
);
const addQuals$ = (
  alias: string,
  names: string[],
  local: Set<string>,
  acc: Map<string, string>,
  i: number,
): Map<string, string> =>
  _Option_match(
    _Array_get(i, names),
    () => acc,
    (name) =>
      addQuals$(
        alias,
        names,
        local,
        or(_Set_has(name, local), _Map_has(name, acc))
          ? acc
          : _Map_set(name, `${alias}.${name}`, acc),
        i + 1,
      ),
  );
/**
 * `Shape` -> `D.Shape` for every type an `import * as D` brings into type
 * position (ADR 0046). A name the file declares itself wins — it is already
 * writable bare, and it shadows. First alias wins on a collision.
 */
const addQuals: _Curry<
  [alias: string, names: string[], local: Set<string>, acc: Map<string, string>, i: number],
  Map<string, string>
> = _curry(5, addQuals$);
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
    _Option_match(
      _Array_get(i, aliases),
      () => acc,
      (alias) =>
        _Option_match(
          _Map_get(alias, quals),
          () => qualsFromAliases(aliases, quals, local, acc, i + 1),
          (scope) =>
            qualsFromAliases(
              aliases,
              quals,
              local,
              addQuals$(alias, _Set_toArray(scope.types), local, acc, 0),
              i + 1,
            ),
        ),
    ),
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
  aliases: Map<string, AliasInfo>,
  qualify: Map<string, string>,
  runtimeImport: string,
) => string = _curry(
  5,
  <A>(
    stmts: Stmt[],
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>,
    aliases: Map<string, AliasInfo>,
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
      new Map<string, string>(),
    ),
);
const emitDtsTextWith$ = (
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
    dtsTypeNames: Map<string, string>;
    open: boolean;
    runtime: boolean;
    moduleExt: string;
    strictEntry: boolean;
  },
): Result<string, Stamped[]> =>
  _Result_map(
    ([stmts, r]: [
      Stmt[],
      {
        env: Map<string, Scheme>;
        aliases: Map<string, AliasInfo>;
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
        opts.dtsTypeNames,
      ),
    typedProgramWith(src, opts),
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
      dtsTypeNames: Map<string, string>;
      open: boolean;
      runtime: boolean;
      moduleExt: string;
      strictEntry: boolean;
    },
  ],
  Result<string, Stamped[]>
> = _curry(3, emitDtsTextWith$);
const emitDtsText$ = (src: string, runtimeImport: string): Result<string, Stamped[]> =>
  emitDtsTextWith$(src, runtimeImport, defaultOpts);
export const emitDtsText: _Curry<
  [src: string, runtimeImport: string],
  Result<string, Stamped[]>
> = _curry(2, emitDtsText$);
const compileTargetsWith$ = (
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
    dtsTypeNames: Map<string, string>;
    open: boolean;
    runtime: boolean;
    moduleExt: string;
    strictEntry: boolean;
  },
): Result<{ js: string; ts: string; dts: string }, Stamped[]> =>
  _Result_map(
    ([stmts, r]: [
      Stmt[],
      {
        env: Map<string, Scheme>;
        aliases: Map<string, AliasInfo>;
        types: TypeAt[];
        letParams: TypeAt[];
      },
    ]) => ({
      js: emitJsWith(stmts, opts),
      ts: emitTsWith(stmts, r, runtimeImport, opts),
      dts: emitDtsFromTypedWith(
        stmts,
        r.env,
        r.aliases,
        new Map<string, string>(),
        runtimeImport,
        opts.docs,
        dtsHooksFor(opts.plugins),
        bindingHooksFor(opts.plugins),
        opts.dtsTypeNames,
      ),
    }),
    typedProgramWith(src, opts),
  );
/**
 * Source -> JS, typed TS and `.d.ts` from one inference, so the three stay in
 * lockstep at a third of the cost (the docs playground shows all of them).
 * Ports src/compile/compile-targets.ts.
 */
export const compileTargetsWith: _Curry<
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
      dtsTypeNames: Map<string, string>;
      open: boolean;
      runtime: boolean;
      moduleExt: string;
      strictEntry: boolean;
    },
  ],
  Result<{ js: string; ts: string; dts: string }, Stamped[]>
> = _curry(3, compileTargetsWith$);
