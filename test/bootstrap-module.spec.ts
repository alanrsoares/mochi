// Ticket 0013 (part a) — bootstrap/module.al's graph loader. We compile the
// loader (open-world, like every bootstrap module) plus its dep graph to JS,
// then drive the emitted `loadGraph` in-process: it must order modules by
// dependency, detect cycles, and report an unreadable file — matching the TS
// `src/module.ts` driver's verdicts. Scheme/registry threading is parts (b)/(c).

import { afterAll, beforeAll, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { unwrapOk } from "@onrails/result";
import { buildModules } from "../src/module";

const root = join(import.meta.dir, "..");

// The emitted loader's return shape (alang `Result` runtime tags).
type Loaded = { path: string; stmts: unknown[] };
type MErr = { message: string; start: number; end: number };
type Res = { _tag: "Ok"; value: Loaded[] } | { _tag: "Err"; error: MErr };
let loadGraph: (entry: string) => Res;
let dir: string;

const names = (r: Res): string[] => (r._tag === "Ok" ? r.value.map((m) => basename(m.path)) : []);

beforeAll(async () => {
  // Build the whole graph closed-world; it emits bootstrap/module.js (which
  // imports ast/types/lexer/parser) beside its deps. Import it in-process.
  execFileSync("bun", ["src/cli.ts", "build", "bootstrap/cli.al"], { cwd: root });
  ({ loadGraph } = (await import(join(root, "bootstrap/module.js"))) as {
    loadGraph: typeof loadGraph;
  });
  dir = mkdtempSync(join(tmpdir(), "alang-mod-"));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

test("orders a real graph so every dependency precedes its dependent", () => {
  const r = loadGraph("bootstrap/cli.al");
  expect(r._tag).toBe("Ok");
  const order = names(r);
  expect(order.at(-1)).toBe("cli.al"); // entry compiles last
  const before = (a: string, b: string) => order.indexOf(a) < order.indexOf(b);
  expect(before("lexer.al", "parser.al")).toBe(true);
  expect(before("compile.al", "cli.al")).toBe(true);
  expect(before("infer.al", "compile.al")).toBe(true);
});

test("dependency order matches the TS buildModules driver on examples/modules", async () => {
  const entry = "examples/modules/main.al";
  const ts = unwrapOk(await buildModules(entry, (p) => Bun.file(p).text()));
  const tsOrder = ts.map((o) => basename(o.path));
  expect(names(loadGraph(entry))).toEqual(tsOrder);
});

test("reports an unreadable module (no throw, Err verdict)", () => {
  const r = loadGraph("bootstrap/nope.al");
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") expect(r.error.message).toContain("cannot read module");
});

test("detects an import cycle instead of looping", () => {
  writeFileSync(join(dir, "a.al"), 'import { b } from "./b"\nexport let a = b\n');
  writeFileSync(join(dir, "b.al"), 'import { a } from "./a"\nexport let b = a\n');
  const r = loadGraph(join(dir, "a.al"));
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") expect(r.error.message).toContain("import cycle through");
});

test("the loader itself compiles clean (open-world) and is importable", () => {
  // Guards the beforeAll wiring: a bad emit would have thrown above, but assert
  // the symbol is really a function so a silent shape change is caught.
  expect(typeof loadGraph).toBe("function");
});
