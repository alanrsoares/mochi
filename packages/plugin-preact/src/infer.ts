/**
 * Preact hook call-site inference (ADR 0015 / tracer #50).
 *
 * `hooks.mochi` extern schemes stay polymorphic where HM would lie (updater
 * overloads, heterogeneous deps). This module pins shapes at each call.
 */
import { isErr, ok, type Result } from "@onrails/result";
import type { Expr } from "../../../src/ast";
import type { Diagnostic } from "../../../src/errors";
import type { InferCallApi, InferCallHook } from "../../../src/extensions";
import type { Type } from "../../../src/types";
import {
  rEmpty,
  rExtend,
  tArrow,
  tCon,
  tRecord,
  tTuple,
  tUnion,
  tUnit,
} from "../../../src/types.ts";

type CallExpr = Extract<Expr, { kind: "call" }>;

const isRefCall = (e: CallExpr, name: string): boolean => e.fn.kind === "ref" && e.fn.name === name;

const arrOf = (elem: Type): Type => tCon("Array", [elem]);

/** `T | (T -> T)` — direct value or functional updater. */
const setStateDomain = (stateT: Type): Type => tUnion([stateT, tArrow(stateT, stateT)]);

const inferUseState: InferCallHook = (e, api) => {
  if (!isRefCall(e, "useState") || e.args.length !== 1) return null;
  const initR = api.infer(e.args[0]!);
  if (isErr(initR)) return initR;
  const stateT = api.zonk(initR.value);
  const setterT = tArrow(setStateDomain(stateT), tUnit);
  return ok(tTuple([stateT, setterT]));
};

const inferUseRef: InferCallHook = (e, api) => {
  if (!isRefCall(e, "useRef") || e.args.length !== 1) return null;
  const initR = api.infer(e.args[0]!);
  if (isErr(initR)) return initR;
  const stateT = api.zonk(initR.value);
  return ok(tRecord(rExtend("current", stateT, rEmpty)));
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
  for (const arg of e.args.slice(1)) {
    const r = api.infer(arg);
    if (isErr(r)) return r;
  }
  return ok(tUnit);
};

const inferUseCallback: InferCallHook = (e, api) => {
  if (!isRefCall(e, "useCallback") || e.args.length < 1) return null;
  const fnR = api.infer(e.args[0]!);
  if (isErr(fnR)) return fnR;
  const fnT = api.zonk(fnR.value);
  if (e.args.length === 1) return ok(tArrow(arrOf(api.freshVar()), fnT));
  for (const arg of e.args.slice(1)) {
    const r = api.infer(arg);
    if (isErr(r)) return r;
  }
  return ok(fnT);
};

const inferUseMemo: InferCallHook = (e, api) => {
  if (!isRefCall(e, "useMemo") || e.args.length < 1) return null;
  const resultT = api.freshVar();
  const thunkR = api.infer(e.args[0]!);
  if (isErr(thunkR)) return thunkR;
  const uni = api.unify(thunkR.value, tArrow(tUnit, resultT), e.args[0]!.span);
  if (isErr(uni)) return uni;
  if (e.args.length === 1) return ok(tArrow(arrOf(api.freshVar()), api.zonk(resultT)));
  for (const arg of e.args.slice(1)) {
    const r = api.infer(arg);
    if (isErr(r)) return r;
  }
  return ok(api.zonk(resultT));
};

/** Pack heterogeneous deps — element type stays opaque at the seam. */
const inferHookDeps: InferCallHook = (e, api) => {
  const names = ["hookDeps", "hookDeps2", "hookDeps1", "hookDeps0"] as const;
  const name = names.find((n) => isRefCall(e, n));
  if (!name) return null;
  const expectedArgs =
    name === "hookDeps0" ? 0 : name === "hookDeps1" ? 1 : name === "hookDeps2" ? 2 : 3;
  if (e.args.length !== expectedArgs) return null;
  for (const arg of e.args) {
    const r = api.infer(arg);
    if (isErr(r)) return r;
  }
  return ok(arrOf(api.freshVar()));
};

export const inferPreactCall: InferCallHook = (e, api) =>
  inferUseState(e, api) ??
  inferUseRef(e, api) ??
  inferEffectLike(e, api, "useEffect") ??
  inferEffectLike(e, api, "useLayoutEffect") ??
  inferUseCallback(e, api) ??
  inferUseMemo(e, api) ??
  inferHookDeps(e, api);
