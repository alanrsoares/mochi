/**
 * Main-thread façade over the playground compile worker, with sync fallback
 * when Workers are unavailable (tests, older browsers).
 */
import { type CompileTargets, compileTargets, type Diagnostic } from "@mochi/compiler";
import { isErr } from "@onrails/result";
import type { CompileWorkerRequest, CompileWorkerResponse } from "./playground-compile.worker";

export type PlaygroundCompileOk = CompileTargets & { ms: number };
export type PlaygroundCompileErr = {
  diagnostics?: Diagnostic[];
  message?: string;
  ms: number;
};
export type PlaygroundCompileResult =
  | { ok: true; value: PlaygroundCompileOk }
  | { ok: false; error: PlaygroundCompileErr };

type Pending = {
  resolve: (result: PlaygroundCompileResult) => void;
};

export type PlaygroundCompiler = {
  compile: (source: string) => Promise<PlaygroundCompileResult>;
  dispose: () => void;
};

const syncCompile = (source: string): PlaygroundCompileResult => {
  const start = performance.now();
  try {
    const result = compileTargets(source, { runtime: true });
    const ms = performance.now() - start;
    if (isErr(result)) return { ok: false, error: { diagnostics: result.error, ms } };
    return { ok: true, value: { ...result.value, ms } };
  } catch (e: unknown) {
    return {
      ok: false,
      error: { message: e instanceof Error ? e.message : String(e), ms: performance.now() - start },
    };
  }
};

export const createPlaygroundCompiler = (): PlaygroundCompiler => {
  if (typeof Worker === "undefined") {
    return {
      compile: async (source) => syncCompile(source),
      dispose: () => undefined,
    };
  }

  let seq = 0;
  const pending = new Map<number, Pending>();
  let worker: Worker | null = null;

  try {
    worker = new Worker(new URL("./playground-compile.worker.ts", import.meta.url), {
      type: "module",
    });
  } catch {
    return {
      compile: async (source) => syncCompile(source),
      dispose: () => undefined,
    };
  }

  worker.onmessage = (event: MessageEvent<CompileWorkerResponse>) => {
    const msg = event.data;
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    if (msg.ok) {
      entry.resolve({
        ok: true,
        value: { js: msg.js, ts: msg.ts, dts: msg.dts, ms: msg.ms },
      });
      return;
    }
    if ("diagnostics" in msg) {
      entry.resolve({ ok: false, error: { diagnostics: msg.diagnostics, ms: msg.ms } });
      return;
    }
    entry.resolve({ ok: false, error: { message: msg.message, ms: msg.ms } });
  };

  worker.onerror = () => {
    // Fall back for any subsequent call; in-flight requests get a generic error.
    for (const [id, entry] of pending) {
      pending.delete(id);
      entry.resolve({
        ok: false,
        error: { message: "Playground compile worker failed", ms: 0 },
      });
    }
    worker?.terminate();
    worker = null;
  };

  return {
    compile: (source) => {
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
        entry.resolve({
          ok: false,
          error: { message: "Playground compile cancelled", ms: 0 },
        });
      }
      worker?.terminate();
      worker = null;
    },
  };
};
