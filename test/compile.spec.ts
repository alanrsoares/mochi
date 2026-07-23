import { expect, test } from "bun:test";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { formatError } from "../src/errors";

// These assert pure lowering, so compile prelude-free (runtime off); the
// standalone prelude-inlining path is covered separately below.
const js = (src: string) => unwrapOk(compile(src, { runtime: false }));

test("pipeline desugars to nested calls", () => {
  expect(js("let result = 5 |> double |> inc")).toBe("const result = inc(double(5));\n");
});

test("call with args", () => {
  expect(js("let x = add(1, 2)")).toBe("const x = add(1, 2);\n");
});

test("pipe into call keeps existing args, injects piped value", () => {
  expect(js("let y = 3 |> f |> g(9)")).toBe("const y = g(9)(f(3));\n");
});

test("multiple lets", () => {
  expect(js("let a = 1\nlet b = a |> inc")).toBe("const a = 1;\nconst b = inc(a);\n");
});

test("single-param lambda", () => {
  expect(js("let inc = x => add(x, 1)")).toBe("const inc = (x) => add(x, 1);\n");
});

test("multi-param lambda", () => {
  // Arity ≥ 2 lowers to a `_curry`-wrapped flat function (CRITIQUE §4.4).
  expect(js("let add = (a, b) => plus(a, b)")).toBe(
    "const add = _curry(2, (a, b) => plus(a, b));\n",
  );
});

test("arrow binds looser than pipe: x => x |> f", () => {
  expect(js("let f = x => x |> inc")).toBe("const f = (x) => inc(x);\n");
});

test("lambda piped and immediately applied", () => {
  expect(js("let y = 5 |> (x => double(x))")).toBe("const y = ((x) => double(x))(5);\n");
});

// ---- variants + pattern matching ----

test("variant decl → constructor factories (plain JS, no type annotations)", () => {
  expect(js("type Shape = | Circle(float) | Rect(float, float)")).toBe(
    [
      `const Circle = (_0) => ({ _tag: "Circle", _0 });`,
      // Multi-field ctors curry too, so partial application works (§4.4).
      `const Rect = _curry(2, (_0, _1) => ({ _tag: "Rect", _0, _1 }));`,
      "",
    ].join("\n"),
  );
});

test("nullary constructor → value, not function", () => {
  expect(js("type Color = | Red | Green")).toBe(
    [`const Red = { _tag: "Red" };`, `const Green = { _tag: "Green" };`, ""].join("\n"),
  );
});

test("exhaustive switch → @onrails/pattern .exhaustive()", () => {
  const out = js(
    "type Shape = | Circle(float) | Rect(float, float)\n" +
      "let area = shape => switch shape { | Circle(r) => square(r) | Rect(w, h) => mul(w, h) }",
  );
  expect(out).toContain(`import { match } from "@onrails/pattern";`);
  expect(out).toContain("const area = (shape) => match(shape)");
  expect(out).toContain(`.with({ _tag: "Circle" }, ({ _0: r }) => square(r))`);
  expect(out).toContain(`.with({ _tag: "Rect" }, ({ _0: w, _1: h }) => mul(w, h))`);
  expect(out).toContain(".exhaustive()");
});

test("wildcard arm → .otherwise()", () => {
  const out = js(
    "type Shape = | Circle(float) | Rect(float, float)\n" +
      "let name = shape => switch shape { | Circle(r) => circle | _ => other }",
  );
  expect(out).toContain(`.with({ _tag: "Circle" }, ({ _0: r }) => circle)`);
  expect(out).toContain(".otherwise(() => other)");
});

test("non-exhaustive switch is a compile error naming the missing ctor", () => {
  const r = compile(
    "type Shape = | Circle(float) | Rect(float, float)\n" +
      "let area = shape => switch shape { | Circle(r) => square(r) }",
  );
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)).toEqual({
    kind: "check",
    message: "non-exhaustive switch on 'Shape': missing Rect",
    span: { start: 70, end: 111 },
  });
});

test("unknown constructor in a pattern is a compile error", () => {
  const r = compile(
    "type Shape = | Circle(float)\n" +
      "let f = shape => switch shape { | Circle(r) => r | Square(s) => s }",
  );
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).message).toContain("unknown constructor 'Square'");
});

test("constructor arity mismatch is a compile error", () => {
  const r = compile(
    "type Shape = | Rect(float, float)\n" + "let f = shape => switch shape { | Rect(w) => w }",
  );
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).message).toContain("expects 2 arg(s), got 1");
});

// ---- records + field access ----

test("record literal", () => {
  expect(js("let p = { x: 1, y: 2 }")).toBe("const p = { x: 1, y: 2 };\n");
});

test("empty record", () => {
  expect(js("let e = {}")).toBe("const e = {};\n");
});

test("field access", () => {
  expect(js("let getX = p => p.x")).toBe("const getX = (p) => p.x;\n");
});

test("chained field access", () => {
  expect(js("let deep = p => p.a.b.c")).toBe("const deep = (p) => p.a.b.c;\n");
});

test("field access on a record literal is parenthesized", () => {
  expect(js("let v = { x: 1 }.x")).toBe("const v = ({ x: 1 }).x;\n");
});

test("record as arrow body is parenthesized (else JS parses a block)", () => {
  expect(js("let mk = x => { v: x }")).toBe("const mk = (x) => ({ v: x });\n");
});

test("record value can be piped, field feeds a call", () => {
  expect(js("let n = { p: point } |> render")).toBe("const n = render({ p: point });\n");
  expect(js("let d = dist(a.x, b.y)")).toBe("const d = dist(a.x, b.y);\n");
});

test("nested record + field, method-style call on a field", () => {
  expect(js("let r = { origin: { x: 0, y: 0 } }")).toBe("const r = { origin: { x: 0, y: 0 } };\n");
  expect(js("let c = obj.method(1, 2)")).toBe("const c = obj.method(1, 2);\n");
});

test("line comments are ignored", () => {
  expect(js("// header\nlet x = 1 // trailing\nlet y = x")).toBe("const x = 1;\nconst y = x;\n");
});

// ---- type inference is wired into compile ----

test("prelude-typed misuse is a compile-time type error", () => {
  // add : number -> number -> number, but given a record
  const r = compile("let bad = add(1, { x: 2 })");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).kind).toBe("type");
});

test("field access on a non-record is a type error", () => {
  const r = compile("let bad = pi.x"); // pi : number
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).kind).toBe("type");
});

test("well-typed prelude arithmetic compiles", () => {
  expect(js("let n = add(mul(2, 3), 4)")).toBe("const n = add(mul(2, 3), 4);\n");
});

// ---- errors carry source spans ----

test("type error carries the offending expression's span", () => {
  const r = compile("let bad = add(1, { x: 2 })");
  expect(isErr(r)).toBe(true);
  // the record argument starts at offset 17
  expect(unwrapErr(r).span).toEqual({ start: 17, end: 25 });
});

test("parse error carries the offending token's span", () => {
  const r = compile("let = 5");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).span).toEqual({ start: 4, end: 5 });
});

test("formatError renders line:col when given the source", () => {
  const src = "let a = 1\nlet b = pi.x"; // pi : number, field access on line 2
  const r = compile(src);
  expect(isErr(r)).toBe(true);
  expect(formatError(unwrapErr(r), src)).toStartWith("TypeError at 2:9: cannot unify number");
});

test("formatError falls back to raw offset without source", () => {
  const r = compile("let x = ^");
  expect(isErr(r)).toBe(true);
  expect(formatError(unwrapErr(r))).toBe("LexError at 8: unexpected char '^'");
});

test("lex error is a value, not a throw", () => {
  const r = compile("let x = ^");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)).toEqual({
    kind: "lex",
    message: "unexpected char '^'",
    span: { start: 8, end: 9 },
  });
});

test("parse error is a value, not a throw", () => {
  const r = compile("let = 5");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).kind).toBe("parse");
});

test("a negative number literal lexes and emits as a signed value", () => {
  expect(js("let x = -3")).toBe("const x = -3;\n");
});

test("a negative literal works as a match pattern", () => {
  expect(js("let f = n => switch n { | -1 => 0 | _ => n }")).toContain(".with(-1, () => 0)");
});

test("a float literal keeps its form (no int coercion) in the output", () => {
  expect(js("let pi = 3.0")).toBe("const pi = 3.0;\n");
});

// ---- standalone output: prelude inlining (runtime on, the default) --------

test("standalone output inlines only the prelude builtins used", () => {
  const out = unwrapOk(compile("let n = add(mul(2, 3), 4)"));
  expect(out).toContain("const add = _curry(2, (a, b) => a + b);");
  expect(out).toContain("const mul = _curry(2, (a, b) => a * b);");
  expect(out).toContain("const _curry ="); // pulled in as a dep of add/mul
  expect(out).not.toContain("const sub"); // unused builtin not inlined
  expect(out).toContain("const n = add(mul(2, 3), 4);");
});

test("standalone output runs without any externally supplied prelude", () => {
  const out = unwrapOk(compile("let n = add(mul(2, 3), 4)"));
  const n = new Function(`${out}\nreturn n;`)();
  expect(n).toBe(10);
});

test("a user binding shadowing a builtin is not inlined (no duplicate const)", () => {
  // `hypot` is a prelude builtin; defining it locally must suppress the inline.
  const out = unwrapOk(compile("let hypot = 1\nlet r = add(hypot, 2)"));
  expect(out).not.toContain("Math.hypot");
  expect(out).toContain("const add ="); // add still inlined
  const r = new Function(`${out}\nreturn r;`)();
  expect(r).toBe(3);
});
