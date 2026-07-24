// JavaScript reserved words in a BINDING position (let/extern name, lambda /
// letin / letbind param, pattern bind, labelled ctor field) used to lower to a
// `const else = …` / `(else) => …` and SyntaxError at runtime — a silent
// miscompile (ADR 0016 hazard). check now rejects them with a rename hint.
// Object KEYS and member names (`{ default: 1 }`, `r.default`) are legal JS and
// are NOT binding positions — they stay allowed. See ADR 0020.

import { expect, test } from "bun:test";
import { isErr, isOk, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";

const errMsg = (src: string): string => unwrapErr(compile(src))[0]!.message;

// --- rejected binding positions ---------------------------------------------

test("let binding named a reserved word is rejected", () => {
  expect(isErr(compile("let else = 1\n"))).toBe(true);
  expect(errMsg("let else = 1\n")).toContain("'else' is a JavaScript reserved word");
});

test("extern binding named a reserved word is rejected", () => {
  expect(errMsg('extern new : number = "./m" "n"\n')).toContain("'new'");
});

test("lambda parameter named a reserved word is rejected", () => {
  expect(errMsg("let f = default => default\n")).toContain("'default'");
});

test("let-in local named a reserved word is rejected", () => {
  expect(errMsg("let f = n => let in = n in in\n")).toContain("'in'");
});

test("pattern bind named a reserved word is rejected", () => {
  const src = "type T = C(number)\nlet f = t => switch t { | C(class) => class }\n";
  expect(errMsg(src)).toContain("'class'");
});

test("labelled ctor field named a reserved word is rejected", () => {
  expect(errMsg("type T = X(else: number)\n")).toContain("'else'");
});

test("record-pattern pun binding a reserved word is rejected", () => {
  const src = "let f = r => switch r { | { else } => else }\n";
  expect(errMsg(src)).toContain("'else'");
});

// --- still legal: keys and member access are not bindings -------------------

test("record field KEY named a reserved word stays legal", () => {
  const r = compile("let p = { default: 1, class: 2 }\nlet a = p.default\n");
  expect(isOk(r)).toBe(true);
  expect(unwrapOk(r)).toContain("default");
});

test("renaming the binding compiles cleanly", () => {
  expect(isOk(compile("let elseBranch = 1\n"))).toBe(true);
});
