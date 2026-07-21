// List destructuring in `switch`: [], [x], [head, ...tail]. Patterns lower to
// length-guards over @onrails/pattern; a `[]` + `[x, ...xs]` pair is total.
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { format } from "../src/format";

// Compile standalone (prelude inlined), inject `match` for the stripped import.
const run = (src: string, ret: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function("match", `${js}\nreturn ${ret};`)(match);
};

const js = (src: string): string => unwrapOk(compile(src, { runtime: false }));

const SUM = [
  "let sum = xs => switch xs {",
  "  | [] => 0",
  "  | [head, ...tail] => add(head, sum(tail))",
  "}",
].join("\n");

test("cons recursion sums a list", () => {
  expect(run(`${SUM}\nlet total = sum([1, 2, 3, 4])`, "total")).toBe(10);
});

test("cons recursion on the empty list hits the base case", () => {
  expect(run(`${SUM}\nlet total = sum([])`, "total")).toBe(0);
});

test("a fixed-length arm selects by exact length", () => {
  const src = [
    "let label = xs => switch xs {",
    '  | [] => "none"',
    '  | [x] => "one"',
    '  | [head, ...tail] => "many"',
    "}",
    "let a = label([])",
    "let b = label([7])",
    "let c = label([7, 8, 9])",
  ].join("\n");
  expect(run(src, "a")).toBe("none");
  expect(run(src, "b")).toBe("one");
  expect(run(src, "c")).toBe("many");
});

test("head and tail bind to the right values", () => {
  const src = [
    "let headOr0 = xs => switch xs {",
    "  | [] => 0",
    "  | [head, ...tail] => head",
    "}",
    "let h = headOr0([42, 1, 2])",
  ].join("\n");
  expect(run(src, "h")).toBe(42);
});

test("a literal element narrows via an index guard", () => {
  expect(js("let f = xs => switch xs { | [0] => 1 | _ => 2 }")).toContain("_v[0] === 0");
});

test("empty-list arm lowers to a length-zero guard", () => {
  expect(js("let f = xs => switch xs { | [] => 0 | _ => 1 }")).toContain(
    ".with((_v) => _v.length === 0",
  );
});

test("a cons arm lowers to a >= guard and a rest destructure", () => {
  const out = js("let f = xs => switch xs { | [] => 0 | [h, ...t] => h }");
  expect(out).toContain("_v.length >= 1");
  expect(out).toContain("([h, ...t]) =>");
});

test("[] plus [x, ...xs] is exhaustive", () => {
  expect(isErr(compile("let f = xs => switch xs { | [] => 0 | [x, ...xs] => x }"))).toBe(false);
});

test("a lone empty-list arm is a non-exhaustive error", () => {
  const r = compile("let f = xs => switch xs { | [] => 0 }");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).kind).toBe("check");
});

test("[...all] is a catch-all", () => {
  expect(isErr(compile("let f = xs => switch xs { | [...all] => all }"))).toBe(false);
});

test("list patterns survive formatting verbatim", () => {
  const src = "let f = xs => switch xs { | [] => 0 | [head, ...tail] => head }\n";
  expect(unwrapOk(format(src))).toBe(src);
});
