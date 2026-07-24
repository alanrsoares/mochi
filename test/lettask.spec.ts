// ADR 0005 — `let! param = value in body`: monadic bind on Task. The value's
// payload binds the param; the body must itself be a Task. Lowers to
// `_Task_andThen((param) => body)(value)`. Mirrors `let?` for Result; infix
// bind for both is deferred.
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { format } from "../src/format";
import { hoverAt } from "../src/hover";

const run = async (src: string, ret: string): Promise<unknown> => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  const r = new Function("match", `"use strict";\n${js}\nreturn ${ret};`)(
    match,
  ) as Promise<unknown>;
  return r;
};

const errMsg = (src: string): string => {
  const r = compile(src);
  expect(isErr(r)).toBe(true);
  return unwrapErr(r)[0]!.message;
};

test("binds the Task payload and runs the body", async () => {
  const src = `let program = let! x = Task.of(20) in Task.of(add(x, 1))
let result = Task.run(program)`;
  expect(await run(src, "result")).toBe(21);
});

test("chains flatten through successive binds", async () => {
  const src = `let program =
  let! a = Task.of(10) in
  let! b = Task.delay(1, a) in
  Task.of(mul(b, 2))
let result = Task.run(program)`;
  expect(await run(src, "result")).toBe(20);
});

test("tuple param destructures the Task payload", async () => {
  const src = `let program = let! (a, b) = Task.of((3, 4)) in Task.of(add(a, b))
let result = Task.run(program)`;
  expect(await run(src, "result")).toBe(7);
});

test("record param destructures the Task payload", async () => {
  const src = `let program = let! { x, y } = Task.of({ x: 1, y: 2 }) in Task.of(add(x, y))
let result = Task.run(program)`;
  expect(await run(src, "result")).toBe(3);
});

test("value must be a Task", () => {
  expect(errMsg("let r = let! x = 1 in Task.of(x)")).toContain("Task");
});

test("body must be a Task", () => {
  expect(errMsg("let r = let! x = Task.of(1) in add(x, 1)")).toContain("Task");
});

test("missing in is a parse error", () => {
  const r = compile("let r = let! x = Task.of(1) Task.of(x)");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.kind).toBe("parse");
});

test("formatter round-trips let! idempotently", () => {
  const srcs = [
    "let r = let! x = Task.of(1) in Task.of(add(x, 1))\n",
    "let r = let! (a, b) = Task.of((1, 2)) in Task.of(add(a, b))\n",
    "let f = n => let! x = Task.of(n) in let! y = Task.of(add(x, 1)) in Task.of(y)\n",
  ];
  for (const src of srcs) {
    const once = unwrapOk(format(src));
    expect(unwrapOk(format(once))).toBe(once);
    expect(unwrapOk(compile(once))).toBe(unwrapOk(compile(src)));
  }
});

test("emitted JS is the Task bind; prelude inlines its runtime", () => {
  const js = unwrapOk(compile("let r = let! x = Task.of(1) in Task.of(x)"));
  expect(js).toContain("_Task_andThen((x) => _Task_of(x))(_Task_of(1))");
  expect(js).toContain("const _Task_andThen =");
});

test("hover on the bound name shows the Task payload type", () => {
  const src = "let r = let! x = Task.of(1) in Task.of(x)";
  const h = hoverAt(src, src.indexOf("x ="));
  expect(h?.code).toBe("let x: number");
});

test("spaced let ! still parses (mirrors let ?)", async () => {
  const src = `let program = let ! x = Task.of(2) in Task.of(mul(x, 3))
let result = Task.run(program)`;
  expect(await run(src, "result")).toBe(6);
});
