/** Node-only navigation queries over the frozen bootstrap symbol index (ADR 0103). */
import { resolve } from "node:path";
import { type BootstrapOccurrence, symbolOccurrencesBootstrap } from "@mochi/compiler/bootstrap";
import { lex, parseRecovering } from "@mochi/compiler/bootstrap/syntax";
import { None } from "@mochi/compiler/runtime";
import type { Span } from "@mochi/compiler/span";
import type { Highlight, Ref, RenameEdit } from "./nav";

type BootstrapStmt = { _tag: string; name?: string; nameSpan?: Span };

/**
 * The binding under a cursor: every occurrence that shares its declaration
 * span, plus the facts the callers need about it. Resolved in one lex + parse,
 * so a caller that asks several questions of the same cursor pays once.
 */
export type BootstrapBinding = {
  /** The occurrence the cursor sits on. */
  readonly at: BootstrapOccurrence;
  /** Every occurrence of this binding, in source order. */
  readonly occurrences: readonly BootstrapOccurrence[];
  /**
   * `false` for a top-level `let`/`extern`, which may be imported elsewhere —
   * the graph-wide index, not this single-file one, owns its references and
   * rename.
   */
  readonly fileLocal: boolean;
};

/**
 * Resolve the binding under `offset`, or `null` if the cursor is not on one.
 * Uses the recovering parser, so a buffer mid-edit still yields the bindings it
 * does have. Identity is the declaration span, never the name, so a shadowed
 * name resolves to its own binding only (ADR 0103).
 */
export const bootstrapBindingAt = (src: string, offset: number): BootstrapBinding | null => {
  const lexed = lex(src) as { _tag: "Ok"; value: unknown } | { _tag: "Err" };
  if (lexed._tag === "Err") return null;
  const parsed = parseRecovering(lexed.value, None) as { stmts: BootstrapStmt[] };
  const occurrences = symbolOccurrencesBootstrap(parsed.stmts);
  const at = occurrences.find((o) => o.start <= offset && offset <= o.end);
  if (!at) return null;
  return {
    at,
    // The index emits declarations ahead of the bodies they scope; sort so a
    // caller can read the result as the file reads.
    occurrences: occurrences
      .filter((o) => o.defStart === at.defStart && o.defEnd === at.defEnd)
      .sort((a, b) => a.start - b.start),
    fileLocal: !parsed.stmts.some(
      (stmt) =>
        (stmt._tag === "SLet" || stmt._tag === "SExtern") &&
        stmt.nameSpan?.start === at.defStart &&
        stmt.nameSpan?.end === at.defEnd,
    ),
  };
};

const spanOf = (o: BootstrapOccurrence): Span => ({ start: o.start, end: o.end });

/** Document highlights for a resolved binding. */
export const bootstrapHighlightsOf = (binding: BootstrapBinding): Highlight[] =>
  binding.occurrences.map((o) => ({ span: spanOf(o), role: o.role === "def" ? "def" : "use" }));

/** Find-all-references for a resolved binding, within its own file. */
export const bootstrapReferencesOf = (binding: BootstrapBinding, path: string): Ref[] =>
  binding.occurrences.map((o) => ({
    location: { path: resolve(path), span: spanOf(o) },
    role: o.role === "def" ? "def" : "use",
  }));

/** `$`/`_` binders are compiler-owned or deliberately unused; neither is renameable. */
const isRenameableName = (name: string): boolean =>
  !name.startsWith("$") && !name.startsWith("_") && /^[A-Za-z][A-Za-z0-9_]*$/.test(name);

/** The span the editor should pre-fill, or `null` if the binding is not renameable. */
export const bootstrapPrepareRenameOf = (
  binding: BootstrapBinding,
): { span: Span; name: string } | null =>
  isRenameableName(binding.at.name) ? { span: spanOf(binding.at), name: binding.at.name } : null;

/** Rewrite every occurrence of a resolved binding to `newName`. */
export const bootstrapRenameOf = (
  binding: BootstrapBinding,
  newName: string,
  path: string,
): RenameEdit[] =>
  bootstrapPrepareRenameOf(binding) === null
    ? []
    : binding.occurrences.map((o) => ({
        location: { path: resolve(path), span: spanOf(o) },
        newText: newName,
      }));

/** Document highlights for the binding under `offset`. */
export const bootstrapHighlightsAt = (src: string, offset: number): Highlight[] => {
  const binding = bootstrapBindingAt(src, offset);
  return binding ? bootstrapHighlightsOf(binding) : [];
};
