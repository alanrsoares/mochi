// Gleam-style external bindings: `extern name : type = "module" "export"`.
import { expect, test } from "bun:test";
import { isErr, isOk, unwrapOk } from "@onrails/result";
import { check } from "../src/check";
import { compile } from "../src/compile";
import { format } from "../src/format";
import { inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeEnv } from "../src/prelude";

const js = (src: string): string => unwrapOk(compile(src));

const schemeOf = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  return showScheme(unwrapOk(inferProgram(prog, preludeEnv, {})).get(name)!);
};

test("an extern's declared type becomes its scheme", () => {
  expect(schemeOf(`extern sqrt : number -> number = "node:module" "sqrt"`, "sqrt")).toBe(
    "number -> number",
  );
});

test("composes functions with >> infix operator desugaring", () => {
  const code = `
    let inc = x => add(x, 1)
    let double = x => mul(x, 2)
    let incThenDouble = inc >> double
    let res = incThenDouble(5)
  `;
  expect(isOk(compile(code))).toBe(true);
});

test("desugars arithmetic binary operators (+, -, *, /, %) to prelude calls", () => {
  const code = `
    let a = 10 + 5 * 2 - 4 / 2 % 3
  `;
  const res = compile(code);
  expect(isOk(res)).toBe(true);
});

test("desugars ++ concatenation infix operator for strings and arrays", () => {
  const code = `
    let s = "hello " ++ "world"
    let arr = [1, 2] ++ [3, 4]
  `;
  const res = compile(code);
  expect(isOk(res)).toBe(true);
});

test("desugars comparison infixes (==, !=, <, <=, >, >=)", () => {
  const code = `
    let a = 1 == 1
    let b = 1 != 2
    let c = 1 < 2
    let d = 1 <= 1
    let e = 2 > 1
    let f = 2 >= 2
  `;
  const res = compile(code);
  expect(isOk(res)).toBe(true);
});

test("desugars logical infixes (&&, ||)", () => {
  const code = `
    let a = true && false
    let b = true || false
    let c = (1 < 2) && (3 == 3)
  `;
  const res = compile(code);
  expect(isOk(res)).toBe(true);
});

test("desugars prefix unary operators (- and !)", () => {
  const code = `
    let x = 5
    let a = -x
    let b = -(1 + 2)
    let c = !true
    let d = !(1 == 2)
  `;
  const res = compile(code);
  expect(isOk(res)).toBe(true);
});

test("desugars backtick infix function calls (`fn`) to fn(left, right)", () => {
  const code = `
    let myAdd = (a, b) => a + b
    let res1 = 10 \`myAdd\` 20
    let res2 = 10 \`add\` 20
  `;
  const res = compile(code);
  expect(isOk(res)).toBe(true);
});
test("lowercase names in a signature are generalized type variables", () => {
  // a -> a is polymorphic
  expect(schemeOf(`extern id : a -> a = "./u.js" "id"`, "id")).toMatch(/^'t\d+ -> 't\d+$/);
});

test("a same-named export emits a plain import", () => {
  expect(js(`extern sqrt : number -> number = "node:module" "sqrt"`)).toBe(
    `import { sqrt } from "node:module";\n`,
  );
});

test("a differently-named export emits an aliased import", () => {
  expect(js(`extern identity : a -> a = "./u.js" "id"`)).toBe(
    `import { id as identity } from "./u.js";\n`,
  );
});

test("multi-arg extern import is _curry-wrapped", () => {
  const out = js(`extern draw : string -> string -> number = "./u.js" "draw"`);
  expect(out).toContain('import { draw as $draw } from "./u.js";');
  expect(out).toContain("const draw = _curry(2, $draw);");
  expect(out).toContain("const _curry =");
});

test("aliased multi-arg extern still wraps under the surface name", () => {
  const out = js(`extern paint : string -> string -> number = "./u.js" "draw"`);
  expect(out).toContain('import { draw as $paint } from "./u.js";');
  expect(out).toContain("const paint = _curry(2, $paint);");
});

test("flat multi-arg host survives multi-arg emit and partial application", () => {
  const src = `extern add2 : number -> number -> number = "./u.js" "add2"
let a = add2(10, 32)
let b = add2(10)(32)`;
  const code = unwrapOk(compile(src)).replace(
    /import \{ add2 as \$add2 \} from "[^"]+";/,
    "const $add2 = (x, y) => x + y;",
  );
  const out = new Function(`${code}\nreturn { a, b };`)() as { a: number; b: number };
  expect(out).toEqual({ a: 42, b: 42 });
});

test("exported multi-arg extern wraps then re-exports the local binding", () => {
  const out = js(`export extern draw : string -> string -> number = "./u.js" "draw"`);
  expect(out).toContain("const draw = _curry(2, $draw);");
  expect(out).toContain("export { draw };");
});

test("an extern is usable and type-checked at its call sites", () => {
  const src = `extern triple : number -> number = "./u.js" "triple"\nlet a = triple(7)`;
  expect(isErr(compile(src))).toBe(false);
  expect(js(src)).toContain("const a = triple(7);");
});

test("calling an extern with the wrong argument type is a type error", () => {
  const src = `extern triple : number -> number = "./u.js" "triple"\nlet bad = triple("x")`;
  expect(isErr(compile(src))).toBe(true);
});

test("extern round-trips through the formatter", () => {
  const src = `extern  hypot:number->number->number="node:math"  "hypot"`;
  expect(unwrapOk(format(src))).toBe(
    `extern hypot : number -> number -> number = "node:math" "hypot"\n`,
  );
});

test("an applied type constructor in a signature is a parameterized type", () => {
  // `Task a` is Task applied to a var — polymorphic in the element type.
  expect(schemeOf(`extern of : a -> Task a = "./t.js" "of"`, "of")).toMatch(
    /^'t\d+ -> Task<'t\d+>$/,
  );
});

test("applied type constructors unify across a chain", () => {
  const ok = `extern delay : number -> Task number = "./t.js" "delay"
extern run : Task number -> number = "./t.js" "run"
let a = run(delay(1))`;
  expect(isErr(compile(ok))).toBe(false);
  // Task number ≠ Task string — the element type must match.
  const bad = `extern delay : number -> Task number = "./t.js" "delay"
extern needStr : Task string -> number = "./t.js" "needStr"
let a = needStr(delay(1))`;
  expect(isErr(compile(bad))).toBe(true);
});

test("applied types round-trip through the formatter, parenthesizing compound args", () => {
  const src = `extern mapT : (a -> b) -> Task a -> Task b = "./t.js" "mapT"`;
  expect(unwrapOk(format(src))).toBe(
    `extern mapT : (a -> b) -> Task a -> Task b = "./t.js" "mapT"\n`,
  );
});
