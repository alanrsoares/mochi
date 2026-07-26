/// <reference lib="webworker" />
/**
 * Playground compile worker — keeps lex/parse/infer/codegen off the UI thread.
 * Message protocol is structured-clone only (plain diagnostics + strings).
 */
import { compileTargets, type Diagnostic } from "@mochi/compiler";
import { isErr } from "@onrails/result";

export type CompileWorkerRequest = { id: number; source: string };

export type CompileWorkerResponse =
  | {
      id: number;
      ok: true;
      js: string;
      ts: string;
      dts: string;
      ms: number;
    }
  | {
      id: number;
      ok: false;
      diagnostics: Diagnostic[];
      ms: number;
    }
  | {
      id: number;
      ok: false;
      message: string;
      ms: number;
    };

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<CompileWorkerRequest>) => {
  const { id, source } = event.data;
  const start = performance.now();
  try {
    const result = compileTargets(source, { runtime: true });
    const ms = performance.now() - start;
    if (isErr(result)) {
      const response: CompileWorkerResponse = {
        id,
        ok: false,
        diagnostics: result.error,
        ms,
      };
      ctx.postMessage(response);
      return;
    }
    const response: CompileWorkerResponse = {
      id,
      ok: true,
      js: result.value.js,
      ts: result.value.ts,
      dts: result.value.dts,
      ms,
    };
    ctx.postMessage(response);
  } catch (e: unknown) {
    const response: CompileWorkerResponse = {
      id,
      ok: false,
      message: e instanceof Error ? e.message : String(e),
      ms: performance.now() - start,
    };
    ctx.postMessage(response);
  }
};
