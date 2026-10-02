// loop/recur (ADR 0056) — surface loops that emit idiomatic JS while-loops.
// Covers the parse shape, checkLoops diagnostics, runtime semantics, and the
// emit contract (statement form under a lambda, IIFE elsewhere, step protocol
// only when a switch sits in the tail).

import { describe, expect, it } from "bun:test";
import { compile } from "@mochi/compiler";
import { lex, parse } from "@mochi/compiler/bootstrap/syntax";
import type { Stmt } from "@mochi/compiler/bootstrap/types";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";

const js = (src: string): string => unwrapOk(compile(src));
const evalJs = (src: string, ret: string): unknown => {
  const body = js(src).replace(/^import .*$/m, "");
  return new Function("match", `${body}\nreturn ${ret};`)(match);
};
type Lexed = { _tag: "Ok"; value: unknown } | { _tag: "Err"; error: unknown };
type Parsed = { _tag: "Ok"; value: Stmt[] } | { _tag: "Err"; error: unknown };
const parseSrc = (src: string): Parsed => {
  const lexed = lex(src) as Lexed;
  if (lexed._tag === "Err") throw new Error("lex failed");
  return parse(lexed.value) as Parsed;
};
const errs = (src: string): string[] => {
  const r = compile(src);
  return isErr(r) ? r.error.map((d) => `${d.kind}: ${d.message}`) : [];
};

describe("parse", () => {
  it("parses loop params and a first-class recur node", () => {
    const prog = unwrapOk(parseSrc("let f = loop (a = 1, b = 2) { recur(a, b) }"));
    const stmt = prog[0]!;
    if (stmt._tag !== "SLet" || stmt.value._tag !== "ELoop") throw new Error("expected loop");
    expect(stmt.value.params.map((p) => p.name)).toEqual(["a", "b"]);
    expect(stmt.value.body._tag).toBe("ERecur");
  });

  it("rejects a param-less loop head", () => {
    expect(isErr(parseSrc("let f = loop () { 1 }"))).toBe(true);
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
  it("evaluates recur arguments left to right before rebinding any parameter", () => {
    const run = evalJs(
      `let run = log => loop (a = 1, b = 2) {
      a > 2 ? (a, b) : recur(log(b), log(a + b))
    }`,
      "run",
    ) as (log: (n: number) => number) => number[];
    const seen: number[] = [];
    expect(
      run((n) => {
        seen.push(n);
        return n;
      }),
    ).toEqual([3, 5]);
    expect(seen).toEqual([2, 3, 3, 5]);
  });

  it("preserves closures over the mutable loop parameters", () => {
    const src = `let out = loop (i = 0, read = () => 0) {
      i >= 2 ? read() : recur(i + 1, () => i)
    }`;
    expect(evalJs(src, "out")).toBe(2);
  });

  it("avoids temporary collisions with user bindings and loop parameters", () => {
    const src = `let $recur0 = 10
      let $recur0$ = 20
      let out = loop ($recur1 = 0, total = 0) {
        $recur1 >= 2 ? total : recur($recur1 + 1, total + $recur0 + $recur0$)
      }`;
    expect(evalJs(src, "out")).toBe(60);
  });

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

  it("keeps consecutive discarded bindings in distinct loop scopes", () => {
    const src = `
      let run = (log) =>
        loop (i = 0) {
          i >= 1
            ? ()
            : let _ = log(i) in
              let _ = log(i + 1) in
              recur(i + 1)
        }`;
    const seen: number[] = [];
    const run = evalJs(src, "run") as (log: (n: number) => void) => void;
    run((n) => seen.push(n));
    expect(seen).toEqual([0, 1]);
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
  it("direct multi-parameter recur uses scalar temporaries", () => {
    const out = js("let out = loop (a = 1, b = 2) { a > 2 ? b : recur(b, a + b) }");
    expect(out).toContain("const $recur0 = b;");
    expect(out).toContain("a = $recur0; b = $recur1; continue;");
    expect(out).not.toContain("[a, b] =");
  });

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

  it("a flat switch tail uses statements and scalar recur", () => {
    const out = js(
      "let f = (xs) => loop (acc = 0, i = 0) { switch Array.get(i, xs) { | None => acc | Some(x) => recur(acc + x, i + 1) } }",
    );
    expect(out).not.toContain("_step");
    expect(out).not.toContain("_done(");
    expect(out).toContain('if ($loopMatch._tag === "None")');
    expect(out).toContain("const $recur0 = add(acc, x)");
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

describe("Array.forEach (ADR 0056)", () => {
  it("runs the effect once per element, in order, and returns unit", () => {
    const src = `
      let out = (log) =>
        let _ = Array.forEach((x) => ignore(log(x)), [1, 2, 3]) in
        ()`;
    const seen: number[] = [];
    const body = js(src).replace(/^import .*$/m, "");
    const run = new Function("match", `${body}\nreturn out;`)(match) as (
      f: (x: number) => void,
    ) => undefined;
    expect(run((x) => seen.push(x))).toBeUndefined();
    expect(seen).toEqual([1, 2, 3]);
  });

  it("does not over-apply curried callbacks (not native forEach)", () => {
    // A curried binary would be saturated by native forEach's (x, i) arity.
    const out = js("let go = Array.forEach((x) => ignore(x), [1])");
    expect(out).toContain("_Array_forEach");
    expect(out).not.toContain(".forEach(");
  });
});
