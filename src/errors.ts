/**
 * mochi diagnostics — errors as values, one app-level type (ADR 0003). Every kind may carry a primary source `span`; lex always does. Optional labels / help / suggestions are filled by checker passes; constructors omit them until a pass has something to say. CLI and LSP only *render* this shape.
 */
import { type Location, lineCol, type Span } from "./span";

export type { Location };

/** Related site on a Diagnostic (e.g. "defined here") — not a separate error. */
export type Label = { location: Location; message: string };

/** Machine-applicable fix; LSP exposes these as code actions. */
export type Suggestion = {
  location: Location;
  replaceWith: string;
  title?: string;
};

type DiagExtras = {
  labels?: readonly Label[];
  help?: string;
  suggestions?: readonly Suggestion[];
};

export type DiagnosticExtras = DiagExtras;

export type Diagnostic =
  | ({ kind: "lex"; message: string; span: Span } & DiagExtras)
  | ({ kind: "parse"; message: string; span?: Span } & DiagExtras)
  | ({ kind: "check"; message: string; span?: Span } & DiagExtras)
  | ({ kind: "type"; message: string; span?: Span } & DiagExtras);

export const lexErr = (message: string, span: Span, extras?: DiagExtras): Diagnostic => ({
  kind: "lex",
  message,
  span,
  ...extras,
});

export const parseErr = (message: string, span?: Span, extras?: DiagExtras): Diagnostic => ({
  kind: "parse",
  message,
  span,
  ...extras,
});

export const checkErr = (message: string, span?: Span, extras?: DiagExtras): Diagnostic => ({
  kind: "check",
  message,
  span,
  ...extras,
});

export const typeErr = (message: string, span?: Span, extras?: DiagExtras): Diagnostic => ({
  kind: "type",
  message,
  span,
  ...extras,
});

/** Wrap a single-stage Diagnostic for pipeline seams that use Diagnostic[]. */
export const oneDiag = (e: Diagnostic): Diagnostic[] => [e];

/** Flatten optional / single / many diagnostics into one list. */
export function concatDiags(
  ...parts: readonly (Diagnostic | Diagnostic[] | null | undefined)[]
): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const p of parts) {
    if (p == null) continue;
    if (Array.isArray(p)) out.push(...p);
    else out.push(p);
  }
  return out;
}

const kindLabel: Record<Diagnostic["kind"], string> = {
  lex: "LexError",
  parse: "ParseError",
  check: "CheckError",
  type: "TypeError",
};

export type FormatErrorOpts = {
  /** Absolute path of the primary file (for label line:col when sources match). */
  path?: string;
  /** path → source text for rendering label locations as line:col. */
  sources?: ReadonlyMap<string, string>;
};

function atPos(src: string | undefined, span: Span): string {
  if (!src) return ` at ${span.start}`;
  const p = lineCol(src, span.start);
  return ` at ${p.line}:${p.col}`;
}

function labelAt(label: Label, opts?: FormatErrorOpts, primarySrc?: string): string {
  const { path, span } = label.location;
  const src =
    opts?.sources?.get(path) ??
    (opts?.path !== undefined && path === opts.path ? primarySrc : undefined);
  if (src) {
    const p = lineCol(src, span.start);
    return `  ${path}:${p.line}:${p.col}: ${label.message}`;
  }
  return `  ${path}@${span.start}: ${label.message}`;
}

/** Human-readable diagnostic. Primary line, then labels, help, and suggestion titles (suggestions are also code-action payloads — CLI just shows them). */
export function formatError(e: Diagnostic, src?: string, opts?: FormatErrorOpts): string {
  const at = e.span ? atPos(src, e.span) : "";
  const lines = [`${kindLabel[e.kind]}${at}: ${e.message}`];
  for (const label of e.labels ?? []) lines.push(labelAt(label, opts, src));
  if (e.help) lines.push(`help: ${e.help}`);
  for (const s of e.suggestions ?? []) {
    const title = s.title ?? `replace with ${JSON.stringify(s.replaceWith)}`;
    lines.push(`suggestion: ${title}`);
  }
  return lines.join("\n");
}
