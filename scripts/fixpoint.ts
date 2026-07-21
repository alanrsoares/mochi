// Ticket 0007 — self-hosting fixpoint driven through the SHIPPED binary
// (bootstrap/cli.al), not the TS test harness. Real disk IO, real CLI.
//
// Ceremony (PATH_TO_BOOTSTRAP §4, lifted to disk):
//   seed  : the TS compiler builds bootstrap/cli.al's graph -> a runnable
//           alangc (stage-1 binary).
//   stage2: the seed binary compiles every bootstrap/*.al on disk -> *.js.
//   stage3: a binary assembled from the stage-2 outputs recompiles them again.
// Self-hosting is proved when stage2 ≡ stage3 byte-for-byte for every module.
// We also assert the stronger parity stage2 ≡ TS single-file `compile` output.
//
// Each stage runs in its own directory under a repo-local workspace (so Node
// module resolution finds @onrails/{pattern,result} in the repo node_modules).
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { unwrapOk } from "@onrails/result";
import { compile as tsCompile } from "../src/compile";

const root = join(import.meta.dir, "..");
const work = join(root, ".fixpoint-work");

// Every bootstrap module, in dependency order (order is cosmetic — each is
// compiled independently, open-world).
const MODULES = ["lexer", "parser", "check", "infer", "codegen", "compile", "cli"];
// Runtime deps the emitted compiler imports (hand-written + generated shim).
const RUNTIME_DEPS = ["host.js", "prelude.gen.js"];

const bun = (args: string[], cwd = root) =>
  execFileSync("bun", args, { cwd, encoding: "utf8" });

// Copy the files that make a directory a runnable alangc: the compiled module
// JS already present there, plus the runtime deps.
const placeRuntimeDeps = (dir: string) => {
  for (const dep of RUNTIME_DEPS) cpSync(join(root, "bootstrap", dep), join(dir, dep));
};

// Compile every module's .al with the alangc in `binDir`, writing .js into
// `outDir`. Returns module -> emitted JS.
const compileAllWith = (binDir: string, outDir: string): Record<string, string> => {
  mkdirSync(outDir, { recursive: true });
  const out: Record<string, string> = {};
  for (const m of MODULES) {
    const al = join(outDir, `${m}.al`);
    cpSync(join(root, "bootstrap", `${m}.al`), al);
    bun([join(binDir, "cli.js"), al]);
    out[m] = readFileSync(join(outDir, `${m}.js`), "utf8");
  }
  return out;
};

export type FixpointResult = {
  stage2: Record<string, string>;
  stage3: Record<string, string>;
  tsSingle: Record<string, string>;
};

export const runFixpoint = (): FixpointResult => {
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });

  // --- seed (stage-1) binary: TS-built, in .fixpoint-work/seed ---
  bun(["src/cli.ts", "build", "bootstrap/cli.al"]);
  const seed = join(work, "seed");
  mkdirSync(seed, { recursive: true });
  for (const m of MODULES) cpSync(join(root, "bootstrap", `${m}.js`), join(seed, `${m}.js`));
  placeRuntimeDeps(seed);

  // --- stage 2: seed binary recompiles every module ---
  const s2dir = join(work, "s2");
  const stage2 = compileAllWith(seed, s2dir);
  placeRuntimeDeps(s2dir); // s2 is now itself a runnable binary

  // --- stage 3: stage-2 binary recompiles every module ---
  const stage3 = compileAllWith(s2dir, join(work, "s3"));

  // --- TS single-file parity reference ---
  const tsSingle: Record<string, string> = {};
  for (const m of MODULES)
    tsSingle[m] = unwrapOk(tsCompile(readFileSync(join(root, "bootstrap", `${m}.al`), "utf8")));

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
