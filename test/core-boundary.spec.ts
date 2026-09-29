// #70 deletes the hand-authored TypeScript core. Modules that outlive it — the
// plugin seam (ADR 0011), the prelude tables, `ast/`, `errors/`, DX and LSP —
// must not import it, or the deletion breaks them. Specs are exempt: #104
// retires the ones that exercise the core.
import { expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { repoRoot } from "@mochi/test-support";

const root = repoRoot(import.meta.url);
const compilerSrc = join(root, "packages/compiler/src");
const CORE_DIRS = ["lexer", "parser", "check", "infer", "codegen", "module", "compile"];

const exportsMap = JSON.parse(readFileSync(join(root, "packages/compiler/package.json"), "utf8"))
  .exports as Record<string, string>;

const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sources(p);
    return /\.tsx?$/.test(name) && !/\.spec\.tsx?$/.test(name) ? [p] : [];
  });

const SPECIFIER = /(?:from|import)\s*\(?\s*(["'])([^"']+)\1/g;

/** The file a specifier names, when it lands in `packages/compiler/src`. */
const target = (file: string, spec: string): string | null => {
  if (spec.startsWith(".")) return resolve(dirname(file), spec);
  if (spec === "@mochi/compiler" || spec.startsWith("@mochi/compiler/")) {
    const sub = exportsMap[`.${spec.slice("@mochi/compiler".length)}`];
    return sub ? resolve(root, "packages/compiler", sub) : null;
  }
  return null;
};

const isCore = (path: string): boolean => {
  const rel = relative(compilerSrc, path);
  return CORE_DIRS.some((d) => rel === d || rel.startsWith(`${d}/`));
};

const SURVIVORS = [
  "packages/compiler/src/ast",
  "packages/compiler/src/errors",
  "packages/compiler/src/extensions",
  "packages/compiler/src/prelude",
  "packages/dx/src",
  "packages/lsp/src",
];

test.each(SURVIVORS)("%s imports no TypeScript-core module", (dir) => {
  const hits = sources(join(root, dir)).flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(SPECIFIER)]
      .map((m) => m[2] as string)
      .filter((spec) => {
        const path = target(file, spec);
        return path !== null && isCore(path);
      })
      .map((spec) => `${relative(root, file)}: ${spec}`),
  );
  expect(hits).toEqual([]);
});
