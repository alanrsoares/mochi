// Zero unused bindings in the compiler-owned .mochi sources (ADR 0070 / 0094).
//
// The LSP surfaces these in an editor; this is what stops a fourth one landing.
// Lex + parse + symbol index only — no inference — so the whole sweep is a few
// tens of milliseconds and rides `bun run check`.
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
  expect(held).toContain("bootstrap/infer.mochi");
  expect(held).toContain("bootstrap/plugins/jsx.mochi");
});

test("no unused bindings in the compiler-owned .mochi sources", async () => {
  const found: string[] = [];
  for (const path of held) {
    const src = await Bun.file(`${root}/${path}`).text();
    for (const d of unusedBindingDiagnostics(src, path)) {
      found.push(`${path}:${d.range.start.line + 1} ${d.message}`);
    }
  }
  expect(found).toEqual([]);
});
