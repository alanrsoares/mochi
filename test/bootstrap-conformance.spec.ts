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

test("pending cases stay reported until they conform", () => {
  // A pending case pins behaviour the seed lacks, so it still fails; the runner
  // turns a pending pass into a failure, forcing promotion to required.
  // `styled-cva-dts` waits on the JSX `bindingType` port (#109).
  const statuses = pendingBootstrapConformance();
  expect(statuses.map((s) => s.id)).toEqual(["styled-cva-dts"]);
  expect(statuses[0]?.failure).toContain("export declare const hot: VNode;");
});

test("candidate freeze writes a separate review tree", () => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-conformance-candidate-"));
  try {
    const paths = freezeBootstrapConformance(dir);
    expect(paths).toHaveLength(22);
    expect(readFileSync(join(dir, "single-js.expect.js"), "utf8")).toContain("const answer");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
