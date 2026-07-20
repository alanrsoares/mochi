// Record patterns in `switch`: field punning binds, literal fields narrow.
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import { check } from "../src/check";
import { compile } from "../src/compile";
import { inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeEnv } from "../src/prelude";

const js = (src: string): string => unwrapOk(compile(src));

const schemeOf = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  return showScheme(unwrapOk(inferProgram(prog, preludeEnv, { open: true })).get(name)!);
};

const run = (src: string, ret: string): unknown => {
  const body = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function("match", "add", `${body}\nreturn ${ret};`)(
    match,
    (a: number, b: number) => a + b,
  );
};

test("a pure-binding record pattern is a catch-all that destructures", () => {
  const out = js("let f = p => switch p { | { x, y } => add(x, y) }");
  expect(out).toContain(".otherwise(({ x, y }) => add(x, y))");
});

test("a punning field binds its own name at runtime", () => {
  const src = "let f = p => switch p { | { x } => x }\nlet a = f({ x: 7 })";
  expect(run(src, "a")).toBe(7);
});

test("a renamed field binds to the new name", () => {
  const out = js("let f = p => switch p { | { x: n } => n }");
  expect(out).toContain(".otherwise(({ x: n }) => n)");
});

test("a literal field narrows via the matcher object", () => {
  const out = js('let f = p => switch p { | { status: "ok" } => 1 | _ => 0 }');
  expect(out).toContain('.with({ status: "ok" }, () => 1)');
});

test("literal-narrowed fields coexist with binding fields", () => {
  const out = js('let f = p => switch p { | { status: "err", code } => code | _ => 0 }');
  expect(out).toContain('.with({ status: "err" }, ({ code }) => code)');
});

test("a record switch selects the narrowed arm at runtime", () => {
  const src = [
    'let f = p => switch p { | { tag: "a", n } => n | { tag: "b", n } => add(n, 100) | _ => 0 }',
    'let a = f({ tag: "b", n: 5 })',
  ].join("\n");
  expect(run(src, "a")).toBe(105);
});

test("a pure-binding record pattern is exhaustive without a catch-all", () => {
  expect(isErr(compile("let f = p => switch p { | { x, y } => add(x, y) }"))).toBe(false);
});

test("a literal-narrowing record pattern needs a catch-all", () => {
  expect(isErr(compile('let f = p => switch p { | { status: "ok" } => 1 }'))).toBe(true);
});

test("record patterns type the scrutinee structurally (open row)", () => {
  // duck typing: the pattern requires AT LEAST field x, of the bound type.
  expect(schemeOf("let f = p => switch p { | { x } => add(x, 1) }", "f")).toContain("number");
});

test("nested field patterns are rejected at parse time", () => {
  const err = compile(
    "type T a = | Some(a)\nlet g = r => switch r { | { v: Some(x) } => x | _ => 0 }",
  );
  expect(isErr(err)).toBe(true);
});
