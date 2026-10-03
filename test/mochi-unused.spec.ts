// Zero unused bindings in the compiler-owned .mochi sources (ADR 0070 / 0094).
//
// The LSP surfaces these in an editor; this is what stops a fourth one landing.
// Lex + parse + symbol index only, no inference, so it rides `bun run check`.
// One test per file: on the bootstrap parser (#128) the whole sweep is ~40k
// lines, which a single test ran past the 5s timeout on CI's loaded runners.
//
// EXEMPT roots, not exempt files: `examples/` and `apps/docs/` bind values to
// demonstrate syntax and never read them, which is the point of a showcase (91
// top-level + 18 local warnings between them, all accurate). Keeping the
// exemption at root granularity means no suppression comments scatter through
// the sources we do hold to zero.
import { expect, test } from "bun:test";
import { unusedBindingDiagnostics } from "@mochi/dx/diagnostics";
import { repoRoot } from "@mochi/test-support";

const root = repoRoot(import.meta.url);

const HELD = ["bootstrap", "packages", "test"];

/**
 * `fixtures/` is deliberately broken input; `conformance/` names public output
 * bindings intentionally so the black-box corpus can observe them.
 */
const isExempt = (path: string): boolean =>
  path.includes("node_modules") ||
  path.includes("/fixtures/") ||
  path.startsWith("test/conformance/");

const held = HELD.flatMap((dir) =>
  [...new Bun.Glob(`${dir}/**/*.mochi`).scanSync({ cwd: root })].filter((p) => !isExempt(p)),
).sort();

test("the sweep covers the self-hosted compiler", () => {
  expect(held).toContain("packages/compiler/src/infer/infer.mochi");
  expect(held).toContain("packages/compiler/src/extensions/plugins/jsx.mochi");
});

for (const path of held) {
  test(`no unused bindings in ${path}`, async () => {
    const src = await Bun.file(`${root}/${path}`).text();
    const found = unusedBindingDiagnostics(src, path).map(
      (d) => `${path}:${d.range.start.line + 1} ${d.message}`,
    );
    expect(found).toEqual([]);
  });
}
