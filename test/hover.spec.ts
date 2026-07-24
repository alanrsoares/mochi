import { expect, test } from "bun:test";
import { hoverAt } from "../src/hover";

test("hover on a ref reports its inferred type", () => {
  //                 0123456789
  const src = "let p = pi";
  expect(hoverAt(src, 8)?.code).toBe("number"); // cursor on `pi`
});

test("hover on a builtin ref reports its full arrow type", () => {
  //          0         1
  //          0123456789012345678
  const src = "let f = (x) => add(x, 1)";
  expect(hoverAt(src, 16)?.code).toBe("number -> number -> number"); // on `add`
});

test("hover on a lambda parameter use reports the monomorphic type", () => {
  const src = "let f = (x) => add(x, 1)";
  expect(hoverAt(src, 19)?.code).toBe("number"); // on the `x` inside add(...)
});

test("hover on a record literal reports the closed row", () => {
  const src = "let r = { x: 1, y: 2 }";
  expect(hoverAt(src, 8)?.code).toBe("{ x: number, y: number }"); // on `{`
});

test("hover on a nested field value reports the tightest node", () => {
  //          0         1
  //          012345678901234
  const src = "let r = { x: 1, y: 2 }";
  expect(hoverAt(src, 13)?.code).toBe("number"); // on the `1`
});

test("hover picks the tightest span (ref inside a call)", () => {
  const src = "let n = add(pi, 2)";
  expect(hoverAt(src, 12)?.code).toBe("number"); // on `pi`, not the whole call
});

test("hover returns null off any node", () => {
  const src = "let p = pi";
  expect(hoverAt(src, 3)).toBeNull(); // whitespace before `=`
});

test("hover returns null when the program does not typecheck", () => {
  expect(hoverAt("let bad = add(1, { x: 2 })", 8)).toBeNull();
});

test("hover on a top-level binding leads with `let name: T`", () => {
  const src = "let pi = 3.14";
  expect(hoverAt(src, 4)?.code).toBe("let pi: number"); // on the name `pi`
});

test("a leading `///` comment surfaces as the binding's doc", () => {
  const src = "/// The ratio.\nlet pi = 3.14";
  const at = src.indexOf("let pi") + 4; // on the name `pi`
  const info = hoverAt(src, at);
  expect(info?.code).toBe("let pi: number");
  expect(info?.doc).toBe("The ratio.");
});

test("consecutive doc lines join; a blank line breaks attachment", () => {
  const doc = "/// first line\n/// second line\nlet a = 1";
  expect(hoverAt(doc, doc.indexOf("let a") + 4)?.doc).toBe("first line\nsecond line");

  const gap = "/// stale\n\nlet a = 1";
  expect(hoverAt(gap, gap.indexOf("let a") + 4)?.doc).toBeUndefined();
});

test("ordinary and trailing comments are not attached to bindings", () => {
  const ordinary = "// local note\nlet a = 1";
  expect(hoverAt(ordinary, ordinary.indexOf("let a") + 4)?.doc).toBeUndefined();

  const src = "let a = 1 // trailing\nlet b = 2";
  expect(hoverAt(src, src.indexOf("let b") + 4)?.doc).toBeUndefined();
});

test("an ordinary comment breaks a pending doc block", () => {
  const src = "/// reader-facing\n// local note\nlet a = 1";
  expect(hoverAt(src, src.indexOf("let a") + 4)?.doc).toBeUndefined();
});

test("doc margins strip one optional space and preserve intentional indentation", () => {
  const src = "///   indented\n///\n/// next\nlet a = 1";
  expect(hoverAt(src, src.indexOf("let a") + 4)?.doc).toBe("  indented\n\nnext");
});

test("hover on a field access leads with `(property) name: T`", () => {
  const src = "let r = { x: 1 }\nlet v = r.x";
  const at = src.indexOf("r.x") + 2; // on the `x`
  expect(hoverAt(src, at)?.code).toBe("(property) x: number");
});

test("hover on a pattern-bound name leads with `(parameter) name: T`", () => {
  const src = "let f = n => switch n {\n  | 0 => n\n  | m => m\n}";
  const off = src.indexOf("| m") + 2; // the `m` in the pattern position
  expect(hoverAt(src, off)?.code).toBe("(parameter) m: number"); // unified with the scrutinee
});

test("hover on a constructor pattern binding reports its field type", () => {
  const src =
    "type Shape =\n  | Circle(float)\n  | Rect(float, float)\nlet area = s => switch s {\n  | Circle(r) => r\n  | Rect(w, h) => w\n}";
  const off = src.indexOf("Circle(r)") + 7; // the `r`
  expect(hoverAt(src, off)?.code).toBe("(parameter) r: number");
});

test("hover on the whole constructor pattern reports the variant type", () => {
  const src =
    "type Shape =\n  | Circle(float)\n  | Rect(float, float)\nlet area = s => switch s {\n  | Circle(r) => r\n  | Rect(w, h) => w\n}";
  const off = src.indexOf("Circle(r)"); // on `C`, outside the inner `r` span
  expect(hoverAt(src, off)?.code).toBe("Shape");
});

test("hover resolves a namespaced prelude ref (0023's discovered gap)", () => {
  const src = 'let s = Str.concat("a", "b")';
  const off = src.indexOf("Str.concat") + 5; // on `concat`
  expect(hoverAt(src, off)?.code).toBe("(property) concat: string -> string -> string");
});

test("hover on a prelude value surfaces its virtual docstring", () => {
  const src = "let n = add(1, 2)";
  const info = hoverAt(src, src.indexOf("add"));
  expect(info?.code).toBe("number -> number -> number");
  expect(info?.doc).toContain("Number addition");
});

test("hover on Some surfaces the ctor docstring", () => {
  const src = "let x = Some(1)";
  const info = hoverAt(src, src.indexOf("Some"));
  expect(info?.doc).toBe("Present `Option` value.");
});

test("hover on Result.map member surfaces the qualified docstring", () => {
  const src = "let f = Result.map(identity)";
  const onMap = hoverAt(src, src.indexOf("map"));
  expect(onMap?.doc).toBe("`Result.map`");
  const onNs = hoverAt(src, src.indexOf("Result"));
  expect(onNs?.doc).toContain("Result railway");
});

test("shadowed prelude name does not keep the prelude docstring", () => {
  const src = "/// local add\nlet add = 1\nlet n = add";
  // Use site: user docs attach only at the def name today; must not show prelude's.
  expect(hoverAt(src, src.lastIndexOf("add"))?.doc).toBeUndefined();
  expect(hoverAt(src, src.indexOf("let add") + 4)?.doc).toBe("local add");
});
