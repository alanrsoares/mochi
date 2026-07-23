// Measure the TS-emit track's north-star number: how many `tsc --strict` errors
// the self-hosted `bootstrap/` graph emits (ADR 0026 / docs/TS_DIALECT.md). This
// replaces the ad-hoc `/tmp/bts` recipe the checkpoint used to carry — emit the
// graph via `buildModulesTs` (pointing the runtime import straight at the repo's
// typed `src/runtime`, so no `sed` rewrite), drop the outputs in a scratch dir
// with a strict tsconfig, run the repo's `tsc`, and tally the diagnostics.
//
//   bun scripts/bootstrap-tsc.ts            # human summary (by code, by file, total)
//   bun scripts/bootstrap-tsc.ts --json     # machine-readable {total, byCode, byFile, errors}
//   bun scripts/bootstrap-tsc.ts --list      # every raw `error TS…` line
//   bun scripts/bootstrap-tsc.ts --keep      # leave the scratch dir for inspection

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { isErr } from "@onrails/result";
import { buildModulesTs } from "../src/module";

const REPO = resolve(import.meta.dir, "..");
const ENTRY = join(REPO, "bootstrap", "cli.mochi");
const RUNTIME = join(REPO, "src", "runtime"); // bundler resolves to src/runtime.ts

const TSCONFIG = {
  compilerOptions: {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    moduleResolution: "bundler",
    module: "esnext",
    target: "esnext",
    types: [] as string[],
    paths: {
      "@onrails/pattern": [join(REPO, "node_modules/@onrails/pattern/dist/index.d.ts")],
      "@onrails/result": [join(REPO, "node_modules/@onrails/result/dist/index.d.ts")],
    },
  },
  include: ["*.ts"],
};

export type TscReport = {
  total: number;
  byCode: Record<string, number>;
  byFile: Record<string, number>;
  errors: string[]; // raw `path.ts(line,col): error TSxxxx: …` lines
};

// Emit the graph, run tsc over it, and return the parsed diagnostics. `keep`
// leaves the scratch dir on disk (its path is logged) for hands-on inspection.
export const bootstrapTsc = async (keep = false): Promise<TscReport> => {
  const read = (p: string): Promise<string> => Bun.file(p).text();
  const built = await buildModulesTs(ENTRY, read, { runtimeImport: RUNTIME });
  if (isErr(built)) throw new Error(`bootstrap emit failed: ${JSON.stringify(built.error)}`);

  const dir = await mkdtemp(join(tmpdir(), "mochi-bts-"));
  try {
    for (const { path, js } of built.value) {
      // Extern `.d.ts` outputs already carry their extension; `.mochi` → `.ts`.
      const name = path.endsWith(".ts") ? basename(path) : basename(path).replace(/\.mochi$/, ".ts");
      await writeFile(join(dir, name), js);
    }
    await writeFile(join(dir, "tsconfig.json"), JSON.stringify(TSCONFIG, null, 2));

    const proc = Bun.spawn([join(REPO, "node_modules/.bin/tsc"), "-p", "tsconfig.json"], {
      cwd: dir,
      stdout: "pipe",
      stderr: "pipe",
    });
    const out = await new Response(proc.stdout).text();
    await proc.exited;

    const errors = out.split("\n").filter((l) => /error TS\d+/.test(l));
    const byCode: Record<string, number> = {};
    const byFile: Record<string, number> = {};
    for (const line of errors) {
      const code = line.match(/error (TS\d+)/)?.[1];
      const file = line.match(/^([^(]+)\(/)?.[1];
      if (code) byCode[code] = (byCode[code] ?? 0) + 1;
      if (file) byFile[file] = (byFile[file] ?? 0) + 1;
    }
    if (keep) console.error(`scratch dir: ${dir}`);
    return { total: errors.length, byCode, byFile, errors };
  } finally {
    if (!keep) await rm(dir, { recursive: true, force: true });
  }
};

// CLI entry — only when run directly, so the module stays importable from a test.
if (import.meta.main) {
  const args = new Set(Bun.argv.slice(2));
  const report = await bootstrapTsc(args.has("--keep"));

  if (args.has("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else if (args.has("--list")) {
    for (const line of report.errors) console.log(line);
  } else {
    const sorted = (rec: Record<string, number>) =>
      Object.entries(rec).sort((a, b) => b[1] - a[1]);
    console.log("by code:");
    for (const [k, n] of sorted(report.byCode)) console.log(`  ${String(n).padStart(3)}  ${k}`);
    console.log("by file:");
    for (const [k, n] of sorted(report.byFile)) console.log(`  ${String(n).padStart(3)}  ${k}`);
    console.log(`total: ${report.total} tsc errors`);
  }
}
