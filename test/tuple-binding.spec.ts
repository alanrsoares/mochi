// Tuple-binding sugar: `((a, b)) => body` lambda params and `let (a, b) = v in
// body`. The let form desugars to an applied tuple-param lambda, so both share
// one codegen path (JS array destructuring). Guards parse+infer+runtime+format.
import { expect, test } from "bun:test";
import { unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { format } from "../src/format";
import { type Env, inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { type Type, tArrow, tNumber } from "../src/types";

const numOps: Record<string, Type> = { add: tArrow(tNumber, tArrow(tNumber, tNumber)) };
const infer = (src: string, builtins: Record<string, Type> = numOps) =>
  inferProgram(unwrapOk(parse(unwrapOk(lex(src)))), builtins);
const typeOf = (env: Env, name: string): string => showScheme(env.get(name)!);
const run = (src: string): unknown => new Function(`${unwrapOk(compile(src))}\nreturn r;`)();

test("a tuple lambda param destructures its argument", () => {
  // `((a, b)) => …` is ONE tuple param; `(a, b) => …` would be two params.
  expect(run("let r = (((a, b)) => add(a, b))((3, 4))")).toBe(7);
});

test("let (a, b) = v in body binds both positions", () => {
  expect(run("let r = let (a, b) = (10, 20) in add(a, b)")).toBe(30);
});

test("let-tuple desugars to a JS array-destructuring IIFE", () => {
  // The compiled body applies a `([a, b]) => …` lambda to the value.
  expect(unwrapOk(compile("let r = let (a, b) = (1, 2) in a"))).toContain("([a, b]) =>");
});

test("a tuple param lambda is inferred with a tuple domain", () => {
  const env = unwrapOk(infer("let fst = ((a, b)) => a", {}));
  expect(typeOf(env, "fst")).toMatch(/^\('t\d+, 't\d+\) -> 't\d+$/);
});

test("nested let-tuple threads scanner-style state", () => {
  // Mimics a scanner: peel a (value, rest) pair, then a second.
  const src = "let r = let (a, rest) = (1, (2, 3)) in let (b, c) = rest in add(a, add(b, c))";
  expect(run(src)).toBe(6);
});

test("a tuple lambda param round-trips through the formatter", () => {
  expect(unwrapOk(format("let f=((a,b))=>a"))).toBe("let f = ((a, b)) => a\n");
});

test("let-tuple re-folds from its desugared applied lambda back to surface sugar", () => {
  // `let (a, b) = v in body` desugars at parse time to a call of a tuple-param
  // lambda (ADR 0011); the formatter detects that shape and re-folds the
  // surface `let … in` (ADR 0025) rather than leaking the IIFE.
  const once = unwrapOk(format("let r=let ( a , b )=(1,2)in a"));
  expect(once).toBe("let r = let (a, b) = (1, 2) in a\n");
  expect(unwrapOk(format(once))).toBe(once); // idempotent
});
