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
import { checkErr, type Diagnostic } from "../errors/errors";
import type { Scheme } from "../infer/schemes";
import type { Located, Tok } from "../lexer/lexer";
import type { CallExpr } from "./plugin-kit";
import { jsxPlugin } from "./plugins/jsx";

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

/**
 * A plugin's parse registration: the claim plus the hook. `tokens` are the
 * leading token tags this plugin's atom syntax starts with (`["lt"]` for
 * JSX's `<…>`) — a declarative ownership claim, checked by `pluginClashes`.
 * Dispatch is unchanged for now (hooks still chain in registration order and
 * self-guard by peeking); token-table dispatch is a follow-up slice.
 *
 * Distinct from `LanguagePlugin.syncTokens`: `tokens` says "my expression
 * atom *starts* here", `syncTokens` says "error recovery may *resume* at my
 * top-level keyword" — different semantics, deliberately separate fields.
 */
export type ParseDecl = {
  tokens: readonly Tok["t"][];
  hook: ParseHook;
};

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
 * A plugin's infer-call registration: declarative claims plus the hook.
 * `refs` are the callee `ref` names this plugin handles (`useState`,
 * `defineContainer`, …); `memberTargets` are `field`-callee target ref names
 * (`tw` for `tw.div(...)`). Claims exist for `pluginClashes` (and future
 * table dispatch) — the hook still chains and self-guards, and a hook whose
 * match is structural rather than name-keyed (jsx's `origin: "jsx"`
 * provenance) declares no claims at all.
 */
export type InferCallDecl = {
  refs?: readonly string[];
  memberTargets?: readonly string[];
  hook: InferCallHook;
};

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
  parse?: ParseDecl;
  /**
   * Extra token tags the parser may resynchronise on after an error (ADR 0045).
   * A plugin that owns a *top-level* form registers its leading keyword here so
   * panic-mode recovery can resume at it; core's sync set stays the language's own
   * declaration keywords. `jsxPlugin` contributes none — JSX is expression-level,
   * which is exactly why core must not name it.
   */
  syncTokens?: readonly Tok["t"][];
  inferCall?: InferCallDecl;
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

/** Zero-width span for configuration-level diagnostics that have no source site. */
const NO_SPAN: Span = { start: 0, end: 0 };

/**
 * Detect claim clashes in a **resolved** plugin list — run this on the output
 * of `resolvePlugins`, never its input: ADR 0049 name shadowing (a caller
 * plugin replacing a same-named builtin) resolves there first and is legal
 * replacement, not a clash. What remains after resolution must be disjoint:
 *
 * - duplicate plugin `name` (two entries with the same name in one list),
 * - duplicate `parse.tokens` claim (two plugins owning one leading token),
 * - duplicate `inferCall.refs` claim (two plugins owning one callee name),
 * - duplicate `inferCall.memberTargets` claim (two plugins owning one
 *   `field`-callee target like `tw`).
 *
 * Pure — returns `check` diagnostics (zero-width span: the clash is a
 * configuration fact, not a source location); callers decide whether they are
 * fatal. Chained dispatch means a clash is first-wins today, but a silent
 * winner is exactly the misconfiguration this makes visible.
 */
export const pluginClashes = (plugins: LanguagePlugin[]): Diagnostic[] => {
  const diags: Diagnostic[] = [];
  const claim = (owners: Map<string, string>, what: string, key: string, owner: string): void => {
    const prev = owners.get(key);
    if (prev === undefined) {
      owners.set(key, owner);
      return;
    }
    diags.push(
      checkErr(`plugin clash: '${prev}' and '${owner}' both claim ${what} '${key}'`, NO_SPAN),
    );
  };
  const names = new Map<string, string>();
  const tokens = new Map<string, string>();
  const refs = new Map<string, string>();
  const memberTargets = new Map<string, string>();
  for (const p of plugins) {
    claim(names, "plugin name", p.name, p.name);
    for (const t of p.parse?.tokens ?? []) claim(tokens, "parse token", t, p.name);
    for (const r of p.inferCall?.refs ?? []) claim(refs, "inferCall ref", r, p.name);
    for (const m of p.inferCall?.memberTargets ?? [])
      claim(memberTargets, "inferCall member target", m, p.name);
  }
  return diags;
};

/**
 * Leading-token → parse-hook table from the **resolved** plugin list.
 * `pluginClashes` rejects duplicate token claims upstream, so each token has
 * exactly one claimant and the parser does a single `peek().t` lookup instead
 * of chaining every hook. Hooks still self-guard — a `null` return falls
 * through to core's `unexpected token` error, which is what makes an empty
 * plugin list a real syntax opt-out rather than a silent one. A hook is now
 * physically unreachable at tokens outside its claim.
 */
export const parseHookTable = (plugins: LanguagePlugin[]): Map<Tok["t"], ParseHook> => {
  const table = new Map<Tok["t"], ParseHook>();
  for (const p of plugins) {
    if (!p.parse) continue;
    for (const t of p.parse.tokens) table.set(t, p.parse.hook);
  }
  return table;
};

/**
 * Run the parse hook claiming the token under the cursor, if any. `null`
 * (no claimant, or the claimant declined) → the caller (core `parseAtom`)
 * reports the leading token as unexpected, exactly as the old chain did.
 */
export const runParseHooks = (
  table: Map<Tok["t"], ParseHook>,
  tok: Tok["t"],
  api: ParserApi,
): Expr | null => table.get(tok)?.(api) ?? null;

/** One plugin's `inferCall` hook plus its resolved registration position. */
type InferCallEntry = { order: number; hook: InferCallHook };

/**
 * Claim-table dispatch for `inferCall` hooks, built once per inference run
 * from the **resolved** plugin list (`pluginClashes` rejects duplicate claims
 * upstream, so each name has one claimant). `refs` keys callee `ref` names;
 * `memberTargets` keys `field`-callee target ref names (`tw` in `tw.div(…)`).
 * `unclaimed` keeps the plugins that declare no claims (jsx — its hook keys
 * off `origin: "jsx"` provenance, not a callee name) and must therefore see
 * every call, in registration order.
 */
export type InferCallDispatch = {
  refs: Map<string, InferCallEntry>;
  memberTargets: Map<string, InferCallEntry>;
  unclaimed: InferCallEntry[];
};

/** Build the `inferCall` dispatch tables from a resolved plugin list. */
export const inferCallDispatch = (plugins: LanguagePlugin[]): InferCallDispatch => {
  const refs = new Map<string, InferCallEntry>();
  const memberTargets = new Map<string, InferCallEntry>();
  const unclaimed: InferCallEntry[] = [];
  plugins.forEach((p, order) => {
    const decl = p.inferCall;
    if (!decl) return;
    const entry: InferCallEntry = { order, hook: decl.hook };
    const claims = (decl.refs?.length ?? 0) + (decl.memberTargets?.length ?? 0);
    if (claims === 0) {
      unclaimed.push(entry);
      return;
    }
    for (const r of decl.refs ?? []) refs.set(r, entry);
    for (const m of decl.memberTargets ?? []) memberTargets.set(m, entry);
  });
  return { refs, memberTargets, unclaimed };
};

/**
 * Run infer-call hooks over the candidates a call can actually belong to:
 * every claim-less plugin, plus the (at most one) claimant matching the
 * callee shape — merged back into original registration order, so first-non-null
 * semantics are exactly the old whole-chain behavior. A claimed hook is now
 * physically unreachable for calls outside its claims. `null` from all →
 * caller uses core default.
 */
export const runInferCallHooks = (
  dispatch: InferCallDispatch,
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  const matched =
    e.fn.kind === "ref"
      ? dispatch.refs.get(e.fn.name)
      : e.fn.kind === "field" && e.fn.target.kind === "ref"
        ? dispatch.memberTargets.get(e.fn.target.name)
        : undefined;
  const candidates = matched
    ? [...dispatch.unclaimed, matched].sort((a, b) => a.order - b.order)
    : dispatch.unclaimed;
  for (const c of candidates) {
    const r = c.hook(e, api);
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
