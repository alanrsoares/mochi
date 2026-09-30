// C5: `Alias.T` parses (slice a, ADR 0046), resolves through the import graph
// (slice b), and folds back in hover/dts (slice c) — dts emits
// `import type * as D from "./shapes.mochi"` so the sidecar resolves.
import { afterAll, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compile } from "@mochi/compiler";
import {
  buildModulesBootstrapWith,
  defaultBootstrapOptions,
  emitDtsForFileBootstrapWith,
} from "@mochi/compiler/bootstrap/module";
import { parseProgram } from "@mochi/compiler/bootstrap/syntax";
import { format } from "@mochi/dx/format";
import { isErr, unwrapOk } from "@onrails/result";

const root = mkdtempSync(join(tmpdir(), "mochi-qualified-type-names-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));

let fixtureCount = 0;

/** Write a `{ name: source }` fixture graph to a fresh dir; returns the entry's path. */
const writeGraph = (files: Record<string, string>, entry: string): string => {
  const dir = join(root, String(fixtureCount++));
  mkdirSync(dir);
  for (const [name, src] of Object.entries(files)) writeFileSync(join(dir, name), src);
  return join(dir, entry);
};

const build = (files: Record<string, string>, entry: string) =>
  buildModulesBootstrapWith(writeGraph(files, entry), defaultBootstrapOptions);

const errorsOf = (files: Record<string, string>, entry: string) => {
  const r = build(files, entry);
  return r._tag === "Err" ? r.error : [];
};

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
  "shapes.mochi": SHAPES,
  "main.mochi": `import * as D from "./shapes"\nimport { Circle, Box } from "./shapes"\n${body}\n`,
});

/** The first statement of a clean self-hosted parse. */
const firstStmt = (src: string) => {
  const r = parseProgram(src);
  if (r._tag === "Err" || r.value.diagnostics.length > 0) throw new Error(`parse failed: ${src}`);
  return r.value.stmts[0];
};

const parseType = (typeExprSrc: string) => {
  const s = firstStmt(`extern f : ${typeExprSrc} = "./m" "f"`);
  if (s?._tag !== "SExtern") throw new Error("unreachable");
  return s.typeExpr;
};

test("nullary qualified type name: D.Shape", () => {
  const te = parseType("D.Shape -> number");
  if (te._tag !== "TyArrow") throw new Error("unreachable");
  const from = te.from;
  expect(from._tag).toBe("TyQual");
  if (from._tag !== "TyQual") throw new Error("unreachable");
  expect(from.alias).toBe("D");
  expect(from.name).toBe("Shape");
  expect(from.args).toEqual([]);
});

test("applied qualified type name: D.Result e a", () => {
  const te = parseType("D.Result e a -> number");
  if (te._tag !== "TyArrow") throw new Error("unreachable");
  const from = te.from;
  expect(from._tag).toBe("TyQual");
  if (from._tag !== "TyQual") throw new Error("unreachable");
  expect(from.alias).toBe("D");
  expect(from.name).toBe("Result");
  expect(from.args.map((a) => a._tag)).toEqual(["TyName", "TyName"]);
});

test("nested qualified type name: D.Result (E.Foo) a", () => {
  const te = parseType("D.Result (E.Foo) a -> number");
  if (te._tag !== "TyArrow") throw new Error("unreachable");
  const from = te.from;
  expect(from._tag).toBe("TyQual");
  if (from._tag !== "TyQual") throw new Error("unreachable");
  expect(from.args.length).toBe(2);
  const [first, second] = from.args;
  expect(first?._tag).toBe("TyQual");
  if (first?._tag !== "TyQual") throw new Error("unreachable");
  expect(first.alias).toBe("E");
  expect(first.name).toBe("Foo");
  expect(second?._tag).toBe("TyName");
});

test("qualified type name on both sides of an arrow", () => {
  const te = parseType("D.Shape -> D.Other");
  if (te._tag !== "TyArrow") throw new Error("unreachable");
  expect(te.from._tag).toBe("TyQual");
  expect(te.to._tag).toBe("TyQual");
});

test("qualified type name in a `let` binding annotation", () => {
  const s = firstStmt("let x : D.Shape = 5");
  if (s?._tag !== "SLet") throw new Error("unreachable");
  expect(s.annot._tag === "Some" && s.annot.value._tag).toBe("TyQual");
});

test("a lowercase name after the dot is rejected — a type variable cannot be qualified", () => {
  const r = parseProgram('extern f : D.shape -> number = "./m" "f"');
  if (r._tag === "Err") throw new Error("lex failed");
  expect(r.value.stmts.map((st) => st._tag)).toEqual(["SError"]);
  expect(r.value.diagnostics[0]?.message).toContain("type variable cannot be qualified");
});

test("formatter round-trips a qualified type name, nullary and applied", () => {
  const src = 'extern f : D.Shape -> D.Result e a = "./m" "f"';
  const once = unwrapOk(format(src));
  expect(once).toContain("D.Shape");
  expect(once).toContain("D.Result<e, a>");
  expect(unwrapOk(format(once))).toBe(once);
});

test("single-file compile has no import graph, so D.Shape resolves to nothing and 5 is rejected", () => {
  // No graph → no `import * as D`, so the self-hosted check reports the alias
  // as unknown — the same diagnostic a graph build gives for a missing alias.
  const r = compile("let x : D.Shape = 5");
  expect(isErr(r)).toBe(true);
});

// ── slice b: resolution across a module edge ──────────────────────────────────

test("a nullary qualified variant resolves across the edge", () => {
  expect(errorsOf(withShapes("let g : D.Shape = Circle(1.0)"), "main.mochi")).toEqual([]);
});

test("an applied qualified variant resolves across the edge", () => {
  expect(errorsOf(withShapes("let b : D.Box number = Box(1)"), "main.mochi")).toEqual([]);
});

test("a qualified transparent record alias EXPANDS across the edge", () => {
  // `D.Pair number` must become `{ fst: number, snd: number }`, not the nominal
  // `Pair<number>` — expansion runs in shapes.mochi's own scope.
  const files = withShapes("let p : D.Pair number = { fst: 1, snd: 2 }");
  expect(errorsOf(files, "main.mochi")).toEqual([]);
});

test("a qualified record alias still rejects a row that does not match", () => {
  const files = withShapes('let p : D.Pair number = { fst: 1, snd: "no" }');
  expect(errorsOf(files, "main.mochi").length).toBeGreaterThan(0);
});

test("an alias member the dep does not export is a check diagnostic on the member's span", () => {
  const files = withShapes("let n : D.Nope = 1");
  const [d, ...rest] = errorsOf(files, "main.mochi");
  expect(rest).toEqual([]);
  expect(d?.kind).toBe("check");
  expect(d?.message).toContain("module alias 'D' has no exported type 'Nope'");
  // Reported on `nameSpan` — the member, not the whole qualified type.
  const main = files["main.mochi"]!;
  expect(main.slice(d!.start, d!.end)).toBe("Nope");
});

test("a type the dep declares but does not export is not reachable as D.T", () => {
  const [d] = errorsOf(withShapes("let h : D.Hidden = 1"), "main.mochi");
  expect(d?.message).toContain("has no exported type 'Hidden'");
});

test("a qualified type whose alias is not a namespace import is a check diagnostic", () => {
  const files = {
    "shapes.mochi": SHAPES,
    "main.mochi": 'import { Circle } from "./shapes"\nlet n : E.Shape = 1\n',
  };
  const [d] = errorsOf(files, "main.mochi");
  expect(d?.message).toContain("unknown module alias 'E'");
});

test("an alias field naming ANOTHER module's type resolves where the alias was written", () => {
  // `M.Wrapper` expands in mid.mochi's scope, so its `L.Point` field resolves
  // through mid's OWN qual map — top.mochi never imports ./leaf at all. This is
  // the whole reason `QualScope` carries the declaring module's scope.
  const files = {
    "leaf.mochi": "export type Point = { x: number, y: number }\n",
    "mid.mochi":
      'import * as L from "./leaf"\nexport type Wrapper = { inner: L.Point, tag: string }\n',
    "top.mochi": [
      'import * as M from "./mid"',
      'let w : M.Wrapper = { inner: { x: 1.0, y: 2.0 }, tag: "a" }',
      "let x = w.inner.x",
      "",
    ].join("\n"),
  };
  expect(errorsOf(files, "top.mochi")).toEqual([]);
});

test("a qualified variant is the SAME type as the dep's own — no nominal duplicate", () => {
  // `area : Shape -> number` is inferred in shapes.mochi under the bare name;
  // annotating the argument as `D.Shape` here must unify with it.
  const files = {
    "shapes.mochi": `${SHAPES}export let area = s => switch s {\n  | Circle(r) => r\n  | Rect(w, h) => w * h\n}\n`,
    "main.mochi": [
      'import * as D from "./shapes"',
      'import { area, Circle } from "./shapes"',
      "let sz : D.Shape -> number = s => area(s)",
      "let n = sz(Circle(2.0))",
      "",
    ].join("\n"),
  };
  expect(errorsOf(files, "main.mochi")).toEqual([]);
});

test("dts qualifies an inferred imported variant (C5 dts)", () => {
  const files: Record<string, string> = {
    "shapes.mochi": SHAPES,
    "main.mochi": [
      'import * as D from "./shapes"',
      'import { Circle, Rect } from "./shapes"',
      "export let sz = s => switch s { | Circle(r) => r | Rect(w, h) => w * h }",
      "",
    ].join("\n"),
  };
  const r = emitDtsForFileBootstrapWith(
    writeGraph(files, "main.mochi"),
    "@mochi/runtime",
    defaultBootstrapOptions,
  );
  if (r._tag === "Err") throw new Error(r.error.message);
  const dts = r.value;
  expect(dts).toContain('import type * as D from "./shapes.mochi";');
  expect(dts).toContain("D.Shape");
});
