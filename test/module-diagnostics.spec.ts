// Module-aware LSP diagnostics: a file that matches on an imported variant must
// NOT report "unknown constructor" (the bug), and cross-module exhaustiveness
// must be real. The dep is served from an in-memory map, so no disk is touched.
import { expect, test } from "bun:test";
import { diagnostics, moduleDiagnostics } from "@mochi/dx/diagnostics";
import { styledCvaExtension } from "@mochi/plugin-styled-cva";
import { memRead } from "@mochi/test-support";

const DEP = "/proj/ast.mochi";
const ENTRY = "/proj/main.mochi";
const DEP_SRC = "export type E =\n  | A(int)\n  | B\n";

test("a switch on an imported variant is not a false 'unknown constructor'", async () => {
  const entrySrc =
    'import { A, B } from "./ast.mochi"\nlet f = e => switch e { | A(n) => n | B => 0 }';
  const diags = await moduleDiagnostics(ENTRY, entrySrc, memRead({ [DEP]: DEP_SRC }));
  expect(diags).toEqual([]);

  // Guard rail: single-file checking still (wrongly) flags it — that's the very
  // false positive the module-aware path exists to remove.
  const single = diagnostics(entrySrc);
  expect(single).toHaveLength(1);
  expect(single[0]!.message).toContain("unknown constructor 'A'");
});

test("cross-module exhaustiveness is real: a missing imported ctor is flagged", async () => {
  const entrySrc = 'import { A, B } from "./ast.mochi"\nlet f = e => switch e { | A(n) => n }';
  const diags = await moduleDiagnostics(ENTRY, entrySrc, memRead({ [DEP]: DEP_SRC }));
  expect(diags).toHaveLength(1);
  expect(diags[0]!.message).toContain("non-exhaustive");
  expect(diags[0]!.message).toContain("B");
});

test("the entry's own type error is still reported (with imports resolved)", async () => {
  const entrySrc = 'import { A } from "./ast.mochi"\nlet bad = add(1, { x: 2 })';
  const diags = await moduleDiagnostics(ENTRY, entrySrc, memRead({ [DEP]: DEP_SRC }));
  expect(diags).toHaveLength(1);
  expect(diags[0]!.message).toStartWith("type:");
});

test("the entry's own parse error is reported without touching deps", async () => {
  const entrySrc = 'import { A } from "./ast.mochi"\nlet x = ';
  const diags = await moduleDiagnostics(ENTRY, entrySrc, memRead({})); // dep never read
  expect(diags).toHaveLength(1);
  expect(diags[0]!.message).toStartWith("parse:");
});

test("a broken/missing dep degrades to single-file diagnostics, not a dep error", async () => {
  // Dep can't be read; the entry itself is clean single-file (no ctor match).
  const entrySrc = "let n = add(1, 2)";
  const diags = await moduleDiagnostics(ENTRY, entrySrc, memRead({}));
  expect(diags).toEqual([]);
});

test("a file with no imports behaves like single-file diagnostics", async () => {
  const diags = await moduleDiagnostics(ENTRY, "let bad = add(1, { x: 2 })", memRead({}));
  expect(diags).toHaveLength(1);
  expect(diags[0]!.message).toStartWith("type:");
});

// Slice 19: diagnostics run with the project's `plugins` (styled-cva, …), so
// JSX-attr checking against a `tw.*` component's real prop type applies in
// the editor the same way it does for Vite/`gen-mochi-dts` (#14/#15/#17).
const TW_JSX_SRC = `
export extern tw : a = "@styled-cva/react" "default"
export let Btn = tw.button("x", { variants: { $tone: { a: "1", b: "2" } } })
export let bad = <Btn $tone={1} />
`;

test("with plugins, an invalid prop on a tw.* component is a real diagnostic", async () => {
  const diags = await moduleDiagnostics(ENTRY, TW_JSX_SRC, memRead({}), {
    plugins: [styledCvaExtension],
  });
  expect(diags.length).toBeGreaterThan(0);
});

test("without plugins, the same tw.* JSX usage is today's blind spot (no diagnostic)", async () => {
  const diags = await moduleDiagnostics(ENTRY, TW_JSX_SRC, memRead({}));
  expect(diags).toEqual([]);
});

// Tracer #51: bare package import must resolve via Node exports so LSP can
// load `@mochi/plugin-preact/hooks` and run `preactExtension.inferCall`.
test("package import of plugin-preact hooks + plugin surfaces useState misuse", async () => {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const { preactExtension } = await import("@mochi/plugin-preact");
  // Real monorepo path so createRequire walks to workspace node_modules.
  const entry = resolve(import.meta.dir, "../apps/docs/src/components/HeroCarousel.mochi");
  const src = `
import { useState } from "@mochi/plugin-preact/hooks"
let bad = _ =>
  let (n, setN) = useState(0) in
  let _ = setN("oops") in n
`;
  const diags = await moduleDiagnostics(entry, src, (p) => readFile(p, "utf8"), {
    plugins: [preactExtension],
  });
  expect(diags.some((d) => d.message.startsWith("type:"))).toBe(true);
});

test("same package import without preactExtension leaves useRef unpinned", async () => {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const { preactExtension } = await import("@mochi/plugin-preact");
  const entry = resolve(import.meta.dir, "../apps/docs/src/components/HeroCarousel.mochi");
  const src = `
import { useRef } from "@mochi/plugin-preact/hooks"
let bad = _ =>
  let r = useRef(0) in
  eq(r.current, "x")
`;
  const withPlugin = await moduleDiagnostics(entry, src, (p) => readFile(p, "utf8"), {
    plugins: [preactExtension],
  });
  const without = await moduleDiagnostics(entry, src, (p) => readFile(p, "utf8"), {
    plugins: [],
  });
  expect(withPlugin.some((d) => d.message.startsWith("type:"))).toBe(true);
  expect(without.every((d) => !d.message.startsWith("type:"))).toBe(true);
});
test("resolveImport maps @mochi/plugin-preact/hooks via package exports", async () => {
  const { resolve } = await import("node:path");
  const { resolveImport } = await import("@mochi/compiler/module");
  const importer = resolve(import.meta.dir, "../apps/docs/src/components/HeroCarousel.mochi");
  const hit = resolveImport(importer, "@mochi/plugin-preact/hooks");
  expect(hit.endsWith("packages/plugin-preact/hooks.mochi")).toBe(true);
});

test("strict diagnostics flag unbound typos (open-world emit would swallow them)", async () => {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const { snakeVendorPlugins } = await import("../examples/snake/mochi.plugins");
  const entry = resolve(import.meta.dir, "../examples/snake/src/components/CanvasBoard.mochi");
  const good = await readFile(entry, "utf8");
  const broken = good
    .replace("let canvasRef = useRef", "let canvasRefasdasd = useRef")
    .replace("let particles = useRef", "let particles = useRefssss");
  const diags = await moduleDiagnostics(entry, broken, (p) => readFile(p, "utf8"), {
    plugins: snakeVendorPlugins,
  });
  expect(diags.some((d) => d.message.includes("unbound variable"))).toBe(true);
  expect(
    diags.some((d) => d.message.includes("useRefssss") || d.message.includes("canvasRef")),
  ).toBe(true);
});

/**
 * The snake example is the only in-repo consumer of the whole re-reduced
 * surface — payloadful actions, `derive`, `effects` with all three reaction
 * kinds, and `Intent.query`/`storageSet` (ADR 0051). Compiling it here fails
 * loudly on a plugin regression instead of waiting for a `vite build`.
 */
test("the snake container compiles clean across the whole re-reduced surface", async () => {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const { snakeVendorPlugins } = await import("../examples/snake/mochi.plugins");
  const entry = resolve(import.meta.dir, "../examples/snake/src/App.mochi");
  const src = await readFile(entry, "utf8");
  const diags = await moduleDiagnostics(entry, src, (p) => readFile(p, "utf8"), {
    plugins: snakeVendorPlugins,
  });
  expect(diags.map((d) => d.message)).toEqual([]);
});

/**
 * The point of lifting the keyboard binding table out of `game.host.ts`: the
 * inner `switch` is on `Key`, not on a raw DOM string, so it has no catch-all
 * and a new/unhandled constructor is a compile error. Deleting an arm must be
 * caught — if this ever passes, the dispatch has silently regrown a `| _`.
 */
test("dropping a Key arm in the snake dispatch is a non-exhaustive error", async () => {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const { snakeVendorPlugins } = await import("../examples/snake/mochi.plugins");
  const entry = resolve(import.meta.dir, "../examples/snake/src/App.mochi");
  const good = await readFile(entry, "utf8");
  const broken = good.replace(/\n\s*\| MoveLeft => store\.actions\.left\(\)/, "");
  expect(broken).not.toBe(good); // the arm we key on still exists
  const diags = await moduleDiagnostics(entry, broken, (p) => readFile(p, "utf8"), {
    plugins: snakeVendorPlugins,
  });
  const msgs = diags.map((d) => d.message).join("\n");
  expect(msgs).toContain("non-exhaustive");
  expect(msgs).toContain("MoveLeft");
});
