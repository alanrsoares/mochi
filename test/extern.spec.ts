// Gleam-style external bindings: `extern name : type = "module" "export"`.
import { expect, test } from "bun:test";
import { isErr, unwrapOk } from "@onrails/result";
import { check } from "../src/check";
import { compile } from "../src/compile";
import { format } from "../src/format";
import { inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeEnv } from "../src/prelude";

const js = (src: string): string => unwrapOk(compile(src));

const schemeOf = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  return showScheme(unwrapOk(inferProgram(prog, preludeEnv, {})).get(name)!);
};

test("an extern's declared type becomes its scheme", () => {
  expect(schemeOf(`extern sqrt : number -> number = "node:module" "sqrt"`, "sqrt")).toBe(
    "number -> number",
  );
});

test("lowercase names in a signature are generalized type variables", () => {
  // a -> a is polymorphic
  expect(schemeOf(`extern id : a -> a = "./u.js" "id"`, "id")).toMatch(/^'t\d+ -> 't\d+$/);
});

test("a same-named export emits a plain import", () => {
  expect(js(`extern sqrt : number -> number = "node:module" "sqrt"`)).toBe(
    `import { sqrt } from "node:module";\n`,
  );
});

test("a differently-named export emits an aliased import", () => {
  expect(js(`extern identity : a -> a = "./u.js" "id"`)).toBe(
    `import { id as identity } from "./u.js";\n`,
  );
});

test("an extern is usable and type-checked at its call sites", () => {
  const src = `extern triple : number -> number = "./u.js" "triple"\nlet a = triple(7)`;
  expect(isErr(compile(src))).toBe(false);
  expect(js(src)).toContain("const a = triple(7);");
});

test("calling an extern with the wrong argument type is a type error", () => {
  const src = `extern triple : number -> number = "./u.js" "triple"\nlet bad = triple("x")`;
  expect(isErr(compile(src))).toBe(true);
});

test("extern round-trips through the formatter", () => {
  const src = `extern  hypot:number->number->number="node:math"  "hypot"`;
  expect(unwrapOk(format(src))).toBe(
    `extern hypot : number -> number -> number = "node:math" "hypot"\n`,
  );
});
