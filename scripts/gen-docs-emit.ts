import { join } from "node:path";
import { compileTargets } from "@mochi/compiler";
import { isErr } from "@onrails/result";
import { $ } from "bun";
import { repoPath, syncGeneratedFile } from "./lib";

/** Matches the panel's rendered width at text-xs in a half-grid column. */
const LINE_WIDTH = 72;
const examples = repoPath("apps/docs/src/examples");
const source = join(examples, "emit-shape.mochi");

const format = async (code: string, ext: "js" | "ts"): Promise<string> =>
  (
    await $`echo ${code} | bunx biome format --stdin-file-path=emit.${ext} --line-width=${LINE_WIDTH}`.text()
  ).trim();

// Ask the compiler to omit runtime definitions rather than deleting declaration
// lines: helpers can span many lines, and JS and TS use different helper sets.
const targets = compileTargets(await Bun.file(source).text(), { runtime: false });
if (isErr(targets)) {
  console.error(targets.error);
  process.exit(1);
}

const outputs = {
  "emit-shape.js.txt": await format(
    `// Runtime helper definitions omitted.\n${targets.value.js}`,
    "js",
  ),
  "emit-shape.ts.txt": await format(targets.value.ts, "ts"),
  "emit-shape.d.ts.txt": await format(targets.value.dts, "ts"),
};

for (const [name, content] of Object.entries(outputs)) {
  syncGeneratedFile(join(examples, name), `${content}\n`, {
    regenCommand: "bun run --cwd apps/docs gen:emit",
  });
}
