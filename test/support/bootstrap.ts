// Shared harness for the self-hosted differential specs. Each bootstrap module
// is compiled by the TS compiler, evaluated in isolation, and diffed against
// the corresponding TS pass over a corpus.
//
// Since ticket 0013 the modules share ast.al / types.al and pattern-match
// IMPORTED ctors, which only type-checks under the closed-world `build` (not
// per-file open-world `compile`). So we build the whole graph once, then for a
// given module return its emitted JS with imports/exports stripped and the
// shared ctor-definition modules prepended — so it still evals standalone in a
// `new Function` sandbox with only the runtime (`match`, prelude tables)
// injected as parameters.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

const root = join(import.meta.dir, "../..");

let built = false;
const buildGraph = (): void => {
  if (built) return;
  execFileSync("bun", ["src/cli.ts", "build", "bootstrap/cli.al"], { cwd: root });
  built = true;
};

const stripped = (name: string): string =>
  readFileSync(join(root, "bootstrap", `${name}.js`), "utf8")
    .replace(/^import .*$/gm, "")
    .replace(/^export /gm, "");

// Data-only modules whose ctors other modules import. Prepended into the eval
// sandbox (guarded by existsSync so this works before/after each is extracted).
const CTOR_MODULES = ["ast", "types"];

// The compiled JS of one bootstrap module, ready to eval in isolation.
// Accepts either a bare name ("check") or a repo path ("bootstrap/check.al").
export const bootstrapModuleJs = (nameOrPath: string): string => {
  buildGraph();
  const name = basename(nameOrPath).replace(/\.al$/, "");
  const deps = CTOR_MODULES.filter(
    (d) => d !== name && existsSync(join(root, "bootstrap", `${d}.js`)),
  )
    .map(stripped)
    .join("\n");
  return deps ? `${deps}\n${stripped(name)}` : stripped(name);
};
