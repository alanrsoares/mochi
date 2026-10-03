import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { seedPath } from "./loader.ts";

test("seed path resolves the frozen bundles", () => {
  expect(existsSync(seedPath("module.bundle.cjs"))).toBe(true);
  expect(existsSync(seedPath("module.bundle.cjs"))).toBe(true);
});
