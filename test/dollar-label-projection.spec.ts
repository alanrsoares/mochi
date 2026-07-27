// `$tone` is a legal record *key* (ADR 0009 transient props), so it must be a
// legal projection too: `props.$tone` reads what `{ $tone: … }` writes. Since
// ADR 0047 `$` is an ordinary identifier char, so it also binds and destructures.
import { expect, test } from "bun:test";
import { format } from "@mochi/dx/format";
import { isErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { compileTargets } from "../src/compile-targets";

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

test("$ is an ordinary identifier char (ADR 0047)", () => {
  expect(js("let $x = 1")).toContain("const $x = 1;");
  expect(js("let id$ = x => x\nlet one = id$(1)")).toContain("id$(1)");
});

test("a $-label destructures out of a record parameter", () => {
  const out = js("let pick = ({ $tone }) => $tone");
  expect(out).toContain("({ $tone })");
});

test("a $-label binds in a record pattern", () => {
  expect(js(`${PROPS}let t = switch props { | { $tone: v } => v }`)).toContain("$tone:");
});
