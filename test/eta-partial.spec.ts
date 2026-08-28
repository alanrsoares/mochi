// `fmt` eta-contracts `x => f(a, x)` to `f(a)` when `f`'s arity is known and
// `a` is inert (ADR 0091). Same syntactic arity table as ADR 0065 — no types.
import { expect, test } from "bun:test";
import { format } from "@mochi/dx/format";
import { compileAndEval } from "@mochi/test-support";
import { unwrapOk } from "@onrails/result";

const fmt = (src: string) => unwrapOk(format(src));

test("a saturating trailing lambda collapses to a partial", () => {
  const src = "let bar = (x, y) => y\nlet r = map(foo => bar(baz, foo), xs)\n";
  expect(fmt(src)).toBe("let bar = (x, y) => y\nlet r = map(bar(baz), xs)\n");
});

test("a grouped saturating call collapses the same way", () => {
  const src = "let bar = (x, y) => y\nlet r = map(foo => bar(baz)(foo), xs)\n";
  expect(fmt(src)).toContain("map(bar(baz), xs)");
});

test("a prelude callee collapses", () => {
  expect(fmt("let r = map(foo => add(1, foo), xs)\n")).toBe("let r = map(add(1), xs)\n");
});

test("a namespace callee collapses", () => {
  expect(fmt("let r = xs => Array.append(item, xs)\n")).toBe("let r = Array.append(item)\n");
});

test("an applied eta-lambda flattens in one pass", () => {
  const src = "let bar = (x, y) => y\nlet r = (foo => bar(baz, foo))(n)\n";
  expect(fmt(src)).toContain("let r = bar(baz, n)");
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
  const src = "let bar = (x, y, z) => z\nlet r = map(foo => bar(baz, foo), xs)\n";
  expect(fmt(src)).toContain("foo => bar(baz, foo)");
});

test("a prefix that re-evaluates is left alone", () => {
  const src = "let bar = (x, y) => y\nlet r = map(foo => bar(g(1), foo), xs)\n";
  expect(fmt(src)).toContain("foo => bar(g(1), foo)");
});

test("a param that appears in the prefix is left alone", () => {
  const src = "let bar = (x, y) => y\nlet r = map(foo => bar(foo, foo), xs)\n";
  expect(fmt(src)).toContain("foo => bar(foo, foo)");
});

test("a param annotation is kept", () => {
  const src = "let bar = (x, y) => y\nlet r = map((foo: number) => bar(baz, foo), xs)\n";
  expect(fmt(src)).toContain("(foo: number) => bar(baz, foo)");
});

test("a shadowed callee is left alone", () => {
  const src = "let bar = (x, y) => y\nlet r = bar => map(foo => bar(baz, foo), xs)\n";
  expect(fmt(src)).toContain("foo => bar(baz, foo)");
});

test("a non-trailing use of the param is left alone", () => {
  expect(fmt("let r = map(foo => add(foo, 1), xs)\n")).toContain("foo => foo + 1");
});

test("a curried lambda chain does not eta the inner param", () => {
  expect(fmt("let plus = a => b => a + b\n")).toBe("let plus = a => b => a + b\n");
});

test("a callback nested in another lambda still collapses", () => {
  const src = "let bar = (x, y) => y\nlet f = a => map(foo => bar(a, foo), xs)\n";
  expect(fmt(src)).toBe("let bar = (x, y) => y\nlet f = a => map(bar(a), xs)\n");
});

test("formatting is idempotent", () => {
  const src = "let bar = (x, y) => y\nlet r = map(foo => bar(baz, foo), xs)\n";
  const once = fmt(src);
  expect(fmt(once)).toBe(once);
});

test("an infix operand does not leave sticky parens", () => {
  const src = "let bar = (x, y) => y\nlet r = 1 + (foo => bar(baz, foo))(n)\n";
  const once = fmt(src);
  expect(once).toContain("1 + bar(baz, n)");
  expect(once).not.toContain("(bar(baz, n))");
  expect(fmt(once)).toBe(once);
});

test("the collapsed partial evaluates identically", () => {
  const src = "let bar = (x, y) => x + y\n";
  const lambda = compileAndEval(`${src}let r = map(foo => bar(1, foo), [10, 20])`, "r");
  const partial = compileAndEval(`${src}let r = map(bar(1), [10, 20])`, "r");
  expect(lambda).toEqual([11, 21]);
  expect(partial).toEqual(lambda);
});
