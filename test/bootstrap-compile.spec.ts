// Ticket 0005 — packages/compiler/src/compile/compile.mochi is the whole pipeline as one mochi
// function: string -> Result string Err. It runs check and infer as real
// gates. We eval the compiled compile.mochi with its five pass-imports and the
// five prelude-shim tables injected (the extern/import bindings become
// parameters), then exercise successful emit and both error gates directly.

import { beforeAll, expect, test } from "bun:test";
import { join } from "node:path";
import { repoRoot } from "@mochi/test-support";
import { BOOTSTRAP_BUILD_HOOK_MS, bootstrapModuleJs } from "@mochi/test-support/bootstrap";
import { match } from "@onrails/pattern";

const root = repoRoot(import.meta.url);

type AlErr = { message: string; start: number; end: number };
type AlResult = { _tag: "Ok"; value: string } | { _tag: "Err"; error: AlErr[] };

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
  const shim = await import(join(root, "packages/compiler/src/prelude/prelude.gen.mjs"));
  const { lex } = evalNames<{ lex: unknown }>(
    compileAl("packages/compiler/src/lexer/lexer.mochi"),
    ["lex"],
  );
  const { parseRecovering } = evalNames<{ parseRecovering: unknown }>(
    compileAl("packages/compiler/src/parser/parser.mochi"),
    ["parseRecovering"],
  );
  const { checkAll } = evalNames<{ checkAll: unknown }>(
    compileAl("packages/compiler/src/check/check.mochi"),
    ["checkAll"],
  );
  const { inferProgramWith, inferProgramTypesWith } = evalNames<{
    inferProgramWith: unknown;
    inferProgramTypesWith: unknown;
  }>(compileAl("packages/compiler/src/infer/infer.mochi"), [
    "inferProgramWith",
    "inferProgramTypesWith",
  ]);
  const { codegenWith, jsGenOpts } = evalNames<{ codegenWith: unknown; jsGenOpts: unknown }>(
    compileAl("packages/compiler/src/codegen/codegen.mochi"),
    ["codegenWith", "jsGenOpts"],
  );
  alCompile = evalNames<{ compile: (s: string) => AlResult }>(
    compileAl("packages/compiler/src/compile/compile.mochi"),
    ["compile"],
    {
      lex,
      parseRecovering,
      checkAll,
      inferProgramWith,
      inferProgramTypesWith,
      codegenWith,
      jsGenOpts,
      builtins: shim.builtins,
      namespaces: shim.namespaces,
      namespaceRuntime: shim.namespaceRuntime,
      preludeJsDefs: shim.preludeJsDefs,
      runtimeDeps: shim.runtimeDeps,
    },
  ).compile;
}, BOOTSTRAP_BUILD_HOOK_MS);

test("well-typed source emits JavaScript", () => {
  const src =
    "let twice = n => mul(n, 2)\ntype C = A | B\nlet f = c => switch c { | A => 1 | B => 2 }\n";
  const r = alCompile(src);
  expect(r._tag).toBe("Ok");
  if (r._tag === "Ok") {
    expect(r.value).toContain("const twice");
    expect(r.value).toContain('._tag === "A"');
  }
});

test("check gate: non-exhaustive switch rejected with span, no JS", () => {
  const r = alCompile("type C = A | B\nlet f = c => switch c { | A => 1 }\n");
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") {
    expect(r.error[0]!.message).toContain("non-exhaustive");
    expect(r.error[0]!.end).toBeGreaterThan(r.error[0]!.start);
  }
});

test("check gate: independent errors are collected", () => {
  const r = alCompile(
    "type C = A | B\nlet f = c => switch c { | A => 1 }\nlet g = c => switch c { | B => 2 }\n",
  );
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") expect(r.error).toHaveLength(2);
});

test("infer gate: type error rejected with span, no JS", () => {
  const r = alCompile('let x = mul(1, "hi")\n');
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") {
    expect(r.error[0]!.message).toContain("unify");
    expect(r.error[0]!.end).toBeGreaterThan(r.error[0]!.start);
  }
});

test("let? Option bind emits its Option branch (ADR 0079)", () => {
  const src = "let r = let? x = Some(20) in Some(add(x, 1))\n";
  const r = alCompile(src);
  expect(r._tag).toBe("Ok");
  if (r._tag === "Ok") expect(r.value).toContain("_Option_flatMap");
});

test("let? tyvar defaults to Result (ADR 0079)", () => {
  const src = "let f = x => let? y = x in Ok(y)\n";
  const r = alCompile(src);
  expect(r._tag).toBe("Ok");
  if (r._tag === "Ok") expect(r.value).toContain("_Result_flatMap");
});

test("Set.empty compiles through the bootstrap prelude (ADR 0080)", () => {
  const src = "let s = Set.add(1, Set.empty)\n";
  const r = alCompile(src);
  expect(r._tag).toBe("Ok");
  if (r._tag === "Ok") expect(r.value).toContain("new Set()");
});
