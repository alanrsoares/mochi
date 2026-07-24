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

// ADR 0044 — binding type annotations (`let x : T = v`).
test("a binding annotation pins a too-general value", () => {
  // Without the annotation `empty` would be `Map<'a, 'b>`; the alias pins both.
  const src = "type Reg = { m: Map string number }\nlet empty : Reg = { m: #{} }";
  const env = unwrapOk(infer(src, {}));
  expect(typeOf(env, "empty")).toBe("{ m: Map<string, number> }");
});

test("a binding annotation is enforced (wrong type is a type error)", () => {
  const r = infer('let bad : number = "hello"', {});
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.message).toContain("unify");
});

test("a let-in annotation pins the local (ADR 0044)", () => {
  const env = unwrapOk(infer("let f = x => let n : number = x in add(n, 1)"));
  expect(typeOf(env, "f")).toBe("number -> number");
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

test("self-recursive let is typed in strict mode (no open-world)", () => {
  // fact references itself; strict builtins → recursion must be typed, not
  // rescued by open-world. sub/mul/eq keep it number -> number.
  const ops: Record<string, Type> = {
    mul: tArrow(tNumber, tArrow(tNumber, tNumber)),
    sub: tArrow(tNumber, tArrow(tNumber, tNumber)),
  };
  const env = unwrapOk(
    infer("let fact = n => switch n { | 0 => 1 | _ => mul(n, fact(sub(n, 1))) }", ops),
  );
  expect(typeOf(env, "fact")).toBe("number -> number");
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
  expect(unwrapErr(r)[0]!.message).toContain("unbound variable 'nope'");
});

test("unbound variable suggests a close name from the env", () => {
  const r = infer("let count = 1\nlet n = coun", {});
  expect(isErr(r)).toBe(true);
  const e = unwrapErr(r)[0]!;
  expect(e.help).toBe("did you mean 'count'?");
  expect(e.suggestions?.[0]?.replaceWith).toBe("count");
});

test("applying a number as a function is a type error", () => {
  const r = infer("let bad = square(add)");
  // add : number -> number -> number, square expects number
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.kind).toBe("type");
});

test("field type conflict across two uses is a type error", () => {
  const r = infer("let getX = p => p.x\nlet bad = add(getX({ x: 1 }), getX({ x: yes }))", {
    add: tArrow(tNumber, tArrow(tNumber, tNumber)),
    yes: tBool,
  });
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.message).toContain("cannot unify");
});

test("match arms returning different types is a type error", () => {
  const r = infer("type T = | A | B\nlet f = t => switch t { | A => 1 | B => flag }", {
    flag: tBool,
  });
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.message).toContain("cannot unify");
});

test("mutually recursive top-level functions type-check (strict, no open-world)", () => {
  const src = `let isEven = n => switch n { | 0 => true | _ => isOdd(add(n, -1)) }
let isOdd = n => switch n { | 0 => false | _ => isEven(add(n, -1)) }`;
  const env = unwrapOk(infer(src));
  expect(typeOf(env, "isEven")).toBe("number -> bool");
  expect(typeOf(env, "isOdd")).toBe("number -> bool"); // forward-referenced from isEven
});

test("a forward reference to a later binding resolves, keeping its polymorphism", () => {
  // `a` uses `id` before it is defined; SCC ordering infers `id` first and
  // generalizes it, so `id` stays polymorphic and `a` is a number.
  const env = unwrapOk(infer("let a = id(1)\nlet id = x => x"));
  expect(typeOf(env, "a")).toBe("number");
  expect(typeOf(env, "id")).toMatch(/^'t\d+ -> 't\d+$/);
});

// Arity diagnostics (CRITIQUE §4.4): a curried call with a missing argument
// surfaces a function where a value was expected. Instead of a bare `cannot
// unify number with number -> number`, the message names the likely cause.
test("arity mismatch hints at a missing argument", () => {
  // `add(1)` is a partially applied `number -> number`; passing it as add's
  // first argument (which wants a `number`) is the classic missing-arg slip.
  const r = infer("let x = add(add(1), 2)");
  expect(isErr(r)).toBe(true);
  if (isErr(r)) {
    const msg = unwrapErr(r)[0]!.message;
    expect(msg).toContain("cannot unify");
    expect(msg).toContain("a call may be missing an argument");
  }
});
