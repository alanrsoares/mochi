// Type-error messages fold transparent record aliases back to their name, so a
// mismatch reads `… with Point`, not `… with { x: number, y: number }`. The
// alias machinery already backs hover and `.d.ts`; this extends it to the
// unify-mismatch path via the `u()` seam in infer.ts. See CRITIQUE §4.1.

import { expect, test } from "bun:test";
import { unwrapErr } from "@onrails/result";
import { compile } from "../src/compile";

const errMsg = (src: string): string => unwrapErr(compile(src)).message;

test("a mismatch names the record alias instead of its row", () => {
  const src =
    "type Point = { x: number, y: number }\n" +
    'extern origin : Point = "m" "o"\n' +
    "let bad = add(origin, 1)";
  const msg = errMsg(src);
  expect(msg).toContain("Point");
  expect(msg).not.toContain("{ x");
});

test("an alias nested inside a type constructor argument folds too", () => {
  const src =
    "type Point = { x: number, y: number }\n" +
    'extern pts : Array Point = "m" "p"\n' +
    'extern useNums : Array number -> number = "m" "u"\n' +
    "let bad = useNums(pts)";
  const msg = errMsg(src);
  expect(msg).toContain("Point");
  expect(msg).not.toContain("{ x");
});

test("the arity hint also folds the alias in the function type it prints", () => {
  const src =
    "type Point = { x: number, y: number }\n" +
    'extern needs : Point -> number = "m" "n"\n' +
    "let bad = add(needs, 1)";
  const msg = errMsg(src);
  expect(msg).toContain("Point");
  expect(msg).not.toContain("{ x");
});

test("an alias-free mismatch still reads cleanly (regression)", () => {
  const msg = errMsg("let bad = add(true, 1)");
  expect(msg).toContain("cannot unify");
  expect(msg).toContain("bool");
});
