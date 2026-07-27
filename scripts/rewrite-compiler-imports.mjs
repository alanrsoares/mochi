#!/usr/bin/env bun
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const root = join(import.meta.dir, "../packages/compiler/src");

/** Logical module id → path under src/ (no extension). */
const MODULE = {
  lexer: "lexer/lexer",
  parser: "parser/parser",
  ast: "ast/ast",
  types: "ast/types",
  span: "ast/span",
  ctors: "ast/ctors",
  errors: "errors/errors",
  check: "check/check",
  symbols: "check/symbols",
  infer: "infer/infer",
  unify: "infer/unify",
  scc: "infer/scc",
  schemes: "infer/schemes",
  "show-type-expr": "infer/show-type-expr",
  suggest: "infer/suggest",
  codegen: "codegen/codegen",
  "codegen-ts": "codegen/codegen-ts",
  doc: "doc/doc",
  prelude: "prelude/prelude",
  "prelude-virtual": "prelude/prelude-virtual",
  runtime: "prelude/runtime",
  module: "module/module",
  dts: "dts/dts",
  extensions: "extensions/extensions",
  compile: "compile/compile",
  "compile-targets": "compile/compile-targets",
  "plugins/jsx": "extensions/plugins/jsx",
};

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".ts")) files.push(p);
  }
};
walk(root);

const resolveModule = (fromFile, spec) => {
  // Only rewrite relative compiler-internal imports.
  const m = spec.match(/^(\.\.?\/)(.+)$/);
  if (!m) return spec;
  const tail = m[2].replace(/\.ts$/, "");
  const target = MODULE[tail];
  if (!target) return spec;
  const fromDir = dirname(fromFile);
  const toFile = join(root, `${target}.ts`);
  let rel = relative(fromDir, toFile).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel.replace(/\.ts$/, "");
};

let changed = 0;
for (const file of files) {
  let src = readFileSync(file, "utf8");
  const orig = src;
  src = src.replace(/from (["'])(\.\.?\/[^"']+)\1/g, (full, q, spec) => {
    const next = resolveModule(file, spec);
    return next === spec ? full : `from ${q}${next}${q}`;
  });
  if (src !== orig) {
    writeFileSync(file, src);
    changed++;
    console.log(file.replace(`${root}/`, ""));
  }
}

// Root barrel
const barrel = join(root, "index.ts");
let b = readFileSync(barrel, "utf8");
const nb = b.replace('from "./compile.ts"', 'from "./compile/index.ts"');
if (nb !== b) {
  writeFileSync(barrel, nb);
  console.log("index.ts");
  changed++;
}

console.log(`rewrote ${changed} files`);
