/**
 * Slice b of C9 (ADR 0045): `parse` reports *every* parse diagnostic, and the parser
 * resynchronises on declaration keywords at bracket depth 0, leaving an `SError` node
 * whose span covers exactly the bytes it skipped.
 */
import { expect, test } from "bun:test";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import type { ErrorStmt } from "../src/ast";
import { codegen } from "../src/codegen";
import { compile } from "../src/compile";
import type { LanguagePlugin } from "../src/extensions";
import { lex } from "../src/lexer";
import { parse, parseRecovering } from "../src/parser";

const recover = (src: string, plugins?: LanguagePlugin[]) =>
  parseRecovering(unwrapOk(lex(src)), plugins ? { plugins } : {});

const errorNodes = (src: string, plugins?: LanguagePlugin[]): ErrorStmt[] =>
  recover(src, plugins).program.stmts.filter((s): s is ErrorStmt => s.kind === "error");

test("two parse errors in one file are both reported, with correct spans", () => {
  const src = "let x = )\nlet y = 2\nlet z = *\nlet w = 4\n";
  const diags = unwrapErr(parse(unwrapOk(lex(src))));
  expect(diags).toHaveLength(2);
  expect(diags.every((d) => d.kind === "parse")).toBe(true);
  expect(diags[0]!.message).toBe("unexpected token rparen");
  expect(diags[0]!.span).toEqual({ start: src.indexOf(")"), end: src.indexOf(")") + 1 });
  expect(diags[1]!.message).toBe("unexpected token star");
  expect(diags[1]!.span).toEqual({ start: src.indexOf("*"), end: src.indexOf("*") + 1 });
});

test("recovery keeps the good declarations between the bad ones", () => {
  const src = "let x = )\nlet y = 2\nlet z = *\nlet w = 4\n";
  const stmts = recover(src).program.stmts;
  expect(stmts.map((s) => s.kind)).toEqual(["error", "let", "error", "let"]);
  // The surviving `let`s are the real thing, not placeholders.
  const names = stmts.flatMap((s) => (s.kind === "let" ? [s.name] : []));
  expect(names).toEqual(["y", "w"]);
});

test("an error node's span covers exactly the skipped bytes, so the raw slice is recoverable", () => {
  const src = "let x = )\nlet y = 2\n";
  const [e] = errorNodes(src);
  expect(src.slice(e!.span.start, e!.span.end)).toBe("let x = )");
});

test("error spans are disjoint and ordered — no overlap with the surviving statements", () => {
  const src = "let x = )\nlet y = 2\nlet z = *\nlet w = 4\n";
  const spans = recover(src).program.stmts.map((s) => s.span);
  for (let i = 1; i < spans.length; i++) {
    expect(spans[i]!.start).toBeGreaterThanOrEqual(spans[i - 1]!.end);
  }
});

test("sync anchors at bracket depth 0 — a `let … in` inside brackets is not a resume point", () => {
  //                        ^error here, then a nested `let … in` before the real boundary
  const src = "let a = f(1 * * , g(let y = 1 in y))\nlet b = 2\n";
  const stmts = recover(src).program.stmts;
  expect(stmts.map((s) => s.kind)).toEqual(["error", "let"]);
  // Had the inner `let` been taken as a sync point, the error node would have stopped short.
  const [e] = errorNodes(src);
  expect(src.slice(e!.span.start, e!.span.end)).toBe("let a = f(1 * * , g(let y = 1 in y))");
});

test("plugins contribute sync tokens, and core does not hardcode them", () => {
  const src = "let a = )\nswitch x { | _ => 1 }\n";
  // Core's sync set has no `switch`, so recovery runs to eof: one error node, one diagnostic.
  expect(recover(src).diagnostics).toHaveLength(1);
  expect(errorNodes(src)).toHaveLength(1);
  // A plugin that owns a top-level `switch` form makes it a resume point — the parser
  // stops there, tries to parse it, and reports its own failure separately.
  const withSwitch: LanguagePlugin = { name: "t", syncTokens: ["switch"] };
  const r = recover(src, [withSwitch]);
  expect(r.diagnostics).toHaveLength(2);
  expect(errorNodes(src, [withSwitch])[0]!.span).toEqual({ start: 0, end: src.indexOf("\n") });
});

test("forward progress: adversarial input terminates and stays bounded by the token count", () => {
  const adversarial = [
    ")".repeat(2000),
    "(".repeat(2000),
    "let f = ".concat("(".repeat(500)),
    "*)}]let=type,".repeat(200),
    "let let let let let let let ".repeat(50),
    "switch switch switch",
    "let = = =",
    "",
    "   \n\n  ",
  ];
  for (const src of adversarial) {
    const lexed = lex(src);
    if (isErr(lexed)) continue; // a lex error never reaches the parser
    const r = parseRecovering(lexed.value);
    // Termination is the assertion: if recovery could stall this call would never return.
    // Every statement is either parsed or one error node, so the count is token-bounded.
    expect(r.program.stmts.length).toBeLessThanOrEqual(lexed.value.length);
  }
});

test("runaway output is capped, and says so", () => {
  const src = Array.from({ length: 300 }, (_, i) => `let x${i} = )`).join("\n");
  const diags = unwrapErr(parse(unwrapOk(lex(src))));
  expect(diags).toHaveLength(101); // MAX_PARSE_ERRORS + the cap notice
  expect(diags[100]!.message).toBe("too many parse errors; stopping");
  expect(diags[100]!.kind).toBe("parse");
});

test("`parse` stays hard-fail: diagnostics mean no Program (ADR 0004 as amended)", () => {
  const r = parse(unwrapOk(lex("let x = )\nlet y = 2\n")));
  expect(isErr(r)).toBe(true);
  // The partial tree is only reachable through `parseRecovering`.
  expect(recover("let x = )\nlet y = 2\n").program.stmts).toHaveLength(2);
});

test("a clean file still parses to no diagnostics and no error nodes", () => {
  const src = "let x = 1\nlet y = add(x, 2)\n";
  const r = recover(src);
  expect(r.diagnostics).toEqual([]);
  expect(errorNodes(src)).toEqual([]);
});

test("compile reports every parse diagnostic, not just the first", () => {
  const r = compile("let x = )\nlet y = 2\nlet z = *\n");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)).toHaveLength(2);
  expect(unwrapErr(r).every((d) => d.kind === "parse")).toBe(true);
});

test("codegen asserts its invariant rather than emitting garbage for an error node", () => {
  // Unreachable through the railway (it stops on parse diagnostics); this pins the
  // contract so a future caller that skips the gate fails loudly (ADR 0045 decision 6).
  expect(() => codegen({ stmts: [{ kind: "error", span: { start: 0, end: 3 } }] })).toThrow(
    /codegen invariant/,
  );
});
