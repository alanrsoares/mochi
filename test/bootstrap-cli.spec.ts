// Ticket 0006 — the shipped `mochic` (bootstrap/cli.mochi) compiles a single .mochi
// file to a sibling .js through real disk IO, end-to-end under Bun. We build
// the bootstrap graph with the TS CLI once, then drive the emitted cli.js as a
// subprocess: a good file compiles (output byte-≡ the TS compiler and it runs),
// a bad file prints a `path:line:col` diagnostic, exits nonzero, and emits no JS.

import { afterAll, beforeAll, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { unwrapOk } from "@onrails/result";
import { compile as tsCompile } from "../src/compile";
import { buildModules as tsBuild } from "../src/module";

const root = join(import.meta.dir, "..");
const cliJs = join(root, "bootstrap/cli.js");

let dir: string;

// Run mochic; returns { code, stdout, stderr }. execFileSync throws on nonzero,
// so capture the error's status/stderr instead.
const runArgs = (...args: string[]): { code: number; stderr: string } => {
  try {
    execFileSync("bun", [cliJs, ...args], { cwd: root, encoding: "utf8" });
    return { code: 0, stderr: "" };
  } catch (e: unknown) {
    const err = e as { status?: number; stderr?: string };
    return { code: err.status ?? 1, stderr: err.stderr ?? "" };
  }
};
const runAlangc = (arg: string): { code: number; stderr: string } => runArgs(arg);

beforeAll(() => {
  // Build the shipped compiler graph (emits bootstrap/*.js beside the sources).
  execFileSync("bun", ["src/cli.ts", "build", "bootstrap/cli.mochi"], {
    cwd: root,
    encoding: "utf8",
  });
  dir = mkdtempSync(join(tmpdir(), "mochi-cli-"));
});
afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

test("mochic compiles a good file to a sibling .js identical to the TS compiler", () => {
  const src =
    "let twice = n => mul(n, 2)\ntype C = A | B\nlet f = c => switch c { | A => 1 | B => 2 }\n";
  const al = join(dir, "good.mochi");
  const js = join(dir, "good.js");
  writeFileSync(al, src);

  const { code } = runAlangc(al);
  expect(code).toBe(0);
  expect(existsSync(js)).toBe(true);
  expect(readFileSync(js, "utf8")).toBe(unwrapOk(tsCompile(src)));

  // The emitted module is runnable under Bun (imports resolve, no throw).
  execFileSync("bun", [js], { cwd: root, encoding: "utf8" });
});

test("mochic rejects a bad file: line:col diagnostic, nonzero exit, no JS", () => {
  const al = join(dir, "bad.mochi");
  const js = join(dir, "bad.js");
  writeFileSync(al, "type C = A | B\nlet f = c => switch c { | A => 1 }\n");

  const { code, stderr } = runAlangc(al);
  expect(code).not.toBe(0);
  expect(stderr).toContain("bad.mochi:2:");
  expect(stderr).toContain("non-exhaustive");
  expect(existsSync(js)).toBe(false);
});

// ---- `mochic build <entry>` — the multi-module driver (ticket 0013) --------

test("mochic build compiles a module graph, byte-≡ the TS driver, and runs", async () => {
  const lib =
    "export type Shape = Circle(r: number) | Square(s: number)\nexport let area = s => switch s { | Circle(r) => mul(r, r) | Square(s) => mul(s, s) }\n";
  // Imports Shape's ctors AND switches over them — the switch is only
  // exhaustiveness-checkable with lib's registry threaded across the boundary.
  const app =
    'import { Circle, Square, area } from "./lib"\nlet sides = s => switch s { | Circle(r) => 1 | Square(w) => 2 }\nlet demo = area(Circle(3))\nlet d2 = sides(Square(4))\n';
  writeFileSync(join(dir, "lib.mochi"), lib);
  writeFileSync(join(dir, "app.mochi"), app);

  const { code } = runArgs("build", join(dir, "app.mochi"));
  expect(code).toBe(0);
  expect(existsSync(join(dir, "lib.js"))).toBe(true);
  expect(existsSync(join(dir, "app.js"))).toBe(true);

  // Byte-identical to the TS module driver, per module.
  const ts = await tsBuild(join(dir, "app.mochi"), (p) => Bun.file(p).text());
  const tsBy = new Map(unwrapOk(ts).map((o) => [basename(o.path), o.js]));
  expect(readFileSync(join(dir, "lib.js"), "utf8")).toBe(tsBy.get("lib.mochi") ?? "");
  expect(readFileSync(join(dir, "app.js"), "utf8")).toBe(tsBy.get("app.mochi") ?? "");

  // The emitted graph runs under Bun (app imports from lib, resolves, no throw).
  execFileSync("bun", [join(dir, "app.js")], { cwd: root, encoding: "utf8" });
});

test("mochic build fails on a cross-module exhaustiveness gap, writes nothing", () => {
  writeFileSync(join(dir, "shp.mochi"), "export type T = A | B\n");
  // Missing the B arm — only catchable via shp's imported registry.
  writeFileSync(
    join(dir, "bad2.mochi"),
    'import { A, B } from "./shp"\nlet f = t => switch t { | A => 1 }\n',
  );
  const { code, stderr } = runArgs("build", join(dir, "bad2.mochi"));
  expect(code).not.toBe(0);
  expect(stderr).toContain("non-exhaustive");
  expect(existsSync(join(dir, "bad2.js"))).toBe(false);
});
