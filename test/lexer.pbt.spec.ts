// Property-based tests for lexer token spans. Source is assembled from valid
// lexemes joined by spaces, so every input lexes; we then assert the emitted
// spans are well-formed: ordered, in-bounds, non-overlapping, and (for id/num)
// they slice back to the original lexeme.
import { expect, test } from "bun:test";
import { unwrapOk } from "@onrails/result";
import fc from "fast-check";
import { lex } from "../src/lexer";

const lexeme = fc.constantFrom(
  "foo",
  "bar",
  "x1",
  "Circle",
  "let",
  "type",
  "switch",
  "123",
  "4.5",
  "0",
  "(",
  ")",
  "{",
  "}",
  ".",
  ":",
  ",",
  "|",
  "=",
  "|>",
  "=>",
);

const source = fc.array(lexeme).map((parts) => parts.join(" "));

test("token spans are ordered, in-bounds, and non-overlapping", () => {
  fc.assert(
    fc.property(source, (src) => {
      const toks = unwrapOk(lex(src));
      let prevEnd = 0;
      for (const tk of toks) {
        expect(tk.span.start).toBeGreaterThanOrEqual(0);
        expect(tk.span.start).toBeLessThanOrEqual(tk.span.end);
        expect(tk.span.end).toBeLessThanOrEqual(src.length);
        expect(tk.span.start).toBeGreaterThanOrEqual(prevEnd); // no overlap
        prevEnd = tk.span.end;
      }
    }),
  );
});

test("the last token is eof, spanning [len, len]", () => {
  fc.assert(
    fc.property(source, (src) => {
      const toks = unwrapOk(lex(src));
      const eof = toks[toks.length - 1]!;
      expect(eof.t).toBe("eof");
      expect(eof.span).toEqual({ start: src.length, end: src.length });
    }),
  );
});

test("id and num spans slice back to their lexeme", () => {
  fc.assert(
    fc.property(source, (src) => {
      for (const tk of unwrapOk(lex(src))) {
        if (tk.t === "id") expect(src.slice(tk.span.start, tk.span.end)).toBe(tk.v);
        if (tk.t === "num") expect(Number(src.slice(tk.span.start, tk.span.end))).toBe(tk.v);
      }
    }),
  );
});
