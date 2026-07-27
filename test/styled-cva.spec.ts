import { describe, expect, it } from "bun:test";
import { unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { format } from "../src/format";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";

describe("$ labels for styled-cva interop", () => {
  it("parses $tone record fields", () => {
    const prog = unwrapOk(parse(unwrapOk(lex(`let cfg = { $tone: { rose: "bg-rose" } }`))));
    const stmt = prog.stmts[0]!;
    expect(stmt.kind).toBe("let");
    if (stmt.kind === "let" && stmt.value.kind === "record") {
      expect(stmt.value.fields[0]?.name).toBe("$tone");
    }
  });

  it("parses $tone JSX attributes", () => {
    const prog = unwrapOk(
      parse(unwrapOk(lex(`let el = <Button $tone="rose" $size="sm">{"x"}</Button>`))),
    );
    const stmt = prog.stmts[0]!;
    if (
      stmt.kind === "let" &&
      stmt.value.kind === "call" &&
      stmt.value.args[1]?.kind === "record"
    ) {
      expect(stmt.value.args[1].fields.map((f) => f.name)).toEqual(["$tone", "$size"]);
    }
  });

  it("binds $tone as an ordinary value name (ADR 0047)", () => {
    const js = unwrapOk(compile(`let $tone = 1\nlet doubled = $tone + $tone`));
    expect(js).toContain("const $tone = 1;");
    expect(js).toContain("add($tone, $tone)");
  });

  it("destructures and matches $ labels", () => {
    const js = unwrapOk(
      compile(`let pick = ({ $tone }) => $tone\nlet at = r => switch r { | { $tone: t } => t }`),
    );
    expect(js).toContain("({ $tone })");
    expect(js).toContain("$tone");
  });

  it("formats $ labels idempotently in records and JSX", () => {
    const src = 'let cfg={$tone:{rose:"bg-rose"}}\nlet el=<Btn $tone="rose">{"hi"}</Btn>\n';
    const once = unwrapOk(format(src));
    expect(once).toContain("$tone:");
    expect(once).toContain('$tone="rose"');
    expect(unwrapOk(format(once))).toBe(once);
  });

  it('emits default-import for extern … "default"', () => {
    const js = unwrapOk(
      compile(`extern tw : a = "@styled-cva/react" "default"\nlet B = tw.button("base")`),
    );
    expect(js).toContain('import tw from "@styled-cva/react";');
    expect(js).not.toContain("{ default");
  });

  it("compiles a call-form factory + $tone JSX usage", () => {
    const src = `
extern tw : a = "@styled-cva/react" "default"
let Button = tw.button("px-4 py-2", {
  variants: { $tone: { rose: "bg-rose-500", ghost: "bg-transparent" } },
  defaultVariants: { $tone: "rose" }
})
let Chip = props => <Button $tone={props.$tone}>{"hi"}</Button>
`;
    const js = unwrapOk(compile(src));
    expect(js).toContain('import tw from "@styled-cva/react";');
    expect(js).toContain("$tone:");
    expect(js).toContain("h(Button,");
    expect(js).toMatch(/\$tone:\s*props\.\$tone/);
  });
});
