import { expect, test } from "bun:test";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { type Env, inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { type Type, tArrow, tBool, tNumber } from "../src/types";

const numOps: Record<string, Type> = {
  add: tArrow(tNumber, tArrow(tNumber, tNumber)),
  mul: tArrow(tNumber, tArrow(tNumber, tNumber)),
  square: tArrow(tNumber, tNumber),
  pi: tNumber,
};

const infer = (src: string, builtins: Record<string, Type> = numOps) => {
  const prog = unwrapOk(parse(unwrapOk(lex(src))));
  return inferProgram(prog, builtins);
};

const typeOf = (env: Env, name: string): string => showScheme(env.get(name)!);

test("literal is number", () => {
  const env = unwrapOk(infer("let x = 42"));
  expect(typeOf(env, "x")).toBe("number");
});

test("lambda over numbers", () => {
  const env = unwrapOk(infer("let inc = x => add(x, 1)"));
  expect(typeOf(env, "inc")).toBe("number -> number");
});

test("identity is generalized (polymorphic)", () => {
  const env = unwrapOk(infer("let id = x => x", {}));
  // 'ta -> 'ta  (some quantified var)
  const t = typeOf(env, "id");
  expect(t).toMatch(/^'t\d+ -> 't\d+$/);
  const [a, b] = t.split(" -> ");
  expect(a).toBe(b);
});

test("application result type", () => {
  const env = unwrapOk(infer("let r = square(3)"));
  expect(typeOf(env, "r")).toBe("number");
});

test("pipeline types like nested application", () => {
  const env = unwrapOk(infer("let r = 5 |> square"));
  expect(typeOf(env, "r")).toBe("number");
});

test("record literal is a closed record", () => {
  const env = unwrapOk(infer("let p = { x: 1, y: 2 }", {}));
  expect(typeOf(env, "p")).toBe("{ x: number, y: number }");
});

test("field access is row-polymorphic: works on ANY record with that field", () => {
  const env = unwrapOk(infer("let getX = p => p.x", {}));
  // p : { x: 'a | 'r } -> 'a
  const t = typeOf(env, "getX");
  expect(t).toMatch(/^\{ x: 't\d+ \| 'r\d+ \} -> 't\d+$/);
});

test("duck typing: same getter used on two different record shapes", () => {
  const env = unwrapOk(
    infer(
      "let getX = p => p.x\nlet a = getX({ x: 1, y: 2 })\nlet b = getX({ x: 3, name: label })",
      { label: tNumber },
    ),
  );
  expect(typeOf(env, "a")).toBe("number");
  expect(typeOf(env, "b")).toBe("number");
});

test("variant constructor has a function type into its variant", () => {
  const env = unwrapOk(infer("type Shape = | Circle(float) | Rect(float, float)", {}));
  expect(typeOf(env, "Circle")).toBe("number -> Shape");
  expect(typeOf(env, "Rect")).toBe("number -> number -> Shape");
});

test("match infers a common result type and binds pattern vars", () => {
  const env = unwrapOk(
    infer(
      "type Shape = | Circle(float) | Rect(float, float)\n" +
        "let area = s => switch s { | Circle(r) => mul(r, r) | Rect(w, h) => mul(w, h) }",
    ),
  );
  expect(typeOf(env, "area")).toBe("Shape -> number");
});

// ---- type errors ----

test("unbound variable is a type error", () => {
  const r = infer("let x = nope", {});
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).message).toContain("unbound variable 'nope'");
});

test("applying a number as a function is a type error", () => {
  const r = infer("let bad = square(add)");
  // add : number -> number -> number, square expects number
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).kind).toBe("type");
});

test("field type conflict across two uses is a type error", () => {
  const r = infer("let getX = p => p.x\nlet bad = add(getX({ x: 1 }), getX({ x: yes }))", {
    add: tArrow(tNumber, tArrow(tNumber, tNumber)),
    yes: tBool,
  });
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).message).toContain("cannot unify");
});

test("match arms returning different types is a type error", () => {
  const r = infer("type T = | A | B\nlet f = t => switch t { | A => 1 | B => flag }", {
    flag: tBool,
  });
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).message).toContain("cannot unify");
});
