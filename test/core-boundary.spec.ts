// #70 deletes the hand-authored TypeScript core. Modules that outlive it — the
// barrel and its bootstrap façades (ADR 0127), the plugin seam (ADR 0011), the
// prelude tables, `ast/`, `errors/`, DX and LSP — must not import it, or the deletion breaks them.
// Specs outside the core must observe the same boundary (ADR 0130).
import { expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { repoRoot } from "@mochi/test-support";

const root = repoRoot(import.meta.url);
const compilerSrc = join(root, "packages/compiler/src");
const CORE_DIRS = ["lexer", "parser", "check", "infer", "codegen", "module", "compile", "dts"];
const CORE_SUBPATHS = [
  "lexer",
  "parser",
  "check",
  "infer",
  "codegen",
  "codegen-ts",
  "module",
  "compile",
  "dts",
  "unify",
  "scc",
  "schemes",
  "show-type-expr",
  "symbols",
  "compile-targets",
];

const exportsMap = JSON.parse(readFileSync(join(root, "packages/compiler/package.json"), "utf8"))
  .exports as Record<string, string>;

const sources = (dir: string): string[] =>
  statSync(dir).isFile()
    ? [dir]
    : readdirSync(dir).flatMap((name) => {
        const p = join(dir, name);
        if (["node_modules", "dist", ".cache", ".output"].includes(name)) return [];
        if (statSync(p).isDirectory()) return sources(p);
        return /\.(?:tsx?|mts|mochi)$/.test(name) ? [p] : [];
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

const SURVIVORS = ["packages", "scripts", "test", "apps", "examples"];

test("the compiler publishes no TypeScript-core subpaths", () => {
  expect(
    Object.values(exportsMap).filter((path) => isCore(resolve(root, "packages/compiler", path))),
  ).toEqual([]);
  expect(CORE_SUBPATHS.filter((sub) => `./${sub}` in exportsMap)).toEqual([]);
});

test.each(SURVIVORS)("%s imports no TypeScript-core module", (dir) => {
  const hits = sources(join(root, dir))
    .filter((file) => !isCore(file))
    .flatMap((file) =>
      [...readFileSync(file, "utf8").matchAll(SPECIFIER)]
        .map((m) => m[2] as string)
        .filter((spec) => {
          if (
            CORE_SUBPATHS.some(
              (sub) =>
                spec === `@mochi/compiler/${sub}` || spec.startsWith(`@mochi/compiler/${sub}/`),
            )
          )
            return true;
          const path = target(file, spec);
          return path !== null && isCore(path);
        })
        .map((spec) => `${relative(root, file)}: ${spec}`),
    );
  expect(hits).toEqual([]);
});
