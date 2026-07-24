/**
 * Navigation queries over the lexical symbol index — free of LSP/protocol
 * types so Bun unit tests can assert on Locations/spans. The language server
 * is a thin adapter (ADR 0003). Go-to-type also consults the infer table when
 * typecheck succeeds.
 */
import { resolve } from "node:path";
import { isErr } from "@onrails/result";
import { toTypedProgram, toTypedProgramWith } from "./compile";
import type { InferResult, TypeAt } from "./infer";
import { lex } from "./lexer";
import { loadModuleGraph, moduleContext } from "./module";
import { parse } from "./parser";
import { preludeNamespaces } from "./prelude";
import { isPreludePath } from "./prelude-virtual";
import type { Location, Span } from "./span";
import {
  type Binding,
  emptyOrigins,
  indexProgram,
  mergeOrigins,
  type Occurrence,
  type Origins,
  originsOf,
  type SymbolIndex,
} from "./symbols";
import { foldAliases, type Type } from "./types";

export type Highlight = { span: Span; role: "def" | "use" };
export type Ref = { location: Location; role: "def" | "use" };
export type RenameEdit = { location: Location; newText: string };

export type DocSymbol = {
  name: string;
  kind: "let" | "extern" | "type" | "ctor";
  span: Span;
  detail?: string;
};

export type WorkspaceSymbol = DocSymbol & { path: string };

type ReadFile = (path: string) => Promise<string>;

const parseProgram = (src: string) => {
  const lexed = lex(src);
  if (isErr(lexed)) return null;
  const parsed = parse(lexed.value);
  return isErr(parsed) ? null : parsed.value;
};

const indexSrc = (path: string, src: string, origins?: Origins) => {
  const prog = parseProgram(src);
  if (!prog) return null;
  return indexProgram(resolve(path), prog, origins);
};

/** Origins from every dependency of `entry` (not the entry itself). */
const originsForEntry = async (
  entry: string,
  readFile: ReadFile,
  liveSrc?: string,
): Promise<Origins> => {
  const entryPath = resolve(entry);
  const read = (p: string): Promise<string> =>
    resolve(p) === entryPath && liveSrc !== undefined ? Promise.resolve(liveSrc) : readFile(p);
  const graph = await loadModuleGraph(entryPath, read);
  const origins = emptyOrigins();
  if (isErr(graph)) return origins;
  for (const { path, prog } of graph.value) {
    if (path === entryPath) continue;
    mergeOrigins(origins, originsOf(path, prog));
  }
  return origins;
};

const indexModule = async (
  path: string,
  src: string,
  readFile?: ReadFile,
): Promise<SymbolIndex | null> => {
  const origins = readFile ? await originsForEntry(path, readFile, src) : undefined;
  return indexSrc(path, src, origins);
};

/** Go-to-definition at `offset`. Unknown names → null; prelude → virtual Location. */
export const definitionAt = (src: string, offset: number, path = "<buffer>"): Location | null => {
  const idx = indexSrc(path, src);
  if (!idx) return null;
  const hit = idx.at(offset);
  return hit ? hit.binding.def : null;
};

/** Tightest inferred type span containing `offset` (ties → first). */
const tightest = (types: TypeAt[], offset: number): TypeAt | null => {
  let best: TypeAt | null = null;
  for (const t of types) {
    if (offset < t.span.start || offset > t.span.end) continue;
    const width = t.span.end - t.span.start;
    if (!best || width < best.span.end - best.span.start) best = t;
  }
  return best;
};

/** Nominal type head (`Shape`, `Option`, …). Structural / primitives → null. */
const nominalName = (t: Type): string | null => {
  if (t.kind !== "con") return null;
  // User + prelude types are Uppercase; skip `number`/`tuple`/`bool`/….
  if (!/^[A-Z]/.test(t.name)) return null;
  return t.name;
};

const typeDefFrom = (
  res: InferResult,
  offset: number,
  idx: SymbolIndex,
  origins?: Origins,
): Location | null => {
  const hit = tightest(res.types, offset);
  if (!hit) return null;
  const name = nominalName(foldAliases(hit.type, res.aliases));
  if (!name) return null;
  // Prefer a binding in scope (local / imported / prelude); fall back to any
  // export origin so go-to-type works when only ctors were imported.
  return idx.binding("type", name)?.def ?? origins?.type.get(name) ?? null;
};

/**
 * Go-to-type at `offset`: jump to the nominal type decl of the expression under
 * the cursor (variant / record alias / prelude). Needs a successful typecheck;
 * structural types and failed inference → null.
 */
export const typeDefinitionAt = (
  src: string,
  offset: number,
  path = "<buffer>",
): Location | null => {
  const idx = indexSrc(path, src);
  if (!idx) return null;
  const typed = toTypedProgram(src, { open: true, namespaces: preludeNamespaces });
  if (isErr(typed)) return null;
  return typeDefFrom(typed.value.res, offset, idx);
};

/** Module-aware go-to-type (imported variants/aliases via export origins). */
export const moduleTypeDefinitionAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
): Promise<Location | null> => {
  const origins = await originsForEntry(path, readFile, src);
  const idx = indexSrc(path, src, origins);
  if (!idx) return null;

  const lexed = lex(src);
  if (isErr(lexed)) return null;
  const parsed = parse(lexed.value);
  if (isErr(parsed)) return null;

  const entry = resolve(path);
  const read = (p: string): Promise<string> =>
    resolve(p) === entry ? Promise.resolve(src) : readFile(p);
  const ctx = await moduleContext(entry, read);
  if (isErr(ctx)) return typeDefinitionAt(src, offset, entry);

  const typed = toTypedProgramWith(parsed.value, ctx.value);
  if (isErr(typed)) return null;
  return typeDefFrom(typed.value.res, offset, idx, origins);
};

export const moduleDefinitionAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
): Promise<Location | null> => {
  const idx = await indexModule(path, src, readFile);
  if (!idx) return null;
  const hit = idx.at(offset);
  return hit ? hit.binding.def : null;
};

/** Document highlights for the binding under `offset` (occurrences in this file). */
export const highlightsAt = (src: string, offset: number, path = "<buffer>"): Highlight[] => {
  const idx = indexSrc(path, src);
  if (!idx) return [];
  const hit = idx.at(offset);
  if (!hit) return [];
  return idx.occurrences(hit.binding).map((o: Occurrence) => ({ span: o.span, role: o.role }));
};

export const moduleHighlightsAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
): Promise<Highlight[]> => {
  const idx = await indexModule(path, src, readFile);
  if (!idx) return [];
  const hit = idx.at(offset);
  if (!hit) return [];
  return idx.occurrences(hit.binding).map((o) => ({ span: o.span, role: o.role }));
};

/** Ensure the def Location is present (prelude defs live outside the file index). */
const withDefRef = (binding: Binding, refs: Ref[]): Ref[] => {
  if (refs.some((r) => r.role === "def")) return refs;
  return [{ location: binding.def, role: "def" }, ...refs];
};

/** Find-all-references for the binding under `offset` (this file only). */
export const referencesAt = (src: string, offset: number, path = "<buffer>"): Ref[] => {
  const idx = indexSrc(path, src);
  if (!idx) return [];
  const hit = idx.at(offset);
  if (!hit) return [];
  const refs = idx.occurrences(hit.binding).map((o) => ({
    location: { path: resolve(path), span: o.span },
    role: o.role,
  }));
  return withDefRef(hit.binding, refs);
};

const collectGraphRefs = async (
  entryPath: string,
  entrySrc: string,
  binding: Binding,
  readFile: ReadFile,
): Promise<Ref[]> => {
  const read = (p: string): Promise<string> =>
    resolve(p) === entryPath ? Promise.resolve(entrySrc) : readFile(p);
  const graph = await loadModuleGraph(entryPath, read);
  if (isErr(graph)) {
    return (
      indexSrc(entryPath, entrySrc)
        ?.occurrences(binding)
        .map((o) => ({ location: { path: entryPath, span: o.span }, role: o.role })) ?? []
    );
  }

  const refs: Ref[] = [];
  for (const { path, prog } of graph.value) {
    const src = path === entryPath ? entrySrc : await read(path);
    const fileOrigins = emptyOrigins();
    for (const dep of graph.value) {
      if (dep.path === path) continue;
      mergeOrigins(fileOrigins, originsOf(dep.path, dep.prog));
    }
    const fileIdx = indexProgram(path, parseProgram(src) ?? prog, fileOrigins);
    for (const o of fileIdx.occurrences(binding)) {
      refs.push({ location: { path, span: o.span }, role: o.role });
    }
  }
  const key = (r: Ref) => `${r.location.path}:${r.location.span.start}:${r.role}`;
  const seen = new Set<string>();
  return refs
    .filter((r) => {
      const k = key(r);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, c) => {
      if (a.role !== c.role) return a.role === "def" ? -1 : 1;
      if (a.location.path !== c.location.path) return a.location.path < c.location.path ? -1 : 1;
      return a.location.span.start - c.location.span.start;
    });
};

/** Graph-wide references (def file + every module that imports/uses it). */
export const moduleReferencesAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
): Promise<Ref[]> => {
  const entryPath = resolve(path);
  const idx = await indexModule(entryPath, src, readFile);
  if (!idx) return [];
  const hit = idx.at(offset);
  if (!hit) return [];
  const refs = await collectGraphRefs(entryPath, src, hit.binding, readFile);
  return withDefRef(hit.binding, refs);
};

const isRenameableName = (name: string): boolean =>
  !name.startsWith("$") && !name.startsWith("_") && /^[A-Za-z][A-Za-z0-9_]*$/.test(name);

const canRename = (b: Binding): boolean =>
  isRenameableName(b.name) && !isPreludePath(b.def.path) && b.space !== "field";

export const prepareRenameAt = (
  src: string,
  offset: number,
  path = "<buffer>",
): { span: Span; name: string } | null => {
  const idx = indexSrc(path, src);
  if (!idx) return null;
  const hit = idx.at(offset);
  if (!hit || !canRename(hit.binding)) return null;
  return { span: hit.span, name: hit.binding.name };
};

export const modulePrepareRenameAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
): Promise<{ span: Span; name: string } | null> => {
  const idx = await indexModule(path, src, readFile);
  if (!idx) return null;
  const hit = idx.at(offset);
  if (!hit || !canRename(hit.binding)) return null;
  return { span: hit.span, name: hit.binding.name };
};

/** Rename the binding under `offset` to `newName`. Same-file only. */
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
  if (!hit || !canRename(hit.binding)) return null;
  if (hit.binding.name === newName) return [];
  return idx.occurrences(hit.binding).map((o) => ({
    location: { path: resolve(path), span: o.span },
    newText: newName,
  }));
};

/** Graph-wide rename (export + all import/use sites). */
export const moduleRenameAt = async (
  path: string,
  src: string,
  offset: number,
  newName: string,
  readFile: ReadFile,
): Promise<RenameEdit[] | null> => {
  if (!isRenameableName(newName)) return null;
  const idx = await indexModule(path, src, readFile);
  if (!idx) return null;
  const hit = idx.at(offset);
  if (!hit || !canRename(hit.binding)) return null;
  if (hit.binding.name === newName) return [];
  const refs = await collectGraphRefs(resolve(path), src, hit.binding, readFile);
  return refs.map((r) => ({ location: r.location, newText: newName }));
};

/** Top-level document symbols for outline. */
export const documentSymbolsAt = (src: string): DocSymbol[] => {
  const prog = parseProgram(src);
  if (!prog) return [];
  const out: DocSymbol[] = [];
  for (const s of prog.stmts) {
    if (s.kind === "let" && !s.name.startsWith("$"))
      out.push({ name: s.name, kind: "let", span: s.nameSpan });
    else if (s.kind === "extern") out.push({ name: s.name, kind: "extern", span: s.nameSpan });
    else if (s.kind === "type") {
      out.push({ name: s.name, kind: "type", span: s.nameSpan });
      for (const c of s.ctors)
        out.push({ name: c.name, kind: "ctor", span: c.span, detail: s.name });
    }
  }
  return out;
};

/** Workspace symbol search over the module graph from `entry`. */
export const workspaceSymbolsAt = async (
  entry: string,
  query: string,
  readFile: ReadFile,
  liveSrc?: string,
): Promise<WorkspaceSymbol[]> => {
  const entryPath = resolve(entry);
  const read = (p: string): Promise<string> =>
    resolve(p) === entryPath && liveSrc !== undefined ? Promise.resolve(liveSrc) : readFile(p);
  const graph = await loadModuleGraph(entryPath, read);
  if (isErr(graph)) {
    const src = liveSrc ?? (await readFile(entryPath).catch(() => ""));
    return documentSymbolsAt(src)
      .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
      .map((s) => ({ ...s, path: entryPath }));
  }
  const q = query.toLowerCase();
  const out: WorkspaceSymbol[] = [];
  for (const { path } of graph.value) {
    const src = path === entryPath && liveSrc !== undefined ? liveSrc : await read(path);
    for (const s of documentSymbolsAt(src)) {
      if (!q || s.name.toLowerCase().includes(q)) out.push({ ...s, path });
    }
  }
  return out;
};
