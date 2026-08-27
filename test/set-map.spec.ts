// Set and Map — backed by native JS Set/Map, so they erase to real
// `Set<a>`/`Map<k,v>` at the .d.ts boundary. Both are unordered → no
// destructuring; ops are qualified (`Set.union`, `Map.getOr`) and immutable.
// Empty Set is `Set.empty` (ADR 0080); `#{}` stays Map.
import { expect, test } from "bun:test";
import { check } from "@mochi/compiler/check";
import { compile } from "@mochi/compiler/compile";
import { emitDts } from "@mochi/compiler/dts";
import { inferProgram, showScheme } from "@mochi/compiler/infer";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { preludeEnv, preludeNamespaces } from "@mochi/compiler/prelude";
import { format } from "@mochi/dx/format";
import { compileJs } from "@mochi/test-support";
import { isErr, unwrapOk } from "@onrails/result";

const run = (src: string, ret: string): unknown => {
  const js = compileJs(src, { stripImports: true, runtime: true });
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

test("Set.fromArray builds a Set (deduped)", () => {
  expect(run("let a = Set.toArray(Set.fromArray([1, 2, 2, 3]))", "a")).toEqual([1, 2, 3]);
});

test("an empty Set has size 0", () => {
  expect(run("let a = Set.size(Set.fromArray([]))", "a")).toBe(0);
});

test("Set.empty is a polymorphic empty Set (ADR 0080)", () => {
  expect(run("let a = Set.size(Set.empty)", "a")).toBe(0);
  expect(run("let a = Set.toArray(Set.add(1, Set.empty))", "a")).toEqual([1]);
  expect(schemeOf("let s = Set.add(1, Set.empty)", "s")).toBe("Set<number>");
});

test("List.empty and Map.empty match the empty literals (ADR 0080)", () => {
  expect(run("let a = toArray(List.empty)", "a")).toEqual([]);
  expect(run("let a = Map.size(Map.empty)", "a")).toBe(0);
  expect(unwrapOk(compile("let xs = List.empty", { runtime: false }))).toContain(
    "_list(function* () {})",
  );
  expect(unwrapOk(compile("let m = Map.empty", { runtime: false }))).toContain("new Map()");
});

test("piping a List into unqualified map names List.map (ADR 0080)", () => {
  const r = compile("let xs = @{1, 2}\nlet ys = xs |> map(n => add(n, 1))");
  expect(isErr(r)).toBe(true);
  if (isErr(r)) expect(r.error[0]!.message).toContain("use List.map");
});

test("Set.has / add / delete / size", () => {
  expect(run("let a = Set.has(2)(Set.fromArray([1, 2, 3]))", "a")).toBe(true);
  expect(run("let a = Set.toArray(Set.add(9)(Set.fromArray([1])))", "a")).toEqual([1, 9]);
  expect(run("let a = Set.toArray(Set.delete(1)(Set.fromArray([1, 2])))", "a")).toEqual([2]);
  expect(run("let a = Set.size(Set.fromArray([1, 2, 3]))", "a")).toBe(3);
});

test("Set.union / intersect / diff", () => {
  const u = "Set.toArray(Set.union(Set.fromArray([1, 2]))(Set.fromArray([2, 3])))";
  const i = "Set.toArray(Set.intersect(Set.fromArray([1, 2, 3]))(Set.fromArray([2, 3, 4])))";
  const d = "Set.toArray(Set.diff(Set.fromArray([1, 2, 3]))(Set.fromArray([2])))";
  expect(run(`let a = ${u}`, "a")).toEqual([1, 2, 3]);
  expect(run(`let a = ${i}`, "a")).toEqual([2, 3]);
  expect(run(`let a = ${d}`, "a")).toEqual([1, 3]);
});

test("Set ops are immutable — the source Set is untouched", () => {
  const src = "let s = Set.fromArray([1, 2])\nlet grown = Set.add(3)(s)\nlet a = Set.size(s)";
  expect(run(src, "a")).toBe(2);
});

test("Set.fromArray infers as Set", () => {
  expect(schemeOf("let s = Set.fromArray([1, 2, 3])", "s")).toBe("Set<number>");
});

test("Set erases to a native Set in .d.ts", () => {
  expect(unwrapOk(emitDts("export let s = Set.fromArray([1, 2, 3])")).trim()).toBe(
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
  expect(isErr(compile('let m = #{ "a": 1, "b": "two" }'))).toBe(true);
});

// ---- codegen + formatting --------------------------------------------------

test("Map literal lowers to a native constructor; Set.fromArray to its runtime", () => {
  expect(unwrapOk(compile('let m = #{ "a": 1 }', { runtime: false }))).toContain(
    'new Map([["a", 1]])',
  );
  expect(unwrapOk(compile("let s = Set.fromArray([1, 2])", { runtime: false }))).toContain(
    "_Set_fromArray([1, 2])",
  );
  expect(unwrapOk(compile("let s = Set.empty", { runtime: false }))).toContain("new Set()");
});

test("Set.fromArray calls and Map literals survive formatting verbatim", () => {
  const src = 'let s = Set.fromArray([1, 2, 3])\nlet m = #{ "a": 1, "b": 2 }\n';
  expect(unwrapOk(format(src))).toBe(src);
});

// ---- structural eq/compare/show on Map/Set (C4 bug fix) --------------------
// `Object.keys` is `[]` for Map/Set, so the old deep walk made `eq`/`compare`
// treat any two Maps/Sets as equal and `show` printed `"[object Map]"`. These
// pin the fixed structural behaviour.

test("eq is true for two Maps with the same key/value pairs, false otherwise", () => {
  expect(run('let a = eq(#{ "x": 1 }, #{ "x": 1 })', "a")).toBe(true);
  expect(run('let a = eq(#{ "x": 1 }, #{ "y": 99 })', "a")).toBe(false);
});

test("eq on Map is order-independent", () => {
  expect(run('let a = eq(#{ "a": 1, "b": 2 }, #{ "b": 2, "a": 1 })', "a")).toBe(true);
});

test("eq is true for two Sets with the same elements, false otherwise", () => {
  expect(run("let a = eq(Set.fromArray([1, 2]), Set.fromArray([2, 1]))", "a")).toBe(true);
  expect(run("let a = eq(Set.fromArray([1, 2]), Set.fromArray([3]))", "a")).toBe(false);
});

test("compare on Map/Set is deterministic regardless of insertion order", () => {
  expect(run('let a = compare(#{ "a": 1, "b": 2 }, #{ "b": 2, "a": 1 })', "a")).toBe(0);
  expect(run("let a = compare(Set.fromArray([1, 2]), Set.fromArray([2, 1]))", "a")).toBe(0);
});

test("show on Map/Set round-trips the surface `#{...}` form", () => {
  expect(run('let a = show(#{ "x": 1 })', "a")).toBe('#{"x": 1}');
  expect(run("let a = show(Set.fromArray([1, 2]))", "a")).toBe("#{1, 2}");
  expect(run('let a = show(#{ "x": 1 })', "a")).not.toContain("[object");
  expect(run("let a = show(Set.fromArray([1, 2]))", "a")).not.toContain("[object");
});

test("eq/compare on a lazy List throw rather than silently lying", () => {
  expect(() => run("let a = eq(@{1, 2}, @{1, 2})", "a")).toThrow(/List/);
  expect(() => run("let a = compare(@{1, 2}, @{1, 2})", "a")).toThrow(/List/);
});

test("show on a lazy List does not force it — renders the `<List>` marker", () => {
  expect(run("let a = show(@{1, 2})", "a")).toBe("<List>");
});
