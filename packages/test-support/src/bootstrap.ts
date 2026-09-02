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
//
// The graph build is cached cross-process under `.cache/bootstrap-build/<hash>/`
// (keyed by bootstrap sources + `packages/compiler/src/**/*.ts`). Bun runs spec
// files in parallel workers; without a shared cache each worker rebuilt the graph
// into its own temp dir. A `.building` claim + wait-for-peer keeps usually one
// builder.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import { repoRoot } from "./repo.ts";

const root = repoRoot(import.meta.url);
const CACHE_ROOT = join(root, ".cache", "bootstrap-build");
const CLAIM_STALE_MS = 120_000;
const WAIT_MS = 120_000;

let outDir: string | null = null;

const sourceHash = (): string => {
  const h = createHash("sha256");
  const files = [
    // `**`, not `*`: `bootstrap/plugins/jsx.mochi` is part of the graph, so a
    // change to it must invalidate the cache — with `*` the stale build was
    // silently reused and the parity tests scored the previous source.
    ...new Bun.Glob("bootstrap/**/*.mochi").scanSync({ cwd: root }),
    ...new Bun.Glob("packages/compiler/src/**/*.ts").scanSync({ cwd: root }),
  ].toSorted();
  for (const p of files) {
    h.update(p);
    h.update("\0");
    h.update(readFileSync(join(root, p)));
    h.update("\0");
  }
  return h.digest("hex").slice(0, 16);
};

// Both must be present: a cache written before `format.mochi` joined the graph
// has `cli.js` but no `format.js`, and would be reused as-is.
const ready = (dir: string): boolean =>
  existsSync(join(dir, "cli.js")) && existsSync(join(dir, "format.js"));

const waitUntilReady = (dir: string): boolean => {
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    if (ready(dir)) return true;
    Bun.sleepSync(50);
  }
  return ready(dir);
};

const tryClaim = (claim: string): boolean => {
  try {
    writeFileSync(claim, String(process.pid), { flag: "wx" });
    return true;
  } catch {
    try {
      const age = Date.now() - statSync(claim).mtimeMs;
      if (age > CLAIM_STALE_MS) {
        rmSync(claim, { force: true });
        writeFileSync(claim, String(process.pid), { flag: "wx" });
        return true;
      }
    } catch {
      // Peer still holds a fresh claim, or we lost the stale-retry race.
    }
    return false;
  }
};

const releaseClaim = (claim: string): void => {
  try {
    rmSync(claim, { force: true });
  } catch {
    // Best-effort; a peer may have already cleared a stale claim.
  }
};

// Build the graph into a content-addressed cache dir — never into shared
// `bootstrap/`. `mochic build` writes a .js beside each .mochi, so we copy
// sources into an isolated dir and build there. Parallel workers share the
// result via hash + claim.
const buildGraph = (): string => {
  if (outDir) return outDir;

  const hash = sourceHash();
  const dest = join(CACHE_ROOT, hash);
  if (ready(dest)) {
    outDir = dest;
    return dest;
  }

  mkdirSync(CACHE_ROOT, { recursive: true });
  const claim = join(CACHE_ROOT, `${hash}.building`);
  const builder = tryClaim(claim);

  if (!builder) {
    if (waitUntilReady(dest)) {
      outDir = dest;
      return dest;
    }
    // Peer stalled — fall through and build ourselves.
  } else if (ready(dest)) {
    releaseClaim(claim);
    outDir = dest;
    return dest;
  }

  const tmp = join(CACHE_ROOT, `${hash}.tmp-${process.pid}`);
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  // Copy sources only — skip stale emit so the build is authoritative.
  for (const name of readdirSync(join(root, "bootstrap"))) {
    if (name.endsWith(".js") || name.endsWith(".ts") || name.endsWith(".d.mts")) continue;
    if (name.startsWith(".")) continue;
    cpSync(join(root, "bootstrap", name), join(tmp, name), { recursive: true });
  }
  try {
    // The host CLI normally runs the frozen bootstrap seed (ADR 0090). This
    // cache intentionally needs the independent TypeScript oracle instead: it
    // materialises today's bootstrap sources for parity and binary tests.
    // `--open` is behaviorally inert for this closed graph but deliberately
    // selects that oracle path.
    execFileSync("bun", ["packages/cli/src/cli.ts", "build", "--open", join(tmp, "cli.mochi")], {
      cwd: root,
    });
    try {
      // A cache dir from an older layout (say, before `format.js` was emitted)
      // exists but is not `ready` — a rename onto it would fail, so drop it.
      if (existsSync(dest) && !ready(dest)) rmSync(dest, { recursive: true, force: true });
      renameSync(tmp, dest);
    } catch {
      rmSync(tmp, { recursive: true, force: true });
      if (!ready(dest)) {
        throw new Error(`bootstrap build cache race failed for ${hash}`);
      }
    }
  } finally {
    if (builder) releaseClaim(claim);
  }

  outDir = dest;
  return dest;
};

/** Ensure `bootstrap/*.js` match the shared cache (for specs that import/run in-tree). */
export const ensureInTreeBootstrapBuild = (): void => {
  const dir = buildGraph();
  const bootstrapDir = join(root, "bootstrap");
  const copyJs = (fromDir: string, toDir: string): void => {
    mkdirSync(toDir, { recursive: true });
    for (const name of readdirSync(fromDir)) {
      const from = join(fromDir, name);
      const to = join(toDir, name);
      if (statSync(from).isDirectory()) {
        copyJs(from, to);
        continue;
      }
      if (!name.endsWith(".js")) continue;
      const tmp = join(toDir, `.${name}.${process.pid}.tmp`);
      cpSync(from, tmp);
      renameSync(tmp, to);
    }
  };
  copyJs(dir, bootstrapDir);
};

const raw = (rel: string): string => readFileSync(join(outDir as string, `${rel}.js`), "utf8");
// Strip module wiring so the body evals standalone in `new Function`. Match only
// genuine top-level export STATEMENTS: a multi-line template literal can place
// `export { … }` at column 0 as string content (codegen's own `export extern`
// emit does exactly this), and a blunt `/^export /` would eat the keyword out of
// that string. So target the decl forms and exact `export { idents };` re-export
// lines, leaving interpolated template content (`export { ${name} };…`) intact.
const stripped = (rel: string): string =>
  raw(rel)
    .replace(/^import .*$/gm, "")
    .replace(/^export (const|let|var|default|function|class|async) /gm, "$1 ")
    .replace(/^export (\{[^{}]*\};)$/gm, "$1");

// Data-only modules whose ctors other modules import. Prepended into the eval
// sandbox (guarded by existsSync so this works before/after each is extracted).
// Order matters: a dep must land before its dependents. `doc` / `show-type-expr`
// are plain function modules rather than ctor modules, but they are prepended
// the same way — `format.mochi` imports them by name, and stripping imports
// would otherwise leave `cat` / `showTypeExpr` unbound.
const CTOR_MODULES = [
  "ast",
  "usefulness",
  "types",
  "ctors",
  "schemes",
  "scc",
  "lexer",
  "str-scan",
  "doc",
  "show-type-expr",
];

// Modules prepended for their constructors only, not their whole body.
const CTOR_DEFS_ONLY = new Set(["lexer"]);

// CapCase `const` bindings a stripped ctor module defines — used to rebuild an
// `import * as Alias` namespace object after imports are stripped (ADR 0002).
const exportedCtorNames = (js: string): string[] =>
  [...js.matchAll(/^const ([A-Z]\w*) =/gm)].map((m) => m[1]!);

// Drop repeated top-level `const NAME =` declarations, keeping the first. Every
// emitted module carries the same runtime preamble (`const _curry = …`), so
// concatenating a dep module with the target would declare those twice. Ctor
// factories are CapCase and module locals lowerCamel, so this never collides
// meaningfully — it only removes the duplicate shared preamble.
/**
 * Index of the line ending the statement that starts at `i`. Some emitted consts
 * are multi-line match chains and prelude defs like `_curry` are multi-line
 * function bodies, so a trailing `;` only ends the statement once every bracket
 * it opened has closed — `return (...b) => c(...a, ...b);` inside a body does
 * not. Brackets inside a STRING are text, not structure: the lexer's punctuation
 * tables are full of `"("` / `"}"` and would otherwise drive `depth` negative
 * and swallow every following declaration.
 */
const endOfStatement = (lines: readonly string[], i: number): number => {
  let depth = 0;
  let quote = "";
  for (let j = i; j < lines.length; j++) {
    const text = lines[j] ?? "";
    for (let k = 0; k < text.length; k++) {
      const ch = text[k]!;
      if (quote) {
        if (ch === "\\") k++;
        else if (ch === quote) quote = "";
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") quote = ch;
      else if ("({[".includes(ch)) depth += 1;
      else if (")}]".includes(ch)) depth -= 1;
    }
    if (depth <= 0 && /;\s*$/.test(text)) return j;
  }
  return lines.length - 1;
};

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
    const j = endOfStatement(lines, i);
    if (!seen.has(name)) {
      seen.add(name);
      out.push(...lines.slice(i, j + 1));
    }
    i = j + 1;
  }
  return out.join("\n");
};

/**
 * Just the constructor declarations of a module, plus the `_`-prefixed runtime
 * preamble they call (`_curry`). `lexer` is pulled in for its `Tok` constructors
 * alone; prepending its whole body would redeclare `lex`, which the pipeline
 * specs inject as an eval parameter.
 */
const ctorDefsOnly = (js: string): string => {
  const lines = js.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; ) {
    const name = (lines[i] ?? "").match(/^const (\w+) =/)?.[1];
    const j = name ? endOfStatement(lines, i) : i;
    if (name && /^[A-Z_]/.test(name)) out.push(...lines.slice(i, j + 1));
    i = j + 1;
  }
  return out.join("\n");
};

/** Relative module id from an import path: `./extensions.js` → `extensions`, `./plugins/jsx.js` → `plugins/jsx`. */
const importRel = (spec: string): string => spec.replace(/^\.\//, "").replace(/\.js$/, "");

// Modules that must be prepended (in order) when eval'ing a bootstrap pass that
// imports the LanguagePlugin seam (Wave 8).
const PLUGIN_SEAM = ["plugins/jsx", "extensions"];

// Generated host-seam shims the plugin reaches through `extern`. Module wiring
// is stripped for the sandbox, so inline the shim's own defs and bind the
// extern's local name to the export it aliases — otherwise
// `jsxIntrinsicElements` is simply undefined and every JSX corpus case dies on a
// ReferenceError rather than producing a verdict (ADR 0097).
//
// Keyed by the LOCAL name the extern introduces, not by the import line: the
// import statements are already gone by the time the body is assembled.
const HOST_SHIMS: Readonly<Record<string, { readonly rel: string; readonly exported: string }>> = {
  jsxIntrinsicElements: {
    rel: "plugins/jsx-schema.gen.mjs",
    exported: "intrinsicElements",
  },
};

const shimDefs = (body: string): string[] =>
  Object.entries(HOST_SHIMS).flatMap(([local, { rel, exported }]) => {
    if (!body.includes(local)) return [];
    const defs = readFileSync(join(root, "bootstrap", rel), "utf8").replace(
      /^export (const|let|var) /gm,
      "$1 ",
    );
    return [`${defs}\nconst ${local} = ${exported};`];
  });

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
    for (const m of jsSrc.matchAll(/^import \* as (\w+) from "(\.\/[^"]+)";$/gm)) {
      const alias = m[1]!;
      const dep = importRel(m[2]!);
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
      // `\.\.?/` — plugins/jsx.js reaches the root modules as `../lexer.js`.
      if (new RegExp(`from "\\.\\.?/${d}\\.js"`).test(jsSrc)) {
        needed.add(d);
        consider(raw(d));
      }
    }
    for (const d of PLUGIN_SEAM) {
      if (needed.has(d)) continue;
      if (jsSrc.includes(`from "./${d}.js"`)) {
        needed.add(d);
        consider(raw(d));
      }
    }
  };
  consider(src);
  for (const d of CTOR_MODULES) {
    if (!needed.has(d)) continue;
    injectNs(raw(d)); // namespace aliases before the module body uses them
    parts.push(CTOR_DEFS_ONLY.has(d) ? ctorDefsOnly(stripped(d)) : stripped(d));
  }
  for (const d of PLUGIN_SEAM) {
    if (!needed.has(d)) continue;
    injectNs(raw(d));
    parts.push(stripped(d));
  }
  injectNs(src);
  parts.push(stripped(name));
  const body = parts.join("\n");
  // Shim defs go FIRST and are scanned over the assembled body: the module that
  // reaches a host shim is usually a dep pulled in above (`plugins/jsx`), not
  // the target itself.
  return dedupeConsts([...shimDefs(body), body].join("\n"));
};
