import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  freezeBootstrapConformance,
  runBootstrapConformance,
} from "../scripts/bootstrap-conformance.ts";

test("the shipped bootstrap compiler conforms to its reviewed corpus", () => {
  expect(runBootstrapConformance()).toEqual([]);
});

test("candidate freeze writes a separate review tree", () => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-conformance-candidate-"));
  try {
    const paths = freezeBootstrapConformance(dir);
    expect(paths).toHaveLength(11);
    expect(readFileSync(join(dir, "single-js.expect.js"), "utf8")).toContain("const answer");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
