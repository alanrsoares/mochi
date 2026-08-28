// The SELF-HOSTED half of the ADR 0090 north star: how many `tsc --strict`
// errors the `bootstrap/` graph emits when the emitter is `bootstrap/`'s own
// `buildModulesTs` rather than the TypeScript oracle's.
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

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { buildModules } from "@mochi/compiler/module";
import { isErr } from "@onrails/result";

const REPO = resolve(import.meta.dir, "..");
const ENTRY = join(REPO, "bootstrap", "cli.mochi");
const BOOTSTRAP = join(REPO, "bootstrap");
const RUNTIME = join(REPO, "packages", "compiler", "src", "prelude", "runtime");

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
  include: ["**/*.ts"],
};

export type TscReport = {
  total: number;
  byCode: Record<string, number>;
  byFile: Record<string, number>;
  errors: string[]; // raw `path.ts(line,col): error TSxxxx: …` lines
};

// The emitted-JS view of `bootstrap/module.mochi`: `buildModulesTs` is SYNC there
// (the host IO returns `Result` directly) and takes two positional args, unlike
// the oracle's async `(entry, read, opts)`.
type MochiResult<T> = { _tag: "Ok"; value: T } | { _tag: "Err"; error: unknown };
type ModuleOutput = { path: string; js: string };
type BootstrapModule = {
  buildModulesTs: (entry: string, runtimeImport: string) => MochiResult<ModuleOutput[]>;
};

/**
 * Build a runnable JS view of `bootstrap/` into `dir` and import its `module.js`.
 * Emitted fresh rather than importing the sibling `bootstrap/*.js`: those are
 * gitignored build artifacts, so a stale one silently measures an older graph.
 */
const loadBootstrapModule = async (dir: string): Promise<BootstrapModule> => {
  const read = (p: string): Promise<string> => Bun.file(p).text();
  const built = await buildModules(ENTRY, read);
  if (isErr(built)) throw new Error(`bootstrap JS build failed: ${JSON.stringify(built.error)}`);
  for (const { path, js } of built.value) {
    const dest = join(dir, relative(BOOTSTRAP, path).replace(/\.mochi$/, ".js"));
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, js);
  }
  // The host seam and prelude shim are hand-written / generated JS the emitted
  // modules `import` by relative path — copy them in beside the graph.
  for (const shim of ["host.mjs", "prelude.gen.mjs"])
    await writeFile(join(dir, shim), await read(join(BOOTSTRAP, shim)));
  return (await import(join(dir, "module.js"))) as BootstrapModule;
};

// Emit the graph with bootstrap's own driver, run tsc over it, parse diagnostics.
export const bootstrapSelfTsc = async (keep = false): Promise<TscReport> => {
  const jsDir = await mkdtemp(join(tmpdir(), "mochi-self-js-"));
  const mod = await loadBootstrapModule(jsDir);
  const built = mod.buildModulesTs(ENTRY, RUNTIME);
  if (built._tag === "Err")
    throw new Error(`bootstrap self-emit failed: ${JSON.stringify(built.error)}`);

  const dir = await mkdtemp(join(tmpdir(), "mochi-self-bts-"));
  try {
    for (const { path, js } of built.value) {
      // Same layout rule as the oracle script: keep bootstrap-relative paths so
      // nested modules (plugins/jsx) resolve, and only `.mochi` gets rewritten —
      // the extern sidecars already carry `.d.ts` / `.d.mts`.
      const rel = relative(BOOTSTRAP, path);
      const outRel = path.endsWith(".mochi") ? rel.replace(/\.mochi$/, ".ts") : rel;
      const dest = join(dir, outRel);
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, js);
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
      if (file) {
        const base = file.replace(/^.*\//, "");
        byFile[base] = (byFile[base] ?? 0) + 1;
      }
    }
    if (keep) console.error(`scratch dir: ${dir}`);
    return { total: errors.length, byCode, byFile, errors };
  } finally {
    if (!keep) await rm(dir, { recursive: true, force: true });
    await rm(jsDir, { recursive: true, force: true });
  }
};

if (import.meta.main) {
  const args = new Set(Bun.argv.slice(2));
  const report = await bootstrapSelfTsc(args.has("--keep"));

  if (args.has("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else if (args.has("--list")) {
    for (const line of report.errors) console.log(line);
  } else {
    const sorted = (rec: Record<string, number>) => Object.entries(rec).sort((a, b) => b[1] - a[1]);
    console.log("by code:");
    for (const [k, n] of sorted(report.byCode)) console.log(`  ${String(n).padStart(3)}  ${k}`);
    console.log("by file:");
    for (const [k, n] of sorted(report.byFile)) console.log(`  ${String(n).padStart(3)}  ${k}`);
    console.log(`total: ${report.total} tsc errors (self-hosted emit)`);
  }
}
