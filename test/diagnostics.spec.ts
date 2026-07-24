import { expect, test } from "bun:test";
import { isErr } from "@onrails/result";
import { toTypedProgram } from "../src/compile";
import { diagnostics, toPublish } from "../src/diagnostics";

test("clean source produces no diagnostics", () => {
  expect(diagnostics("let n = add(mul(2, 3), 4)")).toEqual([]);
});

test("type error maps to a 0-based range on the offending expression", () => {
  const d = diagnostics("let bad = add(1, { x: 2 })");
  expect(d).toHaveLength(1);
  // record arg spans offsets 17..25 on line 0
  expect(d[0]!.range).toEqual({
    start: { line: 0, character: 17 },
    end: { line: 0, character: 25 },
  });
  expect(d[0]!.message).toStartWith("type:");
});

test("error on a later line reports the right line and column", () => {
  const d = diagnostics("let a = 1\nlet b = pi.x"); // pi : number, field on line 1
  expect(d).toHaveLength(1);
  expect(d[0]!.range.start).toEqual({ line: 1, character: 8 });
});

test("diagnostics surface did-you-mean suggestions", () => {
  // compile()/LSP diagnostics are open-world (host globals); did-you-mean runs
  // in strict mode so intentional open names aren't false-positived.
  const src = "let count = 1\nlet n = coun";
  const r = toTypedProgram(src, { open: false });
  expect(isErr(r)).toBe(true);
  if (!isErr(r)) return;
  const d = toPublish(src, r.error, "/t.mochi");
  expect(d.message).toContain("help: did you mean 'count'?");
  expect(d.suggestions?.[0]?.replaceWith).toBe("count");
});
