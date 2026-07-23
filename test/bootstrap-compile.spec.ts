// Ticket 0005 — bootstrap/compile.mochi is the whole pipeline as one mochi
// function: string -> Result string Err. It runs check and infer as real
// gates. We eval the compiled compile.mochi with its five pass-imports and the
// five prelude-shim tables injected (the extern/import bindings become
// parameters), then assert:
//   1. a well-typed source emits the SAME JS as the TS `compile`;
//   2. a check error (non-exhaustive switch) yields an Err with a span, no JS;
//   3. a type error yields an Err with a span, no JS.

import { beforeAll, expect, test } from "bun:test";
import { join } from "node:path";
import { match } from "@onrails/pattern";
import { unwrapOk } from "@onrails/result";
import { compile as tsCompile } from "../src/compile";
import { bootstrapModuleJs } from "./support/bootstrap";

const root = join(import.meta.dir, "..");

type AlErr = { message: string; start: number; end: number };
type AlResult = { _tag: "Ok"; value: string } | { _tag: "Err"; error: AlErr };

const compileAl = bootstrapModuleJs;

const evalNames = <T extends Record<string, unknown>>(
  js: string,
  names: string[],
  extra: Record<string, unknown> = {},
): T => {
  const keys = ["match", ...Object.keys(extra)];
  const vals = [match, ...Object.values(extra)];
  return new Function(...keys, `"use strict";\n${js}\nreturn { ${names.join(", ")} };`)(
    ...vals,
  ) as T;
};

let alCompile: (src: string) => AlResult;

beforeAll(async () => {
  const shim = await import(join(root, "bootstrap/prelude.gen.js"));
  const { lex } = evalNames<{ lex: unknown }>(compileAl("bootstrap/lexer.mochi"), ["lex"]);
  const { parse } = evalNames<{ parse: unknown }>(compileAl("bootstrap/parser.mochi"), ["parse"]);
  const { check } = evalNames<{ check: unknown }>(compileAl("bootstrap/check.mochi"), ["check"]);
  const { inferProgram } = evalNames<{ inferProgram: unknown }>(
    compileAl("bootstrap/infer.mochi"),
    ["inferProgram"],
  );
  const { codegen } = evalNames<{ codegen: unknown }>(compileAl("bootstrap/codegen.mochi"), [
    "codegen",
  ]);
  alCompile = evalNames<{ compile: (s: string) => AlResult }>(
    compileAl("bootstrap/compile.mochi"),
    ["compile"],
    {
      lex,
      parse,
      check,
      inferProgram,
      codegen,
      builtins: shim.builtins,
      namespaces: shim.namespaces,
      namespaceRuntime: shim.namespaceRuntime,
      preludeJsDefs: shim.preludeJsDefs,
      runtimeDeps: shim.runtimeDeps,
    },
  ).compile;
});

test("well-typed source: bootstrap compile ≡ TS compile", () => {
  const src =
    "let twice = n => mul(n, 2)\ntype C = A | B\nlet f = c => switch c { | A => 1 | B => 2 }\n";
  const r = alCompile(src);
  expect(r._tag).toBe("Ok");
  if (r._tag === "Ok") expect(r.value).toBe(unwrapOk(tsCompile(src)));
});

test("check gate: non-exhaustive switch rejected with span, no JS", () => {
  const r = alCompile("type C = A | B\nlet f = c => switch c { | A => 1 }\n");
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") {
    expect(r.error.message).toContain("non-exhaustive");
    expect(r.error.end).toBeGreaterThan(r.error.start);
  }
});

test("infer gate: type error rejected with span, no JS", () => {
  const r = alCompile('let x = mul(1, "hi")\n');
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") {
    expect(r.error.message).toContain("unify");
    expect(r.error.end).toBeGreaterThan(r.error.start);
  }
});
