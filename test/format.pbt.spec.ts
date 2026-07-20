// Property: formatting is idempotent — format(format(src)) === format(src) —
// over generated valid alang expressions. This is the defining law of a
// pretty-printer: the formatted form is a fixed point.
import { expect, test } from "bun:test";
import { unwrapOk } from "@onrails/result";
import fc from "fast-check";
import { format } from "../src/format";

const ident = fc.constantFrom("a", "b", "foo", "x");
const field = fc.constantFrom("x", "y", "z");
const key = fc.constantFrom("a", "b", "c");

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

test("format is a fixed point", () => {
  fc.assert(
    fc.property(expr, (body) => {
      const once = unwrapOk(format(`let v = ${body}`));
      expect(unwrapOk(format(once))).toBe(once);
    }),
  );
});
