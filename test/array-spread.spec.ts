// Collection spreads — Array / List / Set share `SeqElem` (ADR 0001).
// Set literals `#{a, b}` (no colons) dedupe like native JS Set; `#{}` stays Map.

import { expect, test } from "bun:test";
import { isErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { format } from "../src/format";

const run = (src: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function(`${js}\nreturn r;`)();
};

// --- Array (regression) -----------------------------------------------------

test("array prepend/append/multi spreads", () => {
  expect(run("let xs = [2, 3]\nlet r = [1, ...xs]")).toEqual([1, 2, 3]);
  expect(run("let xs = [1, 2]\nlet r = [...xs, 3]")).toEqual([1, 2, 3]);
  expect(run("let a = [1]\nlet b = [2]\nlet r = [...a, 0, ...b]")).toEqual([1, 0, 2]);
});

// --- List -------------------------------------------------------------------

test("list spread concatenates lazily (materialized)", () => {
  const src = "let xs = @{2, 3}\nlet r = @{1, ...xs} |> toArray";
  expect(run(src)).toEqual([1, 2, 3]);
});

test("list multi-spread", () => {
  const src = "let a = @{1}\nlet b = @{3}\nlet r = @{...a, 2, ...b} |> toArray";
  expect(run(src)).toEqual([1, 2, 3]);
});

test("spreading an Array into a List is a type error", () => {
  expect(isErr(compile("let xs = [1]\nlet r = @{...xs}"))).toBe(true);
});

// --- Set --------------------------------------------------------------------

test("set literal without colons", () => {
  const r = run("let r = #{1, 2, 1}") as Set<number>;
  expect(r).toBeInstanceOf(Set);
  expect([...r].sort()).toEqual([1, 2]);
});

test("set spread unions and dedupes", () => {
  const r = run("let s = #{1, 2}\nlet r = #{0, ...s, 2, 3}") as Set<number>;
  expect([...r].sort()).toEqual([0, 1, 2, 3]);
});

test("empty #{} remains Map", () => {
  const r = run("let r = #{}");
  expect(r).toBeInstanceOf(Map);
});

test("map with colons still parses as Map", () => {
  const r = run('let r = #{ "a": 1, "b": 2 }') as Map<string, number>;
  expect(r).toBeInstanceOf(Map);
  expect(r.get("a")).toBe(1);
});

test("spreading an Array into a Set is a type error", () => {
  expect(isErr(compile("let xs = [1]\nlet r = #{...xs}"))).toBe(true);
});

test("formatter round-trips list and set spreads", () => {
  for (const src of ["let r = @{1, ...xs}\n", "let r = #{1, ...s}\n"]) {
    const once = unwrapOk(format(src));
    expect(once).toContain("...");
    expect(unwrapOk(format(once))).toBe(once);
  }
});
