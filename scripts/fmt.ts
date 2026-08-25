// Dogfood mochi's own formatter on every `.mochi` source in the repository.
// Default: rewrite each file in place. `--check`: exit non-zero if any file
// isn't already formatted (the QA-gate mode).
import { readFileSync, writeFileSync } from "node:fs";
import type { LanguagePlugin } from "@mochi/compiler/extensions";
import { format } from "@mochi/dx/format";
import { isErr, unwrapOk } from "@onrails/result";
import { docsVendorPlugins } from "../apps/docs/mochi.plugins";
import { snakeVendorPlugins } from "../examples/snake/mochi.plugins";

const check = process.argv.includes("--check");

// Each tree formats with its own vendor-plugin list (mirrors gen-mochi-dts and
// the LSP's `mochi.plugins.ts` loading), so plugin `format` hooks — styled-cva
// class-string reflow (ADR 0057) — agree between the editor and this gate.
const pluginsFor = (file: string): LanguagePlugin[] | undefined => {
  if (file.startsWith("apps/docs/")) return docsVendorPlugins;
  if (file.startsWith("examples/snake/")) return snakeVendorPlugins;
  return undefined; // builtins only
};

const files = [...new Bun.Glob("**/*.mochi").scanSync({ cwd: "." })]
  .filter((f) => !f.split("/").some((part) => part === "node_modules" || part === "dist"))
  .toSorted();

const drift: string[] = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const r = format(src, { plugins: pluginsFor(f) });
  if (isErr(r)) {
    console.error(`format error in ${f}: ${r.error.map((e) => e.message).join("; ")}`);
    process.exit(1);
  }
  const out = unwrapOk(r);
  if (out === src) continue;
  if (check) drift.push(f);
  else {
    writeFileSync(f, out);
    console.error(`  formatted ${f}`);
  }
}

if (check && drift.length) {
  console.error(
    `unformatted .mochi files (run \`bun run fmt:mochi\`):\n${drift.map((f) => `  ${f}`).join("\n")}`,
  );
  process.exit(1);
}
