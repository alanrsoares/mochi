/**
 * Compile orchestration: owns the worker-backed compiler's lifecycle, the
 * stale-result sequence guard, and the debounced auto-run. One interface —
 * `{ …emit, diagnostics, compiling, evaluate }` — so races and fallbacks are
 * testable without the editor UI.
 */
import type { Diagnostic } from "@mochi/compiler";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { createPlaygroundCompiler } from "../lib/playground/compiler";

const COMPILE_DEBOUNCE_MS = 280;

export type PlaygroundCompile = {
  outputJs: string;
  outputTs: string;
  outputDts: string;
  diagnostics: Diagnostic[];
  compileMs: number | null;
  compiling: boolean;
  evaluate: (source: string) => void;
};

export function usePlaygroundCompile(
  code: string,
  autoRun: boolean,
  bootstrapped: boolean,
): PlaygroundCompile {
  const [outputJs, setOutputJs] = useState("");
  const [outputTs, setOutputTs] = useState("");
  const [outputDts, setOutputDts] = useState("");
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [compileMs, setCompileMs] = useState<number | null>(null);
  const [compiling, setCompiling] = useState(false);
  const compileSeq = useRef(0);
  const compilerRef = useRef(createPlaygroundCompiler());

  useEffect(() => {
    const compiler = compilerRef.current;
    return () => compiler.dispose();
  }, []);

  const evaluate = useCallback((source: string) => {
    compileSeq.current += 1;
    const seq = compileSeq.current;
    setCompiling(true);
    void compilerRef.current
      .compile(source)()
      .then((result) => {
        if (seq !== compileSeq.current) return;
        setCompiling(false);
        if (result._tag === "Ok") {
          setDiagnostics([]);
          setOutputJs(result.value.js);
          setOutputTs(result.value.ts);
          setOutputDts(result.value.dts);
          setCompileMs(result.value.ms);
          return;
        }
        setOutputJs("");
        setOutputTs("");
        setOutputDts("");
        setCompileMs(result.error.ms);
        if (result.error.diagnostics) {
          setDiagnostics(result.error.diagnostics);
          return;
        }
        setDiagnostics([
          {
            kind: "check",
            message: result.error.message ?? "Compilation failed",
          },
        ]);
      });
  }, []);

  // Debounced autorun compile.
  useEffect(() => {
    if (!bootstrapped || !autoRun) return;
    const id = window.setTimeout(() => evaluate(code), COMPILE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [autoRun, bootstrapped, code, evaluate]);

  return { outputJs, outputTs, outputDts, diagnostics, compileMs, compiling, evaluate };
}

export type PlaygroundStatus = { text: string; state: "ok" | "err" };

export const playgroundStatus = (
  compiling: boolean,
  compileMs: number | null,
  ok: boolean,
): PlaygroundStatus => {
  const text = compiling
    ? "compiling…"
    : compileMs === null
      ? ok
        ? "ready"
        : "error"
      : ok
        ? `ok · ${compileMs.toFixed(1)}ms`
        : `error · ${compileMs.toFixed(1)}ms`;
  return { text, state: compiling || ok ? "ok" : "err" };
};
