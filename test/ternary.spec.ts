// ADR 0016 — ternary expressions: `cond ? then : else`. Right-associative,
// binds looser than `|>`; codegen always parenthesizes the JS conditional.
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { format } from "../src/format";

const run = (src: string, ret: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function("match", `"use strict";\n${js}\nreturn ${ret};`)(match);
};

const errMsg = (src: string): string => {
  const r = compile(src);
  expect(isErr(r)).toBe(true);
  return unwrapErr(r).message;
};

test("ternary picks the right branch", () => {
  const src = `let abs = n => gt(n, 0) ? n : mul(n, -1)
let a = abs(-5)
let b = abs(7)`;
  expect(run(src, "[a, b]")).toEqual([5, 7]);
});

test("right-associative else-chains", () => {
  const src = `let sign = n => gt(n, 0) ? 1 : lt(n, 0) ? -1 : 0
let r = [sign(9), sign(-9), sign(0)]`;
  expect(run(src, "r")).toEqual([1, -1, 0]);
});

test("binds looser than |> — pipe stays in the cond", () => {
  const src = `let r = 5 |> gt(3) ? "big" : "small"`;
  // (5 |> gt(3)) is gt(3)(5) = 3 > 5 = false — |> binds tighter, so the
  // whole pipe is the cond and the else branch wins.
  expect(run(src, "r")).toBe("small");
});

test("branches can be full expressions (lambdas, matches, ternaries)", () => {
  const src = `let pick = b => b ? (x => add(x, 1)) : (x => mul(x, 2))
let r = (pick(true))(10)
let s = (pick(false))(10)`;
  expect(run(src, "[r, s]")).toEqual([11, 20]);
});

test("nested in call args and records", () => {
  const src = `let clamp01 = n => lt(n, 0) ? 0 : gt(n, 1) ? 1 : n
let r = { lo: clamp01(-3), hi: clamp01(4), mid: clamp01(0.5) }`;
  expect(run(src, "[r.lo, r.hi, r.mid]")).toEqual([0, 1, 0.5]);
});

test("cond binds tighter than ternary when cond is itself an infix comparison", () => {
  // `a == b ? "eq" : "ne"` must parse as `(a == b) ? "eq" : "ne"`, not
  // `a == ("eq" if b else "ne")` — the `?` belongs to the enclosing ternary,
  // not to `b` as `==`'s tightly-bound right operand.
  const src = `let f = (a, b) => a == b ? "eq" : "ne"
let r = [f(1, 1), f(1, 2)]`;
  expect(run(src, "r")).toEqual(["eq", "ne"]);
});

test("cond must be bool", () => {
  expect(errMsg("let r = 1 ? 2 : 3")).toContain("bool");
});

test("branches must share one type", () => {
  const m = errMsg(`let r = true ? 1 : "one"`);
  expect(m).toContain("number");
  expect(m).toContain("string");
});

test("missing colon is a parse error", () => {
  const r = compile("let r = true ? 1");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).kind).toBe("parse");
});

test("formatter round-trips ternaries idempotently", () => {
  const srcs = [
    "let f = n => gt(n, 0) ? n : 0\n",
    "let f = n => gt(n, 0) ? 1 : lt(n, 0) ? -1 : 0\n",
    "let f = b => (b ? true : false) ? 1 : 2\n", // ternary-in-cond keeps parens
    "let r = (true ? 1 : 2) |> gt(0)\n", // ternary pipe-operand keeps parens
  ];
  for (const src of srcs) {
    const once = unwrapOk(format(src));
    expect(unwrapOk(format(once))).toBe(once);
    // reparse of the printed form means the same program: compile both
    expect(unwrapOk(compile(once))).toBe(unwrapOk(compile(src)));
  }
});

test("emitted JS conditional is parenthesized", () => {
  const js = unwrapOk(compile("let f = b => b ? 1 : 2"));
  expect(js).toContain("(b ? 1 : 2)");
});
