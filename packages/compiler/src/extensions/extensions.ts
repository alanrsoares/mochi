/**
 * Cross-pass plugin seam (ADR 0011; deepens the ADR 0010 host-extension hooks).
 *
 * Core language (HM + rows + variants + `Expr.call`) stays free of
 * kit-specific or JSX-specific knowledge. Plugins — builtin (`jsxPlugin`,
 * #27) or vendor (`@mochi/plugin-styled-cva`, …) — register small hooks so
 * parse/infer/format/dts can specialize without forking the pipeline.
 *
 * `LanguagePlugin` is the primary type; `HostExtension` is a back-compat
 * subset alias (ADR 0011 decision 1) so `packages/plugin-styled-cva` and any
 * project's existing plugin list keep compiling unchanged.
 */

import type { Result } from "@onrails/result";
import type { Expr } from "../ast/ast";
import type { Span } from "../ast/span";
import type { AliasDef, Row, Type } from "../ast/types";
import type { Doc } from "../doc/doc";
import type { Diagnostic } from "../errors/errors";
import type { Scheme } from "../infer/schemes";
import type { Located, Tok } from "../lexer/lexer";
import { jsxPlugin } from "./plugins/jsx";

type CallExpr = Extract<Expr, { kind: "call" }>;

/**
 * Capabilities a `parse` hook may use: the token cursor, the expression parser,
 * span closing, and error signalling — the closure state `parser.ts` otherwise
 * keeps private, exposed as a narrow surface (as `InferCallApi` / `FormatApi`
 * do for their passes).
 *
 * Deliberately absent: the `ParseAbort` marker. `fail` raises it *inside* the
 * parser, so the only `throw` in the compiler stays parser-owned and the public
 * `parse` boundary remains the single place that turns it into a `Diagnostic`
 * (AGENTS.md, ADR 0004). A hook signals errors; it never throws.
 */
export type ParserApi = {
  /** Token `offset` ahead of the cursor (default 0), clamped to the terminal `eof` — so lookahead is total. */
  peek: (offset?: number) => Located;
  /** Consume and return the token under the cursor. */
  next: () => Located;
  /** Consume the token under the cursor, failing unless it is a `t`; the result is narrowed to `t`. */
  expect: <T extends Tok["t"]>(t: T) => Extract<Located, { t: T }>;
  expectId: () => { name: string; span: Span };
  /** A record/attribute label: `tone` or `$tone` (ADR 0009 transient props). */
  expectLabel: () => { name: string; span: Span };
  /** Parse a full sub-expression at unconstrained precedence — `{expr}` holes. */
  parseExpr: () => Expr;
  /** Span from `start` through the most recently consumed token. */
  spanFrom: (start: Span) => Span;
  /** Abort with a `parse` Diagnostic; `span` defaults to the token under the cursor. */
  fail: (message: string, span?: Span) => never;
};

/**
 * Parse a plugin-owned prefix form (JSX's `<…>`) at atom position. Consulted
 * after core's own prefix tokens, so core syntax can never be shadowed: peek
 * first and return `null` — having consumed nothing — to fall through to the
 * next hook, then to core's `unexpected token` error. First non-null wins
 * (registration order).
 */
export type ParseHook = (api: ParserApi) => Expr | null;

/** Hover identity for a record/JSX attribute label. */
export type PropertySymbol = { kind: "property"; name: string };

/** Capabilities a call-hook may use — mirrors the private infer Ctx without exporting it. */
export type InferCallApi = {
  infer: (e: Expr) => Result<Type, Diagnostic>;
  unify: (a: Type, b: Type, span?: Span) => Result<Type, Diagnostic>;
  freshVar: () => Type;
  freshRowVar: () => Row;
  zonk: (t: Type) => Type;
  /**
   * Record a type at a span for hover (e.g. expected JSX prop on the attr name).
   * No-op when inference is not collecting a TypeAt table.
   */
  noteType: (span: Span, t: Type, symbol?: PropertySymbol) => void;
};

/**
 * Handle a call expression, or return `null` to fall through to the next hook /
 * core default. First non-null wins (registration order).
 */
export type InferCallHook = (e: CallExpr, api: InferCallApi) => Result<Type, Diagnostic> | null;

/**
 * Capabilities a `format` hook may use — the formatter's recursive printers,
 * without exposing its module-level comment tables. The `Doc` combinators
 * themselves (`txt`, `cat`, `indent`, `softline`, …) are plain functions in
 * `doc.ts`, so a hook imports those directly rather than receiving them here.
 */
export type FormatApi = {
  /** Print a sub-expression (comments attached, plugin hooks re-entered). */
  exprD: (e: Expr) => Doc;
  /** Print an expression in member/callee position, parenthesized when dropping parens would reparse differently. */
  memberD: (e: Expr) => Doc;
  /** Render a document on a single line (every group flat). */
  flat: (d: Doc) => string;
  /** A mochi string literal, escaped so it re-lexes to the same value. */
  strLit: (s: string) => string;
};

/**
 * Re-fold a desugared expression back to this plugin's surface syntax (JSX's
 * `h(tag, props, children)` → `<tag …>`), or `null` to fall through to the next
 * hook / the core printer. Returns a `Doc`, not a string: the formatter is a
 * Wadler-style pretty-printer, so a raw string would be an opaque atom that
 * cannot break or indent inside the enclosing group (ADR 0011 reconciliation).
 * Hooks see the AST only — `format` never typechecks.
 */
export type FormatHook = (e: Expr, api: FormatApi) => Doc | null;

/**
 * Capabilities a `bindingType` hook may use: the binding's scheme type with
 * structural rows already folded to alias names, plus the HM → TS renderer
 * (`dts.ts`'s, with no generic letters in scope — free vars render `unknown`).
 */
export type BindingTypeApi = {
  folded: Type;
  tsType: (t: Type) => string;
};

/** Inferred-type tools available to a `.d.ts`-only binding hook. */
export type DtsBindingApi = BindingTypeApi;

/**
 * Override the TS type of a binding *wherever* it is declared — the `.d.ts`
 * writer and the TS backend (`codegen-ts.ts`) share one `bindingTsType`, so a
 * hook here reaches both and the two cannot drift. `null` falls through to the
 * next hook / the core rendering. Used by `jsxPlugin` for component bindings
 * (`(props: P) => any`).
 */
export type BindingTypeHook = (value: Expr, api: BindingTypeApi) => string | null;

/**
 * Override a binding's `.d.ts` type string, or return `null` for the default
 * `bindingTsType` path. `.d.ts`-only (unlike `bindingType`): used by styled-cva
 * to emit `$tone` literal unions from factory AST without modeling VariantProps
 * in HM. `api` exposes the folded inferred type and the core TS renderer so a
 * thin adapter can wrap HM structure in a heavy outbound host generic without
 * re-deriving ordinary field types from AST.
 */
export type DtsBindingHook = (
  name: string,
  sc: Scheme,
  value: Expr,
  aliases: AliasDef[],
  fallback: () => string,
  api: DtsBindingApi,
) => string | null;

/** Completion item kinds — shared by the compiler API and plugin member hooks (ADR 0013). */
export type CompletionKind = "value" | "field" | "member" | "method" | "ctor" | "type" | "literal";

/** One completion candidate — protocol-free so Bun unit tests can assert on it. */
export type CompletionItem = { label: string; kind: CompletionKind; detail?: string };

/** Context for a `completeMembers` hook — receiver name + typed prefix after `.`. */
export type CompleteMemberApi = { receiver: string; prefix: string };

/**
 * Suggest members after `receiver.` when core has none (opaque host externs like
 * `tw`). `null` falls through; first non-null wins (registration order).
 */
export type CompleteMemberHook = (api: CompleteMemberApi) => CompletionItem[] | null;

/**
 * A cross-pass adapter: builtin (`jsxPlugin`) or vendor (styled-cva, …).
 * Hooks are listed in pipeline order — `parse` runs first, and a plugin that
 * owns surface syntax is the *only* thing that can parse it: with `plugins: []`
 * that syntax is a plain parse error (ADR 0011 decision 3).
 */
export type LanguagePlugin = {
  name: string;
  parse?: ParseHook;
  /**
   * Extra token tags the parser may resynchronise on after an error (ADR 0045).
   * A plugin that owns a *top-level* form registers its leading keyword here so
   * panic-mode recovery can resume at it; core's sync set stays the language's own
   * declaration keywords. `jsxPlugin` contributes none — JSX is expression-level,
   * which is exactly why core must not name it.
   */
  syncTokens?: readonly Tok["t"][];
  inferCall?: InferCallHook;
  format?: FormatHook;
  bindingType?: BindingTypeHook;
  dtsBinding?: DtsBindingHook;
  completeMembers?: CompleteMemberHook;
};

/**
 * Back-compat alias: the host-interop + completion subset of `LanguagePlugin`.
 * Existing vendor plugins (`@mochi/plugin-styled-cva`) satisfy `LanguagePlugin`
 * unchanged — they just don't populate the hooks the builtin JSX plugin uses.
 */
export type HostExtension = Pick<
  LanguagePlugin,
  "name" | "inferCall" | "dtsBinding" | "completeMembers"
>;

/**
 * Builtin plugins registered by default on every standard compile path (CLI,
 * `compile()`, module graph, Vite, LSP) — JSX works with no configuration, and
 * an empty `plugins` list is the hard opt-out (ADR 0011 decision 3).
 */
export const DEFAULT_PLUGINS: LanguagePlugin[] = [jsxPlugin];

/**
 * Single source of truth for the `plugins` option's opt-in/opt-out semantics
 * (ADR 0011 decision 3), used by every entry point that resolves a caller's
 * list into the plugins a pass actually runs:
 *
 * - `plugins` omitted (`undefined`) → the default/builtin list.
 * - `plugins: []` → the hard opt-out: no plugins at all (not even builtins).
 * - `plugins: [a, b, …]` → builtins **prepended**, then the caller's list —
 *   so a project that registers only a vendor plugin (styled-cva) doesn't
 *   silently lose a builtin (JSX) it never asked to drop. `builtins` defaults
 *   to `DEFAULT_PLUGINS`; tests pass an explicit list to exercise the three
 *   cases independently of which builtins ship.
 * - Name shadowing (ADR 0049): a caller plugin whose `name` matches a builtin
 *   **replaces** it in place — same slot in the run order, so a project can
 *   swap `jsxPlugin` for its own `"jsx"`. A hook-less stub (`{ name: "jsx" }`)
 *   disables that builtin while keeping every other plugin. `name` is plugin
 *   identity: naming a vendor plugin after a builtin is always a shadow.
 */
export const resolvePlugins = (
  plugins: LanguagePlugin[] | undefined,
  builtins: LanguagePlugin[] = DEFAULT_PLUGINS,
): LanguagePlugin[] => {
  if (plugins === undefined) return builtins;
  if (plugins.length === 0) return [];
  const resolved = builtins.map((b) => plugins.find((p) => p.name === b.name) ?? b);
  const shadowed = new Set(resolved.map((p) => p.name));
  return [...resolved, ...plugins.filter((p) => !shadowed.has(p.name))];
};

/**
 * Run parse hooks in order at atom position; the first that returns an `Expr`
 * has consumed the form. `null` from all → the caller (core `parseAtom`) reports
 * the leading token as unexpected, which is what makes an empty plugin list a
 * real syntax opt-out rather than a silent one.
 */
export const runParseHooks = (hooks: ParseHook[], api: ParserApi): Expr | null => {
  for (const hook of hooks) {
    const e = hook(api);
    if (e !== null) return e;
  }
  return null;
};

/** Run infer-call hooks in order; `null` from all → caller uses core default. */
export const runInferCallHooks = (
  hooks: InferCallHook[],
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  for (const hook of hooks) {
    const r = hook(e, api);
    if (r !== null) return r;
  }
  return null;
};

/**
 * The `bindingType` hooks of a resolved plugin list. Both `bindingTsType`
 * callers (`.d.ts` writer, TS backend) collect them this way, so neither can
 * drift into a differently-hooked view of the same binding.
 */
export const bindingTypeHooks = (plugins: LanguagePlugin[]): BindingTypeHook[] =>
  plugins.flatMap((p) => (p.bindingType ? [p.bindingType] : []));

/** Run format hooks in order; `null` from all → caller uses the core printer. */
export const runFormatHooks = (hooks: FormatHook[], e: Expr, api: FormatApi): Doc | null => {
  for (const hook of hooks) {
    const d = hook(e, api);
    if (d !== null) return d;
  }
  return null;
};

/** First binding-type hook that returns a string wins; `null` from all → core rendering. */
export const runBindingTypeHooks = (
  hooks: BindingTypeHook[],
  value: Expr,
  api: BindingTypeApi,
): string | null => {
  for (const hook of hooks) {
    const r = hook(value, api);
    if (r !== null) return r;
  }
  return null;
};

/** First dts binding hook that returns a string wins. */
export const runDtsBindingHooks = (
  hooks: DtsBindingHook[],
  name: string,
  sc: Scheme,
  value: Expr,
  aliases: AliasDef[],
  fallback: () => string,
  api: DtsBindingApi,
): string => {
  for (const hook of hooks) {
    const r = hook(name, sc, value, aliases, fallback, api);
    if (r !== null) return r;
  }
  return fallback();
};

/** First complete-members hook that returns a list wins; `null` from all → none. */
export const runCompleteMemberHooks = (
  hooks: CompleteMemberHook[],
  api: CompleteMemberApi,
): CompletionItem[] | null => {
  for (const hook of hooks) {
    const r = hook(api);
    if (r !== null) return r;
  }
  return null;
};
