// Transparent record-type aliases (CRITIQUE §4.1): `type Point = { x: number,
// y: number }` names a structural row. Inference expands it (so it works in
// extern signatures); hover / inlay / .d.ts FOLD a matching closed row back to
// the alias name. No nominal identity, no runtime — pure naming for readability.
import { expect, test } from "bun:test";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { check } from "../src/check";
import { compile } from "../src/compile";
import { emitDts } from "../src/dts";
import { format } from "../src/format";
import { hoverAt } from "../src/hover";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";

const POINT = "type Point = { x: number, y: number }\n";

// ---- parsing ---------------------------------------------------------------

test("a `{ ... }` body parses as a record alias, not a variant", () => {
  const prog = unwrapOk(parse(unwrapOk(lex(POINT))));
  const s = prog.stmts[0];
  expect(s?.kind).toBe("type");
  if (s?.kind !== "type") throw new Error("unreachable");
  expect(s.ctors).toEqual([]);
  expect(s.alias?.map((f) => f.name)).toEqual(["x", "y"]);
});

test("parametric alias captures its type parameters", () => {
  const prog = unwrapOk(parse(unwrapOk(lex("type Box a = { value: a }"))));
  const s = prog.stmts[0];
  if (s?.kind !== "type") throw new Error("unreachable");
  expect(s.params).toEqual(["a"]);
  expect(s.alias?.[0]?.name).toBe("value");
});

test("empty record alias `type Unit = {}` parses", () => {
  const prog = unwrapOk(parse(unwrapOk(lex("type Unit = {}"))));
  const s = prog.stmts[0];
  if (s?.kind !== "type") throw new Error("unreachable");
  expect(s.alias).toEqual([]);
});

// ---- hover folds a matching row to the alias name --------------------------

const hover = (src: string, needle: string): string | null =>
  hoverAt(src, src.indexOf(needle) + 1)?.code ?? null;

test("hover shows the alias name for a matching closed record", () => {
  const src = `${POINT}let origin = { x: 0, y: 0 }`;
  expect(hover(src, "{ x: 0")).toBe("Point");
});

test("hover shows a parametric alias applied to its argument", () => {
  const src = "type Box a = { value: a }\nlet b = { value: 42 }";
  expect(hover(src, "{ value: 42")).toBe("Box<number>");
});

test("a record whose field types differ does NOT fold", () => {
  // Point is { x: number, y: number }; this record is { x: string, y: number }.
  const src = `${POINT}let p = { x: "a", y: 0 }`;
  expect(hover(src, '{ x: "a"')).toBe("{ x: string, y: number }");
});

test("an open (duck-typed) row does NOT fold to the alias", () => {
  // `p.x` / `p.y` constrain p to an OPEN row (extra fields allowed), so it is
  // not the closed Point — it must stay structural.
  const src = `${POINT}let getSum = p => add(p.x, p.y)`;
  const t = hover(src, "p => add");
  expect(t).not.toBe("Point");
  expect(t).toContain("| 'r");
});

// ---- extern signatures resolve alias names ---------------------------------

test("an alias name is usable in an extern signature", () => {
  const src = `${POINT}extern mk : number -> number -> Point = "m" "mk"\nlet o = mk(1)(2)`;
  // The extern's declared type resolved the alias to its row; folding then
  // renders it as `Point` in the arrow result.
  expect(hover(src, "mk(1)")).toBe("number -> number -> Point");
});

// ---- .d.ts emission --------------------------------------------------------

test("emits an exported TS object type + folds binding types", () => {
  const src = `${POINT}let origin = { x: 0, y: 0 }`;
  const dts = unwrapOk(emitDts(src));
  expect(dts).toContain("export type Point = { x: number; y: number };");
  expect(dts).toContain("export declare const origin: Point;");
});

test("parametric alias emits a generic TS type", () => {
  const src = "type Box a = { value: a }\nlet b = { value: 42 }";
  const dts = unwrapOk(emitDts(src));
  expect(dts).toContain("export type Box<A> = { value: A };");
  expect(dts).toContain("export declare const b: Box<number>;");
});

// ---- codegen: pure type, no runtime ----------------------------------------

test("a record alias emits no runtime code", () => {
  const js = unwrapOk(compile(`${POINT}let origin = { x: 0, y: 0 }`, { runtime: false }));
  expect(js).not.toContain("Point");
  expect(js).toContain("const origin = { x: 0, y: 0 };");
});

test("an exported alias emits no stray `export`", () => {
  const js = unwrapOk(compile(`export ${POINT}let o = { x: 1, y: 2 }`, { runtime: false }));
  expect(js).not.toMatch(/^export\s*$/m);
});

// ---- checks ----------------------------------------------------------------

test("a name declared twice (alias + variant) is a duplicate-type error", () => {
  const src = `${POINT}type Point = | P(number)`;
  const r = check(unwrapOk(parse(unwrapOk(lex(src)))));
  expect(isErr(r)).toBe(true);
  if (isErr(r)) expect(unwrapErr(r)[0]!.message).toContain("duplicate type 'Point'");
});

// ---- formatting round-trips ------------------------------------------------

test("format prints a record alias on one line", () => {
  expect(unwrapOk(format(POINT.trim())).trimEnd()).toBe("type Point = { x: number, y: number }");
});

test("format prints a parametric alias with its params", () => {
  expect(unwrapOk(format("type Box a = { value: a }")).trimEnd()).toBe("type Box a = { value: a }");
});
