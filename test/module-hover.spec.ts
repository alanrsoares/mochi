// Module-aware hover: a file that imports a variant must still typecheck (so
// hover works at all) and report types that mention the imported type. Without
// the dep registry the file fails `check` and hover is null everywhere.
import { expect, test } from "bun:test";
import { hoverAt, moduleHoverAt } from "@mochi/dx/hover";
import { styledCvaExtension } from "@mochi/plugin-styled-cva";
import { memRead } from "@mochi/test-support";

const DEP = "/proj/ast.mochi";
const ENTRY = "/proj/main.mochi";
const DEP_SRC = "export type E =\n  | A(int)\n  | B\n";

test("hover works inside a file that matches on an imported variant", async () => {
  //          0         1         2         3
  //          0123456789012345678901234567890123456789
  const src = 'import { A, B } from "./ast.mochi"\nlet f = e => switch e { | A(n) => n | B => 0 }';
  const nOff = src.indexOf("A(n)") + 2; // the binding `n` inside A(n)
  const info = await moduleHoverAt(ENTRY, src, nOff, memRead({ [DEP]: DEP_SRC }));
  expect(info?.code).toBe("(parameter) n: number");

  // Guard rail: single-file hover is null everywhere here — the file doesn't
  // typecheck because `A`/`B` are unknown without the dep registry.
  expect(hoverAt(src, nOff)).toBeNull();
});

test("hover on the scrutinee reports the imported variant type", async () => {
  const src = 'import { A, B } from "./ast.mochi"\nlet f = e => switch e { | A(n) => n | B => 0 }';
  const eOff = src.indexOf("switch e") + 7; // the `e` after `switch`
  const info = await moduleHoverAt(ENTRY, src, eOff, memRead({ [DEP]: DEP_SRC }));
  expect(info?.code).toContain("E");
});

test("degrades to single-file hover when the dep graph can't be resolved", async () => {
  const src = "let f = (x) => add(x, 1)";
  const info = await moduleHoverAt(ENTRY, src, 16, memRead({})); // on `add`, no imports
  expect(info?.code).toBe("number -> number -> number");
});

// Slice 19: hover must use the same `plugins` Vite / `gen-mochi-dts` pass, so
// a `tw.*` factory binding hovers as a real component scheme instead of
// lying about `unknown`/`'t0`.
const TW_SRC = `
export extern tw : a = "@styled-cva/react" "default"
export let Badge = tw.div("base", {
  variants: { $tone: { rose: "a", amber: "b" } },
  defaultVariants: { $tone: "rose" }
})
export let x = Badge
`;
const badgeUseOffset = TW_SRC.lastIndexOf("Badge");

test("with plugins, hovering a tw.* factory binding shows a component scheme, not unknown/'t0", async () => {
  const info = await moduleHoverAt(ENTRY, TW_SRC, badgeUseOffset, memRead({}), {
    plugins: [styledCvaExtension],
  });
  expect(info?.code).toContain("VNode");
  expect(info?.code).not.toMatch(/'t\d/);
});

test("without plugins, tw.* factory hover is unchanged (today's unknown/type-var behavior)", async () => {
  const info = await moduleHoverAt(ENTRY, TW_SRC, badgeUseOffset, memRead({}));
  expect(info?.code).not.toContain("VNode");
});

test("JSX $tone attr name hovers as expected literal union", async () => {
  const src = `
export extern tw : a = "@styled-cva/react" "default"
export let Badge = tw.div("base", {
  variants: { $tone: { rose: "a", amber: "b" } },
  defaultVariants: { $tone: "rose" }
})
export let el = <Badge $tone="rose" />
`;
  const off = src.lastIndexOf("$tone");
  const info = await moduleHoverAt(ENTRY, src, off + 1, memRead({}), {
    plugins: [styledCvaExtension],
  });
  expect(info?.code).toContain("(property) $tone:");
  expect(info?.code).toContain('"rose"');
  expect(info?.code).toContain('"amber"');
  expect(info?.code).not.toMatch(/\$tone: string/);
});

// C5c — fold-back: a variant crosses a module edge nominally (ADR 0046), so its
// bare name names nothing in the importer. Where an `import * as D` puts those
// types in scope, hover reports the writable `D.T`.
test("hover qualifies an imported type through its namespace alias", async () => {
  const src =
    'import * as D from "./ast.mochi"\nimport { A, B } from "./ast.mochi"\nlet f = e => switch e { | A(n) => n | B => 0 }';
  const eOff = src.indexOf("switch e") + 7;
  const info = await moduleHoverAt(ENTRY, src, eOff, memRead({ [DEP]: DEP_SRC }));
  expect(info?.code).toContain("D.E");
});

test("a locally declared type shadows the qualified name", async () => {
  const src =
    'import * as D from "./ast.mochi"\ntype E =\n  | Local\nlet f = e => switch e { | Local => 0 }';
  const eOff = src.indexOf("switch e") + 7;
  const info = await moduleHoverAt(ENTRY, src, eOff, memRead({ [DEP]: DEP_SRC }));
  expect(info?.code).toContain("E");
  expect(info?.code).not.toContain("D.E");
});
