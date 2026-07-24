// Ticket 0001 — host IO FFI shims (readFile / writeFile / argv / print) reach
// mochi through `extern` and thread through the type checker. The demo
// `bootstrap/io-demo.mochi` compiles clean (proving the signatures typecheck) and,
// run against the real `bootstrap/host.js` shims, copies a file on disk.

import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { match } from "@onrails/pattern";
import { unwrapOk } from "@onrails/result";
import * as host from "../bootstrap/host.mjs";
import { compile } from "../src/compile";

const root = join(import.meta.dir, "..");

type AlResult = { _tag: "Ok"; value: string } | { _tag: "Err"; error: string };

// Compile io-demo.mochi, drop the extern `import` (injected as params instead),
// and eval. All prelude runtime (Array.get, Some/None, Str.concat…) is inlined
// by `compile` with useRuntime on; only the host externs are imports.
// Multi-arg externs lower to `import { f as $f }` + `const f = _curry(n, $f)`, so
// inject the raw host under `$writeFile` and leave the wrap in place.
const buildDemo = (): { run: (args: string[]) => AlResult } => {
  const js = unwrapOk(compile(readFileSync(join(root, "bootstrap/io-demo.mochi"), "utf8")))
    .replace(/^import .*$/gm, "") // host externs + match lib injected as params
    .replace(/^export /gm, "");
  return new Function(
    "match",
    "readFile",
    "$writeFile",
    "argv",
    "print",
    `"use strict";\n${js}\nreturn { run };`,
  )(match, host.readFile, host.writeFile, [], host.print) as { run: (args: string[]) => AlResult };
};

let dir: string;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "mochi-io-"));
});
afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

test("io-demo copies a file through the host shims", () => {
  const src = join(dir, "src.txt");
  const dst = join(dir, "dst.txt");
  writeFileSync(src, "hello mochi IO\n");

  const r = buildDemo().run([src, dst]);
  expect(r._tag).toBe("Ok");
  if (r._tag === "Ok") expect(r.value).toBe(dst);
  expect(readFileSync(dst, "utf8")).toBe("hello mochi IO\n");
});

test("io-demo surfaces a read failure as Err", () => {
  const r = buildDemo().run([join(dir, "does-not-exist"), join(dir, "out.txt")]);
  expect(r._tag).toBe("Err");
});

test("io-demo rejects a missing argument with a usage Err", () => {
  const r = buildDemo().run([join(dir, "only-one")]);
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") expect(r.error).toContain("usage");
});

test("host shims expose the expected surface", () => {
  expect(typeof host.readFile).toBe("function");
  expect(typeof host.writeFile).toBe("function");
  expect(typeof host.print).toBe("function");
  expect(Array.isArray(host.argv)).toBe(true);
});
