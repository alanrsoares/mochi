import { expect, test } from "bun:test";
import { inferTypesSyncWith } from "@mochi/compiler/compile/sync";
import { defaultOptions } from "@mochi/compiler/extensions";
import { typeOf as seedTypeOf } from "@mochi/test-support";
import { isErr, map, unwrapErr, unwrapOk } from "@onrails/result";

const infer = (src: string) =>
  map(inferTypesSyncWith(src, { ...defaultOptions, open: false }), () => src);
const typeOf = (src: string, name: string): string =>
  seedTypeOf(
    /^[A-Z]/.test(name) ? `${src}\nlet probe = ${name}` : src,
    /^[A-Z]/.test(name) ? "probe" : name,
    { open: false },
  );

test("literal is number", () => {
  const env = unwrapOk(infer("let x = 42"));
  expect(typeOf(env, "x")).toBe("number");
});

test("lambda over numbers", () => {
  const env = unwrapOk(infer("let inc = x => add(x, 1)"));
  expect(typeOf(env, "inc")).toBe("number -> number");
});

test("nullary lambda is unit -> body (ADR 0014)", () => {
  const env = unwrapOk(infer("let one = () => 1"));
  expect(typeOf(env, "one")).toBe("() -> number");
});

test("nullary call peels unit", () => {
  const env = unwrapOk(infer("let one = () => 1\nlet x = one()"));
  expect(typeOf(env, "x")).toBe("number");
});

test("identity is generalized (polymorphic)", () => {
  const env = unwrapOk(infer("let id = x => x"));
  // 'ta -> 'ta  (some quantified var)
  const t = typeOf(env, "id");
  expect(t).toMatch(/^'t\d+ -> 't\d+$/);
  const [a, b] = t.split(" -> ");
  expect(a).toBe(b);
});

test("application result type", () => {
  const env = unwrapOk(infer("let r = square(3)"));
  expect(typeOf(env, "r")).toBe("number");
});

test("pipeline types like nested application", () => {
  const env = unwrapOk(infer("let r = 5 |> square"));
  expect(typeOf(env, "r")).toBe("number");
});

// ADR 0044 — binding type annotations (`let x : T = v`).
test("a binding annotation pins a too-general value", () => {
  // Without the annotation `empty` would be `Map<'a, 'b>`; the alias pins both.
  const src = "type Reg = { m: Map string number }\nlet empty : Reg = { m: #{} }";
  const env = unwrapOk(infer(src));
  expect(typeOf(env, "empty")).toBe("{ m: Map<string, number> }");
});

test("a binding annotation is enforced (wrong type is a type error)", () => {
  const r = infer('let bad : number = "hello"');
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.message).toContain("unify");
});

test("a let-in annotation pins the local (ADR 0044)", () => {
  const env = unwrapOk(infer("let f = x => let n : number = x in add(n, 1)"));
  expect(typeOf(env, "f")).toBe("number -> number");
});

// ADR 0011 §5 — sugar provenance. A hand-written `h(...)` call has no `origin`,
// so it types against its own binding instead of hitting `inferJsxCall`
// (previously false-positived on `fn.name === "h"` regardless of provenance).
test("an explicit h(...) call is not treated as JSX sugar", () => {
  const env = unwrapOk(infer("let h = (a, b) => add(a, b)\nlet r = h(1, 2)"));
  expect(typeOf(env, "r")).toBe("number");
});

test("record literal is a closed record", () => {
  const env = unwrapOk(infer("let p = { x: 1, y: 2 }"));
  expect(typeOf(env, "p")).toBe("{ x: number, y: number }");
});

// ADR 0098 — optional record fields.
test("a value may omit optional alias fields", () => {
  const src = "type Props = { id?: string, n: number }\nlet ok : Props = { n: 1 }";
  const env = unwrapOk(infer(src));
  expect(typeOf(env, "ok")).toBe("{ id?: string, n: number }");
});

test("a required field still cannot be omitted", () => {
  const r = infer('type Props = { id?: string, n: number }\nlet bad : Props = { id: "x" }');
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.message).toContain("n");
});

test("a required field satisfies an optional expected field", () => {
  const src = "type Opt = { x?: number }\nlet ok : Opt = { x: 1 }";
  expect(isErr(infer(src))).toBe(false);
});

test("an optional-typed value does not satisfy a required field", () => {
  const r = infer(
    "type Opt = { x?: number }\ntype Req = { x: number }\nlet o : Opt = {}\nlet bad : Req = o",
  );
  expect(isErr(r)).toBe(true);
});

test("reading an optional field yields Option", () => {
  const src = "type Props = { id?: string }\nlet getId = (p: Props) => p.id";
  const env = unwrapOk(infer(src));
  expect(typeOf(env, "getId")).toBe("{ id?: string } -> Option<string>");
});

test("reading a required field stays the raw type", () => {
  const src = "type Props = { id?: string, n: number }\nlet getN = (p: Props) => p.n";
  const env = unwrapOk(infer(src));
  expect(typeOf(env, "getN")).toBe("{ id?: string, n: number } -> number");
});

test("a function expecting optional fields accepts a subset record", () => {
  const src =
    "type Props = { id?: string, n: number }\nlet f = (p: Props) => p.n\nlet r = f({ n: 2 })";
  const env = unwrapOk(infer(src));
  expect(typeOf(env, "r")).toBe("number");
});

// ADR 0098 §2 — labeled parameters lower to one record parameter.
test("a labeled lambda is a unary record function", () => {
  const src = 'let f = (~tone: string = "rose", ~size?: number) => tone';
  const env = unwrapOk(infer(src));
  expect(typeOf(env, "f")).toBe("{ tone?: string, size?: number } -> string");
});

test("a labeled call supplies a subset of the record", () => {
  const src = `let f = (~tone: string = "rose", ~size?: number) => tone
let r = f(~tone="amber")`;
  const env = unwrapOk(infer(src));
  expect(typeOf(env, "r")).toBe("string");
});

test("omitting every labeled argument is f()", () => {
  const src = `let f = (~tone: string = "rose") => tone
let r = f()`;
  const env = unwrapOk(infer(src));
  expect(typeOf(env, "r")).toBe("string");
});

test("a required labeled argument cannot be omitted", () => {
  const r = infer("let f = (~tone: string) => tone\nlet r = f()");
  expect(isErr(r)).toBe(true);
});

test("an optional labeled param is Option in the body", () => {
  const src = "let f = (~size?: number) => size";
  const env = unwrapOk(infer(src));
  expect(typeOf(env, "f")).toBe("{ size?: number } -> Option<number>");
});

test("a positional prefix stays curried in front of the labeled group", () => {
  const src = "let f = (x: number, ~tone: string) => x";
  const env = unwrapOk(infer(src));
  expect(typeOf(env, "f")).toBe("number -> { tone: string } -> number");
});

test("field access is row-polymorphic: works on ANY record with that field", () => {
  const env = unwrapOk(infer("let getX = p => p.x"));
  // p : { x: 'a | 'r } -> 'a
  const t = typeOf(env, "getX");
  expect(t).toMatch(/^\{ x: 't\d+ \| 'r\d+ \} -> 't\d+$/);
});

test("duck typing: same getter used on two different record shapes", () => {
  const env = unwrapOk(
    infer("let getX = p => p.x\nlet a = getX({ x: 1, y: 2 })\nlet b = getX({ x: 3, name: 0 })"),
  );
  expect(typeOf(env, "a")).toBe("number");
  expect(typeOf(env, "b")).toBe("number");
});

test("variant constructor has a function type into its variant", () => {
  const env = unwrapOk(infer("type Shape = | Circle(float) | Rect(float, float)"));
  expect(typeOf(env, "Circle")).toBe("number -> Shape");
  expect(typeOf(env, "Rect")).toBe("number -> number -> Shape");
});

test("self-recursive let is typed in strict mode (no open-world)", () => {
  // fact references itself; strict builtins → recursion must be typed, not
  // rescued by open-world. sub/mul/eq keep it number -> number.
  const env = unwrapOk(
    infer("let fact = n => switch n { | 0 => 1 | _ => mul(n, fact(sub(n, 1))) }"),
  );
  expect(typeOf(env, "fact")).toBe("number -> number");
});

test("match infers a common result type and binds pattern vars", () => {
  const env = unwrapOk(
    infer(
      "type Shape = | Circle(float) | Rect(float, float)\n" +
        "let area = s => switch s { | Circle(r) => mul(r, r) | Rect(w, h) => mul(w, h) }",
    ),
  );
  expect(typeOf(env, "area")).toBe("Shape -> number");
});

// ---- type errors ----

test("unbound variable is a type error", () => {
  const r = infer("let x = nope");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.message).toContain("unbound variable 'nope'");
});

test("unbound variable suggests a close name from the env", () => {
  const r = infer("let count = 1\nlet n = coun");
  expect(isErr(r)).toBe(true);
  const e = unwrapErr(r)[0]!;
  expect(e.help).toEqual({ _tag: "Some", value: "did you mean 'count'?" });
  expect(e.suggestions?.[0]?.replaceWith).toBe("count");
});

test("applying a number as a function is a type error", () => {
  const r = infer("let bad = square(add)");
  // add : number -> number -> number, square expects number
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.kind).toBe("type");
});

test("field type conflict across two uses is a type error", () => {
  const r = infer("let getX = p => p.x\nlet bad = add(getX({ x: 1 }), getX({ x: true }))");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.message).toContain("cannot unify");
});

test("match arms returning different types is a type error", () => {
  const r = infer("type T = | A | B\nlet f = t => switch t { | A => 1 | B => true }");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.message).toContain("cannot unify");
});

test("mutually recursive top-level functions type-check (strict, no open-world)", () => {
  const src = `let isEven = n => switch n { | 0 => true | _ => isOdd(add(n, -1)) }
let isOdd = n => switch n { | 0 => false | _ => isEven(add(n, -1)) }`;
  const env = unwrapOk(infer(src));
  expect(typeOf(env, "isEven")).toBe("number -> bool");
  expect(typeOf(env, "isOdd")).toBe("number -> bool"); // forward-referenced from isEven
});

test("a forward reference to a later binding resolves, keeping its polymorphism", () => {
  // `a` uses `id` before it is defined; SCC ordering infers `id` first and
  // generalizes it, so `id` stays polymorphic and `a` is a number.
  const env = unwrapOk(infer("let a = id(1)\nlet id = x => x"));
  expect(typeOf(env, "a")).toBe("number");
  expect(typeOf(env, "id")).toMatch(/^'t\d+ -> 't\d+$/);
});

// Arity diagnostics (CRITIQUE §4.4): a curried call with a missing argument
// surfaces a function where a value was expected. Instead of a bare `cannot
// unify number with number -> number`, the message names the likely cause.
test("arity mismatch hints at a missing argument", () => {
  // `add(1)` is a partially applied `number -> number`; passing it as add's
  // first argument (which wants a `number`) is the classic missing-arg slip.
  const r = infer("let x = add(add(1), 2)");
  expect(isErr(r)).toBe(true);
  if (isErr(r)) {
    const msg = unwrapErr(r)[0]!.message;
    expect(msg).toContain("cannot unify");
    expect(msg).toContain("a call may be missing an argument");
  }
});

const inferPrelude = (src: string) => infer(src);

test("fast pipe binds tighter than ++ (ADR 0073)", () => {
  const src = `let gen = (c, n) => "ok"
let ctx = { x: 1 }
let s = "hi" ++ ctx->gen(1)`;
  expect(isErr(inferPrelude(src))).toBe(false);
});

test("concat-first grouping still needs parens around ++", () => {
  const src = `let gen = (c, n) => c.x
let ctx = { x: 1 }
let s = ("hi" ++ ctx)->gen(1)`;
  const r = inferPrelude(src);
  expect(isErr(r)).toBe(true);
  if (!isErr(r)) return;
  expect(unwrapErr(r)[0]!.message).toContain("cannot unify");
});

// `generalizeOver` reads only local binders and the enclosing group from the
// env; a `let … in` must still see a monomorphic variable from either.
test("let-in keeps a captured lambda parameter monomorphic", () => {
  const r = inferPrelude("let f = x => let y = x in (add(y, 1), not(y))");
  expect(isErr(r)).toBe(true);
});

test("let-in keeps the enclosing top-level group's name monomorphic", () => {
  const r = inferPrelude('let h = n => let k = h in (k(1), k("s"))');
  expect(isErr(r)).toBe(true);
});
