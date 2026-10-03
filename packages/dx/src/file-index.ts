/**
 * The symbol index over the frozen bootstrap core (ADR 0118): the
 * `packages/compiler/src/check/symbols.mochi` occurrences, shaped as the def/use queries nav
 * asks of them. Imports resolve through the `origins` the caller passes;
 * builtins resolve to the virtual prelude. Browser-safe: it runs on the
 * synchronous bundle, so docs-site hover can use it. The graph-wide variant
 * is `bootstrap-module-index.ts`.
 */
import { resolve } from "node:path";
import { symbolIndexSync } from "@mochi/compiler/compile/sync";
import type {
  CompilerExportOrigins,
  CompilerLoc,
  CompilerSymOccurrence,
} from "@mochi/compiler/graph";
import type { Stmt } from "@mochi/compiler/infer/types";
import { preludeSymbols } from "@mochi/compiler/prelude-virtual";
import type { Location, Span } from "@mochi/compiler/span";
import { spanContainsClosed, tightestHit } from "@mochi/compiler/span";
import { parseProgram } from "@mochi/compiler/syntax";

export type SymbolSpace = CompilerSymOccurrence["space"];

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

export const emptyOrigins = (): CompilerExportOrigins => ({
  values: new Map(),
  types: new Map(),
  ctors: new Map(),
});

/** Copy `from` into `into`; a later module's export of a name wins. */
export const mergeOrigins = (into: CompilerExportOrigins, from: CompilerExportOrigins): void => {
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

const toOccurrence = (o: CompilerSymOccurrence): Occurrence => ({
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
  origins: CompilerExportOrigins = emptyOrigins(),
): FileIndex => {
  const prelude = preludeSymbols();
  // A virtual buffer (`<buffer>`) is not a file: the browser's `node:path`
  // shim would need `process` to resolve it.
  const key = path.startsWith("<") ? path : resolve(path);
  const index = symbolIndexSync(key, origins, prelude, stmts);
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
  const toBinding = (name: string, def: CompilerLoc): Binding => ({
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
  origins?: CompilerExportOrigins,
): FileIndex | null => {
  const stmts = parseStmts(src);
  return stmts ? indexStmts(path, stmts, origins) : null;
};
