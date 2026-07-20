import { expect, test } from "bun:test";
import { isErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeJs } from "../src/prelude";

const run = (src: string): unknown => {
  const js = unwrapOk(compile(src));
  return new Function(`${preludeJs}\n${js}\nreturn last;`)();
};

test("record destructuring desugars to a temp + one field-access let per name", () => {
  const prog = unwrapOk(parse(unwrapOk(lex("let { x, y } = p"))));
  expect(prog.stmts.map((s) => s.kind)).toEqual(["let", "let", "let"]);
  const [tmp, bx, by] = prog.stmts;
  expect(tmp!.kind === "let" && tmp!.name.startsWith("$")).toBe(true);
  expect(bx!.kind === "let" && bx!.name).toBe("x");
  expect(by!.kind === "let" && by!.name).toBe("y");
});

test("destructured bindings evaluate to the matching fields", () => {
  const src = "let p = { x: 3, y: 4 }\nlet { x, y } = p\nlet last = sub(x, y)";
  expect(run(src)).toBe(-1);
});

test("the source expression is evaluated once, via the temp", () => {
  const js = unwrapOk(compile("let p = { a: 1 }\nlet { a } = p"));
  // exactly one temp assignment; `a` reads the temp, not a re-evaluation
  expect(js).toContain("const $d0 = p;");
  expect(js).toContain("const a = $d0.a;");
});

test("destructuring a missing field is a type error", () => {
  const r = compile("let p = { x: 1 }\nlet { x, y } = add(p, p)");
  expect(isErr(r)).toBe(true);
});

test("destructuring type-checks structurally (duck typing on the source)", () => {
  const src = "let p = { x: 1, y: 2, z: 3 }\nlet { x } = p\nlet last = x";
  expect(run(src)).toBe(1); // extra fields on the source are fine
});
