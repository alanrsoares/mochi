// Measure the TS-emit track's north-star number: how many `tsc --strict` errors
// the self-hosted `bootstrap/` graph emits (see docs/compiler.md). This
// replaces the ad-hoc `/tmp/bts` recipe the checkpoint used to carry — emit the
// graph via `buildModulesTs` (pointing the runtime import straight at the repo's
// typed `src/runtime`, so no `sed` rewrite), drop the outputs in a scratch dir
// with a strict tsconfig, run the repo's `tsc`, and tally the diagnostics.
//
//   bun scripts/bootstrap-tsc.ts            # human summary (by code, by file, total)
//   bun scripts/bootstrap-tsc.ts --json     # machine-readable {total, byCode, byFile, errors}
//   bun scripts/bootstrap-tsc.ts --list      # every raw `error TS…` line
//   bun scripts/bootstrap-tsc.ts --keep      # leave the scratch dir for inspection

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildModulesTs } from "@mochi/compiler/module";
import { isErr } from "@onrails/result";
import {
  BOOTSTRAP_CLI,
  printTscReport,
  RUNTIME_SRC,
  runTsc,
  type TscReport,
  writeBootstrapTsFiles,
} from "./lib";

export type { TscReport };

// Emit the graph, run tsc over it, and return the parsed diagnostics. `keep`
// leaves the scratch dir on disk (its path is logged) for hands-on inspection.
export const bootstrapTsc = async (keep = false): Promise<TscReport> => {
  const read = (p: string): Promise<string> => Bun.file(p).text();
  const built = await buildModulesTs(BOOTSTRAP_CLI, read, { runtimeImport: RUNTIME_SRC });
  if (isErr(built)) throw new Error(`bootstrap emit failed: ${JSON.stringify(built.error)}`);

  const dir = await mkdtemp(join(tmpdir(), "mochi-bts-"));
  try {
    await writeBootstrapTsFiles(dir, built.value);
    const report = await runTsc(dir);
    if (keep) console.error(`scratch dir: ${dir}`);
    return report;
  } finally {
    if (!keep) await rm(dir, { recursive: true, force: true });
  }
};

// CLI entry — only when run directly, so the module stays importable from a test.
if (import.meta.main) {
  const args = new Set(Bun.argv.slice(2));
  const report = await bootstrapTsc(args.has("--keep"));
  printTscReport(report, args);
}
