// Property: formatting is idempotent — format(format(src)) === format(src) —
// over generated valid mochi expressions. This is the defining law of a
// pretty-printer: the formatted form is a fixed point.
import { expect, test } from "bun:test";
import { format } from "@mochi/dx/format";
import { unwrapOk } from "@onrails/result";
import fc from "fast-check";

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
    // Binder- and block-shaped forms. These carry the layout decisions most
    // likely to drift — whether a `let … in` body indents, whether a `do` block
    // stays broken — and the alternatives above reach none of them.
    // `_` is in the binder set on purpose: `let _ = … in` prints as a `do`
    // block, a different layout path from every other binder.
    fc
      .tuple(fc.oneof(ident, fc.constant("_")), tie("expr"), tie("expr"))
      .map(([n, v, b]) => `let ${n} = ${v} in ${b}`),
    fc.array(tie("expr"), { minLength: 2, maxLength: 3 }).map((es) => `do { ${es.join("; ")} }`),
    fc.tuple(ident, tie("expr")).map(([p, b]) => `${p} => ${b}`),
    fc.tuple(tie("expr"), tie("expr"), tie("expr")).map(([c, t, e]) => `${c} ? ${t} : ${e}`),
    fc
      .tuple(ident, tie("expr"), tie("expr"))
      .map(([s, a, b]) => `switch ${s} { | Some(inner) => ${a} | _ => ${b} }`),
    fc.tuple(ident, tie("expr")).map(([t, b]) => `<${t} onClick={${b}}>{"k"}</${t}>`),
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
