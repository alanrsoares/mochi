// Property-based test for AST span nesting. We generate valid mochi
// expressions, parse them, and assert the fundamental invariant every span
// consumer (errors, LSP ranges) relies on: a child node's span is always
// contained within its parent's, and every span lies within the source.
import { expect, test } from "bun:test";
import { unwrapOk } from "@onrails/result";
import fc from "fast-check";
import type { Expr } from "../src/ast";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";

const ident = fc.constantFrom("a", "b", "foo", "bar", "x");
const field = fc.constantFrom("x", "y", "z");
const key = fc.constantFrom("a", "b", "c");

// A generator of syntactically valid mochi expression source.
const { expr } = fc.letrec<{ expr: string }>((tie) => ({
  expr: fc.oneof(
    { depthSize: "small", withCrossShrink: true },
    fc.nat().map(String),
    ident,
    fc.tuple(ident, field).map(([b, f]) => `${b}.${f}`),
    fc.tuple(ident, ident).map(([a, b]) => `${a} |> ${b}`),
    fc
      .tuple(ident, fc.array(tie("expr"), { minLength: 1, maxLength: 3 }))
      .map(([f, as]) => `${f}(${as.join(", ")})`),
    fc
      .array(fc.tuple(key, tie("expr")), { minLength: 1, maxLength: 2 })
      .map((fs) => `{ ${fs.map(([k, v]) => `${k}: ${v}`).join(", ")} }`),
  ),
}));

// Direct sub-expressions of a node.
const children = (e: Expr): Expr[] => {
  switch (e.kind) {
    case "num":
    case "bool":
    case "str":
    case "ref":
      return [];
    case "interp":
      return e.parts.filter((p): p is Expr => typeof p !== "string");
    case "call":
      return [e.fn, ...e.args];
    case "lambda":
      return [e.body];
    case "letin":
    case "letbind":
      return [e.value, e.body];
    case "tuple":
      return e.elements;
    case "pipe":
      return [e.left, e.right];
    case "ternary":
      return [e.cond, e.then, e.else];
    case "match":
      return [e.scrutinee, ...e.arms.map((a) => a.body)];
    case "record":
      return e.fields.map((f) => f.value);
    case "field":
      return [e.target];
    case "arr":
    case "list":
    case "set":
      return e.elements.map((el) => el.expr);
    case "map":
      return e.entries.flatMap((en) => [en.key, en.value]);
  }
};

test("every child span is contained within its parent's span", () => {
  fc.assert(
    fc.property(expr, (body) => {
      const src = `let v = ${body}`;
      const prog = unwrapOk(parse(unwrapOk(lex(src))));
      const walk = (e: Expr): void => {
        expect(e.span.start).toBeGreaterThanOrEqual(0);
        expect(e.span.end).toBeLessThanOrEqual(src.length);
        for (const c of children(e)) {
          expect(c.span.start).toBeGreaterThanOrEqual(e.span.start);
          expect(c.span.end).toBeLessThanOrEqual(e.span.end);
          walk(c);
        }
      };
      const stmt = prog.stmts[0]!;
      if (stmt.kind === "let") walk(stmt.value);
    }),
  );
});
