import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  freezeBootstrapConformance,
  pendingBootstrapConformance,
  runBootstrapConformance,
} from "../scripts/bootstrap-conformance.ts";

test("the shipped bootstrap compiler conforms to its reviewed corpus", () => {
  expect(runBootstrapConformance()).toEqual([]);
});

test("no case is left pending", () => {
  // `coverage.pending` holds behaviour the seed cannot run yet; the runner
  // fails a pending case that conforms, so promotion is never forgotten.
  expect(pendingBootstrapConformance()).toEqual([]);
});

test("candidate freeze writes a separate review tree", () => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-conformance-candidate-"));
  try {
    const paths = freezeBootstrapConformance(dir);
    expect(paths).toHaveLength(30);
    expect(readFileSync(join(dir, "single-js.expect.js"), "utf8")).toContain("const answer");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
