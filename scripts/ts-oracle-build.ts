/**
 * Build a module graph with the hand-authored TypeScript compiler.
 *
 * ADR 0090 keeps that compiler as an independent differential oracle: its
 * output must still agree byte-for-byte with the self-hosted graph's. The CLI
 * used to reach it through `--open`, but every CLI command now routes to the
 * self-hosted core, so the oracle needs a door of its own rather than a flag
 * that happens to fall through. Not a user-facing entry point.
 */
import { buildModules } from "@mochi/compiler/module";
import { isErr } from "@onrails/result";

const entry = process.argv[2];
if (!entry) {
  console.error("usage: bun scripts/ts-oracle-build.ts <entry.mochi>");
  process.exit(1);
}

// `open` matches what the oracle has always compiled the bootstrap graph under:
// its `extern` host seams are not resolvable as Mochi bindings.
const result = await buildModules(entry, (p: string) => Bun.file(p).text(), {
  open: true,
  docs: true,
});
if (isErr(result)) {
  console.error(result.error);
  process.exit(1);
}
for (const { path, js } of result.value) {
  await Bun.write(path.replace(/\.mochi$/, ".js"), js);
}
