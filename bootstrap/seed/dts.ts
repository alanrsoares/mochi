import type { Stmt } from "./ast";
import type { Ty, TypeAt } from "./types";
import type { PErr } from "./parser";
import type { Scheme } from "./schemes";
import type { AliasInfo } from "./codegen-ts";

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
  _Result_map,
  _Set_add,
  _Set_fromArray,
  _Set_has,
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
import { jsDoc } from "./codegen";
import { typedProgram } from "./compile";
/**
 * One `export`ed declaration per `type` statement. `codegen-ts`'s own walker
 * emits these module-locally for the `.ts` backend; a `.d.ts` exports them, and
 * an opaque `extern type` goes through `opaqueTypeDecl` for the same reason.
 */
const typeDeclsFrom: _Curry<
  [stmts: Stmt[], aliases: Map<string, AliasInfo>, recs: Map<string, string>, i: number],
  string[]
> = _curry(
  4,
  (stmts: Stmt[], aliases: Map<string, AliasInfo>, recs: Map<string, string>, i: number) =>
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
                    `${docComment}${recordAliasDecl(name, params, fields, aliases, withoutOwnShape(fields, params, aliases, recs))}`,
                    rest,
                  ),
                )
                .with({ _tag: "None" }, () =>
                  match(aliasType)
                    .with({ _tag: "Some" }, ({ value: te }) =>
                      _Array_prepend(
                        `${docComment}${aliasTsDecl(name, params, te, aliases, recs)}`,
                        rest,
                      ),
                    )
                    .with({ _tag: "None" }, () =>
                      eq(length(ctors), 0)
                        ? _Array_prepend(`${docComment}${opaqueTypeDecl(name)}`, rest)
                        : _Array_prepend(
                            `${docComment}${typeDecl(name, params, ctors, aliases, recs)}`,
                            rest,
                          ),
                    )
                    .exhaustive(),
                )
                .exhaustive())(jsDoc(doc)))(typeDeclsFrom(stmts, aliases, recs, i + 1)),
      )
      .with({ _tag: "Some" }, () => typeDeclsFrom(stmts, aliases, recs, i + 1))
      .exhaustive(),
);
/**
 * `export declare const` per top-level binding that has an inferred scheme.
 * `$`-prefixed synthetic binders declare nothing.
 */
const bindingDeclsFrom: <A>(
  stmts: Stmt[],
  env: Map<string, { vars: number[]; rvars: number[]; ty: Ty } & A>,
  recs: Map<string, string>,
  i: number,
) => string[] = _curry(
  4,
  <A>(
    stmts: Stmt[],
    env: Map<string, { vars: number[]; rvars: number[]; ty: Ty } & A>,
    recs: Map<string, string>,
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
                      `${jsDoc(doc)}export declare const ${name}: ${bindingTsType(sc, value, recs)};`,
                      rest,
                    ),
                  )
                  .exhaustive())(bindingDeclsFrom(stmts, env, recs, i + 1)),
      )
      .with({ _tag: "Some" }, () => bindingDeclsFrom(stmts, env, recs, i + 1))
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
  env: Map<string, { vars: number[]; rvars: number[]; ty: Ty } & A>,
  aliases: Map<string, AliasInfo>,
  runtimeImport: string,
) => string = _curry(
  4,
  <A>(
    stmts: Stmt[],
    env: Map<string, { vars: number[]; rvars: number[]; ty: Ty } & A>,
    aliases: Map<string, AliasInfo>,
    runtimeImport: string,
  ) => {
    const recs: Map<string, string> = recordAliasIndex(aliases);
    const types: string[] = typeDeclsFrom(stmts, aliases, recs, 0);
    const bindings: string[] = bindingDeclsFrom(stmts, env, recs, 0);
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
    ]) => emitDtsFromTyped(stmts, r.env, r.aliases, runtimeImport),
    typedProgram(src),
  ),
);
