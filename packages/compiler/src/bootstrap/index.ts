/**
 * The executable self-hosted compiler core (ADR 0090).
 *
 * `bootstrap/seed/` is a manifest-verified TypeScript graph emitted from
 * `bootstrap/*.mochi`; it is not an authoring surface. This module gives host
 * tools one explicit import boundary for that graph while formatter and editor
 * queries remain TypeScript-owned (ADR 0078).
 */
export type BootstrapResult<A, E> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: E };

export type BootstrapDiagnostic = {
  message: string;
  start: number;
  end: number;
  path?: string;
  suggestions?: Array<{ title: string; start: number; end: number; replaceWith: string }>;
};

export type BootstrapModuleOutput = { path: string; js: string };

export type BootstrapCore = {
  compile: (src: string) => BootstrapResult<string, BootstrapDiagnostic>;
  compileTs: (src: string, runtimeImport: string) => BootstrapResult<string, BootstrapDiagnostic>;
  buildModules: (entry: string) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic>;
  buildModulesTs: (
    entry: string,
    runtimeImport: string,
  ) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic>;
  /** Check a graph using seed lexer/parser/infer, with the entry served from an editor buffer. */
  checkGraph: (
    entry: string,
    src: string,
    readFile: (path: string) => Promise<string>,
  ) => Promise<BootstrapResult<undefined, BootstrapDiagnostic>>;
};

import {
  buildModulesBootstrap,
  buildModulesTsBootstrap,
  compileGraphBootstrap,
  compileGraphBootstrapRecovering,
} from "./module.ts";
import { compileBootstrapSync, compileTsBootstrapSync } from "./sync.ts";
import {
  lex as bootstrapLex,
  parse as bootstrapParse,
  parseRecovering as bootstrapParseRecovering,
} from "./syntax.ts";

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

  const checkGraph: BootstrapCore["checkGraph"] = async (entry, src, readFile) => {
    const entryPath = await import("node:path").then(({ resolve }) => resolve(entry));
    const { createRequire } = await import("node:module");
    const { dirname, resolve } = await import("node:path");
    const loaded = new Map<
      string,
      { path: string; stmts: Array<{ _tag?: string; from?: string }> }
    >();
    const visiting = new Set<string>();
    const read = (path: string): Promise<string> =>
      resolve(path) === entryPath ? Promise.resolve(src) : readFile(path);
    const resolveImport = (from: string, spec: string): string => {
      const pathLike = spec.startsWith(".") || spec.startsWith("/");
      if (pathLike) return resolve(dirname(from), `${spec.replace(/\.mochi$/, "")}.mochi`);
      try {
        return createRequire(from).resolve(spec);
      } catch {
        return resolve(dirname(from), `${spec}.mochi`);
      }
    };
    const visit = async (path: string): Promise<BootstrapDiagnostic | null> => {
      const abs = resolve(path);
      if (loaded.has(abs)) return null;
      if (visiting.has(abs)) return { message: `import cycle through '${abs}'`, start: 0, end: 0 };
      visiting.add(abs);
      let text: string;
      try {
        text = await read(abs);
      } catch {
        return { message: `cannot read module '${abs}'`, start: 0, end: 0 };
      }
      const lexed = bootstrapLex(text) as {
        _tag: "Ok" | "Err";
        value: Array<unknown>;
        error: BootstrapDiagnostic;
      };
      if (lexed._tag === "Err") return lexed.error;
      const parsed = bootstrapParse(lexed.value) as {
        _tag: "Ok" | "Err";
        value: Array<{ _tag?: string; from?: string }>;
        error: BootstrapDiagnostic;
      };
      if (parsed._tag === "Err") return parsed.error;
      for (const stmt of parsed.value as Array<{ _tag?: string; from?: string }>) {
        if (stmt._tag !== "SImport" && stmt._tag !== "SImportNs") continue;
        const error = await visit(resolveImport(abs, stmt.from!));
        if (error) return error;
      }
      visiting.delete(abs);
      loaded.set(abs, { path: abs, stmts: parsed.value });
      return null;
    };
    const loadError = await visit(entryPath);
    if (loadError) return { _tag: "Err", error: loadError };
    const entryStmts = loaded.get(entryPath)?.stmts ?? [];
    // The bootstrap graph driver deliberately runs open-world (its CLI can
    // link host globals). For an import-free editor buffer, use the strict
    // single-file railway so misspelled local names still become diagnostics.
    if (!entryStmts.some((stmt) => stmt._tag === "SImport" || stmt._tag === "SImportNs")) {
      const strict = compileBootstrapSync(src);
      return strict._tag === "Ok"
        ? { _tag: "Ok", value: undefined }
        : { _tag: "Err", error: enrich(strict.error, src) };
    }
    const result = compileGraphBootstrap([...loaded.values()]);
    return result._tag === "Ok"
      ? { _tag: "Ok", value: undefined }
      : { _tag: "Err", error: enrich(result.error, src) };
  };

  return {
    compile: compileBootstrapSync,
    compileTs: compileTsBootstrapSync,
    buildModules: buildModulesBootstrap,
    buildModulesTs: buildModulesTsBootstrap,
    checkGraph,
  };
};

/** Narrow graph-checking seam for editor integrations. */
export const checkGraphBootstrap = async (
  entry: string,
  src: string,
  readFile: (path: string) => Promise<string>,
): Promise<BootstrapResult<undefined, BootstrapDiagnostic>> =>
  (await loadBootstrapCore()).checkGraph(entry, src, readFile);

/** Graph check seam that preserves every recoverable parse diagnostic in the entry buffer. */
export const checkGraphBootstrapRecovering = async (
  entry: string,
  src: string,
  readFile: (path: string) => Promise<string>,
): Promise<BootstrapDiagnostic[]> => {
  const lexed = bootstrapLex(src) as
    | { _tag: "Ok"; value: unknown }
    | { _tag: "Err"; error: BootstrapDiagnostic };
  if (lexed._tag === "Err") return [lexed.error];
  const recovered = bootstrapParseRecovering(lexed.value, { _tag: "None" }) as {
    stmts: Array<{ _tag?: string; from?: string }>;
    diagnostics: BootstrapDiagnostic[];
  };
  if (recovered.diagnostics.length > 0) return recovered.diagnostics;

  const { createRequire } = await import("node:module");
  const { dirname, resolve } = await import("node:path");
  const entryPath = resolve(entry);
  const resolveGraphImport = (from: string, spec: string): string => {
    if (spec.startsWith(".") || spec.startsWith("/"))
      return resolve(dirname(from), `${spec.replace(/\.mochi$/, "")}.mochi`);
    try {
      return createRequire(from).resolve(spec);
    } catch {
      return resolve(dirname(from), `${spec}.mochi`);
    }
  };
  const visiting = new Set<string>();
  const loaded = new Map<
    string,
    { source: string; stmts: Array<{ _tag?: string; from?: string }> }
  >();
  const dependencyErrors: BootstrapDiagnostic[] = [];
  const visit = async (modulePath: string): Promise<void> => {
    const absolute = resolve(modulePath);
    if (loaded.has(absolute)) return;
    if (visiting.has(absolute)) {
      dependencyErrors.push({
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
        message: `cannot read module '${absolute}'`,
        start: 0,
        end: 0,
        path: absolute,
      });
      visiting.delete(absolute);
      return;
    }
    const dependencyLexed = bootstrapLex(source) as
      | { _tag: "Ok"; value: unknown }
      | { _tag: "Err"; error: BootstrapDiagnostic };
    if (dependencyLexed._tag === "Err") {
      dependencyErrors.push({ ...dependencyLexed.error, path: absolute });
      visiting.delete(absolute);
      return;
    }
    const dependencyParsed = bootstrapParseRecovering(dependencyLexed.value, { _tag: "None" }) as {
      stmts: Array<{ _tag?: string; from?: string }>;
      diagnostics: BootstrapDiagnostic[];
    };
    for (const error of dependencyParsed.diagnostics)
      dependencyErrors.push({ ...error, path: absolute });
    for (const statement of dependencyParsed.stmts) {
      if (statement._tag !== "SImport" && statement._tag !== "SImportNs") continue;
      await visit(resolveGraphImport(absolute, statement.from!));
    }
    visiting.delete(absolute);
    loaded.set(absolute, { source, stmts: dependencyParsed.stmts });
  };
  await visit(entry);
  if (dependencyErrors.length > 0) return dependencyErrors;
  const entryModule = loaded.get(entryPath);
  if (!entryModule) return [{ message: `cannot read module '${entry}'`, start: 0, end: 0 }];
  if (
    !entryModule.stmts.some(
      (statement) => statement._tag === "SImport" || statement._tag === "SImportNs",
    )
  ) {
    const strict = await checkGraphBootstrap(entry, src, readFile);
    return strict._tag === "Ok" ? [] : [strict.error];
  }
  const checked = compileGraphBootstrapRecovering(
    [...loaded.entries()].map(([path, module]) => ({ path, stmts: module.stmts })),
  );
  return checked.errors.map((error) => {
    const tagged = /^module '([^']+)': (.*)$/.exec(error.message);
    return tagged ? { ...error, path: tagged[1], message: tagged[2]! } : error;
  });
};
