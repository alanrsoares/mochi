import type { Stmt, TypeExpr } from "./ast";
import type { Row, Ty, TypeAt } from "./types";
import type { PErr } from "./parser";
import type { Scheme } from "./schemes";
import type { AliasInfo } from "./codegen-ts";
import type { QualAliasField } from "./infer";
import type { CtorFieldLike, CtorLike } from "./codegen";

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
  eq,
  length,
  map,
  not,
  or,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "./ast";
import { builtinTypeDecls } from "./ctors";
import {
  aliasTsDecl,
  bindingTsType,
  builtinTypeNamesFor,
  declaredTypeNames,
  recordAliasIndex,
  referencedCons,
  opaqueTypeDecl,
  recordAliasDecl,
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
import { typedProgram } from "./compile";
/**
 * Fold `D.Shape` written in this file back to a name the emitted `.d.ts` can
 * resolve, without needing the module graph: single-file dts sees the `tqual`
 * nodes even though it cannot see the dependency's exports.
 */
const writtenQualsIn: _Curry<
  [te: TypeExpr, local: Set<string>, acc: Map<string, string>],
  Map<string, string>
> = _curry(3, (te: TypeExpr, local: Set<string>, acc: Map<string, string>) =>
  match(te)
    .with({ _tag: "TyName" }, () => acc)
    .with({ _tag: "TyLit" }, () => acc)
    .with({ _tag: "TyArrow" }, ({ from, to }) =>
      writtenQualsIn(to, local, writtenQualsIn(from, local, acc)),
    )
    .with({ _tag: "TyApp" }, ({ args }) => writtenQualsInAll(args, local, acc, 0))
    .with({ _tag: "TyTuple" }, ({ elems }) => writtenQualsInAll(elems, local, acc, 0))
    .with({ _tag: "TyList" }, ({ elem }) => writtenQualsIn(elem, local, acc))
    .with({ _tag: "TyUnion" }, ({ members }) => writtenQualsInAll(members, local, acc, 0))
    .with({ _tag: "TyQual" }, ({ alias, name, args }) =>
      ((acc1: Map<string, string>) => writtenQualsInAll(args, local, acc1, 0))(
        or(_Set_has(name, local), _Map_has(name, acc))
          ? acc
          : _Map_set(name, `${alias}.${name}`, acc),
      ),
    )
    .exhaustive(),
);
const writtenQualsInAll: _Curry<
  [tes: TypeExpr[], local: Set<string>, acc: Map<string, string>, i: number],
  Map<string, string>
> = _curry(4, (tes: TypeExpr[], local: Set<string>, acc: Map<string, string>, i: number) =>
  match(_Array_get(i, tes))
    .with({ _tag: "None" }, () => acc)
    .with({ _tag: "Some" }, ({ value: te }) =>
      writtenQualsInAll(tes, local, writtenQualsIn(te, local, acc), i + 1),
    )
    .exhaustive(),
);
const ctorQualsFrom: _Curry<
  [ctors: CtorLike[], local: Set<string>, acc: Map<string, string>, i: number],
  Map<string, string>
> = _curry(4, (ctors: CtorLike[], local: Set<string>, acc: Map<string, string>, i: number) =>
  match(_Array_get(i, ctors))
    .with({ _tag: "None" }, () => acc)
    .with({ _tag: "Some" }, ({ value: c }) =>
      ctorQualsFrom(
        ctors,
        local,
        writtenQualsInAll(
          map((f: CtorFieldLike) => f.fieldType, c.fields),
          local,
          acc,
          0,
        ),
        i + 1,
      ),
    )
    .exhaustive(),
);
const writtenQualsFrom: _Curry<
  [stmts: Stmt[], local: Set<string>, acc: Map<string, string>, i: number],
  Map<string, string>
> = _curry(4, (stmts: Stmt[], local: Set<string>, acc: Map<string, string>, i: number) =>
  match(_Array_get(i, stmts))
    .with({ _tag: "None" }, () => acc)
    .with(
      (
        _v,
      ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
        value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SExtern" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "Some" && _g.value._tag === "SExtern";
      },
      ({ value: { typeExpr: te } }) =>
        writtenQualsFrom(stmts, local, writtenQualsIn(te, local, acc), i + 1),
    )
    .with(
      (
        _v,
      ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
        value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "Some" && _g.value._tag === "SLet";
      },
      ({ value: { annot } }) =>
        writtenQualsFrom(
          stmts,
          local,
          match(annot)
            .with({ _tag: "None" }, () => acc)
            .with({ _tag: "Some" }, ({ value: te }) => writtenQualsIn(te, local, acc))
            .exhaustive(),
          i + 1,
        ),
    )
    .with(
      (
        _v,
      ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
        value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "Some" && _g.value._tag === "SType";
      },
      ({ value: { ctors, alias, aliasType } }) =>
        ((acc1: Map<string, string>) =>
          ((acc2: Map<string, string>) =>
            ((acc3: Map<string, string>) => writtenQualsFrom(stmts, local, acc3, i + 1))(
              match(aliasType)
                .with({ _tag: "None" }, () => acc2)
                .with({ _tag: "Some" }, ({ value: te }) => writtenQualsIn(te, local, acc2))
                .exhaustive(),
            ))(
            match(alias)
              .with({ _tag: "None" }, () => acc1)
              .with({ _tag: "Some" }, ({ value: fields }) =>
                writtenQualsInAll(
                  map((f: QualAliasField) => f.fieldType, fields),
                  local,
                  acc1,
                  0,
                ),
              )
              .exhaustive(),
          ))(ctorQualsFrom(ctors, local, acc, 0)),
    )
    .with({ _tag: "Some" }, () => writtenQualsFrom(stmts, local, acc, i + 1))
    .exhaustive(),
);
/**
 * `Shape` -> `D.Shape` for a type an `import * as D` brings into type position
 * (ADR 0046). Applied to inferred types before they print; the printers stay
 * qualification-free so the `.ts` backend is untouched.
 */
const qualifyRow: _Curry<[row: Row, qualify: Map<string, string>], Row> = _curry(
  2,
  (row: Row, qualify: Map<string, string>) =>
    match(row)
      .with({ _tag: "RowEmpty" }, () => RowEmpty as Row)
      .with({ _tag: "RowVar" }, ({ id }) => RowVar(id))
      .with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) =>
        RowExtend(label, qualifyTy(fieldType, qualify), optional, qualifyRow(rest, qualify)),
      )
      .exhaustive(),
);
const qualifyTy: _Curry<[t: Ty, qualify: Map<string, string>], Ty> = _curry(
  2,
  (t: Ty, qualify: Map<string, string>) =>
    match(t)
      .with({ _tag: "TyVar" }, ({ id }) => TyVar(id))
      .with({ _tag: "TyCon" }, ({ name, args }) =>
        TyCon(
          _Map_getOr(name, name, qualify),
          map((a: Ty) => qualifyTy(a, qualify), args),
        ),
      )
      .with({ _tag: "TyFn" }, ({ from, to }) =>
        TyFn(qualifyTy(from, qualify), qualifyTy(to, qualify)),
      )
      .with({ _tag: "TyRecord" }, ({ row }) => TyRecord(qualifyRow(row, qualify)))
      .with({ _tag: "TySingleton" }, ({ base, value }) => TySingleton(base, value))
      .with({ _tag: "TyOneOf" }, ({ members }) =>
        TyOneOf(map((m: Ty) => qualifyTy(m, qualify), members)),
      )
      .exhaustive(),
);
/**
 * The same rename on a written `TypeExpr` — ctor and alias field types print
 * from the AST, not from an inferred `Ty`.
 */
const qualifyTe: _Curry<[te: TypeExpr, qualify: Map<string, string>], TypeExpr> = _curry(
  2,
  (te: TypeExpr, qualify: Map<string, string>) =>
    match(te)
      .with({ _tag: "TyName" }, ({ name, span }) =>
        Ast.TyName(_Map_getOr(name, name, qualify), span),
      )
      .with({ _tag: "TyArrow" }, ({ from, to, span }) =>
        Ast.TyArrow(qualifyTe(from, qualify), qualifyTe(to, qualify), span),
      )
      .with({ _tag: "TyApp" }, ({ ctor, args, span }) =>
        Ast.TyApp(
          _Map_getOr(ctor, ctor, qualify),
          map((a: TypeExpr) => qualifyTe(a, qualify), args),
          span,
        ),
      )
      .with({ _tag: "TyTuple" }, ({ elems, span }) =>
        Ast.TyTuple(
          map((e: TypeExpr) => qualifyTe(e, qualify), elems),
          span,
        ),
      )
      .with({ _tag: "TyList" }, ({ elem, span }) => Ast.TyList(qualifyTe(elem, qualify), span))
      .with({ _tag: "TyQual" }, ({ alias, name, nameSpan, args, span }) =>
        Ast.TyQual(
          alias,
          name,
          nameSpan,
          map((a: TypeExpr) => qualifyTe(a, qualify), args),
          span,
        ),
      )
      .with({ _tag: "TyLit" }, ({ value, span }) => Ast.TyLit(value, span))
      .with({ _tag: "TyUnion" }, ({ members, span }) =>
        Ast.TyUnion(
          map((m: TypeExpr) => qualifyTe(m, qualify), members),
          span,
        ),
      )
      .exhaustive(),
);
const qualifyField: _Curry<[f: CtorFieldLike, qualify: Map<string, string>], CtorFieldLike> =
  _curry(2, (f: CtorFieldLike, qualify: Map<string, string>) => ({
    name: f.name,
    fieldType: qualifyTe(f.fieldType, qualify),
  }));
const qualifyCtor: _Curry<[c: CtorLike, qualify: Map<string, string>], CtorLike> = _curry(
  2,
  (c: CtorLike, qualify: Map<string, string>) => ({
    name: c.name,
    fields: map((f: CtorFieldLike) => qualifyField(f, qualify), c.fields),
  }),
);
const qualifyAliasField: _Curry<[f: QualAliasField, qualify: Map<string, string>], QualAliasField> =
  _curry(2, (f: QualAliasField, qualify: Map<string, string>) => ({
    name: f.name,
    fieldType: qualifyTe(f.fieldType, qualify),
    optional: f.optional,
  }));
/**
 * One `export`ed declaration per `type` statement. `codegen-ts`'s own walker
 * emits these module-locally for the `.ts` backend; a `.d.ts` exports them, and
 * an opaque `extern type` goes through `opaqueTypeDecl` for the same reason.
 */
const typeDeclsFrom: _Curry<
  [
    stmts: Stmt[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    qualify: Map<string, string>,
    i: number,
  ],
  string[]
> = _curry(
  5,
  (
    stmts: Stmt[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    qualify: Map<string, string>,
    i: number,
  ) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => [] as string[])
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SType";
        },
        ({ value: { name, params, ctors, alias, aliasType, doc } }) =>
          ((rest: string[]) =>
            ((docComment: string) =>
              match(alias)
                .with({ _tag: "Some" }, ({ value: fields }) =>
                  _Array_prepend(
                    `${docComment}${recordAliasDecl(
                      name,
                      params,
                      map((f: QualAliasField) => qualifyAliasField(f, qualify), fields),
                      aliases,
                      withoutOwnShape(fields, params, aliases, recs),
                    )}`,
                    rest,
                  ),
                )
                .with({ _tag: "None" }, () =>
                  match(aliasType)
                    .with({ _tag: "Some" }, ({ value: te }) =>
                      _Array_prepend(
                        `${docComment}${aliasTsDecl(name, params, qualifyTe(te, qualify), aliases, recs)}`,
                        rest,
                      ),
                    )
                    .with({ _tag: "None" }, () =>
                      eq(length(ctors), 0)
                        ? _Array_prepend(`${docComment}${opaqueTypeDecl(name)}`, rest)
                        : _Array_prepend(
                            `${docComment}${typeDecl(
                              name,
                              params,
                              map((c: CtorLike) => qualifyCtor(c, qualify), ctors),
                              aliases,
                              recs,
                            )}`,
                            rest,
                          ),
                    )
                    .exhaustive(),
                )
                .exhaustive())(jsDoc(doc)))(typeDeclsFrom(stmts, aliases, recs, qualify, i + 1)),
      )
      .with({ _tag: "Some" }, () => typeDeclsFrom(stmts, aliases, recs, qualify, i + 1))
      .exhaustive(),
);
/**
 * `export declare const` per top-level binding that has an inferred scheme.
 * `$`-prefixed synthetic binders declare nothing.
 */
const bindingDeclsFrom: <A>(
  stmts: Stmt[],
  env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>,
  recs: Map<string, string>,
  qualify: Map<string, string>,
  i: number,
) => string[] = _curry(
  5,
  <A>(
    stmts: Stmt[],
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>,
    recs: Map<string, string>,
    qualify: Map<string, string>,
    i: number,
  ) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => [] as string[])
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SLet";
        },
        ({ value: { name, value, doc } }) =>
          ((rest: string[]) =>
            _Str_startsWith("$", name)
              ? rest
              : match(_Map_get(name, env))
                  .with({ _tag: "None" }, () => rest)
                  .with({ _tag: "Some" }, ({ value: sc }) =>
                    _Array_prepend(
                      `${jsDoc(doc)}export declare const ${name}: ${bindingTsType({ vars: sc.vars, rvars: sc.rvars, ty: qualifyTy(sc.ty, qualify) }, value, recs)};`,
                      rest,
                    ),
                  )
                  .exhaustive())(bindingDeclsFrom(stmts, env, recs, qualify, i + 1)),
      )
      .with({ _tag: "Some" }, () => bindingDeclsFrom(stmts, env, recs, qualify, i + 1))
      .exhaustive(),
);
/**
 * A builtin variant named in an exported type (`Option<number>` from `Map.get`)
 * has to be DECLARED here — unlike the `.ts` backend, which imports it from the
 * runtime instead (ADR 0093).
 */
const builtinDeclsFor: _Curry<
  [names: string[], aliases: Map<string, AliasInfo>, recs: Map<string, string>, i: number],
  string[]
> = _curry(
  4,
  (names: string[], aliases: Map<string, AliasInfo>, recs: Map<string, string>, i: number) =>
    match(_Array_get(i, builtinTypeDecls))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: bt }) =>
        ((rest: string[]) =>
          _Array_contains(bt.name, names)
            ? _Array_prepend(typeDecl(bt.name, bt.params, bt.ctors, aliases, recs), rest)
            : rest)(builtinDeclsFor(names, aliases, recs, i + 1)),
      )
      .exhaustive(),
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
  match(_Array_get(i, stmts))
    .with({ _tag: "None" }, () => [] as string[])
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
        or(_Set_has(alias.name, seen), not(_Str_contains(`${alias.name}.`, body)))
          ? nsTypeImportsFrom(stmts, body, seen, i + 1)
          : _Array_prepend(
              `import type * as ${alias.name} from "${mochiDtsSpec(from)}";`,
              nsTypeImportsFrom(stmts, body, _Set_add(alias.name, seen), i + 1),
            ),
    )
    .with({ _tag: "Some" }, () => nsTypeImportsFrom(stmts, body, seen, i + 1))
    .exhaustive(),
);
/**
 * Emit `.d.ts` text from an already-typed program.
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
  ) => {
    const recs: Map<string, string> = recordAliasIndex(aliases);
    const local: Set<string> = declaredTypeNames(stmts, 0, _Set_fromArray([] as string[]));
    const quals: Map<string, string> = writtenQualsFrom(stmts, local, qualify, 0);
    const types: string[] = typeDeclsFrom(stmts, aliases, recs, quals, 0);
    const bindings: string[] = bindingDeclsFrom(stmts, env, recs, quals, 0);
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
    return eq(length(imports), 0)
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
    match(_Array_get(i, names))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: name }) =>
        addQuals(
          alias,
          names,
          local,
          or(_Set_has(name, local), _Map_has(name, acc))
            ? acc
            : _Map_set(name, `${alias}.${name}`, acc),
          i + 1,
        ),
      )
      .exhaustive(),
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
    match(_Array_get(i, aliases))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: alias }) =>
        match(_Map_get(alias, quals))
          .with({ _tag: "None" }, () => qualsFromAliases(aliases, quals, local, acc, i + 1))
          .with({ _tag: "Some" }, ({ value: scope }) =>
            qualsFromAliases(
              aliases,
              quals,
              local,
              addQuals(alias, _Set_toArray(scope.types), local, acc, 0),
              i + 1,
            ),
          )
          .exhaustive(),
      )
      .exhaustive(),
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
export const emitDtsText: _Curry<
  [src: string, runtimeImport: string],
  Result<string, PErr>
> = _curry(2, (src: string, runtimeImport: string) =>
  _Result_map(
    ([stmts, r]: [
      Stmt[],
      {
        env: Map<string, Scheme>;
        aliases: Map<string, AliasInfo>;
        types: TypeAt[];
        letParams: TypeAt[];
      },
    ]) => emitDtsFromTyped(stmts, r.env, r.aliases, new Map<string, string>(), runtimeImport),
    typedProgram(src),
  ),
);
