// Or-patterns `| A | B => body` — one arm, several alternative patterns. The
// alternatives must bind the SAME names at the SAME structural position, and
// each name's type unifies across alts (so one body/handler serves all). See
// ADR 0022.

import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { format } from "../src/format";

const run = (src: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/gm, "");
  return new Function("match", `${js}\nreturn r;`)(match);
};

const errMsg = (src: string): string => unwrapErr(compile(src))[0]!.message;

// --- runtime + codegen ------------------------------------------------------

test("string-literal alternatives dispatch to one body", () => {
  const src =
    'let kind = t => switch t { | "let" | "const" | "var" => "kw" | _ => "id" }\n' +
    'let r = kind("const")';
  expect(run(src)).toBe("kw");
});

test("number-literal alternatives", () => {
  const src = "let small = n => switch n { | 1 | 2 | 3 => true | _ => false }\nlet r = small(2)";
  expect(run(src)).toBe(true);
});

test("nullary constructor alternatives", () => {
  const src =
    "type C = | Red | Green | Blue | Black\n" +
    'let name = c => switch c { | Red | Green | Blue => "primary" | Black => "ink" }\n' +
    "let r = name(Green)";
  expect(run(src)).toBe("primary");
});

test("constructor alternatives bind operands consistently", () => {
  const src =
    "type E = | Add(number, number) | Sub(number, number) | Lit(number)\n" +
    "let ev = e => switch e { | Add(l, r) | Sub(l, r) => add(l, r) | Lit(n) => n }\n" +
    "let r = ev(Sub(4, 5))";
  expect(run(src)).toBe(9);
});

test("or-pattern arm emits a `||` of the alternatives", () => {
  const js = unwrapOk(compile('let f = t => switch t { | "a" | "b" => 1 | _ => 0 }'));
  expect(js).toContain("||");
});

test("guard on an or-pattern arm runs after the structural test", () => {
  const src =
    "type E = | Add(number, number) | Sub(number, number) | Lit(number)\n" +
    "let ev = e => switch e { | Add(l, r) | Sub(l, r) when gt(l, 0) => add(l, r) | _ => 0 }\n" +
    "let r = ev(Add(3, 4))";
  expect(run(src)).toBe(7);
});

// --- exhaustiveness ---------------------------------------------------------

test("both booleans in one or-pattern arm is total", () => {
  expect(isErr(compile("let f = b => switch b { | true | false => 1 }"))).toBe(false);
});

test("an or-pattern covering every constructor is total", () => {
  const src = "type C = | Red | Green | Blue\nlet f = c => switch c { | Red | Green | Blue => 1 }";
  expect(isErr(compile(src))).toBe(false);
});

test("an or-pattern missing a constructor is still non-exhaustive", () => {
  const src = "type C = | Red | Green | Blue\nlet f = c => switch c { | Red | Green => 1 }";
  expect(errMsg(src)).toContain("non-exhaustive");
});

// --- binder + type rules ----------------------------------------------------

test("alternatives binding different names is rejected", () => {
  const src =
    "type E = | Add(number, number) | Sub(number, number)\n" +
    "let f = e => switch e { | Add(l, r) | Sub(a, b) => 0 }";
  expect(errMsg(src)).toContain("same name");
});

test("alternatives binding a name at differing positions is rejected", () => {
  const src =
    "type E = | Add(number, number) | Sub(number, number)\n" +
    "let f = e => switch e { | Add(l, r) | Sub(r, l) => 0 }";
  expect(errMsg(src)).toContain("position");
});

test("alternatives whose types don't unify is rejected", () => {
  expect(isErr(compile('let f = x => switch x { | 1 | "a" => 0 | _ => 1 }'))).toBe(true);
});

test("a catch-all alternative is rejected", () => {
  const src = 'let f = t => switch t { | "a" | _ => 1 | "b" => 2 }';
  expect(errMsg(src)).toContain("catch-all");
});

test("an array/list pattern as an alternative is rejected", () => {
  const src = "let f = xs => switch xs { | [] | [_] => 0 | _ => 1 }";
  expect(isErr(compile(src))).toBe(true);
});

// --- formatter --------------------------------------------------------------

test("formatter round-trips an or-pattern arm", () => {
  const src = "let f = c => switch c {\n| Red | Green => 1\n| _ => 0\n}\n";
  const once = unwrapOk(format(src));
  expect(once).toContain("| Red | Green =>");
  expect(unwrapOk(format(once))).toBe(once);
});
