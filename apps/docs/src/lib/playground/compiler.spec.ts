import { describe, expect, test } from "bun:test";
import { compile, compileTargets } from "@mochi/compiler";
import { preactDtsTypeNames } from "@mochi/plugin-preact";
import { readRepo } from "@mochi/test-support";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import { compileSyncTask } from "./compiler";

const read = (p: string): string => readRepo(import.meta.url, p);

describe("playground compile Task (ADR 0006)", () => {
  test("playground uses the complete single-pass emit with its runtime path", async () => {
    const source = "let values = Array.map(x => x + 1, [1, 2])";
    const expected = compileTargets(source, {
      runtimeImport: "@mochi/compiler/runtime",
      dtsTypeNames: preactDtsTypeNames,
    });
    const result = await compileSyncTask(source)();
    expect(expected._tag).toBe("Ok");
    expect(result._tag).toBe("Ok");
    if (expected._tag !== "Ok" || result._tag !== "Ok") return;
    expect(result.value).toMatchObject(expected.value);
    expect(result.value.ts).toContain('from "@mochi/compiler/runtime"');
  });
  test("playground declarations preserve checked props and Preact results", async () => {
    const source = read("apps/docs/src/examples/presets/jsx.mochi");
    const result = await compileSyncTask(source)();
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(result.value.dts).toContain('(props: Props) => import("preact").VNode');
    expect(result.value.dts).toContain('const app: import("preact").VNode;');
    expect(result.value.dts).not.toContain("any");
  });
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

  test("compile.mochi façade maps emit through Task.map", async () => {
    const src = read("apps/docs/src/lib/playground/compile.mochi");
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
