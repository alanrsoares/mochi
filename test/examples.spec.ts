// The checked-in example files must always compile, and the pipelines example
// must produce its documented results — a guard against language regressions.

import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { compileTargets } from "../src/compile-targets";
import { buildModules } from "../src/module";

const read = (p: string): string => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const path = (p: string): string => fileURLToPath(new URL(`../${p}`, import.meta.url));

test("example.mochi compiles", () => {
  expect(isErr(compile(read("examples/example.mochi")))).toBe(false);
});

test("examples/life/main.mochi compiles", () => {
  expect(isErr(compile(read("examples/life/main.mochi")))).toBe(false);
});

test("examples/pipelines.mochi compiles and produces its documented values", () => {
  // Output is standalone (prelude inlined) — only the @onrails/pattern import is
  // stripped, and `match` injected in its place.
  const js = unwrapOk(compile(read("examples/pipelines.mochi"))).replace(/^import .*$/m, "");
  const out = new Function("match", `${js}\nreturn { composed, piped, happy, sad };`)(
    match,
  ) as Record<string, number>;
  expect(out).toEqual({ composed: 22, piped: 81, happy: 20, sad: -1 });
});

/**
 * Compile examples/async and hand its exports back. Prelude `Task.*` is inlined,
 * but the two domain effects are `extern`s — stripping the imports leaves them
 * free, so the real host module is injected in their place.
 */
const runAsyncExample = async (): Promise<Record<string, Promise<unknown>>> => {
  const js = unwrapOk(compile(read("examples/async/main.mochi")))
    .replace(/^import .*$/gm, "")
    .replace(/^export /gm, "");
  const host = await import(path("examples/async/runtime.mjs"));
  return new Function(
    "match",
    "fetchUser",
    "fetchPlan",
    `${js}\nreturn { result, found, recovered, offline };`,
  )(match, host.fetchUser, host.fetchPlan) as Record<string, Promise<unknown>>;
};

test("examples/async composes a typed Task pipeline that runs to its value", async () => {
  // Pipeline: of(20) -> +1 -> delay -> *2.
  expect(await (await runAsyncExample()).result).toEqual({ _tag: "Ok", value: 42 });
});

test("examples/async carries failures on Task's error channel (ADR 0006)", async () => {
  const out = await runAsyncExample();
  expect(await out.found).toEqual({ _tag: "Ok", value: "Ada is on the pro plan" });
  // A 404 is recovered on the error track; an unreachable host stays an Err.
  expect(await out.recovered).toEqual({
    _tag: "Ok",
    value: "user 7 has no plan — showing the demo one",
  });
  expect(await out.offline).toEqual({
    _tag: "Err",
    error: { _tag: "Offline", _0: "network down" },
  });
});

test("examples/modules builds the whole graph and wires imports", async () => {
  const outs = unwrapOk(
    await buildModules(path("examples/modules/main.mochi"), (p) =>
      Promise.resolve(readFileSync(p, "utf8")),
    ),
  );
  const main = outs.find((o) => o.path.endsWith("main.mochi"))!.js;
  const geometry = outs.find((o) => o.path.endsWith("geometry.mochi"))!.js;
  expect(main).toContain('import { area, hypot, Circle, Rect } from "./geometry.js";');
  expect(geometry).toContain("export const area");
});

test("docs tour snippets compile (source of HighlightCode panels)", () => {
  for (const name of ["variants", "records", "jsx"] as const) {
    const src = read(`apps/docs/src/examples/${name}.mochi`);
    const r = compile(src);
    expect(isErr(r), `${name}.mochi: ${isErr(r) ? JSON.stringify(r.error) : ""}`).toBe(false);
  }
});

test("docs playground presets emit every displayed target", () => {
  for (const name of ["jsx", "result", "row-poly", "fib"] as const) {
    const src = read(`apps/docs/src/examples/presets/${name}.mochi`);
    const result = compileTargets(src, { runtime: true });
    expect(
      isErr(result),
      `presets/${name}.mochi: ${isErr(result) ? JSON.stringify(result.error) : ""}`,
    ).toBe(false);
    if (isErr(result)) continue;
    expect(result.value.js.trim().length, `${name} JavaScript is empty`).toBeGreaterThan(0);
    expect(result.value.ts.trim().length, `${name} TypeScript is empty`).toBeGreaterThan(0);
    expect(result.value.dts.trim().length, `${name} .d.ts is empty`).toBeGreaterThan(0);
  }
});
