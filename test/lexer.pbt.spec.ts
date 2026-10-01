// Property-based tests for lexer token spans. Source is assembled from valid
// lexemes joined by spaces, so every input lexes; we then assert the emitted
// spans are well-formed: ordered, in-bounds, non-overlapping, and (for id/num)
// they slice back to the original lexeme.
import { expect, test } from "bun:test";
import type { BootstrapDiagnostic, BootstrapResult } from "@mochi/compiler/bootstrap";
import { lex as seedLex } from "@mochi/compiler/bootstrap/syntax";
import type { LocTok, Tok } from "@mochi/compiler/bootstrap/types";
import { unwrapOk } from "@onrails/result";
import fc from "fast-check";

const lex = (src: string) => seedLex(src) as BootstrapResult<LocTok<Tok>[], BootstrapDiagnostic>;

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
  "~",
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
        expect(tk.start).toBeGreaterThanOrEqual(0);
        expect(tk.start).toBeLessThanOrEqual(tk.end);
        expect(tk.end).toBeLessThanOrEqual(src.length);
        expect(tk.start).toBeGreaterThanOrEqual(prevEnd); // no overlap
        prevEnd = tk.end;
      }
    }),
  );
});

test("the last token is eof, spanning [len, len]", () => {
  fc.assert(
    fc.property(source, (src) => {
      const toks = unwrapOk(lex(src));
      const eof = toks[toks.length - 1]!;
      expect(eof.tok._tag).toBe("TEof");
      expect({ start: eof.start, end: eof.end }).toEqual({ start: src.length, end: src.length });
    }),
  );
});

test("id and num spans slice back to their lexeme", () => {
  fc.assert(
    fc.property(source, (src) => {
      for (const tk of unwrapOk(lex(src))) {
        if (tk.tok._tag === "TId") expect(src.slice(tk.start, tk.end)).toBe(tk.tok.value);
        if (tk.tok._tag === "TNum") expect(Number(src.slice(tk.start, tk.end))).toBe(tk.tok.value);
      }
    }),
  );
});
