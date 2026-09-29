// The self-hosted symbol index. bootstrap/symbols.mochi's `indexWith`, run
// through the frozen seed, must report the same occurrences, in the same walk
// order, as the TS `indexProgram` on every .mochi file in the repo: imports
// resolved through the direct dependencies' export origins, builtins through
// the virtual prelude.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type BootstrapExportOrigins,
  type BootstrapSymOccurrence,
  exportedOriginsBootstrap,
  symbolIndexBootstrap,
} from "@mochi/compiler/bootstrap";
import { lex as alLex, parse as alParse } from "@mochi/compiler/bootstrap/syntax";
import { lex } from "@mochi/compiler/lexer";
import { resolveImport } from "@mochi/compiler/module";
import { parse } from "@mochi/compiler/parser";
import { preludeBootstrap } from "@mochi/compiler/prelude-virtual";
import {
  emptyOrigins,
  indexProgram,
  mergeOrigins,
  type Occurrence,
  type Origins,
  originsOf,
} from "@mochi/compiler/symbols";
import { repoRoot } from "@mochi/test-support";
import { unwrapOk } from "@onrails/result";

const root = repoRoot(import.meta.url);

const flat = (o: Occurrence): BootstrapSymOccurrence => ({
  name: o.binding.name,
  space: o.binding.space,
  defPath: o.binding.def.path,
  defStart: o.binding.def.span.start,
  defEnd: o.binding.def.span.end,
  start: o.span.start,
  end: o.span.end,
  role: o.role,
});

/** Origins as sorted `[name, path:start-end]` rows, comparable across both shapes. */
type Rows = { values: string[]; types: string[]; ctors: string[] };

const tsRows = (o: Origins): Rows => {
  const rows = (m: Origins["value"]) =>
    [...m].map(([k, v]) => `${k} ${v.path}:${v.span.start}-${v.span.end}`).sort();
  return { values: rows(o.value), types: rows(o.type), ctors: rows(o.ctor) };
};

const alRows = (o: BootstrapExportOrigins): Rows => {
  const rows = (m: BootstrapExportOrigins["values"]) =>
    [...m].map(([k, v]) => `${k} ${v.path}:${v.start}-${v.end}`).sort();
  return { values: rows(o.values), types: rows(o.types), ctors: rows(o.ctors) };
};

const tsProgram = (src: string) => unwrapOk(parse(unwrapOk(lex(src))));

const alStmts = (src: string): unknown => {
  const lexed = alLex(src) as { _tag: string; value: unknown };
  const parsed = alParse(lexed.value) as { _tag: string; value: unknown; error?: unknown };
  if (parsed._tag !== "Ok")
    throw new Error(`bootstrap parse failed: ${JSON.stringify(parsed.error)}`);
  return parsed.value;
};

/** Relative `.mochi` imports of `src`, resolved against `path`. */
const depsOf = (path: string, src: string): string[] =>
  tsProgram(src)
    .stmts.flatMap((s) => (s.kind === "import" ? [s.from] : []))
    .filter((spec) => spec.startsWith("./") || spec.startsWith("../"))
    .map((spec) => resolveImport(path, spec));

const corpus = [...new Bun.Glob("**/*.mochi").scanSync({ cwd: root })]
  .filter((p) => !p.includes("node_modules") && !p.startsWith("test/conformance/"))
  .sort();

test("corpus includes the symbol index itself", () => {
  expect(corpus).toContain("bootstrap/symbols.mochi");
});

for (const file of corpus) {
  test(`symbol indexes agree on ${file}`, () => {
    const path = join(root, file);
    const src = readFileSync(path, "utf8");
    const tsOrigins = emptyOrigins();
    const alOrigins: BootstrapExportOrigins = {
      values: new Map(),
      types: new Map(),
      ctors: new Map(),
    };
    for (const dep of depsOf(path, src)) {
      let depSrc: string;
      try {
        depSrc = readFileSync(dep, "utf8");
      } catch {
        continue; // a fixture importing a file that is not there
      }
      const tsDep = originsOf(dep, tsProgram(depSrc));
      const alDep = exportedOriginsBootstrap(dep, alStmts(depSrc));
      expect(alRows(alDep)).toEqual(tsRows(tsDep));
      mergeOrigins(tsOrigins, tsDep);
      for (const [k, v] of alDep.values) alOrigins.values.set(k, v);
      for (const [k, v] of alDep.types) alOrigins.types.set(k, v);
      for (const [k, v] of alDep.ctors) alOrigins.ctors.set(k, v);
    }
    const ts = indexProgram(path, tsProgram(src), tsOrigins).all().map(flat);
    const al = symbolIndexBootstrap(path, alOrigins, preludeBootstrap(), alStmts(src)).occurrences;
    expect(al).toEqual(ts);
  });
}
