import { expect, test } from "bun:test";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { indexProgram } from "@mochi/compiler/symbols";
import { pos } from "@mochi/test-support";
import { isErr } from "@onrails/result";

const index = (src: string) => {
  const lexed = lex(src);
  if (isErr(lexed)) throw new Error(lexed.error.message);
  const parsed = parse(lexed.value);
  if (isErr(parsed)) throw new Error(parsed.error.map((d) => d.message).join("; "));
  return indexProgram("/t.mochi", parsed.value);
};

/** Offset of the `n`th occurrence of `name` (0-based), pointing at its first byte. */
test("value def + use resolve to the same binding", () => {
  const src = "let x = 1\nlet y = x";
  const def = index(src).at(pos(src, "x"));
  const use = index(src).at(pos(src, "x", 1));
  expect(def?.role).toBe("def");
  expect(use?.role).toBe("use");
  expect(use?.binding.def).toEqual(def?.binding.def);
  expect(
    index(src)
      .occurrences(def!.binding)
      .map((o) => o.role),
  ).toEqual(["def", "use"]);
});

test("shadowing: inner letin does not alias the outer binding", () => {
  const src = "let x = 1\nlet f = () => let x = 2 in x";
  const outer = index(src).at(pos(src, "x"));
  const innerDef = index(src).at(pos(src, "x", 1));
  const innerUse = index(src).at(pos(src, "x", 2));
  expect(outer?.binding.def.span.start).not.toBe(innerDef?.binding.def.span.start);
  expect(innerUse?.binding.def).toEqual(innerDef?.binding.def);
  expect(index(src).occurrences(outer!.binding)).toHaveLength(1); // def only
  expect(
    index(src)
      .occurrences(innerDef!.binding)
      .map((o) => o.role),
  ).toEqual(["def", "use"]);
});

test("lambda parameter use points at the param def", () => {
  const src = "let f = (x) => x";
  const def = index(src).at(pos(src, "x"));
  const use = index(src).at(pos(src, "x", 1));
  expect(def?.role).toBe("def");
  expect(use?.binding.def).toEqual(def?.binding.def);
});

test("type and ctor live in distinct spaces from values", () => {
  const src = "type Box = | Box(number)\nlet n = Box(1)";
  const typeHit = index(src).at(pos(src, "Box"));
  const ctorDef = index(src).at(pos(src, "Box", 1));
  const ctorUse = index(src).at(pos(src, "Box", 2));
  expect(typeHit?.binding.space).toBe("type");
  expect(ctorDef?.binding.space).toBe("ctor");
  expect(ctorUse?.binding.space).toBe("ctor");
  expect(ctorUse?.binding.def).toEqual(ctorDef?.binding.def);
  expect(typeHit?.binding.def.span.start).not.toBe(ctorDef?.binding.def.span.start);
});

test("pattern bind is a value def", () => {
  const src = "type T = | A(int)\nlet f = x => switch x { | A(k) => k }";
  const def = index(src).at(pos(src, "k"));
  const use = index(src).at(pos(src, "k", 1));
  expect(def?.role).toBe("def");
  expect(use?.binding.def).toEqual(def?.binding.def);
});

test("import name is a value def site", () => {
  const src = 'import { foo } from "./m"\nlet x = foo';
  const def = index(src).at(pos(src, "foo"));
  const use = index(src).at(pos(src, "foo", 1));
  expect(def?.role).toBe("def");
  expect(use?.binding.def).toEqual(def?.binding.def);
});

test("bindingsAt: lambda param visible in body, not outside", () => {
  const src = "let f = (x) => add(x, 1)\nlet z = 0";
  const idx = index(src);
  const inBody = idx.bindingsAt(pos(src, "add")).map((b) => b.name);
  expect(inBody).toContain("x");
  expect(inBody).toContain("f");
  const outside = idx.bindingsAt(pos(src, "z")).map((b) => b.name);
  expect(outside).not.toContain("x");
  expect(outside).toContain("f");
});

test("bindingsAt: letin name visible in body only", () => {
  const src = "let f = () => let y = 1 in add(y, 2)";
  const idx = index(src);
  const inValue = idx.bindingsAt(pos(src, "1")).map((b) => b.name);
  expect(inValue).not.toContain("y");
  const inBody = idx.bindingsAt(pos(src, "add")).map((b) => b.name);
  expect(inBody).toContain("y");
});

test("local recursive lambda names resolve in their own and adjacent RHSs", () => {
  const src = "let f = n => let even = k => odd(k) in let odd = k => even(k) in even(n)";
  const idx = index(src);
  const evenDef = idx.at(pos(src, "even", 1));
  const oddDef = idx.at(pos(src, "odd"));
  const oddUse = idx.at(pos(src, "odd", 1));
  const evenUse = idx.at(pos(src, "even", 2));
  expect(oddUse?.binding.def).toEqual(oddDef?.binding.def);
  expect(evenUse?.binding.def).toEqual(evenDef?.binding.def);
});

test("bindingsAt: inner shadow wins", () => {
  const src = "let x = 1\nlet f = () => let x = 2 in x";
  const idx = index(src);
  const atUse = idx.bindingsAt(pos(src, "x", 2));
  const hit = atUse.find((b) => b.name === "x");
  expect(hit?.def.span.start).toBe(pos(src, "x", 1));
});

test("bindingsAt: match arm pattern bind visible in body", () => {
  const src = "type T = | A(int)\nlet f = x => switch x { | A(k) => k }";
  const idx = index(src);
  const names = idx.bindingsAt(pos(src, "k", 1)).map((b) => b.name);
  expect(names).toContain("k");
  expect(names).toContain("x");
});
