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

/** Parses the expression at `pos`, returning it and the next position. */
export type BootstrapParseExpr = (
  toks: readonly unknown[],
  pos: number,
) => HookResult<[unknown, number], BootstrapHookErr>;

/** `Ok(None)` falls through to the next hook; `Ok(Some(…))` claims the tokens. */
export type BootstrapParseHook = (
  toks: readonly unknown[],
  pos: number,
  parseExpr: BootstrapParseExpr,
) => HookResult<BootstrapOption<[unknown, number]>, BootstrapHookErr>;

/** What an `inferCall` hook may call back into (bootstrap `InferApi`). */
export type BootstrapInferApi = {
  inferExpr: (expr: unknown, st: unknown) => HookResult<[unknown, unknown], unknown>;
  unify: (a: unknown, b: unknown, st: unknown, span: unknown) => HookResult<unknown, unknown>;
};

/** `Ok(None)` falls through; `Ok(Some([ty, st]))` types the call. */
export type BootstrapInferCallHook = (
  fn: unknown,
  args: readonly unknown[],
  origin: BootstrapOption<string>,
  st: unknown,
  api: BootstrapInferApi,
) => HookResult<BootstrapOption<[unknown, unknown]>, unknown>;

/**
 * A plugin in the self-hosted core's shape (`bootstrap/infer.mochi` `Plugin`).
 * AST and type payloads stay `unknown` until the typed AST façade lands.
 */
export type BootstrapPlugin = {
  name: string;
  parse: BootstrapOption<BootstrapParseHook>;
  inferCall: BootstrapOption<BootstrapInferCallHook>;
};

/** The options record as the seed reads it: `plugins` is an `Option`. */
export type SeedOptions = Omit<BootstrapOptions, "plugins"> & {
  plugins: BootstrapOption<readonly BootstrapPlugin[]>;
};

export const toSeedOptions = ({ plugins, ...rest }: BootstrapOptions): SeedOptions => ({
  ...rest,
  plugins: plugins === undefined ? { _tag: "None" } : { _tag: "Some", value: plugins },
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
