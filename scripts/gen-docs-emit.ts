#!/usr/bin/env bun
/**
 * Regenerates the codegen showcase panes on the docs landing page.
 *
 * The JS / TS / .d.ts text shown there used to be hand-maintained, which meant
 * it drifted from what the compiler actually emits. This runs the real CLI for
 * each backend, biome-formats the result at the panel's line width, and writes
 * the `.txt` files that `main.tsx` imports with `?raw`.
 *
 * The one edit we make is collapsing the inlined prelude helpers in the JS
 * emit into a comment — they're the same handful of runtime functions every
 * program gets, and they'd otherwise bury the four lines the panel is about.
 * Which names count as prelude is read off the TS emit's `@mochi/runtime`
 * import rather than hardcoded, so it stays in sync.
 */
import { $ } from "bun";
import { join } from "node:path";

/** Matches the panel's rendered width at text-xs in a half-grid column. */
const LINE_WIDTH = 72;

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/cli/src/cli.ts");
const examples = join(repoRoot, "apps/docs/src/examples");
const source = join(examples, "emit-shape.mochi");

const compile = async (target: "js" | "ts" | "dts"): Promise<string> => {
  const args = target === "js" ? [source] : [target, source];
  return (await $`bun ${cli} ${args}`.text()).trim();
};

const format = async (code: string, ext: "js" | "ts"): Promise<string> =>
  (
    await $`echo ${code} | bunx biome format --stdin-file-path=emit.${ext} --line-width=${LINE_WIDTH}`.text()
  ).trim();

/** Names the TS backend imports from the runtime — i.e. the prelude helpers. */
const preludeNames = (ts: string): readonly string[] => {
  const match = ts.match(/import\s*\{([^}]*)\}\s*from\s*"@mochi\/runtime"/);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
};

const collapsePrelude = (js: string, names: readonly string[]): string => {
  if (names.length === 0) return js;
  const declares = new Set(names);
  const kept = js
    .split("\n")
    .filter((line) => {
      const decl = line.match(/^const\s+([A-Za-z_$][\w$]*)\s*=/);
      return !(decl && declares.has(decl[1]));
    })
    .join("\n");
  return kept.replace(
    /^(import .*\n)+/,
    (imports) => `${imports}// …prelude helpers (${names.join(", ")})…\n`,
  );
};

const [js, ts, dts] = await Promise.all([
  compile("js"),
  compile("ts"),
  compile("dts"),
]);

const outputs = {
  "emit-shape.js.txt": await format(collapsePrelude(js, preludeNames(ts)), "js"),
  "emit-shape.ts.txt": await format(ts, "ts"),
  "emit-shape.d.ts.txt": await format(dts, "ts"),
};

for (const [name, content] of Object.entries(outputs)) {
  await Bun.write(join(examples, name), `${content}\n`);
  console.log(`wrote ${name} (${content.split("\n").length} lines)`);
}
