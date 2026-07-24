// `let x = value in body` — local bindings as an expression. Guards the whole
// slice: parse+infer (with let-polymorphism), codegen runtime behavior, and
// formatter round-trip.
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { format } from "../src/format";
import { type Env, inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { type Type, tArrow, tNumber } from "../src/types";

const numOps: Record<string, Type> = {
  add: tArrow(tNumber, tArrow(tNumber, tNumber)),
};
const infer = (src: string, builtins: Record<string, Type> = numOps) =>
  inferProgram(unwrapOk(parse(unwrapOk(lex(src)))), builtins);
const typeOf = (env: Env, name: string): string => showScheme(env.get(name)!);
const run = (src: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/gm, "");
  return new Function("match", `${js}\nreturn r;`)(match);
};

test("binds a local and uses it in the body", () => {
  const env = unwrapOk(infer("let r = let x = add(1, 2) in add(x, x)"));
  expect(typeOf(env, "r")).toBe("number");
});

test("evaluates to the body with the binding in scope", () => {
  expect(run("let r = let x = add(1, 2) in add(x, x)")).toBe(6);
});

test("nested let-in chains and shadows correctly", () => {
  expect(run("let r = let x = 1 in let y = add(x, 10) in add(x, y)")).toBe(12);
});

test("the bound value is generalized (let-polymorphism)", () => {
  // `id` is used at two different types inside the body — only sound if the
  // local binding generalizes, exactly like a top-level `let`.
  const src = "let r = let id = x => x in { a: id(1), b: id(id) }";
  expect(isErr(infer(src, {}))).toBe(false);
});

test("the value sees the OUTER scope, not the binding itself (non-recursive)", () => {
  // The `x` in the value resolves to the top-level `x` (100), not to the local
  // being defined — proving let-in is non-recursive. A recursive binding would
  // reference an uninitialized self here.
  expect(run("let x = 100\nlet r = let x = add(x, 1) in x")).toBe(101);
});

test("round-trips through the formatter", () => {
  expect(unwrapOk(format("let r=let  x=add(1,2)in add(x,x)"))).toBe(
    "let r = let x = 1 + 2 in x + x\n",
  );
});
