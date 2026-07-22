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
import { cpSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const root = join(import.meta.dir, "../..");

// Build the graph into a per-process temp dir, NOT the shared bootstrap/ — bun
// runs spec files in parallel, and racing `build`s clobbering the same *.js
// caused partial reads (spurious "non-exhaustive match"). `alangc build` writes
// a .js beside each .al, so we copy the sources into an isolated dir and build
// there.
let outDir: string | null = null;
const buildGraph = (): string => {
  if (outDir) return outDir;
  const dir = mkdtempSync(join(tmpdir(), "alang-bs-"));
  cpSync(join(root, "bootstrap"), dir, { recursive: true });
  execFileSync("bun", ["src/cli.ts", "build", join(dir, "cli.al")], { cwd: root });
  outDir = dir;
  return dir;
};

const raw = (name: string): string => readFileSync(join(outDir as string, `${name}.js`), "utf8");
const stripped = (name: string): string =>
  raw(name)
    .replace(/^import .*$/gm, "")
    .replace(/^export /gm, "");

// Data-only modules whose ctors other modules import. Prepended into the eval
// sandbox (guarded by existsSync so this works before/after each is extracted).
const CTOR_MODULES = ["ast", "types"];

// Drop repeated top-level `const NAME =` declarations, keeping the first. Every
// emitted module carries the same runtime preamble (`const _curry = …`), so
// concatenating a dep module with the target would declare those twice. Ctor
// factories are CapCase and module locals lowerCamel, so this never collides
// meaningfully — it only removes the duplicate shared preamble.
const dedupeConsts = (js: string): string => {
  const lines = js.split("\n");
  const seen = new Set<string>();
  const out: string[] = [];
  for (let i = 0; i < lines.length; ) {
    const line = lines[i] ?? "";
    const name = line.match(/^const (\w+) =/)?.[1];
    if (!name) {
      out.push(line);
      i++;
      continue;
    }
    // Consume the whole statement (some emitted consts are multi-line match
    // chains) so dropping a duplicate leaves no orphaned `.with(…)` line.
    let j = i;
    while (j < lines.length && !/;\s*$/.test(lines[j] ?? ";")) j++;
    if (!seen.has(name)) {
      seen.add(name);
      out.push(...lines.slice(i, j + 1));
    }
    i = j + 1;
  }
  return out.join("\n");
};

// The compiled JS of one bootstrap module, ready to eval in isolation.
// Accepts either a bare name ("check") or a repo path ("bootstrap/check.al").
export const bootstrapModuleJs = (nameOrPath: string): string => {
  buildGraph();
  const name = basename(nameOrPath).replace(/\.al$/, "");
  // Prepend only the ctor-def modules this module actually imports (detected
  // from its compiled `import … from "./ast.js"` lines), so a module that never
  // touches the AST (lexer) is left exactly as built.
  const src = raw(name);
  const deps = CTOR_MODULES.filter((d) => new RegExp(`from "\\./${d}\\.js"`).test(src)).map(
    stripped,
  );
  return dedupeConsts([...deps, stripped(name)].join("\n"));
};
