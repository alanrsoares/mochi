import { expect, test } from "bun:test";
import { hoverAt } from "../src/hover";

test("hover on a ref reports its inferred type", () => {
  //                 0123456789
  const src = "let p = pi";
  expect(hoverAt(src, 8)).toBe("number"); // cursor on `pi`
});

test("hover on a builtin ref reports its full arrow type", () => {
  //          0         1
  //          0123456789012345678
  const src = "let f = (x) => add(x, 1)";
  expect(hoverAt(src, 16)).toBe("number -> number -> number"); // on `add`
});

test("hover on a lambda parameter use reports the monomorphic type", () => {
  const src = "let f = (x) => add(x, 1)";
  expect(hoverAt(src, 19)).toBe("number"); // on the `x` inside add(...)
});

test("hover on a record literal reports the closed row", () => {
  const src = "let r = { x: 1, y: 2 }";
  expect(hoverAt(src, 8)).toBe("{ x: number, y: number }"); // on `{`
});

test("hover on a nested field value reports the tightest node", () => {
  //          0         1
  //          012345678901234
  const src = "let r = { x: 1, y: 2 }";
  expect(hoverAt(src, 13)).toBe("number"); // on the `1`
});

test("hover picks the tightest span (ref inside a call)", () => {
  const src = "let n = add(pi, 2)";
  expect(hoverAt(src, 12)).toBe("number"); // on `pi`, not the whole call
});

test("hover returns null off any node", () => {
  const src = "let p = pi";
  expect(hoverAt(src, 3)).toBeNull(); // whitespace before `=`
});

test("hover returns null when the program does not typecheck", () => {
  expect(hoverAt("let bad = add(1, { x: 2 })", 8)).toBeNull();
});

test("hover on a pattern-bound name reports its inferred type", () => {
  const src = "let f = n => switch n {\n  | 0 => n\n  | m => m\n}";
  const off = src.indexOf("| m") + 2; // the `m` in the pattern position
  expect(hoverAt(src, off)).toBe("number"); // unified with the numeric scrutinee
});

test("hover on a constructor pattern binding reports its field type", () => {
  const src =
    "type Shape =\n  | Circle(float)\n  | Rect(float, float)\nlet area = s => switch s {\n  | Circle(r) => r\n  | Rect(w, h) => w\n}";
  const off = src.indexOf("Circle(r)") + 7; // the `r`
  expect(hoverAt(src, off)).toBe("number");
});

test("hover on the whole constructor pattern reports the variant type", () => {
  const src =
    "type Shape =\n  | Circle(float)\n  | Rect(float, float)\nlet area = s => switch s {\n  | Circle(r) => r\n  | Rect(w, h) => w\n}";
  const off = src.indexOf("Circle(r)"); // on `C`, outside the inner `r` span
  expect(hoverAt(src, off)).toBe("Shape");
});
