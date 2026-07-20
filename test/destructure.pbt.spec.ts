// Property-based test for record destructuring: for any record literal, a
// destructured binding always equals the corresponding source field.
import { expect, test } from "bun:test";
import { unwrapOk } from "@onrails/result";
import fc from "fast-check";
import { compile } from "../src/compile";
import { preludeJs } from "../src/prelude";

const name = fc.constantFrom("a", "b", "c", "d", "e", "f");

test("each destructured name binds the matching field value", () => {
  fc.assert(
    fc.property(
      fc.uniqueArray(fc.record({ k: name, v: fc.nat() }), {
        minLength: 1,
        maxLength: 6,
        selector: (f) => f.k,
      }),
      fc.nat(),
      (fields, pick) => {
        const chosen = fields[pick % fields.length]!;
        const rec = `{ ${fields.map((f) => `${f.k}: ${f.v}`).join(", ")} }`;
        const names = fields.map((f) => f.k).join(", ");
        const src = `let r = ${rec}\nlet { ${names} } = r\nlet last = ${chosen.k}`;
        const js = unwrapOk(compile(src));
        expect(new Function(`${preludeJs}\n${js}\nreturn last;`)()).toBe(chosen.v);
      },
    ),
  );
});
