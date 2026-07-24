/**
 * Hindley-Milner type inference (Algorithm W) over the mochi AST.
 *
 * Threads a mutable substitution + fresh-var supply. Top-level `let`s are
 * generalized (let-polymorphism); lambda parameters stay monomorphic while
 * their body is inferred. Field access uses an open row, so a function that
 * reads `p.x` accepts any record that has an `x` — structural duck typing.
 */
import { match } from "@onrails/pattern";
import { err, isErr, map, ok, type Result } from "@onrails/result";
import type {
  Expr,
  LamParam,
  LetBindExpr,
  LetStmt,
  MapEntry,
  MatchExpr,
  Pattern,
  Program,
  SeqElem,
  TernaryExpr,
} from "./ast";

type RefExpr = Extract<Expr, { kind: "ref" }>;
type LambdaExpr = Extract<Expr, { kind: "lambda" }>;
type LetInExpr = Extract<Expr, { kind: "letin" }>;
type CallExpr = Extract<Expr, { kind: "call" }>;
type RecordExpr = Extract<Expr, { kind: "record" }>;
type FieldExpr = Extract<Expr, { kind: "field" }>;
type TupleExpr = Extract<Expr, { kind: "tuple" }>;

import { ctorTableOf } from "./ctors";
import {
  type AliasMap,
  aliasRow,
  ctorScheme,
  type Env,
  freeInType,
  generalize,
  instantiate,
  mono,
  type Scheme,
  typeExprToType,
} from "./schemes";

/** Re-exported: `Scheme`/`Env` are this module's result vocabulary. */
export type { AliasMap, Env, Scheme } from "./schemes";

import { type Diagnostic, typeErr } from "./errors";
import { stronglyConnected } from "./scc";
import type { Span } from "./span";
import { closestName } from "./suggest";
import {
  type AliasDef,
  aliasParamId,
  type Fresh,
  foldAliases,
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
  tTuple,
  tVar,
} from "./types";
import { emptySubst, resolve, resolveRow, type Subst, unify, zonk } from "./unify";

/**
 * Inference context. `open`: unbound refs get a fresh type var (host globals
 * when compiling to JS). `record`: optional span → type hook for LSP hover
 * (unzonked; caller zonks at the end). `noteUse`/`noteLet`: TS emit (ADR 0035).
 */
type Ctx = {
  env: Env;
  subst: Subst;
  fresh: Fresh;
  open: boolean;
  ns: Map<string, Map<string, Scheme>>; // qualified collection namespaces (List.map, ...)
  aliases: AliasDef[]; // transparent record aliases, for folding types in errors
  aliasMap: AliasMap; // raw alias fields, for resolving binding annotations (`let x : T`)
  record?: (span: Span, t: Type, symbol?: SymbolInfo) => void;
  noteUse?: (sc: Scheme, t: Type) => void;
  noteLet?: (sc: Scheme, valueSpan: Span) => void;
};

const u = (a: Type, b: Type, ctx: Ctx, span?: Span): Result<Type, Diagnostic> => {
  const r = unify(a, b, ctx.subst, ctx.fresh, (t) => showType(foldAliases(t, ctx.aliases)));
  return isErr(r) ? err(typeErr(r.error.message, span)) : ok(a);
};

/**
 * Wrapper over `inferExpr`: records the type of every expression node in one
 * place, so hover can look up any subexpression's type by span.
 */
const infer = (e: Expr, ctx: Ctx): Result<Type, Diagnostic> => {
  const r = inferExpr(e, ctx);
  if (ctx.record && !isErr(r))
    ctx.record(
      e.span,
      r.value,
      e.kind === "field" ? { kind: "property", name: e.name } : undefined,
    );
  return r;
};

/** cond ? then : else — cond is bool, the branches share one type. */
const inferTernary = (e: TernaryExpr, ctx: Ctx): Result<Type, Diagnostic> => {
  const condT = infer(e.cond, ctx);
  if (isErr(condT)) return condT;
  const condU = u(condT.value, tBool, ctx, e.cond.span);
  if (isErr(condU)) return condU;
  const thenT = infer(e.then, ctx);
  if (isErr(thenT)) return thenT;
  const elseT = infer(e.else, ctx);
  if (isErr(elseT)) return elseT;
  const uni = u(thenT.value, elseT.value, ctx, e.else.span);
  return isErr(uni) ? uni : ok(thenT.value);
};

/**
 * Bind one lambda-param form monomorphically into `env`, returning its type.
 * A record param types as an open row (duck typing), like a lambda's.
 */
const bindParam = (p: LamParam, env: Env, ctx: Ctx): Type => {
  if (p.kind === "name") {
    const t = freshVar(ctx.fresh);
    env.set(p.name, mono(t));
    return t;
  }
  if (p.kind === "ptuple") {
    const elems = p.names.map((n) => {
      const t = freshVar(ctx.fresh);
      env.set(n, mono(t));
      return t;
    });
    return tTuple(elems);
  }
  let row: Row = freshRowVar(ctx.fresh);
  for (const f of p.fields) {
    const ft = freshVar(ctx.fresh);
    env.set(f, mono(ft));
    row = rExtend(f, ft, row);
  }
  return tRecord(row);
};

/**
 * let? param = value in body — monadic bind on Result (ADR 0017). The value is
 * a `Result a e`; the Ok payload binds the param; the body is itself a Result
 * sharing the same error type, and the whole expression has the body's type.
 */
function inferLetBind(e: LetBindExpr, ctx: Ctx): Result<Type, Diagnostic> {
  const valT = infer(e.value, ctx);
  if (isErr(valT)) return valT;
  const okT = freshVar(ctx.fresh);
  const errT = freshVar(ctx.fresh);
  const uv = u(valT.value, tCon("Result", [okT, errT]), ctx, e.value.span);
  if (isErr(uv)) return uv;
  const bodyEnv: Env = new Map(ctx.env);
  const paramT = bindParam(e.param, bodyEnv, ctx);
  const up = u(paramT, okT, ctx, e.paramSpan);
  if (isErr(up)) return up;
  if (ctx.record && e.param.kind === "name")
    ctx.record(e.paramSpan, okT, { kind: "let", name: e.param.name });
  const bodyT = infer(e.body, { ...ctx, env: bodyEnv });
  if (isErr(bodyT)) return bodyT;
  const resT = freshVar(ctx.fresh);
  const ub = u(bodyT.value, tCon("Result", [resT, errT]), ctx, e.body.span);
  return isErr(ub) ? ub : ok(tCon("Result", [resT, errT]));
}

/**
 * Every hole of a "…${x}…" unifies with `string` (ADR 0023) — no implicit
 * `show`. Pulled out of `inferExpr`'s switch to keep its complexity down.
 */
function inferInterp(parts: (string | Expr)[], ctx: Ctx): Result<Type, Diagnostic> {
  for (const p of parts) {
    if (typeof p === "string") continue;
    const pt = infer(p, ctx);
    if (isErr(pt)) return pt;
    const uni = u(pt.value, tString, ctx, p.span);
    if (isErr(uni)) return uni;
  }
  return ok(tString);
}

/**
 * Record the type of an EMPTY collection literal (`#{}`/`[]`/`@{}`) at its span,
 * passing the inferred Result through. Only empties are recorded — a non-empty
 * literal's element type is already inferable by tsc from its members (ADR 0035).
 */
function recordEmpty(
  span: Span,
  len: number,
  r: Result<Type, Diagnostic>,
  ctx: Ctx,
): Result<Type, Diagnostic> {
  if (len === 0 && !isErr(r)) ctx.record?.(span, r.value);
  return r;
}

function inferRef(e: RefExpr, ctx: Ctx): Result<Type, Diagnostic> {
  const sc = ctx.env.get(e.name);
  if (sc) {
    const inst = instantiate(sc, ctx.fresh);
    ctx.noteUse?.(sc, inst);
    if (inst.kind === "con" && inst.args.length > 0 && /^[A-Z]/.test(e.name))
      ctx.record?.(e.span, inst);
    return ok(inst);
  }
  // Did-you-mean only in strict mode. Open-world leaves unknown names as fresh
  // vars (host globals); guessing there false-positives on names like `empty2`.
  if (ctx.open) return ok(freshVar(ctx.fresh));
  const hint = closestName(e.name, ctx.env.keys());
  if (hint) {
    return err(
      typeErr(`unbound variable '${e.name}'`, e.span, {
        help: `did you mean '${hint}'?`,
        suggestions: [
          {
            location: { path: "", span: e.span },
            replaceWith: hint,
            title: `Did you mean '${hint}'?`,
          },
        ],
      }),
    );
  }
  return err(
    typeErr(`unbound variable '${e.name}'`, e.span, {
      help: "bind the name before using it, or check the spelling",
    }),
  );
}

function inferLambda(e: LambdaExpr, ctx: Ctx): Result<Type, Diagnostic> {
  const bodyEnv: Env = new Map(ctx.env);
  const paramTypes: Type[] = e.params.map((p) => bindParam(p, bodyEnv, ctx));
  const bodyT = infer(e.body, { ...ctx, env: bodyEnv });
  return isErr(bodyT)
    ? bodyT
    : ok(paramTypes.reduceRight((acc, pt) => tArrow(pt, acc), bodyT.value));
}

function inferLetIn(e: LetInExpr, ctx: Ctx): Result<Type, Diagnostic> {
  const valT = infer(e.value, ctx);
  if (isErr(valT)) return valT;
  if (e.annot) {
    const at = typeExprToType(e.annot, new Map(), ctx.fresh, ctx.aliasMap);
    const au = u(valT.value, at, ctx, e.annot.span);
    if (isErr(au)) return au;
  }
  const scheme = generalize(ctx.env, valT.value, ctx.subst);
  if (ctx.record) ctx.record(e.nameSpan, valT.value, { kind: "let", name: e.name });
  const bodyEnv: Env = new Map(ctx.env);
  bodyEnv.set(e.name, scheme);
  ctx.noteLet?.(scheme, e.value.span);
  return infer(e.body, { ...ctx, env: bodyEnv });
}

function inferCall(e: CallExpr, ctx: Ctx): Result<Type, Diagnostic> {
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

function inferRecord(e: RecordExpr, ctx: Ctx): Result<Type, Diagnostic> {
  let row: Row = rEmpty;
  const fieldTs: [string, Type][] = [];
  for (let i = e.fields.length - 1; i >= 0; i--) {
    const f = e.fields[i]!;
    const ft = infer(f.value, ctx);
    if (isErr(ft)) return ft;
    row = rExtend(f.name, ft.value, row);
    fieldTs.push([f.name, ft.value]);
  }
  if (!e.spread) return ok(tRecord(row));
  const baseT = infer(e.spread, ctx);
  if (isErr(baseT)) return baseT;
  let req: Row = freshRowVar(ctx.fresh);
  for (const [name, t] of fieldTs) req = rExtend(name, t, req);
  const uni = u(baseT.value, tRecord(req), ctx, e.span);
  return isErr(uni) ? uni : ok(baseT.value);
}

function inferField(e: FieldExpr, ctx: Ctx): Result<Type, Diagnostic> {
  if (e.target.kind === "ref" && ctx.ns.has(e.target.name) && !ctx.env.has(e.target.name)) {
    const sc = ctx.ns.get(e.target.name)!.get(e.name);
    return !sc
      ? err(typeErr(`'${e.target.name}' has no member '${e.name}'`, e.span))
      : ok(instantiate(sc, ctx.fresh));
  }
  const targetT = infer(e.target, ctx);
  if (isErr(targetT)) return targetT;
  const fieldT = freshVar(ctx.fresh);
  const rest = freshRowVar(ctx.fresh);
  const uni = u(targetT.value, tRecord(rExtend(e.name, fieldT, rest)), ctx, e.span);
  return isErr(uni) ? uni : ok(fieldT);
}

function inferTuple(e: TupleExpr, ctx: Ctx): Result<Type, Diagnostic> {
  const elems: Type[] = [];
  for (const el of e.elements) {
    const et = infer(el, ctx);
    if (isErr(et)) return et;
    elems.push(et.value);
  }
  return ok(tTuple(elems));
}

function inferExpr(e: Expr, ctx: Ctx): Result<Type, Diagnostic> {
  return match(e)
    .with({ kind: "num" }, () => ok(tNumber))
    .with({ kind: "bool" }, () => ok(tBool))
    .with({ kind: "str" }, () => ok(tString))
    .with({ kind: "interp" }, (interp) => inferInterp(interp.parts, ctx))
    .with({ kind: "ref" }, (ref) => inferRef(ref, ctx))
    .with({ kind: "lambda" }, (lambda) => inferLambda(lambda, ctx))
    .with({ kind: "letin" }, (letin) => inferLetIn(letin, ctx))
    .with({ kind: "call" }, (call) => inferCall(call, ctx))
    .with({ kind: "pipe" }, (pipe) =>
      infer({ kind: "call", fn: pipe.right, args: [pipe.left], span: pipe.span }, ctx),
    )
    .with({ kind: "ternary" }, (ternary) => inferTernary(ternary, ctx))
    .with({ kind: "letbind" }, (letbind) => inferLetBind(letbind, ctx))
    .with({ kind: "record" }, (record) => inferRecord(record, ctx))
    .with({ kind: "field" }, (field) => inferField(field, ctx))
    .with({ kind: "tuple" }, (tuple) => inferTuple(tuple, ctx))
    .with({ kind: "arr" }, (arr) =>
      recordEmpty(arr.span, arr.elements.length, inferSeqSlots("Array", arr.elements, ctx), ctx),
    )
    .with({ kind: "list" }, (list) =>
      recordEmpty(list.span, list.elements.length, inferSeqSlots("List", list.elements, ctx), ctx),
    )
    .with({ kind: "set" }, (set) => inferSeqSlots("Set", set.elements, ctx))
    .with({ kind: "map" }, (mapExpr) =>
      recordEmpty(mapExpr.span, mapExpr.entries.length, inferMapExpr(mapExpr.entries, ctx), ctx),
    )
    .with({ kind: "match" }, (matchExpr) => inferMatch(matchExpr, ctx))
    .exhaustive();
}

/**
 * Homogeneous sequence with optional spreads (`[a, ...xs]`, `@{a, ...xs}`,
 * `#{a, ...s}`). Fixed slots unify with `elem`; each spread unifies with
 * `con<elem>` (Array / List / Set).
 */
const inferSeqSlots = (
  con: "Array" | "List" | "Set",
  elements: SeqElem[],
  ctx: Ctx,
): Result<Type, Diagnostic> => {
  const elem = freshVar(ctx.fresh);
  for (const slot of elements) {
    const et = infer(slot.expr, ctx);
    if (isErr(et)) return et;
    const want = slot.kind === "spread" ? tCon(con, [elem]) : elem;
    const uni = u(want, et.value, ctx, slot.expr.span);
    if (isErr(uni)) return uni;
  }
  return ok(tCon(con, [elem]));
};

/** Keys share one type, values share one type → `Map<k, v>` (native JS Map). */
function inferMapExpr(entries: MapEntry[], ctx: Ctx): Result<Type, Diagnostic> {
  const k = freshVar(ctx.fresh);
  const v = freshVar(ctx.fresh);
  for (const ent of entries) {
    const kt = infer(ent.key, ctx);
    if (isErr(kt)) return kt;
    const uk = u(k, kt.value, ctx, ent.key.span);
    if (isErr(uk)) return uk;
    const vt = infer(ent.value, ctx);
    if (isErr(vt)) return vt;
    const uv = u(v, vt.value, ctx, ent.value.span);
    if (isErr(uv)) return uv;
  }
  return ok(tCon("Map", [k, v]));
}

function inferMatch(e: MatchExpr, ctx: Ctx): Result<Type, Diagnostic> {
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
    // A `when` guard sees the pattern's binds and must be bool.
    if (arm.guard) {
      const guardT = infer(arm.guard, { ...ctx, env: armEnv });
      if (isErr(guardT)) return guardT;
      const uGuard = u(tBool, guardT.value, ctx, arm.guard.span);
      if (isErr(uGuard)) return uGuard;
    }
    const bodyT = infer(arm.body, { ...ctx, env: armEnv });
    if (isErr(bodyT)) return bodyT;
    const uBody = u(resultT, bodyT.value, ctx, arm.body.span);
    if (isErr(uBody)) return uBody;
  }
  return ok(resultT);
}

type PatResult = { type: Type; bindings: Map<string, Type> };

/**
 * Wrapper over `inferPat`: records every pattern node's span + type, so hover
 * can look up a pattern-bound name (or a whole constructor pattern) by
 * span — the pattern-side analogue of `infer` recording expression nodes.
 */
function inferPattern(p: Pattern, ctx: Ctx): Result<PatResult, Diagnostic> {
  const r = inferPat(p, ctx);
  if (ctx.record && !isErr(r))
    ctx.record(
      p.span,
      r.value.type,
      p.kind === "pbind" ? { kind: "parameter", name: p.name } : undefined,
    );
  return r;
}

function inferPat(p: Pattern, ctx: Ctx): Result<PatResult, Diagnostic> {
  return match(p)
    .with({ kind: "pwild" }, () => ok({ type: freshVar(ctx.fresh), bindings: new Map() }))
    .with({ kind: "plit" }, () => ok({ type: tNumber, bindings: new Map() }))
    .with({ kind: "pbool" }, () => ok({ type: tBool, bindings: new Map() }))
    .with({ kind: "pstr" }, () => ok({ type: tString, bindings: new Map() }))
    .with({ kind: "pbind" }, (pbind) => {
      const t = freshVar(ctx.fresh);
      return ok({ type: t, bindings: new Map([[pbind.name, t]]) });
    })
    .with({ kind: "precord" }, (precord) => {
      // Open row (duck typing): the scrutinee must have AT LEAST these fields.
      let row: Row = freshRowVar(ctx.fresh);
      const bindings = new Map<string, Type>();
      for (const f of precord.fields) {
        const sub = inferPattern(f.pat, ctx);
        if (isErr(sub)) return sub;
        for (const [k, v] of sub.value.bindings) bindings.set(k, v);
        row = rExtend(f.label, sub.value.type, row);
      }
      return ok({ type: tRecord(row), bindings });
    })
    .with({ kind: "pctor" }, (pctor) => {
      const sc = pctor.ns ? ctx.ns.get(pctor.ns)?.get(pctor.ctor) : ctx.env.get(pctor.ctor);
      if (!sc)
        return err(
          typeErr(
            pctor.ns
              ? `'${pctor.ns}' has no member '${pctor.ctor}'`
              : `unknown constructor '${pctor.ctor}'`,
            pctor.span,
          ),
        );
      // instantiated ctor type: argT1 -> ... -> ResultType
      let cur = instantiate(sc, ctx.fresh);
      const bindings = new Map<string, Type>();
      for (const argPat of pctor.args) {
        const rc = resolve(cur, ctx.subst);
        if (rc.kind !== "arrow")
          return err(typeErr(`constructor '${pctor.ctor}' applied to too many args`, pctor.span));
        const sub = inferPattern(argPat, ctx);
        if (isErr(sub)) return sub;
        for (const [k, v] of sub.value.bindings) bindings.set(k, v);
        const uni = u(rc.from, sub.value.type, ctx, argPat.span);
        if (isErr(uni)) return uni;
        cur = rc.to;
      }
      return ok({ type: cur, bindings });
    })
    .with({ kind: "ptuple" }, (ptuple) => {
      // Heterogeneous product: each sub-pattern types its own position.
      const elems: Type[] = [];
      const bindings = new Map<string, Type>();
      for (const ep of ptuple.elems) {
        const sub = inferPattern(ep, ctx);
        if (isErr(sub)) return sub;
        for (const [k, v] of sub.value.bindings) bindings.set(k, v);
        elems.push(sub.value.type);
      }
      return ok({ type: tTuple(elems), bindings });
    })
    .with({ kind: "parr" }, (parr) =>
      // Eager `Array<elem>`; every element shares `elem`, `...rest` binds the tail.
      inferSeqPat("Array", parr.elems, parr.rest, ctx),
    )
    .with({ kind: "plist" }, (plist) =>
      // Lazy `List<elem>`; same element/rest shape as `parr`.
      inferSeqPat("List", plist.elems, plist.rest, ctx),
    )
    .with({ kind: "por" }, (por) => inferOrPat(por.alts, ctx))
    .exhaustive();
}

/**
 * Every alternative of `A | B | …` describes the same scrutinee, so their
 * types unify; binders (same names per check.ts) unify too.
 */
function inferOrPat(alts: Pattern[], ctx: Ctx): Result<PatResult, Diagnostic> {
  const first = inferPattern(alts[0]!, ctx);
  if (isErr(first)) return first;
  const { type: t, bindings } = first.value;
  for (let i = 1; i < alts.length; i++) {
    const alt = inferPattern(alts[i]!, ctx);
    if (isErr(alt)) return alt;
    const ut = u(t, alt.value.type, ctx, alts[i]!.span);
    if (isErr(ut)) return ut;
    for (const [name, ty] of alt.value.bindings) {
      const prev = bindings.get(name);
      if (!prev) continue;
      const ub = u(prev, ty, ctx, alts[i]!.span);
      if (isErr(ub)) return ub;
    }
  }
  return ok({ type: t, bindings });
}

/** Shared element/rest inference for `parr`/`plist` (`Array` vs `List`). */
function inferSeqPat(
  con: "Array" | "List",
  elems: Pattern[],
  rest: Pattern | null,
  ctx: Ctx,
): Result<PatResult, Diagnostic> {
  const elem = freshVar(ctx.fresh);
  const seqT = tCon(con, [elem]);
  const bindings = new Map<string, Type>();
  for (const ep of elems) {
    const sub = inferPattern(ep, ctx);
    if (isErr(sub)) return sub;
    for (const [k, v] of sub.value.bindings) bindings.set(k, v);
    const uni = u(elem, sub.value.type, ctx, ep.span);
    if (isErr(uni)) return uni;
  }
  if (rest) {
    const sub = inferPattern(rest, ctx);
    if (isErr(sub)) return sub;
    for (const [k, v] of sub.value.bindings) bindings.set(k, v);
    const uni = u(sub.value.type, seqT, ctx, rest.span);
    if (isErr(uni)) return uni;
  }
  return ok({ type: seqT, bindings });
}

/** `imports`: schemes from `import { … }`. `nsImports`: `import * as` (ADR 0002). */
export type InferOptions = {
  open?: boolean;
  imports?: Env;
  namespaces?: Record<string, Record<string, Type>>; // qualified members (List.map, ...)
  nsImports?: Map<string, Env>; // alias → export schemes
};

/** Symbol identity for hover (`let x: T`, `(parameter) x: T`, etc.). */
export type SymbolInfo = { kind: "let" | "parameter" | "property"; name: string; doc?: string };

/** Inferred type at a source span — the map hover queries. */
export type TypeAt = { span: Span; type: Type; symbol?: SymbolInfo };

/**
 * Full inference result. `letParams`: monomorphic IIFE-param annotations for
 * TS emit (ADR 0035); kept apart from `types` so hover is unaffected.
 */
export type InferResult = {
  env: Env;
  types: TypeAt[];
  aliases: AliasDef[];
  letParams: TypeAt[];
};

/** Names a pattern binds — excluded from an arm body's free references. */
function patternBinds(p: Pattern): string[] {
  switch (p.kind) {
    case "pbind":
      return [p.name];
    case "precord":
      return p.fields.flatMap((f) => patternBinds(f.pat));
    case "pctor":
      return p.args.flatMap(patternBinds);
    case "ptuple":
      return p.elems.flatMap(patternBinds);
    case "parr":
    case "plist":
      return [...p.elems.flatMap(patternBinds), ...(p.rest ? patternBinds(p.rest) : [])];
  }
  return [];
}

/** Free refs in an expression (minus local binds) — builds top-level `let` SCC graph. */
function freeRefs(e: Expr, bound: Set<string>, acc: Set<string>): void {
  match(e)
    .withOneOf([{ kind: "num" }, { kind: "bool" }, { kind: "str" }], () => {})
    .with({ kind: "interp" }, (interp) => {
      for (const p of interp.parts) if (typeof p !== "string") freeRefs(p, bound, acc);
    })
    .with({ kind: "ref" }, (ref) => {
      if (!bound.has(ref.name)) acc.add(ref.name);
    })
    .with({ kind: "call" }, (call) => {
      freeRefs(call.fn, bound, acc);
      for (const a of call.args) freeRefs(a, bound, acc);
    })
    .with({ kind: "lambda" }, (lambda) => {
      const inner = new Set(bound);
      for (const p of lambda.params)
        if (p.kind === "name") inner.add(p.name);
        else if (p.kind === "ptuple") for (const n of p.names) inner.add(n);
        else for (const f of p.fields) inner.add(f);
      freeRefs(lambda.body, inner, acc);
    })
    .with({ kind: "letin" }, (letin) => {
      // `value` is in the outer scope (non-recursive); `body` sees the new name.
      freeRefs(letin.value, bound, acc);
      const inner = new Set(bound);
      inner.add(letin.name);
      freeRefs(letin.body, inner, acc);
    })
    .with({ kind: "letbind" }, (letbind) => {
      freeRefs(letbind.value, bound, acc);
      const inner = new Set(bound);
      if (letbind.param.kind === "name") inner.add(letbind.param.name);
      else if (letbind.param.kind === "ptuple") for (const n of letbind.param.names) inner.add(n);
      else for (const f of letbind.param.fields) inner.add(f);
      freeRefs(letbind.body, inner, acc);
    })
    .with({ kind: "pipe" }, (pipe) => {
      freeRefs(pipe.left, bound, acc);
      freeRefs(pipe.right, bound, acc);
    })
    .with({ kind: "ternary" }, (ternary) => {
      freeRefs(ternary.cond, bound, acc);
      freeRefs(ternary.then, bound, acc);
      freeRefs(ternary.else, bound, acc);
    })
    .with({ kind: "match" }, (matchExpr) => {
      freeRefs(matchExpr.scrutinee, bound, acc);
      for (const arm of matchExpr.arms) {
        const inner = new Set(bound);
        for (const n of patternBinds(arm.pattern)) inner.add(n);
        if (arm.guard) freeRefs(arm.guard, inner, acc);
        freeRefs(arm.body, inner, acc);
      }
    })
    .with({ kind: "record" }, (record) => {
      if (record.spread) freeRefs(record.spread, bound, acc);
      for (const f of record.fields) freeRefs(f.value, bound, acc);
    })
    .with({ kind: "field" }, (field) => {
      freeRefs(field.target, bound, acc);
    })
    .with({ kind: "tuple" }, (tuple) => {
      for (const el of tuple.elements) freeRefs(el, bound, acc);
    })
    .withOneOf([{ kind: "arr" }, { kind: "list" }, { kind: "set" }], (seq) => {
      for (const el of seq.elements) freeRefs(el.expr, bound, acc);
    })
    .with({ kind: "map" }, (mapExpr) => {
      for (const ent of mapExpr.entries) {
        freeRefs(ent.key, bound, acc);
        freeRefs(ent.value, bound, acc);
      }
    })
    .exhaustive();
}

/**
 * Resolve `letParams` for TS emit (ADR 0035): annotate only when every use is
 * the same fully-concrete type; generic positions stay bare.
 */
function resolveLetParams(
  letSpans: Map<Scheme, Span>,
  letUses: Map<Scheme, Type[]>,
  subst: Subst,
): TypeAt[] {
  const isConcrete = (t: Type): boolean => {
    const f = freeInType(t);
    return f.tv.size === 0 && f.rv.size === 0;
  };
  const out: TypeAt[] = [];
  for (const [sc, span] of letSpans) {
    const uses = (letUses.get(sc) ?? []).map((t) => zonk(t, subst));
    const first = uses[0] ? showType(uses[0]) : "";
    if (uses.length > 0 && uses.every((t) => isConcrete(t) && showType(t) === first))
      out.push({ span, type: uses[0]! });
  }
  return out;
}

/** Seed qualified-lookup namespaces from prelude types and `import * as` (ADR 0002). */
const seedNamespaces = (
  env: Env,
  subst: Subst,
  namespaces: Record<string, Record<string, Type>> | undefined,
  nsImports: Map<string, Env> | undefined,
): Map<string, Map<string, Scheme>> => {
  const ns = new Map<string, Map<string, Scheme>>();
  for (const [nsName, members] of Object.entries(namespaces ?? {})) {
    const schemes = new Map<string, Scheme>();
    for (const [m, t] of Object.entries(members)) schemes.set(m, generalize(env, t, subst));
    ns.set(nsName, schemes);
  }
  if (nsImports) for (const [alias, members] of nsImports) ns.set(alias, new Map(members));
  return ns;
};

/** Shared inference core; `inferProgram` drops per-node types, `inferProgramTypes` keeps them. */
function run(
  prog: Program,
  builtins: Record<string, Type>,
  opts: InferOptions,
): Result<InferResult, Diagnostic[]> {
  const env: Env = new Map();
  const subst = emptySubst();
  // Builtins are generalized, not monomorphic: a prelude type carrying type vars
  // (e.g. `map : (a -> b) -> [a] -> [b]`) becomes a scheme that instantiates
  // fresh at each use site. Monomorphic builtins (`add : number -> ...`) have no
  // free vars, so generalizing them is a no-op.
  for (const [name, t] of Object.entries(builtins)) env.set(name, generalize(env, t, subst));
  if (opts.imports) for (const [name, sc] of opts.imports) env.set(name, sc);

  const ns = seedNamespaces(env, subst, opts.namespaces, opts.nsImports);
  const fresh = mkFresh(1000);
  const open = opts.open ?? false;

  // Transparent record aliases: collect their field lists so extern signatures
  // can reference them (expanded to rows), and build display templates (params
  // as marker vars) so tooling can fold matching rows back to the alias name.
  const aliasMap: AliasMap = new Map();
  for (const s of prog.stmts)
    if (s.kind === "type" && s.alias) aliasMap.set(s.name, { params: s.params, fields: s.alias });
  const aliases: AliasDef[] = [...aliasMap].map(([name, info]) => ({
    name,
    params: info.params,
    template: aliasRow(
      name,
      info,
      info.params.map((_, i) => tVar(aliasParamId(i))),
      fresh,
      aliasMap,
      new Set(),
    ),
  }));
  const recorded: TypeAt[] = [];
  const record = (span: Span, t: Type, symbol?: SymbolInfo): void => {
    recorded.push({ span, type: t, symbol });
  };
  // `let x = v in …` IIFE-param annotation (TS emit, ADR 0035): remember each
  // let scheme's value span, and collect the body's instantiations of it. If a
  // polymorphic value is used at ONE monomorphic type, annotate the param there.
  const letSpans = new Map<Scheme, Span>();
  const letUses = new Map<Scheme, Type[]>();
  const noteLet = (sc: Scheme, valueSpan: Span): void => {
    letSpans.set(sc, valueSpan);
    letUses.set(sc, []);
  };
  const noteUse = (sc: Scheme, t: Type): void => {
    letUses.get(sc)?.push(t);
  };

  // Constructors first so `let`s can use them. Builtin ctors yield to user/import bindings.
  for (const [name, e] of ctorTableOf(prog).ctor) {
    if (e.builtin && env.has(name)) continue;
    env.set(name, ctorScheme(e.type, e.params, e.ctor, fresh, aliasMap));
  }

  // externs next — their declared type is authoritative; generalize so a
  // polymorphic signature (e.g. a -> a) instantiates fresh at each use site.
  for (const s of prog.stmts) {
    if (s.kind !== "extern") continue;
    const t = typeExprToType(s.typeExpr, new Map(), fresh, aliasMap);
    env.set(s.name, generalize(env, t, subst));
  }

  // `let`s, grouped into mutually-recursive components (SCCs of the reference
  // graph) and inferred group-by-group in dependency-first order. Within a
  // group every member is pre-bound monomorphically, so `f`/`g` that call each
  // other resolve to these bindings; the group generalizes as a unit afterwards.
  const lets = prog.stmts.filter((s): s is LetStmt => s.kind === "let");
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

  const allDiags: Diagnostic[] = [];

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
      const t = infer(s.value, {
        env,
        subst,
        fresh,
        open,
        ns,
        aliases,
        aliasMap,
        record,
        noteUse,
        noteLet,
      });
      // Collect-and-bail per member (ADR 0004): record the diag, leave the
      // pre-bound mono var, continue siblings / later SCCs.
      if (isErr(t)) {
        allDiags.push(t.error);
        continue;
      }
      const uni = unify(selfVars.get(s.name)!, t.value, subst, fresh, (x) =>
        showType(foldAliases(x, aliases)),
      );
      if (isErr(uni)) {
        allDiags.push(typeErr(uni.error.message, s.span));
        continue;
      }
      // Optional binding annotation (`let x : T = v`): unify the inferred value
      // type against the declared one, so a too-general value is pinned to T.
      // Resolved through the alias map, so a named record alias expands to its
      // row (ADR 0044). This is how a self-hosted seed pins a polymorphic empty.
      if (s.annot) {
        const at = typeExprToType(s.annot, new Map(), fresh, aliasMap);
        const au = unify(t.value, at, subst, fresh, (x) => showType(foldAliases(x, aliases)));
        if (isErr(au)) {
          allDiags.push(typeErr(au.error.message, s.annot.span));
          continue;
        }
      }
      bodyTypes.set(s.name, t.value);
      // Record the binding name itself so hovering it leads with `let x: T`
      // (+ any doc). Skip synthetic destructuring temps ($d…).
      if (!s.name.startsWith("$"))
        record(s.nameSpan, t.value, { kind: "let", name: s.name, doc: s.doc });
    }
    // Generalize successes against the OUTER env; failed members keep an
    // unconstrained mono so later SCCs don't cascade unbound noise.
    for (const s of group) env.delete(s.name);
    for (const s of group) {
      const bodyT = bodyTypes.get(s.name);
      if (bodyT === undefined) {
        env.set(s.name, mono(selfVars.get(s.name)!));
        continue;
      }
      const sc = generalize(env, bodyT, subst);
      env.set(s.name, sc);
      // Track a top-level let the same way as `let … in` (ADR 0035): a
      // polymorphic-but-monomorphically-used value (e.g. `let emptyReg =
      // { ctors: #{}, … }`) gets a `const name: T` annotation so tsc types
      // its empty collections. Uses in later groups resolve to this scheme.
      if (!s.name.startsWith("$")) noteLet(sc, s.value.span);
    }
  }
  if (allDiags.length > 0) return err(allDiags);
  // Resolve every recorded type now that the whole program's subst is final.
  const types = recorded.map((r) => ({
    span: r.span,
    type: zonk(r.type, subst),
    symbol: r.symbol,
  }));
  return ok({ env, types, aliases, letParams: resolveLetParams(letSpans, letUses, subst) });
}

export const inferProgram = (
  prog: Program,
  builtins: Record<string, Type> = {},
  opts: InferOptions = {},
): Result<Env, Diagnostic[]> => map(run(prog, builtins, opts), (r) => r.env);

/** Like `inferProgram`, but also returns the span → type map for tooling. */
export const inferProgramTypes = (
  prog: Program,
  builtins: Record<string, Type> = {},
  opts: InferOptions = {},
): Result<InferResult, Diagnostic[]> => run(prog, builtins, opts);

/** Render a binding's scheme for tests / display. */
export const showScheme = (sc: Scheme, aliases: AliasDef[] = []): string =>
  showType(foldAliases(sc.type, aliases));

export { resolve, resolveRow, zonk };
