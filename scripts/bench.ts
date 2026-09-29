// Compiler and formatter benchmarks: the one harness for perf numbers quoted
// in PRs and ADRs, so a before/after pair measures the same work the same way.
//
//   bun run bench                        # every suite, best of 8
//   bun run bench compile --runs 3       # one suite
//   bun run bench --save main            # write .cache/bench/main.json
//   bun run bench --compare main         # print deltas against it
//   bun run bench compile --profile      # rerun under --cpu-prof, rank by inclusive time
//   bun run bench --json out.json        # github-action-benchmark input (CI)
//
// Each case reports the best and median wall time over `--runs` runs in one
// warm process. Best-of-N is the headline: it is the least noisy on a laptop.
// Not in any gate — timings are machine-dependent.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { loadBootstrapGraph } from "@mochi/compiler/bootstrap";
import { compileGraphBootstrap } from "@mochi/compiler/bootstrap/module";
import { format } from "@mochi/dx/format";
import { inclusiveTop } from "./lib/cpu-profile";
import { vendorPluginsFor } from "./lib/plugins";
import { BOOTSTRAP_CLI, REPO_ROOT, repoPath } from "./lib/repo";

type Timings = Record<string, number[]>;
/** Per-case context (sizes) kept out of the case name, which must stay stable across commits. */
const notes: Record<string, string> = {};
type Suite = { readonly describe: string; readonly run: (timings: Timings) => Promise<void> };
type Saved = { readonly rev: string; readonly date: string; readonly best: Record<string, number> };

type Args = {
  readonly suites: readonly string[];
  readonly runs: number;
  readonly save?: string;
  readonly compare?: string;
  readonly json?: string;
  readonly profile: boolean;
};

const VALUE_FLAGS = ["--runs", "--save", "--compare", "--json"] as const;

const parseArgs = (argv: readonly string[]): Args => {
  const value = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i === -1 ? undefined : argv[i + 1];
  };
  const suites = argv.filter(
    (a, i) =>
      !a.startsWith("--") && !(VALUE_FLAGS as readonly string[]).includes(argv[i - 1] ?? ""),
  );
  return {
    suites,
    runs: Number(value("--runs") ?? 8),
    save: value("--save"),
    compare: value("--compare"),
    json: value("--json"),
    profile: argv.includes("--profile"),
  };
};

const opts = parseArgs(process.argv.slice(2));
const runs = opts.runs;

const record = (timings: Timings, key: string, ms: number): void => {
  const xs = timings[key] ?? [];
  xs.push(ms);
  timings[key] = xs;
};

const time = <A>(timings: Timings, key: string, f: () => A): A => {
  const start = performance.now();
  const out = f();
  record(timings, key, performance.now() - start);
  return out;
};

const timeAsync = async <A>(timings: Timings, key: string, f: () => Promise<A>): Promise<A> => {
  const start = performance.now();
  const out = await f();
  record(timings, key, performance.now() - start);
  return out;
};

const FORMAT_FILES = [
  "bootstrap/parser.mochi",
  "bootstrap/infer.mochi",
  "examples/snake/src/app.mochi",
];

const repoMochiFiles = (): string[] =>
  [...new Bun.Glob("**/*.mochi").scanSync({ cwd: REPO_ROOT })]
    .filter((f) => !f.split("/").some((p) => p === "node_modules" || p === "dist"))
    .toSorted();

const SUITES: Record<string, Suite> = {
  fmt: {
    describe: "format three files of different sizes through @mochi/dx/format",
    run: async (timings) => {
      for (const rel of FORMAT_FILES) {
        const src = readFileSync(repoPath(rel), "utf8");
        const plugins = vendorPluginsFor(rel);
        notes[`fmt ${rel}`] = `${src.split("\n").length} lines`;
        for (let i = 0; i < runs; i++) {
          time(timings, `fmt ${rel}`, () => format(src, { plugins }));
        }
      }
    },
  },
  "fmt:repo": {
    describe: "format every .mochi file in the repo, as fmt:check does",
    run: async (timings) => {
      const files = repoMochiFiles().map((rel) => ({
        src: readFileSync(repoPath(rel), "utf8"),
        plugins: vendorPluginsFor(rel),
      }));
      notes["fmt:repo"] = `${files.length} files`;
      for (let i = 0; i < runs; i++) {
        time(timings, "fmt:repo", () => {
          for (const f of files) format(f.src, { plugins: f.plugins });
        });
      }
    },
  },
  compile: {
    describe: "load and compile the bootstrap/cli.mochi module graph",
    run: async (timings) => {
      const src = readFileSync(BOOTSTRAP_CLI, "utf8");
      for (let i = 0; i < runs; i++) {
        const graph = await timeAsync(timings, "compile: load (lex+parse)", () =>
          loadBootstrapGraph(BOOTSTRAP_CLI, src, (p) => readFile(p, "utf8")),
        );
        if (graph._tag !== "Ok") throw new Error(`load failed: ${JSON.stringify(graph.error)}`);
        notes["compile: check+infer+codegen"] = `${graph.value.length} modules`;
        const out = time(timings, "compile: check+infer+codegen", () =>
          compileGraphBootstrap(graph.value),
        );
        if (out._tag !== "Ok") throw new Error(`compile failed: ${JSON.stringify(out.error)}`);
      }
    },
  },
};

const selected = opts.suites.length > 0 ? opts.suites : Object.keys(SUITES);
for (const name of selected) {
  if (!(name in SUITES)) {
    console.error(`unknown suite '${name}'; known: ${Object.keys(SUITES).join(", ")}`);
    process.exit(2);
  }
}

// --profile: rerun the same suites under the sampling profiler, then rank.
if (opts.profile) {
  const dir = mkdtempSync(join(tmpdir(), "mochi-bench-prof-"));
  const res = spawnSync(
    process.execPath,
    ["--cpu-prof", "--cpu-prof-dir", dir, import.meta.path, ...selected, "--runs", String(runs)],
    { stdio: "inherit" },
  );
  if (res.status !== 0) process.exit(res.status ?? 1);
  const prof = readdirSync(dir).find((f) => f.endsWith(".cpuprofile"));
  if (prof === undefined) throw new Error(`no profile written to ${dir}`);
  console.log(`\nprofile: ${join(dir, prof)}\ninclusive time, top 40:`);
  for (const row of inclusiveTop(join(dir, prof), 40, ["bench.ts"])) {
    console.log(
      `${row.pct.toFixed(1).padStart(5)}% ${row.ms.toFixed(0).padStart(7)}ms  ${row.name}`,
    );
  }
  process.exit(0);
}

const timings: Timings = {};
for (const name of selected) await (SUITES[name] as Suite).run(timings);

const best = (xs: number[]): number => Math.min(...xs);
const median = (xs: number[]): number => {
  const s = xs.toSorted((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? Number.NaN;
};

const savedPath = (name: string): string =>
  name.includes("/") || name.endsWith(".json") ? name : repoPath(".cache", "bench", `${name}.json`);
const compareTo = opts.compare;
const baseline =
  compareTo === undefined
    ? undefined
    : (JSON.parse(readFileSync(savedPath(compareTo), "utf8")) as Saved);

const width = Math.max(...Object.keys(timings).map((k) => k.length));
console.log(`runs=${runs}${baseline ? ` vs ${compareTo} (${baseline.rev})` : ""}`);
console.log(
  `${"case".padEnd(width)}  ${"best".padStart(9)}  ${"median".padStart(9)}${baseline ? "      Δ best" : ""}`,
);
for (const [key, xs] of Object.entries(timings)) {
  const b = best(xs);
  const was = baseline?.best[key];
  const delta =
    was === undefined
      ? baseline
        ? "         —"
        : ""
      : `  ${(((b - was) / was) * 100).toFixed(1).padStart(8)}%`;
  console.log(
    `${key.padEnd(width)}  ${`${b.toFixed(1)}ms`.padStart(9)}  ${`${median(xs).toFixed(1)}ms`.padStart(9)}${delta}${notes[key] ? `  (${notes[key]})` : ""}`,
  );
}

const saveAs = opts.save;
if (saveAs !== undefined) {
  const rev = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  const saved: Saved = {
    rev: rev.stdout.trim(),
    date: new Date().toISOString(),
    best: Object.fromEntries(Object.entries(timings).map(([k, xs]) => [k, best(xs)])),
  };
  const path = savedPath(saveAs);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(saved, null, 2)}\n`);
  console.log(`saved ${path}`);
}

// github-action-benchmark's `customSmallerIsBetter` input (.github/workflows/bench.yml).
if (opts.json !== undefined) {
  const entries = Object.entries(timings).map(([name, xs]) => ({
    name,
    unit: "ms",
    value: Number(best(xs).toFixed(2)),
    extra: [notes[name], `median ${median(xs).toFixed(1)}ms over ${xs.length} runs`]
      .filter((x) => x !== undefined)
      .join("; "),
  }));
  mkdirSync(dirname(opts.json), { recursive: true });
  writeFileSync(opts.json, `${JSON.stringify(entries, null, 2)}\n`);
}
