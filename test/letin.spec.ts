// `let x = value in body` — local bindings as an expression. Guards the whole
// slice: parse+infer (with let-polymorphism), codegen runtime behavior, and
// formatter round-trip.
import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { type Env, inferProgram, showScheme } from "@mochi/compiler/infer";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { type Type, tArrow, tNumber } from "@mochi/compiler/types";
import { format } from "@mochi/dx/format";
import { compileJs } from "@mochi/test-support";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";

const numOps: Record<string, Type> = {
  add: tArrow(tNumber, tArrow(tNumber, tNumber)),
};
const infer = (src: string, builtins: Record<string, Type> = numOps) =>
  inferProgram(unwrapOk(parse(unwrapOk(lex(src)))), builtins);
const typeOf = (env: Env, name: string): string => showScheme(env.get(name)!);
const run = (src: string): unknown => {
  const js = compileJs(src, { stripImports: true, runtime: true });
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

test("a chain under a lambda emits sequential consts, not nested IIFEs", () => {
  const js = unwrapOk(compile("let f = n => let a = add(n, 1) in let b = add(a, 2) in add(a, b)"));
  expect(js).toContain("const a = add(n, 1); const b = add(a, 2);");
  expect(js).not.toContain("((a) =>");
});

test("a re-bind that shadows a lambda parameter still reads the parameter", () => {
  // Emitting `const x = add(x, 1)` here would read the const in its own
  // initializer (TDZ). The chain has to stop and fall back to the IIFE form.
  expect(run("let f = x => let x = add(x, 1) in x\nlet r = f(41)")).toBe(42);
});

test("a re-bind that shadows an earlier link still reads the earlier value", () => {
  expect(run("let f = _ => let x = 1 in let x = add(x, 10) in x\nlet r = f(0)")).toBe(11);
});

test("a value that mentions its own name keeps the IIFE (let-in is not recursive)", () => {
  // A `const` here would resolve `go` to itself, quietly making the binding
  // recursive — which strict infer rejects as an unbound variable. Codegen must
  // not be more permissive than the type system.
  const js = unwrapOk(compile("let f = n => let go = j => go(add(j, n)) in go(0)"));
  expect(js).toContain("((go) =>");
  expect(js).not.toContain("const go =");
});

test("round-trips through the formatter", () => {
  expect(unwrapOk(format("let r=let  x=add(1,2)in add(x,x)"))).toBe(
    "let r = let x = 1 + 2 in x + x\n",
  );
});
