import { expect, test } from "bun:test";
import { unwrapOk } from "@onrails/result";
import { format } from "../src/format";

const fmt = (src: string): string => unwrapOk(format(src));

test("normalizes whitespace in a let binding", () => {
  expect(fmt("let   n=add(1,2)")).toBe("let n = add(1, 2)\n");
});

test("a single-param lambda drops its parentheses", () => {
  expect(fmt("let f=(x)=>x")).toBe("let f = x => x\n");
});

test("a multi-param lambda keeps its parentheses", () => {
  expect(fmt("let g=(a,b)=>add(a,b)")).toBe("let g = (a, b) => add(a, b)\n");
});

test("switch breaks across lines, one arm per line", () => {
  expect(fmt("let m=r=>switch r {|Ok(v)=>v|Err(e)=>e}")).toBe(
    "let m = r => switch r {\n  | Ok(v) => v\n  | Err(e) => e\n}\n",
  );
});

test("a parametric type prints its params and one ctor per line", () => {
  expect(fmt("type Result a e = | Ok(a) | Err(e)")).toBe(
    "type Result a e =\n  | Ok(a)\n  | Err(e)\n",
  );
});

test("record destructuring is re-folded from its desugared form", () => {
  expect(fmt("let {x,y}=p")).toBe("let { x, y } = p\n");
});

test("formatting is idempotent", () => {
  const once = fmt("let   m=r=>switch r {|Ok(v)=>Ok(v)|Err(e)=>Err(e)}\nlet {a,b}=rec");
  expect(fmt(once)).toBe(once);
});
