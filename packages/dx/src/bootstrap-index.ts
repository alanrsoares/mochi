/**
 * Node-only symbol index over the frozen bootstrap graph (ADR 0118): the
 * `bootstrap/symbols.mochi` occurrences, shaped as the def/use queries nav
 * asks of them. Imports resolve through the export origins of the entry's
 * dependency graph; builtins resolve to the virtual prelude.
 */
import { resolve } from "node:path";
import {
  type BootstrapExportOrigins,
  type BootstrapLoc,
  type BootstrapSymOccurrence,
  loadBootstrapGraph,
  symbolIndexBootstrap,
} from "@mochi/compiler/bootstrap";
import { parseProgram } from "@mochi/compiler/bootstrap/syntax";
import type { Stmt } from "@mochi/compiler/bootstrap/types";
import { preludeBootstrap } from "@mochi/compiler/prelude-virtual";
import type { Location, Span } from "@mochi/compiler/span";
import { spanContainsClosed, tightestHit } from "@mochi/compiler/span";

export type SymbolSpace = BootstrapSymOccurrence["space"];

/** A binding: its space and declaration Location are its identity. */
export type Binding = { name: string; space: SymbolSpace; def: Location };

export type Occurrence = { binding: Binding; span: Span; role: "def" | "use" };

export type FileIndex = {
  /** Tightest occurrence containing `offset`, or null. */
  at: (offset: number) => Occurrence | null;
  /** Every occurrence of `binding`, def first, then in source order. */
  occurrences: (binding: Binding) => Occurrence[];
  /** The module-scope binding of `name` in `space` (prelude included), or null. */
  binding: (space: SymbolSpace, name: string) => Binding | null;
  /**
   * Value bindings visible at `offset`: module scope (prelude included), then
   * every local scope containing it, widest first, so an inner binder shadows
   * an outer one of the same name (ADR 0120).
   */
  bindingsAt: (offset: number) => Binding[];
};

type ReadFile = (path: string) => Promise<string>;

export const emptyOrigins = (): BootstrapExportOrigins => ({
  values: new Map(),
  types: new Map(),
  ctors: new Map(),
});

/** Copy `from` into `into`; a later module's export of a name wins. */
export const mergeOrigins = (into: BootstrapExportOrigins, from: BootstrapExportOrigins): void => {
  for (const [name, at] of from.values) into.values.set(name, at);
  for (const [name, at] of from.types) into.types.set(name, at);
  for (const [name, at] of from.ctors) into.ctors.set(name, at);
};

export const sameBinding = (a: Binding, b: Binding): boolean =>
  a.space === b.space &&
  a.name === b.name &&
  a.def.path === b.def.path &&
  a.def.span.start === b.def.span.start &&
  a.def.span.end === b.def.span.end;

const toOccurrence = (o: BootstrapSymOccurrence): Occurrence => ({
  binding: {
    name: o.name,
    space: o.space,
    def: { path: o.defPath, span: { start: o.defStart, end: o.defEnd } },
  },
  span: { start: o.start, end: o.end },
  role: o.role,
});

/**
 * Statements of `src` from the recovering parser, so the intact declarations
 * of a file with a hole elsewhere still index. Null when it does not lex.
 */
export const parseStmts = (src: string): readonly Stmt[] | null => {
  const parsed = parseProgram(src);
  return parsed._tag === "Ok" ? parsed.value.stmts : null;
};

/** Index `stmts` at `path`, imports resolved through `origins`. */
export const indexStmts = (
  path: string,
  stmts: readonly Stmt[],
  origins: BootstrapExportOrigins = emptyOrigins(),
): FileIndex => {
  const prelude = preludeBootstrap();
  const index = symbolIndexBootstrap(resolve(path), origins, prelude, stmts);
  const all = index.occurrences.map(toOccurrence);
  const at = (offset: number): Occurrence | null => {
    const hit = tightestHit(all, offset);
    return hit._tag === "Some" ? hit.value : null;
  };
  const occurrences = (binding: Binding): Occurrence[] =>
    all
      .filter((o) => sameBinding(o.binding, binding))
      .sort((a, c) =>
        a.role !== c.role ? (a.role === "def" ? -1 : 1) : a.span.start - c.span.start,
      );
  const scopes = {
    value: [index.top.values, prelude.origins.values],
    type: [index.top.types, prelude.origins.types],
    ctor: [index.top.ctors, prelude.origins.ctors],
    field: [index.fields],
  } as const;
  const binding = (space: SymbolSpace, name: string): Binding | null => {
    for (const scope of scopes[space]) {
      const def = scope.get(name);
      if (def)
        return { name, space, def: { path: def.path, span: { start: def.start, end: def.end } } };
    }
    return null;
  };
  const toBinding = (name: string, def: BootstrapLoc): Binding => ({
    name,
    space: "value",
    def: { path: def.path, span: { start: def.start, end: def.end } },
  });
  // Module scope is the same at every offset: build it once, on first ask.
  let moduleScope: Map<string, Binding> | undefined;
  const bindingsAt = (offset: number): Binding[] => {
    moduleScope ??= new Map(
      [prelude.origins.values, index.top.values].flatMap((scope) =>
        [...scope].map(([name, def]) => [name, toBinding(name, def)] as const),
      ),
    );
    const visible = new Map(moduleScope);
    const frames = index.frames
      .filter((f) => spanContainsClosed(f, offset))
      .toSorted((a, c) => c.end - c.start - (a.end - a.start) || a.start - c.start);
    for (const frame of frames)
      for (const [name, def] of frame.binds) visible.set(name, toBinding(name, def));
    return [...visible.values()];
  };
  return { at, occurrences, binding, bindingsAt };
};

/** Index `src` at `path`; null when it does not lex. */
export const indexSource = (
  path: string,
  src: string,
  origins?: BootstrapExportOrigins,
): FileIndex | null => {
  const stmts = parseStmts(src);
  return stmts ? indexStmts(path, stmts, origins) : null;
};

/**
 * Export origins of every module in `entry`'s dependency graph but the entry
 * itself, the entry served from `src`. A graph that fails to load (an
 * unreadable dependency, a cycle, a parse error) resolves no imports.
 */
export const originsForEntry = async (
  entry: string,
  src: string,
  readFile: ReadFile,
): Promise<BootstrapExportOrigins> => {
  const graph = await loadBootstrapGraph(entry, src, readFile);
  const origins = emptyOrigins();
  if (graph._tag === "Err") return origins;
  const entryPath = resolve(entry);
  for (const module of graph.value)
    if (module.path !== entryPath) mergeOrigins(origins, module.origins);
  return origins;
};

/** Index `src` at `path` with its imports resolved across its dependency graph. */
export const indexModule = async (
  path: string,
  src: string,
  readFile: ReadFile,
): Promise<FileIndex | null> => {
  const stmts = parseStmts(src);
  return stmts ? indexStmts(path, stmts, await originsForEntry(path, src, readFile)) : null;
};
