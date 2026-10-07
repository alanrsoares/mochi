import type { Ctor, CtorField, Stmt, TypeExpr } from "./ast";
import type { SpanAt } from "../infer/types";

export type CtorInfo = { owner: string; arity: number };
export type Registry = { ctors: Map<string, CtorInfo>; types: Map<string, string[]> };

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  Err,
  None,
  Ok,
  Some,
  _Array_get,
  _Array_prepend,
  _Map_delete,
  _Map_get,
  _Map_has,
  _Map_set,
  _Option_match,
  _Option_unwrapOr,
  _Result_flatMap,
  _Result_map,
  _Str_split,
  _curry,
  _done,
  _keyOf,
  _recur,
  _tuple,
  and,
  eq,
  filter,
  length,
  map,
  show,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "./ast";

const emptyRegistry: Registry = {
  ctors: new Map<string, CtorInfo>(),
  types: new Map<string, string[]>(),
};
/**
 * The primitive type names legal in a ctor field / type expression. Shared by
 * check (stray-type-var validation) and any future prim consumer — previously
 * check.mochi's private `ctorPrims`.
 */
export const primTypeNames = ["number", "int", "float", "string", "bool", "unit"];
const keysOfFrom: <A>(fields: ({ name: Option<string> } & A)[], i: number) => string[] = _curry(
  2,
  <A>(fields: ({ name: Option<string> } & A)[], i: number) =>
    _Option_match(
      _Array_get(i, fields),
      () => [] as string[],
      (f) => _Array_prepend(_Option_unwrapOr(`_${show(i)}`, f.name), keysOfFrom(fields, i + 1)),
    ),
);
export const keysOf: <A>(fields: ({ name: Option<string> } & A)[]) => string[] = <A>(
  fields: ({ name: Option<string> } & A)[],
) => keysOfFrom(fields, 0);
const builtinSpan: SpanAt = { start: 0, end: 0 };
const builtinCtor$ = (
  name: string,
  fields: { fieldType: TypeExpr; name: Option<string> }[],
): Ctor => ({ name: name, fields: fields, tagKey: "_tag", tagLit: name, span: builtinSpan });
const valueField$ = (label: string, ty: string): CtorField[] => [
  { name: Some(label), fieldType: Ast.TyName(ty, builtinSpan) },
];
export const builtinTypeDecls: { name: string; params: string[]; ctors: Ctor[] }[] = [
  {
    name: "Option",
    params: ["a"],
    ctors: [
      builtinCtor$("Some", valueField$("value", "a")),
      builtinCtor$("None", [] as CtorField[]),
    ],
  },
  {
    name: "Result",
    params: ["a", "e"],
    ctors: [
      builtinCtor$("Ok", valueField$("value", "a")),
      builtinCtor$("Err", valueField$("error", "e")),
    ],
  },
];
const declaresType$ = (stmts: Stmt[], i: number, name: string): boolean =>
  ((_v) =>
    _v._tag === "None"
      ? false
      : _v._tag === "Some" && _v.value._tag === "SType"
        ? (({ value: { name: n } }) => (eq(n, name) ? true : declaresType$(stmts, i + 1, name)))(
            _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
              value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
            },
          )
        : _v._tag === "Some"
          ? declaresType$(stmts, i + 1, name)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, stmts));
/**
 * The builtin decls a program does NOT shadow: a user `type` of the same name
 * suppresses the whole builtin type (the type-name-shadow rule, matching
 * src/ctors.ts's seedBuiltins). Consumers seed from this list so all three
 * passes share one shadowing semantics.
 */
export const builtinDeclsFor: (
  stmts: Stmt[],
) => { name: string; params: string[]; ctors: Ctor[] }[] = (stmts: Stmt[]) =>
  filter(
    (bt: { name: string; params: string[]; ctors: Ctor[] }) => !declaresType$(stmts, 0, bt.name),
    builtinTypeDecls,
  );
const seedRegCtorsFrom: <A, B, D>(
  ctors: ({ name: A; fields: B[] } & D)[],
  i: number,
  owner: string,
  acc: Map<A, CtorInfo>,
) => Map<A, CtorInfo> = _curry(
  4,
  <A, B, D>(
    ctors: ({ name: A; fields: B[] } & D)[],
    i: number,
    owner: string,
    acc: Map<A, CtorInfo>,
  ) =>
    _Option_match(
      _Array_get(i, ctors),
      () => acc,
      (c) =>
        seedRegCtorsFrom(
          ctors,
          i + 1,
          owner,
          _Map_has(c.name, acc)
            ? acc
            : _Map_set(c.name, { owner: owner, arity: length(c.fields) }, acc),
        ),
    ),
);
const seedRegDeclsFrom: <C, D, E>(
  decls: ({ name: string; ctors: ({ name: string; fields: C[] } & D)[] } & E)[],
  i: number,
  reg: Registry,
) => Registry = _curry(
  3,
  <C, D, E>(
    decls: ({ name: string; ctors: ({ name: string; fields: C[] } & D)[] } & E)[],
    i: number,
    reg: Registry,
  ) =>
    _Option_match(
      _Array_get(i, decls),
      () => reg,
      (bt) =>
        seedRegDeclsFrom(decls, i + 1, {
          ctors: seedRegCtorsFrom(bt.ctors, 0, bt.name, reg.ctors),
          types: _Map_set(
            bt.name,
            map((c: { name: string; fields: C[] } & D) => c.name, bt.ctors),
            reg.types,
          ),
        }),
    ),
);
const ctorErr: <A, B, C, D>(
  message: A,
  sp: { end: B; start: C } & D,
) => { message: A; start: C; end: B } = _curry(
  2,
  <A, B, C, D>(message: A, sp: { end: B; start: C } & D) => ({
    message: message,
    start: sp.start,
    end: sp.end,
  }),
);
const ctorsInto: <A, C, D, E, F>(
  ctors: ({ name: string; fields: A[] } & E)[],
  i: number,
  owner: string,
  sp: { end: C; start: D } & F,
  acc: Map<string, CtorInfo>,
) => Result<Map<string, CtorInfo>, { message: string; start: D; end: C }> = _curry(
  5,
  <A, C, D, E, F>(
    ctors: ({ name: string; fields: A[] } & E)[],
    i: number,
    owner: string,
    sp: { end: C; start: D } & F,
    acc: Map<string, CtorInfo>,
  ) =>
    _Option_match(
      _Array_get(i, ctors),
      () => Ok(acc),
      (c) =>
        _Map_has(c.name, acc)
          ? Err(ctorErr(`duplicate constructor '${c.name}'`, sp))
          : ctorsInto(
              ctors,
              i + 1,
              owner,
              sp,
              _Map_set(c.name, { owner: owner, arity: length(c.fields) }, acc),
            ),
    ),
);
const buildLoop$ = (
  stmts: Stmt[],
  i: number,
  reg: Registry,
): Result<Registry, { message: string; start: number; end: number }> =>
  ((_v) =>
    _v._tag === "None"
      ? (Ok(reg) as Result<Registry, { message: string; start: number; end: number }>)
      : _v._tag === "Some" && _v.value._tag === "SType"
        ? (({ value: { name, ctors, span: sp } }) =>
            _Map_has(name, reg.types)
              ? (Err(ctorErr(`duplicate type '${name}'`, sp)) as Result<
                  Registry,
                  { message: string; start: number; end: number }
                >)
              : _Result_flatMap(
                  (cs: Map<string, CtorInfo>) =>
                    buildLoop$(stmts, i + 1, {
                      ctors: cs,
                      types: _Map_set(
                        name,
                        map((c: Ctor) => c.name, ctors),
                        reg.types,
                      ),
                    }),
                  ctorsInto(ctors, 0, name, sp, reg.ctors),
                ))(
            _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
              value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
            },
          )
        : _v._tag === "Some"
          ? buildLoop$(stmts, i + 1, reg)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, stmts));
/**
 * The failing builder — check's entry point: duplicate-decl detection lives
 * here, at the single derivation, so no later pass can see a registry check
 * didn't vouch for.
 */
export const buildRegistry: (
  stmts: Stmt[],
) => Result<Registry, { message: string; start: number; end: number }> = (stmts: Stmt[]) =>
  _Result_map(
    (reg: Registry) => seedRegDeclsFrom(builtinDeclsFor(stmts), 0, reg),
    buildLoop$(stmts, 0, emptyRegistry),
  );
const exportedRegLoop$ = (stmts: Stmt[], i0: number, reg0: Registry): Registry => {
  let i: number = i0;
  let reg: Registry = reg0;
  while (true) {
    const _step = ((_v) =>
      _v._tag === "None"
        ? _done(reg)
        : _v._tag === "Some" && _v.value._tag === "SType" && _v.value.exported === true
          ? (({ value: { name, ctors } }) =>
              _recur(i + 1, {
                ctors: seedRegCtorsFrom(ctors, 0, name, reg.ctors),
                types: _Map_set(
                  name,
                  map((c: Ctor) => c.name, ctors),
                  reg.types,
                ),
              }))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
              },
            )
          : _v._tag === "Some"
            ? _recur(i + 1, reg)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, stmts));
    if (_step._tag === "recur") {
      [i, reg] = _step.args;
      continue;
    }
    return _step.value;
  }
};
export const exportedRegistry: (stmts: Stmt[]) => Registry = (stmts: Stmt[]) =>
  exportedRegLoop$(stmts, 0, emptyRegistry);
export const tagEntryOf: (name: string) => string = (name: string) => `@tag:${name}`;
const withTag$ = (
  m: Map<string, string[]>,
  name: string,
  tagKey: string,
  tagLit: string,
): Map<string, string[]> =>
  and(tagKey === "_tag", eq(tagLit, name))
    ? _Map_delete(tagEntryOf(name), m)
    : _Map_set(tagEntryOf(name), [tagKey, tagLit], m);
const ctorKeysInto: <A, B>(
  ctors: ({
    tagLit: string;
    tagKey: string;
    fields: ({ name: Option<string> } & A)[];
    name: string;
  } & B)[],
  i: number,
  m: Map<string, string[]>,
) => Map<string, string[]> = _curry(
  3,
  <A, B>(
    ctors: ({
      tagLit: string;
      tagKey: string;
      fields: ({ name: Option<string> } & A)[];
      name: string;
    } & B)[],
    i: number,
    m: Map<string, string[]>,
  ) =>
    match(_Array_get(i, ctors))
      .with({ _tag: "None" }, () => m)
      .with(
        (_v) => _v._tag === "Some",
        ({ value: { name, fields, tagKey, tagLit } }) =>
          ctorKeysInto(
            ctors,
            i + 1,
            withTag$(_Map_set(name, keysOf(fields), m), name, tagKey, tagLit),
          ),
      )
      .exhaustive(),
);
const ctorKeyOf$ = (ctor: string, ns: Option<string>): string =>
  _Option_match(
    ns,
    () => ctor,
    (alias) => `${alias}.${ctor}`,
  );
/**
 * A ctor's registry key: bare `Click`, or `E.Click` through `import * as E`
 * (ADR 0082) — the qualified form keeps it distinct from a local `Click`.
 */
export const ctorKeyOf: _Curry<[ctor: string, ns: Option<string>], string> = _curry(2, ctorKeyOf$);
const bareCtor: (ctor: string) => string = (ctor: string) =>
  ((_v) => (_v.length === 2 ? (([, name]) => name)(_v) : ctor))(_Str_split(".", ctor));
const tagOf$ = (keys: Map<string, string[]>, ctor: string): [string, string] =>
  ((_v) =>
    _v._tag === "Some" && _v.value.length === 2
      ? (({ value: [key, lit] }) => _tuple(key, lit))(
          _v as Extract<Option<string[]>, { _tag: "Some" }>,
        )
      : _tuple("_tag", bareCtor(ctor)))(_Map_get(tagEntryOf(ctor), keys));
/**
 * A ctor's runtime discriminant `(key, literal)` — `("_tag", name)` unless
 * `@tag`/`@as` overrode it. The one lookup codegen and the TS backend share.
 */
export const tagOf: _Curry<[keys: Map<string, string[]>, ctor: string], [string, string]> = _curry(
  2,
  tagOf$,
);
const ctorKeysFrom$ = (stmts: Stmt[], i: number, m: Map<string, string[]>): Map<string, string[]> =>
  ((_v) =>
    _v._tag === "None"
      ? m
      : _v._tag === "Some" && _v.value._tag === "SType"
        ? (({ value: { ctors } }) => ctorKeysFrom$(stmts, i + 1, ctorKeysInto(ctors, 0, m)))(
            _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
              value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
            },
          )
        : _v._tag === "Some"
          ? ctorKeysFrom$(stmts, i + 1, m)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, stmts));
const ctorKeysFromStmts$ = (stmts: Stmt[], m: Map<string, string[]>): Map<string, string[]> =>
  ctorKeysFrom$(stmts, 0, m);
export const ctorKeysFromStmts: _Curry<
  [stmts: Stmt[], m: Map<string, string[]>],
  Map<string, string[]>
> = _curry(2, ctorKeysFromStmts$);
const seedKeyCtorsFrom: <A, B, C>(
  ctors: ({ fields: ({ name: Option<string> } & B)[]; name: A } & C)[],
  i: number,
  m: Map<A, string[]>,
) => Map<A, string[]> = _curry(
  3,
  <A, B, C>(
    ctors: ({ fields: ({ name: Option<string> } & B)[]; name: A } & C)[],
    i: number,
    m: Map<A, string[]>,
  ) =>
    match(_Array_get(i, ctors))
      .with({ _tag: "None" }, () => m)
      .with(
        (_v) => _v._tag === "Some",
        ({ value: { name, fields } }) =>
          seedKeyCtorsFrom(ctors, i + 1, _Map_has(name, m) ? m : _Map_set(name, keysOf(fields), m)),
      )
      .exhaustive(),
);
const seedKeyDeclsFrom: <A, B, C, D>(
  decls: ({ ctors: ({ fields: ({ name: Option<string> } & B)[]; name: A } & C)[] } & D)[],
  i: number,
  m: Map<A, string[]>,
) => Map<A, string[]> = _curry(
  3,
  <A, B, C, D>(
    decls: ({ ctors: ({ fields: ({ name: Option<string> } & B)[]; name: A } & C)[] } & D)[],
    i: number,
    m: Map<A, string[]>,
  ) =>
    match(_Array_get(i, decls))
      .with({ _tag: "None" }, () => m)
      .with(
        (_v) => _v._tag === "Some",
        ({ value: { ctors } }) => seedKeyDeclsFrom(decls, i + 1, seedKeyCtorsFrom(ctors, 0, m)),
      )
      .exhaustive(),
);
const seedBuiltinCtorKeys$ = (stmts: Stmt[], m: Map<string, string[]>): Map<string, string[]> =>
  seedKeyDeclsFrom(builtinDeclsFor(stmts), 0, m);
/**
 * Seed builtin variant ctor keys (Some/Ok/…) unless the program declares its
 * own type of that name, or the key is already present (a user decl or an
 * imported ctor's keys win).
 */
export const seedBuiltinCtorKeys: _Curry<
  [stmts: Stmt[], m: Map<string, string[]>],
  Map<string, string[]>
> = _curry(2, seedBuiltinCtorKeys$);
const exportedCtorKeysFrom$ = (
  stmts: Stmt[],
  i: number,
  m: Map<string, string[]>,
): Map<string, string[]> =>
  ((_v) =>
    _v._tag === "None"
      ? m
      : _v._tag === "Some" && _v.value._tag === "SType" && _v.value.exported === true
        ? (({ value: { ctors } }) =>
            exportedCtorKeysFrom$(stmts, i + 1, ctorKeysInto(ctors, 0, m)))(
            _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
              value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
            },
          )
        : _v._tag === "Some"
          ? exportedCtorKeysFrom$(stmts, i + 1, m)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, stmts));
export const exportedCtorKeys: (stmts: Stmt[]) => Map<string, string[]> = (stmts: Stmt[]) =>
  exportedCtorKeysFrom$(stmts, 0, new Map<string, string[]>());
