// loop/recur (ADR 0056) — surface loops that emit idiomatic JS while-loops.
// Covers the parse shape, checkLoops diagnostics, runtime semantics, and the
// emit contract (statement form under a lambda, IIFE elsewhere, step protocol
// only when a switch sits in the tail).

import { describe, expect, it } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";

const js = (src: string): string => unwrapOk(compile(src));
const evalJs = (src: string, ret: string): unknown => {
  const body = js(src).replace(/^import .*$/m, "");
  return new Function("match", `${body}\nreturn ${ret};`)(match);
};
const errs = (src: string): string[] => {
  const r = compile(src);
  return isErr(r) ? r.error.map((d) => `${d.kind}: ${d.message}`) : [];
};

describe("parse", () => {
  it("parses loop params and a first-class recur node", () => {
    const prog = unwrapOk(parse(unwrapOk(lex("let f = loop (a = 1, b = 2) { recur(a, b) }"))));
    const stmt = prog.stmts[0]!;
    if (stmt.kind !== "let" || stmt.value.kind !== "loop") throw new Error("expected loop");
    expect(stmt.value.params.map((p) => p.name)).toEqual(["a", "b"]);
    expect(stmt.value.body.kind).toBe("recur");
  });

  it("rejects a param-less loop head", () => {
    expect(isErr(parse(unwrapOk(lex("let f = loop () { 1 }"))))).toBe(true);
  });
});

describe("checkLoops diagnostics", () => {
  it("rejects recur outside a loop", () => {
    expect(errs("let f = (x) => recur(x)").some((m) => m.includes("inside a loop"))).toBe(true);
  });

  it("rejects non-tail recur", () => {
    const src = "let f = loop (i = 0) { recur(i) + 1 }";
    expect(errs(src).some((m) => m.includes("tail position"))).toBe(true);
  });

  it("rejects recur arity mismatch", () => {
    const src = "let f = loop (a = 0, b = 0) { a > 9 ? a : recur(a + 1) }";
    expect(errs(src).some((m) => m.includes("takes 2 arguments"))).toBe(true);
  });

  it("rejects duplicate loop params", () => {
    const src = "let f = loop (a = 0, a = 1) { a }";
    expect(errs(src).some((m) => m.includes("duplicate loop param"))).toBe(true);
  });

  it("rejects a letin shadowing a loop param", () => {
    const src = "let f = loop (a = 0) { let a = 1 in a > 0 ? a : recur(a) }";
    expect(errs(src).some((m) => m.includes("shadows a loop param"))).toBe(true);
  });

  it("recur belongs to the NEAREST loop (arity checked against it)", () => {
    const src = "let f = loop (a = 0, b = 0) { loop (c = 0) { c > 9 ? c : recur(a, b) } }";
    expect(errs(src).some((m) => m.includes("takes 1 argument"))).toBe(true);
  });

  it("lambda bodies are a hard boundary", () => {
    const src = "let f = loop (i = 0) { map((x) => recur(x), [1]) }";
    expect(errs(src).some((m) => m.includes("inside a loop"))).toBe(true);
  });

  it("recur args unify with the loop params (type error on mismatch)", () => {
    const src = 'let f = loop (i = 0) { i > 9 ? i : recur("no") }';
    expect(errs(src).some((m) => m.startsWith("type:"))).toBe(true);
  });
});

describe("semantics", () => {
  it("accumulates through the step protocol (switch tail)", () => {
    const src = `
      let sum = (xs) =>
        loop (acc = 0, i = 0) {
          switch Array.get(i, xs) {
            | None => acc
            | Some(x) => recur(acc + x, i + 1)
          }
        }
      let out = sum([1, 2, 3, 4])`;
    expect(evalJs(src, "out")).toBe(10);
  });

  it("counts via the direct rebind form (ternary tail)", () => {
    const src = "let out = loop (i = 0, n = 0) { i >= 5 ? n : recur(i + 1, n + i) }";
    expect(evalJs(src, "out")).toBe(10);
  });

  it("threads letin bindings inside the loop body", () => {
    const src = `
      let out = loop (i = 0, acc = 0) {
        let next = acc + i * 2 in
        i >= 3 ? next : recur(i + 1, next)
      }`;
    expect(evalJs(src, "out")).toBe(12);
  });

  it("nested loops recur independently", () => {
    const src = `
      let out = loop (row = 0, total = 0) {
        row >= 3
          ? total
          : recur(row + 1, loop (col = 0, t = total) { col >= 2 ? t : recur(col + 1, t + 1) })
      }`;
    expect(evalJs(src, "out")).toBe(6);
  });

  it("runs depths that would overflow non-tail recursion", () => {
    const src = "let out = loop (i = 0) { i >= 1000000 ? i : recur(i + 1) }";
    expect(evalJs(src, "out")).toBe(1000000);
  });
});

describe("emit contract", () => {
  it("a loop directly under a lambda is a bare block, not an IIFE", () => {
    const out = js("let count = (n) => loop (i = 0) { i >= n ? i : recur(i + 1) }");
    expect(out).toContain("while (true)");
    expect(out).not.toContain("(() =>");
  });

  it("a match-free loop never references the step helpers", () => {
    const out = js("let count = (n) => loop (i = 0) { i >= n ? i : recur(i + 1) }");
    expect(out).not.toContain("_done(");
    expect(out).not.toContain("_recur(");
  });

  it("a switch tail uses the step protocol and keeps the ts-pattern chain", () => {
    const out = js(
      "let f = (xs) => loop (acc = 0, i = 0) { switch Array.get(i, xs) { | None => acc | Some(x) => recur(acc + x, i + 1) } }",
    );
    expect(out).toContain('_step._tag === "recur"');
    expect(out).toContain("_done(acc)");
    expect(out).toContain(".exhaustive()");
  });

  it("an expression-position loop wraps in an IIFE", () => {
    const out = js("let pair = (loop (i = 0) { i > 2 ? i : recur(i + 1) }, 1)");
    expect(out).toContain("(() =>");
  });

  it("a loop param clashing with a lambda param falls back to the IIFE form", () => {
    const out = js("let f = (i) => loop (i = 0) { i > 2 ? i : recur(i + 1) }");
    expect(out).toContain("(() =>"); // `let i` beside param `i` would be a JS redeclaration
  });
});
