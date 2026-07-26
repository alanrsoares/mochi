import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import { compile, compileTargets } from "../src/compile";

const read = (p: string): string => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

/**
 * Local Task-shaped host matching `compileSyncTask` — avoids importing
 * apps/docs (path alias `@mochi/compiler`) into the root tsc graph.
 */
const compileSyncTask = (source: string) => () => {
  const start = performance.now();
  try {
    const result = compileTargets(source, { runtime: true });
    const ms = performance.now() - start;
    if (isErr(result)) {
      return Promise.resolve({
        _tag: "Err" as const,
        error: { diagnostics: result.error, ms },
      });
    }
    return Promise.resolve({
      _tag: "Ok" as const,
      value: { ...result.value, ms },
    });
  } catch (e: unknown) {
    return Promise.resolve({
      _tag: "Err" as const,
      error: {
        message: e instanceof Error ? e.message : String(e),
        ms: performance.now() - start,
      },
    });
  }
};

describe("playground compile Task (ADR 0006)", () => {
  test("Task-shaped compile settles Ok with js/ts/dts on clean source", async () => {
    const result = await compileSyncTask("let x = 1\nlet app = x\n")();
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(result.value.js).toContain("const x = 1");
    expect(result.value.ts.length).toBeGreaterThan(0);
    expect(result.value.dts.length).toBeGreaterThan(0);
    expect(result.value.ms).toBeGreaterThanOrEqual(0);
  });

  test("Task-shaped compile settles Err with diagnostics on bad source", async () => {
    const result = await compileSyncTask("let x = \n")();
    expect(result._tag).toBe("Err");
    if (result._tag !== "Err") return;
    expect("diagnostics" in result.error ? result.error.diagnostics?.length : 0).toBeGreaterThan(0);
    expect(result.error.ms).toBeGreaterThanOrEqual(0);
  });

  test("playground-compile.mochi façade maps emit through Task.map", async () => {
    const src = read("apps/docs/src/lib/playground-compile.mochi");
    expect(isErr(compile(src))).toBe(false);
    const js = unwrapOk(compile(src))
      .replace(/^import .*$/gm, "")
      .replace(/^export /gm, "");
    const api = new Function("match", "compileSync", `${js}\nreturn { runCompile, jsOf };`)(
      match,
      compileSyncTask,
    ) as {
      runCompile: (s: string) => Promise<unknown>;
      jsOf: (s: string) => () => Promise<{ _tag: string; value?: string }>;
    };
    const ran = (await api.runCompile("let n = 2\n")) as { _tag: string };
    expect(ran._tag).toBe("Ok");
    const jsOnly = await api.jsOf("let n = 2\n")();
    expect(jsOnly._tag).toBe("Ok");
    expect(jsOnly.value).toContain("const n = 2");
  });
});
