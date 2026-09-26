import type { Expr, IErr, InferApi, LocTok, St, Tok, Ty } from "./types.ts";

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

type HookResult<T, E> = { _tag: "Ok"; value: T } | { _tag: "Err"; error: E };

/** Parse-hook failure: parse diagnostics carry no help or suggestions. */
export type BootstrapHookErr = { message: string; start: number; end: number };

type Token = LocTok<Tok>;

/** Parses the expression at `pos`, returning it and the next position. */
export type BootstrapParseExpr = (
  toks: readonly Token[],
  pos: number,
) => HookResult<[Expr, number], BootstrapHookErr>;

/** `Ok(None)` falls through to the next hook; `Ok(Some(…))` claims the tokens. */
export type BootstrapParseHook = (
  toks: readonly Token[],
  pos: number,
  parseExpr: BootstrapParseExpr,
) => HookResult<BootstrapOption<[Expr, number]>, BootstrapHookErr>;

/** `Ok(None)` falls through; `Ok(Some([ty, st]))` types the call. */
export type BootstrapInferCallHook = (
  fn: Expr,
  args: readonly Expr[],
  origin: BootstrapOption<string>,
  st: St,
  api: InferApi,
) => HookResult<BootstrapOption<[Ty, St]>, IErr>;

/** A rewritten node for the printer to lay out, or `null` to leave it alone. */
export type BootstrapFormatHook = (expr: Expr) => Expr | null;

/** A binding's `.d.ts` type text, or `null` for the inferred one. */
export type BootstrapDtsBindingHook = (name: string, value: Expr) => string | null;

/**
 * A host plugin over the self-hosted core (ADR 0109). Every hook is optional;
 * `toSeedPlugins` turns the record into the seed's `Option`-shaped `Plugin`.
 */
export type BootstrapPlugin = {
  name: string;
  parse?: BootstrapParseHook;
  inferCall?: BootstrapInferCallHook;
  format?: BootstrapFormatHook;
  dtsBinding?: BootstrapDtsBindingHook;
};

/** `bootstrap/infer.mochi`'s `Plugin`, as the seed reads it. */
export type SeedPlugin = {
  name: string;
  parse: BootstrapOption<BootstrapParseHook>;
  inferCall: BootstrapOption<BootstrapInferCallHook>;
  format: BootstrapOption<(expr: Expr) => BootstrapOption<Expr>>;
  dtsBinding: BootstrapOption<(name: string, value: Expr) => BootstrapOption<string>>;
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
  dtsBinding: optionOf(plugin.dtsBinding && nullable(plugin.dtsBinding)),
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
