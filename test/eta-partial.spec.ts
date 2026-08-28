// `fmt` eta-contracts `x => f(a, x)` to `f(a)` when `f` is a prelude or
// namespace builtin (ADR 0091). Same-file lets are excluded: ADR 0037 only
// emits partial overloads for concrete bindings, and `fmt` cannot see schemes.
import { expect, test } from "bun:test";
import { format } from "@mochi/dx/format";
import { compileAndEval } from "@mochi/test-support";
import { unwrapOk } from "@onrails/result";

const fmt = (src: string) => unwrapOk(format(src));

test("a prelude callee collapses", () => {
  expect(fmt("let r = map(foo => add(1, foo), xs)\n")).toBe("let r = map(add(1), xs)\n");
});

test("a grouped saturating prelude call collapses the same way", () => {
  expect(fmt("let r = map(foo => add(1)(foo), xs)\n")).toContain("map(add(1), xs)");
});

test("a namespace callee collapses", () => {
  expect(fmt("let r = xs => Array.append(item, xs)\n")).toBe("let r = Array.append(item)\n");
});

test("an applied eta-lambda flattens in one pass", () => {
  expect(fmt("let r = (foo => Array.append(item, foo))(n)\n")).toContain(
    "let r = Array.append(item, n)",
  );
});

test("a same-file callee is left alone", () => {
  const src = "let bar = (x, y) => y\nlet r = map(foo => bar(baz, foo), xs)\n";
  expect(fmt(src)).toContain("foo => bar(baz, foo)");
});

test("an unknown callee is left alone", () => {
  const src = 'import { bar } from "./m"\nlet r = map(foo => bar(baz, foo), xs)\n';
  expect(fmt(src)).toContain("foo => bar(baz, foo)");
});

test("an extern callee is left alone", () => {
  const src =
    'extern bar : number -> number -> number = "./m" "bar"\nlet r = map(foo => bar(baz, foo), xs)\n';
  expect(fmt(src)).toContain("foo => bar(baz, foo)");
});

test("an unsaturated call is left alone", () => {
  expect(fmt("let r = map(foo => add(foo), xs)\n")).toContain("foo => add(foo)");
});

test("a prefix that re-evaluates is left alone", () => {
  expect(fmt("let r = map(foo => add(g(1), foo), xs)\n")).toContain("foo => g(1) + foo");
});

test("a param that appears in the prefix is left alone", () => {
  expect(fmt("let r = map(foo => Array.append(foo, foo), xs)\n")).toContain(
    "foo => Array.append(foo, foo)",
  );
});

test("a param annotation is kept", () => {
  expect(fmt("let r = map((foo: number) => Array.append(item, foo), xs)\n")).toContain(
    "(foo: number) => Array.append(item, foo)",
  );
});

test("a shadowed callee is left alone", () => {
  expect(fmt("let r = Array => map(foo => Array.append(item, foo), xs)\n")).toContain(
    "foo => Array.append(item, foo)",
  );
});

test("a non-trailing use of the param is left alone", () => {
  expect(fmt("let r = map(foo => add(foo, 1), xs)\n")).toContain("foo => foo + 1");
});

test("a curried lambda chain does not eta the inner param", () => {
  expect(fmt("let plus = a => b => a + b\n")).toBe("let plus = a => b => a + b\n");
});

test("a callback nested in another lambda still collapses", () => {
  expect(fmt("let f = a => map(foo => add(a, foo), xs)\n")).toBe("let f = a => map(add(a), xs)\n");
});

test("formatting is idempotent", () => {
  const src = "let r = map(foo => add(1, foo), xs)\n";
  const once = fmt(src);
  expect(fmt(once)).toBe(once);
});

test("an infix operand does not leave sticky parens", () => {
  const src = "let r = 1 + (foo => Array.append(item, foo))(n)\n";
  const once = fmt(src);
  expect(once).toContain("1 + Array.append(item, n)");
  expect(once).not.toContain("(Array.append(item, n))");
  expect(fmt(once)).toBe(once);
});

test("the collapsed partial evaluates identically", () => {
  const src = "let bar = (x, y) => x + y\n";
  const lambda = compileAndEval(`${src}let r = map(foo => bar(1, foo), [10, 20])`, "r");
  const partial = compileAndEval(`${src}let r = map(bar(1), [10, 20])`, "r");
  expect(lambda).toEqual([11, 21]);
  expect(partial).toEqual(lambda);
});
