// Hindley-Milner type inference (Algorithm W) over the alang AST.
//
// Threads a mutable substitution + fresh-var supply. Top-level `let`s are
// generalized (let-polymorphism); lambda parameters stay monomorphic while
// their body is inferred. Field access uses an open row, so a function that
// reads `p.x` accepts any record that has an `x` — structural duck typing.
import { err, isErr, map, ok, type Result } from "@onrails/result";
import type { Ctor, Expr, Pattern, Program, TypeExpr } from "./ast";
import { type AlangError, typeErr } from "./errors";
import type { Span } from "./span";
import {
  type Fresh,
  freshRowVar,
  freshVar,
  mkFresh,
  type Row,
  rEmpty,
  rExtend,
  showType,
  type Type,
  tArrow,
  tBool,
  tCon,
  tNumber,
  tRecord,
  tString,
} from "./types";
import { emptySubst, resolve, resolveRow, type Subst, unify, zonk } from "./unify";

// A polymorphic type scheme: `∀ vars rvars. type`.
export type Scheme = { vars: number[]; rvars: number[]; type: Type };
export type Env = Map<string, Scheme>;
const mono = (t: Type): Scheme => ({ vars: [], rvars: [], type: t });

// alang surface type name → HM type. Unknown names become nullary cons
// (a reference to a declared variant).
const primType = (name: string): Type =>
  ({ float: tNumber, int: tNumber, string: tString, bool: tBool })[name] ?? tCon(name);

// ---- free variables + generalization / instantiation ----------------------

type VarSets = { tv: Set<number>; rv: Set<number> };

const collect = (t: Type, acc: VarSets): void => {
  switch (t.kind) {
    case "var":
      acc.tv.add(t.id);
      return;
    case "con":
      for (const a of t.args) collect(a, acc);
      return;
    case "arrow":
      collect(t.from, acc);
      collect(t.to, acc);
      return;
    case "record":
      collectRow(t.row, acc);
      return;
  }
};

const collectRow = (row: Row, acc: VarSets): void => {
  if (row.kind === "rvar") acc.rv.add(row.id);
  else if (row.kind === "extend") {
    collect(row.type, acc);
    collectRow(row.rest, acc);
  }
};

const freeInType = (t: Type): VarSets => {
  const acc: VarSets = { tv: new Set(), rv: new Set() };
  collect(t, acc);
  return acc;
};

const freeInScheme = (sc: Scheme): VarSets => {
  const f = freeInType(sc.type);
  for (const v of sc.vars) f.tv.delete(v);
  for (const v of sc.rvars) f.rv.delete(v);
  return f;
};

const freeInEnv = (env: Env): VarSets => {
  const acc: VarSets = { tv: new Set(), rv: new Set() };
  for (const sc of env.values()) {
    const f = freeInScheme(sc);
    for (const v of f.tv) acc.tv.add(v);
    for (const v of f.rv) acc.rv.add(v);
  }
  return acc;
};

const generalize = (env: Env, t: Type, s: Subst): Scheme => {
  const zt = zonk(t, s);
  const free = freeInType(zt);
  const bound = freeInEnv(env);
  const vars = [...free.tv].filter((v) => !bound.tv.has(v));
  const rvars = [...free.rv].filter((v) => !bound.rv.has(v));
  return { vars, rvars, type: zt };
};

const instantiate = (sc: Scheme, f: Fresh): Type => {
  const tmap = new Map(sc.vars.map((v) => [v, freshVar(f)]));
  const rmap = new Map(sc.rvars.map((v) => [v, freshRowVar(f)]));
  const sub = (t: Type): Type => {
    switch (t.kind) {
      case "var":
        return tmap.get(t.id) ?? t;
      case "con":
        return tCon(
          t.name,
          t.args.map((a) => sub(a)),
        );
      case "arrow":
        return tArrow(sub(t.from), sub(t.to));
      case "record":
        return tRecord(subRow(t.row));
    }
  };
  const subRow = (row: Row): Row => {
    if (row.kind === "rvar") return rmap.get(row.id) ?? row;
    if (row.kind === "extend") return rExtend(row.label, sub(row.type), subRow(row.rest));
    return row;
  };
  return sub(sc.type);
};

// ---- inference -------------------------------------------------------------

// `open` = open-world: unbound refs get a fresh type var instead of erroring.
// Used when compiling to JS (host globals are legal); strict mode is off.
// `record` (optional) captures each expression's span + inferred type for
// tooling (LSP hover). Types are unzonked here; the caller zonks at the end.
type Ctx = {
  env: Env;
  subst: Subst;
  fresh: Fresh;
  open: boolean;
  record?: (span: Span, t: Type) => void;
};

const u = (a: Type, b: Type, ctx: Ctx, span?: Span): Result<Type, AlangError> => {
  const r = unify(a, b, ctx.subst, ctx.fresh);
  return isErr(r) ? err(typeErr(r.error.message, span)) : ok(a);
};

// Wrapper over `inferExpr`: records the type of every expression node in one
// place, so hover can look up any subexpression's type by span.
const infer = (e: Expr, ctx: Ctx): Result<Type, AlangError> => {
  const r = inferExpr(e, ctx);
  if (ctx.record && !isErr(r)) ctx.record(e.span, r.value);
  return r;
};

const inferExpr = (e: Expr, ctx: Ctx): Result<Type, AlangError> => {
  switch (e.kind) {
    case "num":
      return ok(tNumber);

    case "bool":
      return ok(tBool);

    case "str":
      return ok(tString);

    case "ref": {
      const sc = ctx.env.get(e.name);
      if (sc) return ok(instantiate(sc, ctx.fresh));
      if (ctx.open) return ok(freshVar(ctx.fresh)); // opaque host global
      return err(typeErr(`unbound variable '${e.name}'`, e.span));
    }

    case "lambda": {
      // params monomorphic; function type is curried over them. A record
      // pattern param types as a record with AT LEAST its fields (open row),
      // binding each field in the body — structural duck typing.
      const bodyEnv: Env = new Map(ctx.env);
      const paramTypes: Type[] = e.params.map((p) => {
        if (p.kind === "name") {
          const t = freshVar(ctx.fresh);
          bodyEnv.set(p.name, mono(t));
          return t;
        }
        let row: Row = freshRowVar(ctx.fresh);
        for (const f of p.fields) {
          const ft = freshVar(ctx.fresh);
          bodyEnv.set(f, mono(ft));
          row = rExtend(f, ft, row);
        }
        return tRecord(row);
      });
      const bodyT = infer(e.body, { ...ctx, env: bodyEnv });
      if (isErr(bodyT)) return bodyT;
      return ok(paramTypes.reduceRight((acc, pt) => tArrow(pt, acc), bodyT.value));
    }

    case "call": {
      const fnT = infer(e.fn, ctx);
      if (isErr(fnT)) return fnT;
      let cur = fnT.value;
      for (const arg of e.args) {
        const argT = infer(arg, ctx);
        if (isErr(argT)) return argT;
        const resultT = freshVar(ctx.fresh);
        const uni = u(cur, tArrow(argT.value, resultT), ctx, arg.span);
        if (isErr(uni)) return uni;
        cur = resultT;
      }
      return ok(cur);
    }

    case "pipe": {
      // a |> f  ≡  f(a)
      return infer({ kind: "call", fn: e.right, args: [e.left], span: e.span }, ctx);
    }

    case "record": {
      let row: Row = rEmpty; // a literal is closed — exactly these fields
      for (let i = e.fields.length - 1; i >= 0; i--) {
        const f = e.fields[i]!;
        const ft = infer(f.value, ctx);
        if (isErr(ft)) return ft;
        row = rExtend(f.name, ft.value, row);
      }
      return ok(tRecord(row));
    }

    case "field": {
      // duck typing: target must be a record with AT LEAST field `name`
      const targetT = infer(e.target, ctx);
      if (isErr(targetT)) return targetT;
      const fieldT = freshVar(ctx.fresh);
      const rest = freshRowVar(ctx.fresh);
      const uni = u(targetT.value, tRecord(rExtend(e.name, fieldT, rest)), ctx, e.span);
      if (isErr(uni)) return uni;
      return ok(fieldT);
    }

    case "match":
      return inferMatch(e, ctx);
  }
};

const inferMatch = (e: Extract<Expr, { kind: "match" }>, ctx: Ctx): Result<Type, AlangError> => {
  const scrutT = infer(e.scrutinee, ctx);
  if (isErr(scrutT)) return scrutT;
  const resultT = freshVar(ctx.fresh);

  for (const arm of e.arms) {
    const pat = inferPattern(arm.pattern, ctx);
    if (isErr(pat)) return pat;
    const uScrut = u(scrutT.value, pat.value.type, ctx, arm.pattern.span);
    if (isErr(uScrut)) return uScrut;

    const armEnv: Env = new Map(ctx.env);
    for (const [name, t] of pat.value.bindings) armEnv.set(name, mono(t));
    const bodyT = infer(arm.body, { ...ctx, env: armEnv });
    if (isErr(bodyT)) return bodyT;
    const uBody = u(resultT, bodyT.value, ctx, arm.body.span);
    if (isErr(uBody)) return uBody;
  }
  return ok(resultT);
};

type PatResult = { type: Type; bindings: Map<string, Type> };

const inferPattern = (p: Pattern, ctx: Ctx): Result<PatResult, AlangError> => {
  switch (p.kind) {
    case "pwild":
      return ok({ type: freshVar(ctx.fresh), bindings: new Map() });
    case "plit":
      return ok({ type: tNumber, bindings: new Map() });
    case "pbool":
      return ok({ type: tBool, bindings: new Map() });
    case "pstr":
      return ok({ type: tString, bindings: new Map() });
    case "pbind": {
      const t = freshVar(ctx.fresh);
      return ok({ type: t, bindings: new Map([[p.name, t]]) });
    }
    case "precord": {
      // Open row (duck typing): the scrutinee must have AT LEAST these fields.
      let row: Row = freshRowVar(ctx.fresh);
      const bindings = new Map<string, Type>();
      for (const f of p.fields) {
        const sub = inferPattern(f.pat, ctx);
        if (isErr(sub)) return sub;
        for (const [k, v] of sub.value.bindings) bindings.set(k, v);
        row = rExtend(f.label, sub.value.type, row);
      }
      return ok({ type: tRecord(row), bindings });
    }
    case "pctor": {
      const sc = ctx.env.get(p.ctor);
      if (!sc) return err(typeErr(`unknown constructor '${p.ctor}'`, p.span));
      // instantiated ctor type: argT1 -> ... -> ResultType
      let cur = instantiate(sc, ctx.fresh);
      const bindings = new Map<string, Type>();
      for (const argPat of p.args) {
        const rc = resolve(cur, ctx.subst);
        if (rc.kind !== "arrow")
          return err(typeErr(`constructor '${p.ctor}' applied to too many args`, p.span));
        const sub = inferPattern(argPat, ctx);
        if (isErr(sub)) return sub;
        for (const [k, v] of sub.value.bindings) bindings.set(k, v);
        const uni = u(rc.from, sub.value.type, ctx, argPat.span);
        if (isErr(uni)) return uni;
        cur = rc.to;
      }
      return ok({ type: cur, bindings });
    }
  }
};

// ---- program-level inference ----------------------------------------------

// Convert a surface `extern` type expression into an HM type. Prim names map to
// their type; Uppercase names are nullary constructors; lowercase names are
// type variables (shared by name within the signature, then generalized).
const PRIMS = new Set(["number", "int", "float", "string", "bool"]);
const typeExprToType = (te: TypeExpr, vars: Map<string, Type>, f: Fresh): Type => {
  if (te.kind === "tarrow")
    return tArrow(typeExprToType(te.from, vars, f), typeExprToType(te.to, vars, f));
  if (PRIMS.has(te.name)) return primType(te.name);
  if (/^[A-Z]/.test(te.name)) return tCon(te.name);
  let v = vars.get(te.name);
  if (!v) {
    v = freshVar(f);
    vars.set(te.name, v);
  }
  return v;
};

// A variant's constructors become curried functions into that variant type,
// polymorphic over the type's parameters. `type Result a e = | Ok(a) | Err(e)`
// gives `Ok : ∀a e. a -> Result<a, e>` — each type param maps to a fresh var
// quantified in the scheme; a constructor arg naming a param uses that var, and
// the result type applies the params so matching connects them.
const ctorScheme = (typeName: string, params: string[], c: Ctor, f: Fresh): Scheme => {
  const pvars = new Map(params.map((p) => [p, freshVar(f)]));
  const argType = (name: string): Type => pvars.get(name) ?? primType(name);
  const result = tCon(
    typeName,
    params.map((p) => pvars.get(p)!),
  );
  const type = c.fields.reduceRight((acc, fld) => tArrow(argType(fld.type), acc), result);
  const vars = params.map((p) => (pvars.get(p) as Extract<Type, { kind: "var" }>).id);
  return { vars, rvars: [], type };
};

// `imports` seeds the initial env with schemes brought in by `import` from other
// modules — their generalized types, so a polymorphic import instantiates fresh
// at each use site just like a local binding.
export type InferOptions = { open?: boolean; imports?: Env };

// An inferred type anchored to its source span — the map hover queries.
export type TypeAt = { span: Span; type: Type };
export type InferResult = { env: Env; types: TypeAt[] };

// Shared inference core. Always records per-node types; `inferProgram` drops
// them, `inferProgramTypes` returns them (zonked against the final subst).
function run(
  prog: Program,
  builtins: Record<string, Type>,
  opts: InferOptions,
): Result<InferResult, AlangError> {
  const env: Env = new Map();
  for (const [name, t] of Object.entries(builtins)) env.set(name, mono(t));
  if (opts.imports) for (const [name, sc] of opts.imports) env.set(name, sc);

  const subst = emptySubst();
  const fresh = mkFresh(1000);
  const open = opts.open ?? false;
  const recorded: TypeAt[] = [];
  const record = (span: Span, t: Type): void => {
    recorded.push({ span, type: t });
  };

  // constructors first, so `let`s (in any order after their type) can use them
  for (const s of prog.stmts) {
    if (s.kind !== "type") continue;
    for (const c of s.ctors) env.set(c.name, ctorScheme(s.name, s.params, c, fresh));
  }

  // externs next — their declared type is authoritative; generalize so a
  // polymorphic signature (e.g. a -> a) instantiates fresh at each use site.
  for (const s of prog.stmts) {
    if (s.kind !== "extern") continue;
    const t = typeExprToType(s.typeExpr, new Map(), fresh);
    env.set(s.name, generalize(env, t, subst));
  }

  for (const s of prog.stmts) {
    if (s.kind !== "let") continue;
    // Bind the name (monomorphic) BEFORE inferring the body, so a self-reference
    // resolves to this binding — recursion is soundly typed, not open-world luck.
    const selfT = freshVar(fresh);
    env.set(s.name, mono(selfT));
    const t = infer(s.value, { env, subst, fresh, open, record });
    if (isErr(t)) return t;
    const uni = unify(selfT, t.value, subst, fresh);
    if (isErr(uni)) return err(typeErr(uni.error.message, s.span));
    // generalize the result: monomorphic recursion, polymorphic use afterwards
    env.set(s.name, generalize(env, t.value, subst));
  }
  // Resolve every recorded type now that the whole program's subst is final.
  const types = recorded.map((r) => ({ span: r.span, type: zonk(r.type, subst) }));
  return ok({ env, types });
}

export function inferProgram(
  prog: Program,
  builtins: Record<string, Type> = {},
  opts: InferOptions = {},
): Result<Env, AlangError> {
  return map(run(prog, builtins, opts), (r) => r.env);
}

// Like `inferProgram`, but also returns the span → type map for tooling.
export function inferProgramTypes(
  prog: Program,
  builtins: Record<string, Type> = {},
  opts: InferOptions = {},
): Result<InferResult, AlangError> {
  return run(prog, builtins, opts);
}

// Render a binding's scheme for tests / display. Quantified vars appear as
// 't{id}; the scheme's type is already zonked at generalization time.
export const showScheme = (sc: Scheme): string => showType(sc.type);

export { resolve, resolveRow, zonk };
