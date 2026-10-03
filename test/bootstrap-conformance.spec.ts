import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  bootstrapConformanceCaseIds,
  freezeConformance,
  manifestConformanceErrors,
  pendingConformance,
  runConformanceCase,
} from "../scripts/bootstrap-conformance.ts";

test("the conformance manifest is well formed", () => {
  expect(manifestConformanceErrors()).toEqual([]);
});

// One test per case: each gets its own timeout, and a failure names its case.
test.each(bootstrapConformanceCaseIds())("the shipped bootstrap compiler conforms: %s", (id) => {
  expect(runConformanceCase(id)).toBeNull();
});

test("no case is left pending", () => {
  // `coverage.pending` holds behaviour the seed cannot run yet; the runner
  // fails a pending case that conforms, so promotion is never forgotten.
  expect(pendingConformance()).toEqual([]);
});

test("candidate freeze writes a separate review tree", () => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-conformance-candidate-"));
  try {
    const paths = freezeConformance(dir);
    expect(paths).toHaveLength(bootstrapConformanceCaseIds().length);
    expect(readFileSync(join(dir, "single-js.expect.js"), "utf8")).toContain("const answer");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
