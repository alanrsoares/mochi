// String literal patterns in `switch`.
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";

const js = (src: string): string => unwrapOk(compile(src));

const run = (src: string, ret: string): unknown => {
  const body = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function("match", `${body}\nreturn ${ret};`)(match);
};

test('string arms lower to literal .with("...", ...)', () => {
  const out = js('let f = s => switch s { | "a" => 1 | _ => 0 }');
  expect(out).toContain('.with("a", () => 1)');
});

test("a string switch needs a catch-all to be exhaustive", () => {
  expect(isErr(compile('let f = s => switch s { | "a" => 1 | "b" => 2 }'))).toBe(true);
});

test("a string switch with a catch-all compiles", () => {
  expect(isErr(compile('let f = s => switch s { | "a" => 1 | _ => 0 }'))).toBe(false);
});

test("a string switch selects the matching arm at runtime", () => {
  const src = 'let f = s => switch s { | "hi" => 1 | "bye" => 2 | _ => 0 }\nlet a = f("bye")';
  expect(run(src, "a")).toBe(2);
});
