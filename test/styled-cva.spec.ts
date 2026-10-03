import { describe, expect, it } from "bun:test";
import { compile } from "@mochi/compiler";
import { parseProgram } from "@mochi/compiler/syntax";
import { format } from "@mochi/dx/format";
import { unwrapOk } from "@onrails/result";

/** The first statement of a clean self-hosted parse. */
const firstStmt = (src: string) => {
  const r = parseProgram(src);
  if (r._tag === "Err" || r.value.diagnostics.length > 0) throw new Error(`parse failed: ${src}`);
  return r.value.stmts[0]!;
};

describe("$ labels for styled-cva interop", () => {
  it("parses $tone record fields", () => {
    const stmt = firstStmt(`let cfg = { $tone: { rose: "bg-rose" } }`);
    expect(stmt._tag).toBe("SLet");
    if (stmt._tag === "SLet" && stmt.value._tag === "ERecord") {
      expect(stmt.value.fields[0]?.name).toBe("$tone");
    }
  });

  it("parses $tone JSX attributes", () => {
    const stmt = firstStmt(`let el = <Button $tone="rose" $size="sm">{"x"}</Button>`);
    if (
      stmt._tag === "SLet" &&
      stmt.value._tag === "ECall" &&
      stmt.value.args[1]?._tag === "ERecord"
    ) {
      expect(stmt.value.args[1].fields.map((f) => f.name)).toEqual(["$tone", "$size"]);
    }
  });

  it("binds $tone as an ordinary value name (ADR 0047)", () => {
    const js = unwrapOk(compile("let $tone = 1\nlet doubled = $tone + $tone"));
    expect(js).toContain("const $tone = 1;");
    expect(js).toContain("add($tone, $tone)");
  });

  it("destructures and matches $ labels", () => {
    const js = unwrapOk(
      compile("let pick = ({ $tone }) => $tone\nlet at = r => switch r { | { $tone: t } => t }"),
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
