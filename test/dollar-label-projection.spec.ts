// `$tone` is a legal record *key* (ADR 0009 transient props), so it must be a
// legal projection too: `props.$tone` reads what `{ $tone: … }` writes. `$` is
// still not a general identifier — `let $x` / a bare `$tone` param stay errors.
import { expect, test } from "bun:test";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { compileTargets } from "../src/compile-targets";
import { format } from "../src/format";

const js = (src: string): string => unwrapOk(compile(src));
const ts = (src: string): string => unwrapOk(compileTargets(src)).ts;
const PROPS = 'let props = { $tone: "rose", size: 1 }\n';

test("a $-label projects off a record literal", () => {
  expect(js(`${PROPS}let tone = props.$tone`)).toContain("const tone = props.$tone;");
});

test("projecting a $-label infers row-polymorphically", () => {
  const out = ts("let read = (p) => p.$tone");
  expect(out).toContain("{ $tone: A }");
});

test("a $-label projection typechecks against the literal that wrote it", () => {
  expect(isErr(compile(`${PROPS}let tone = props.$tone ++ "!"`))).toBe(false);
});

test("a $-label projection of a missing field is still a type error", () => {
  expect(isErr(compile(`${PROPS}let n = props.$missing ++ "!"`))).toBe(true);
});

test("chained $-label projections parse", () => {
  const out = js('let outer = { $slot: { $tone: "rose" } }\nlet t = outer.$slot.$tone');
  expect(out).toContain("outer.$slot.$tone");
});

test("a $-label projection round-trips through the formatter", () => {
  const src = "let read = p => p.$tone\n";
  expect(unwrapOk(format(src))).toBe(src);
});

test("$ is still not a general identifier", () => {
  const e = compile("let $x = 1");
  expect(isErr(e)).toBe(true);
  expect(unwrapErr(e)[0]?.kind).toBe("parse");
});
