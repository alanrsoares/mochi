import { expect, test } from "bun:test";
import { reReducedExtension } from "@mochi/plugin-re-reduced";
import { isErr, unwrapOk } from "@onrails/result";
import { toTypedProgram } from "../src/compile";
import { completeAt } from "../src/complete";
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

const HOOKS = `
export extern defineContainer : a = "@re-reduced/preact" "defineContainer"
export extern useContainer : a -> b = "@re-reduced/preact" "useContainer"
export extern useSelect : a -> (b -> c) -> c = "@re-reduced/preact" "useSelect"
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

test("re-reduced infer preserves the config as a structural HM record", () => {
  const r = toTypedProgram(SRC, { open: true, namespaces: preludeNamespaces, plugins });
  expect(isErr(r)).toBe(false);
  const sc = unwrapOk(r).res.env.get("counter")!;
  const shown = showScheme(sc, unwrapOk(r).res.aliases);
  expect(shown).toContain("name");
  expect(shown).toContain("string");
  expect(shown).toContain("state: { count: number }");
  expect(shown).toContain("actions:");
  expect(shown).toContain("increment:");
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

test("re-reduced dts uses inferred shape when config is a binding", () => {
  const src = `
export extern defineContainer : a = "@re-reduced/preact" "defineContainer"
let config = {
  state: { profile: { name: "Ada" }, active: true },
  actions: on => { toggle: on(s => { active: not(s.active) }) }
}
export let profile = defineContainer("profile", config)
`;
  const dts = unwrapOk(emitDts(src, { plugins }));
  expect(dts).toContain(
    'ContainerDef<{ profile: { name: string }; active: boolean }, { toggle: import("@re-reduced/preact").ActionSpec<',
  );
  expect(dts).not.toContain("profile: unknown");
});

test("without extension, defineContainer binding stays unknown in dts", () => {
  const dts = unwrapOk(emitDts(SRC));
  expect(dts).toContain("export declare const counter: unknown;");
});

test("useContainer infers a structural store with actions and $state", () => {
  const src = `${HOOKS}
let demo = () =>
  let store = useContainer(counter) in store
`;
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces, plugins });
  expect(isErr(r)).toBe(false);
  const hit = unwrapOk(r).res.types.find((t) => t.span.start === src.lastIndexOf("store"));
  expect(hit).toBeDefined();
  const shown = showScheme({ vars: [], rvars: [], type: hit!.type }, unwrapOk(r).res.aliases);
  expect(shown).toContain("actions:");
  expect(shown).toContain("increment:");
  expect(shown).toContain("decrement:");
  expect(shown).toContain("$state:");
  expect(shown).toContain("count:");
  expect(shown).toContain("value:");
});

test("store. completes actions and $state", () => {
  const src = `${HOOKS}
let demo = () =>
  let store = useContainer(counter) in store.`.trimEnd();
  const labels = completeAt(src, src.length, { plugins }).map((i) => i.label);
  expect(labels).toContain("actions");
  expect(labels).toContain("$state");
  expect(labels).toContain("$derived");
});

test("store.actions. completes action names", () => {
  const src = `${HOOKS}
let demo = () =>
  let store = useContainer(counter) in store.actions.`.trimEnd();
  const labels = completeAt(src, src.length, { plugins }).map((i) => i.label);
  expect(labels).toEqual(["decrement", "increment"]);
});

test("useSelect types the selector against state signals", () => {
  const src = `${HOOKS}
let demo = () =>
  let store = useContainer(counter) in
  let count = useSelect(store, s => s.count.value) in count
`;
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces, plugins });
  expect(isErr(r)).toBe(false);
  const hit = unwrapOk(r).res.types.find((t) => t.span.start === src.lastIndexOf("count"));
  expect(hit).toBeDefined();
  const shown = showScheme({ vars: [], rvars: [], type: hit!.type }, unwrapOk(r).res.aliases);
  expect(shown).toBe("number");
});
