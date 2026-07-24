// Navigation queries over the lexical symbol index — free of LSP/protocol
// types so Bun unit tests can assert on Locations/spans. The language server
// is a thin adapter (ADR 0003, DX slices 2–3).
import { resolve } from "node:path";
import { isErr } from "@onrails/result";
import { lex } from "./lexer";
import { parse } from "./parser";
import type { Location, Span } from "./span";
import { indexProgram, type Occurrence } from "./symbols";

export type Highlight = { span: Span; role: "def" | "use" };
export type Ref = { location: Location; role: "def" | "use" };
export type RenameEdit = { location: Location; newText: string };

const indexSrc = (path: string, src: string) => {
  const lexed = lex(src);
  if (isErr(lexed)) return null;
  const parsed = parse(lexed.value);
  if (isErr(parsed)) return null;
  return indexProgram(resolve(path), parsed.value);
};

/** Go-to-definition at `offset`. Prelude / unknown names → null. */
export const definitionAt = (src: string, offset: number, path = "<buffer>"): Location | null => {
  const idx = indexSrc(path, src);
  if (!idx) return null;
  const hit = idx.at(offset);
  return hit ? hit.binding.def : null;
};

/** Document highlights for the binding under `offset` (def + all uses). */
export const highlightsAt = (src: string, offset: number, path = "<buffer>"): Highlight[] => {
  const idx = indexSrc(path, src);
  if (!idx) return [];
  const hit = idx.at(offset);
  if (!hit) return [];
  return idx.occurrences(hit.binding).map((o: Occurrence) => ({ span: o.span, role: o.role }));
};

/** Find-all-references for the binding under `offset` (def + uses). */
export const referencesAt = (src: string, offset: number, path = "<buffer>"): Ref[] => {
  const idx = indexSrc(path, src);
  if (!idx) return [];
  const hit = idx.at(offset);
  if (!hit) return [];
  return idx.occurrences(hit.binding).map((o) => ({
    location: { path: hit.binding.def.path, span: o.span },
    role: o.role,
  }));
};

const isRenameableName = (name: string): boolean =>
  !name.startsWith("$") && !name.startsWith("_") && /^[A-Za-z][A-Za-z0-9_]*$/.test(name);

/** True when the name under `offset` can be renamed (not prelude / synthetic). */
export const prepareRenameAt = (
  src: string,
  offset: number,
  path = "<buffer>",
): { span: Span; name: string } | null => {
  const idx = indexSrc(path, src);
  if (!idx) return null;
  const hit = idx.at(offset);
  if (!hit || !isRenameableName(hit.binding.name)) return null;
  return { span: hit.span, name: hit.binding.name };
};

/**
 * Rename the binding under `offset` to `newName`. Null when the site isn't
 * renameable or `newName` isn't a bare identifier. Same-file edits only.
 */
export const renameAt = (
  src: string,
  offset: number,
  newName: string,
  path = "<buffer>",
): RenameEdit[] | null => {
  if (!isRenameableName(newName)) return null;
  const idx = indexSrc(path, src);
  if (!idx) return null;
  const hit = idx.at(offset);
  if (!hit || !isRenameableName(hit.binding.name)) return null;
  if (hit.binding.name === newName) return [];
  return idx.occurrences(hit.binding).map((o) => ({
    location: { path: hit.binding.def.path, span: o.span },
    newText: newName,
  }));
};
