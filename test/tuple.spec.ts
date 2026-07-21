// Tuples — heterogeneous anonymous products `(a, b)`. Guards the slice: infer
// (distinct arities never unify), `switch` destructure + narrowing, codegen to
// JS arrays, extern tuple signatures, and formatter round-trip.
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
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
const run = (src: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/gm, "");
  return new Function("match", `${js}\nreturn r;`)(match);
};

test("a tuple literal infers a heterogeneous product type", () => {
  const env = unwrapOk(infer('let t = (1, "a", true)'));
  expect(typeOf(env, "t")).toBe("(number, string, bool)");
});

test("tuples of different arity are distinct types (never unify)", () => {
  // A switch arm returning a 2-tuple in one branch and a 3-tuple in another
  // must fail to unify the result type.
  const bad = "let f = p => switch p { | 0 => (1, 2) | _ => (1, 2, 3) }";
  expect(isErr(infer(bad))).toBe(true);
});

test("switch destructures a tuple (single catch-all arm)", () => {
  expect(run("let r = switch (1, 2) { | (a, b) => add(a, b) }")).toBe(3);
});

test("a tuple arm can narrow on a literal position", () => {
  const src = "let r = switch (1, 9) { | (1, b) => b | (a, b) => add(a, b) }";
  expect(run(src)).toBe(9);
});

test("a tuple compiles to a JS array and round-trips through swap", () => {
  const src = "let swap = p => switch p { | (a, b) => (b, a) }\nlet r = swap((1, 2))";
  expect(run(src)).toEqual([2, 1]);
});

test("swap is inferred polymorphic: (a, b) -> (b, a)", () => {
  const env = unwrapOk(infer("let swap = p => switch p { | (a, b) => (b, a) }", {}));
  const t = typeOf(env, "swap");
  const m = t.match(/^\('t(\d+), 't(\d+)\) -> \('t(\d+), 't(\d+)\)$/);
  expect(m).not.toBeNull();
  const [, a, b, c, d] = m!;
  expect([c, d]).toEqual([b, a]); // positions swapped
});

test("tuple types work in an extern signature", () => {
  const src = 'extern fst : (a, b) -> a = "./m" "fst"\nlet x = fst((1, "y"))';
  expect(typeOf(unwrapOk(infer(src, {})), "x")).toBe("number");
});

test("round-trips through the formatter", () => {
  expect(unwrapOk(format("let t=( 1 ,2 , 3 )"))).toBe("let t = (1, 2, 3)\n");
  expect(unwrapOk(format("let f=p=>switch p{|(a,b)=>a}"))).toBe(
    "let f = p => switch p {\n  | (a, b) => a\n}\n",
  );
});
