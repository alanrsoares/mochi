// The checked-in example files must always compile, and the pipelines example
// must produce its documented results — a guard against language regressions.
import { readFileSync } from "node:fs";
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { preludeJs } from "../src/prelude";

const read = (p: string): string => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("example.al compiles", () => {
  expect(isErr(compile(read("example.al")))).toBe(false);
});

test("examples/pipelines.al compiles and produces its documented values", () => {
  const js = unwrapOk(compile(read("examples/pipelines.al"))).replace(/^import .*$/m, "");
  const out = new Function(
    "match",
    `${preludeJs}\n${js}\nreturn { composed, piped, happy, sad };`,
  )(match) as Record<string, number>;
  expect(out).toEqual({ composed: 22, piped: 81, happy: 20, sad: -1 });
});
