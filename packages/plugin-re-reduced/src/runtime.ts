/**
 * Runtime seam for `@mochi/plugin-re-reduced` — the JS side of
 * `container.mochi`.
 *
 * Two jobs the host library cannot do for us:
 *
 * 1. **`Intent.query` takes a mochi `Task`.** re-reduced's `query` wants
 *    `run: (signal) => Promise<T>` and reports failure through `onError`,
 *    while a mochi `Task a b` is a thunk returning `Promise<Result<a, b>>`
 *    (ADR 0006) — success and failure in one value. The adapter runs the task
 *    and routes each arm, so the mochi side keeps writing `Task`s.
 * 2. **`query` ships no interpreter.** Interpreters are not defaulted: an
 *    intent whose `kind` has no entry throws. `queryInterpreter` runs the
 *    fetch under the container's `AbortSignal`; `defaultInterpreters` bundles
 *    it with the two the library does ship, so a container that only uses the
 *    builtin intents needs no registry of its own.
 */

import {
  type InterpCtx,
  makeStorageInterpreter,
  type QueryIntent,
  query,
  storageSet,
  timeout,
  timeoutInterpreter,
} from "@re-reduced/core";

/** A mochi `Task a b`: a thunk producing a tagged `Result`. */
type Task<A, B> = () => Promise<{ _tag: "Ok"; value: A } | { _tag: "Err"; error: B }>;

/** The mochi-facing spec for `Intent.query`. */
type QuerySpec<A, B> = {
  readonly key: readonly unknown[];
  readonly task: Task<A, B>;
  readonly onOk: (data: A) => unknown;
  readonly onErr: (error: B) => unknown;
};

/**
 * The intent vocabulary, bound as one namespace so the plugin can claim
 * `Intent.*` as a member target instead of owning bare `query` / `timeout` /
 * `storageSet` — names far too common to take from every consumer.
 */
export const Intent = {
  /** `query` over a mochi `Task`; the `Err` arm becomes `onError`. */
  query: <A, B>(spec: QuerySpec<A, B>): QueryIntent =>
    query<A>({
      key: spec.key,
      // The task is already the whole request; re-reduced aborts by ignoring
      // a settled promise, and `queryInterpreter` below drops late results.
      run: async () => {
        const result = await spec.task();
        if (result._tag === "Err") throw result.error;
        return result.value;
      },
      onData: (data) => {
        spec.onOk(data);
      },
      onError: (error) => {
        spec.onErr(error as B);
      },
    }),
  timeout: (ms: number, run: () => unknown) =>
    timeout(ms, () => {
      run();
    }),
  storageSet: (key: string, value: unknown) => storageSet(key, value),
};

/**
 * Interpret a `query` intent: run it under the container's signal and drop the
 * result if the container tore down mid-flight, so a late response cannot
 * dispatch into a destroyed store.
 */
export const queryInterpreter = <A>(intent: QueryIntent, ctx: InterpCtx<A>): void => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  ctx.signal.addEventListener("abort", abort, { once: true });
  void intent
    .run(controller.signal)
    .then((data) => {
      if (!ctx.signal.aborted) intent.onData(data);
    })
    .catch((error: unknown) => {
      if (!ctx.signal.aborted) intent.onError?.(error);
    });
};

/** Every builtin intent kind covered — pass as `useContainer`'s `interpreters`. */
export const defaultInterpreters = {
  query: queryInterpreter,
  timeout: timeoutInterpreter,
  storageSet: makeStorageInterpreter(),
};
