/**
 * Slice b of C9 (ADR 0045): `compile` reports every parse diagnostic, and the parser
 * resynchronises on declaration keywords at bracket depth 0, leaving an `SError` node
 * whose span covers exactly the bytes it skipped.
 */
import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler";
import type { BootstrapDiagnostic, BootstrapResult } from "@mochi/compiler/bootstrap";
import { parseProgram, lex as seedLex, parse as seedParse } from "@mochi/compiler/bootstrap/syntax";
import type { LocTok, Stmt, Tok } from "@mochi/compiler/bootstrap/types";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";

const lex = (src: string) => seedLex(src) as BootstrapResult<LocTok<Tok>[], BootstrapDiagnostic>;
const parse = (tokens: LocTok<Tok>[]) =>
  seedParse(tokens) as BootstrapResult<Stmt[], BootstrapDiagnostic>;

const recover = (src: string) => unwrapOk(parseProgram(src));
const errorNodes = (src: string) => recover(src).stmts.filter((s) => s._tag === "SError");

test("two parse errors in one file are both reported, with correct spans", () => {
  const src = "let x = )\nlet y = 2\nlet z = *\nlet w = 4\n";
  const diags = unwrapErr(compile(src));
  expect(diags).toHaveLength(2);
  expect(diags.every((d) => d.kind === "parse")).toBe(true);
  expect(diags[0]!.message).toBe("unexpected token rparen");
  expect(diags[0]!.span).toEqual({ start: src.indexOf(")"), end: src.indexOf(")") + 1 });
  expect(diags[1]!.message).toBe("unexpected token star");
  expect(diags[1]!.span).toEqual({ start: src.indexOf("*"), end: src.indexOf("*") + 1 });
});

test("recovery keeps the good declarations between the bad ones", () => {
  const src = "let x = )\nlet y = 2\nlet z = *\nlet w = 4\n";
  const stmts = recover(src).stmts;
  expect(stmts.map((s) => s._tag)).toEqual(["SError", "SLet", "SError", "SLet"]);
  // The surviving `let`s are the real thing, not placeholders.
  const names = stmts.flatMap((s) => (s._tag === "SLet" ? [s.name] : []));
  expect(names).toEqual(["y", "w"]);
});

test("an error node's span covers exactly the skipped bytes, so the raw slice is recoverable", () => {
  const src = "let x = )\nlet y = 2\n";
  const [e] = errorNodes(src);
  expect(src.slice(e!.span.start, e!.span.end)).toBe("let x = )");
});

test("error spans are disjoint and ordered — no overlap with the surviving statements", () => {
  const src = "let x = )\nlet y = 2\nlet z = *\nlet w = 4\n";
  const spans = recover(src).stmts.map((s) => s.span);
  for (let i = 1; i < spans.length; i++) {
    expect(spans[i]!.start).toBeGreaterThanOrEqual(spans[i - 1]!.end);
  }
});

test("sync anchors at bracket depth 0 — a `let … in` inside brackets is not a resume point", () => {
  //                        ^error here, then a nested `let … in` before the real boundary
  const src = "let a = f(1 * * , g(let y = 1 in y))\nlet b = 2\n";
  const stmts = recover(src).stmts;
  expect(stmts.map((s) => s._tag)).toEqual(["SError", "SLet"]);
  // Had the inner `let` been taken as a sync point, the error node would have stopped short.
  const [e] = errorNodes(src);
  expect(src.slice(e!.span.start, e!.span.end)).toBe("let a = f(1 * * , g(let y = 1 in y))");
});

test("recovery resumes only at declaration keywords", () => {
  const src = "let a = )\nswitch x { | _ => 1 }\n";
  expect(recover(src).diagnostics).toHaveLength(1);
  expect(errorNodes(src)).toHaveLength(1);
  expect(errorNodes(src)[0]!.span).toEqual({ start: 0, end: src.trimEnd().length });
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
    const r = recover(src);
    // Termination is the assertion: if recovery could stall this call would never return.
    // Every statement is either parsed or one error node, so the count is token-bounded.
    expect(r.stmts.length).toBeLessThanOrEqual(lexed.value.length);
  }
});

test("runaway output is capped, and says so", () => {
  const src = Array.from({ length: 300 }, (_, i) => `let x${i} = )`).join("\n");
  const diags = unwrapErr(compile(src));
  expect(diags).toHaveLength(101); // MAX_PARSE_ERRORS + the cap notice
  expect(diags[100]!.message).toBe("too many parse errors; stopping");
  expect(diags[100]!.kind).toBe("parse");
});

test("`parse` stays hard-fail: diagnostics mean no Program (ADR 0004 as amended)", () => {
  const r = parse(unwrapOk(lex("let x = )\nlet y = 2\n")));
  expect(isErr(r)).toBe(true);
  // The partial tree is only reachable through `parseRecovering`.
  expect(recover("let x = )\nlet y = 2\n").stmts).toHaveLength(2);
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
