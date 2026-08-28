import type { Ctor, CtorField, Span, Stmt } from "./ast";
import type { PErr } from "./parser";

export type Option<A> = { _tag: "Some"; value: A } | { _tag: "None" };
export type Result<A, B> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: B };
export type CtorInfo = { owner: string; arity: number };
export type Registry = { ctors: Map<string, CtorInfo>; types: Map<string, string[]> };

import type { _Curry } from "@mochi/compiler/runtime";

import {
  _curry,
  _recur,
  _done,
  Some,
  None,
  Ok,
  Err,
  add,
  eq,
  show,
  not,
  length,
  map,
  filter,
  _Map_has,
  _Map_set,
  _Option_unwrapOr,
  _Result_map,
  _Result_flatMap,
  _Array_get,
  _Array_prepend,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "./ast";

const emptyRegistry: Registry = {
  ctors: new Map<string, CtorInfo>(),
  types: new Map<string, string[]>(),
};
export const primTypeNames = ["number", "int", "float", "string", "bool", "unit"];
const keysOfFrom: <A>(fields: ({ name: Option<string> } & A)[], i: number) => string[] = _curry(
  2,
  <A>(fields: ({ name: Option<string> } & A)[], i: number) =>
    match(_Array_get(i, fields))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: f }) =>
        _Array_prepend(_Option_unwrapOr(`_${show(i)}`, f.name), keysOfFrom(fields, add(i, 1))),
      )
      .exhaustive(),
);
export const keysOf: <A>(fields: ({ name: Option<string> } & A)[]) => string[] = <A>(
  fields: ({ name: Option<string> } & A)[],
) => keysOfFrom(fields, 0);
const builtinSpan: Span = { start: 0, end: 0 };
export const builtinTypeDecls: { name: string; params: string[]; ctors: Ctor[] }[] = [
  {
    name: "Option",
    params: ["a"],
    ctors: [
      {
        name: "Some",
        fields: [
          { name: Some("value") as Option<string>, fieldType: Ast.TyName("a", builtinSpan) },
        ],
      },
      { name: "None", fields: [] as CtorField[] },
    ],
  },
  {
    name: "Result",
    params: ["a", "e"],
    ctors: [
      {
        name: "Ok",
        fields: [
          { name: Some("value") as Option<string>, fieldType: Ast.TyName("a", builtinSpan) },
        ],
      },
      {
        name: "Err",
        fields: [
          { name: Some("error") as Option<string>, fieldType: Ast.TyName("e", builtinSpan) },
        ],
      },
    ],
  },
];
const declaresType: _Curry<[stmts: Stmt[], i: number, name: string], boolean> = _curry(
  3,
  (stmts: Stmt[], i: number, name: string) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => false)
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SType";
        },
        ({ value: { name: n } }) => (eq(n, name) ? true : declaresType(stmts, add(i, 1), name)),
      )
      .with({ _tag: "Some" }, () => declaresType(stmts, add(i, 1), name))
      .exhaustive(),
);
export const builtinDeclsFor: (
  stmts: Stmt[],
) => { name: string; params: string[]; ctors: Ctor[] }[] = (stmts: Stmt[]) =>
  filter(
    (bt: { name: string; params: string[]; ctors: Ctor[] }) => not(declaresType(stmts, 0, bt.name)),
    builtinTypeDecls,
  );
const seedRegCtorsFrom: <A, B, C, D>(
  ctors: ({ name: A; fields: B[] } & D)[],
  i: number,
  owner: C,
  acc: Map<A, { owner: C; arity: number }>,
) => Map<A, { owner: C; arity: number }> = _curry(
  4,
  <A, B, C, D>(
    ctors: ({ name: A; fields: B[] } & D)[],
    i: number,
    owner: C,
    acc: Map<A, { owner: C; arity: number }>,
  ) =>
    match(_Array_get(i, ctors))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: c }) =>
        seedRegCtorsFrom(
          ctors,
          add(i, 1),
          owner,
          _Map_has(c.name, acc)
            ? acc
            : _Map_set(c.name, { owner: owner, arity: length(c.fields) }, acc),
        ),
      )
      .exhaustive(),
);
const seedRegDeclsFrom: <A, B, C, D, E>(
  decls: ({ name: A; ctors: ({ name: B; fields: C[] } & D)[] } & E)[],
  i: number,
  reg: { types: Map<A, B[]>; ctors: Map<B, { owner: A; arity: number }> },
) => { types: Map<A, B[]>; ctors: Map<B, { owner: A; arity: number }> } = _curry(
  3,
  <A, B, C, D, E>(
    decls: ({ name: A; ctors: ({ name: B; fields: C[] } & D)[] } & E)[],
    i: number,
    reg: { types: Map<A, B[]>; ctors: Map<B, { owner: A; arity: number }> },
  ) =>
    match(_Array_get(i, decls))
      .with({ _tag: "None" }, () => reg)
      .with({ _tag: "Some" }, ({ value: bt }) =>
        seedRegDeclsFrom(decls, add(i, 1), {
          ctors: seedRegCtorsFrom(bt.ctors, 0, bt.name, reg.ctors),
          types: _Map_set(
            bt.name,
            map((c: { name: B; fields: C[] } & D) => c.name, bt.ctors),
            reg.types,
          ),
        }),
      )
      .exhaustive(),
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
const ctorsInto: <A, B, C, D, E, F>(
  ctors: ({ name: string; fields: A[] } & E)[],
  i: number,
  owner: B,
  sp: { end: C; start: D } & F,
  acc: Map<string, { owner: B; arity: number }>,
) => Result<Map<string, { owner: B; arity: number }>, { message: string; start: D; end: C }> =
  _curry(
    5,
    <A, B, C, D, E, F>(
      ctors: ({ name: string; fields: A[] } & E)[],
      i: number,
      owner: B,
      sp: { end: C; start: D } & F,
      acc: Map<string, { owner: B; arity: number }>,
    ) =>
      match(_Array_get(i, ctors))
        .with({ _tag: "None" }, () => Ok(acc))
        .with({ _tag: "Some" }, ({ value: c }) =>
          _Map_has(c.name, acc)
            ? Err(ctorErr(`duplicate constructor '${c.name}'`, sp))
            : ctorsInto(
                ctors,
                add(i, 1),
                owner,
                sp,
                _Map_set(c.name, { owner: owner, arity: length(c.fields) }, acc),
              ),
        )
        .exhaustive(),
  );
const buildLoop: _Curry<[stmts: Stmt[], i: number, reg: Registry], Result<Registry, PErr>> = _curry(
  3,
  (stmts: Stmt[], i: number, reg: Registry) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => Ok(reg) as Result<Registry, PErr>)
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SType";
        },
        ({ value: { name, ctors, span: sp } }) =>
          _Map_has(name, reg.types)
            ? (Err(ctorErr(`duplicate type '${name}'`, sp)) as Result<Registry, PErr>)
            : _Result_flatMap(
                (cs: Map<string, CtorInfo>) =>
                  buildLoop(stmts, add(i, 1), {
                    ctors: cs,
                    types: _Map_set(
                      name,
                      map((c: Ctor) => c.name, ctors),
                      reg.types,
                    ),
                  }),
                ctorsInto(ctors, 0, name, sp, reg.ctors),
              ),
      )
      .with({ _tag: "Some" }, () => buildLoop(stmts, add(i, 1), reg))
      .exhaustive(),
);
export const buildRegistry: (stmts: Stmt[]) => Result<Registry, PErr> = (stmts: Stmt[]) =>
  _Result_map(
    (reg: Registry) => seedRegDeclsFrom(builtinDeclsFor(stmts), 0, reg),
    buildLoop(stmts, 0, emptyRegistry),
  );
const exportedRegLoop: _Curry<[stmts: Stmt[], i0: number, reg0: Registry], Registry> = _curry(
  3,
  (stmts: Stmt[], i0: number, reg0: Registry) => {
    let i: number = i0;
    let reg: Registry = reg0;
    while (true) {
      const _step = match(_Array_get(i, stmts))
        .with({ _tag: "None" }, () => _done(reg))
        .with(
          (
            _v,
          ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
            value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
          } => {
            const _g: any = _v;
            return _g._tag === "Some" && _g.value._tag === "SType" && _g.value.exported === true;
          },
          ({ value: { name, ctors } }) =>
            _recur(add(i, 1), {
              ctors: seedRegCtorsFrom(ctors, 0, name, reg.ctors),
              types: _Map_set(
                name,
                map((c: Ctor) => c.name, ctors),
                reg.types,
              ),
            }),
        )
        .with({ _tag: "Some" }, () => _recur(add(i, 1), reg))
        .exhaustive();
      if (_step._tag === "recur") {
        [i, reg] = _step.args;
        continue;
      }
      return _step.value;
    }
  },
);
export const exportedRegistry: (stmts: Stmt[]) => Registry = (stmts: Stmt[]) =>
  exportedRegLoop(stmts, 0, emptyRegistry);
const ctorKeysInto: <A, B, C>(
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
          ctorKeysInto(ctors, add(i, 1), _Map_set(name, keysOf(fields), m)),
      )
      .exhaustive(),
);
const ctorKeysFrom: _Curry<
  [stmts: Stmt[], i: number, m: Map<string, string[]>],
  Map<string, string[]>
> = _curry(3, (stmts: Stmt[], i: number, m: Map<string, string[]>) =>
  match(_Array_get(i, stmts))
    .with({ _tag: "None" }, () => m)
    .with(
      (
        _v,
      ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
        value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "Some" && _g.value._tag === "SType";
      },
      ({ value: { ctors } }) => ctorKeysFrom(stmts, add(i, 1), ctorKeysInto(ctors, 0, m)),
    )
    .with({ _tag: "Some" }, () => ctorKeysFrom(stmts, add(i, 1), m))
    .exhaustive(),
);
export const ctorKeysFromStmts: _Curry<
  [stmts: Stmt[], m: Map<string, string[]>],
  Map<string, string[]>
> = _curry(2, (stmts: Stmt[], m: Map<string, string[]>) => ctorKeysFrom(stmts, 0, m));
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
          seedKeyCtorsFrom(
            ctors,
            add(i, 1),
            _Map_has(name, m) ? m : _Map_set(name, keysOf(fields), m),
          ),
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
        ({ value: { ctors } }) => seedKeyDeclsFrom(decls, add(i, 1), seedKeyCtorsFrom(ctors, 0, m)),
      )
      .exhaustive(),
);
export const seedBuiltinCtorKeys: _Curry<
  [stmts: Stmt[], m: Map<string, string[]>],
  Map<string, string[]>
> = _curry(2, (stmts: Stmt[], m: Map<string, string[]>) =>
  seedKeyDeclsFrom(builtinDeclsFor(stmts), 0, m),
);
const exportedCtorKeysFrom: _Curry<
  [stmts: Stmt[], i: number, m: Map<string, string[]>],
  Map<string, string[]>
> = _curry(3, (stmts: Stmt[], i: number, m: Map<string, string[]>) =>
  match(_Array_get(i, stmts))
    .with({ _tag: "None" }, () => m)
    .with(
      (
        _v,
      ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
        value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "Some" && _g.value._tag === "SType" && _g.value.exported === true;
      },
      ({ value: { ctors } }) => exportedCtorKeysFrom(stmts, add(i, 1), ctorKeysInto(ctors, 0, m)),
    )
    .with({ _tag: "Some" }, () => exportedCtorKeysFrom(stmts, add(i, 1), m))
    .exhaustive(),
);
export const exportedCtorKeys: (stmts: Stmt[]) => Map<string, string[]> = (stmts: Stmt[]) =>
  exportedCtorKeysFrom(stmts, 0, new Map<string, string[]>());
