// Hindley-Milner type inference (Algorithm W) over the alang AST.
//
// Threads a mutable substitution + fresh-var supply. Top-level `let`s are
// generalized (let-polymorphism); lambda parameters stay monomorphic while
// their body is inferred. Field access uses an open row, so a function that
// reads `p.x` accepts any record that has an `x` — structural duck typing.
import { err, isErr, map, ok, type Result } from "@onrails/result";
import type { Ctor, Expr, Pattern, Program, Stmt, TypeExpr } from "./ast";
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
  ns: Map<string, Map<string, Scheme>>; // qualified collection namespaces (List.map, ...)
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
      // Qualified namespace member (`List.map`): when the target is a bare,
      // unbound reference to a known collection namespace, resolve the member
      // from the namespace's scheme table (instantiated fresh, like a builtin)
      // instead of treating it as a record field access.
      if (e.target.kind === "ref" && ctx.ns.has(e.target.name) && !ctx.env.has(e.target.name)) {
        const sc = ctx.ns.get(e.target.name)!.get(e.name);
        if (!sc) return err(typeErr(`'${e.target.name}' has no member '${e.name}'`, e.span));
        return ok(instantiate(sc, ctx.fresh));
      }
      // duck typing: target must be a record with AT LEAST field `name`
      const targetT = infer(e.target, ctx);
      if (isErr(targetT)) return targetT;
      const fieldT = freshVar(ctx.fresh);
      const rest = freshRowVar(ctx.fresh);
      const uni = u(targetT.value, tRecord(rExtend(e.name, fieldT, rest)), ctx, e.span);
      if (isErr(uni)) return uni;
      return ok(fieldT);
    }

    case "arr": {
      // Every element shares one type; `Array<elem>` (the eager JS array — a
      // future lazy `List` is a separate type). An empty list is fully
      // polymorphic (`Array<'a>`), pinned by later unification / use.
      const elem = freshVar(ctx.fresh);
      for (const el of e.elements) {
        const et = infer(el, ctx);
        if (isErr(et)) return et;
        const uni = u(elem, et.value, ctx, el.span);
        if (isErr(uni)) return uni;
      }
      return ok(tCon("Array", [elem]));
    }

    case "list": {
      // Lazy List: elements share one type, result is `List<elem>`. Empty `@{}`
      // is polymorphic (`List<'a>`), pinned by later use.
      const elem = freshVar(ctx.fresh);
      for (const el of e.elements) {
        const et = infer(el, ctx);
        if (isErr(et)) return et;
        const uni = u(elem, et.value, ctx, el.span);
        if (isErr(uni)) return uni;
      }
      return ok(tCon("List", [elem]));
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

// Wrapper over `inferPat`: records every pattern node's span + type, so hover
// and inlay can look up a pattern-bound name (or a whole constructor pattern) by
// span — the pattern-side analogue of `infer` recording expression nodes.
const inferPattern = (p: Pattern, ctx: Ctx): Result<PatResult, AlangError> => {
  const r = inferPat(p, ctx);
  if (ctx.record && !isErr(r)) ctx.record(p.span, r.value.type);
  return r;
};

const inferPat = (p: Pattern, ctx: Ctx): Result<PatResult, AlangError> => {
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
    case "parr": {
      // Every element shares the element type; the whole pattern is `Array<elem>`.
      // A `...rest` capture binds the tail, itself an `Array<elem>`.
      const elem = freshVar(ctx.fresh);
      const listT = tCon("Array", [elem]);
      const bindings = new Map<string, Type>();
      for (const ep of p.elems) {
        const sub = inferPattern(ep, ctx);
        if (isErr(sub)) return sub;
        for (const [k, v] of sub.value.bindings) bindings.set(k, v);
        const uni = u(elem, sub.value.type, ctx, ep.span);
        if (isErr(uni)) return uni;
      }
      if (p.rest) {
        const sub = inferPattern(p.rest, ctx);
        if (isErr(sub)) return sub;
        for (const [k, v] of sub.value.bindings) bindings.set(k, v);
        const uni = u(sub.value.type, listT, ctx, p.rest.span);
        if (isErr(uni)) return uni;
      }
      return ok({ type: listT, bindings });
    }
    case "plist": {
      // Lazy-List pattern: elements share the element type, the whole pattern is
      // `List<elem>`; a `...rest` capture binds the tail, itself a `List<elem>`.
      const elem = freshVar(ctx.fresh);
      const seqT = tCon("List", [elem]);
      const bindings = new Map<string, Type>();
      for (const ep of p.elems) {
        const sub = inferPattern(ep, ctx);
        if (isErr(sub)) return sub;
        for (const [k, v] of sub.value.bindings) bindings.set(k, v);
        const uni = u(elem, sub.value.type, ctx, ep.span);
        if (isErr(uni)) return uni;
      }
      if (p.rest) {
        const sub = inferPattern(p.rest, ctx);
        if (isErr(sub)) return sub;
        for (const [k, v] of sub.value.bindings) bindings.set(k, v);
        const uni = u(sub.value.type, seqT, ctx, p.rest.span);
        if (isErr(uni)) return uni;
      }
      return ok({ type: seqT, bindings });
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
  if (te.kind === "tapp")
    return tCon(
      te.ctor,
      te.args.map((a) => typeExprToType(a, vars, f)),
    );
  if (te.kind === "tlist") return tCon("Array", [typeExprToType(te.elem, vars, f)]);
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
export type InferOptions = {
  open?: boolean;
  imports?: Env;
  namespaces?: Record<string, Record<string, Type>>; // qualified members (List.map, ...)
};

// An inferred type anchored to its source span — the map hover queries.
export type TypeAt = { span: Span; type: Type };
export type InferResult = { env: Env; types: TypeAt[] };

// The names a pattern binds — excluded from an arm body's free references.
const patternBinds = (p: Pattern): string[] => {
  if (p.kind === "pbind") return [p.name];
  if (p.kind === "precord") return p.fields.flatMap((f) => patternBinds(f.pat));
  if (p.kind === "pctor") return p.args.flatMap(patternBinds);
  if (p.kind === "parr" || p.kind === "plist")
    return [...p.elems.flatMap(patternBinds), ...(p.rest ? patternBinds(p.rest) : [])];
  return [];
};

// Collect the free variable references in an expression, minus the locally
// bound ones (lambda params, pattern binds). Used to build the dependency graph
// among top-level `let`s so mutually recursive groups infer together.
const freeRefs = (e: Expr, bound: Set<string>, acc: Set<string>): void => {
  switch (e.kind) {
    case "num":
    case "bool":
    case "str":
      return;
    case "ref":
      if (!bound.has(e.name)) acc.add(e.name);
      return;
    case "call":
      freeRefs(e.fn, bound, acc);
      for (const a of e.args) freeRefs(a, bound, acc);
      return;
    case "lambda": {
      const inner = new Set(bound);
      for (const p of e.params)
        if (p.kind === "name") inner.add(p.name);
        else for (const f of p.fields) inner.add(f);
      freeRefs(e.body, inner, acc);
      return;
    }
    case "pipe":
      freeRefs(e.left, bound, acc);
      freeRefs(e.right, bound, acc);
      return;
    case "match":
      freeRefs(e.scrutinee, bound, acc);
      for (const arm of e.arms) {
        const inner = new Set(bound);
        for (const n of patternBinds(arm.pattern)) inner.add(n);
        freeRefs(arm.body, inner, acc);
      }
      return;
    case "record":
      for (const f of e.fields) freeRefs(f.value, bound, acc);
      return;
    case "field":
      freeRefs(e.target, bound, acc);
      return;
    case "arr":
    case "list":
      for (const el of e.elements) freeRefs(el, bound, acc);
  }
};

// Tarjan's SCC over the `let` dependency graph. Returns strongly-connected
// components (mutually recursive groups) in DEPENDENCY-FIRST order — exactly the
// order to generalize them, since a group's dependencies are already generalized
// by the time it's inferred. Tarjan naturally emits SCCs in reverse-topological
// order, which is that order.
const stronglyConnected = (adj: number[][]): number[][] => {
  const n = adj.length;
  const index = new Array<number>(n).fill(-1);
  const low = new Array<number>(n).fill(0);
  const onStack = new Array<boolean>(n).fill(false);
  const stack: number[] = [];
  const sccs: number[][] = [];
  let counter = 0;

  const connect = (v: number): void => {
    index[v] = counter;
    low[v] = counter;
    counter++;
    stack.push(v);
    onStack[v] = true;
    for (const w of adj[v]!) {
      if (index[w] === -1) {
        connect(w);
        low[v] = Math.min(low[v]!, low[w]!);
      } else if (onStack[w]) {
        low[v] = Math.min(low[v]!, index[w]!);
      }
    }
    if (low[v] === index[v]) {
      const comp: number[] = [];
      for (;;) {
        const w = stack.pop()!;
        onStack[w] = false;
        comp.push(w);
        if (w === v) break;
      }
      sccs.push(comp);
    }
  };

  for (let i = 0; i < n; i++) if (index[i] === -1) connect(i);
  return sccs;
};

// Shared inference core. Always records per-node types; `inferProgram` drops
// them, `inferProgramTypes` returns them (zonked against the final subst).
function run(
  prog: Program,
  builtins: Record<string, Type>,
  opts: InferOptions,
): Result<InferResult, AlangError> {
  const env: Env = new Map();
  const subst = emptySubst();
  // Builtins are generalized, not monomorphic: a prelude type carrying type vars
  // (e.g. `map : (a -> b) -> [a] -> [b]`) becomes a scheme that instantiates
  // fresh at each use site. Monomorphic builtins (`add : number -> ...`) have no
  // free vars, so generalizing them is a no-op.
  for (const [name, t] of Object.entries(builtins)) env.set(name, generalize(env, t, subst));
  if (opts.imports) for (const [name, sc] of opts.imports) env.set(name, sc);

  // Qualified-namespace members (`List.map`, …): generalize each like a builtin,
  // so a use site instantiates it fresh. Resolved in the `field` case.
  const ns = new Map<string, Map<string, Scheme>>();
  for (const [nsName, members] of Object.entries(opts.namespaces ?? {})) {
    const schemes = new Map<string, Scheme>();
    for (const [m, t] of Object.entries(members)) schemes.set(m, generalize(env, t, subst));
    ns.set(nsName, schemes);
  }

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

  // `let`s, grouped into mutually-recursive components (SCCs of the reference
  // graph) and inferred group-by-group in dependency-first order. Within a
  // group every member is pre-bound monomorphically, so `f`/`g` that call each
  // other resolve to these bindings; the group generalizes as a unit afterwards.
  const lets = prog.stmts.filter((s): s is Extract<Stmt, { kind: "let" }> => s.kind === "let");
  const idxOf = new Map(lets.map((s, i) => [s.name, i]));
  const adj = lets.map((s) => {
    const refs = new Set<string>();
    freeRefs(s.value, new Set(), refs);
    const deps: number[] = [];
    for (const r of refs) {
      const j = idxOf.get(r);
      if (j !== undefined) deps.push(j);
    }
    return deps;
  });

  for (const comp of stronglyConnected(adj)) {
    const group = comp.map((i) => lets[i]!);
    // Pre-bind every member (monomorphic) BEFORE inferring any body, so mutual
    // references resolve to these bindings — recursion is soundly typed.
    const selfVars = new Map<string, Type>();
    for (const s of group) {
      const v = freshVar(fresh);
      selfVars.set(s.name, v);
      env.set(s.name, mono(v));
    }
    const bodyTypes = new Map<string, Type>();
    for (const s of group) {
      const t = infer(s.value, { env, subst, fresh, open, ns, record });
      if (isErr(t)) return t;
      const uni = unify(selfVars.get(s.name)!, t.value, subst, fresh);
      if (isErr(uni)) return err(typeErr(uni.error.message, s.span));
      bodyTypes.set(s.name, t.value);
    }
    // Generalize the group against the OUTER env — drop the mono self-bindings
    // first, else the group's own type vars look env-bound and stay ungeneralized.
    // Monomorphic recursion within the group, polymorphic use afterwards.
    for (const s of group) env.delete(s.name);
    for (const s of group) env.set(s.name, generalize(env, bodyTypes.get(s.name)!, subst));
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
