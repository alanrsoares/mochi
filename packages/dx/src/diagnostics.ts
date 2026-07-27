/**
 * LSP-shaped publish diagnostics, computed from `compile` but free of any
 * editor/protocol dependency so it stays unit-testable under Bun. The language
 * server is a thin adapter that maps these onto vscode-languageserver types.
 * The compiler error type is `Diagnostic` (`errors.ts`); this file's
 * `PublishDiagnostic` is the wire-shaped DTO only (ADR 0003).
 */
import { resolve } from "node:path";
import { toTypedProgram, toTypedProgramWith } from "@mochi/compiler/compile";
import type { Diagnostic } from "@mochi/compiler/errors";
import type { LanguagePlugin } from "@mochi/compiler/extensions";
import { lex } from "@mochi/compiler/lexer";
import { moduleContext } from "@mochi/compiler/module";
import { parse } from "@mochi/compiler/parser";
import { preludeNamespaces } from "@mochi/compiler/prelude";
import { lineCol } from "@mochi/compiler/span";
import { isErr } from "@onrails/result";

/** 0-based line/character — matches the LSP `Position` shape. */
export type Position = { line: number; character: number };
export type Range = { start: Position; end: Position };

export type RelatedInformation = {
  message: string;
  path: string;
  range: Range;
};

export type PublishSuggestion = {
  title: string;
  path: string;
  range: Range;
  replaceWith: string;
};

export type PublishDiagnostic = {
  range: Range;
  message: string;
  related?: RelatedInformation[];
  suggestions?: PublishSuggestion[];
};

const posAt = (src: string, offset: number): Position => {
  const lc = lineCol(src, offset);
  return { line: lc.line - 1, character: lc.col - 1 };
};

const spanRange = (src: string, start: number, end: number): Range => ({
  start: posAt(src, start),
  end: posAt(src, end),
});

/** Map a span to a range; spanless errors fall back to the first character. */
const rangeOf = (src: string, e: Diagnostic): Range =>
  e.span
    ? spanRange(src, e.span.start, e.span.end)
    : { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } };

/** Map a compiler Diagnostic onto the publish DTO (labels → related, etc.). */
export function toPublish(
  src: string,
  e: Diagnostic,
  path = "<buffer>",
  sources?: ReadonlyMap<string, string>,
): PublishDiagnostic {
  const related = (e.labels ?? []).map((label) => {
    const labelPath = label.location.path || path;
    const labelSrc = sources?.get(labelPath) ?? src;
    return {
      message: label.message,
      path: labelPath,
      range: spanRange(labelSrc, label.location.span.start, label.location.span.end),
    };
  });
  const suggestions = (e.suggestions ?? []).map((s) => {
    const sPath = s.location.path || path;
    const sSrc = sources?.get(sPath) ?? src;
    return {
      title: s.title ?? `Replace with ${JSON.stringify(s.replaceWith)}`,
      path: sPath,
      range: spanRange(sSrc, s.location.span.start, s.location.span.end),
      replaceWith: s.replaceWith,
    };
  });
  let message = `${e.kind}: ${e.message}`;
  if (e.help) message = `${message}\nhelp: ${e.help}`;
  return {
    range: rangeOf(src, e),
    message,
    ...(related.length > 0 ? { related } : {}),
    ...(suggestions.length > 0 ? { suggestions } : {}),
  };
}

/** Options threaded into `moduleDiagnostics` / single-file `diagnostics` — `plugins` (styled-cva, …), same list Vite / `gen-mochi-dts` use. Omitted = default/builtin resolution (`resolvePlugins`, ADR 0011). */
export type ModuleDiagnosticsOptions = { plugins?: LanguagePlugin[] };

/**
 * Check + infer may emit several diagnostics (ADR 0004); so may parse, since
 * recovery reports every unparsable region (ADR 0045). Only lex still yields a
 * single one. Single-file: imports resolve to nothing, so a `switch` on an imported
 * variant reads as an unknown constructor. Use `moduleDiagnostics` when a path
 * is available.
 *
 * **Strict unbound (`open: false`).** Emit/codegen stays open-world so bare host
 * globals still lower; the editor must flag typos (`useRefssss`, misspelled
 * locals). `opts.plugins` still reaches infer so vendor `inferCall` runs.
 */
export function diagnostics(src: string, opts: ModuleDiagnosticsOptions = {}): PublishDiagnostic[] {
  const r = toTypedProgram(src, {
    open: false,
    namespaces: preludeNamespaces,
    plugins: opts.plugins,
  });
  return isErr(r) ? r.error.map((e) => toPublish(src, e)) : [];
}

/**
 * Module-aware diagnostics: resolve `path`'s dependency graph (deps read from
 * disk via `readFile`, the edited file served from the live `src` buffer) and
 * check + infer the live program WITH the imported registry/schemes. This is
 * what stops a match on an imported constructor from being a false "unknown
 * constructor", and makes cross-module exhaustiveness real. `opts.plugins`
 * (styled-cva, …) reaches the same call, so a project's host kits don't
 * produce false type errors in the editor that Vite/`gen-mochi-dts` don't see.
 *
 * Degradation is deliberate: the entry's own lex/parse errors are always
 * reported (they never depend on deps); if the dep graph can't be resolved or a
 * dep fails to compile, we fall back to single-file `diagnostics(src)` — no
 * worse than before, and the user still sees their own file's errors.
 */
export async function moduleDiagnostics(
  path: string,
  src: string,
  readFile: (p: string) => Promise<string>,
  opts: ModuleDiagnosticsOptions = {},
): Promise<PublishDiagnostic[]> {
  const lexed = lex(src);
  if (isErr(lexed)) return [toPublish(src, lexed.error, path)];
  const parsed = parse(lexed.value, { plugins: opts.plugins });
  // Every parse diagnostic, not just the first (ADR 0045).
  if (isErr(parsed)) return parsed.error.map((d) => toPublish(src, d, path));
  const prog = parsed.value;

  const entry = resolve(path);
  const read = (p: string): Promise<string> =>
    resolve(p) === entry ? Promise.resolve(src) : readFile(p);
  const ctx = await moduleContext(entry, read, { plugins: opts.plugins });
  if (isErr(ctx)) return diagnostics(src, { plugins: opts.plugins });

  const typed = toTypedProgramWith(prog, ctx.value, {
    plugins: opts.plugins,
    open: false,
  });
  return isErr(typed) ? typed.error.map((e) => toPublish(src, e, entry)) : [];
}
