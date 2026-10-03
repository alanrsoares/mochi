import { expect, test } from "bun:test";
import { completeAt } from "@mochi/dx/complete";
import { schemeOf, typesOf } from "@mochi/test-support";
import { reReducedPlugin } from "./plugin";

const plugins = [reReducedPlugin];

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

/** The whole surface: payloadful actions, `derive`, `effects`, intents. */
const FULL = `
export extern defineContainer : a = "@re-reduced/preact" "defineContainer"
export extern useContainer : a -> b = "@re-reduced/preact" "useContainer"
export extern useSelect : a -> b -> c = "@re-reduced/preact" "useSelect"
export extern useWatch : a -> b -> c -> d = "@re-reduced/preact" "useWatch"
export extern Intent : a = "./runtime" "Intent"
export extern fetchScore : string -> Task number string = "./host" "fetchScore"
export let game = defineContainer(
  "game",
  {
    state: { count: 0, name: "" },
    actions: on =>
      {
        bump: on(s => { count: s.count + 1 }),
        setName: on((s, n) => { name: n })
      },
    derive: s => { doubled: () => s.count.value * 2 },
    effects: fx =>
      [
        fx.onAction("setName", (n, ctx) => [Intent.storageSet("name", n)]),
        fx.onChange(s => s.count.value, (value, prev, ctx) => [])
      ]
  }
)
`;

test("re-reduced infer preserves the config as a structural HM record", () => {
  const shown = schemeOf(SRC, "counter", { plugins });
  expect(shown).toContain("name: string");
  expect(shown).toContain("state: { count: number }");
  expect(shown).toContain("increment: { count: number } -> { count: number }");
});

test("useContainer infers a structural store with actions and $state", () => {
  const src = `${HOOKS}
let demo = () =>
  let store = useContainer(counter) in store
`;
  const at = src.lastIndexOf("store");
  const hit = typesOf(src, { plugins }).find((t) => t.span.start === at);
  expect(hit?.display).toContain(
    "{ actions: { increment: () -> (), decrement: () -> () }, $state: { count: { value: number } }, $derived: {} }",
  );
});

test("each action gets its own reducer type (rank-2 on builder)", () => {
  const shown = schemeOf(FULL, "game", { plugins });
  // A nullary and a payloadful reducer coexist: one `on` instantiation each.
  expect(shown).toContain("bump: { count: number, name: string } -> { count: number }");
  expect(shown).toContain("setName: { count: number, name: string } -> string -> { name: string }");
});

test("store. completes actions and $state", () => {
  const src = `${HOOKS}
let demo = () =>
  let store = useContainer(counter) in store.`.trimEnd();
  const labels = completeAt(src, src.length, { plugins: [reReducedPlugin] }).map((i) => i.label);
  expect(labels).toContain("actions");
  expect(labels).toContain("$state");
  expect(labels).toContain("$derived");
});

test("store.actions. completes action names as methods", () => {
  const src = `${HOOKS}
let demo = () =>
  let store = useContainer(counter) in store.actions.`.trimEnd();
  const items = completeAt(src, src.length, { plugins: [reReducedPlugin] });
  expect(items.map((i) => i.label)).toEqual(["decrement", "increment"]);
  expect(items.every((i) => i.kind === "method")).toBe(true);
});
