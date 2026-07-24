// The checked-in example files must always compile, and the pipelines example
// must produce its documented results — a guard against language regressions.

import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
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

test("examples/async composes a typed Task pipeline that runs to its value", async () => {
  const js = unwrapOk(compile(read("examples/async/main.mochi")))
    .replace(/^import .*$/gm, "")
    .replace(/^export /gm, "");
  // Inject the host runtime (mirrors examples/async/task.js) and run the Task.
  const of = (x: number) => () => Promise.resolve(x);
  const mapT = (f: (n: number) => number) => (t: () => Promise<number>) => () => t().then(f);
  const andThen = (f: (n: number) => () => Promise<number>) => (t: () => Promise<number>) => () =>
    t().then((x) => f(x)());
  const delay = (ms: number) => (x: number) => () =>
    new Promise((res) => setTimeout(() => res(x), ms));
  const run = (t: () => Promise<number>): Promise<number> => t();
  const result = new Function("of", "mapT", "andThen", "delay", "run", `${js}\nreturn result;`)(
    of,
    mapT,
    andThen,
    delay,
    run,
  ) as Promise<number>;
  expect(await result).toBe(42); // of(20) -> +1 -> delayed -> doubled
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
