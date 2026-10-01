// The benchmark cases, shared by `bun run bench` (scripts/bench.ts, wall time)
// and the CodSpeed job (bench/codspeed.ts, instruction counts under Node).
// Runtime-neutral on purpose: no `Bun.*`, no `import.meta.dir`. The caller
// passes the repo root.
import { readdirSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadBootstrapGraph } from "@mochi/compiler/bootstrap";
import { compileGraphBootstrap } from "@mochi/compiler/bootstrap/module";
import { format } from "@mochi/dx/format";
import { loopCases } from "./bench-loop";
import { vendorPluginsFor } from "./plugins";

/** One measured operation. `name` must stay stable across commits: history keys on it. */
export type BenchCase = {
  readonly name: string;
  /** Size context (lines, files, modules), kept out of `name`. */
  readonly note?: string;
  readonly run: () => unknown;
};

export type BenchSuite = {
  readonly describe: string;
  /** Read inputs and do any untimed setup, then hand back the cases. */
  readonly cases: (root: string) => Promise<readonly BenchCase[]>;
};

const FORMAT_FILES = [
  "bootstrap/parser.mochi",
  "bootstrap/infer.mochi",
  "examples/snake/src/App.mochi",
];

const SKIP_DIRS = new Set(["node_modules", "dist"]);

/** Every `.mochi` file under `root`, relative, pruning dependency and build dirs. */
const repoMochiFiles = (root: string): string[] => {
  const out: string[] = [];
  const walk = (rel: string): void => {
    for (const entry of readdirSync(join(root, rel), { withFileTypes: true })) {
      const path = rel === "" ? entry.name : `${rel}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) walk(path);
      } else if (entry.name.endsWith(".mochi")) out.push(path);
    }
  };
  walk("");
  return out.toSorted();
};

/** A seed `Result`, read loosely: the host types it per call site. */
type SeedResult<A> = { _tag: string; value?: A; error?: unknown };

const expectOk = <A>(r: SeedResult<A>, what: string): A => {
  if (r._tag !== "Ok") throw new Error(`${what} failed: ${JSON.stringify(r.error).slice(0, 300)}`);
  return r.value as A;
};

const fmtCase = (root: string, rel: string): BenchCase => {
  const src = readFileSync(join(root, rel), "utf8");
  const plugins = vendorPluginsFor(rel);
  return {
    name: `fmt ${rel}`,
    note: `${src.split("\n").length} lines`,
    run: () => format(src, { plugins }),
  };
};

/** Load (lex+parse) and check+infer+codegen of one entry's module graph, as two cases. */
const compileCases = async (root: string, rel: string, label: string): Promise<BenchCase[]> => {
  const entry = join(root, rel);
  const src = readFileSync(entry, "utf8");
  const load = () => loadBootstrapGraph(entry, src, (p) => readFile(p, "utf8"));
  const graph = expectOk(await load(), "load");
  return [
    { name: `${label}: load (lex+parse)`, run: load },
    {
      name: `${label}: check+infer+codegen`,
      note: `${graph.length} modules`,
      run: () => expectOk(compileGraphBootstrap(graph), "compile"),
    },
  ];
};

/** Wall-time suites for `bun run bench`: real-sized inputs. */
export const SUITES: Record<string, BenchSuite> = {
  loop: {
    describe: "compiled loop/recur versus benchmark-only scalar rebinding",
    cases: async () => loopCases(),
  },
  fmt: {
    describe: "format three files of different sizes through @mochi/dx/format",
    cases: async (root) => FORMAT_FILES.map((rel) => fmtCase(root, rel)),
  },
  "fmt:repo": {
    describe: "format every .mochi file in the repo, as fmt:check does",
    cases: async (root) => {
      const files = repoMochiFiles(root).map((rel) => ({
        src: readFileSync(join(root, rel), "utf8"),
        plugins: vendorPluginsFor(rel),
      }));
      return [
        {
          name: "fmt:repo",
          note: `${files.length} files`,
          run: () => {
            for (const f of files) format(f.src, { plugins: f.plugins });
          },
        },
      ];
    },
  },
  compile: {
    describe: "load and compile the bootstrap/cli.mochi module graph",
    cases: (root) => compileCases(root, "bootstrap/cli.mochi", "compile"),
  },
};

/**
 * Suites for CodSpeed's simulation mode (bench/codspeed.ts). Valgrind runs V8
 * unoptimized and about 60x slower, so the full cases take over 25 minutes.
 * Instruction counts are deterministic, so small inputs still show a relative
 * change: a formatter file, a plugin-heavy component, and a two-module graph
 * (`ctors.mochi` importing `ast.mochi`) for cross-module inference.
 */
export const CODSPEED_SUITES: Record<string, BenchSuite> = {
  fmt: {
    describe: "format a compiler module and a JSX component",
    cases: async (root) => [
      fmtCase(root, "bootstrap/scc.mochi"),
      fmtCase(root, "examples/snake/src/App.mochi"),
    ],
  },
  compile: {
    describe: "load and compile the bootstrap/ctors.mochi module graph",
    cases: (root) => compileCases(root, "bootstrap/ctors.mochi", "compile ctors"),
  },
};
