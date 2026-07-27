// C5 slices a + b: `Alias.T` parses in type-annotation position (slice a, ADR 0046)
// and RESOLVES through the import graph (slice b) — the module driver hands each
// module a qual map (alias → the dep's exported type scope), so a variant crosses
// nominally, a transparent record alias EXPANDS in its declaring module's scope, and
// an unknown alias or member is a check-time diagnostic. Folding qualified names back
// out in dts/hover is slice c.
import { expect, test } from "bun:test";
import { format } from "@mochi/dx/format";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { lex } from "../src/lexer";
import { buildModules } from "../src/module";
import { parse } from "../src/parser";

/** Build a `{ path: source }` fixture graph; absolute paths keep `node:path` deterministic. */
const build = (files: Record<string, string>, entry: string) =>
  buildModules(entry, async (p: string): Promise<string> => {
    const src = files[p];
    if (src === undefined) throw new Error(`no such file ${p}`);
    return src;
  });

const SHAPES = [
  "export type Shape =",
  "  | Circle(radius: number)",
  "  | Rect(width: number, height: number)",
  "export type Box a = | Box(a)",
  "export type Pair a = { fst: a, snd: a }",
  "type Hidden = | H(number)",
  "",
].join("\n");

/** Entry that namespace-imports ./shapes and also value-imports the ctors it builds with. */
const withShapes = (body: string): Record<string, string> => ({
  "/p/shapes.mochi": SHAPES,
  "/p/main.mochi": `import * as D from "./shapes"\nimport { Circle, Box } from "./shapes"\n${body}\n`,
});

const parseType = (typeExprSrc: string) => {
  const src = `extern f : ${typeExprSrc} = "./m" "f"`;
  const prog = unwrapOk(parse(unwrapOk(lex(src))));
  const s = prog.stmts[0];
  if (s?.kind !== "extern") throw new Error("unreachable");
  return s.typeExpr;
};

test("nullary qualified type name: D.Shape", () => {
  const te = parseType("D.Shape -> number");
  if (te.kind !== "tarrow") throw new Error("unreachable");
  const from = te.from;
  expect(from.kind).toBe("tqual");
  if (from.kind !== "tqual") throw new Error("unreachable");
  expect(from.alias).toBe("D");
  expect(from.name).toBe("Shape");
  expect(from.args).toEqual([]);
});

test("applied qualified type name: D.Result e a", () => {
  const te = parseType("D.Result e a -> number");
  if (te.kind !== "tarrow") throw new Error("unreachable");
  const from = te.from;
  expect(from.kind).toBe("tqual");
  if (from.kind !== "tqual") throw new Error("unreachable");
  expect(from.alias).toBe("D");
  expect(from.name).toBe("Result");
  expect(from.args.map((a) => a.kind)).toEqual(["tname", "tname"]);
});

test("nested qualified type name: D.Result (E.Foo) a", () => {
  const te = parseType("D.Result (E.Foo) a -> number");
  if (te.kind !== "tarrow") throw new Error("unreachable");
  const from = te.from;
  expect(from.kind).toBe("tqual");
  if (from.kind !== "tqual") throw new Error("unreachable");
  expect(from.args.length).toBe(2);
  const [first, second] = from.args;
  expect(first?.kind).toBe("tqual");
  if (first?.kind !== "tqual") throw new Error("unreachable");
  expect(first.alias).toBe("E");
  expect(first.name).toBe("Foo");
  expect(second?.kind).toBe("tname");
});

test("qualified type name on both sides of an arrow", () => {
  const te = parseType("D.Shape -> D.Other");
  if (te.kind !== "tarrow") throw new Error("unreachable");
  expect(te.from.kind).toBe("tqual");
  expect(te.to.kind).toBe("tqual");
});

test("qualified type name in a `let` binding annotation", () => {
  const src = "let x : D.Shape = 5";
  const prog = unwrapOk(parse(unwrapOk(lex(src))));
  const s = prog.stmts[0];
  if (s?.kind !== "let") throw new Error("unreachable");
  expect(s.annot?.kind).toBe("tqual");
});

test("a lowercase name after the dot is rejected — a type variable cannot be qualified", () => {
  const r = parse(unwrapOk(lex('extern f : D.shape -> number = "./m" "f"')));
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.message).toContain("type variable cannot be qualified");
});

test("formatter round-trips a qualified type name, nullary and applied", () => {
  const src = 'extern f : D.Shape -> D.Result e a = "./m" "f"';
  const once = unwrapOk(format(src));
  expect(once).toContain("D.Shape");
  expect(once).toContain("D.Result e a");
  expect(unwrapOk(format(once))).toBe(once);
});

test("single-file compile has no import graph, so D.Shape resolves to nothing and 5 is rejected", () => {
  // No graph → no qual map. `check` deliberately stays silent (it cannot know
  // whether `D` exists), and `typeExprToType` lowers `D.Shape` to the bare
  // nominal `Shape`, which `5` does not unify with. Still an error, by the other
  // route — the diagnostic below is what a graph build reports instead.
  const r = compile("let x : D.Shape = 5");
  expect(isErr(r)).toBe(true);
});

// ── slice b: resolution across a module edge ──────────────────────────────────

test("a nullary qualified variant resolves across the edge", async () => {
  const r = await build(withShapes("let g : D.Shape = Circle(1.0)"), "/p/main.mochi");
  expect(isErr(r) ? unwrapErr(r) : []).toEqual([]);
});

test("an applied qualified variant resolves across the edge", async () => {
  const r = await build(withShapes("let b : D.Box number = Box(1)"), "/p/main.mochi");
  expect(isErr(r) ? unwrapErr(r) : []).toEqual([]);
});

test("a qualified transparent record alias EXPANDS across the edge", async () => {
  // `D.Pair number` must become `{ fst: number, snd: number }`, not the nominal
  // `Pair<number>` — expansion runs in shapes.mochi's own scope.
  const r = await build(withShapes("let p : D.Pair number = { fst: 1, snd: 2 }"), "/p/main.mochi");
  expect(isErr(r) ? unwrapErr(r) : []).toEqual([]);
});

test("a qualified record alias still rejects a row that does not match", async () => {
  const r = await build(
    withShapes('let p : D.Pair number = { fst: 1, snd: "no" }'),
    "/p/main.mochi",
  );
  expect(isErr(r)).toBe(true);
});

test("an alias member the dep does not export is a check diagnostic on the member's span", async () => {
  const files = withShapes("let n : D.Nope = 1");
  const r = await build(files, "/p/main.mochi");
  expect(isErr(r)).toBe(true);
  const [d] = unwrapErr(r);
  expect(d?.kind).toBe("check");
  expect(d?.message).toContain("module alias 'D' has no exported type 'Nope'");
  // Reported on `nameSpan` — the member, not the whole qualified type.
  const main = files["/p/main.mochi"]!;
  expect(main.slice(d!.span!.start, d!.span!.end)).toBe("Nope");
});

test("a type the dep declares but does not export is not reachable as D.T", async () => {
  const r = await build(withShapes("let h : D.Hidden = 1"), "/p/main.mochi");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]?.message).toContain("has no exported type 'Hidden'");
});

test("a qualified type whose alias is not a namespace import is a check diagnostic", async () => {
  const files = {
    "/p/shapes.mochi": SHAPES,
    "/p/main.mochi": 'import { Circle } from "./shapes"\nlet n : E.Shape = 1\n',
  };
  const r = await build(files, "/p/main.mochi");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]?.message).toContain("unknown module alias 'E'");
});

test("an alias field naming ANOTHER module's type resolves where the alias was written", async () => {
  // `M.Wrapper` expands in mid.mochi's scope, so its `L.Point` field resolves
  // through mid's OWN qual map — top.mochi never imports ./leaf at all. This is
  // the whole reason `QualScope` carries the declaring module's scope.
  const files = {
    "/p/leaf.mochi": "export type Point = { x: number, y: number }\n",
    "/p/mid.mochi":
      'import * as L from "./leaf"\nexport type Wrapper = { inner: L.Point, tag: string }\n',
    "/p/top.mochi": [
      'import * as M from "./mid"',
      'let w : M.Wrapper = { inner: { x: 1.0, y: 2.0 }, tag: "a" }',
      "let x = w.inner.x",
      "",
    ].join("\n"),
  };
  const r = await build(files, "/p/top.mochi");
  expect(isErr(r) ? unwrapErr(r) : []).toEqual([]);
});

test("a qualified variant is the SAME type as the dep's own — no nominal duplicate", async () => {
  // `area : Shape -> number` is inferred in shapes.mochi under the bare name;
  // annotating the argument as `D.Shape` here must unify with it.
  const files = {
    "/p/shapes.mochi": `${SHAPES}export let area = s => switch s {\n  | Circle(r) => r\n  | Rect(w, h) => w * h\n}\n`,
    "/p/main.mochi": [
      'import * as D from "./shapes"',
      'import { area, Circle } from "./shapes"',
      "let sz : D.Shape -> number = s => area(s)",
      "let n = sz(Circle(2.0))",
      "",
    ].join("\n"),
  };
  const r = await build(files, "/p/main.mochi");
  expect(isErr(r) ? unwrapErr(r) : []).toEqual([]);
});
