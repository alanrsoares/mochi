// Set (`${…}`) and Map (`#{…}`) — backed by native JS Set/Map, so they erase to
// real `Set<a>`/`Map<k,v>` at the .d.ts boundary. Both are unordered, so there's
// no destructuring; ops are qualified (`Set.union`, `Map.getOr`) and immutable.
import { expect, test } from "bun:test";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { check } from "../src/check";
import { compile } from "../src/compile";
import { emitDts } from "../src/dts";
import { format } from "../src/format";
import { inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeEnv, preludeNamespaces } from "../src/prelude";

const run = (src: string, ret: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function(`${js}\nreturn ${ret};`)();
};

const schemeOf = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  const env = unwrapOk(
    inferProgram(prog, preludeEnv, { open: true, namespaces: preludeNamespaces }),
  );
  return showScheme(env.get(name)!);
};

// ---- Set -------------------------------------------------------------------

test("a `${…}` literal builds a Set (deduped)", () => {
  expect(run("let a = Set.toArray(${1, 2, 2, 3})", "a")).toEqual([1, 2, 3]);
});

test("`${}` is the empty Set", () => {
  expect(run("let a = Set.size(${})", "a")).toBe(0);
});

test("Set.has / add / delete / size", () => {
  expect(run("let a = Set.has(2)(${1, 2, 3})", "a")).toBe(true);
  expect(run("let a = Set.toArray(Set.add(9)(${1}))", "a")).toEqual([1, 9]);
  expect(run("let a = Set.toArray(Set.delete(1)(${1, 2}))", "a")).toEqual([2]);
  expect(run("let a = Set.size(${1, 2, 3})", "a")).toBe(3);
});

test("Set.union / intersect / diff", () => {
  expect(run("let a = Set.toArray(Set.union(${1, 2})(${2, 3}))", "a")).toEqual([1, 2, 3]);
  expect(run("let a = Set.toArray(Set.intersect(${1, 2, 3})(${2, 3, 4}))", "a")).toEqual([2, 3]);
  expect(run("let a = Set.toArray(Set.diff(${1, 2, 3})(${2}))", "a")).toEqual([1, 3]);
});

test("Set ops are immutable — the source Set is untouched", () => {
  const src = "let s = ${1, 2}\nlet grown = Set.add(3)(s)\nlet a = Set.size(s)";
  expect(run(src, "a")).toBe(2);
});

test("a `${…}` literal infers as Set", () => {
  expect(schemeOf("let s = ${1, 2, 3}", "s")).toBe("Set<number>");
});

test("Set erases to a native Set in .d.ts", () => {
  expect(unwrapOk(emitDts("export let s = ${1, 2, 3}")).trim()).toBe(
    "export declare const s: Set<number>;",
  );
});

// ---- Map -------------------------------------------------------------------

test("a `#{…}` literal builds a Map; getOr reads a present key", () => {
  expect(run('let a = Map.getOr(0)("a")(#{ "a": 1, "b": 2 })', "a")).toBe(1);
});

test("Map.getOr returns the fallback for a missing key", () => {
  expect(run('let a = Map.getOr(99)("z")(#{ "a": 1 })', "a")).toBe(99);
});

test("`#{}` is the empty Map", () => {
  expect(run("let a = Map.size(#{})", "a")).toBe(0);
});

test("Map.set / delete / has / size", () => {
  expect(run('let a = Map.getOr(0)("x")(Map.set("x")(7)(#{}))', "a")).toBe(7);
  expect(run('let a = Map.has("a")(Map.delete("a")(#{ "a": 1 }))', "a")).toBe(false);
  expect(run('let a = Map.has("a")(#{ "a": 1 })', "a")).toBe(true);
  expect(run('let a = Map.size(#{ "a": 1, "b": 2 })', "a")).toBe(2);
});

test("Map.keys / values", () => {
  expect(run('let a = Map.keys(#{ "a": 1, "b": 2 })', "a")).toEqual(["a", "b"]);
  expect(run('let a = Map.values(#{ "a": 1, "b": 2 })', "a")).toEqual([1, 2]);
});

test("Map ops are immutable — the source Map is untouched", () => {
  const src = 'let m = #{ "a": 1 }\nlet m2 = Map.set("b")(2)(m)\nlet a = Map.size(m)';
  expect(run(src, "a")).toBe(1);
});

test("a `#{…}` literal infers as Map k v", () => {
  expect(schemeOf('let m = #{ "a": 1 }', "m")).toBe("Map<string, number>");
});

test("Map erases to a native Map in .d.ts", () => {
  expect(unwrapOk(emitDts('export let m = #{ "a": 1 }')).trim()).toBe(
    "export declare const m: Map<string, number>;",
  );
});

// ---- type distinctness -----------------------------------------------------

test("Set is distinct from Array", () => {
  expect(isErr(compile("let a = Set.has(1)([1, 2, 3])"))).toBe(true);
});

test("Map keys and values are homogeneous", () => {
  // second entry's value is a string, first is a number → value unification fails
  const r = compile('let m = #{ "a": 1, "b": "two" }');
  expect(isErr(r)).toBe(true);
});

// ---- codegen + formatting --------------------------------------------------

test("literals lower to native constructors", () => {
  expect(unwrapOk(compile("let s = ${1, 2}", { runtime: false }))).toContain("new Set([1, 2])");
  expect(unwrapOk(compile('let m = #{ "a": 1 }', { runtime: false }))).toContain(
    'new Map([["a", 1]])',
  );
});

test("Set/Map literals survive formatting verbatim", () => {
  const src = 'let s = ${1, 2, 3}\nlet m = #{ "a": 1, "b": 2 }\n';
  expect(unwrapOk(format(src))).toBe(src);
});
