import { expect, test } from "bun:test";
import { reReducedExtension } from "@mochi/plugin-re-reduced";
import { isErr, unwrapOk } from "@onrails/result";
import { toTypedProgram } from "../src/compile";
import { emitDts } from "../src/dts";
import { showScheme } from "../src/infer";
import { preludeNamespaces } from "../src/prelude";

const plugins = [reReducedExtension];

const SRC = `
export extern defineContainer : a = "@re-reduced/preact" "defineContainer"
export let counter = defineContainer(
  "docs-counter",
  {
    state: { count: 0 },
    actions: on =>
      {
        increment: on(s => { count: s.count + 1 }),
        decrement: on(s => { count: s.count - 1 })
      }
  }
)
`;

test("re-reduced extension: defineContainer binding has a name field", () => {
  const r = toTypedProgram(SRC, { open: true, namespaces: preludeNamespaces, plugins });
  expect(isErr(r)).toBe(false);
  const sc = unwrapOk(r).res.env.get("counter")!;
  const shown = showScheme(sc, unwrapOk(r).res.aliases);
  expect(shown).toContain("name");
  expect(shown).toContain("string");
});

test("re-reduced dtsBinding emits ContainerDef with state + void actions", () => {
  const dts = unwrapOk(emitDts(SRC, { plugins }));
  expect(dts).toContain("export declare const counter:");
  expect(dts).toContain('import("@re-reduced/preact").ContainerDef');
  expect(dts).toContain("count: number");
  expect(dts).toContain("increment:");
  expect(dts).toContain("decrement:");
  expect(dts).toContain("ActionSpec");
  expect(dts).toContain("& { name: string }");
  expect(dts).not.toMatch(/counter: unknown/);
});

test("without extension, defineContainer binding stays unknown in dts", () => {
  const dts = unwrapOk(emitDts(SRC));
  expect(dts).toContain("export declare const counter: unknown;");
});
