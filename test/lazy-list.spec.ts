// Lazy List (`@{...}`): a generator-backed pull-sequence, distinct from the
// eager Array `[...]`. Producers/slicers stay lazy (infinite streams work);
// destructuring is the canonical `@{}` + `@{head, ...tail}` pair, lowered to an
// iterator-stepping IIFE (not @onrails/pattern — a sequence has no length).
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { check } from "../src/check";
import { compile } from "../src/compile";
import { emitDts } from "../src/dts";
import { format } from "../src/format";
import { inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeEnv } from "../src/prelude";

// Compile standalone (prelude inlined) and evaluate a binding. `match` is
// injected for the `@{...all}` catch-all, which lowers to a match() chain.
const run = (src: string, ret: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function("match", `${js}\nreturn ${ret};`)(match);
};

const js = (src: string): string => unwrapOk(compile(src, { runtime: false }));

const typeOf = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  const env = unwrapOk(inferProgram(prog, preludeEnv, { open: true }));
  return showScheme(env.get(name)!);
};

// ---- literals + interop ----------------------------------------------------

test("a `@{...}` literal round-trips through toArray", () => {
  expect(run("let a = toArray(@{1, 2, 3})", "a")).toEqual([1, 2, 3]);
});

test("`@{}` is the empty List", () => {
  expect(run("let a = toArray(@{})", "a")).toEqual([]);
});

test("fromArray then toArray is identity", () => {
  expect(run("let a = toArray(fromArray([4, 5, 6]))", "a")).toEqual([4, 5, 6]);
});

// ---- laziness: infinite producers + early termination ----------------------

test("iterate is infinite but take pulls only a prefix (no hang)", () => {
  const src = "let inc = x => add(x, 1)\nlet a = toArray(take(3)(iterate(inc)(0)))";
  expect(run(src, "a")).toEqual([0, 1, 2]);
});

test("range + take", () => {
  expect(run("let a = toArray(take(5)(range(0)(100)))", "a")).toEqual([0, 1, 2, 3, 4]);
});

test("takeWhile stops at the first failing element", () => {
  const src = "let lt3 = x => lt(x, 3)\nlet a = toArray(takeWhile(lt3)(range(0)(100)))";
  expect(run(src, "a")).toEqual([0, 1, 2]);
});

test("drop skips a prefix", () => {
  expect(run("let a = toArray(take(3)(drop(2)(range(0)(100))))", "a")).toEqual([2, 3, 4]);
});

test("repeat + take yields a constant run", () => {
  expect(run("let a = toArray(take(3)(repeat(7)))", "a")).toEqual([7, 7, 7]);
});

// ---- destructuring ---------------------------------------------------------

const SUM = [
  "let sum = xs => switch xs {",
  "  | @{} => 0",
  "  | @{h, ...t} => add(h, sum(t))",
  "}",
];

test("cons recursion sums a List", () => {
  expect(run(`${SUM.join("\n")}\nlet a = sum(@{1, 2, 3, 4})`, "a")).toBe(10);
});

test("cons recursion bottoms out on the empty List", () => {
  expect(run(`${SUM.join("\n")}\nlet a = sum(@{})`, "a")).toBe(0);
});

test("head/tail bind correctly; tail stays a lazy List", () => {
  const src = [
    "let headOr0 = xs => switch xs {",
    "  | @{} => 0",
    "  | @{h, ...t} => h",
    "}",
    "let a = headOr0(@{42, 1, 2})",
  ].join("\n");
  expect(run(src, "a")).toBe(42);
});

test("a lazy-List switch lowers to an iterator step, not a match() chain", () => {
  const out = js(`${SUM.join("\n")}\nlet a = sum(@{1})`);
  expect(out).toContain("[Symbol.iterator]()");
  expect(out).toContain("_it.next()");
  expect(out).not.toContain("match(");
});

// ---- exhaustiveness + form restrictions ------------------------------------

test("`@{}` + `@{h, ...t}` is exhaustive", () => {
  expect(isErr(compile(`${SUM.join("\n")}\nlet a = sum(@{1})`))).toBe(false);
});

test("a lone `@{}` arm is a non-exhaustive error", () => {
  const r = compile("let f = xs => switch xs { | @{} => 0 }");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).kind).toBe("check");
});

test("a fixed-length `@{x}` arm is rejected (use Array for that)", () => {
  const r = compile("let f = xs => switch xs { | @{} => 0 | @{x} => 1 | @{h, ...t} => 2 }");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).kind).toBe("check");
});

test("a multi-head `@{a, b}` arm is rejected", () => {
  const r = compile("let f = xs => switch xs { | @{} => 0 | @{a, b} => 1 }");
  expect(isErr(r)).toBe(true);
});

test("`@{...all}` is a catch-all binding the whole List", () => {
  expect(
    run("let f = xs => switch xs { | @{...all} => toArray(all) }\nlet a = f(@{9, 8})", "a"),
  ).toEqual([9, 8]);
});

// ---- types -----------------------------------------------------------------

test("a `@{...}` literal infers as List", () => {
  expect(typeOf("let xs = @{1, 2, 3}", "xs")).toBe("List<number>");
});

test("List is distinct from Array — mixing fails to unify", () => {
  // `length` is an Array op; applying it to a List is a type error.
  expect(isErr(compile("let n = length(@{1, 2, 3})"))).toBe(true);
});

test("List erases to Iterable at the .d.ts boundary", () => {
  const dts = unwrapOk(emitDts("export let xs = @{1, 2, 3}"));
  expect(dts).toContain("Iterable<number>");
});

// ---- formatting ------------------------------------------------------------

test("lazy-List literals and patterns survive formatting verbatim", () => {
  const src = "let f = xs => switch xs {\n  | @{} => @{}\n  | @{head, ...tail} => tail\n}\n";
  expect(unwrapOk(format(src))).toBe(src);
});
