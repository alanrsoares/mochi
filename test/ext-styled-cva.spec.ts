import { describe, expect, test } from "bun:test";
import { isErr, unwrapOk } from "@onrails/result";
import { toTypedProgram } from "../src/compile";
import { emitDts } from "../src/dts";
import { styledCvaExtension } from "../src/ext/styled-cva";
import { showScheme } from "../src/infer";
import { preludeNamespaces } from "../src/prelude";

const exts = [styledCvaExtension];

test("styled-cva extension: tw.div with variants → component scheme", () => {
  const src = `
export extern tw : a = "@styled-cva/react" "default"
export let Badge = tw.div("base", {
  variants: { $tone: { rose: "a", amber: "b" } },
  defaultVariants: { $tone: "rose" }
})
`;
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces, extensions: exts });
  expect(isErr(r)).toBe(false);
  const sc = unwrapOk(r).res.env.get("Badge")!;
  const shown = showScheme(sc, unwrapOk(r).res.aliases);
  expect(shown).toContain("VNode");
  expect(shown).toContain("$tone");
});

test("styled-cva dtsBinding emits $tone literal unions", () => {
  const src = `
export extern tw : a = "@styled-cva/react" "default"
export let BadgeShell = tw.div("base", {
  variants: {
    $tone: { rose: "a", amber: "b", emerald: "c" }
  },
  defaultVariants: { $tone: "rose" }
})
`;
  const dts = unwrapOk(emitDts(src, { extensions: exts }));
  expect(dts).toContain("export declare const BadgeShell:");
  expect(dts).toContain('$tone?: "rose" | "amber" | "emerald"');
  expect(dts).toContain("children?: unknown");
  expect(dts).toContain("Record<string, unknown>");
  expect(dts).toContain("=> any");
  expect(dts).not.toMatch(/BadgeShell: unknown/);
});

test("without extension, tw factory stays unknown in dts", () => {
  const src = `
export extern tw : a = "@styled-cva/react" "default"
export let Badge = tw.div("base")
`;
  const dts = unwrapOk(emitDts(src));
  expect(dts).toContain("export declare const Badge: unknown;");
});

test("JSX core: invalid component prop fails when tag is a component", () => {
  const src = `
export extern tw : a = "@styled-cva/react" "default"
export let Btn = tw.button("x", { variants: { $tone: { a: "1", b: "2" } } })
export let bad = <Btn $tone={1} />
`;
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces, extensions: exts });
  expect(isErr(r)).toBe(true);
});
