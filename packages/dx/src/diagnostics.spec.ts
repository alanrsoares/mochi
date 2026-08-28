import { expect, test } from "bun:test";
import { toTypedProgram } from "@mochi/compiler/compile";
import {
  diagnostics,
  moduleDiagnostics,
  toPublish,
  unusedBindingDiagnostics,
} from "@mochi/dx/diagnostics";
import { memRead } from "@mochi/test-support";
import { isErr } from "@onrails/result";

test("clean source produces no diagnostics", () => {
  expect(diagnostics("let n = add(mul(2, 3), 4)")).toEqual([]);
});

test("unused locals publish warning diagnostics by binding identity", () => {
  const src = "let f = value => let value = 1 in value";
  const warnings = unusedBindingDiagnostics(src).filter((d) => d.code === "unused-local");
  expect(warnings).toEqual([
    {
      range: {
        start: { line: 0, character: 8 },
        end: { line: 0, character: 13 },
      },
      message: "unused local binding 'value'",
      severity: "warning",
      code: "unused-local",
    },
  ]);
});

const unusedTopLevel = (src: string): string[] =>
  unusedBindingDiagnostics(src)
    .filter((d) => d.code === "unused-top-level")
    .map((d) => d.message);

test("an unexported, unreferenced top-level binding warns", () => {
  expect(unusedBindingDiagnostics("let helper = x => add(x, 1)\nlet n = 1")).toEqual([
    {
      range: { start: { line: 0, character: 4 }, end: { line: 0, character: 10 } },
      message: "unused binding 'helper'",
      severity: "warning",
      code: "unused-top-level",
    },
    {
      range: { start: { line: 1, character: 4 }, end: { line: 1, character: 5 } },
      message: "unused binding 'n'",
      severity: "warning",
      code: "unused-top-level",
    },
  ]);
});

test("an exported top-level binding is public API, never unused", () => {
  expect(unusedTopLevel("export let helper = x => add(x, 1)")).toEqual([]);
});

test("a top-level binding used by another one is live", () => {
  expect(unusedTopLevel("let helper = x => add(x, 1)\nexport let n = helper(1)")).toEqual([]);
});

test("self-reference does not keep a dead recursive function alive", () => {
  expect(unusedTopLevel("let countdown = n => eq(n, 0) ? 0 : countdown(sub(n, 1))")).toEqual([
    "unused binding 'countdown'",
  ]);
});

test("underscore-prefixed top-level bindings suppress the warning", () => {
  expect(unusedTopLevel('let _entry = print("hi")')).toEqual([]);
});

test("underscore-prefixed locals intentionally suppress unused warnings", () => {
  const warnings = unusedBindingDiagnostics("let f = _ignored => 1").filter(
    (d) => d.code === "unused-local",
  );
  expect(warnings).toEqual([]);
});

test("type error maps to a 0-based range on the offending expression", () => {
  const d = diagnostics("let bad = add(1, { x: 2 })");
  expect(d).toHaveLength(1);
  // record arg spans offsets 17..25 on line 0
  expect(d[0]!.range).toEqual({
    start: { line: 0, character: 17 },
    end: { line: 0, character: 25 },
  });
  expect(d[0]!.message).toStartWith("type:");
});

test("error on a later line reports the right line and column", () => {
  const d = diagnostics("let a = 1\nlet b = pi.x"); // pi : number, field on line 1
  expect(d).toHaveLength(1);
  expect(d[0]!.range.start).toEqual({ line: 1, character: 8 });
});

// Module-graph failures surface at the entry's import statement instead of
// degrading into an "unbound variable" cascade for every imported name.
const ENTRY = "/proj/main.mochi";
const DEP = "/proj/dep.mochi";

test("a missing export surfaces at the entry's import statement, no unbound cascade", async () => {
  const entrySrc = 'import { CanvasBoard, helper } from "./dep"\nlet view = CanvasBoard(helper)';
  const diags = await moduleDiagnostics(ENTRY, entrySrc, memRead({ [DEP]: "let hidden = 1" }));
  const failed = diags.filter((d) => d.message.includes("failed to compile"));
  expect(failed).toHaveLength(1);
  expect(failed[0]!.message).toContain("module './dep' failed to compile");
  expect(failed[0]!.message).toContain("has no export 'CanvasBoard'");
  // Anchored at the import statement on line 0, not at offset 0..1.
  expect(failed[0]!.range.start.line).toBe(0);
  expect(failed[0]!.range.end.character).toBeGreaterThan(1);
  // The imported names are NOT flagged as unbound — their module failed, they didn't.
  expect(diags.some((d) => d.message.includes("unbound variable"))).toBe(false);
});

test("a dep that fails to compile surfaces at the import that pulls it in", async () => {
  const entrySrc = 'import { x } from "./dep"\nlet y = x';
  const depSrc = "export let x = add(1, { y: 2 })"; // type error inside the dep
  const diags = await moduleDiagnostics(ENTRY, entrySrc, memRead({ [DEP]: depSrc }));
  const failed = diags.filter((d) => d.message.includes("failed to compile"));
  expect(failed).toHaveLength(1);
  expect(failed[0]!.message).toContain("module './dep' failed to compile");
  expect(failed[0]!.range.start).toEqual({ line: 0, character: 0 });
  expect(diags.some((d) => d.message.includes("unbound variable 'x'"))).toBe(false);
});

test("the fallback still flags the entry's own local typos", async () => {
  const entrySrc = 'import { x } from "./dep"\nlet y = x\nlet z = nope';
  const diags = await moduleDiagnostics(ENTRY, entrySrc, memRead({ [DEP]: "let hidden = 1" }));
  expect(diags.some((d) => d.message.includes("failed to compile"))).toBe(true);
  expect(diags.some((d) => d.message.includes("unbound variable 'nope'"))).toBe(true);
  expect(diags.some((d) => d.message.includes("unbound variable 'x'"))).toBe(false);
});

test("++ then -> is method-call grouping, not concat-first (ADR 0073)", () => {
  const src = `let gen = (c, n) => "ok"
let ctx = { x: 1 }
let s = "hi" ++ ctx->gen(1)`;
  expect(diagnostics(src)).toEqual([]);
});

test("diagnostics surface did-you-mean suggestions", () => {
  // compile()/LSP diagnostics are open-world (host globals); did-you-mean runs
  // in strict mode so intentional open names aren't false-positived.
  const src = "let count = 1\nlet n = coun";
  const r = toTypedProgram(src, { open: false });
  expect(isErr(r)).toBe(true);
  if (!isErr(r)) return;
  const d = toPublish(src, r.error[0]!, "/t.mochi");
  expect(d.message).toContain("help: did you mean 'count'?");
  expect(d.suggestions?.[0]?.replaceWith).toBe("count");
});
