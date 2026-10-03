// ADR 0119: bootstrap infer records binder spans with their symbol, so hover's
// `let x: T` lead and go-to-type on a binder no longer need the TS table.
import { expect, test } from "bun:test";
import { inferTypesSync } from "@mochi/compiler/graph";
import { hoverAt, hoverFrom } from "@mochi/dx/hover";
import { typeDefinitionAt } from "@mochi/dx/nav";
import { pos } from "@mochi/test-support";

/** Hover as the bootstrap type table alone answers it, no declaration syntax. */
const bootstrapHover = (src: string, offset: number) => {
  const inferred = inferTypesSync(src);
  if (inferred._tag === "Err") throw new Error(inferred.error[0]?.message);
  return hoverFrom(inferred.value.types, inferred.value.aliases, offset, src, "<buffer>");
};

test.each([
  ["let n = 1", "n", "let n: number"],
  ["let f = (x) => add(x, 1)", "x", "(parameter) x: number"],
  ["let f = ((a, b)) => add(a, b)", "a", "(parameter) a: number"],
  ["let f = (~k = 1) => k", "k", "(parameter) k: number"],
  ["let n = let y = 1 in y", "y", "let y: number"],
  ["let g = r => add(r.q, 1)", "q", "(property) q: number"],
])("bootstrap hover leads a binder: %p at %p", (src, name, want) => {
  expect(bootstrapHover(src, pos(src, name))?.code).toBe(want);
});

test("bootstrap hover carries a top-level let's doc", () => {
  const src = "/// the answer\nlet n = 42";
  expect(bootstrapHover(src, pos(src, "n = "))).toEqual({
    code: "let n: number",
    doc: "the answer",
  });
});

test("an extern hovers with its source signature and host binding", () => {
  const src = 'extern now : () -> number = "m" "now"';
  expect(hoverAt(src, pos(src, "now"))?.code).toBe('extern now: () -> number\n= "m" "now"');
});

test("typeDefinitionAt folds a generic record alias on a binder", () => {
  const src = "type Boxed<a> = { value: a }\nlet b = { value: 42 }";
  const def = typeDefinitionAt(src, pos(src, "let b") + 4, "/t.mochi");
  expect(src.slice(def!.span.start, def!.span.end)).toBe("Boxed");
});

test("typeDefinitionAt folds a record whose fields are literals", () => {
  const src = 'type Person = { name: string }\nlet person = { name: "Mochi" }';
  const def = typeDefinitionAt(src, pos(src, "let person") + 4, "/t.mochi");
  expect(src.slice(def!.span.start, def!.span.end)).toBe("Person");
});

test("typeDefinitionAt skips an alias whose param the row cannot name", () => {
  const src = "type Tagged<a> = { id: number }\nlet t = { id: 1 }";
  expect(typeDefinitionAt(src, pos(src, "let t") + 4, "/t.mochi")).toBeNull();
});
