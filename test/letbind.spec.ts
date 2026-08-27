// ADR 0017 / ADR 0079 — `let? param = value in body`: monadic bind on Option
// or Result, dispatched from the value's head constructor. Option binds the
// Some payload and short-circuits None; Result binds Ok and short-circuits
// Err. Lowers to `_Option_flatMap` / `_Result_flatMap`.
import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { format } from "@mochi/dx/format";
import { hoverAt } from "@mochi/dx/hover";
import { compileJs } from "@mochi/test-support";
import { match } from "@onrails/pattern";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";

const run = (src: string, ret: string): unknown => {
  const js = compileJs(src, { stripImports: true, runtime: true });
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

test("value must be Option or Result", () => {
  expect(errMsg("let r = let? x = 1 in Ok(x)")).toBe("let? requires Option or Result, got number");
});

test("body must be a Result", () => {
  expect(errMsg("let r = let? x = Ok(1) in add(x, 1)")).toContain("Result");
});

test("value and body share one error type", () => {
  const m = errMsg(`let r = let? x = Err("s") in Err(1)`);
  // Err("s") is a string singleton until generalize; error may show the lit.
  expect(m.includes("string") || m.includes('"s"')).toBe(true);
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

test("binds the Some payload and runs the body", () => {
  const src = "let r = let? x = Some(20) in Some(add(x, 1))";
  expect(run(src, "r")).toEqual({ _tag: "Some", value: 21 });
});

test("a None short-circuits — the body never runs", () => {
  const src = `let boom = () => None
let r = let? x = boom() in Some(add(x, 1))`;
  expect(run(src, "r")).toEqual({ _tag: "None" });
});

test("Option chains flatten — first None wins", () => {
  const src = `let half = n => eq(mod(n, 2), 0) ? Some(div(n, 2)) : None
let quarter = n =>
  let? h = half(n) in
  let? q = half(h) in
  Some(q)
let a = quarter(20)
let b = quarter(10)
let c = quarter(9)`;
  expect(run(src, "[a, b, c]")).toEqual([
    { _tag: "Some", value: 5 },
    { _tag: "None" },
    { _tag: "None" },
  ]);
});

test("tuple param destructures the Some payload", () => {
  const src = "let r = let? (a, b) = Some((3, 4)) in Some(add(a, b))";
  expect(run(src, "r")).toEqual({ _tag: "Some", value: 7 });
});

test("record param destructures the Some payload", () => {
  const src = "let r = let? { x, y } = Some({ x: 1, y: 2 }) in Some(add(x, y))";
  expect(run(src, "r")).toEqual({ _tag: "Some", value: 3 });
});

test("body must be an Option when the value is", () => {
  expect(errMsg("let r = let? x = Some(1) in add(x, 1)")).toContain("Option");
});

test("unresolved tyvar on let? defaults to Result", () => {
  expect(run("let f = x => let? y = x in Ok(y)\nlet r = f(Ok(1))", "r")).toEqual({
    _tag: "Ok",
    value: 1,
  });
  expect(errMsg("let f = x => let? y = x in Some(y)")).toContain("Result");
});

test("does not mix Option and Result in one chain", () => {
  const m = errMsg("let r = let? x = Some(1) in Ok(x)");
  expect(m).toContain("Option");
  expect(m).toContain("Result");
});

test("emitted JS is the Option bind; prelude inlines its runtime", () => {
  const js = unwrapOk(compile("let r = let? x = Some(1) in Some(x)"));
  expect(js).toContain("_Option_flatMap((x) => Some(x))(Some(1))");
  expect(js).toContain("const _Option_flatMap =");
});

test("hover on an Option bind shows the Some payload type", () => {
  const src = "let r = let? x = Some(1) in Some(x)";
  const h = hoverAt(src, src.indexOf("x ="));
  expect(h?.code).toBe("let x: number");
});

test("formatter round-trips Option let? idempotently", () => {
  const src = "let r = let? x = Some(1) in Some(add(x, 1))\n";
  const once = unwrapOk(format(src));
  expect(unwrapOk(format(once))).toBe(once);
  expect(unwrapOk(compile(once))).toBe(unwrapOk(compile(src)));
});
