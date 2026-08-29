import { expect, test } from "bun:test";
import { hoverAt, hoverAtOption } from "@mochi/dx/hover";

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

test("hover on a lambda parameter declaration identifies the parameter", () => {
  const src = "let f = (x) => add(x, 1)";
  expect(hoverAt(src, src.indexOf("(x)") + 1)?.code).toBe("(parameter) x: number");
});

test("hover on destructured lambda parameter declarations identifies each binder", () => {
  const tuple = "let f = ((x, y)) => add(x, y)";
  expect(hoverAt(tuple, tuple.indexOf("x, y") + 1)?.code).toBe("(parameter) x: number");
  expect(hoverAt(tuple, tuple.indexOf("y))") + 1)?.code).toBe("(parameter) y: number");

  const record = "let f = ({ x, y }) => add(x, y)";
  expect(hoverAt(record, record.indexOf("x, y") + 1)?.code).toBe("(parameter) x: number");
  expect(hoverAt(record, record.indexOf("y })") + 1)?.code).toBe("(parameter) y: number");
});

test("hover on a record literal reports the closed row", () => {
  const src = "let r = { x: 1, y: 2 }";
  expect(hoverAt(src, 8)?.code).toBe("{ x: number, y: number }"); // on `{`
});

test("hover lays out deeply nested structural types", () => {
  const src = `let profile = {
  id: "p1",
  preferences: {
    theme: "dark",
    language: "en",
    timezone: "Pacific/Auckland",
    colorScheme: "high-contrast"
  }
}`;
  expect(hoverAt(src, src.indexOf("profile"))?.code).toBe(`let profile: {
  id: string,
  preferences: {
    theme: string,
    language: string,
    timezone: string,
    colorScheme: string
  }
}`);
});

test("hover lays out long arrows, unions, and declaration generics", () => {
  const fn = "let transform = (first, second, third, fourth, fifth, sixth) => first";
  const fnCode = hoverAt(fn, fn.indexOf("transform"))?.code;
  expect(fnCode).toContain("let transform:");
  expect(fnCode).toContain("\n");
  expect(fnCode).toContain("->");

  const decl = `type ApiResponse<A, B, C> =
  | Success(payload: Result<Map<string, A>, Map<string, B> >, metadata: Map<string, C>)
  | Failure(message: string, retryAfter: number, correlationId: string)`;
  const declCode = hoverAt(decl, decl.indexOf("ApiResponse"))?.code;
  expect(declCode).toContain("type ApiResponse<A, B, C> =");
  expect(declCode).toContain("\n  Success(");
  expect(declCode).toContain("\n  | Failure(");
  expect(declCode).toContain("Map<string, A>");
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

test("static syntax hints fill otherwise-unhoverable tokens", () => {
  expect(hoverAt("let x = 1", 1)?.code).toBe("let binding");
  expect(hoverAt('"use open"\nwindow', 1)?.doc).toContain("host globals");
});

test("Mochi-facing hover represents absence as None", () => {
  const src = "let p = pi";
  expect(hoverAtOption(src, 3)).toEqual({ _tag: "None" });
  expect(hoverAtOption(src, src.indexOf("pi"))).toMatchObject({ _tag: "Some" });
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

test("hover identifies as-pattern binders and record-pattern labels", () => {
  const asSrc =
    "type Shape = | Circle(number)\nlet f = s => switch s { | Circle(_) as shape => shape }";
  expect(hoverAt(asSrc, asSrc.indexOf("shape =>") + 1)?.code).toBe("(parameter) shape: Shape");

  const recordSrc = 'let f = r => switch r { | { state: "ready" } => 1 | _ => 0 }';
  expect(hoverAt(recordSrc, recordSrc.indexOf("state") + 1)?.code).toBe("(property) state: string");
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

test("hover on an extern name leads with scheme + host module (tracer #52)", () => {
  const src = 'export extern useState : a -> (a, a -> b) = "preact/hooks" "useState"\n';
  const info = hoverAt(src, src.indexOf("useState") + 1);
  expect(info?.code).toBe('extern useState: a -> (a, a -> b)\n= "preact/hooks" "useState"');
});

test("a leading `///` on extern surfaces as doc", () => {
  const src =
    '/// Preact state hook\nextern useState : a -> (a, a -> b) = "preact/hooks" "useState"\n';
  const info = hoverAt(src, src.indexOf("useState") + 1);
  expect(info?.code).toContain("extern useState:");
  expect(info?.doc).toBe("Preact state hook");
});

test("() in an extern signature shows as () not unit", () => {
  const src = 'extern tick : () -> number = "./t" "tick"\n';
  expect(hoverAt(src, src.indexOf("tick") + 1)?.code).toBe(
    'extern tick: () -> number\n= "./t" "tick"',
  );
});

test("type declarations and constructors have parse-level hovers", () => {
  const src = "type Result<A, E> = | Ok(value: A) | Err(error: E)";
  expect(hoverAt(src, src.indexOf("Result") + 1)?.code).toBe(
    "type Result<A, E> = Ok(value: A) | Err(error: E)",
  );
  expect(hoverAt(src, src.indexOf("Ok") + 1)?.code).toBe("constructor Ok: A -> Result<A, E>");
  expect(hoverAt(src, src.indexOf("value") + "value: ".length)?.code).toBe("type A");
});

test("record-alias fields and type syntax hover without successful inference", () => {
  const src = `type Point<A> = { x: A, y: number }
let broken = add(1, "nope")`;
  expect(hoverAt(src, src.indexOf("x:") + 1)?.code).toBe("(property) x: A");
  expect(hoverAt(src, src.indexOf("number") + 1)?.code).toBe("type number");
  expect(hoverAt(src, src.indexOf("Point") + 1)?.code).toBe("type Point<A> = { x: A, y: number }");
});

test("hover on intrinsic JSX attribute reports its property type", () => {
  const src = 'let el = <button disabled={true} type="submit" />';
  expect(hoverAt(src, src.indexOf("disabled") + 1)?.code).toBe("(property) disabled: bool");
  expect(hoverAt(src, src.indexOf("type") + 1)?.code).toBe(
    '(property) type: "button" | "submit" | "reset"',
  );
});
