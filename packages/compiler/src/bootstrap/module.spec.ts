import { expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { repoRoot } from "@mochi/test-support";
import { unwrapOk } from "@onrails/result";
import { buildModules as tsBuildModules } from "../module/module.ts";
import {
  buildModulesBootstrap,
  buildModulesBootstrapWith,
  defaultBootstrapOptions,
  editorBootstrapOptions,
  inferGraphTypesBootstrap,
  symbolOccurrencesBootstrap,
} from "./module.ts";
import { lex, parse } from "./syntax.ts";

const parseBootstrap = (source: string): unknown => {
  const tokens = lex(source) as { _tag: string; value?: unknown };
  expect(tokens._tag).toBe("Ok");
  const stmts = parse(tokens.value) as { _tag: string; value?: unknown };
  expect(stmts._tag).toBe("Ok");
  return stmts.value;
};

test("bundled bootstrap module graph matches the TypeScript driver", async () => {
  const entry = join(repoRoot(import.meta.url), "examples/modules/main.mochi");
  const bootstrap = buildModulesBootstrap(entry);
  const oracle = await tsBuildModules(entry, (path) => Bun.file(path).text());
  expect(bootstrap).toEqual({
    _tag: "Ok",
    value: unwrapOk(oracle),
  });
});

test("bundled graph facade emits .js sibling imports by default", () => {
  const result = buildModulesBootstrap(
    join(repoRoot(import.meta.url), "examples/modules/main.mochi"),
  );
  expect(unwrapOk(result).some((output) => output.js.includes('from "./geometry.js"'))).toBe(true);
});

// Vite wants sibling imports left as `.mochi` so they re-enter its plugin.
test("bundled graph facade honours a caller's moduleExt", () => {
  const result = buildModulesBootstrapWith(
    join(repoRoot(import.meta.url), "examples/modules/main.mochi"),
    { open: false, docs: true, moduleExt: ".mochi", strictEntry: false },
  );
  expect(unwrapOk(result).some((output) => output.js.includes('from "./geometry.mochi"'))).toBe(
    true,
  );
});

test("bundled graph query preserves inferred spans across imports", () => {
  const result = inferGraphTypesBootstrap([
    {
      path: "/virtual/dep.mochi",
      src: "export let value = 1",
      stmts: parseBootstrap("export let value = 1"),
    },
    {
      path: "/virtual/main.mochi",
      src: 'import { value } from "./dep"\nlet answer = value',
      stmts: parseBootstrap('import { value } from "./dep"\nlet answer = value'),
    },
  ]);
  expect(result).toEqual({
    _tag: "Ok",
    value: expect.arrayContaining([
      expect.objectContaining({
        path: "/virtual/main.mochi",
        types: expect.arrayContaining([
          expect.objectContaining({ span: { start: 43, end: 48 }, display: "number" }),
        ]),
      }),
    ]),
  });
});

test("bundled graph exposes lexical binding identity", () => {
  const occurrences = symbolOccurrencesBootstrap(
    parseBootstrap("let x = 1\nlet f = let x = 2 in x\nx"),
  );
  expect(occurrences).toEqual([
    expect.objectContaining({ name: "x", defStart: 4, start: 4, role: "def" }),
    expect.objectContaining({ name: "f", role: "def" }),
    expect.objectContaining({ name: "x", defStart: 22, start: 22, role: "def" }),
    expect.objectContaining({ name: "x", defStart: 22, start: 31, role: "use" }),
    expect.objectContaining({ name: "x", defStart: 4, start: 33, role: "use" }),
  ]);
});

// --- graph options ---------------------------------------------------------
//
// The self-hosted graph takes `open` / `docs` / `moduleExt` / `strictEntry` as
// real options. Before it did, the host CLI fell back to the TypeScript
// compiler whenever a caller asked for anything but the defaults, and the graph
// driver inferred every module open-world — so `mochi build` silently accepted
// an unbound name that `mochi <file>` rejected.

const inTmp = (files: Record<string, string>): string => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-graph-opts-"));
  for (const [name, source] of Object.entries(files)) writeFileSync(join(dir, name), source);
  return dir;
};

test("graph build rejects an unbound variable, like the single-file railway", () => {
  const dir = inTmp({
    "dep.mochi": "export let x = 1\n",
    "main.mochi": 'import { x } from "./dep.mochi"\nexport let y = x + nope\n',
  });
  const result = buildModulesBootstrap(join(dir, "main.mochi"));
  expect(result._tag).toBe("Err");
  if (result._tag === "Err") expect(result.error.message).toContain("unbound variable 'nope'");
});

test("a dependency's own `use open` directive is honoured", () => {
  const dir = inTmp({
    "dep.mochi": '"use open"\nexport let value = hostGlobal\n',
    "main.mochi": 'import { value } from "./dep.mochi"\nexport let use = value\n',
  });
  expect(buildModulesBootstrap(join(dir, "main.mochi"))._tag).toBe("Ok");
});

test("`strictEntry` judges the entry by the caller's flag, not its directive", () => {
  const dir = inTmp({ "main.mochi": '"use open"\nexport let value = hostGlobal\n' });
  const entry = join(dir, "main.mochi");
  expect(buildModulesBootstrapWith(entry, defaultBootstrapOptions)._tag).toBe("Ok");
  expect(buildModulesBootstrapWith(entry, editorBootstrapOptions)._tag).toBe("Err");
});

test("`docs: false` drops docstrings from the emitted JS", () => {
  const dir = inTmp({ "main.mochi": "/// Doubles.\nexport let double = n => n * 2\n" });
  const entry = join(dir, "main.mochi");
  const withDocs = unwrapOk(buildModulesBootstrapWith(entry, defaultBootstrapOptions));
  const without = unwrapOk(
    buildModulesBootstrapWith(entry, { ...defaultBootstrapOptions, docs: false }),
  );
  expect(withDocs[0]?.js).toContain("Doubles.");
  expect(without[0]?.js).not.toContain("Doubles.");
});
