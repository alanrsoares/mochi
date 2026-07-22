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

test("normalizes an import statement", () => {
  expect(fmt('import {a,b}from"./mod"')).toBe('import { a, b } from "./mod"\n');
});

test("keeps the export prefix on a binding", () => {
  expect(fmt("export let x=1")).toBe("export let x = 1\n");
});

test("keeps the export prefix on a variant type", () => {
  expect(fmt("export type T=|A|B")).toBe("export type T =\n  | A\n  | B\n");
});

test("a switch that fits stays on one line", () => {
  expect(fmt("let m=r=>switch r {|Ok(v)=>v|Err(e)=>e}")).toBe(
    "let m = r => switch r { | Ok(v) => v | Err(e) => e }\n",
  );
});

test("a switch that overflows 80 columns breaks one arm per line", () => {
  expect(
    fmt(
      'let describe=n=>switch n {|None=>"nothing to report here at all"|Some(x)=>"got a useful value here"}',
    ),
  ).toBe(
    'let describe = n => switch n {\n  | None => "nothing to report here at all"\n  | Some(x) => "got a useful value here"\n}\n',
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

test("a pipe chain that overflows breaks one stage per line", () => {
  expect(
    fmt("let r = source |> transform(config) |> validate(rules) |> persist(database) |> report"),
  ).toBe(
    "let r = source\n  |> transform(config)\n  |> validate(rules)\n  |> persist(database)\n  |> report\n",
  );
});

test("a pipe that fits stays inline", () => {
  expect(fmt("let r = a |> b |> c")).toBe("let r = a |> b |> c\n");
});

test("breaks a two-segment pipe when a segment is itself multi-line", () => {
  const src =
    "let build = path => readFile(path) |> Result.flatMap(src => compile(src) |> Result.mapErr(e => formatError(path, src, e)) |> Result.flatMap(js => writeFile(outPath(path), js)))";
  const out = [
    "let build = path =>",
    "  readFile(path)",
    "    |> Result.flatMap(src =>",
    "      compile(src)",
    "        |> Result.mapErr(e => formatError(path, src, e))",
    "        |> Result.flatMap(js => writeFile(outPath(path), js)))",
    "",
  ].join("\n");
  expect(fmt(src)).toBe(out);
  expect(fmt(out)).toBe(out);
});

test("broken pipe chain is idempotent", () => {
  const once = fmt(
    "let r = source |> transform(config) |> validate(rules) |> persist(database) |> report",
  );
  expect(fmt(once)).toBe(once);
});

test("keeps parens around a nested pipe operand (associativity)", () => {
  expect(fmt("let r = a |> (b |> c)")).toBe("let r = a |> (b |> c)\n");
});

test("keeps parens around a lambda pipe operand (else it fails to reparse)", () => {
  const out = fmt("let r = a |> (x => x) |> g");
  expect(out).toBe("let r = a |> (x => x) |> g\n");
  expect(fmt(out)).toBe(out);
});

test("collapses a run of blank lines between statements to a single blank", () => {
  expect(fmt("let a = 1\n\n\n\nlet b = 2")).toBe("let a = 1\n\nlet b = 2\n");
});

test("preserves a single blank line and keeps adjacent statements adjacent", () => {
  expect(fmt("let a = 1\nlet b = 2\n\nlet c = 3")).toBe("let a = 1\nlet b = 2\n\nlet c = 3\n");
});

test("blank-line normalization is idempotent", () => {
  const once = fmt("let a = 1\n\n\nlet b = 2\nlet c = 3");
  expect(fmt(once)).toBe(once);
});

test("negative and float literals survive the formatter verbatim", () => {
  expect(fmt("let pi=3.0\nlet n= -42")).toBe("let pi = 3.0\nlet n = -42\n");
});

test("preserves leading comments, doc comments, and the blank between blocks", () => {
  const src = "// header one\n// header two\n\n/// doc for f\nlet f = x => x\n";
  expect(fmt(src)).toBe(src);
});

test("keeps an intra-expression comment on its own line above the body", () => {
  const src = "let g = y =>\n  // choose\n  switch y { | A => 1 | B => 2 }\n";
  expect(fmt(src)).toBe(src);
});

test("comment preservation is idempotent", () => {
  const once = fmt(
    "// top\nlet a = 1\n\nlet b = y =>\n  // note\n  switch y { | A => 1 | B => 2 }",
  );
  expect(fmt(once)).toBe(once);
});

test("keeps a trailing comment inline after the code it follows", () => {
  const src = "let x = 1 // the answer\nlet y = 2\n";
  expect(fmt(src)).toBe(src);
});

test("a trailing comment does not force a short construct to break", () => {
  const src = "let r = { a: 1, b: 2 } // rec\n";
  expect(fmt(src)).toBe(src);
});

test("a `//` inside a string is not mistaken for a trailing comment", () => {
  const src = 'let u = "http://x.com" // real\n';
  expect(fmt(src)).toBe(src);
});

test("a comment trailing a bare marker degrades to a leading comment", () => {
  // `: // note` has no node on its line to trail, so it attaches as a leading
  // comment of the else branch rather than being dropped.
  const once = fmt("let f = c ? a :\n  // note\n  b\n");
  expect(once).toContain("// note");
  expect(fmt(once)).toBe(once); // idempotent
});

test("trailing comments round-trip and stay idempotent", () => {
  const src = "let x = foo(1) // call\nlet t = c ? a : b // tern\n";
  expect(fmt(src)).toBe(src);
});
