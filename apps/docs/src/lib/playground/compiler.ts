/**
 * Main-thread façade over the playground compile worker, with sync fallback
 * when Workers are unavailable (tests, older browsers).
 *
 * `compile` returns a mochi `Task a e` — `() => Promise<Result<a, e>>` with the
 * prelude's `{ _tag: "Ok" | "Err" }` shape (ADR 0006). Callers kick off with
 * `compile(src)()` (same as `Task.run`).
 */
import { type CompileTargets, compileTargets, type Diagnostic } from "@mochi/compiler";
import { isErr } from "@onrails/result";
import { err, ok, type Result, type Task } from "../task";
import type { CompileWorkerRequest, CompileWorkerResponse } from "./compile.worker";

export type PlaygroundCompileOk = CompileTargets & { ms: number };
export type PlaygroundCompileErr = {
  diagnostics?: Diagnostic[];
  message?: string;
  ms: number;
};

type Pending = {
  resolve: (result: Result<PlaygroundCompileOk, PlaygroundCompileErr>) => void;
};

export type PlaygroundCompiler = {
  compile: (source: string) => Task<PlaygroundCompileOk, PlaygroundCompileErr>;
  dispose: () => void;
};

const syncCompile = (source: string): Result<PlaygroundCompileOk, PlaygroundCompileErr> => {
  const start = performance.now();
  try {
    const result = compileTargets(source, { runtime: true });
    const ms = performance.now() - start;
    if (isErr(result)) return err({ diagnostics: result.error, ms });
    return ok({ ...result.value, ms });
  } catch (e: unknown) {
    return err({
      message: e instanceof Error ? e.message : String(e),
      ms: performance.now() - start,
    });
  }
};

/**
 * Sync compile as a `Task` — used by the mochi façade (`compile.mochi`)
 * and as the Worker-less fallback. Building the Task runs no effect; calling it does.
 */
export const compileSyncTask =
  (source: string): Task<PlaygroundCompileOk, PlaygroundCompileErr> =>
  () =>
    Promise.resolve(syncCompile(source));

export const createPlaygroundCompiler = (): PlaygroundCompiler => {
  if (typeof Worker === "undefined") {
    return {
      compile: compileSyncTask,
      dispose: () => undefined,
    };
  }

  let seq = 0;
  const pending = new Map<number, Pending>();
  let worker: Worker | null = null;

  try {
    worker = new Worker(new URL("./compile.worker.ts", import.meta.url), {
      type: "module",
    });
  } catch {
    return {
      compile: compileSyncTask,
      dispose: () => undefined,
    };
  }

  worker.onmessage = (event: MessageEvent<CompileWorkerResponse>) => {
    const msg = event.data;
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    if (msg.ok) {
      entry.resolve(ok({ js: msg.js, ts: msg.ts, dts: msg.dts, ms: msg.ms }));
      return;
    }
    if ("diagnostics" in msg) {
      entry.resolve(err({ diagnostics: msg.diagnostics, ms: msg.ms }));
      return;
    }
    entry.resolve(err({ message: msg.message, ms: msg.ms }));
  };

  worker.onerror = () => {
    // Fall back for any subsequent call; in-flight requests get a generic error.
    for (const [id, entry] of pending) {
      pending.delete(id);
      entry.resolve(err({ message: "Playground compile worker failed", ms: 0 }));
    }
    worker?.terminate();
    worker = null;
  };

  return {
    compile: (source) => () => {
      if (!worker) return Promise.resolve(syncCompile(source));
      seq += 1;
      const id = seq;
      return new Promise((resolve) => {
        pending.set(id, { resolve });
        const request: CompileWorkerRequest = { id, source };
        worker?.postMessage(request);
      });
    },
    dispose: () => {
      for (const [id, entry] of pending) {
        pending.delete(id);
        entry.resolve(err({ message: "Playground compile cancelled", ms: 0 }));
      }
      worker?.terminate();
      worker = null;
    },
  };
};
