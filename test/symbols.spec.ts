import { expect, test } from "bun:test";
import { isErr } from "@onrails/result";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { indexProgram } from "../src/symbols";

const index = (src: string) => {
  const lexed = lex(src);
  if (isErr(lexed)) throw new Error(lexed.error.message);
  const parsed = parse(lexed.value);
  if (isErr(parsed)) throw new Error(parsed.error.message);
  return indexProgram("/t.mochi", parsed.value);
};

/** Offset of the `n`th occurrence of `name` (0-based), pointing at its first byte. */
const pos = (src: string, name: string, n = 0): number => {
  let from = 0;
  for (let i = 0; i <= n; i++) {
    const idx = src.indexOf(name, from);
    if (idx < 0) throw new Error(`'${name}' #${i} not found in ${JSON.stringify(src)}`);
    if (i === n) return idx;
    from = idx + name.length;
  }
  throw new Error("unreachable");
};

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
