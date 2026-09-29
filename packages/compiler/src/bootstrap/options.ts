import type { HostPlugin } from "./types.ts";

/**
 * The knobs the self-hosted core takes: `open` selects open-world inference (a
 * file's own `"use open"` directive still wins), `runtime` inlines prelude
 * helpers, `docs` keeps `///` comments in the emitted text, and `moduleExt` is
 * the suffix rewritten onto relative import paths. Mirrors the non-plugin
 * `CompileOptions` in `../compile/compile.ts`.
 *
 * `strictEntry` is an editor policy rather than a compiler one: dependencies
 * always honour their own `"use open"`, but under it the graph entry takes
 * `open` verbatim, so a typo in a host-global-heavy file is still reported
 * (`../../dx/src/diagnostics.ts` does the same on its TypeScript path).
 *
 * `plugins` is the host's plugin list, with the same meaning as the TypeScript
 * `CompileOptions.plugins` (ADR 0011): omitted = builtins (JSX on), `[]` = hard
 * opt-out, otherwise builtins then the list (ADR 0109).
 */
export type BootstrapOptions = {
  open: boolean;
  runtime: boolean;
  docs: boolean;
  moduleExt: string;
  strictEntry: boolean;
  plugins?: readonly BootstrapPlugin[];
};

export type BootstrapOption<T> = { _tag: "Some"; value: T } | { _tag: "None" };

type SomeOf<O> = O extends { _tag: "Some"; value: infer T } ? T : never;

/**
 * `bootstrap/infer.mochi`'s `HostPlugin`, as the seed reads it. Generated into
 * `host-types.d.ts` by the freeze; every hook type below is derived from it, so
 * a hook signature changed in Mochi is a type error here (ADR 0109).
 */
export type SeedPlugin = HostPlugin;

/** The hook a seed plugin field holds, unwrapped from its `Option`. */
type SeedHook<K extends keyof SeedPlugin> = SomeOf<SeedPlugin[K]>;

/** A seed hook as hosts write it: `null` in place of `None`, `T` for `Some(T)`. */
type Nullable<F> = F extends (...args: infer A) => infer R
  ? (...args: A) => SomeOf<R> | null
  : never;

/** `Ok(None)` falls through to the next hook; `Ok(Some(…))` claims the tokens. */
export type BootstrapParseHook = SeedHook<"parse">;

/** Parses the expression at `pos`, returning it and the next position. */
export type BootstrapParseExpr = Parameters<BootstrapParseHook>[2];

/** Parse-hook failure: parse diagnostics carry no help or suggestions. */
export type BootstrapHookErr = Extract<ReturnType<BootstrapParseHook>, { _tag: "Err" }>["error"];

/** `Ok(None)` falls through; `Ok(Some([ty, st]))` types the call. */
export type BootstrapInferCallHook = SeedHook<"inferCall">;

/** A rewritten node for the printer to lay out, or `null` to leave it alone. */
export type BootstrapFormatHook = Nullable<SeedHook<"format">>;

/**
 * A binding's `.d.ts` type text, or `null` for the inferred one. Takes the
 * binding's name, value, inferred type, and a `TsApi` that renders a type as
 * the core would.
 */
export type BootstrapDtsBindingHook = Nullable<SeedHook<"dtsBinding">>;

/** What a completion item is, for the editor's icon. */
export type CompletionKind = "value" | "member" | "field" | "method" | "literal" | "type" | "ctor";

export type CompletionItem = { label: string; kind: CompletionKind; detail?: string };

/** Context for a `completeMembers` hook: the receiver name and the typed prefix after `.`. */
export type CompleteMemberApi = { receiver: string; prefix: string };

/**
 * Members after `receiver.` when the core has none (opaque host externs like
 * `tw`). `null` falls through; the first non-null answer wins, in list order.
 */
export type CompleteMemberHook = (api: CompleteMemberApi) => CompletionItem[] | null;

/**
 * A host plugin over the self-hosted core (ADR 0109). Every hook is optional;
 * `toSeedPlugins` turns the record into the seed's `Option`-shaped `Plugin`.
 * `bindingType` and `formatDoc` stay builtin-only (the JSX plugin's ADR 0055
 * rendering and tag re-fold, ADR 0112). `completeMembers` is host-only: the
 * editor calls it, and the seed never sees it.
 */
export type BootstrapPlugin = {
  name: string;
  parse?: BootstrapParseHook;
  inferCall?: BootstrapInferCallHook;
  format?: BootstrapFormatHook;
  dtsBinding?: BootstrapDtsBindingHook;
  completeMembers?: CompleteMemberHook;
};

/** The options record as the seed reads it: `plugins` is an `Option`. */
export type SeedOptions = Omit<BootstrapOptions, "plugins"> & {
  plugins: BootstrapOption<readonly SeedPlugin[]>;
};

const none: { _tag: "None" } = { _tag: "None" };
const some = <T>(value: T): BootstrapOption<T> => ({ _tag: "Some", value });
const optionOf = <T>(value: T | undefined): BootstrapOption<T> =>
  value === undefined ? none : some(value);
const nullable =
  <A extends unknown[], R>(hook: (...args: A) => R | null) =>
  (...args: A): BootstrapOption<R> => {
    const out = hook(...args);
    return out === null ? none : some(out);
  };

const toSeedPlugin = (plugin: BootstrapPlugin): SeedPlugin => ({
  name: plugin.name,
  parse: optionOf(plugin.parse),
  inferCall: optionOf(plugin.inferCall),
  format: optionOf(plugin.format && nullable(plugin.format)),
  formatDoc: none,
  dtsBinding: optionOf(plugin.dtsBinding && nullable(plugin.dtsBinding)),
  bindingType: none,
});

/** The seed's `pluginsOpt`: omitted = builtins, `[]` = hard opt-out. */
export const toSeedPlugins = (
  plugins: readonly BootstrapPlugin[] | undefined,
): BootstrapOption<readonly SeedPlugin[]> =>
  plugins === undefined ? none : some(plugins.map(toSeedPlugin));

export const toSeedOptions = ({ plugins, ...rest }: BootstrapOptions): SeedOptions => ({
  ...rest,
  plugins: toSeedPlugins(plugins),
});

/** Strict inference, docstrings retained, `.js` siblings, directive in charge. */
export const defaultBootstrapOptions: BootstrapOptions = {
  open: false,
  runtime: true,
  docs: true,
  moduleExt: ".js",
  strictEntry: false,
};

/** What editor queries use: the entry is judged strictly. */
export const editorBootstrapOptions: BootstrapOptions = {
  ...defaultBootstrapOptions,
  strictEntry: true,
};
