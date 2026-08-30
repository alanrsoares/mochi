// ADR 0090's stage-1 guard: the executable bootstrap seed must emit a complete
// TypeScript graph that `tsc --strict` accepts. The default test suite excludes
// this north-star check; `test:full` and `check:full` run it.
import { expect, test } from "bun:test";
import { bootstrapSelfTsc } from "../scripts/bootstrap-self-tsc";

test("the bootstrap seed emits strict-clean TypeScript", async () => {
  const { total, byCode } = await bootstrapSelfTsc();
  expect({ total, byCode }).toEqual({ total: 0, byCode: {} });
  // `check:full` intentionally runs coverage and workspace builds alongside this
  // compiler-sized `tsc` process; lower-core CI runners may need longer than the
  // local baseline despite a healthy result.
}, 90_000);
