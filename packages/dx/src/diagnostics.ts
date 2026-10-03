/**
 * LSP-shaped publish diagnostics, computed by the self-hosted compiler (the
 * frozen bootstrap seed) and free of any editor/protocol dependency so they
 * stay unit-testable under Bun. The language server is a thin adapter that
 * maps these onto vscode-languageserver types. `PublishDiagnostic` is the
 * wire-shaped DTO only (ADR 0003).
 */
import { resolve } from "node:path";
import { type Diagnostic, diagnosticFromSeed } from "@mochi/compiler/errors";
import type { CompilerPlugin } from "@mochi/compiler/extensions";
import {
  type CompilerDiagnostic,
  type CompilerRecoveryGraphCache,
  checkGraphRecovering,
  checkSync,
  resolveImport,
} from "@mochi/compiler/graph";
import { lineCol } from "@mochi/compiler/span";
import { parseProgram } from "@mochi/compiler/syntax";
import { unusedBindings } from "./unused-query";

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
  severity?: "warning";
  code?: string;
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

/**
 * What every diagnostic entry point takes. `plugins` are the project's plugins
 * in the self-hosted core's shape (ADR 0109), the same list Vite and
 * `gen-mochi-dts` compile with: omitted means builtins (JSX on), `[]` the hard
 * opt-out. `cache` reuses dependency results across calls; it is only valid
 * for the one `plugins` list it was filled under.
 */
export type ModuleDiagnosticsOptions = {
  plugins?: readonly CompilerPlugin[];
  cache?: CompilerRecoveryGraphCache;
};

type Span = { start: number; end: number };

const helpOf = (error: CompilerDiagnostic, messageBody: string): string | undefined =>
  (error.help?._tag === "Some" ? error.help.value : undefined) ??
  error.suggestions?.[0]?.title.toLowerCase() ??
  (/^unbound variable /.test(messageBody)
    ? "bind the name before using it, or check the spelling"
    : undefined);

/** A seed diagnostic as a compiler `Diagnostic` located in `path`. */
const from = (
  error: CompilerDiagnostic,
  path: string,
  span: Span = { start: error.start, end: error.end },
  message = error.message,
): Diagnostic => ({
  ...diagnosticFromSeed(error, path),
  message,
  span,
  help: helpOf(error, message),
});

/**
 * Single-file diagnostics: every lex, parse (ADR 0045) and check finding, else
 * every type error. Imports resolve to nothing, so a `switch` on an
 * imported variant reads as an unknown constructor; use `moduleDiagnostics`
 * when a path is available.
 *
 * **Strict unbound (`open: false`).** Emit stays open-world so bare host
 * globals still lower; the editor must flag typos.
 */
export function diagnostics(src: string, opts: ModuleDiagnosticsOptions = {}): PublishDiagnostic[] {
  return checkSync(src, opts.plugins).map((e) => toPublish(src, from(e, "<buffer>")));
}

/**
 * Module-aware diagnostics: resolve `path`'s dependency graph (deps read from
 * disk via `readFile`, the edited file served from the live `src` buffer) and
 * check + infer the entry against what its imports really export, so a match
 * on an imported constructor is not a false "unknown constructor" and
 * cross-module exhaustiveness is real.
 *
 * The entry's own lex/parse errors are always reported, since they never
 * depend on deps. A dependency that fails is surfaced at the entry's `import`
 * statement that pulls it in, as `module '<spec>' failed to compile: …`.
 */
export async function moduleDiagnostics(
  path: string,
  src: string,
  readFile: (p: string) => Promise<string>,
  opts: ModuleDiagnosticsOptions = {},
): Promise<PublishDiagnostic[]> {
  const errors = await checkGraphRecovering(path, src, readFile, opts.cache, opts.plugins);
  const out: PublishDiagnostic[] = [];
  for (const error of errors) out.push(toPublish(src, await locate(error, path, src), path));
  return out;
}

const lineAround = (src: string, start: number, end: number): Span => {
  const lineStart = src.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const nextLine = src.indexOf("\n", end);
  return { start: lineStart, end: nextLine === -1 ? src.length : nextLine };
};

/** Anchor a dependency's failure at the entry's import line that pulls it in. */
const locate = async (
  error: CompilerDiagnostic,
  path: string,
  src: string,
): Promise<Diagnostic> => {
  const tagged = /^module '([^']+)': (.*)$/s.exec(error.message);
  const errorPath = error.path ?? tagged?.[1];
  const messageBody = tagged?.[2] ?? error.message;
  if (errorPath !== undefined && resolve(errorPath) !== resolve(path)) {
    for (const candidate of src.matchAll(/from\s+["']([^"']+)["']/g)) {
      if ((await resolveImport(path, candidate[1]!)) !== resolve(errorPath)) continue;
      return from(
        error,
        path,
        lineAround(src, candidate.index!, candidate.index!),
        `module '${candidate[1]}' failed to compile: ${messageBody}`,
      );
    }
    return from(
      error,
      path,
      { start: error.start, end: error.end },
      `module '${errorPath}' failed to compile: ${messageBody}`,
    );
  }
  const line = lineAround(src, error.start, error.end);
  const importAtError = /^\s*import\b.*\bfrom\s+["']([^"']+)["']/.exec(
    src.slice(line.start, line.end),
  );
  return importAtError
    ? from(error, path, line, `module '${importAtError[1]}' failed to compile: ${messageBody}`)
    : from(error, path, { start: error.start, end: error.end }, messageBody);
};

/**
 * Everything the editor publishes for one buffer: {@link moduleDiagnostics}
 * plus the liveness warnings. A buffer that does not lex or parse has no
 * bindings to judge, so its parse errors are the whole answer.
 */
export async function documentDiagnostics(
  path: string,
  src: string,
  readFile: (p: string) => Promise<string>,
  opts: ModuleDiagnosticsOptions = {},
): Promise<PublishDiagnostic[]> {
  const graph = await moduleDiagnostics(path, src, readFile, opts);
  return [...graph, ...unusedBindingDiagnostics(src, path, opts)];
}

/**
 * Warning-only liveness diagnostics, from lexical binding identity
 * (`packages/compiler/src/check/symbols.mochi`). Nothing when the buffer does not lex or parse.
 */
export function unusedBindingDiagnostics(
  src: string,
  _path = "<buffer>",
  opts: ModuleDiagnosticsOptions = {},
): PublishDiagnostic[] {
  const parsed = parseProgram(src, opts.plugins);
  if (parsed._tag === "Err" || parsed.value.diagnostics.length > 0) return [];
  return unusedBindings(parsed.value.stmts).map((u) => ({
    range: spanRange(src, u.span.start, u.span.end),
    message: u.kind === "local" ? `unused local binding '${u.name}'` : `unused binding '${u.name}'`,
    severity: "warning" as const,
    code: u.kind === "local" ? "unused-local" : "unused-top-level",
  }));
}
