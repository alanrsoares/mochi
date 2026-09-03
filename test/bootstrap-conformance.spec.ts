import { expect, test } from "bun:test";
import { runBootstrapConformance } from "../scripts/bootstrap-conformance.ts";

test("the shipped bootstrap compiler conforms to its reviewed corpus", () => {
  expect(runBootstrapConformance()).toEqual([]);
});
