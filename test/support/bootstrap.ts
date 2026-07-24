// Shared harness for the self-hosted differential specs. Each bootstrap module
// is compiled by the TS compiler, evaluated in isolation, and diffed against
// the corresponding TS pass over a corpus.
//
// Since ticket 0013 the modules share ast.mochi / types.mochi and pattern-match
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
// caused partial reads (spurious "non-exhaustive match"). `mochic build` writes
// a .js beside each .mochi, so we copy the sources into an isolated dir and build
// there.
let outDir: string | null = null;
const buildGraph = (): string => {
  if (outDir) return outDir;
  const dir = mkdtempSync(join(tmpdir(), "mochi-bs-"));
  cpSync(join(root, "bootstrap"), dir, { recursive: true });
  execFileSync("bun", ["src/cli.ts", "build", join(dir, "cli.mochi")], { cwd: root });
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
const CTOR_MODULES = ["ast", "types", "ctors", "schemes", "scc"];

// CapCase `const` bindings a stripped ctor module defines — used to rebuild an
// `import * as Alias` namespace object after imports are stripped (ADR 0002).
const exportedCtorNames = (js: string): string[] =>
  [...js.matchAll(/^const ([A-Z]\w*) =/gm)].map((m) => m[1]!);

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
// Accepts either a bare name ("check") or a repo path ("bootstrap/check.mochi").
export const bootstrapModuleJs = (nameOrPath: string): string => {
  buildGraph();
  const name = basename(nameOrPath).replace(/\.mochi$/, "");
  const src = raw(name);
  // Prepend ctor-def modules this module (transitively via those modules) needs,
  // in CTOR_MODULES order so deps land before dependents. After each dep, rebuild
  // any `import * as Alias` namespaces it uses (ADR 0002) — stripping imports
  // would otherwise leave `Ast.ENum` unbound.
  const parts: string[] = [];
  const seenAlias = new Set<string>();
  const injectNs = (jsSrc: string): void => {
    for (const m of jsSrc.matchAll(/^import \* as (\w+) from "\.\/(\w+)\.js";$/gm)) {
      const alias = m[1]!;
      const dep = m[2]!;
      if (seenAlias.has(alias)) continue;
      seenAlias.add(alias);
      const names = exportedCtorNames(stripped(dep));
      if (names.length) parts.push(`const ${alias} = { ${names.join(", ")} };`);
    }
  };
  // Fixed-point: start from modules the target imports; add modules those import.
  const needed = new Set<string>();
  const consider = (jsSrc: string): void => {
    for (const d of CTOR_MODULES) {
      if (needed.has(d)) continue;
      if (new RegExp(`from "\\./${d}\\.js"`).test(jsSrc)) {
        needed.add(d);
        consider(raw(d));
      }
    }
  };
  consider(src);
  for (const d of CTOR_MODULES) {
    if (!needed.has(d)) continue;
    injectNs(raw(d)); // namespace aliases before the module body uses them
    parts.push(stripped(d));
  }
  injectNs(src);
  parts.push(stripped(name));
  return dedupeConsts(parts.join("\n"));
};
