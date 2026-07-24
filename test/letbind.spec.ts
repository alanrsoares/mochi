// ADR 0017 — `let? param = value in body`: monadic bind on Result. The value's
// Ok payload binds the param; an Err short-circuits the whole expression.
// Lowers to `_Result_flatMap((param) => body)(value)`.
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { format } from "../src/format";
import { hoverAt } from "../src/hover";

const run = (src: string, ret: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function("match", `"use strict";\n${js}\nreturn ${ret};`)(match);
};

const errMsg = (src: string): string => {
  const r = compile(src);
  expect(isErr(r)).toBe(true);
  return unwrapErr(r)[0]!.message;
};

test("binds the Ok payload and runs the body", () => {
  const src = "let r = let? x = Ok(20) in Ok(add(x, 1))";
  expect(run(src, "r")).toEqual({ _tag: "Ok", value: 21 });
});

test("an Err short-circuits — the body never runs", () => {
  const src = `let boom = () => Err("nope")
let r = let? x = boom() in Ok(add(x, 1))`;
  expect(run(src, "r")).toEqual({ _tag: "Err", error: "nope" });
});

test("chains flatten — first Err wins", () => {
  const src = `let half = n => eq(mod(n, 2), 0) ? Ok(div(n, 2)) : Err("odd")
let quarter = n =>
  let? h = half(n) in
  let? q = half(h) in
  Ok(q)
let a = quarter(20)
let b = quarter(10)
let c = quarter(9)`;
  expect(run(src, "[a, b, c]")).toEqual([
    { _tag: "Ok", value: 5 },
    { _tag: "Err", error: "odd" },
    { _tag: "Err", error: "odd" },
  ]);
});

test("tuple param destructures the Ok payload", () => {
  const src = "let r = let? (a, b) = Ok((3, 4)) in Ok(add(a, b))";
  expect(run(src, "r")).toEqual({ _tag: "Ok", value: 7 });
});

test("record param destructures the Ok payload", () => {
  const src = "let r = let? { x, y } = Ok({ x: 1, y: 2 }) in Ok(add(x, y))";
  expect(run(src, "r")).toEqual({ _tag: "Ok", value: 3 });
});

test("value must be a Result", () => {
  expect(errMsg("let r = let? x = 1 in Ok(x)")).toContain("Result");
});

test("body must be a Result", () => {
  expect(errMsg("let r = let? x = Ok(1) in add(x, 1)")).toContain("Result");
});

test("value and body share one error type", () => {
  const m = errMsg(`let r = let? x = Err("s") in Err(1)`);
  expect(m).toContain("string");
  expect(m).toContain("number");
});

test("missing in is a parse error", () => {
  const r = compile("let r = let? x = Ok(1) Ok(x)");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.kind).toBe("parse");
});

test("formatter round-trips let? idempotently", () => {
  const srcs = [
    "let r = let? x = Ok(1) in Ok(add(x, 1))\n",
    "let r = let? (a, b) = Ok((1, 2)) in Ok(add(a, b))\n",
    "let f = n => let? x = Ok(n) in let? y = Ok(add(x, 1)) in Ok(y)\n",
  ];
  for (const src of srcs) {
    const once = unwrapOk(format(src));
    expect(unwrapOk(format(once))).toBe(once);
    expect(unwrapOk(compile(once))).toBe(unwrapOk(compile(src)));
  }
});

test("emitted JS is the Result bind; prelude inlines its runtime", () => {
  const js = unwrapOk(compile("let r = let? x = Ok(1) in Ok(x)"));
  expect(js).toContain("_Result_flatMap((x) => Ok(x))(Ok(1))");
  expect(js).toContain("const _Result_flatMap ="); // standalone runtime inlined
});

test("hover on the bound name shows the Ok payload type", () => {
  const src = "let r = let? x = Ok(1) in Ok(x)";
  const h = hoverAt(src, src.indexOf("x ="));
  expect(h?.code).toBe("let x: number");
});
