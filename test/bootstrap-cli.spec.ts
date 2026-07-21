// Ticket 0006 — the shipped `alangc` (bootstrap/cli.al) compiles a single .al
// file to a sibling .js through real disk IO, end-to-end under Bun. We build
// the bootstrap graph with the TS CLI once, then drive the emitted cli.js as a
// subprocess: a good file compiles (output byte-≡ the TS compiler and it runs),
// a bad file prints a `path:line:col` diagnostic, exits nonzero, and emits no JS.

import { afterAll, beforeAll, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unwrapOk } from "@onrails/result";
import { compile as tsCompile } from "../src/compile";

const root = join(import.meta.dir, "..");
const cliJs = join(root, "bootstrap/cli.js");

let dir: string;

// Run alangc; returns { code, stdout, stderr }. execFileSync throws on nonzero,
// so capture the error's status/stderr instead.
const runAlangc = (arg: string): { code: number; stderr: string } => {
  try {
    execFileSync("bun", [cliJs, arg], { cwd: root, encoding: "utf8" });
    return { code: 0, stderr: "" };
  } catch (e: unknown) {
    const err = e as { status?: number; stderr?: string };
    return { code: err.status ?? 1, stderr: err.stderr ?? "" };
  }
};

beforeAll(() => {
  // Build the shipped compiler graph (emits bootstrap/*.js beside the sources).
  execFileSync("bun", ["src/cli.ts", "build", "bootstrap/cli.al"], { cwd: root, encoding: "utf8" });
  dir = mkdtempSync(join(tmpdir(), "alang-cli-"));
});
afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

test("alangc compiles a good file to a sibling .js identical to the TS compiler", () => {
  const src =
    "let twice = n => mul(n, 2)\ntype C = A | B\nlet f = c => switch c { | A => 1 | B => 2 }\n";
  const al = join(dir, "good.al");
  const js = join(dir, "good.js");
  writeFileSync(al, src);

  const { code } = runAlangc(al);
  expect(code).toBe(0);
  expect(existsSync(js)).toBe(true);
  expect(readFileSync(js, "utf8")).toBe(unwrapOk(tsCompile(src)));

  // The emitted module is runnable under Bun (imports resolve, no throw).
  execFileSync("bun", [js], { cwd: root, encoding: "utf8" });
});

test("alangc rejects a bad file: line:col diagnostic, nonzero exit, no JS", () => {
  const al = join(dir, "bad.al");
  const js = join(dir, "bad.js");
  writeFileSync(al, "type C = A | B\nlet f = c => switch c { | A => 1 }\n");

  const { code, stderr } = runAlangc(al);
  expect(code).not.toBe(0);
  expect(stderr).toContain("bad.al:2:");
  expect(stderr).toContain("non-exhaustive");
  expect(existsSync(js)).toBe(false);
});
