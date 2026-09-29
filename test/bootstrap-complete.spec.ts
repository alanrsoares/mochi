// ADR 0120: completion moved onto the self-hosted core. On every import-free
// .mochi file in the repo, the bootstrap answer must equal the TypeScript
// core's at a sample of value, member and JSX-attribute positions. The TS
// answer now lives only in `test/oracles/complete-ts.ts` (#103), until #104
// retires the oracle. The sample keeps this in the default gate; a full sweep
// of every position agreed when the path landed.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { completeAt } from "@mochi/dx/complete";
import { repoRoot } from "@mochi/test-support";
import { completeAtTs } from "./oracles/complete-ts";

const root = repoRoot(import.meta.url);

const corpus = [...new Bun.Glob("**/*.mochi").scanSync({ cwd: root })]
  .filter((p) => !p.includes("node_modules") && !p.startsWith("test/conformance/"))
  .sort();

/** Every `stride`-th of `xs`, at most `max` of them. */
const sample = <T>(xs: readonly T[], stride: number, max: number): T[] =>
  xs.filter((_, i) => i % stride === 0).slice(0, max);

/** Mid-identifier, just after a `.` (plus one prefix char), and inside open JSX tags. */
const probes = (src: string): number[] => [
  ...sample([...src.matchAll(/[A-Za-z_]\w*/g)], 97, 3).map(
    (m) => m.index + Math.ceil(m[0].length / 2),
  ),
  ...sample([...src.matchAll(/[A-Za-z_]\w*\.(\w*)/g)], 11, 2).map(
    (m) => m.index + m[0].length - m[1]!.length + Math.min(1, m[1]!.length),
  ),
  ...sample([...src.matchAll(/<([A-Za-z]\w*) /g)], 1, 2).map((m) => m.index + m[0].length),
];

for (const file of corpus) {
  const src = readFileSync(join(root, file), "utf8");
  if (/^import /m.test(src)) continue;
  test(`completion agrees with the TS core on ${file}`, () => {
    const differing = probes(src).flatMap((offset) => {
      const got = completeAt(src, offset);
      const want = completeAtTs(src, offset, {});
      return JSON.stringify(got) === JSON.stringify(want) ? [] : [{ offset, got, want }];
    });
    expect(differing.slice(0, 2)).toEqual([]);
  });
}
