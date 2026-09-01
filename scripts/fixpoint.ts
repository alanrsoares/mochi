// Ticket 0007 / 0013 — self-hosting fixpoint driven through the SHIPPED binary
// (bootstrap/cli.mochi), not the TS test harness. Real disk IO, real CLI.
//
// Ceremony (PATH_TO_BOOTSTRAP §4, lifted to disk; ADR 0090):
//   seed  : the reviewed bootstrap/seed TypeScript graph -> a runnable mochic
//           (stage 1, executed by Bun).
//   stage2: the seed binary rebuilds the whole graph (`mochic build cli.mochi`).
//   stage3: a binary assembled from the stage-2 outputs rebuilds it again.
// Self-hosting is proved when stage2 ≡ stage3 byte-for-byte for every module.
// We also assert the independent parity stage2 ≡ the TS `build` output.
//
// The build is CLOSED-WORLD (`mochic build`, the module graph), not per-file
// open-world: modules now share `ast.mochi`/`types.mochi` and pattern-match imported
// ctors, which only resolves with the whole graph in scope.
//
// Each stage runs in its own directory under a repo-local workspace (so Node
// module resolution finds @onrails/{pattern,result} in the repo node_modules).
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const work = join(root, ".fixpoint-work");
const bootstrap = join(root, "bootstrap");
const seedRoot = join(bootstrap, "seed");

// Every bootstrap module reachable from cli.mochi, in dependency order. `build`
// discovers the graph itself; this list is what we read back and diff.
const MODULES = [
  "ast",
  "usefulness",
  "types",
  "ctors",
  "schemes",
  "scc",
  "plugins/jsx",
  "extensions",
  "lexer",
  "parser",
  "check",
  "infer",
  "codegen",
  "ts-types",
  "codegen-ts",
  "symbols",
  "dts",
  "module",
  "compile",
  "cli",
];
// Runtime deps the emitted compiler imports (hand-written + generated shim).
const RUNTIME_DEPS = ["host.mjs", "prelude.gen.mjs", "plugins/jsx-schema.gen.mjs"];
/**
 * The frozen seed is an OLDER graph than `MODULES` by construction: it is the
 * binary that compiles today's sources, so it predates any module those sources
 * added. Derive its file list from the manifest rather than from `MODULES`, or
 * every new compiler module would demand re-freezing the trust anchor just to
 * run the fixpoint (ADR 0090).
 */
const seedManifest = (): SeedManifest =>
  JSON.parse(readFileSync(join(seedRoot, "manifest.json"), "utf8")) as SeedManifest;

const seedFiles = (): string[] => Object.keys(seedManifest().files);

const seedEntry = (): string => {
  const files = seedFiles();
  if (files.includes("cli.ts")) return "cli.ts";
  if (files.includes("cli.js")) return "cli.js";
  throw new Error("bootstrap seed missing cli.ts");
};

type SeedManifest = {
  sourceRevision: string;
  files: Record<string, string>;
};

const bun = (args: string[], cwd = root) => execFileSync("bun", args, { cwd, encoding: "utf8" });

// Copy the files that make a directory a runnable mochic: the compiled module
// JS already present there, plus the runtime deps.
const placeRuntimeDeps = (fromDir: string, dir: string) => {
  for (const dep of RUNTIME_DEPS) {
    mkdirSync(join(dir, dep, ".."), { recursive: true });
    cpSync(join(fromDir, dep), join(dir, dep));
  }
};

const copyModule = (fromRoot: string, toRoot: string, m: string, ext: string) => {
  const dest = join(toRoot, `${m}${ext}`);
  mkdirSync(join(dest, ".."), { recursive: true });
  cpSync(join(fromRoot, `${m}${ext}`), dest);
};

const verifySeed = (): void => {
  const manifest = seedManifest();
  for (const file of seedFiles()) {
    const expected = manifest.files[file];
    if (!expected) throw new Error(`bootstrap seed manifest omits '${file}'`);
    const actual = createHash("sha256")
      .update(readFileSync(join(seedRoot, file)))
      .digest("hex");
    if (actual !== expected) throw new Error(`bootstrap seed hash mismatch for '${file}'`);
  }
};

const copySeed = (toRoot: string): void => {
  mkdirSync(toRoot, { recursive: true });
  for (const file of seedFiles()) {
    const dest = join(toRoot, file);
    mkdirSync(join(dest, ".."), { recursive: true });
    cpSync(join(seedRoot, file), dest);
  }
};

// Rebuild the whole module graph with the mochic in `binDir`: copy every .mochi
// into `outDir`, then `mochic build cli.mochi` there (closed-world — one command
// walks the import graph and emits a .js beside each .mochi). Returns module -> JS.
const copyBootstrapSources = (outDir: string) => {
  mkdirSync(outDir, { recursive: true });
  for (const m of MODULES) copyModule(bootstrap, outDir, m, ".mochi");
};

const readModules = (dir: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const m of MODULES) out[m] = readFileSync(join(dir, `${m}.js`), "utf8");
  return out;
};

const compileAllWith = (binDir: string, outDir: string, entry: string): Record<string, string> => {
  copyBootstrapSources(outDir);
  bun([join(binDir, entry), "build", join(outDir, "cli.mochi")]);
  return readModules(outDir);
};

const compileAllWithTs = (outDir: string): Record<string, string> => {
  copyBootstrapSources(outDir);
  // Keep the differential oracle on the hand-authored TypeScript path while
  // the normal CLI build uses the bootstrap graph.
  bun(["packages/cli/src/cli.ts", "build", "--open", join(outDir, "cli.mochi")]);
  return readModules(outDir);
};

export type FixpointResult = {
  stage2: Record<string, string>;
  stage3: Record<string, string>;
  tsSingle: Record<string, string>;
};

export const runFixpoint = (): FixpointResult => {
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  verifySeed();

  // --- frozen stage-1 binary (emitted TypeScript, executed by Bun) ---
  const seed = join(work, "seed");
  copySeed(seed);

  // --- stage 2: seed binary rebuilds the whole graph ---
  const s2dir = join(work, "s2");
  const stage2 = compileAllWith(seed, s2dir, seedEntry());
  placeRuntimeDeps(bootstrap, s2dir); // s2 is now itself a runnable binary

  // --- stage 3: stage-2 binary rebuilds it again ---
  const stage3 = compileAllWith(s2dir, join(work, "s3"), "cli.js");

  // --- independent TypeScript parity build, isolated from the seed ---
  const tsSingle = compileAllWithTs(join(work, "ts"));

  return { stage2, stage3, tsSingle };
};

if (import.meta.main) {
  const { stage2, stage3, tsSingle } = runFixpoint();
  let ok = true;
  for (const m of MODULES) {
    const fix = stage2[m] === stage3[m];
    const par = stage2[m] === tsSingle[m];
    if (!fix || !par) ok = false;
    console.error(
      `  ${m.padEnd(8)} stage2≡stage3: ${fix ? "✓" : "✗"}   stage2≡TS: ${par ? "✓" : "✗"}`,
    );
  }
  rmSync(work, { recursive: true, force: true });
  console.error(ok ? "\nfixpoint: PASS (shipped binary reproduces itself)" : "\nfixpoint: FAIL");
  if (!ok) process.exit(1);
}
