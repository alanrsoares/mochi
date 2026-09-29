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
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { type BenchSuite, SUITES } from "./lib/bench-suites";
import { inclusiveTop } from "./lib/cpu-profile";
import { REPO_ROOT, repoPath } from "./lib/repo";

type Timings = Record<string, number[]>;
/** Per-case context (sizes) kept out of the case name, which must stay stable across commits. */
const notes: Record<string, string> = {};
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

const usage = (message: string): never => {
  console.error(`bench: ${message}`);
  process.exit(2);
};

const parseArgs = (argv: readonly string[]): Args => {
  const value = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    if (i === -1) return undefined;
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) usage(`${name} needs a value`);
    return v;
  };
  const runs = Number(value("--runs") ?? 8);
  if (!Number.isInteger(runs) || runs < 1) usage("--runs must be a positive integer");
  const suites = argv.filter(
    (a, i) =>
      !a.startsWith("--") && !(VALUE_FLAGS as readonly string[]).includes(argv[i - 1] ?? ""),
  );
  return {
    suites,
    runs,
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

const timeAsync = async <A>(timings: Timings, key: string, f: () => Promise<A>): Promise<A> => {
  const start = performance.now();
  const out = await f();
  record(timings, key, performance.now() - start);
  return out;
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
for (const name of selected) {
  for (const c of await (SUITES[name] as BenchSuite).cases(REPO_ROOT)) {
    if (c.note !== undefined) notes[c.name] = c.note;
    for (let i = 0; i < runs; i++) await timeAsync(timings, c.name, async () => c.run());
  }
}

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
