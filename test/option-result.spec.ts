// Builtin Option/Result: Some/None/Ok/Err are available with no `type` decl,
// switchable (exhaustiveness knows their ctor sets), and their runtime shape
// matches @onrails/maybe + @onrails/result. Seeded only when the program doesn't
// declare its own type of that name, so hand-written decls still win. They back
// the Option-returning safe accessors (Map.get, List.head, Array.head/find).
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { emitDts } from "../src/dts";

const run = (src: string, ret: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function("match", `${js}\nreturn ${ret};`)(match);
};

const UNWRAP = "let unwrap = o => switch o {\n | Some(v) => v\n | None => 0\n}\n";
const ORZERO = "let orZero = r => switch r {\n | Ok(v) => v\n | Err(e) => 0\n}\n";

// ---- builtin constructors --------------------------------------------------

test("Some/None are usable with no type declaration", () => {
  expect(run("let x = Some(5)", "x")).toEqual({ _tag: "Some", value: 5 });
  expect(run("let x = None", "x")).toEqual({ _tag: "None" });
});

test("Ok/Err are usable with no type declaration", () => {
  expect(run("let x = Ok(1)", "x")).toEqual({ _tag: "Ok", value: 1 });
  expect(run("let x = Err(2)", "x")).toEqual({ _tag: "Err", error: 2 });
});

test("switching on a builtin Option is exhaustive with Some + None", () => {
  expect(run(`${UNWRAP}let a = unwrap(Some(7))`, "a")).toBe(7);
  expect(run(`${UNWRAP}let a = unwrap(None)`, "a")).toBe(0);
});

test("switching on a builtin Result is exhaustive with Ok + Err", () => {
  expect(run(`${ORZERO}let a = orZero(Ok(42))`, "a")).toBe(42);
  expect(run(`${ORZERO}let a = orZero(Err(1))`, "a")).toBe(0);
});

test("a switch missing None is non-exhaustive", () => {
  const r = compile("let f = o => switch o { | Some(v) => v }");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.message).toContain("missing None");
});

// ---- Option-returning accessors --------------------------------------------

test("Map.get returns Some for a present key, None for a missing one", () => {
  expect(run(`${UNWRAP}let a = unwrap(Map.get("k")(#{ "k": 9 }))`, "a")).toBe(9);
  expect(run(`${UNWRAP}let a = unwrap(Map.get("z")(#{ "k": 9 }))`, "a")).toBe(0);
});

test("List.head / Array.head return Some/None", () => {
  expect(run(`${UNWRAP}let a = unwrap(List.head(@{3, 4, 5}))`, "a")).toBe(3);
  expect(run(`${UNWRAP}let a = unwrap(Array.head([8, 9]))`, "a")).toBe(8);
  expect(run(`${UNWRAP}let a = unwrap(Array.head([]))`, "a")).toBe(0);
});

test("Array.find returns the first match as Some", () => {
  const src = `${UNWRAP}let big = x => gt(x, 3)\nlet a = unwrap(Array.find(big)([1, 2, 5]))`;
  expect(run(src, "a")).toBe(5);
});

// ---- user redeclaration wins -----------------------------------------------

test("a program may still declare its own Option (its decl wins, no dup error)", () => {
  const src = "type Option a = | Some(value: a) | None\nlet x = Some(3)";
  expect(run(src, "x")).toEqual({ _tag: "Some", value: 3 });
});

test("the constructor factory is inlined only when the program uses it", () => {
  // `None` unused → no `const None` in standalone output; `Some` used → present.
  const out = unwrapOk(compile("let x = Some(1)"));
  expect(out).toContain("const Some =");
  expect(out).not.toContain("const None =");
});

// ---- .d.ts -----------------------------------------------------------------

test("a builtin type used in an exported binding gets its decl emitted", () => {
  const dts = unwrapOk(emitDts('export let look = Map.get("k")(#{ "k": 1 })'));
  expect(dts).toContain("export type Option<A> =");
  expect(dts).toContain("export declare const look: Option<number>;");
});
