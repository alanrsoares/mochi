/**
 * Preact call-site typing over the self-hosted core (ADR 0015, 0109).
 * `hooks.mochi` keeps honest but deliberately loose extern schemes; this plugin
 * pins the relationships HM cannot state there: updater-or-value setters,
 * `{ current }` refs, effect thunks, memo results, and heterogeneous dep packs.
 *
 * Compiler inference threads `St` instead of mutating it, so a `Solver`
 * carries the latest state through every inference and unification step.
 */
import type { CompilerInferCallHook, CompilerPlugin } from "@mochi/compiler/extensions";
import type { Expr, IErr, InferApi, Span, St, Ty } from "@mochi/compiler/infer/types";
import {
  freshVar,
  rExtend,
  tArrow,
  tCon,
  tRecord,
  tTuple,
  tUnion,
  tUnit,
  widenLits,
  zonk,
} from "@mochi/compiler/infer/types";
import { isErr, ok, type Result } from "@onrails/result";

type Step<T> = Result<T, IErr>;
type Solver = { st: St; readonly api: InferApi };
type Hook = (s: Solver, fn: Expr, args: readonly Expr[]) => Step<Ty> | null;

const none = { _tag: "None" } as const;

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

const solved = (s: Solver, t: Ty): Ty => zonk(t, s.st);

const inferAll = (s: Solver, es: readonly Expr[]): Step<null> => {
  for (const e of es) {
    const r = inferIn(s, e);
    if (isErr(r)) return r;
  }
  return ok(null);
};

const isRef = (fn: Expr, name: string): boolean => fn._tag === "ERef" && fn.name === name;

const arrOf = (elem: Ty): Ty => tCon("Array", [elem]);

/** `T | (T -> T)` — direct value or functional updater. */
const setStateDomain = (stateT: Ty): Ty => tUnion([stateT, tArrow(stateT, stateT)]);

const inferUseState: Hook = (s, fn, args) => {
  if (!isRef(fn, "useState") || args.length !== 1) return null;
  const initR = inferIn(s, args[0]!);
  if (isErr(initR)) return initR;
  const stateT = widenLits(solved(s, initR.value));
  return ok(tTuple([stateT, tArrow(setStateDomain(stateT), tUnit)]));
};

/** `useLazyState(() => init)` — thunk runs on mount; state is its result. */
const inferUseLazyState: Hook = (s, fn, args) => {
  if (!isRef(fn, "useLazyState") || args.length !== 1) return null;
  const stateT = fresh(s);
  const thunkR = inferIn(s, args[0]!);
  if (isErr(thunkR)) return thunkR;
  const uni = unifyIn(s, thunkR.value, tArrow(tUnit, stateT), args[0]!.span);
  if (isErr(uni)) return uni;
  const state = widenLits(solved(s, stateT));
  return ok(tTuple([state, tArrow(setStateDomain(state), tUnit)]));
};

const inferUseRef: Hook = (s, fn, args) => {
  if (!isRef(fn, "useRef") || args.length !== 1) return null;
  const initR = inferIn(s, args[0]!);
  if (isErr(initR)) return initR;
  return ok(tRecord(rExtend("current", solved(s, initR.value), { _tag: "RowEmpty" })));
};

/**
 * The dependency list after a hook's callback: one array, as Preact takes it.
 * A claimed call skips core application, so nothing else would reject
 * `useEffect(fn, 42)` or a surplus argument.
 */
const inferDeps = (s: Solver, args: readonly Expr[], name: string): Step<null> => {
  const surplus = args[2];
  if (surplus)
    return {
      _tag: "Err",
      error: {
        message: `${name} takes one dependency array after its callback`,
        start: surplus.span.start,
        end: surplus.span.end,
        help: none,
        suggestions: [],
      },
    };
  const deps = args[1]!;
  const depsR = inferIn(s, deps);
  if (isErr(depsR)) return depsR;
  return unifyIn(s, depsR.value, arrOf(fresh(s)), deps.span);
};

const effectLike =
  (name: string): Hook =>
  (s, fn, args) => {
    if (!isRef(fn, name) || args.length < 1) return null;
    const cleanupT = fresh(s);
    const effectR = inferIn(s, args[0]!);
    if (isErr(effectR)) return effectR;
    const uni = unifyIn(s, effectR.value, tArrow(tUnit, cleanupT), args[0]!.span);
    if (isErr(uni)) return uni;
    // Curried: `useEffect(fn)(hookDeps…)` — deps come in a second call.
    if (args.length === 1) return ok(tArrow(arrOf(fresh(s)), tUnit));
    const depsR = inferDeps(s, args, name);
    return isErr(depsR) ? depsR : ok(tUnit);
  };

const inferUseCallback: Hook = (s, fn, args) => {
  if (!isRef(fn, "useCallback") || args.length < 1) return null;
  const fnR = inferIn(s, args[0]!);
  if (isErr(fnR)) return fnR;
  const fnT = solved(s, fnR.value);
  if (args.length === 1) return ok(tArrow(arrOf(fresh(s)), fnT));
  const depsR = inferDeps(s, args, "useCallback");
  return isErr(depsR) ? depsR : ok(fnT);
};

const inferUseMemo: Hook = (s, fn, args) => {
  if (!isRef(fn, "useMemo") || args.length < 1) return null;
  const resultT = fresh(s);
  const thunkR = inferIn(s, args[0]!);
  if (isErr(thunkR)) return thunkR;
  const uni = unifyIn(s, thunkR.value, tArrow(tUnit, resultT), args[0]!.span);
  if (isErr(uni)) return uni;
  if (args.length === 1) return ok(tArrow(arrOf(fresh(s)), solved(s, resultT)));
  const depsR = inferDeps(s, args, "useMemo");
  return isErr(depsR) ? depsR : ok(solved(s, resultT));
};

const HOOK_DEPS_ARITY: Readonly<Record<string, number>> = {
  hookDeps: 3,
  hookDeps2: 2,
  hookDeps1: 1,
  hookDeps0: 0,
};

/** Pack heterogeneous deps — element type stays opaque at the seam. */
const inferHookDeps: Hook = (s, fn, args) => {
  if (fn._tag !== "ERef" || HOOK_DEPS_ARITY[fn.name] !== args.length) return null;
  const argsR = inferAll(s, args);
  return isErr(argsR) ? argsR : ok(arrOf(fresh(s)));
};

const hooks: readonly Hook[] = [
  inferUseState,
  inferUseLazyState,
  inferUseRef,
  effectLike("useEffect"),
  effectLike("useLayoutEffect"),
  inferUseCallback,
  inferUseMemo,
  inferHookDeps,
];

const inferPreactCall: CompilerInferCallHook = (fn, args, _origin, st, api) => {
  for (const hook of hooks) {
    const s: Solver = { st, api };
    const r = hook(s, fn, args);
    if (r === null) continue;
    if (isErr(r)) return r;
    return ok({ _tag: "Some", value: [r.value, s.st] });
  }
  return ok(none);
};

export const preactPlugin: CompilerPlugin = {
  name: "preact",
  inferCall: inferPreactCall,
};
