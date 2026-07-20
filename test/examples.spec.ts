// The checked-in example files must always compile, and the pipelines example
// must produce its documented results — a guard against language regressions.

import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { buildModules } from "../src/module";
import { preludeJs } from "../src/prelude";

const read = (p: string): string => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const path = (p: string): string => fileURLToPath(new URL(`../${p}`, import.meta.url));

test("example.al compiles", () => {
  expect(isErr(compile(read("example.al")))).toBe(false);
});

test("examples/pipelines.al compiles and produces its documented values", () => {
  const js = unwrapOk(compile(read("examples/pipelines.al"))).replace(/^import .*$/m, "");
  const out = new Function("match", `${preludeJs}\n${js}\nreturn { composed, piped, happy, sad };`)(
    match,
  ) as Record<string, number>;
  expect(out).toEqual({ composed: 22, piped: 81, happy: 20, sad: -1 });
});

test("examples/modules builds the whole graph and wires imports", async () => {
  const outs = unwrapOk(
    await buildModules(path("examples/modules/main.al"), (p) =>
      Promise.resolve(readFileSync(p, "utf8")),
    ),
  );
  const main = outs.find((o) => o.path.endsWith("main.al"))!.js;
  const geometry = outs.find((o) => o.path.endsWith("geometry.al"))!.js;
  expect(main).toContain('import { area, hypot, Circle, Rect } from "./geometry.js";');
  expect(geometry).toContain("export const area");
});
