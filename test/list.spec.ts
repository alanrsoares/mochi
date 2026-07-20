import { expect, test } from "bun:test";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { check } from "../src/check";
import { compile } from "../src/compile";
import { format } from "../src/format";
import { inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeEnv } from "../src/prelude";

const js = (src: string): string => unwrapOk(compile(src, { runtime: false }));

const schemeOf = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  const env = unwrapOk(inferProgram(prog, preludeEnv, { open: true }));
  return showScheme(env.get(name)!);
};

test("a list literal lowers to a JS array", () => {
  expect(js("let xs = [1, 2, 3]")).toBe("const xs = [1, 2, 3];\n");
});

test("an empty list lowers to []", () => {
  expect(js("let xs = []")).toBe("const xs = [];\n");
});

test("a homogeneous list infers List<elem>", () => {
  expect(schemeOf("let xs = [1, 2, 3]", "xs")).toBe("[number]");
});

test("an empty list is polymorphic", () => {
  expect(schemeOf("let xs = []", "xs")).toMatch(/^\['t\d+\]$/);
});

test("a nested list infers a list of lists", () => {
  expect(schemeOf("let xss = [[1], [2, 3]]", "xss")).toBe("[[number]]");
});

test("a heterogeneous list is a type error", () => {
  const r = compile("let bad = [1, true]");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).kind).toBe("type");
});

test("[T] type syntax parses in an extern signature", () => {
  const scheme = schemeOf('extern head : [a] -> a = "./h" "head"\nlet f = head', "f");
  expect(scheme).toMatch(/^\['t\d+\] -> 't\d+$/);
});

test("a list literal survives formatting verbatim", () => {
  expect(unwrapOk(format("let xs = [1, 2, 3]\n"))).toBe("let xs = [1, 2, 3]\n");
});

test("[T] type syntax survives formatting", () => {
  const src = 'extern head : [a] -> a = "./h" "head"\n';
  expect(unwrapOk(format(src))).toBe(src);
});

test("a list literal runs standalone", () => {
  const out = unwrapOk(compile("let xs = [1, 2, 3]"));
  const xs = new Function(`${out}\nreturn xs;`)();
  expect(xs).toEqual([1, 2, 3]);
});
