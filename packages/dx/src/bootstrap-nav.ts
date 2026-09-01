/** Node-only navigation queries over the frozen bootstrap symbol index (ADR 0103). */

import { resolve } from "node:path";
import { type BootstrapOccurrence, symbolOccurrencesBootstrap } from "@mochi/compiler/bootstrap";
import { lex, parseRecovering } from "@mochi/compiler/bootstrap/syntax";
import { None } from "@mochi/compiler/runtime";
import { bootstrapDocumentSymbolsAt } from "./bootstrap-symbols";
import type { Highlight, Ref, RenameEdit } from "./nav";

/** Recovering parse, so a buffer mid-edit still yields the bindings it does have. */
const occurrencesOf = (src: string): BootstrapOccurrence[] => {
  const lexed = lex(src) as { _tag: "Ok"; value: unknown } | { _tag: "Err" };
  if (lexed._tag === "Err") return [];
  const parsed = parseRecovering(lexed.value, None) as { stmts: unknown };
  return symbolOccurrencesBootstrap(parsed.stmts);
};

/**
 * The occurrences sharing a declaration span with the one under `offset`.
 * A binding is identified by `(defStart, defEnd)`, never by name, so a shadowed
 * name yields only its own group. Sorted by offset — the index emits
 * declarations ahead of the bodies they scope.
 */
const groupAt = (src: string, offset: number): BootstrapOccurrence[] => {
  const occurrences = occurrencesOf(src);
  const hit = occurrences.find((o) => o.start <= offset && offset <= o.end);
  return hit
    ? occurrences
        .filter((o) => o.defStart === hit.defStart && o.defEnd === hit.defEnd)
        .sort((a, b) => a.start - b.start)
    : [];
};

/**
 * Whether the binding under `offset` is confined to this file. A top-level
 * `let`/`extern` may be imported elsewhere, so the graph-wide TypeScript index
 * — not this single-file one — owns its references and rename.
 */
export const bootstrapBindingIsFileLocal = (src: string, offset: number): boolean => {
  const [def] = groupAt(src, offset);
  if (!def) return false;
  return !bootstrapDocumentSymbolsAt(src).some(
    (symbol) => symbol.span.start === def.defStart && symbol.span.end === def.defEnd,
  );
};

/** Document highlights for the binding under `offset`. */
export const bootstrapHighlightsAt = (src: string, offset: number): Highlight[] =>
  groupAt(src, offset).map(
    (o): Highlight => ({
      span: { start: o.start, end: o.end },
      role: o.role === "def" ? "def" : "use",
    }),
  );

/** Find-all-references for the binding under `offset`, within this file. */
export const bootstrapReferencesAt = (src: string, offset: number, path = "<buffer>"): Ref[] =>
  groupAt(src, offset).map(
    (o): Ref => ({
      location: { path: resolve(path), span: { start: o.start, end: o.end } },
      role: o.role === "def" ? "def" : "use",
    }),
  );

/** `$`/`_` binders are compiler-owned or deliberately unused; neither is renameable. */
const isRenameableName = (name: string): boolean =>
  !name.startsWith("$") && !name.startsWith("_") && /^[A-Za-z][A-Za-z0-9_]*$/.test(name);

/** The span the editor should pre-fill for a rename, or `null` if it is not renameable. */
export const bootstrapPrepareRenameAt = (
  src: string,
  offset: number,
): { span: { start: number; end: number }; name: string } | null => {
  const group = groupAt(src, offset);
  const hit = group.find((o) => o.start <= offset && offset <= o.end);
  return hit && isRenameableName(hit.name)
    ? { span: { start: hit.start, end: hit.end }, name: hit.name }
    : null;
};

/** Rewrite every occurrence of the binding under `offset` to `newName`. */
export const bootstrapRenameAt = (
  src: string,
  offset: number,
  newName: string,
  path = "<buffer>",
): RenameEdit[] =>
  bootstrapPrepareRenameAt(src, offset) === null
    ? []
    : groupAt(src, offset).map((o) => ({
        location: { path: resolve(path), span: { start: o.start, end: o.end } },
        newText: newName,
      }));
