// Boolean literals and patterns.
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import { check } from "../src/check";
import { compile } from "../src/compile";
import { inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeEnv } from "../src/prelude";

const js = (src: string): string => unwrapOk(compile(src));

const schemeOf = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  return showScheme(unwrapOk(inferProgram(prog, preludeEnv, { open: true })).get(name)!);
};

const run = (src: string, ret: string): unknown => {
  // runtime off: this harness injects its own `gt`, so keep output prelude-free.
  const body = unwrapOk(compile(src, { runtime: false })).replace(/^import .*$/m, "");
  return new Function("match", "gt", `${body}\nreturn ${ret};`)(
    match,
    (a: number, b: number) => a > b,
  );
};

test("boolean literals compile to JS booleans", () => {
  expect(js("let t = true\nlet f = false")).toBe("const t = true;\nconst f = false;\n");
});

test("a boolean literal has type bool", () => {
  expect(schemeOf("let t = true", "t")).toBe("bool");
});

test("switching on both boolean cases is exhaustive without a catch-all", () => {
  expect(isErr(compile("let f = b => switch b { | true => 1 | false => 0 }"))).toBe(false);
});

test("a boolean switch missing a case is non-exhaustive", () => {
  expect(isErr(compile("let f = b => switch b { | true => 1 }"))).toBe(true);
});

test("boolean arms lower to literal .with(true/false, ...)", () => {
  const out = js("let f = b => switch b { | true => 1 | false => 0 }");
  expect(out).toContain(".with(true, () => 1)");
  expect(out).toContain(".with(false, () => 0)");
});

test("a predicate-driven branch runs", () => {
  const src = "let sign = n => switch gt(n, 0) { | true => 1 | false => 0 }\nlet a = sign(5)";
  expect(run(src, "a")).toBe(1);
});
