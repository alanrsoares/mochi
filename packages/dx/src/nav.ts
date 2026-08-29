/**
 * Navigation queries over the lexical symbol index — free of LSP/protocol
 * types so Bun unit tests can assert on Locations/spans. The language server
 * is a thin adapter (ADR 0003). Go-to-type also consults the infer table when
 * typecheck succeeds.
 */
import { dirname, resolve } from "node:path";
import { openMode, toTypedProgramRecovering, toTypedProgramWith } from "@mochi/compiler/compile";
import type { LanguagePlugin } from "@mochi/compiler/extensions";
import type { InferResult, TypeAt } from "@mochi/compiler/infer";
import { lex } from "@mochi/compiler/lexer";
import {
  loadModuleGraph,
  type ModuleCache,
  moduleContext,
  resolveImport,
} from "@mochi/compiler/module";
import { parseRecovering } from "@mochi/compiler/parser";
import { preludeNamespaces } from "@mochi/compiler/prelude";
import { isPreludePath } from "@mochi/compiler/prelude-virtual";
import type { Location, Span } from "@mochi/compiler/span";
import { spanContainsClosed, tightestHit } from "@mochi/compiler/span";
import {
  type Binding,
  emptyOrigins,
  indexProgram,
  mergeOrigins,
  type Occurrence,
  type Origins,
  originsOf,
  type SymbolIndex,
} from "@mochi/compiler/symbols";
import { foldAliases, type Type } from "@mochi/compiler/types";
import { flatMap, fromNullable, map, match as matchMaybe, none, some } from "@onrails/maybe";
import { isErr, isOk } from "@onrails/result";

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
 * dependencies: `loadModuleGraph(entry)` walks imports downward, so a query
 * raised on a definition sees only what that file imports — never the modules
 * that import IT. Without this list, "find all references" on an exported
 * binding returns just its own definition, and rename silently misses every
 * call site outside the defining file.
 */
export type ListFiles = () => Promise<readonly string[]>;

/** One module as `loadModuleGraph` yields it. */
type ModuleOf<G> = G extends readonly (infer R)[]
  ? R extends { readonly _tag: "Ok"; readonly value: readonly (infer M)[] }
    ? M
    : never
  : never;

// Recovering: symbols/definitions on the intact declarations survive a hole
// elsewhere in the file (C9 slice e).
const parseProgram = (src: string) => {
  const lexed = lex(src);
  return isErr(lexed) ? null : parseRecovering(lexed.value).program;
};

const indexSrc = (path: string, src: string, origins?: Origins) => {
  const prog = parseProgram(src);
  return !prog ? null : indexProgram(resolve(path), prog, origins);
};

/** Relative import/extern module specifiers, including a possible extern member. */
const relativeModuleSpecifiers = (src: string, path: string): RelativeModuleSpecifier[] => {
  const lexed = lex(src);
  if (isErr(lexed)) return [];
  const { program } = parseRecovering(lexed.value);
  return program.stmts.flatMap((stmt): RelativeModuleSpecifier[] => {
    if (stmt.kind !== "import" && stmt.kind !== "extern") return [];
    const spec = stmt.kind === "import" ? stmt.from : stmt.module;
    if (!spec.startsWith("./") && !spec.startsWith("../")) return [];
    const stringTokenAt = (value: string) =>
      lexed.value.find(
        (token) =>
          token.t === "str" &&
          token.v === value &&
          stmt.span.start <= token.span.start &&
          token.span.end <= stmt.span.end,
      );
    const stringToken = stringTokenAt(spec);
    if (!stringToken) return [];
    const extern = stmt.kind === "extern" ? stmt : null;
    const externMemberToken = extern ? stringTokenAt(extern.imported) : undefined;
    const externMember =
      extern && externMemberToken
        ? { name: extern.imported, span: externMemberToken.span }
        : undefined;
    return [
      {
        span: stringToken.span,
        targetPath:
          stmt.kind === "import" ? resolveImport(path, spec) : resolve(dirname(path), spec),
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

/** Hit under `offset` in an index, or None. */
const hitAt = (idx: SymbolIndex, offset: number) => fromNullable(idx.at(offset));

/** Go-to-definition at `offset`. Unknown names → null; prelude → virtual Location. */
export const definitionAt = (src: string, offset: number, path = "<buffer>"): Location | null =>
  matchMaybe(
    flatMap(fromNullable(indexSrc(path, src)), (idx) => hitAt(idx, offset)),
    (hit) => hit.binding.def,
    () => null,
  );

/** Tightest inferred type span containing `offset` (closed ends; ties → first). */
const tightestType = (types: TypeAt[], offset: number) =>
  tightestHit(types, offset, spanContainsClosed);

/** Nominal type head (`Shape`, `Option`, …). Structural / primitives → None. */
const nominalName = (t: Type) =>
  fromNullable(t.kind === "con" && /^[A-Z]/.test(t.name) ? t.name : null);

const typeDefFrom = (
  res: InferResult,
  offset: number,
  idx: SymbolIndex,
  origins?: Origins,
): Location | null =>
  matchMaybe(
    flatMap(tightestType(res.types, offset), (hit) =>
      flatMap(nominalName(foldAliases(hit.type, res.aliases)), (name) =>
        // Prefer a binding in scope (local / imported / prelude); fall back to any
        // export origin so go-to-type works when only ctors were imported.
        fromNullable(idx.binding("type", name)?.def ?? origins?.type.get(name) ?? null),
      ),
    ),
    (loc) => loc,
    () => null,
  );

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
  const typed = toTypedProgramRecovering(src, { namespaces: preludeNamespaces });
  return isOk(typed) ? typeDefFrom(typed.value.res, offset, idx) : null;
};

/** Options threaded into module-* nav helpers that typecheck — `plugins` (styled-cva, …), same list hover/diagnostics take. */
export type ModuleNavOptions = { plugins?: LanguagePlugin[]; cache?: ModuleCache };

/** Module-aware go-to-type (imported variants/aliases via export origins). */
export const moduleTypeDefinitionAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
  opts: ModuleNavOptions = {},
): Promise<Location | null> => {
  const origins = await originsForEntry(path, readFile, src);
  const idx = indexSrc(path, src, origins);
  if (!idx) return null;

  const lexed = lex(src);
  if (isErr(lexed)) return null;
  const { program } = parseRecovering(lexed.value, { plugins: opts.plugins });

  const entry = resolve(path);
  const read = (p: string): Promise<string> =>
    resolve(p) === entry ? Promise.resolve(src) : readFile(p);
  const ctx = await moduleContext(entry, read, { plugins: opts.plugins, cache: opts.cache });
  if (isErr(ctx)) return typeDefinitionAt(src, offset, entry);

  const typed = toTypedProgramWith(program, ctx.value, {
    plugins: opts.plugins,
    open: openMode(src),
  });
  return isOk(typed) ? typeDefFrom(typed.value.res, offset, idx, origins) : null;
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
  return matchMaybe(
    flatMap(fromNullable(await indexModule(path, src, readFile)), (idx) => hitAt(idx, offset)),
    (hit) => hit.binding.def,
    () => null,
  );
};

/** Document highlights for the binding under `offset` (occurrences in this file). */
export const highlightsAt = (src: string, offset: number, path = "<buffer>"): Highlight[] =>
  matchMaybe(
    flatMap(fromNullable(indexSrc(path, src)), (idx) =>
      map(hitAt(idx, offset), (hit) =>
        idx.occurrences(hit.binding).map((o: Occurrence) => ({ span: o.span, role: o.role })),
      ),
    ),
    (hs) => hs,
    () => [],
  );

export const moduleHighlightsAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
): Promise<Highlight[]> =>
  matchMaybe(
    flatMap(fromNullable(await indexModule(path, src, readFile)), (idx) =>
      map(hitAt(idx, offset), (hit) =>
        idx.occurrences(hit.binding).map((o) => ({ span: o.span, role: o.role })),
      ),
    ),
    (hs) => hs,
    () => [],
  );

/** Ensure the def Location is present (prelude defs live outside the file index). */
const withDefRef = (binding: Binding, refs: Ref[]): Ref[] =>
  refs.some((r) => r.role === "def") ? refs : [{ location: binding.def, role: "def" }, ...refs];

/** Find-all-references for the binding under `offset` (this file only). */
export const referencesAt = (src: string, offset: number, path = "<buffer>"): Ref[] =>
  matchMaybe(
    flatMap(fromNullable(indexSrc(path, src)), (idx) =>
      map(hitAt(idx, offset), (hit) => {
        const refs = idx.occurrences(hit.binding).map((o) => ({
          location: { path: resolve(path), span: o.span },
          role: o.role,
        }));
        return withDefRef(hit.binding, refs);
      }),
    ),
    (refs) => refs,
    () => [],
  );

/**
 * Project files whose import closure reaches `target`, plus `target` itself.
 *
 * One parse per file and a reverse walk, rather than a module-graph load per
 * candidate: the graph loader resolves and typechecks, and only the import
 * edges matter here.
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
      const prog = src === null ? null : parseProgram(src);
      if (!prog) return;
      for (const st of prog.stmts) {
        if (st.kind !== "import") continue;
        const dep = resolveImport(file, st.from);
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
  const graphs = await Promise.all(entries.map((e) => loadModuleGraph(e, read)));
  const byPath = new Map<string, ModuleOf<typeof graphs>>();
  for (const g of graphs) {
    if (isErr(g)) continue;
    for (const m of g.value) if (!byPath.has(m.path)) byPath.set(m.path, m);
  }
  // Every entry failed to load (unreadable dep, cycle): fall back to the file
  // in hand rather than reporting nothing.
  if (byPath.size === 0) {
    return (
      indexSrc(entryPath, entrySrc)
        ?.occurrences(binding)
        .map((o) => ({ location: { path: entryPath, span: o.span }, role: o.role })) ?? []
    );
  }
  const modules = [...byPath.values()];

  const refs: Ref[] = [];
  for (const { path, prog } of modules) {
    const src = path === entryPath ? entrySrc : await read(path);
    const fileOrigins = emptyOrigins();
    for (const dep of modules) {
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
  listFiles?: ListFiles,
): Promise<Ref[]> => {
  const entryPath = resolve(path);
  const hit = matchMaybe(
    flatMap(fromNullable(await indexModule(entryPath, src, readFile)), (idx) => hitAt(idx, offset)),
    (h) => h,
    () => null,
  );
  return !hit
    ? []
    : withDefRef(
        hit.binding,
        await collectGraphRefs(entryPath, src, hit.binding, readFile, listFiles),
      );
};

const isRenameableName = (name: string): boolean =>
  !name.startsWith("$") && !name.startsWith("_") && /^[A-Za-z][A-Za-z0-9_]*$/.test(name);

const canRename = (b: Binding): boolean =>
  isRenameableName(b.name) && !isPreludePath(b.def.path) && b.space !== "field";

export const prepareRenameAt = (
  src: string,
  offset: number,
  path = "<buffer>",
): { span: Span; name: string } | null =>
  matchMaybe(
    flatMap(fromNullable(indexSrc(path, src)), (idx) =>
      flatMap(hitAt(idx, offset), (hit) =>
        canRename(hit.binding) ? some({ span: hit.span, name: hit.binding.name }) : none(),
      ),
    ),
    (prep) => prep,
    () => null,
  );

export const modulePrepareRenameAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
): Promise<{ span: Span; name: string } | null> =>
  matchMaybe(
    flatMap(fromNullable(await indexModule(path, src, readFile)), (idx) =>
      flatMap(hitAt(idx, offset), (hit) =>
        canRename(hit.binding) ? some({ span: hit.span, name: hit.binding.name }) : none(),
      ),
    ),
    (prep) => prep,
    () => null,
  );

/** Rename the binding under `offset` to `newName`. Same-file only. */
export const renameAt = (
  src: string,
  offset: number,
  newName: string,
  path = "<buffer>",
): RenameEdit[] | null => {
  if (!isRenameableName(newName)) return null;
  const hit = matchMaybe(
    flatMap(fromNullable(indexSrc(path, src)), (idx) =>
      map(hitAt(idx, offset), (h) => ({ idx, hit: h })),
    ),
    (x) => x,
    () => null,
  );
  if (!hit || !canRename(hit.hit.binding)) return null;
  if (hit.hit.binding.name === newName) return [];
  return hit.idx.occurrences(hit.hit.binding).map((o) => ({
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
  const hit = matchMaybe(
    flatMap(fromNullable(await indexModule(path, src, readFile)), (idx) => hitAt(idx, offset)),
    (h) => h,
    () => null,
  );
  if (!hit || !canRename(hit.binding)) return null;
  if (hit.binding.name === newName) return [];
  const refs = await collectGraphRefs(entryPath, src, hit.binding, readFile, listFiles);
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
