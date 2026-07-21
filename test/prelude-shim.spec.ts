// Ticket 0004 — the generated prelude shim `bootstrap/prelude.gen.js` gives the
// shipped self-hosted compiler its five prelude tables with no `src/` import.
//
// Two guards:
//  1. PARITY — regenerating from src/prelude.ts (+ infer.al's Ty shape) must
//     reproduce the checked-in shim byte-for-byte. Edit prelude.ts without
//     running `bun run gen:prelude` and this fails (PATH §6: never fork the
//     prelude).
//  2. SHAPE — the shim's tables actually drive the compiled bootstrap inferrer
//     and code generator: a tiny program infers a principal type and emits JS.

import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { match } from "@onrails/pattern";
import { unwrapOk } from "@onrails/result";
import { buildShimSource, SHIM_PATH } from "../scripts/gen-prelude";
import { compile } from "../src/compile";

const root = join(import.meta.dir, "..");

test("prelude shim is up to date (regenerate matches checked-in file)", () => {
  const onDisk = readFileSync(join(root, SHIM_PATH), "utf8");
  expect(buildShimSource()).toEqual(onDisk);
});

// --- compile + eval a bootstrap module, wiring in the shim by name ---
type AlResult = { _tag: "Ok"; value: unknown } | { _tag: "Err"; error: { message: string } };

const compileAl = (path: string): string =>
  unwrapOk(compile(readFileSync(join(root, path), "utf8")))
    .replace(/^import .*$/gm, "")
    .replace(/^export /gm, "");

const evalNames = <T extends Record<string, unknown>>(js: string, names: string[]): T =>
  new Function("match", `"use strict";\n${js}\nreturn { ${names.join(", ")} };`)(match) as T;

test("shim tables drive the compiled inferrer and codegen", async () => {
  const shim = await import(join(root, SHIM_PATH));

  const { lex } = evalNames<{ lex: (s: string) => AlResult }>(compileAl("bootstrap/lexer.al"), [
    "lex",
  ]);
  const { parse } = evalNames<{ parse: (t: unknown) => AlResult }>(
    compileAl("bootstrap/parser.al"),
    ["parse"],
  );
  const { inferProgram } = evalNames<{
    inferProgram: (
      stmts: unknown,
      builtins: Map<string, unknown>,
      namespaces: Map<string, Map<string, unknown>>,
      openMode: boolean,
    ) => AlResult;
  }>(compileAl("bootstrap/infer.al"), ["inferProgram"]);
  const { codegen } = evalNames<{
    codegen: (
      stmts: unknown,
      imported: Map<string, string[]>,
      useRuntime: boolean,
      ns: Map<string, Map<string, string>>,
      jsDefs: Map<string, string>,
      deps: Map<string, string[]>,
    ) => string;
  }>(compileAl("bootstrap/codegen.al"), ["codegen"]);

  const lr = lex("let twice = n => mul(n, 2)\n");
  const pr = parse(unwrapOk(lr as never));
  const stmts = unwrapOk(pr as never);

  // Inference: builtins + namespaces from the shim yield an Ok scheme.
  const ir = inferProgram(stmts, shim.builtins, shim.namespaces, true);
  expect(ir._tag).toBe("Ok");

  // Codegen: the three runtime tables from the shim emit runnable JS.
  const js = codegen(
    stmts,
    new Map(),
    true,
    shim.namespaceRuntime,
    shim.preludeJsDefs,
    shim.runtimeDeps,
  );
  expect(js).toContain("twice");
  expect(js).toContain("mul");
});
