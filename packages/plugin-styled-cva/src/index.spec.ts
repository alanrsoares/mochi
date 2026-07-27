import { expect, test } from "bun:test";
import { isErr, unwrapOk } from "@onrails/result";
import { toTypedProgram } from "../../../src/compile";
import { moduleCompleteAt } from "../../../src/complete";
import { emitDts } from "../../../src/dts";
import { showScheme } from "../../../src/infer";
import { moduleContext } from "../../../src/module";
import { preludeNamespaces } from "../../../src/prelude";
import { styledCvaExtension } from "./index";

const exts = [styledCvaExtension];

test("styled-cva extension: tw.div with variants → component scheme", () => {
  const src = `
export extern tw : a = "@styled-cva/react" "default"
export let Badge = tw.div("base", {
  variants: { $tone: { rose: "a", amber: "b" } },
  defaultVariants: { $tone: "rose" }
})
`;
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces, plugins: exts });
  expect(isErr(r)).toBe(false);
  const sc = unwrapOk(r).res.env.get("Badge")!;
  const shown = showScheme(sc, unwrapOk(r).res.aliases);
  expect(shown).toContain("VNode");
  expect(shown).toContain("$tone");
  expect(shown).toContain('"rose"');
  expect(shown).toContain('"amber"');
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
  const dts = unwrapOk(emitDts(src, { plugins: exts }));
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

test("module graph: tw.div binding types as Record → VNode when extensions cross a module boundary", async () => {
  const files: Record<string, string> = {
    "/p/ui.mochi": `
export extern tw : a = "@styled-cva/react" "default"
export let Badge = tw.div("base", {
  variants: { $tone: { rose: "a", amber: "b" } },
  defaultVariants: { $tone: "rose" }
})
`,
    "/p/main.mochi": 'import { Badge } from "./ui"\nlet x = Badge\n',
  };
  const read = async (p: string): Promise<string> => {
    const src = files[p];
    if (src === undefined) throw new Error(`no such file ${p}`);
    return src;
  };
  const r = await moduleContext("/p/main.mochi", read, { plugins: exts });
  expect(isErr(r)).toBe(false);
  const sc = unwrapOk(r).imports.get("Badge")!;
  expect(sc).toBeDefined();
  const shown = showScheme(sc);
  expect(shown).toContain("VNode");
  expect(shown).toContain("$tone");
});

test("moduleCompleteAt offers $tone lits for an imported component", async () => {
  const files: Record<string, string> = {
    "/p/ui.mochi": `
export extern tw : a = "@styled-cva/react" "default"
export let Badge = tw.div("base", {
  variants: { $tone: { rose: "a", amber: "b" } },
  defaultVariants: { $tone: "rose" }
})
`,
    "/p/main.mochi": 'import { Badge } from "./ui"\nlet el = <Badge $tone="\n',
  };
  const read = async (p: string): Promise<string> => {
    const src = files[p];
    if (src === undefined) throw new Error(`no such file ${p}`);
    return src;
  };
  const src = files["/p/main.mochi"]!;
  const items = await moduleCompleteAt("/p/main.mochi", src, src.length, read, {
    plugins: exts,
  });
  expect(items.map((i) => i.label).toSorted()).toEqual(["amber", "rose"]);
});

test("JSX core: invalid component prop fails when tag is a component", () => {
  const src = `
export extern tw : a = "@styled-cva/react" "default"
export let Btn = tw.button("x", { variants: { $tone: { a: "1", b: "2" } } })
export let bad = <Btn $tone={1} />
`;
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces, plugins: exts });
  expect(isErr(r)).toBe(true);
});

test("JSX: unknown $tone literal fails against variant union", () => {
  const src = `
export extern tw : a = "@styled-cva/react" "default"
export let Btn = tw.button("x", { variants: { $tone: { rose: "1", amber: "2" } } })
export let bad = <Btn $tone="taupe" />
`;
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces, plugins: exts });
  expect(isErr(r)).toBe(true);
});

test("JSX: known $tone literal ok against variant union", () => {
  const src = `
export extern tw : a = "@styled-cva/react" "default"
export let Btn = tw.button("x", { variants: { $tone: { rose: "1", amber: "2" } } })
export let ok = <Btn $tone="rose" />
`;
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces, plugins: exts });
  expect(isErr(r)).toBe(false);
});
