/**
 * The executable self-hosted compiler core (ADR 0090).
 *
 * `bootstrap/seed/` is a manifest-verified TypeScript graph emitted from
 * `bootstrap/*.mochi`; it is not an authoring surface. This module gives host
 * tools one explicit import boundary for that graph while formatter and editor
 * queries remain TypeScript-owned (ADR 0078).
 */
export type BootstrapResult<A, E> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: E };

export type BootstrapSuggestion = {
  title: string;
  start: number;
  end: number;
  replaceWith: string;
};

/** Mochi `Option<string>` as the seed emits it. */
export type BootstrapHelp = { _tag: "Some"; value: string } | { _tag: "None" };

export type BootstrapDiagnostic = {
  message: string;
  start: number;
  end: number;
  path?: string;
  kind?: string;
  help?: BootstrapHelp;
  suggestions?: BootstrapSuggestion[];
};

export type BootstrapModuleOutput = { path: string; js: string };
/** Who a recorded binder span names (ADR 0119), as `SymbolInfo` does for the TS table. */
export type BootstrapBinderSym = {
  kind: "let" | "parameter" | "property" | "extern";
  name: string;
  doc: BootstrapHelp;
};
export type BootstrapTypeAt = {
  span: { start: number; end: number };
  ty: unknown;
  display: string;
  /** Set where a name is bound (or a field read); `None` on other nodes. */
  sym: { _tag: "Some"; value: BootstrapBinderSym } | { _tag: "None" };
};
export type BootstrapInferResult = {
  env: Map<string, unknown>;
  types: BootstrapTypeAt[];
  aliases: Map<string, unknown>;
  letParams: unknown[];
};
/** A generalized type as the seed builds it: quantified var ids and the type. */
export type BootstrapScheme = { vars: number[]; rvars: number[]; ty: unknown };

/** An `import * as` scope: the type names it puts in type position. */
export type BootstrapQualScope = { types: ReadonlySet<string> };

export type BootstrapGraphInferOutput = {
  path: string;
  types: BootstrapTypeAt[];
  aliases: Map<string, unknown>;
  /** The scheme each named import binds, constructors included. */
  imports: Map<string, BootstrapScheme>;
  /** Each `import * as` alias's scope. */
  quals: Map<string, BootstrapQualScope>;
};
export type BootstrapGraphInferState = { outputs: BootstrapGraphInferOutput[] };
export type BootstrapRecoveryGraphState = { ctx: unknown; errors: BootstrapDiagnostic[] };
/** A declaration site: its file and name span. */
export type BootstrapLoc = { path: string; start: number; end: number };
/** A module's export sites per symbol space; a variant's ctors are also values. */
export type BootstrapExportOrigins = {
  values: Map<string, BootstrapLoc>;
  types: Map<string, BootstrapLoc>;
  ctors: Map<string, BootstrapLoc>;
};
/** Builtin defs in the host's virtual prelude; `members` keyed `Ns.member`. */
export type BootstrapPrelude = {
  origins: BootstrapExportOrigins;
  members: Map<string, BootstrapLoc>;
};
/** One def or use from the full symbol index (`bootstrap/symbols.mochi`). */
export type BootstrapSymOccurrence = {
  name: string;
  space: "value" | "type" | "ctor" | "field";
  defPath: string;
  defStart: number;
  defEnd: number;
  start: number;
  end: number;
  role: "def" | "use";
};
/** One local scope: the value binders it introduces, live across `start..end` (ADR 0120). */
export type BootstrapScopeFrame = { start: number; end: number; binds: Map<string, BootstrapLoc> };
/** A file's symbol index: occurrences in walk order, its module scope, and its local scopes. */
export type BootstrapSymbolIndex = {
  occurrences: BootstrapSymOccurrence[];
  top: BootstrapExportOrigins;
  fields: Map<string, BootstrapLoc>;
  frames: BootstrapScopeFrame[];
};
/** One lexical def/use occurrence recovered by the bootstrap symbol pass. */
export type BootstrapOccurrence = {
  name: string;
  defStart: number;
  defEnd: number;
  start: number;
  end: number;
  role: string;
};
/** One dependency-ordered source module parsed by the frozen bootstrap graph. */
export type BootstrapParsedModule = {
  path: string;
  src: string;
  stmts: Array<{ _tag?: string; from?: string }>;
  origins: BootstrapExportOrigins;
};

/** A top-level statement, as far as the graph walks read it. */
type GraphStmt = { _tag?: string; from?: string };

/** A strict parse of one module's source: its statements, or the lex/parse error. */
type ParsedSource = BootstrapResult<GraphStmt[], BootstrapDiagnostic>;

/** A recovering parse of one module's source. */
type RecoveredSource = BootstrapResult<
  { stmts: Array<{ _tag?: string; from?: string }>; diagnostics: BootstrapDiagnostic[] },
  BootstrapDiagnostic
>;

/**
 * Caller-owned memo for bootstrap graph type queries. `entries` is keyed by the
 * exact dependency-ordered source graph; `modules` holds one inferred slice per
 * module, keyed by its source and its imports' keys (ADR 0111), so a changed
 * dependency misses without a separate invalidation API and sibling entries
 * share every module they have in common. `parses` is keyed by path and source.
 * A cache is only valid for the one plugin list it was filled under.
 */
export type BootstrapGraphCache = {
  entries: Map<string, BootstrapResult<BootstrapGraphInferOutput[], BootstrapDiagnostic>>;
  modules: Map<string, BootstrapResult<BootstrapGraphInferState, BootstrapDiagnostic>>;
  parses: Map<string, ParsedSource>;
};

export const createBootstrapGraphCache = (): BootstrapGraphCache => ({
  entries: new Map(),
  modules: new Map(),
  parses: new Map(),
});

/** Caller-owned memo for strict and recovering bootstrap graph diagnostics. */
export type BootstrapRecoveryGraphCache = {
  types: BootstrapGraphCache;
  entries: Map<string, BootstrapDiagnostic[]>;
  modules: Map<string, BootstrapRecoveryGraphState>;
  parses: Map<string, RecoveredSource>;
};

export const createBootstrapRecoveryGraphCache = (): BootstrapRecoveryGraphCache => ({
  types: createBootstrapGraphCache(),
  entries: new Map(),
  modules: new Map(),
  parses: new Map(),
});

/** Memo key for one module's parse. */
const parseKey = (path: string, src: string): string => JSON.stringify([path, src]);

/** The resolver both graph walks use: `.mochi` siblings, then package exports. */
const graphResolver = async (): Promise<(from: string, spec: string) => string> => {
  const { createRequire } = await import("node:module");
  const { dirname, resolve } = await import("node:path");
  return (from, spec) => {
    if (spec.startsWith(".") || spec.startsWith("/"))
      return resolve(dirname(from), `${spec.replace(/\.mochi$/, "")}.mochi`);
    try {
      return createRequire(from).resolve(spec);
    } catch {
      return resolve(dirname(from), `${spec}.mochi`);
    }
  };
};

/** The module path an `import … from spec` in `from` resolves to, as the bootstrap graph resolves it. */
export const resolveImportBootstrap = async (from: string, spec: string): Promise<string> =>
  (await graphResolver())(from, spec);

/** The paths a module's `import` statements resolve to. */
const importsOf = (
  path: string,
  stmts: readonly GraphStmt[],
  resolveImport: (from: string, spec: string) => string,
): string[] =>
  stmts
    .filter((stmt) => stmt._tag === "SImport" || stmt._tag === "SImportNs")
    .map((stmt) => resolveImport(path, stmt.from!));

export type BootstrapCore = {
  compile: (src: string) => BootstrapResult<string, BootstrapDiagnostic[]>;
  compileTs: (src: string, runtimeImport: string) => BootstrapResult<string, BootstrapDiagnostic[]>;
  buildModules: (entry: string) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic[]>;
  buildModulesTs: (
    entry: string,
    runtimeImport: string,
  ) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic[]>;
  /** Parse the entry and every dependency through the frozen bootstrap graph. */
  loadGraph: (
    entry: string,
    src: string,
    readFile: (path: string) => Promise<string>,
    plugins?: readonly BootstrapPlugin[],
  ) => Promise<BootstrapResult<BootstrapParsedModule[], BootstrapDiagnostic>>;
  /** Infer source spans through the bootstrap graph with the entry served from an editor buffer. */
  inferGraphTypes: (
    entry: string,
    src: string,
    readFile: (path: string) => Promise<string>,
    cache?: BootstrapGraphCache,
    plugins?: readonly BootstrapPlugin[],
  ) => Promise<BootstrapResult<BootstrapGraphInferOutput[], BootstrapDiagnostic>>;
  /** Check a graph using seed lexer/parser/infer, with the entry served from an editor buffer. */
  checkGraph: (
    entry: string,
    src: string,
    readFile: (path: string) => Promise<string>,
    plugins?: readonly BootstrapPlugin[],
  ) => Promise<BootstrapResult<undefined, BootstrapDiagnostic[]>>;
};

import {
  type BootstrapGraphModule,
  buildModulesBootstrap,
  buildModulesTsBootstrap,
  compileGraphBootstrap,
  exportedOriginsBootstrap,
  freshInferGraphStateBootstrap,
  freshRecoveryGraphStateBootstrap,
  inferGraphTypesFromBootstrap,
  inferSliceOfBootstrap,
  mergeInferStatesBootstrap,
  mergeRecoveryStatesBootstrap,
  recoverModuleBootstrap,
  recoverySliceOfBootstrap,
} from "./module.ts";
import { closures, moduleKeys } from "./slices.ts";
import { compileBootstrapSync, compileTsBootstrapSync, inferTypesBootstrapSync } from "./sync.ts";

export {
  emitDtsBootstrap,
  emitDtsForFileBootstrap,
  exportedOriginsBootstrap,
  inferGraphTypesBootstrap,
  symbolIndexBootstrap,
  symbolOccurrencesBootstrap,
} from "./module.ts";
export {
  checkBootstrapSync,
  inferTypesBootstrapSync,
  inferTypesRecoveringBootstrapSync,
  nominalTypeNameBootstrap,
} from "./sync.ts";

import { type BootstrapPlugin, toSeedPlugins } from "./options.ts";
import {
  lex as bootstrapLex,
  parseRecovering as bootstrapParseRecovering,
  parseWith as bootstrapParseWith,
} from "./syntax.ts";

/** A parsed graph module and the paths its imports resolve to. */
type LoadedModule = BootstrapParsedModule & { deps: string[] };

const stampStrictParse = (parsed: ParsedSource): ParsedSource =>
  parsed._tag === "Err" ? { _tag: "Err", error: { ...parsed.error, kind: "parse" } } : parsed;

/** Strict lex + parse of one module, through `parses` when given. */
const parseSource = (
  path: string,
  text: string,
  plugins: readonly BootstrapPlugin[] | undefined,
  parses: Map<string, ParsedSource> | undefined,
): ParsedSource => {
  const key = parseKey(path, text);
  const hit = parses?.get(key);
  if (hit) return hit;
  const lexed = bootstrapLex(text) as
    | { _tag: "Ok"; value: unknown }
    | { _tag: "Err"; error: BootstrapDiagnostic };
  // Stamp the seed's lex/parse errors with their stage, as `recoverSource` does.
  const parsed: ParsedSource =
    lexed._tag === "Err"
      ? { _tag: "Err", error: { ...lexed.error, kind: "lex" } }
      : stampStrictParse(bootstrapParseWith(lexed.value, toSeedPlugins(plugins)) as ParsedSource);
  parses?.set(key, parsed);
  return parsed;
};

/** Dependency-ordered strict parse of `entry`'s graph, the entry served from `src`. */
const loadGraphWith = async (
  entry: string,
  src: string,
  readFile: (path: string) => Promise<string>,
  plugins: readonly BootstrapPlugin[] | undefined,
  parses: Map<string, ParsedSource> | undefined,
): Promise<BootstrapResult<LoadedModule[], BootstrapDiagnostic>> => {
  const { resolve } = await import("node:path");
  const resolveImport = await graphResolver();
  const entryPath = resolve(entry);
  const loaded = new Map<string, LoadedModule>();
  const visiting = new Set<string>();
  const read = (path: string): Promise<string> =>
    resolve(path) === entryPath ? Promise.resolve(src) : readFile(path);
  const visit = async (path: string): Promise<BootstrapDiagnostic | null> => {
    const abs = resolve(path);
    if (loaded.has(abs)) return null;
    if (visiting.has(abs))
      return { kind: "check", message: `import cycle through '${abs}'`, start: 0, end: 0 };
    visiting.add(abs);
    let text: string;
    try {
      text = await read(abs);
    } catch {
      return { kind: "check", message: `cannot read module '${abs}'`, start: 0, end: 0 };
    }
    const parsed = parseSource(abs, text, plugins, parses);
    if (parsed._tag === "Err") return parsed.error;
    const deps = importsOf(abs, parsed.value, resolveImport);
    for (const dep of deps) {
      const error = await visit(dep);
      if (error) return error;
    }
    visiting.delete(abs);
    loaded.set(abs, {
      path: abs,
      src: text,
      stmts: parsed.value,
      origins: exportedOriginsBootstrap(abs, parsed.value),
      deps,
    });
    return null;
  };
  const loadError = await visit(entryPath);
  return loadError
    ? { _tag: "Err", error: loadError }
    : { _tag: "Ok", value: [...loaded.values()] };
};

/**
 * Infer a dependency-ordered graph one module at a time, each over a state
 * rebuilt from its imports' cached slices (ADR 0111). The first failing module
 * in graph order is the result, as the one-pass fold reported it.
 */
const inferGraphSlices = (
  graph: readonly LoadedModule[],
  plugins: readonly BootstrapPlugin[] | undefined,
  modules: BootstrapGraphCache["modules"] | undefined,
): BootstrapResult<BootstrapGraphInferOutput[], BootstrapDiagnostic> => {
  const keys = moduleKeys(graph, () => "");
  const below = closures(graph);
  const slices = new Map<string, BootstrapGraphInferState>();
  for (const module of graph) {
    const key = keys.get(module.path)!;
    let slice = modules?.get(key);
    if (!slice) {
      const base = (below.get(module.path) ?? []).reduce(
        (state, dep) => mergeInferStatesBootstrap(state, slices.get(dep)!),
        freshInferGraphStateBootstrap(),
      );
      const next = inferGraphTypesFromBootstrap(base, [module], plugins);
      slice =
        next._tag === "Err"
          ? next
          : { _tag: "Ok", value: inferSliceOfBootstrap(next.value, module.path) };
      modules?.set(key, slice);
    }
    if (slice._tag === "Err") return slice;
    slices.set(module.path, slice.value);
  }
  return {
    _tag: "Ok",
    value: graph.flatMap((module) => slices.get(module.path)!.outputs),
  };
};

/**
 * Load the frozen stage-1 graph on demand.
 *
 * The generated graph is checked by ADR 0090's strict-TS north star, but the
 * workspace deliberately adds `noUncheckedIndexedAccess`. Loading it through
 * this typed boundary prevents that stronger host policy from becoming an
 * accidental requirement of the emitted artifact.
 */
export const loadBootstrapCore = async (): Promise<BootstrapCore> => {
  const distance = (a: string, b: string): number => {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let diagonal = row[0]!;
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const above = row[j]!;
        row[j] = a[i - 1] === b[j - 1] ? diagonal : 1 + Math.min(diagonal, above, row[j - 1]!);
        diagonal = above;
      }
    }
    return row[b.length]!;
  };
  const enrich = (error: BootstrapDiagnostic, source: string): BootstrapDiagnostic => {
    const name = /unbound variable '([^']+)'/.exec(error.message)?.[1];
    if (!name) return error;
    const names = [...source.matchAll(/\b[A-Za-z_][A-Za-z0-9_]*\b/g)]
      .map((match) => match[0]!)
      .filter((candidate, index, all) => candidate !== name && all.indexOf(candidate) === index)
      .map((candidate) => ({ candidate, score: distance(name, candidate) }))
      .filter(({ score }) => score <= Math.max(2, Math.floor(name.length / 3)))
      .sort((a, b) => a.score - b.score);
    const best = names[0];
    return best
      ? {
          ...error,
          suggestions: [
            {
              title: `Did you mean '${best.candidate}'?`,
              start: error.start,
              end: error.end,
              replaceWith: best.candidate,
            },
          ],
        }
      : error;
  };

  const loadGraph = (
    entry: string,
    src: string,
    readFile: (path: string) => Promise<string>,
    plugins?: readonly BootstrapPlugin[],
    parses?: Map<string, ParsedSource>,
  ): Promise<BootstrapResult<LoadedModule[], BootstrapDiagnostic>> =>
    loadGraphWith(entry, src, readFile, plugins, parses);

  const inferGraphTypes = async (
    entry: string,
    src: string,
    readFile: (path: string) => Promise<string>,
    cache?: BootstrapGraphCache,
    plugins?: readonly BootstrapPlugin[],
  ): Promise<BootstrapResult<BootstrapGraphInferOutput[], BootstrapDiagnostic>> => {
    const loaded = await loadGraph(entry, src, readFile, plugins, cache?.parses);
    if (loaded._tag === "Err") return loaded;
    const graphKey = JSON.stringify(loaded.value.map(({ path, src: source }) => [path, source]));
    const cached = cache?.entries.get(graphKey);
    if (cached) return cached;
    const entryPath = await import("node:path").then(({ resolve }) => resolve(entry));
    const entryStmts = loaded.value.find((module) => module.path === entryPath)?.stmts ?? [];
    let result: BootstrapResult<BootstrapGraphInferOutput[], BootstrapDiagnostic>;
    if (!entryStmts.some((stmt) => stmt._tag === "SImport" || stmt._tag === "SImportNs")) {
      const inferred = inferTypesBootstrapSync(src, plugins);
      result =
        inferred._tag === "Err"
          ? { _tag: "Err", error: inferred.error[0]! }
          : {
              _tag: "Ok",
              value: [
                {
                  path: entryPath,
                  types: inferred.value.types,
                  aliases: inferred.value.aliases,
                  imports: new Map(),
                  quals: new Map(),
                },
              ],
            };
    } else {
      result = inferGraphSlices(loaded.value, plugins, cache?.modules);
    }
    cache?.entries.set(graphKey, result);
    return result;
  };

  const checkGraph: BootstrapCore["checkGraph"] = async (entry, src, readFile, plugins) => {
    const loaded = await loadGraph(entry, src, readFile, plugins);
    if (loaded._tag === "Err") return { _tag: "Err", error: [loaded.error] };
    const result = compileGraphBootstrap(loaded.value, plugins);
    return result._tag === "Ok"
      ? { _tag: "Ok", value: undefined }
      : {
          _tag: "Err",
          error: result.error.map((error) => enrich(decodeModulePath(error), src)),
        };
  };

  return {
    compile: compileBootstrapSync,
    compileTs: compileTsBootstrapSync,
    buildModules: buildModulesBootstrap,
    buildModulesTs: buildModulesTsBootstrap,
    loadGraph,
    inferGraphTypes,
    checkGraph,
  };
};

/**
 * Graph diagnostics are tagged `module '<path>': <message>` by the driver, so
 * a caller can tell which module failed. Editors want the bare message plus a
 * `path`, which is the shape every other façade query already returns.
 */
const decodeModulePath = (error: BootstrapDiagnostic): BootstrapDiagnostic => {
  const tagged = /^module '([^']+)': (.*)$/.exec(error.message);
  return tagged ? { ...error, path: tagged[1], message: tagged[2]! } : error;
};

/**
 * Dependency-ordered bootstrap parse graph for host query façades. `plugins`
 * means what it does in `BootstrapOptions` (ADR 0109); a cache is only valid
 * for the one plugin list it was filled under.
 */
export const loadBootstrapGraph = async (
  entry: string,
  src: string,
  readFile: (path: string) => Promise<string>,
  plugins?: readonly BootstrapPlugin[],
): Promise<BootstrapResult<BootstrapParsedModule[], BootstrapDiagnostic>> =>
  (await loadBootstrapCore()).loadGraph(entry, src, readFile, plugins);

/** Narrow graph-checking seam for editor integrations: every type error of
 * the first failing module (ADR 0004). */
export const checkGraphBootstrap = async (
  entry: string,
  src: string,
  readFile: (path: string) => Promise<string>,
  plugins?: readonly BootstrapPlugin[],
): Promise<BootstrapResult<undefined, BootstrapDiagnostic[]>> =>
  (await loadBootstrapCore()).checkGraph(entry, src, readFile, plugins);

/** Graph typed-query seam for editor integrations. */
export const inferEntryGraphTypesBootstrap = async (
  entry: string,
  src: string,
  readFile: (path: string) => Promise<string>,
  cache?: BootstrapGraphCache,
  plugins?: readonly BootstrapPlugin[],
): Promise<BootstrapResult<BootstrapGraphInferOutput[], BootstrapDiagnostic>> =>
  (await loadBootstrapCore()).inferGraphTypes(entry, src, readFile, cache, plugins);

/** Recovering lex + parse of one module, through `parses` when given. */
type RecoveredParse = {
  stmts: Array<{ _tag?: string; from?: string }>;
  diagnostics: BootstrapDiagnostic[];
};

const stampParse = (parsed: unknown): RecoveredParse => {
  const { stmts, diagnostics } = parsed as RecoveredParse;
  return { stmts, diagnostics: diagnostics.map((d) => ({ ...d, kind: "parse" })) };
};

const recoverSource = (
  path: string,
  text: string,
  plugins: readonly BootstrapPlugin[] | undefined,
  parses: Map<string, RecoveredSource> | undefined,
): RecoveredSource => {
  const key = parseKey(path, text);
  const hit = parses?.get(key);
  if (hit) return hit;
  const lexed = bootstrapLex(text) as
    | { _tag: "Ok"; value: unknown }
    | { _tag: "Err"; error: BootstrapDiagnostic };
  // The seed's lex and parse errors carry no `kind`; stamp them, as
  // `compile.mochi`'s `frontend` does, so the editor labels them `lex:`/`parse:`.
  const recovered: RecoveredSource =
    lexed._tag === "Err"
      ? { _tag: "Err", error: { ...lexed.error, kind: "lex" } }
      : {
          _tag: "Ok",
          value: stampParse(bootstrapParseRecovering(lexed.value, toSeedPlugins(plugins))),
        };
  parses?.set(key, recovered);
  return recovered;
};

/** A graph module and the paths its imports resolve to. */
type RecoveryModule = BootstrapGraphModule & { deps: string[] };

/**
 * Recover a dependency-ordered graph one module at a time, each over a state
 * rebuilt from its imports' cached slices (ADR 0111). A slice's `errors` are
 * the ones its own module added, so concatenating them in graph order is the
 * one-pass fold's error list.
 */
const recoverGraphSlices = (
  graph: readonly RecoveryModule[],
  entryPath: string,
  plugins: readonly BootstrapPlugin[] | undefined,
  modules: BootstrapRecoveryGraphCache["modules"] | undefined,
): BootstrapDiagnostic[] => {
  const keys = moduleKeys(graph, (node) => (node.path === entryPath ? "entry" : "dep"));
  const below = closures(graph);
  const slices = new Map<string, BootstrapRecoveryGraphState>();
  for (const module of graph) {
    const key = keys.get(module.path)!;
    let slice = modules?.get(key);
    if (!slice) {
      const base = (below.get(module.path) ?? []).reduce(
        (state, dep) => mergeRecoveryStatesBootstrap(state, slices.get(dep)!),
        freshRecoveryGraphStateBootstrap(),
      );
      const next = recoverModuleBootstrap(base, module, module.path === entryPath, plugins);
      slice = {
        ...recoverySliceOfBootstrap(next, module.path),
        errors: next.errors.slice(base.errors.length),
      };
      modules?.set(key, slice);
    }
    slices.set(module.path, slice);
  }
  return graph.flatMap((module) => slices.get(module.path)!.errors);
};

/** Graph check seam that preserves every recoverable parse diagnostic in the entry buffer. */
export const checkGraphBootstrapRecovering = async (
  entry: string,
  src: string,
  readFile: (path: string) => Promise<string>,
  cache?: BootstrapRecoveryGraphCache,
  plugins?: readonly BootstrapPlugin[],
): Promise<BootstrapDiagnostic[]> => {
  const { resolve } = await import("node:path");
  const resolveImport = await graphResolver();
  const entryPath = resolve(entry);
  const entryParsed = recoverSource(entryPath, src, plugins, cache?.parses);
  if (entryParsed._tag === "Err") return [entryParsed.error];
  if (entryParsed.value.diagnostics.length > 0) return entryParsed.value.diagnostics;

  const visiting = new Set<string>();
  const loaded = new Map<string, RecoveryModule>();
  const dependencyErrors: BootstrapDiagnostic[] = [];
  const visit = async (modulePath: string): Promise<void> => {
    const absolute = resolve(modulePath);
    if (loaded.has(absolute)) return;
    if (visiting.has(absolute)) {
      dependencyErrors.push({
        kind: "check",
        message: `import cycle through '${absolute}'`,
        start: 0,
        end: 0,
        path: absolute,
      });
      return;
    }
    visiting.add(absolute);
    let source: string;
    try {
      source = absolute === entryPath ? src : await readFile(absolute);
    } catch {
      dependencyErrors.push({
        kind: "check",
        message: `cannot read module '${absolute}'`,
        start: 0,
        end: 0,
        path: absolute,
      });
      visiting.delete(absolute);
      return;
    }
    const parsed = recoverSource(absolute, source, plugins, cache?.parses);
    if (parsed._tag === "Err") {
      dependencyErrors.push({ ...parsed.error, path: absolute });
      visiting.delete(absolute);
      return;
    }
    for (const error of parsed.value.diagnostics)
      dependencyErrors.push({ ...error, path: absolute });
    const deps = importsOf(absolute, parsed.value.stmts, resolveImport);
    for (const dep of deps) await visit(dep);
    visiting.delete(absolute);
    loaded.set(absolute, { path: absolute, src: source, stmts: parsed.value.stmts, deps });
  };
  await visit(entry);
  if (dependencyErrors.length > 0) return dependencyErrors;
  const entryModule = loaded.get(entryPath);
  if (!entryModule)
    return [{ kind: "check", message: `cannot read module '${entry}'`, start: 0, end: 0 }];
  if (entryModule.deps.length === 0) {
    const strict = await checkGraphBootstrap(entry, src, readFile, plugins);
    return strict._tag === "Ok" ? [] : strict.error;
  }
  const graph = [...loaded.values()];
  const graphKey = JSON.stringify(graph.map(({ path, src: source }) => [path, source]));
  const cached = cache?.entries.get(graphKey);
  if (cached) return cached;
  const strict = await inferEntryGraphTypesBootstrap(entry, src, readFile, cache?.types, plugins);
  const strictErrors = strict._tag === "Err" ? [decodeModulePath(strict.error)] : [];
  const recoveredErrors = recoverGraphSlices(graph, entryPath, plugins, cache?.modules).map(
    decodeModulePath,
  );
  const seen = new Set<string>();
  const errors = [...strictErrors, ...recoveredErrors].filter((error) => {
    const key = `${error.path ?? ""}:${error.start}:${error.end}:${error.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  cache?.entries.set(graphKey, errors);
  return errors;
};
