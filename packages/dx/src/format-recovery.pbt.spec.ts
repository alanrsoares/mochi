// C9 slice d (ADR 0045 decision 3): the property under test is that
// formatting a broken file round-trips the exact source bytes of every
// unparsable region. We can't ask fast-check for "a mochi file with a parse
// error" directly — hoping arbitrary/random strings happen to land a
// recoverable `SError` span is not a reliable generator — so instead we
// generate a *valid* source, splice a chunk of unparsable junk into the
// middle of one line (between two of the generated top-level statements, at
// column 0, so the panic-mode recovery in ADR 0045 has a sync point to find
// its way back to), and assert that the junk bytes reappear byte-for-byte
// somewhere in the formatted output.
import { expect, test } from "bun:test";
import { format } from "@mochi/dx/format";
import { unwrapOk } from "@onrails/result";
import fc from "fast-check";

const ident = fc.constantFrom("a", "b", "foo", "x");

const stmt = fc.tuple(ident, fc.nat()).map(([name, n]) => `let ${name} = ${n}`);

// Junk that cannot parse as a statement or continue one: stray closing
// delimiters and a bare operator, with no matching opener — panic mode has to
// skip all of it to reach the next `let` at column 0.
const junk = fc.constantFrom(")(", "}{", "]]", "+*", "==>");

test("formatting a spliced-junk file preserves the junk bytes verbatim", () => {
  fc.assert(
    fc.property(
      fc.array(stmt, { minLength: 2, maxLength: 4 }),
      fc.integer({ min: 0, max: 2 }),
      junk,
      (stmts, at, j) => {
        const i = at % stmts.length;
        // Insert the junk as its own top-level line right before stmts[i].
        const lines = [...stmts.slice(0, i), j, ...stmts.slice(i)];
        const src = `${lines.join("\n")}\n`;
        const out = unwrapOk(format(src));
        expect(out).toContain(j);
      },
    ),
  );
});
