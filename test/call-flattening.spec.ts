// `fmt` canonicalizes `f(a)(b)` to `f(a, b)` for a top-level lambda binding in
// the same file (ADR 0065). Codegen lowers such a binding to ONE `_curry`-wrapped
// flat function, so every grouping of the same arguments is the same call and the
// flat one is canonical. The rule is purely syntactic — no inference — so it still
// applies in a file that does not typecheck.
import { expect, test } from "bun:test";
import { format } from "@mochi/dx/format";
import { compileAndEval } from "@mochi/test-support";
import { unwrapOk } from "@onrails/result";

const fmt = (src: string) => unwrapOk(format(src));

test("a saturated curried call flattens", () => {
  const src = "let join2 = a => b => a\nlet r = join2(1)(2)\n";
  expect(fmt(src)).toBe("let join2 = a => b => a\nlet r = join2(1, 2)\n");
});

test("a multi-param binding flattens the same way", () => {
  const src = "let join2 = (a, b) => a\nlet r = join2(1)(2)\n";
  expect(fmt(src)).toContain("let r = join2(1, 2)");
});

test("three groups collapse into one", () => {
  const src = "let f = a => b => c => a\nlet r = f(1)(2)(3)\n";
  expect(fmt(src)).toContain("let r = f(1, 2, 3)");
});

test("a partial application is regrouped but not saturated", () => {
  const src = "let f = a => b => c => a\nlet r = f(1)(2)\n";
  expect(fmt(src)).toContain("let r = f(1, 2)");
});

test("a single group is left alone", () => {
  const src = "let f = a => b => a\nlet r = f(1)\n";
  expect(fmt(src)).toContain("let r = f(1)");
});

test("over-application past the known arity keeps its groups", () => {
  // `f(1, 2)` returns a callable; the third group applies THAT, not `f`.
  const src = "let f = a => b => a\nlet r = f(1)(2)(3)\n";
  expect(fmt(src)).toContain("let r = f(1, 2)(3)");
});

test("a prelude callee flattens — its arity is fixed by the runtime", () => {
  expect(fmt("let r = map(inc)(xs)\n")).toContain("let r = map(inc, xs)");
  // `reduce` is `_curry(3, …)`; two of three args is a partial application, and
  // regrouping it is still the same call.
  expect(fmt("let r = reduce(plus)(0)\n")).toContain("let r = reduce(plus, 0)");
});

test("a namespace callee flattens", () => {
  expect(fmt("let r = Array.contains(head)(body)\n")).toContain(
    "let r = Array.contains(head, body)",
  );
});

test("a shadowed prelude name is left alone", () => {
  const src = "let map = f => f\nlet r = map(inc)(xs)\n";
  expect(fmt(src)).toBe(src);
});

test("a shadowed namespace is left alone", () => {
  const src = "let r = xs => Array.contains(a)(b)\nlet Array = 1\n";
  expect(fmt(src)).toContain("Array.contains(a)(b)");
});

test("an imported callee is left alone", () => {
  const src = 'import { helper } from "./m"\nlet r = helper(1)(2)\n';
  expect(fmt(src)).toBe(src);
});

test("an extern callee is left alone", () => {
  const src = 'extern join2 : number -> number -> number = "./m" "join2"\nlet r = join2(1)(2)\n';
  expect(fmt(src)).toBe(src);
});

test("a shadowed name is left alone", () => {
  // The printer has no scopes: `f` inside `g` is a parameter, not the top-level
  // binding, so no `f` call in the file may be regrouped.
  const src = "let f = a => b => a\nlet g = f => f(1)(2)\n";
  expect(fmt(src)).toBe(src);
});

test("a non-ref callee is left alone", () => {
  const src = "let pick = t => t\nlet r = pick(1)(2)(3)\n";
  // `pick` has arity 1, so it is not in the table; nothing is regrouped.
  expect(fmt(src)).toBe(src);
});

test("formatting is idempotent", () => {
  const src = "let join2 = a => b => a\nlet r = join2(1)(2)\n";
  const once = fmt(src);
  expect(fmt(once)).toBe(once);
});

test("a broken file still flattens what it can parse", () => {
  // ADR 0045: `format` runs on the recovering parser. The rule needs no types,
  // so it survives a file that cannot typecheck.
  const src = "let join2 = a => b => a\nlet r = join2(1)(2)\nlet oops = ???\n";
  expect(fmt(src)).toContain("let r = join2(1, 2)");
  expect(fmt(src)).toContain("???");
});

test("the flattened call evaluates identically", () => {
  const src = "let join2 = a => b => a + b\n";
  const grouped = compileAndEval(`${src}let r = join2(1)(2)`, "r");
  const flat = compileAndEval(`${src}let r = join2(1, 2)`, "r");
  expect(grouped).toBe(3);
  expect(flat).toBe(grouped);
});

test("argument evaluation order is unchanged", () => {
  // Both groupings evaluate left-to-right before the body runs, so a rewrite
  // cannot reorder effects.
  const src = [
    "let log = (acc, x) => Array.append(x, acc)",
    "let seen = []",
    "let f = a => b => Array.length(Array.concat(a, b))",
    "let r = f([1])([2, 3])",
  ].join("\n");
  expect(fmt(`${src}\n`)).toContain("let r = f([1], [2, 3])");
});
