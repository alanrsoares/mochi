/**
 * Navigation queries over the bootstrap symbol index (ADR 0118) — free of
 * LSP/protocol types so Bun unit tests can assert on Locations/spans. The
 * language server is a thin adapter (ADR 0003). Go-to-type reads the bootstrap
 * infer table when typecheck succeeds (ADR 0119).
 */
import { dirname, resolve } from "node:path";
import type { CompilerPlugin } from "@mochi/compiler/extensions";
import {
  type CompilerGraphCache,
  type CompilerTypeAt,
  inferEntryGraphTypes,
  inferTypesSync,
  loadGraph,
  nominalTypeName,
  resolveImport,
} from "@mochi/compiler/graph";
import type { AliasInfo, Stmt } from "@mochi/compiler/infer/types";
import { isPreludePath } from "@mochi/compiler/prelude-virtual";
import type { Location, Span } from "@mochi/compiler/span";
import { spanContainsClosed, tightestHit } from "@mochi/compiler/span";
import { lex } from "@mochi/compiler/syntax";
import {
  type Binding,
  emptyOrigins,
  type FileIndex,
  indexSource,
  indexStmts,
  mergeOrigins,
  parseStmts,
} from "./file-index";
import { indexModule, originsForEntry } from "./module-index";
import { documentSymbolsFromSource, workspaceSymbolsFromGraph } from "./symbol-query";

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
export type ModulePathLink = { span: Span; target: Location };

type RelativeModuleSpecifier = {
  span: Span;
  targetPath: string;
  externMember?: { name: string; span: Span };
};

type ReadFile = (path: string) => Promise<string>;

/**
 * Every `.mochi` file the project owns. Supplied by the host (the language
 * server globs its workspace roots) because DX cannot discover a project from a
 * single buffer.
 *
 * References and rename need DEPENDENTS, and the module graph only has
 * dependencies: loading `entry`'s graph walks imports downward, so a query
 * raised on a definition sees only what that file imports — never the modules
 * that import IT. Without this list, "find all references" on an exported
 * binding returns just its own definition, and rename silently misses every
 * call site outside the defining file.
 */
export type ListFiles = () => Promise<readonly string[]>;

type CompilerToken = { tok: { _tag: string; value?: string }; start: number; end: number };

/** A relative `import` resolves as the graph loader resolves it; an extern names its file. */
const relativeTarget = (path: string, stmt: Stmt, spec: string): string =>
  stmt._tag === "SExtern"
    ? resolve(dirname(path), spec)
    : resolve(dirname(path), `${spec.replace(/\.mochi$/, "")}.mochi`);

/** Relative import/extern module specifiers, including a possible extern member. */
const relativeModuleSpecifiers = (src: string, path: string): RelativeModuleSpecifier[] => {
  const lexed = lex(src) as { _tag: "Ok"; value: CompilerToken[] } | { _tag: "Err" };
  const stmts = parseStmts(src);
  if (lexed._tag === "Err" || !stmts) return [];
  return stmts.flatMap((stmt): RelativeModuleSpecifier[] => {
    if (stmt._tag !== "SImport" && stmt._tag !== "SImportNs" && stmt._tag !== "SExtern") return [];
    const spec = stmt._tag === "SExtern" ? stmt.module : stmt.from;
    if (!spec.startsWith(".") && !spec.startsWith("../")) return [];
    const stringTokenAt = (value: string) =>
      lexed.value.find(
        (token) =>
          token.tok._tag === "TStr" &&
          token.tok.value === value &&
          stmt.span.start <= token.start &&
          token.end <= stmt.span.end,
      );
    const stringToken = stringTokenAt(spec);
    if (!stringToken) return [];
    const memberToken = stmt._tag === "SExtern" ? stringTokenAt(stmt.imported) : undefined;
    const externMember =
      stmt._tag === "SExtern" && memberToken
        ? { name: stmt.imported, span: { start: memberToken.start, end: memberToken.end } }
        : undefined;
    return [
      {
        span: { start: stringToken.start, end: stringToken.end },
        targetPath: relativeTarget(path, stmt, spec),
        ...(externMember ? { externMember } : {}),
      },
    ];
  });
};

/** Relative import/extern module specifiers and their target files. */
export const modulePathLinksAt = (src: string, path: string): ModulePathLink[] =>
  relativeModuleSpecifiers(src, path).map(({ span, targetPath }) => ({
    span,
    target: { path: targetPath, span: { start: 0, end: 0 } },
  }));

/** A relative module specifier's target location — the top of the target file. */
const relativeModulePathAt = (src: string, offset: number, path: string): Location | null =>
  modulePathLinksAt(src, path).find((link) => spanContainsClosed(link.span, offset))?.target ??
  null;

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Best-effort JS/TS export declaration span for an extern's imported member. */
const externMemberSpan = (src: string, imported: string): Span | null => {
  const name = escapeRegex(imported);
  const pattern =
    imported === "default"
      ? /\bexport\s+default\b/
      : new RegExp(
          `\\bexport\\s+(?:(?:declare|async)\\s+)*(?:(?:const|let|var|function|class|interface|type|enum)\\s+)?(${name})\\b`,
        );
  const hit = pattern.exec(src);
  if (!hit || hit.index === undefined) return null;
  const start =
    imported === "default"
      ? hit.index + hit[0].lastIndexOf("default")
      : hit.index + hit[0].lastIndexOf(imported);
  return { start, end: start + imported.length };
};

const externMemberDefinitionAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
): Promise<Location | null> => {
  const specifier = relativeModuleSpecifiers(src, path).find(
    (candidate) =>
      candidate.externMember && spanContainsClosed(candidate.externMember.span, offset),
  );
  const member = specifier?.externMember;
  if (!specifier || !member) return null;
  try {
    const targetSrc = await readFile(specifier.targetPath);
    return {
      path: specifier.targetPath,
      span: externMemberSpan(targetSrc, member.name) ?? { start: 0, end: 0 },
    };
  } catch {
    return { path: specifier.targetPath, span: { start: 0, end: 0 } };
  }
};

/** Go-to-definition at `offset`. Unknown names → null; prelude → virtual Location. */
export const definitionAt = (src: string, offset: number, path = "<buffer>"): Location | null =>
  indexSource(path, src)?.at(offset)?.binding.def ?? null;

/** A type name's declaration: one in scope (local, imported, prelude), else any export origin. */
const typeDeclOf = (name: string, idx: FileIndex, origins?: Map<string, Location>) =>
  idx.binding("type", name)?.def ?? origins?.get(name) ?? null;

/**
 * The declared type named by the tightest bootstrap record at `offset`: a
 * binder (`let c`) as much as an expression, since bootstrap infer records
 * both (ADR 0119). Record aliases fold back through the result's own map.
 */
const nominalTypeAt = (
  types: readonly CompilerTypeAt[],
  aliases: Map<string, AliasInfo>,
  offset: number,
): string | null => {
  const hit = tightestHit(types, offset, spanContainsClosed);
  return hit._tag === "Some" ? nominalTypeName(hit.value.ty, aliases) : null;
};

/** Export origins of `path`'s dependency graph, keyed as Locations. */
const typeOrigins = async (path: string, src: string, readFile: ReadFile) => {
  const origins = await originsForEntry(path, src, readFile);
  return new Map(
    [...origins.types].map(([name, at]) => [
      name,
      { path: at.path, span: { start: at.start, end: at.end } },
    ]),
  );
};

/**
 * Go-to-type at `offset`: jump to the nominal type decl of the expression or
 * binder under the cursor (variant / record alias / prelude). Needs a
 * successful typecheck; structural types and failed inference → null.
 */
export const typeDefinitionAt = (
  src: string,
  offset: number,
  path = "<buffer>",
): Location | null => {
  const idx = indexSource(path, src);
  if (!idx) return null;
  const inferred = inferTypesSync(src);
  if (inferred._tag === "Err") return null;
  const name = nominalTypeAt(inferred.value.types, inferred.value.aliases, offset);
  return name ? typeDeclOf(name, idx) : null;
};

/** Options threaded into module-aware go-to-type, which types the graph. */
export type ModuleNavOptions = {
  /** Caller-owned bootstrap graph memo, valid for one `plugins` list. */
  cache?: CompilerGraphCache;
  /** Project plugins for the bootstrap graph (ADR 0109); omitted means the builtins. */
  plugins?: readonly CompilerPlugin[];
};

/** Module-aware go-to-type (imported variants/aliases via export origins). */
export const moduleTypeDefinitionAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
  opts: ModuleNavOptions = {},
): Promise<Location | null> => {
  const inferred = await inferEntryGraphTypes(path, src, readFile, opts.cache, opts.plugins);
  if (inferred._tag === "Err") return null;
  const entryPath = resolve(path);
  const entry = inferred.value.find((module) => module.path === entryPath);
  const name = entry ? nominalTypeAt(entry.types, entry.aliases, offset) : null;
  if (!name) return null;
  const idx = await indexModule(path, src, readFile);
  return idx ? typeDeclOf(name, idx, await typeOrigins(path, src, readFile)) : null;
};

export const moduleDefinitionAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
): Promise<Location | null> => {
  const externMember = await externMemberDefinitionAt(path, src, offset, readFile);
  if (externMember) return externMember;
  const modulePath = relativeModulePathAt(src, offset, path);
  if (modulePath) return modulePath;
  return (await indexModule(path, src, readFile))?.at(offset)?.binding.def ?? null;
};

const highlightsIn = (idx: FileIndex | null, offset: number): Highlight[] => {
  const hit = idx?.at(offset);
  return !idx || !hit
    ? []
    : idx.occurrences(hit.binding).map((o) => ({ span: o.span, role: o.role }));
};

/** Document highlights for the binding under `offset` (occurrences in this file). */
export const highlightsAt = (src: string, offset: number, path = "<buffer>"): Highlight[] =>
  highlightsIn(indexSource(path, src), offset);

export const moduleHighlightsAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
): Promise<Highlight[]> => highlightsIn(await indexModule(path, src, readFile), offset);

/** Ensure the def Location is present (prelude defs live outside the file index). */
const withDefRef = (binding: Binding, refs: Ref[]): Ref[] =>
  refs.some((r) => r.role === "def") ? refs : [{ location: binding.def, role: "def" }, ...refs];

/** Find-all-references for the binding under `offset` (this file only). */
export const referencesAt = (src: string, offset: number, path = "<buffer>"): Ref[] => {
  const idx = indexSource(path, src);
  const hit = idx?.at(offset);
  if (!idx || !hit) return [];
  const refs = idx.occurrences(hit.binding).map((o) => ({
    location: { path: resolve(path), span: o.span },
    role: o.role,
  }));
  return withDefRef(hit.binding, refs);
};

/**
 * Project files whose import closure reaches `target`, plus `target` itself.
 *
 * One parse per file and a reverse walk, rather than a module-graph load per
 * candidate: only the import edges matter here.
 */
const dependentsOf = async (
  target: string,
  files: readonly string[],
  read: ReadFile,
): Promise<string[]> => {
  const importers = new Map<string, string[]>(); // imported path -> files importing it
  await Promise.all(
    files.map(async (file) => {
      const src = await read(file).catch(() => null);
      const stmts = src === null ? null : parseStmts(src);
      if (!stmts) return;
      for (const st of stmts) {
        if (st._tag !== "SImport" && st._tag !== "SImportNs") continue;
        const dep = await resolveImport(file, st.from);
        const at = importers.get(dep);
        if (at) at.push(file);
        else importers.set(dep, [file]);
      }
    }),
  );
  // Transitive: a module re-exporting through an intermediate is still a site
  // the binding's name can appear in.
  const seen = new Set<string>([target]);
  const queue = [target];
  // Cursor rather than `.pop()`: the queue is append-only, so walking it by
  // index keeps the receiver unmutated (`prefer-immutable-arrays`).
  for (let i = 0; i < queue.length; i++) {
    for (const importer of importers.get(queue[i] as string) ?? []) {
      if (seen.has(importer)) continue;
      seen.add(importer);
      queue.push(importer);
    }
  }
  return [...seen];
};

type GraphModule = {
  path: string;
  stmts: readonly Stmt[];
  origins: Parameters<typeof mergeOrigins>[1];
};

const collectGraphRefs = async (
  entryPath: string,
  entrySrc: string,
  binding: Binding,
  readFile: ReadFile,
  listFiles?: ListFiles,
): Promise<Ref[]> => {
  const read = (p: string): Promise<string> =>
    resolve(p) === entryPath ? Promise.resolve(entrySrc) : readFile(p);
  // Search from every module that can SEE the binding, not just from the cursor's
  // file: a query raised on a definition has an import closure that excludes its
  // own callers. Each dependent is walked as its own graph entry, so the modules
  // it imports come along and the union covers both directions.
  const defPath = resolve(binding.def.path);
  const entries =
    listFiles && !isPreludePath(binding.def.path)
      ? await dependentsOf(defPath, await listFiles(), read)
      : [entryPath];
  if (!entries.includes(entryPath)) entries.push(entryPath);
  const graphs = await Promise.all(
    entries.map(async (e) => loadGraph(e, await read(e).catch(() => ""), read)),
  );
  const byPath = new Map<string, GraphModule>();
  for (const g of graphs) {
    if (g._tag === "Err") continue;
    for (const m of g.value) {
      if (!byPath.has(m.path))
        byPath.set(m.path, { path: m.path, stmts: m.stmts as Stmt[], origins: m.origins });
    }
  }
  // Every entry failed to load (unreadable dep, cycle): fall back to the file
  // in hand rather than reporting nothing.
  if (byPath.size === 0) {
    const idx = indexSource(entryPath, entrySrc);
    return (idx?.occurrences(binding) ?? []).map((o) => ({
      location: { path: entryPath, span: o.span },
      role: o.role,
    }));
  }
  const modules = [...byPath.values()];

  const refs: Ref[] = [];
  for (const { path, stmts } of modules) {
    const origins = emptyOrigins();
    for (const dep of modules) if (dep.path !== path) mergeOrigins(origins, dep.origins);
    for (const o of indexStmts(path, stmts, origins).occurrences(binding)) {
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
  listFiles?: ListFiles,
): Promise<Ref[]> => {
  const entryPath = resolve(path);
  const hit = (await indexModule(entryPath, src, readFile))?.at(offset);
  return !hit
    ? []
    : withDefRef(
        hit.binding,
        await collectGraphRefs(entryPath, src, hit.binding, readFile, listFiles),
      );
};

/** `$`-prefixed names are compiler-owned, `_`-prefixed ones deliberately unused. */
const isRenameableName = (name: string): boolean =>
  !name.startsWith("$") && !name.startsWith("_") && /^[A-Za-z][A-Za-z0-9_]*$/.test(name);

const canRename = (b: Binding): boolean =>
  isRenameableName(b.name) && !isPreludePath(b.def.path) && b.space !== "field";

const prepareIn = (idx: FileIndex | null, offset: number): { span: Span; name: string } | null => {
  const hit = idx?.at(offset);
  return hit && canRename(hit.binding) ? { span: hit.span, name: hit.binding.name } : null;
};

export const prepareRenameAt = (
  src: string,
  offset: number,
  path = "<buffer>",
): { span: Span; name: string } | null => prepareIn(indexSource(path, src), offset);

export const modulePrepareRenameAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
): Promise<{ span: Span; name: string } | null> =>
  prepareIn(await indexModule(path, src, readFile), offset);

/** Rename the binding under `offset` to `newName`. Same-file only. */
export const renameAt = (
  src: string,
  offset: number,
  newName: string,
  path = "<buffer>",
): RenameEdit[] | null => {
  if (!isRenameableName(newName)) return null;
  const idx = indexSource(path, src);
  const hit = idx?.at(offset);
  if (!idx || !hit || !canRename(hit.binding)) return null;
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
  listFiles?: ListFiles,
): Promise<RenameEdit[] | null> => {
  if (!isRenameableName(newName)) return null;
  const entryPath = resolve(path);
  const hit = (await indexModule(path, src, readFile))?.at(offset);
  if (!hit || !canRename(hit.binding)) return null;
  if (hit.binding.name === newName) return [];
  const refs = await collectGraphRefs(entryPath, src, hit.binding, readFile, listFiles);
  return refs.map((r) => ({ location: r.location, newText: newName }));
};

/** Top-level document symbols for outline. */
export const documentSymbolsAt = (src: string): DocSymbol[] => documentSymbolsFromSource(src);

/** Workspace symbol search over the module graph from `entry`. */
export const workspaceSymbolsAt = (
  entry: string,
  query: string,
  readFile: ReadFile,
  liveSrc?: string,
): Promise<WorkspaceSymbol[]> =>
  workspaceSymbolsFromGraph(resolve(entry), query, readFile, liveSrc);
