import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { BOOTSTRAP_DIR, REPO_ROOT, TSC_BIN } from "./repo";

export type TscReport = {
  readonly total: number;
  readonly byCode: Record<string, number>;
  readonly byFile: Record<string, number>;
  readonly errors: readonly string[];
};

export type EmittedTsModule = {
  readonly path: string;
  readonly js: string;
};

export const DEFAULT_TSCONFIG = {
  compilerOptions: {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    moduleResolution: "bundler",
    module: "esnext",
    target: "esnext",
    types: [] as string[],
    paths: {
      "@onrails/pattern": [join(REPO_ROOT, "node_modules/@onrails/pattern/dist/index.d.ts")],
      "@onrails/result": [join(REPO_ROOT, "node_modules/@onrails/result/dist/index.d.ts")],
    },
  },
  include: ["**/*.ts"],
};

export const parseTscOutput = (out: string): TscReport => {
  const errors = out.split("\n").filter((l) => /error TS\d+/.test(l));
  const byCode: Record<string, number> = {};
  const byFile: Record<string, number> = {};
  for (const line of errors) {
    const code = line.match(/error (TS\d+)/)?.[1];
    const file = line.match(/^([^(]+)\(/)?.[1];
    if (code) byCode[code] = (byCode[code] ?? 0) + 1;
    if (file) {
      // Count by basename so nested paths (plugins/jsx.ts) stay readable.
      const base = file.replace(/^.*\//, "");
      byFile[base] = (byFile[base] ?? 0) + 1;
    }
  }
  return { total: errors.length, byCode, byFile, errors };
};

export const writeBootstrapTsFiles = async (
  dir: string,
  modules: readonly EmittedTsModule[],
): Promise<void> => {
  for (const { path, js } of modules) {
    const rel = relative(BOOTSTRAP_DIR, path);
    const outRel = path.endsWith(".mochi") ? rel.replace(/\.mochi$/, ".ts") : rel;
    const dest = join(dir, outRel);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, js);
  }
  await writeFile(join(dir, "tsconfig.json"), JSON.stringify(DEFAULT_TSCONFIG, null, 2));
};

export const runTsc = async (dir: string): Promise<TscReport> => {
  const proc = Bun.spawn([TSC_BIN, "-p", "tsconfig.json"], {
    cwd: dir,
    stdout: "pipe",
    stderr: "pipe",
  });
  const out = await new Response(proc.stdout).text();
  await proc.exited;
  return parseTscOutput(out);
};

export const printTscReport = (
  report: TscReport,
  args: ReadonlySet<string>,
  suffix?: string,
): void => {
  if (args.has("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else if (args.has("--list")) {
    for (const line of report.errors) console.log(line);
  } else {
    const sorted = (rec: Record<string, number>) =>
      Object.entries(rec).toSorted((a, b) => b[1] - a[1]);
    console.log("by code:");
    for (const [k, n] of sorted(report.byCode)) console.log(`  ${String(n).padStart(3)}  ${k}`);
    console.log("by file:");
    for (const [k, n] of sorted(report.byFile)) console.log(`  ${String(n).padStart(3)}  ${k}`);
    const extra = suffix ? ` ${suffix}` : "";
    console.log(`total: ${report.total} tsc errors${extra}`);
  }
};
