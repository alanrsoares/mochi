// Prelude extension: Math (unqualified builtins), String ops (`Str.*`), and the
// grown eager-Array namespace (`Array.reverse/concat/…`). All immutable.
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";

const run = (src: string, ret: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function("match", `${js}\nreturn ${ret};`)(match);
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

test("Str.concat concatenates (data-first, like Array.concat)", () => {
  expect(run('let a = Str.concat("foo")("bar")', "a")).toBe("foobar");
  expect(run('let a = "world" |> Str.concat("hello ")', "a")).toBe("hello world");
});

test("Str ops compose in a pipeline", () => {
  const src = 'let a = "  Hello World  " |> Str.trim |> Str.toLower |> Str.split(" ")';
  expect(run(src, "a")).toEqual(["hello", "world"]);
});

// ---- Array growth ----------------------------------------------------------

test("Array.reverse / concat / append / prepend", () => {
  expect(run("let a = Array.reverse([1, 2, 3])", "a")).toEqual([3, 2, 1]);
  expect(run("let a = Array.concat([1])([2, 3])", "a")).toEqual([1, 2, 3]);
  expect(run("let a = Array.append(9)([1, 2])", "a")).toEqual([1, 2, 9]);
  expect(run("let a = Array.prepend(0)([1, 2])", "a")).toEqual([0, 1, 2]);
  expect(run("let a = Array.prepend(1)([])", "a")).toEqual([1]);
});

// ---- show (structural display, beside eq/compare) ---------------------------

test("show renders primitives", () => {
  expect(run("let a = show(42)", "a")).toBe("42");
  expect(run("let a = show(3.5)", "a")).toBe("3.5");
  expect(run("let a = show(true)", "a")).toBe("true");
  expect(run('let a = show("hi")', "a")).toBe('"hi"');
});

test("show renders arrays, records, and variants structurally", () => {
  expect(run("let a = show([1, 2, 3])", "a")).toBe("[1, 2, 3]");
  expect(run("let a = show({ x: 1, y: 2 })", "a")).toBe("{ x: 1, y: 2 }");
  expect(run("let a = show(Some(1))", "a")).toBe("Some(1)");
  expect(run("let a = show(None)", "a")).toBe("None");
  expect(run("let a = show(Some([1, 2]))", "a")).toBe("Some([1, 2])");
});

test("show renders user-declared variants by ctor name", () => {
  const src = "type Tree = | Leaf(number) | Node(Tree, Tree)\nlet a = show(Node(Leaf(1), Leaf(2)))";
  expect(run(src, "a")).toBe("Node(Leaf(1), Leaf(2))");
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

test("Option/Result are reserved as values but redeclarable as types", () => {
  expect(isErr(compile("let Option = 1"))).toBe(true);
  expect(isErr(compile("let Result = 1"))).toBe(true);
  // builtin-type contract: a user `type` redeclaration wins (example.al does this)
  const redecl = "type Option a = | Some(value: a) | None\nlet a = Some(1)";
  expect(isErr(compile(redecl))).toBe(false);
});

// ---- bool combinators (not/and/or) + gte/lte --------------------------------

test("not / and / or", () => {
  expect(run("let a = not(true)", "a")).toBe(false);
  expect(run("let a = and(true, false)", "a")).toBe(false);
  expect(run("let a = and(true, true)", "a")).toBe(true);
  expect(run("let a = or(false, true)", "a")).toBe(true);
  expect(run("let a = or(false, false)", "a")).toBe(false);
});

test("gte / lte", () => {
  expect(run("let a = [gte(3, 3), gte(2, 3), lte(3, 3), lte(4, 3)]", "a")).toEqual([
    true,
    false,
    true,
    false,
  ]);
});

// ---- Option combinators ------------------------------------------------------

test("Option.map / flatMap / mapOr", () => {
  const src = `let inc = n => add(n, 1)
  let half = n => switch mod(n, 2) { | 0 => Some(div(n, 2)) | _ => None }
  let a = Some(4) |> Option.map(inc)
  let b = None |> Option.map(inc)
  let c = Some(4) |> Option.flatMap(half)
  let d = Some(3) |> Option.flatMap(half)
  let e = Some(4) |> Option.mapOr(0)(inc)
  let f = None |> Option.mapOr(0)(inc)
  let r = [show(a), show(b), show(c), show(d), show(e), show(f)]`;
  expect(run(src, "r")).toEqual(["Some(5)", "None", "Some(2)", "None", "5", "0"]);
});

test("Option.exists / contains / isSome / isNone", () => {
  const src = `let big = n => gt(n, 10)
  let r = [
    Some(11) |> Option.exists(big),
    Some(3) |> Option.exists(big),
    None |> Option.exists(big),
    Some("/") |> Option.contains("/"),
    Some("x") |> Option.contains("/"),
    None |> Option.contains("/"),
    Some(1) |> Option.isSome,
    None |> Option.isNone
  ]`;
  expect(run(src, "r")).toEqual([true, false, false, true, false, false, true, true]);
});

test("Option.unwrapOr / orElse compose with the char cursor", () => {
  const src = `let a = Str.toNumber("42") |> Option.unwrapOr(0)
  let b = Str.toNumber("nope") |> Option.unwrapOr(0)
  let c = Str.get(9, "ab") |> Option.orElse(Some("!")) |> Option.unwrapOr("?")
  let d = Str.get(0, "ab") |> Option.orElse(Some("!")) |> Option.unwrapOr("?")
  let r = [show(a), show(b), c, d]`;
  expect(run(src, "r")).toEqual(["42", "0", "!", "a"]);
});

// ---- Result combinators -------------------------------------------------------

test("Result.map / mapErr / flatMap / unwrapOr / isOk / isErr", () => {
  const src = `let inc = n => add(n, 1)
  let safe = n => switch gt(n, 0) { | true => Ok(n) | false => Err("neg") }
  let a = Ok(41) |> Result.map(inc) |> Result.unwrapOr(0)
  let b = Err("boom") |> Result.map(inc) |> Result.unwrapOr(0)
  let c = Ok(5) |> Result.flatMap(safe) |> Result.isOk
  let d = Ok(-5) |> Result.flatMap(safe) |> Result.isErr
  let e = Err("boom") |> Result.mapErr(m => Str.concat(m, "!"))
  let r = [show(a), show(b), show(c), show(d), show(e)]`;
  expect(run(src, "r")).toEqual(["42", "0", "true", "true", 'Err("boom!")']);
});
