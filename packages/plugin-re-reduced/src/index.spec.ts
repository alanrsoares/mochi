import { expect, test } from "bun:test";
import { toTypedProgram } from "@mochi/compiler/compile";
import { emitDts } from "@mochi/compiler/dts";
import { showScheme } from "@mochi/compiler/infer";
import { preludeNamespaces } from "@mochi/compiler/prelude";
import { completeAt } from "@mochi/dx/complete";
import { isErr, unwrapOk } from "@onrails/result";
import { reReducedExtension } from "./index";

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

test("store.actions. completes action names as methods", () => {
  const src = `${HOOKS}
let demo = () =>
  let store = useContainer(counter) in store.actions.`.trimEnd();
  const items = completeAt(src, src.length, { plugins });
  expect(items.map((i) => i.label)).toEqual(["decrement", "increment"]);
  expect(items.every((i) => i.kind === "method")).toBe(true);
});

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

const typed = (src: string) =>
  toTypedProgram(src, { open: true, namespaces: preludeNamespaces, plugins });

/** The type recorded at the last occurrence of `needle`, rendered. */
const typeOfLast = (src: string, needle: string): string => {
  const r = typed(src);
  expect(isErr(r)).toBe(false);
  const hit = unwrapOk(r).res.types.find((t) => t.span.start === src.lastIndexOf(needle));
  expect(hit).toBeDefined();
  return showScheme({ vars: [], rvars: [], type: hit!.type }, unwrapOk(r).res.aliases);
};

const errorsOf = (src: string): string[] => {
  const r = typed(src);
  return isErr(r) ? r.error.map((d) => d.message) : [];
};

test("the full DSL — payloadful actions, derive, effects — typechecks", () => {
  expect(errorsOf(FULL)).toEqual([]);
});

test("each action gets its own reducer type (rank-2 on builder)", () => {
  const shown = typeOfLast(`${FULL}\nlet g = game`, "game");
  // A nullary and a payloadful reducer coexist: one `on` instantiation each.
  expect(shown).toContain("bump: { count: number, name: string } -> { count: number }");
  expect(shown).toContain("setName: { count: number, name: string } -> string -> { name: string }");
});

test("a payloadful action creator takes its payload", () => {
  const src = `${FULL}
let demo = () =>
  let store = useContainer(game) in store.actions.setName("ada")
`;
  expect(errorsOf(src)).toEqual([]);
});

test("a payloadful creator rejects the wrong payload", () => {
  const src = `${FULL}
let demo = () =>
  let store = useContainer(game) in store.actions.setName(1)
`;
  expect(errorsOf(src).join("\n")).toContain("string");
});

test("derived signals are readable through a two-parameter selector", () => {
  const src = `${FULL}
let demo = () =>
  let store = useContainer(game) in
  let doubled = useSelect(store, (s, d) => d.doubled.value) in doubled
`;
  expect(typeOfLast(src, "doubled")).toBe("number");
});

test("useWatch types the selector and returns unit", () => {
  const src = `${FULL}
let demo = () =>
  let store = useContainer(game) in
  let watched = useWatch(store, s => s.count.value, n => n + 1) in watched
`;
  expect(typeOfLast(src, "watched")).toBe("()");
});

test("onAction resolves the payload from the action name", () => {
  const bad = FULL.replace(
    'fx.onAction("setName", (n, ctx) => [Intent.storageSet("name", n)])',
    'fx.onAction("setName", (n, ctx) => [Intent.storageSet("name", n + 1)])',
  );
  // `n` is the literal action's string payload, so `n + 1` cannot typecheck.
  expect(errorsOf(bad).join("\n")).toContain("cannot unify number");
});

test("Intent.query takes a mochi Task and routes both arms", () => {
  const src = `${FULL}
let ok = Intent.query({
  key: ["score"],
  task: fetchScore("ada"),
  onOk: n => n + 1,
  onErr: e => e
})
`;
  expect(errorsOf(src)).toEqual([]);
});

test("Intent.query rejects an onOk that disagrees with the task", () => {
  const src = `${FULL}
let bad = Intent.query({
  key: ["score"],
  task: fetchScore("ada"),
  onOk: n => concat(n, "!"),
  onErr: e => e
})
`;
  expect(errorsOf(src).join("\n")).toContain("number");
});

test("dts emits the real derived row and the builtin intent union", () => {
  const dts = unwrapOk(emitDts(FULL, { plugins }));
  expect(dts).toContain("ActionSpec<{ count: number; name: string }, void>");
  expect(dts).toContain("ActionSpec<{ count: number; name: string }, string>");
  expect(dts).toContain("doubled:");
  expect(dts).toContain('import("@re-reduced/preact").BuiltinIntent');
});

test("dts leaves I as never when the container declares no effects", () => {
  const dts = unwrapOk(emitDts(SRC, { plugins }));
  expect(dts).toContain("never> & { name: string }");
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
