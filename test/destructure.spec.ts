import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler";
import { parseProgram } from "@mochi/compiler/bootstrap/syntax";
import { preludeJs } from "@mochi/compiler/prelude";
import { compileJs } from "@mochi/test-support";
import { isErr, unwrapOk } from "@onrails/result";

const run = (src: string): unknown => {
  const js = compileJs(src);
  return new Function(`${preludeJs}\n${js}\nreturn last;`)();
};

test("record destructuring desugars to a temp + one field-access let per name", () => {
  const prog = unwrapOk(parseProgram("let { x, y } = p"));
  expect(prog.stmts.map((s) => s._tag)).toEqual(["SLet", "SLet", "SLet"]);
  const [tmp, bx, by] = prog.stmts;
  expect(tmp!._tag === "SLet" && tmp!.name.startsWith("$")).toBe(true);
  expect(bx!._tag === "SLet" && bx!.name).toBe("x");
  expect(by!._tag === "SLet" && by!.name).toBe("y");
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
