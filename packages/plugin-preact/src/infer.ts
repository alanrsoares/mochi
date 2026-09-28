/**
 * Preact hook call-site inference (ADR 0015 / tracer #50).
 *
 * `hooks.mochi` extern schemes stay polymorphic where HM would lie (updater
 * overloads, heterogeneous deps). This module pins shapes at each call.
 */

import type { Diagnostic } from "@mochi/compiler/errors";
import type { InferCallApi, InferCallHook } from "@mochi/compiler/extensions";
// Explicit real-file subpath (like `@mochi/compiler/types` below): a value
// import, so Node/Vite's config loader must resolve it without a bundler.
import type { CallExpr } from "@mochi/compiler/plugin-kit";
import { inferArgs, isRefCall } from "@mochi/compiler/plugin-kit";
import { widenLits } from "@mochi/compiler/schemes";
import type { Type } from "@mochi/compiler/types";
import {
  rEmpty,
  rExtend,
  tArrow,
  tCon,
  tRecord,
  tTuple,
  tUnion,
  tUnit,
} from "@mochi/compiler/types";
import { err, isErr, ok, type Result } from "@onrails/result";

const arrOf = (elem: Type): Type => tCon("Array", [elem]);

/** `T | (T -> T)` — direct value or functional updater. */
const setStateDomain = (stateT: Type): Type => tUnion([stateT, tArrow(stateT, stateT)]);

const inferUseState: InferCallHook = (e, api) => {
  if (!isRefCall(e, "useState") || e.args.length !== 1) return null;
  const initR = api.infer(e.args[0]!);
  if (isErr(initR)) return initR;
  const stateT = widenLits(api.zonk(initR.value));
  const setterT = tArrow(setStateDomain(stateT), tUnit);
  return ok(tTuple([stateT, setterT]));
};

/** `useLazyState(() => init)` — thunk runs on mount; state is its result. */
const inferUseLazyState: InferCallHook = (e, api) => {
  if (!isRefCall(e, "useLazyState") || e.args.length !== 1) return null;
  const stateT = api.freshVar();
  const thunkR = api.infer(e.args[0]!);
  if (isErr(thunkR)) return thunkR;
  const uni = api.unify(thunkR.value, tArrow(tUnit, stateT), e.args[0]!.span);
  if (isErr(uni)) return uni;
  const state = widenLits(api.zonk(stateT));
  return ok(tTuple([state, tArrow(setStateDomain(state), tUnit)]));
};

const inferUseRef: InferCallHook = (e, api) => {
  if (!isRefCall(e, "useRef") || e.args.length !== 1) return null;
  const initR = api.infer(e.args[0]!);
  if (isErr(initR)) return initR;
  const stateT = api.zonk(initR.value);
  return ok(tRecord(rExtend("current", stateT, rEmpty)));
};

/**
 * The dependency list after a hook's callback: one array, as Preact takes it.
 * A claimed call skips core application, so nothing else would reject
 * `useEffect(fn, 42)` or a surplus argument.
 */
const inferDeps = (e: CallExpr, api: InferCallApi, name: string): Result<null, Diagnostic> => {
  if (e.args.length > 2)
    return err({
      kind: "type",
      message: `${name} takes one dependency array after its callback`,
      span: e.args[2]!.span,
    });
  const deps = e.args[1]!;
  const depsR = api.infer(deps);
  if (isErr(depsR)) return depsR;
  const uni = api.unify(depsR.value, arrOf(api.freshVar()), deps.span);
  return isErr(uni) ? uni : ok(null);
};

const inferEffectLike = (
  e: CallExpr,
  api: InferCallApi,
  name: string,
): Result<Type, Diagnostic> | null => {
  if (!isRefCall(e, name) || e.args.length < 1) return null;
  const cleanupT = api.freshVar();
  const effectR = api.infer(e.args[0]!);
  if (isErr(effectR)) return effectR;
  const uni = api.unify(effectR.value, tArrow(tUnit, cleanupT), e.args[0]!.span);
  if (isErr(uni)) return uni;
  if (e.args.length === 1) {
    // Curried: `useEffect(fn)(hookDeps…)` — deps come in a second call.
    return ok(tArrow(arrOf(api.freshVar()), tUnit));
  }
  const depsR = inferDeps(e, api, name);
  return isErr(depsR) ? depsR : ok(tUnit);
};

const inferUseCallback: InferCallHook = (e, api) => {
  if (!isRefCall(e, "useCallback") || e.args.length < 1) return null;
  const fnR = api.infer(e.args[0]!);
  if (isErr(fnR)) return fnR;
  const fnT = api.zonk(fnR.value);
  if (e.args.length === 1) return ok(tArrow(arrOf(api.freshVar()), fnT));
  const depsR = inferDeps(e, api, "useCallback");
  return isErr(depsR) ? depsR : ok(fnT);
};

const inferUseMemo: InferCallHook = (e, api) => {
  if (!isRefCall(e, "useMemo") || e.args.length < 1) return null;
  const resultT = api.freshVar();
  const thunkR = api.infer(e.args[0]!);
  if (isErr(thunkR)) return thunkR;
  const uni = api.unify(thunkR.value, tArrow(tUnit, resultT), e.args[0]!.span);
  if (isErr(uni)) return uni;
  if (e.args.length === 1) return ok(tArrow(arrOf(api.freshVar()), api.zonk(resultT)));
  const depsR = inferDeps(e, api, "useMemo");
  return isErr(depsR) ? depsR : ok(api.zonk(resultT));
};

/** Pack heterogeneous deps — element type stays opaque at the seam. */
const inferHookDeps: InferCallHook = (e, api) => {
  const names = ["hookDeps", "hookDeps2", "hookDeps1", "hookDeps0"] as const;
  const name = names.find((n) => isRefCall(e, n));
  if (!name) return null;
  const expectedArgs =
    name === "hookDeps0" ? 0 : name === "hookDeps1" ? 1 : name === "hookDeps2" ? 2 : 3;
  if (e.args.length !== expectedArgs) return null;
  const argsR = inferArgs(e.args, api);
  return isErr(argsR) ? argsR : ok(arrOf(api.freshVar()));
};

/** Callee `ref` names this plugin's `inferCall` hook claims (clash detection). */
export const PREACT_HOOK_REFS = [
  "useState",
  "useLazyState",
  "useRef",
  "useEffect",
  "useLayoutEffect",
  "useCallback",
  "useMemo",
  "hookDeps",
  "hookDeps0",
  "hookDeps1",
  "hookDeps2",
] as const;

export const inferPreactCall: InferCallHook = (e, api) =>
  inferUseState(e, api) ??
  inferUseLazyState(e, api) ??
  inferUseRef(e, api) ??
  inferEffectLike(e, api, "useEffect") ??
  inferEffectLike(e, api, "useLayoutEffect") ??
  inferUseCallback(e, api) ??
  inferUseMemo(e, api) ??
  inferHookDeps(e, api);
