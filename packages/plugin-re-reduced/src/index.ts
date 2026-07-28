/**
 * re-reduced vendor plugin (ADR 0010 Gap A / Wave 6; Wave 10–11 shrink;
 * ADR 0051 rank-2 builders).
 *
 * Library-owned `HostExtension` — not language core. Types the whole
 * `defineContainer` DSL: state signals, per-action payloads, `derive`d
 * signals, the `effects` reaction builder, and the intent vocabulary; then
 * wraps ContainerDef at the outbound `.d.mochi.ts` seam.
 *
 * The config is inferred *domain-aware* rather than structurally, because two
 * of its fields take **rank-2 builders**. `actions: on => …` and
 * `effects: fx => …` hand the user a polymorphic builder, but a lambda
 * parameter is monomorphic in HM — inferring `on => …` as one expression
 * forces every action to share a single reducer type, so no two actions can
 * carry different payloads. `builderBody` (plugin-kit) decomposes those
 * lambdas into their call sites so each is typed on its own and the builder
 * binder is never unified.
 *
 * Register via the project vendor-plugin list (`mochi.plugins.ts`), and import
 * the seam from `@mochi/plugin-re-reduced/container`.
 */

import type { Diagnostic } from "@mochi/compiler/errors";
import type {
  DtsBindingApi,
  DtsBindingHook,
  HostExtension,
  InferCallApi,
  InferCallHook,
} from "@mochi/compiler/extensions";
// Explicit real-file subpath (like `@mochi/compiler/types` below): value
// imports, so Node/Vite's config loader must resolve them without a bundler.
import type { BuilderSite, CallExpr, Expr, RecordExpr } from "@mochi/compiler/plugin-kit";
import {
  builderBody,
  fieldExpr,
  inferArgs,
  isRefCall,
  mapRow,
  rowField,
  rowLabels,
} from "@mochi/compiler/plugin-kit";
import type { Row, Type } from "@mochi/compiler/types";
// Explicit extension: package boundary is resolved by Node/Vite without a bundler.
import {
  rEmpty,
  rExtend,
  tArrow,
  tBool,
  tCon,
  tNumber,
  tRecord,
  tString,
  tUnit,
} from "@mochi/compiler/types";
import { isErr, ok, type Result } from "@onrails/result";

const HOST = 'import("@re-reduced/preact")';

/** The namespace object the seam binds the intent constructors under. */
const INTENTS = "Intent";

/**
 * Effect intents are one nominal type, not the host's `QueryIntent |
 * TimeoutIntent | StorageSetIntent`: mochi has no untagged unions, so a
 * reaction returning `[query(…), storageSet(…)]` needs its elements to share
 * a type. Collapsing at the seam keeps the array homogeneous; the runtime
 * still dispatches on each descriptor's own `kind`.
 */
const tIntent = tCon("Intent");
/** Opaque reaction handle — `effects` returns a list of these. */
const tReaction = tCon("Reaction");
const tArray = (t: Type): Type => tCon("Array", [t]);
/**
 * A reaction's return. The host's `Emit<I> = I | I[] | void` is a union, so
 * the seam picks the one arm that is always valid: return a list, `[]` for no
 * effect.
 */
const tEmit = tArray(tIntent);

/** `ReadSignal<T>` sketch — a component reads `s.count.value`. */
const signalOf = (t: Type): Type => tRecord(rExtend("value", t, rEmpty));

const isDefineContainerCall = (e: CallExpr): boolean =>
  isRefCall(e, "defineContainer") && e.args.length >= 2;

// ---------------------------------------------------------------------------
// Reading the pieces back out of an inferred config record
// ---------------------------------------------------------------------------

/** The `to` of an arrow field, or `null` for anything else. */
const resultOf = (t: Type | null): Type | null => (t?.kind === "arrow" ? t.to : null);

const stateSignalsOf = (state: Type | null, api: InferCallApi): Type =>
  state?.kind === "record" ? tRecord(mapRow(state.row, signalOf)) : tRecord(api.freshRowVar());

/**
 * A reducer's payload. re-reduced's `OnBuilder` is
 * `<P = void>(reduce: (state, payload: P) => Partial<S>) => ActionSpec<S, P>`,
 * so a reducer inferred as `S -> P -> Patch` is payloadful and one inferred
 * as `S -> Patch` is nullary.
 */
const payloadOf = (reducer: Type): Type | null => {
  if (reducer.kind !== "arrow") return null;
  return reducer.to.kind === "arrow" ? reducer.to.from : null;
};

/** A reducer's patch — past the state domain, and past the payload if any. */
const patchOf = (reducer: Type): Type | null => {
  if (reducer.kind !== "arrow") return null;
  return reducer.to.kind === "arrow" ? reducer.to.to : reducer.to;
};

/**
 * Action creator as a component calls it: `unit -> ()` nullary, else `P -> ()`.
 * Dispatch returns nothing — `(payload?: unknown) => void` in `@re-reduced/core`'s
 * `container.ts` — so the result is `unit` (ADR 0054), not a closed empty record.
 * A `{}` result would be unusable anyway and forced call sites to `ignore(…)`.
 */
const creatorOf = (reducer: Type): Type => tArrow(payloadOf(reducer) ?? tUnit, tUnit);

/**
 * `actions: on => { increment: on(…), … }` — the field carries the *reducer*
 * row (see `inferActions`); creators are derived from it so one sketch serves
 * both `store.actions.x()` and the `.d.mochi.ts` `ActionSpec<S, P>`.
 */
const actionsOf = (actions: Type | null): Type => {
  const result = resultOf(actions);
  if (result?.kind !== "record") return tRecord(rEmpty);
  return tRecord(mapRow(result.row, creatorOf));
};

/**
 * `derive: s => { doubled: () => … }` returns thunks (`D extends Record<string,
 * () => unknown>`); the store exposes them as `DerivedSignals<D>`.
 */
const derivedOf = (derive: Type | null): Type => {
  const result = resultOf(derive);
  if (result?.kind !== "record") return tRecord(rEmpty);
  return tRecord(mapRow(result.row, (t) => signalOf(t.kind === "arrow" ? t.to : t)));
};

/** Structural Store sketch for hover + `store.` / `store.actions.` complete. */
const storeOf = (def: Type, api: InferCallApi): Type => {
  if (def.kind !== "record") {
    return tRecord(
      rExtend(
        "actions",
        tRecord(api.freshRowVar()),
        rExtend("$state", tRecord(api.freshRowVar()), rEmpty),
      ),
    );
  }
  const state = rowField(def.row, "state");
  return tRecord(
    rExtend(
      "actions",
      actionsOf(rowField(def.row, "actions")),
      rExtend(
        "$state",
        stateSignalsOf(state, api),
        rExtend("$derived", derivedOf(rowField(def.row, "derive")), rEmpty),
      ),
    ),
  );
};

const storeFieldOr = (store: Type, label: string, api: InferCallApi): Type => {
  if (store.kind === "record") {
    const hit = rowField(store.row, label);
    if (hit) return hit;
  }
  return tRecord(api.freshRowVar());
};

// ---------------------------------------------------------------------------
// `actions:` — one instantiation per site
// ---------------------------------------------------------------------------

/**
 * Unify each label a patch mentions with that field of the state. Labels the
 * state does not have are left to the host's `Partial<S>` check; an open patch
 * row (a reducer that spreads) simply contributes nothing.
 */
const unifyPatch = (
  patch: Type | null,
  state: Type,
  span: Expr["span"],
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  if (patch?.kind !== "record" || state.kind !== "record") return null;
  let row: Row = patch.row;
  while (row.kind === "extend") {
    const field = rowField(state.row, row.label);
    if (field) {
      const uni = api.unify(row.type, field, span);
      if (isErr(uni)) return uni;
    }
    row = row.rest;
  }
  return null;
};

/** Row of `label -> reducer type`, inferred site by site. */
type ActionsSketch = { readonly reducers: Row; readonly payloads: ReadonlyMap<string, Type> };

/**
 * Infer `on => { k: on(reducer), … }` without ever inferring the `on => …`
 * lambda: each `reducer` is a closed expression (it never mentions `on`), so
 * inferring it directly gives that action its own `S -> Patch` /
 * `S -> P -> Patch`, which is exactly what rank-2 `OnBuilder` promises.
 */
const inferActions = (
  actionsExpr: Expr,
  state: Type,
  api: InferCallApi,
): Result<ActionsSketch, Diagnostic> | null => {
  const body = builderBody(actionsExpr);
  if (body?.shape !== "record") return null;
  const fields: { label: string; type: Type }[] = [];
  const payloads = new Map<string, Type>();
  for (const { label, site } of body.sites) {
    if (label === null || site.method !== null || site.args.length !== 1) return null;
    const reducerExpr = site.args[0]!;
    const r = api.infer(reducerExpr);
    if (isErr(r)) return r;
    // Pin the reducer's state domain so `s.count` resolves against `state`
    // instead of leaving an open row behind. The codomain stays free: it is
    // either the patch or, for a payloadful reducer, `P -> patch`.
    const uni = api.unify(r.value, tArrow(state, api.freshVar()), reducerExpr.span);
    if (isErr(uni)) return uni;
    // The patch is a *partial* state, which no single row type expresses: unify
    // label by label instead. This is what makes a payload inferable —
    // `(s, n) => { name: n }` only learns `n : string` once `name` meets state.
    const patched = unifyPatch(patchOf(api.zonk(r.value)), state, reducerExpr.span, api);
    if (patched && isErr(patched)) return patched;
    const reducer = api.zonk(r.value);
    const payload = payloadOf(reducer);
    if (payload) payloads.set(label, payload);
    fields.push({ label, type: reducer });
  }
  let reducers: Row = rEmpty;
  for (let i = fields.length - 1; i >= 0; i--) {
    const f = fields[i]!;
    reducers = rExtend(f.label, f.type, reducers);
  }
  return ok({ reducers, payloads });
};

// ---------------------------------------------------------------------------
// `effects:` — one instantiation per reaction
// ---------------------------------------------------------------------------

/** `ReactionCtx<S, A>` — `getState()` plus the action creators. */
const ctxOf = (state: Type, creators: Type): Type =>
  tRecord(rExtend("getState", tArrow(tUnit, state), rExtend("actions", creators, rEmpty)));

/** The literal string an `onAction` site names, when it is one. */
const literalName = (e: Expr): string | null => (e.kind === "str" ? e.value : null);

const expectArg = (
  arg: Expr | undefined,
  expected: Type,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  if (!arg) return null;
  const r = api.infer(arg);
  if (isErr(r)) return r;
  const uni = api.unify(r.value, expected, arg.span);
  if (isErr(uni)) return uni;
  return ok(api.zonk(r.value));
};

/**
 * Type one `fx.onAction/onChange/onEnter(…)` site. Each site instantiates its
 * own `T`/`I`, which is why the sites are walked instead of `fx` being
 * unified once.
 */
const inferReaction = (
  site: BuilderSite,
  signals: Type,
  ctx: Type,
  payloads: ReadonlyMap<string, Type>,
  api: InferCallApi,
): Result<Type, Diagnostic> => {
  const handlerAt = (i: number, expected: Type): Result<Type, Diagnostic> | null =>
    expectArg(site.args[i], expected, api);

  if (site.method === "onAction" && site.args.length >= 2) {
    const nameArg = site.args[0]!;
    const named = expectArg(nameArg, tString, api);
    if (named && isErr(named)) return named;
    // The host types the payload `unknown`; the seam does better by looking
    // the action up when the name is a literal.
    const literal = literalName(nameArg);
    const payload = (literal ? payloads.get(literal) : null) ?? api.freshVar();
    const run = handlerAt(1, tArrow(payload, tArrow(ctx, tEmit)));
    if (run && isErr(run)) return run;
    return ok(tReaction);
  }
  if (site.method === "onChange" && site.args.length >= 2) {
    const watched = api.freshVar();
    const select = handlerAt(0, tArrow(signals, watched));
    if (select && isErr(select)) return select;
    const run = handlerAt(1, tArrow(watched, tArrow(watched, tArrow(ctx, tEmit))));
    if (run && isErr(run)) return run;
    return ok(tReaction);
  }
  if (site.method === "onEnter" && site.args.length >= 2) {
    const pred = handlerAt(0, tArrow(signals, tBool));
    if (pred && isErr(pred)) return pred;
    const run = handlerAt(1, tArrow(ctx, tEmit));
    if (run && isErr(run)) return run;
    return ok(tReaction);
  }
  const rest = inferArgs(site.args, api);
  if (isErr(rest)) return rest;
  return ok(tReaction);
};

/**
 * Infer `fx => [fx.onChange(…), …]` site by site, so two reactions may watch
 * two different types.
 */
const inferEffects = (
  effectsExpr: Expr,
  signals: Type,
  ctx: Type,
  payloads: ReadonlyMap<string, Type>,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  const body = builderBody(effectsExpr);
  if (!body || body.shape === "record") return null;
  for (const { site } of body.sites) {
    const r = inferReaction(site, signals, ctx, payloads, api);
    if (isErr(r)) return r;
  }
  return ok(tArray(tReaction));
};

// ---------------------------------------------------------------------------
// `defineContainer`
// ---------------------------------------------------------------------------

/** Infer the remaining config fields normally and collect their row. */
const inferRest = (
  config: RecordExpr,
  known: ReadonlyMap<string, Type>,
  api: InferCallApi,
): Result<Row, Diagnostic> => {
  const fields: { label: string; type: Type }[] = [];
  for (const f of config.fields) {
    const hit = known.get(f.name);
    if (hit) {
      fields.push({ label: f.name, type: hit });
      continue;
    }
    const r = api.infer(f.value);
    if (isErr(r)) return r;
    fields.push({ label: f.name, type: api.zonk(r.value) });
  }
  let row: Row = rEmpty;
  for (let i = fields.length - 1; i >= 0; i--) {
    const f = fields[i]!;
    row = rExtend(f.label, f.type, row);
  }
  return ok(row);
};

/**
 * Walk the config literal in dependency order — `state` first (every other
 * field is typed against its signals), then `actions` (payloads feed
 * `onAction`), then `derive` and `effects`.
 */
const inferConfig = (config: RecordExpr, api: InferCallApi): Result<Row, Diagnostic> | null => {
  if (config.spread) return null;
  const stateExpr = fieldExpr(config, "state");
  const actionsExpr = fieldExpr(config, "actions");
  if (!stateExpr || !actionsExpr) return null;

  const stateR = api.infer(stateExpr);
  if (isErr(stateR)) return stateR;
  const state = api.zonk(stateR.value);
  const signals = stateSignalsOf(state, api);

  const actionsR = inferActions(actionsExpr, state, api);
  if (!actionsR) return null;
  if (isErr(actionsR)) return actionsR;
  const { reducers, payloads } = actionsR.value;

  const known = new Map<string, Type>([
    ["state", state],
    // The domain is the opaque `OnBuilder`; only the result row is ever read.
    ["actions", tArrow(api.freshVar(), tRecord(reducers))],
  ]);

  const deriveExpr = fieldExpr(config, "derive");
  if (deriveExpr) {
    const r = api.infer(deriveExpr);
    if (isErr(r)) return r;
    const thunks = api.freshVar();
    const uni = api.unify(r.value, tArrow(signals, thunks), deriveExpr.span);
    if (isErr(uni)) return uni;
    known.set("derive", api.zonk(r.value));
  }

  const effectsExpr = fieldExpr(config, "effects");
  if (effectsExpr) {
    const ctx = ctxOf(state, tRecord(mapRow(reducers, creatorOf)));
    const r = inferEffects(effectsExpr, signals, ctx, payloads, api);
    if (r) {
      if (isErr(r)) return r;
      known.set("effects", tArrow(api.freshVar(), r.value));
    }
  }

  return inferRest(config, known, api);
};

const inferDefineContainer: InferCallHook = (
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  if (!isDefineContainerCall(e)) return null;
  const nameR = api.infer(e.args[0]!);
  if (isErr(nameR)) return nameR;
  const configArg = e.args[1]!;

  // Runtime is exactly `{ name, ...config }`; keep that useful structural
  // shape in HM and reserve the heavy host generic for outbound TypeScript.
  if (configArg.kind === "record") {
    const row = inferConfig(configArg, api);
    if (row) {
      if (isErr(row)) return row;
      const tailR = inferArgs(e.args.slice(2), api);
      if (isErr(tailR)) return tailR;
      return ok(tRecord(rExtend("name", tString, row.value)));
    }
  }
  // Config is a binding, a spread, or shaped in a way the DSL walk does not
  // recognize: fall back to plain structural inference.
  const argsR = inferArgs(e.args.slice(1), api);
  if (isErr(argsR)) return argsR;
  const configType = argsR.value[0] ? api.zonk(argsR.value[0]) : null;
  if (configType?.kind === "record") {
    return ok(tRecord(rExtend("name", tString, configType.row)));
  }
  return ok(tRecord(rExtend("name", tString, api.freshRowVar())));
};

const inferUseContainer: InferCallHook = (
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  if (!isRefCall(e, "useContainer") || e.args.length < 1) return null;
  const defR = api.infer(e.args[0]!);
  if (isErr(defR)) return defR;
  const restR = inferArgs(e.args.slice(1), api);
  if (isErr(restR)) return restR;
  return ok(storeOf(api.zonk(defR.value), api));
};

/**
 * The selector domain for `useSelect` / `useWatch`. The host passes
 * `(state, derived)`; a one-parameter selector only wants the state signals,
 * so the arity of the written lambda picks the shape.
 */
const selectorType = (selector: Expr, store: Type, result: Type, api: InferCallApi): Type => {
  const signals = storeFieldOr(store, "$state", api);
  if (selector.kind === "lambda" && selector.params.length >= 2) {
    return tArrow(signals, tArrow(storeFieldOr(store, "$derived", api), result));
  }
  return tArrow(signals, result);
};

/**
 * `useSelect(store, s => s.count.value)` — type the selector against the
 * store sketch. A two-parameter selector also sees the derived signals.
 */
const inferUseSelect: InferCallHook = (
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  if (!isRefCall(e, "useSelect") || e.args.length < 2) return null;
  const storeR = api.infer(e.args[0]!);
  if (isErr(storeR)) return storeR;
  const store = api.zonk(storeR.value);
  const result = api.freshVar();
  const selArg = e.args[1]!;
  const selR = api.infer(selArg);
  if (isErr(selR)) return selR;
  const uni = api.unify(selR.value, selectorType(selArg, store, result, api), selArg.span);
  if (isErr(uni)) return uni;
  const restR = inferArgs(e.args.slice(2), api);
  if (isErr(restR)) return restR;
  return ok(result);
};

/**
 * `useWatch(store, selector, run)` — same selector shape as `useSelect`; the
 * effect receives the selected value and may return a cleanup.
 */
const inferUseWatch: InferCallHook = (
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  if (!isRefCall(e, "useWatch") || e.args.length < 3) return null;
  const storeR = api.infer(e.args[0]!);
  if (isErr(storeR)) return storeR;
  const store = api.zonk(storeR.value);
  const watched = api.freshVar();
  const selArg = e.args[1]!;
  const selR = api.infer(selArg);
  if (isErr(selR)) return selR;
  const uniSel = api.unify(selR.value, selectorType(selArg, store, watched, api), selArg.span);
  if (isErr(uniSel)) return uniSel;
  const runArg = e.args[2]!;
  const runR = api.infer(runArg);
  if (isErr(runR)) return runR;
  const uniRun = api.unify(runR.value, tArrow(watched, api.freshVar()), runArg.span);
  if (isErr(uniRun)) return uniRun;
  return ok(tUnit);
};

/**
 * `Intent.query/timeout/storageSet(…)` — the intent vocabulary, claimed as
 * members of the seam's namespace rather than as bare global names so the
 * plugin does not have to own words as common as `query` or `timeout`.
 *
 * `Intent.query` takes a mochi `Task`, not the host's bare `Promise`: the
 * runtime adapter in `./runtime` unwraps the `Result` and routes it to
 * `onOk` / `onErr`.
 */
const inferIntent: InferCallHook = (
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  if (e.fn.kind !== "field") return null;
  if (e.fn.target.kind !== "ref" || e.fn.target.name !== INTENTS) return null;
  const method = e.fn.name;
  const argsR = inferArgs(e.args, api);
  if (isErr(argsR)) return argsR;

  if (method === "query" && e.args.length >= 1) {
    const data = api.freshVar();
    const err = api.freshVar();
    const spec = tRecord(
      rExtend(
        "key",
        tArray(api.freshVar()),
        rExtend(
          "task",
          tCon("Task", [data, err]),
          rExtend(
            "onOk",
            tArrow(data, api.freshVar()),
            rExtend("onErr", tArrow(err, api.freshVar()), api.freshRowVar()),
          ),
        ),
      ),
    );
    const uni = api.unify(argsR.value[0]!, spec, e.args[0]!.span);
    if (isErr(uni)) return uni;
    return ok(tIntent);
  }
  if (method === "timeout" && e.args.length >= 2) {
    const ms = api.unify(argsR.value[0]!, tNumber, e.args[0]!.span);
    if (isErr(ms)) return ms;
    const run = api.unify(argsR.value[1]!, tArrow(tUnit, api.freshVar()), e.args[1]!.span);
    if (isErr(run)) return run;
    return ok(tIntent);
  }
  if (method === "storageSet" && e.args.length >= 2) {
    const key = api.unify(argsR.value[0]!, tString, e.args[0]!.span);
    if (isErr(key)) return key;
    return ok(tIntent);
  }
  return null;
};

const inferReReducedCall: InferCallHook = (e, api) =>
  inferDefineContainer(e, api) ??
  inferUseContainer(e, api) ??
  inferUseSelect(e, api) ??
  inferUseWatch(e, api) ??
  inferIntent(e, api);

// ---------------------------------------------------------------------------
// `.d.mochi.ts`
// ---------------------------------------------------------------------------

const reReducedDts: DtsBindingHook = (
  _name,
  _sc,
  value,
  _aliases,
  _fallback,
  api: DtsBindingApi,
): string | null => {
  if (value.kind !== "call" || !isDefineContainerCall(value)) return null;
  if (api.folded.kind !== "record") return null;
  const state = rowField(api.folded.row, "state");
  const S = state ? api.tsType(state) : "Record<string, unknown>";

  const reducers = resultOf(rowField(api.folded.row, "actions"));
  const specs: string[] = [];
  if (reducers?.kind === "record") {
    let row: Row = reducers.row;
    while (row.kind === "extend") {
      const payload = payloadOf(row.type);
      const P = payload ? api.tsType(payload) : "void";
      specs.push(`${row.label}: ${HOST}.ActionSpec<${S}, ${P}>`);
      row = row.rest;
    }
  }
  const R = specs.length === 0 ? "Record<string, never>" : `{ ${specs.join("; ")} }`;

  // `D extends Record<string, () => unknown>` — the thunk row as written.
  const thunks = resultOf(rowField(api.folded.row, "derive"));
  const D =
    thunks?.kind === "record" && rowLabels(thunks.row).length > 0
      ? api.tsType(thunks)
      : "Record<string, never>";

  // Intents collapse to one nominal type at the seam, so the emitted `I` is
  // the host's builtin union whenever the container declares any reaction.
  const I = rowField(api.folded.row, "effects") ? `${HOST}.BuiltinIntent` : "never";

  return `${HOST}.ContainerDef<${S}, ${R}, ${D}, ${I}> & { name: string }`;
};

export const reReducedExtension: HostExtension = {
  name: "re-reduced",
  // Claim: the container API callee names this hook chain handles, plus the
  // intent namespace (a member claim, so no common global name is taken).
  inferCall: {
    refs: ["defineContainer", "useContainer", "useSelect", "useWatch"],
    memberTargets: [INTENTS],
    hook: inferReReducedCall,
  },
  dtsBinding: reReducedDts,
};
