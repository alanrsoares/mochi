// C9 slice d (ADR 0045 decision 3): `format` runs on `parseRecovering`, so a
// file with parse errors still formats — every unparsable byte range (an
// `SError` span) is passed through verbatim instead of the whole file
// producing nothing. Three guards, per the ticket:
//   1. idempotency on broken sources — format(format(src)) === format(src);
//   2. a regression corpus of real, already-formatted valid files proving
//      the switch from `parse` to `parseRecovering` changes nothing for
//      sources that already parse cleanly;
//   3. the byte-range round-trip property lives in format-recovery.pbt.spec.ts.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { unwrapOk } from "@onrails/result";
import { format } from "../src/format";

const fmt = (src: string): string => unwrapOk(format(src));

// --- 1. Idempotency on broken sources ---------------------------------

test("format is a fixed point on a file with one parse error", () => {
  const src = "let a = 1\nlet b = )(\nlet c = 2\n";
  const once = fmt(src);
  expect(fmt(once)).toBe(once);
});

test("format is a fixed point on a file with multiple parse errors", () => {
  const src = "let a = 1\nlet b = )(\nlet c = 2\ntype T = )(\nlet d = 3\n";
  const once = fmt(src);
  expect(fmt(once)).toBe(once);
});

test("format is a fixed point when the error region is the last statement", () => {
  const src = "let a = 1\nlet b = )(\n";
  const once = fmt(src);
  expect(fmt(once)).toBe(once);
});

test("format is a fixed point when the error region is the first statement", () => {
  const src = "let a = )(\nlet b = 1\n";
  const once = fmt(src);
  expect(fmt(once)).toBe(once);
});

test("format is a fixed point with a comment adjacent to an error region", () => {
  const src = "// leading comment\nlet a = )(\nlet b = 1 // trailing\n";
  const once = fmt(src);
  expect(fmt(once)).toBe(once);
});

// --- 2. Regression: valid files format unchanged -----------------------

// These are real, already-formatted, self-hosted compiler sources (checked
// in, and independently held to `format(src) === src` project-wide by
// `scripts/fmt.ts --check` in `bun run check`). Reformatting them via the
// now-`parseRecovering`-backed pipeline must still be a no-op: the switch
// away from the hard-fail `parse` must not perturb output for files that
// already parse cleanly (no error-node spans are ever produced for them).
const root = join(import.meta.dir, "..");
const cleanFiles = ["bootstrap/ast.mochi", "bootstrap/scc.mochi"];

for (const rel of cleanFiles) {
  test(`clean-file output is byte-identical for ${rel}`, () => {
    const src = readFileSync(join(root, rel), "utf8");
    expect(fmt(src)).toBe(src);
  });
}
