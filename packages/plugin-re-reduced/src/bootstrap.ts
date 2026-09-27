/**
 * re-reduced over the self-hosted core (ADR 0109). The same DSL typing as
 * `reReducedExtension` in `./index.ts`, written against bootstrap AST and type
 * values: `defineContainer` walks its rank-2 `actions` / `effects` builders site
 * by site, the hooks type against a structural store sketch, `Intent.*` builds
 * intents, and the dts hook wraps the config in the host's `ContainerDef`. See
 * `./index.ts` for why each shape is what it is. Completion stays on the
 * TypeScript host until DX moves (#103).
 *
 * Bootstrap inference threads its state (`St`) instead of mutating it, so each
 * hook call carries one `Solver` that holds the current state.
 *
 * Depends only on bootstrap façades, so the conformance runner can load it
 * without reaching the hand-authored TypeScript core.
 */
import type {
  BootstrapDtsBindingHook,
  BootstrapInferCallHook,
  BootstrapPlugin,
} from "@mochi/compiler/bootstrap/options";
import type {
  Expr,
  IErr,
  InferApi,
  Row,
  Span,
  St,
  TsApi,
  Ty,
} from "@mochi/compiler/bootstrap/types";
import {
  freshRowVar,
  freshVar,
  rExtend,
  tArrow,
  tBool,
  tCon,
  tNumber,
  tRecord,
  tString,
  tUnit,
  zonk,
} from "@mochi/compiler/bootstrap/types";
import { isErr, ok, type Result } from "@onrails/result";

type RecordExpr = Extract<Expr, { _tag: "ERecord" }>;
type LambdaExpr = Extract<Expr, { _tag: "ELambda" }>;
type LamParam = LambdaExpr["params"][number];
type FieldTy = { label: string; type: Ty };
type Step<T> = Result<T, IErr>;

const HOST = 'import("@re-reduced/preact")';
const INTENTS = "Intent";

const none = { _tag: "None" } as const;
const rEmpty: Row = { _tag: "RowEmpty" };
const tIntent = tCon("Intent", []);
const tReaction = tCon("Reaction", []);
const tArray = (t: Ty): Ty => tCon("Array", [t]);
const tEmit = tArray(tIntent);
const signalOf = (t: Ty): Ty => tRecord(rExtend("value", t, rEmpty));

// --- Solver: the threaded inference state for one hook call ------------------

type Solver = { st: St; readonly api: InferApi };

const inferIn = (s: Solver, e: Expr): Step<Ty> => {
  const r = s.api.inferExpr(e, s.st);
  if (isErr(r)) return r;
  s.st = r.value[1];
  return ok(r.value[0]);
};

const unifyIn = (s: Solver, a: Ty, b: Ty, span: Span): Step<null> => {
  const r = s.api.unify(a, b, s.st, span);
  if (isErr(r)) return r;
  s.st = r.value;
  return ok(null);
};

const fresh = (s: Solver): Ty => {
  const [t, st] = freshVar(s.st);
  s.st = st;
  return t;
};

const freshRow = (s: Solver): Row => {
  const [r, st] = freshRowVar(s.st);
  s.st = st;
  return r;
};

const solved = (s: Solver, t: Ty): Ty => zonk(t, s.st);

const inferAll = (s: Solver, es: readonly Expr[]): Step<Ty[]> => {
  const out: Ty[] = [];
  for (const e of es) {
    const r = inferIn(s, e);
    if (isErr(r)) return r;
    out.push(r.value);
  }
  return ok(out);
};

// --- Rows ---------------------------------------------------------------------

const rowField = (row: Row, label: string): Ty | null => {
  let current = row;
  while (current._tag === "RowExtend") {
    if (current.label === label) return current.fieldType;
    current = current.rest;
  }
  return null;
};

const rowLabels = (row: Row): string[] => {
  const labels: string[] = [];
  let current = row;
  while (current._tag === "RowExtend") {
    labels.push(current.label);
    current = current.rest;
  }
  return labels;
};

const mapRow = (row: Row, mapType: (t: Ty) => Ty): Row => {
  if (row._tag !== "RowExtend") return row._tag === "RowVar" ? row : rEmpty;
  return { ...row, fieldType: mapType(row.fieldType), rest: mapRow(row.rest, mapType) };
};

const rowOf = (fields: readonly FieldTy[]): Row =>
  fields.reduceRight<Row>((rest, f) => rExtend(f.label, f.type, rest), rEmpty);

// --- Builder lambdas (rank-2 `on` / `fx`) ------------------------------------

type BuilderSite = { readonly method: string | null; readonly args: readonly Expr[] };
type LabelledSite = { readonly label: string | null; readonly site: BuilderSite };
type BuilderBody = {
  readonly shape: "record" | "seq" | "single";
  readonly sites: readonly LabelledSite[];
};

const paramName = (p: LamParam): string | null =>
  p._tag === "LPSpanned" ? paramName(p.param) : p._tag === "LPName" ? p.name : null;

const siteOf = (e: Expr, binder: string): BuilderSite | null => {
  if (e._tag !== "ECall") return null;
  if (e.fn._tag === "ERef" && e.fn.name === binder) return { method: null, args: e.args };
  if (e.fn._tag === "EField" && e.fn.target._tag === "ERef" && e.fn.target.name === binder)
    return { method: e.fn.name, args: e.args };
  return null;
};

/** Plugin-kit's `builderBody` over bootstrap values: every body slot is a site. */
const builderBody = (e: Expr): BuilderBody | null => {
  if (e._tag !== "ELambda" || e.params.length !== 1) return null;
  const binder = paramName(e.params[0]!);
  if (binder === null) return null;
  const body = e.body;
  if (body._tag === "ERecord" && body.spread._tag === "None") {
    const sites: LabelledSite[] = [];
    for (const f of body.fields) {
      const site = siteOf(f.value, binder);
      if (!site) return null;
      sites.push({ label: f.name, site });
    }
    return { shape: "record", sites };
  }
  if (body._tag === "EArr") {
    const sites: LabelledSite[] = [];
    for (const el of body.elements) {
      if (el._tag !== "SEExpr") return null;
      const site = siteOf(el.expr, binder);
      if (!site) return null;
      sites.push({ label: null, site });
    }
    return { shape: "seq", sites };
  }
  const single = siteOf(body, binder);
  return single ? { shape: "single", sites: [{ label: null, site: single }] } : null;
};

const fieldExpr = (record: RecordExpr, label: string): Expr | null =>
  record.fields.find((f) => f.name === label)?.value ?? null;

const isRef = (fn: Expr, name: string): boolean => fn._tag === "ERef" && fn.name === name;

// --- Reading the pieces back out of an inferred config record ----------------

const resultOf = (t: Ty | null): Ty | null => (t?._tag === "TyFn" ? t.to : null);

const stateSignalsOf = (s: Solver, state: Ty | null): Ty =>
  state?._tag === "TyRecord" ? tRecord(mapRow(state.row, signalOf)) : tRecord(freshRow(s));

const payloadOf = (reducer: Ty): Ty | null =>
  reducer._tag === "TyFn" && reducer.to._tag === "TyFn" ? reducer.to.from : null;

const patchOf = (reducer: Ty): Ty | null =>
  reducer._tag !== "TyFn" ? null : reducer.to._tag === "TyFn" ? reducer.to.to : reducer.to;

const creatorOf = (reducer: Ty): Ty => tArrow(payloadOf(reducer) ?? tUnit, tUnit);

const actionsOf = (actions: Ty | null): Ty => {
  const result = resultOf(actions);
  return result?._tag !== "TyRecord" ? tRecord(rEmpty) : tRecord(mapRow(result.row, creatorOf));
};

const derivedOf = (derive: Ty | null): Ty => {
  const result = resultOf(derive);
  if (result?._tag !== "TyRecord") return tRecord(rEmpty);
  return tRecord(mapRow(result.row, (t) => signalOf(t._tag === "TyFn" ? t.to : t)));
};

const storeOf = (s: Solver, def: Ty): Ty => {
  if (def._tag !== "TyRecord")
    return tRecord(
      rExtend("actions", tRecord(freshRow(s)), rExtend("$state", tRecord(freshRow(s)), rEmpty)),
    );
  return tRecord(
    rExtend(
      "actions",
      actionsOf(rowField(def.row, "actions")),
      rExtend(
        "$state",
        stateSignalsOf(s, rowField(def.row, "state")),
        rExtend("$derived", derivedOf(rowField(def.row, "derive")), rEmpty),
      ),
    ),
  );
};

const storeFieldOr = (s: Solver, store: Ty, label: string): Ty =>
  (store._tag === "TyRecord" ? rowField(store.row, label) : null) ?? tRecord(freshRow(s));

// --- `actions:` — one instantiation per site ---------------------------------

const unifyPatch = (s: Solver, patch: Ty | null, state: Ty, span: Span): Step<null> => {
  if (patch?._tag !== "TyRecord" || state._tag !== "TyRecord") return ok(null);
  let row = patch.row;
  while (row._tag === "RowExtend") {
    const field = rowField(state.row, row.label);
    if (field) {
      const uni = unifyIn(s, row.fieldType, field, span);
      if (isErr(uni)) return uni;
    }
    row = row.rest;
  }
  return ok(null);
};

type ActionsSketch = { readonly reducers: Row; readonly payloads: ReadonlyMap<string, Ty> };

const inferActions = (s: Solver, actionsExpr: Expr, state: Ty): Step<ActionsSketch> | null => {
  const body = builderBody(actionsExpr);
  if (body?.shape !== "record") return null;
  const fields: FieldTy[] = [];
  const payloads = new Map<string, Ty>();
  for (const { label, site } of body.sites) {
    if (label === null || site.method !== null || site.args.length !== 1) return null;
    const reducerExpr = site.args[0]!;
    const r = inferIn(s, reducerExpr);
    if (isErr(r)) return r;
    const uni = unifyIn(s, r.value, tArrow(state, fresh(s)), reducerExpr.span);
    if (isErr(uni)) return uni;
    const patched = unifyPatch(s, patchOf(solved(s, r.value)), state, reducerExpr.span);
    if (isErr(patched)) return patched;
    const reducer = solved(s, r.value);
    const payload = payloadOf(reducer);
    if (payload) payloads.set(label, payload);
    fields.push({ label, type: reducer });
  }
  return ok({ reducers: rowOf(fields), payloads });
};

// --- `effects:` — one instantiation per reaction -----------------------------

const ctxOf = (state: Ty, creators: Ty): Ty =>
  tRecord(rExtend("getState", tArrow(tUnit, state), rExtend("actions", creators, rEmpty)));

const expectArg = (s: Solver, arg: Expr | undefined, expected: Ty): Step<null> => {
  if (!arg) return ok(null);
  const r = inferIn(s, arg);
  if (isErr(r)) return r;
  return unifyIn(s, r.value, expected, arg.span);
};

const inferReaction = (
  s: Solver,
  site: BuilderSite,
  signals: Ty,
  ctx: Ty,
  payloads: ReadonlyMap<string, Ty>,
): Step<null> => {
  const at = (i: number, expected: Ty): Step<null> => expectArg(s, site.args[i], expected);
  if (site.method === "onAction" && site.args.length >= 2) {
    const nameArg = site.args[0]!;
    const named = at(0, tString);
    if (isErr(named)) return named;
    const literal = nameArg._tag === "EStr" ? nameArg.value : null;
    const payload = (literal ? payloads.get(literal) : undefined) ?? fresh(s);
    return at(1, tArrow(payload, tArrow(ctx, tEmit)));
  }
  if (site.method === "onChange" && site.args.length >= 2) {
    const watched = fresh(s);
    const select = at(0, tArrow(signals, watched));
    if (isErr(select)) return select;
    return at(1, tArrow(watched, tArrow(watched, tArrow(ctx, tEmit))));
  }
  if (site.method === "onEnter" && site.args.length >= 2) {
    const pred = at(0, tArrow(signals, tBool));
    if (isErr(pred)) return pred;
    return at(1, tArrow(ctx, tEmit));
  }
  const rest = inferAll(s, site.args);
  return isErr(rest) ? rest : ok(null);
};

const inferEffects = (
  s: Solver,
  effectsExpr: Expr,
  signals: Ty,
  ctx: Ty,
  payloads: ReadonlyMap<string, Ty>,
): Step<Ty> | null => {
  const body = builderBody(effectsExpr);
  if (!body || body.shape === "record") return null;
  for (const { site } of body.sites) {
    const r = inferReaction(s, site, signals, ctx, payloads);
    if (isErr(r)) return r;
  }
  return ok(tArray(tReaction));
};

// --- `defineContainer` -------------------------------------------------------

const inferRest = (s: Solver, config: RecordExpr, known: ReadonlyMap<string, Ty>): Step<Row> => {
  const fields: FieldTy[] = [];
  for (const f of config.fields) {
    const hit = known.get(f.name);
    if (hit) {
      fields.push({ label: f.name, type: hit });
      continue;
    }
    const r = inferIn(s, f.value);
    if (isErr(r)) return r;
    fields.push({ label: f.name, type: solved(s, r.value) });
  }
  return ok(rowOf(fields));
};

const inferConfig = (s: Solver, config: RecordExpr): Step<Row> | null => {
  if (config.spread._tag !== "None") return null;
  const stateExpr = fieldExpr(config, "state");
  const actionsExpr = fieldExpr(config, "actions");
  if (!stateExpr || !actionsExpr) return null;

  const stateR = inferIn(s, stateExpr);
  if (isErr(stateR)) return stateR;
  const state = solved(s, stateR.value);
  const signals = stateSignalsOf(s, state);

  const actionsR = inferActions(s, actionsExpr, state);
  if (!actionsR) return null;
  if (isErr(actionsR)) return actionsR;
  const { reducers, payloads } = actionsR.value;

  const known = new Map<string, Ty>([
    ["state", state],
    ["actions", tArrow(fresh(s), tRecord(reducers))],
  ]);

  const deriveExpr = fieldExpr(config, "derive");
  if (deriveExpr) {
    const r = inferIn(s, deriveExpr);
    if (isErr(r)) return r;
    const uni = unifyIn(s, r.value, tArrow(signals, fresh(s)), deriveExpr.span);
    if (isErr(uni)) return uni;
    known.set("derive", solved(s, r.value));
  }

  const effectsExpr = fieldExpr(config, "effects");
  if (effectsExpr) {
    const ctx = ctxOf(state, tRecord(mapRow(reducers, creatorOf)));
    const r = inferEffects(s, effectsExpr, signals, ctx, payloads);
    if (r) {
      if (isErr(r)) return r;
      known.set("effects", tArrow(fresh(s), r.value));
    }
  }

  return inferRest(s, config, known);
};

const inferDefineContainer = (s: Solver, fn: Expr, args: readonly Expr[]): Step<Ty> | null => {
  if (!isRef(fn, "defineContainer") || args.length < 2) return null;
  const nameR = inferIn(s, args[0]!);
  if (isErr(nameR)) return nameR;
  const configArg = args[1]!;
  if (configArg._tag === "ERecord") {
    const row = inferConfig(s, configArg);
    if (row) {
      if (isErr(row)) return row;
      const tailR = inferAll(s, args.slice(2));
      return isErr(tailR) ? tailR : ok(tRecord(rExtend("name", tString, row.value)));
    }
  }
  const argsR = inferAll(s, args.slice(1));
  if (isErr(argsR)) return argsR;
  const configType = argsR.value[0] ? solved(s, argsR.value[0]) : null;
  return ok(
    tRecord(
      rExtend("name", tString, configType?._tag === "TyRecord" ? configType.row : freshRow(s)),
    ),
  );
};

const inferUseContainer = (s: Solver, fn: Expr, args: readonly Expr[]): Step<Ty> | null => {
  if (!isRef(fn, "useContainer") || args.length < 1) return null;
  const defR = inferIn(s, args[0]!);
  if (isErr(defR)) return defR;
  const restR = inferAll(s, args.slice(1));
  return isErr(restR) ? restR : ok(storeOf(s, solved(s, defR.value)));
};

const selectorType = (s: Solver, selector: Expr, store: Ty, result: Ty): Ty => {
  const signals = storeFieldOr(s, store, "$state");
  return selector._tag === "ELambda" && selector.params.length >= 2
    ? tArrow(signals, tArrow(storeFieldOr(s, store, "$derived"), result))
    : tArrow(signals, result);
};

const inferUseSelect = (s: Solver, fn: Expr, args: readonly Expr[]): Step<Ty> | null => {
  if (!isRef(fn, "useSelect") || args.length < 2) return null;
  const storeR = inferIn(s, args[0]!);
  if (isErr(storeR)) return storeR;
  const store = solved(s, storeR.value);
  const result = fresh(s);
  const selArg = args[1]!;
  const selR = inferIn(s, selArg);
  if (isErr(selR)) return selR;
  const uni = unifyIn(s, selR.value, selectorType(s, selArg, store, result), selArg.span);
  if (isErr(uni)) return uni;
  const restR = inferAll(s, args.slice(2));
  return isErr(restR) ? restR : ok(result);
};

const inferUseWatch = (s: Solver, fn: Expr, args: readonly Expr[]): Step<Ty> | null => {
  if (!isRef(fn, "useWatch") || args.length < 3) return null;
  const storeR = inferIn(s, args[0]!);
  if (isErr(storeR)) return storeR;
  const store = solved(s, storeR.value);
  const watched = fresh(s);
  const selArg = args[1]!;
  const selR = inferIn(s, selArg);
  if (isErr(selR)) return selR;
  const uniSel = unifyIn(s, selR.value, selectorType(s, selArg, store, watched), selArg.span);
  if (isErr(uniSel)) return uniSel;
  const runArg = args[2]!;
  const runR = inferIn(s, runArg);
  if (isErr(runR)) return runR;
  const uniRun = unifyIn(s, runR.value, tArrow(watched, fresh(s)), runArg.span);
  return isErr(uniRun) ? uniRun : ok(tUnit);
};

const inferIntent = (s: Solver, fn: Expr, args: readonly Expr[]): Step<Ty> | null => {
  if (fn._tag !== "EField" || !isRef(fn.target, INTENTS)) return null;
  const method = fn.name;
  const argsR = inferAll(s, args);
  if (isErr(argsR)) return argsR;
  const [first, second] = argsR.value;
  if (method === "query" && first) {
    const data = fresh(s);
    const err = fresh(s);
    const spec = tRecord(
      rExtend(
        "key",
        tArray(fresh(s)),
        rExtend(
          "task",
          tCon("Task", [data, err]),
          rExtend(
            "onOk",
            tArrow(data, fresh(s)),
            rExtend("onErr", tArrow(err, fresh(s)), freshRow(s)),
          ),
        ),
      ),
    );
    const uni = unifyIn(s, first, spec, args[0]!.span);
    return isErr(uni) ? uni : ok(tIntent);
  }
  if (method === "timeout" && first && second) {
    const ms = unifyIn(s, first, tNumber, args[0]!.span);
    if (isErr(ms)) return ms;
    const run = unifyIn(s, second, tArrow(tUnit, fresh(s)), args[1]!.span);
    return isErr(run) ? run : ok(tIntent);
  }
  if (method === "storageSet" && first && second) {
    const key = unifyIn(s, first, tString, args[0]!.span);
    return isErr(key) ? key : ok(tIntent);
  }
  return null;
};

const hooks = [inferDefineContainer, inferUseContainer, inferUseSelect, inferUseWatch, inferIntent];

const inferReReducedCall: BootstrapInferCallHook = (fn, args, _origin, st, api) => {
  for (const hook of hooks) {
    const s: Solver = { st, api };
    const r = hook(s, fn, args);
    if (r === null) continue;
    if (isErr(r)) return r;
    return ok({ _tag: "Some", value: [r.value, s.st] });
  }
  return ok(none);
};

// --- `.d.mochi.ts` -----------------------------------------------------------

const containerDts = (folded: Ty, api: TsApi): string | null => {
  if (folded._tag !== "TyRecord") return null;
  const state = rowField(folded.row, "state");
  const S = state ? api.tsType(state) : "Record<string, unknown>";

  const reducers = resultOf(rowField(folded.row, "actions"));
  const specs: string[] = [];
  if (reducers?._tag === "TyRecord") {
    let row = reducers.row;
    while (row._tag === "RowExtend") {
      const payload = payloadOf(row.fieldType);
      specs.push(
        `${row.label}: ${HOST}.ActionSpec<${S}, ${payload ? api.tsType(payload) : "void"}>`,
      );
      row = row.rest;
    }
  }
  const R = specs.length === 0 ? "Record<string, never>" : `{ ${specs.join("; ")} }`;

  const thunks = resultOf(rowField(folded.row, "derive"));
  const D =
    thunks?._tag === "TyRecord" && rowLabels(thunks.row).length > 0
      ? api.tsType(thunks)
      : "Record<string, never>";

  const I = rowField(folded.row, "effects") ? `${HOST}.BuiltinIntent` : "never";

  return `${HOST}.ContainerDef<${S}, ${R}, ${D}, ${I}> & { name: string }`;
};

const reReducedDts: BootstrapDtsBindingHook = (_name, value, ty, api) =>
  value._tag === "ECall" && isRef(value.fn, "defineContainer") && value.args.length >= 2
    ? containerDts(ty, api)
    : null;

export const reReducedBootstrap: BootstrapPlugin = {
  name: "re-reduced",
  inferCall: inferReReducedCall,
  dtsBinding: reReducedDts,
};
