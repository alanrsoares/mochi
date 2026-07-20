// Prelude extension: Math (unqualified builtins), String ops (`Str.*`), and the
// grown eager-Array namespace (`Array.reverse/concat/…`). All immutable.
import { expect, test } from "bun:test";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";

const run = (src: string, ret: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function(`${js}\nreturn ${ret};`)();
};

// ---- Math ------------------------------------------------------------------

test("min / max / abs / negate", () => {
  expect(run("let a = min(3, 5)", "a")).toBe(3);
  expect(run("let a = max(3, 5)", "a")).toBe(5);
  expect(run("let a = abs(negate(4))", "a")).toBe(4);
});

test("pow / mod (true modulo) / floor / ceil / round / sign", () => {
  expect(run("let a = pow(2, 10)", "a")).toBe(1024);
  expect(run("let a = mod(negate(1), 3)", "a")).toBe(2); // true modulo, not JS %
  expect(run("let a = floor(3.7)", "a")).toBe(3);
  expect(run("let a = ceil(3.2)", "a")).toBe(4);
  expect(run("let a = round(3.5)", "a")).toBe(4);
  expect(run("let a = sign(negate(9))", "a")).toBe(-1);
});

// ---- String (Str.*) --------------------------------------------------------

test("Str.split / join round-trip", () => {
  expect(run('let a = Str.split(",")("a,b,c")', "a")).toEqual(["a", "b", "c"]);
  expect(run('let a = Str.join("-")(["a", "b", "c"])', "a")).toBe("a-b-c");
});

test("Str.toUpper / toLower / trim", () => {
  expect(run('let a = Str.toUpper("hi")', "a")).toBe("HI");
  expect(run('let a = Str.toLower("HI")', "a")).toBe("hi");
  expect(run('let a = Str.trim("  x  ")', "a")).toBe("x");
});

test("Str.contains / startsWith / endsWith", () => {
  expect(run('let a = Str.contains("ell")("hello")', "a")).toBe(true);
  expect(run('let a = Str.startsWith("he")("hello")', "a")).toBe(true);
  expect(run('let a = Str.endsWith("lo")("hello")', "a")).toBe(true);
});

test("Str.slice / replace / length", () => {
  expect(run('let a = Str.slice(1)(4)("hello")', "a")).toBe("ell");
  expect(run('let a = Str.replace("l")("L")("hello")', "a")).toBe("heLLo");
  expect(run('let a = Str.length("hello")', "a")).toBe(5);
});

test("Str ops compose in a pipeline", () => {
  const src = 'let a = "  Hello World  " |> Str.trim |> Str.toLower |> Str.split(" ")';
  expect(run(src, "a")).toEqual(["hello", "world"]);
});

// ---- Array growth ----------------------------------------------------------

test("Array.reverse / concat / append", () => {
  expect(run("let a = Array.reverse([1, 2, 3])", "a")).toEqual([3, 2, 1]);
  expect(run("let a = Array.concat([1])([2, 3])", "a")).toEqual([1, 2, 3]);
  expect(run("let a = Array.append(9)([1, 2])", "a")).toEqual([1, 2, 9]);
});

test("Array.flatMap / take / drop / tail", () => {
  expect(run("let dup = x => [x, x]\nlet a = Array.flatMap(dup)([1, 2])", "a")).toEqual([
    1, 1, 2, 2,
  ]);
  expect(run("let a = Array.take(2)([1, 2, 3, 4])", "a")).toEqual([1, 2]);
  expect(run("let a = Array.drop(2)([1, 2, 3, 4])", "a")).toEqual([3, 4]);
  expect(run("let a = Array.tail([1, 2, 3])", "a")).toEqual([2, 3]);
});

test("Array growth is immutable — the source array is untouched", () => {
  const src = "let xs = [1, 2, 3]\nlet ys = Array.append(4)(xs)\nlet a = Array.length(xs)";
  expect(run(src, "a")).toBe(3);
});

// ---- reserved namespace ----------------------------------------------------

test("Str is a reserved namespace name", () => {
  const r = compile("let Str = 1");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).message).toContain("reserved collection namespace");
});
