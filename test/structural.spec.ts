// Structural eq/compare — the pragmatic bridge for "abstraction over types"
// (CRITIQUE §2.1): polymorphic deep-equal / deep-order implemented in the
// runtime, no typeclasses, no hidden dictionaries. Plus the eq/compare-driven
// Array ops and the -By family (explicit projection = dictionary-passing by hand).
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { unwrapOk } from "@onrails/result";
import { check } from "../src/check";
import { compile } from "../src/compile";
import { inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeEnv, preludeNamespaces } from "../src/prelude";

const run = (src: string, ret: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function("match", `${js}\nreturn ${ret};`)(match);
};

const schemeOf = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  const env = unwrapOk(
    inferProgram(prog, preludeEnv, { open: true, namespaces: preludeNamespaces }),
  );
  return showScheme(env.get(name)!);
};

const UNWRAP = "let unwrap = o => switch o {\n | Some(v) => v\n | None => 0\n}\n";

// ---- structural eq ---------------------------------------------------------

test("eq is polymorphic (a -> a -> bool)", () => {
  expect(schemeOf("let f = eq", "f").replace(/'t\d+/g, "'t")).toBe("'t -> 't -> bool");
});

test("eq compares primitives, strings, arrays, and records structurally", () => {
  expect(run("let a = eq(2, 2)", "a")).toBe(true);
  expect(run("let a = eq(2, 3)", "a")).toBe(false);
  expect(run('let a = eq("hi", "hi")', "a")).toBe(true);
  expect(run("let a = eq([1, 2, 3], [1, 2, 3])", "a")).toBe(true);
  expect(run("let a = eq([1, 2], [1, 3])", "a")).toBe(false);
  expect(run("let a = eq({ x: 1, y: 2 }, { x: 1, y: 2 })", "a")).toBe(true);
  expect(run("let a = eq({ x: 1, y: 2 }, { x: 1, y: 9 })", "a")).toBe(false);
});

// ---- structural compare ----------------------------------------------------

test("compare returns -1 | 0 | 1 across numbers and strings", () => {
  expect(run("let a = compare(1, 2)", "a")).toBe(-1);
  expect(run("let a = compare(2, 2)", "a")).toBe(0);
  expect(run("let a = compare(2, 1)", "a")).toBe(1);
  expect(run('let a = compare("b", "a")', "a")).toBe(1);
});

// ---- eq/compare-driven Array ops -------------------------------------------

test("Array.contains uses structural equality (works on records)", () => {
  expect(run("let a = Array.contains(2)([1, 2, 3])", "a")).toBe(true);
  expect(run("let a = Array.contains(9)([1, 2, 3])", "a")).toBe(false);
  expect(run("let a = Array.contains({ id: 2 })([{ id: 1 }, { id: 2 }])", "a")).toBe(true);
});

test("Array.sort / sortBy", () => {
  expect(run("let a = Array.sort([3, 1, 2])", "a")).toEqual([1, 2, 3]);
  expect(run('let a = Array.sort(["c", "a", "b"])', "a")).toEqual(["a", "b", "c"]);
  expect(run("let neg = x => negate(x)\nlet a = Array.sortBy(neg)([1, 3, 2])", "a")).toEqual([
    3, 2, 1,
  ]);
});

test("Array.dedupe / dedupeBy", () => {
  expect(run("let a = Array.dedupe([1, 1, 2, 3, 3])", "a")).toEqual([1, 2, 3]);
  expect(run("let a = Array.dedupeBy(x => mod(x, 2))([1, 2, 3, 4])", "a")).toEqual([1, 2]);
});

test("Array.max / min / maxBy return Option (None on empty)", () => {
  expect(run(`${UNWRAP}let a = unwrap(Array.max([3, 1, 5, 2]))`, "a")).toBe(5);
  expect(run(`${UNWRAP}let a = unwrap(Array.min([3, 1, 5, 2]))`, "a")).toBe(1);
  expect(run(`${UNWRAP}let a = unwrap(Array.maxBy(x => negate(x))([3, 1, 5]))`, "a")).toBe(1);
  expect(run(`${UNWRAP}let a = unwrap(Array.max([]))`, "a")).toBe(0); // None -> fallback
});

// ---- codegen: no hidden dictionaries ---------------------------------------

test("eq stays a plain call — no dictionary argument threaded through", () => {
  const out = unwrapOk(compile("let same = xs => Array.contains(1)(xs)", { runtime: false }));
  expect(out).toContain("_Array_contains(1)");
  expect(out).not.toContain("dict");
});
