import { type InferOk, type Result, ResultAsync } from "@onrails/result";
import type { SeedCompile } from "../../../../bootstrap/seed/compile-host-types";
import type { SeedModule } from "../../../../bootstrap/seed/module-host-types";
import type { Stmt } from "../infer/host-types.ts";
/**
 * The executable self-hosted compiler core (ADR 0090).
 *
 * `bootstrap/seed/` is a manifest-verified TypeScript graph emitted from
 * component-owned Mochi sources; it is not an authoring surface. This module
 * owns editor-buffer graph loading and caches. Host editor adapters remain
 * TypeScript-owned (ADR 0143).
 */

export type CompilerSuggestion = {
  title: string;
  start: number;
  end: number;
  replaceWith: string;
};

/** Mochi `Option<string>` as the seed emits it. */
export type CompilerHelp = { _tag: "Some"; value: string } | { _tag: "None" };

export type CompilerDiagnostic = {
  message: string;
  start: number;
  end: number;
  path?: string;
  kind?: string;
  help?: CompilerHelp;
  suggestions?: CompilerSuggestion[];
};

export type CompilerModuleOutput = { path: string; js: string };
/** Who a recorded binder span names (ADR 0119), as `SymbolInfo` does for the TS table. */
export type CompilerBinderSym = {
  kind: string;
  name: string;
  doc: CompilerHelp;
};
export type CompilerTypeAt = {
  span: { start: number; end: number };
  ty: import("../infer/host-types.ts").Ty;
  display: string;
  /** Set where a name is bound (or a field read); `None` on other nodes. */
  sym: { _tag: "Some"; value: CompilerBinderSym } | { _tag: "None" };
};
export type CompilerInferResult = InferOk<ReturnType<SeedCompile["inferTypesWith"]>>;
/** A generalized type as the seed builds it: quantified var ids and the type. */
export type CompilerScheme = CompilerInferResult["env"] extends Map<string, infer S> ? S : never;

/** An `import * as` scope: the type names it puts in type position. */
export type CompilerQualScope = { types: ReadonlySet<string> };

export type CompilerGraphInferOutput = {
  path: string;
  types: CompilerTypeAt[];
  aliases: Map<string, import("../infer/host-types.ts").AliasInfo>;
  /** The scheme each named import binds, constructors included. */
  imports: Map<string, CompilerScheme>;
  /** Each `import * as` alias's scope. */
  quals: Map<string, CompilerQualScope>;
};
export type CompilerGraphInferState = InferOk<ReturnType<SeedModule["inferGraphTypesFromWith"]>>;
export type CompilerRecoveryGraphState = ReturnType<SeedModule["freshRecoveryGraphState"]>;
/** A declaration site: its file and name span. */
export type CompilerLoc = { path: string; start: number; end: number };
/** A module's export sites per symbol space; a variant's ctors are also values. */
export type CompilerExportOrigins = {
  values: Map<string, CompilerLoc>;
  types: Map<string, CompilerLoc>;
  ctors: Map<string, CompilerLoc>;
};
/** Builtin defs in the host's virtual prelude; `members` keyed `Ns.member`. */
export type CompilerPrelude = {
  origins: CompilerExportOrigins;
  members: Map<string, CompilerLoc>;
};
/** One def or use from the full symbol index (`packages/compiler/src/check/symbols.mochi`). */
export type CompilerSymOccurrence = {
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
export type CompilerScopeFrame = { start: number; end: number; binds: Map<string, CompilerLoc> };
/** A file's symbol index: occurrences in walk order, its module scope, and its local scopes. */
export type CompilerSymbolIndex = {
  occurrences: CompilerSymOccurrence[];
  top: CompilerExportOrigins;
  fields: Map<string, CompilerLoc>;
  frames: CompilerScopeFrame[];
};
/** One lexical def/use occurrence recovered by the bootstrap symbol pass. */
export type CompilerOccurrence = {
  name: string;
  defStart: number;
  defEnd: number;
  start: number;
  end: number;
  role: string;
};
/** One dependency-ordered source module parsed by the frozen bootstrap graph. */
export type CompilerParsedModule = {
  path: string;
  src: string;
  stmts: Stmt[];
  origins: CompilerExportOrigins;
};

/** A top-level statement, as far as the graph walks read it. */
type GraphStmt = Stmt;

/** A strict parse of one module's source: its statements, or the lex/parse error. */
type ParsedSource = Result<GraphStmt[], CompilerDiagnostic>;

/** A recovering parse of one module's source. */
type RecoveredSource = Result<
  { stmts: Stmt[]; diagnostics: CompilerDiagnostic[] },
  CompilerDiagnostic
>;

/**
 * Caller-owned memo for bootstrap graph type queries. `entries` is keyed by the
 * exact dependency-ordered source graph; `modules` holds one inferred slice per
 * module, keyed by its source and its imports' keys (ADR 0111), so a changed
 * dependency misses without a separate invalidation API and sibling entries
 * share every module they have in common. `parses` is keyed by path and source.
 * A cache is only valid for the one plugin list it was filled under.
 */
export type CompilerGraphCache = {
  entries: Map<string, Result<CompilerGraphInferOutput[], CompilerDiagnostic>>;
  modules: Map<string, Result<CompilerGraphInferState, CompilerDiagnostic>>;
  parses: Map<string, ParsedSource>;
};

export const createGraphCache = (): CompilerGraphCache => ({
  entries: new Map(),
  modules: new Map(),
  parses: new Map(),
});

/** Caller-owned memo for strict and recovering bootstrap graph diagnostics. */
export type CompilerRecoveryGraphCache = {
  types: CompilerGraphCache;
  entries: Map<string, CompilerDiagnostic[]>;
  modules: Map<string, CompilerRecoveryGraphState>;
  parses: Map<string, RecoveredSource>;
};

export const createRecoveryGraphCache = (): CompilerRecoveryGraphCache => ({
  types: createGraphCache(),
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
export const resolveImport = async (from: string, spec: string): Promise<string> =>
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

import { inferTypesSync } from "../compile/sync.ts";
import {
  type CompilerGraphModule,
  compileGraph,
  exportedOrigins,
  freshInferGraphState,
  freshRecoveryGraphState,
  inferGraphTypesFrom,
  inferSliceOf,
  mergeInferStates,
  mergeRecoveryStates,
  recoverModule,
  recoverySliceOf,
} from "./host.ts";
import { closures, moduleKeys } from "./slices.ts";

export {
  checkSync,
  inferTypesRecoveringSync,
  inferTypesSync,
  nominalTypeName,
} from "../compile/sync.ts";
export {
  emitDts,
  emitDtsForFile,
  exportedOrigins,
  inferGraphTypes,
  symbolIndex,
  symbolOccurrences,
} from "./host.ts";

import { type CompilerPlugin, toSeedPlugins } from "../extensions/options.ts";
import { lex, parseRecovering, parseWith } from "../parser/syntax.ts";

/** A parsed graph module and the paths its imports resolve to. */
type LoadedModule = CompilerParsedModule & { deps: string[] };

const stampStrictParse = (parsed: ParsedSource): ParsedSource =>
  parsed._tag === "Err" ? { _tag: "Err", error: { ...parsed.error, kind: "parse" } } : parsed;

/** Strict lex + parse of one module, through `parses` when given. */
const parseSource = (
  path: string,
  text: string,
  plugins: readonly CompilerPlugin[] | undefined,
  parses: Map<string, ParsedSource> | undefined,
): ParsedSource => {
  const key = parseKey(path, text);
  const hit = parses?.get(key);
  if (hit) return hit;
  const lexed = lex(text) as
    | { _tag: "Ok"; value: unknown }
    | { _tag: "Err"; error: CompilerDiagnostic };
  // Stamp the seed's lex/parse errors with their stage, as `recoverSource` does.
  const parsed: ParsedSource =
    lexed._tag === "Err"
      ? { _tag: "Err", error: { ...lexed.error, kind: "lex" } }
      : stampStrictParse(parseWith(lexed.value, toSeedPlugins(plugins)) as ParsedSource);
  parses?.set(key, parsed);
  return parsed;
};

/** Dependency-ordered strict parse of `entry`'s graph, the entry served from `src`. */
const loadGraphWith = (
  entry: string,
  src: string,
  readFile: (path: string) => Promise<string>,
  plugins: readonly CompilerPlugin[] | undefined,
  parses: Map<string, ParsedSource> | undefined,
): ResultAsync<LoadedModule[], CompilerDiagnostic> =>
  ResultAsync.defer(async () => {
    const { resolve } = await import("node:path");
    const resolveImport = await graphResolver();
    const entryPath = resolve(entry);
    const loaded = new Map<string, LoadedModule>();
    const visiting = new Set<string>();
    const read = (path: string): Promise<string> =>
      resolve(path) === entryPath ? Promise.resolve(src) : readFile(path);
    const visit = async (path: string): Promise<CompilerDiagnostic | null> => {
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
        origins: exportedOrigins(abs, parsed.value),
        deps,
      });
      return null;
    };
    const loadError = await visit(entryPath);
    return loadError
      ? { _tag: "Err", error: loadError }
      : { _tag: "Ok", value: [...loaded.values()] };
  });

/**
 * Infer a dependency-ordered graph one module at a time, each over a state
 * rebuilt from its imports' cached slices (ADR 0111). The first failing module
 * in graph order is the result, as the one-pass fold reported it.
 */
const inferGraphSlices = (
  graph: readonly LoadedModule[],
  plugins: readonly CompilerPlugin[] | undefined,
  modules: CompilerGraphCache["modules"] | undefined,
): Result<CompilerGraphInferOutput[], CompilerDiagnostic> => {
  const keys = moduleKeys(graph, () => "");
  const below = closures(graph);
  const slices = new Map<string, CompilerGraphInferState>();
  for (const module of graph) {
    const key = keys.get(module.path)!;
    let slice = modules?.get(key);
    if (!slice) {
      const base = (below.get(module.path) ?? []).reduce(
        (state, dep) => mergeInferStates(state, slices.get(dep)!),
        freshInferGraphState(),
      );
      const next = inferGraphTypesFrom(base, [module], plugins);
      slice =
        next._tag === "Err" ? next : { _tag: "Ok", value: inferSliceOf(next.value, module.path) };
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
 * Graph diagnostics are tagged `module '<path>': <message>` by the driver, so
 * a caller can tell which module failed. Editors want the bare message plus a
 * `path`, which is the shape every other façade query already returns.
 */
const decodeModulePath = (error: CompilerDiagnostic): CompilerDiagnostic => {
  const tagged = /^module '([^']+)': (.*)$/.exec(error.message);
  return tagged ? { ...error, path: tagged[1], message: tagged[2]! } : error;
};

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
const enrich = (error: CompilerDiagnostic, source: string): CompilerDiagnostic => {
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

export const inferEntryGraphTypes = (
  entry: string,
  src: string,
  readFile: (path: string) => Promise<string>,
  cache?: CompilerGraphCache,
  plugins?: readonly CompilerPlugin[],
): ResultAsync<CompilerGraphInferOutput[], CompilerDiagnostic> =>
  ResultAsync.defer(async () => {
    const loaded = await loadGraphWith(entry, src, readFile, plugins, cache?.parses);
    if (loaded._tag === "Err") return loaded;
    const graphKey = JSON.stringify(loaded.value.map(({ path, src: source }) => [path, source]));
    const cached = cache?.entries.get(graphKey);
    if (cached) return cached;
    const entryPath = await import("node:path").then(({ resolve }) => resolve(entry));
    const entryStmts = loaded.value.find((module) => module.path === entryPath)?.stmts ?? [];
    let result: Result<CompilerGraphInferOutput[], CompilerDiagnostic>;
    if (!entryStmts.some((stmt) => stmt._tag === "SImport" || stmt._tag === "SImportNs")) {
      const inferred = inferTypesSync(src, plugins);
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
  });

export const checkGraph = (
  entry: string,
  src: string,
  readFile: (path: string) => Promise<string>,
  plugins?: readonly CompilerPlugin[],
): ResultAsync<undefined, CompilerDiagnostic[]> =>
  ResultAsync.defer(async () => {
    const loaded = await loadGraphWith(entry, src, readFile, plugins, undefined);
    if (loaded._tag === "Err") return { _tag: "Err", error: [loaded.error] };
    const result = compileGraph(loaded.value, plugins);
    return result._tag === "Ok"
      ? { _tag: "Ok", value: undefined }
      : {
          _tag: "Err",
          error: result.error.map((error) => enrich(decodeModulePath(error), src)),
        };
  });

/** Dependency-ordered parse graph with the entry served from its editor buffer. */
export const loadGraph = (
  entry: string,
  src: string,
  readFile: (path: string) => Promise<string>,
  plugins?: readonly CompilerPlugin[],
): ResultAsync<CompilerParsedModule[], CompilerDiagnostic> =>
  loadGraphWith(entry, src, readFile, plugins, undefined);

/** Recovering lex + parse of one module, through `parses` when given. */
type RecoveredParse = {
  stmts: Stmt[];
  diagnostics: CompilerDiagnostic[];
};

const stampParse = (parsed: unknown): RecoveredParse => {
  const { stmts, diagnostics } = parsed as RecoveredParse;
  return { stmts, diagnostics: diagnostics.map((d) => ({ ...d, kind: "parse" })) };
};

const recoverSource = (
  path: string,
  text: string,
  plugins: readonly CompilerPlugin[] | undefined,
  parses: Map<string, RecoveredSource> | undefined,
): RecoveredSource => {
  const key = parseKey(path, text);
  const hit = parses?.get(key);
  if (hit) return hit;
  const lexed = lex(text) as
    | { _tag: "Ok"; value: unknown }
    | { _tag: "Err"; error: CompilerDiagnostic };
  // The seed's lex and parse errors carry no `kind`; stamp them, as
  // `compile.mochi`'s `frontend` does, so the editor labels them `lex:`/`parse:`.
  const recovered: RecoveredSource =
    lexed._tag === "Err"
      ? { _tag: "Err", error: { ...lexed.error, kind: "lex" } }
      : {
          _tag: "Ok",
          value: stampParse(parseRecovering(lexed.value, toSeedPlugins(plugins))),
        };
  parses?.set(key, recovered);
  return recovered;
};

/** A graph module and the paths its imports resolve to. */
type RecoveryModule = CompilerGraphModule & { deps: string[] };

/**
 * Recover a dependency-ordered graph one module at a time, each over a state
 * rebuilt from its imports' cached slices (ADR 0111). A slice's `errors` are
 * the ones its own module added, so concatenating them in graph order is the
 * one-pass fold's error list.
 */
const recoverGraphSlices = (
  graph: readonly RecoveryModule[],
  entryPath: string,
  plugins: readonly CompilerPlugin[] | undefined,
  modules: CompilerRecoveryGraphCache["modules"] | undefined,
): CompilerDiagnostic[] => {
  const keys = moduleKeys(graph, (node) => (node.path === entryPath ? "entry" : "dep"));
  const below = closures(graph);
  const slices = new Map<string, CompilerRecoveryGraphState>();
  for (const module of graph) {
    const key = keys.get(module.path)!;
    let slice = modules?.get(key);
    if (!slice) {
      const base = (below.get(module.path) ?? []).reduce(
        (state, dep) => mergeRecoveryStates(state, slices.get(dep)!),
        freshRecoveryGraphState(),
      );
      const next = recoverModule(base, module, module.path === entryPath, plugins);
      slice = {
        ...recoverySliceOf(next, module.path),
        errors: next.errors.slice(base.errors.length),
      };
      modules?.set(key, slice);
    }
    slices.set(module.path, slice);
  }
  return graph.flatMap((module) => slices.get(module.path)!.errors);
};

/** Graph check seam that preserves every recoverable parse diagnostic in the entry buffer. */
export const checkGraphRecovering = async (
  entry: string,
  src: string,
  readFile: (path: string) => Promise<string>,
  cache?: CompilerRecoveryGraphCache,
  plugins?: readonly CompilerPlugin[],
): Promise<CompilerDiagnostic[]> => {
  const { resolve } = await import("node:path");
  const resolveImport = await graphResolver();
  const entryPath = resolve(entry);
  const entryParsed = recoverSource(entryPath, src, plugins, cache?.parses);
  if (entryParsed._tag === "Err") return [entryParsed.error];
  if (entryParsed.value.diagnostics.length > 0) return entryParsed.value.diagnostics;

  const visiting = new Set<string>();
  const loaded = new Map<string, RecoveryModule>();
  const dependencyErrors: CompilerDiagnostic[] = [];
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
    const strict = await checkGraph(entry, src, readFile, plugins);
    return strict._tag === "Ok" ? [] : strict.error;
  }
  const graph = [...loaded.values()];
  const graphKey = JSON.stringify(graph.map(({ path, src: source }) => [path, source]));
  const cached = cache?.entries.get(graphKey);
  if (cached) return cached;
  const strict = await inferEntryGraphTypes(entry, src, readFile, cache?.types, plugins);
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
