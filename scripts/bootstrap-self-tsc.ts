// The SELF-HOSTED half of the ADR 0090 north star: how many `tsc --strict`
// errors the `bootstrap/` graph emits when the emitter is `bootstrap/`'s own
// `buildModulesTs` from the executable bootstrap seed rather than the
// TypeScript oracle's.
//
// `scripts/bootstrap-tsc.ts` measures the same graph through
// `@mochi/compiler/module` and holds at 0. This script measures the emitted
// stage-1 candidate: Mochi compiling Mochi to typed TS. The gap between the two
// numbers is exactly the remaining self-hosting work on the TS backend.
//
//   bun scripts/bootstrap-self-tsc.ts            # human summary (by code, by file, total)
//   bun scripts/bootstrap-self-tsc.ts --json     # machine-readable report
//   bun scripts/bootstrap-self-tsc.ts --list     # every raw `error TS…` line
//   bun scripts/bootstrap-self-tsc.ts --keep     # leave the scratch dir for inspection

import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { buildModulesTsBootstrap } from "@mochi/compiler/bootstrap/module";
import {
  BOOTSTRAP_CLI,
  printTscReport,
  RUNTIME_SRC,
  repoPath,
  runTsc,
  type TscReport,
  writeBootstrapTsFiles,
} from "./lib";

export type { TscReport };

// Emit the graph with bootstrap's own driver, run tsc over it, parse diagnostics.
export const bootstrapSelfTsc = async (keep = false): Promise<TscReport> => {
  const built = buildModulesTsBootstrap(BOOTSTRAP_CLI, RUNTIME_SRC);
  if (built._tag === "Err")
    throw new Error(`bootstrap self-emit failed: ${JSON.stringify(built.error)}`);

  // Keep generated TS inside the repository so its bare imports resolve through
  // this workspace's node_modules. OS temp directories sit outside that tree.
  const cache = repoPath(".cache");
  await mkdir(cache, { recursive: true });
  const dir = await mkdtemp(join(cache, "mochi-self-bts-"));
  try {
    await writeBootstrapTsFiles(dir, built.value);
    const report = await runTsc(dir);
    if (keep) console.error(`scratch dir: ${dir}`);
    return report;
  } finally {
    if (!keep) await rm(dir, { recursive: true, force: true });
  }
};

if (import.meta.main) {
  const args = new Set(Bun.argv.slice(2));
  const report = await bootstrapSelfTsc(args.has("--keep"));
  printTscReport(report, args, "(self-hosted emit)");
  process.exitCode = report.total === 0 ? 0 : 1;
}
