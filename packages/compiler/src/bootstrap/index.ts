/**
 * The executable self-hosted compiler core (ADR 0090).
 *
 * `bootstrap/seed/` is a manifest-verified TypeScript graph emitted from
 * `bootstrap/*.mochi`; it is not an authoring surface. This module gives host
 * tools one explicit import boundary for that graph while formatter and editor
 * queries remain TypeScript-owned (ADR 0078).
 */
export type BootstrapResult<A, E> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: E };

export type BootstrapDiagnostic = { message: string; start: number; end: number };

export type BootstrapModuleOutput = { path: string; js: string };

export type BootstrapCore = {
  compile: (src: string) => BootstrapResult<string, BootstrapDiagnostic>;
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

/**
 * Load the frozen stage-1 graph on demand.
 *
 * The generated graph is checked by ADR 0090's strict-TS north star, but the
 * workspace deliberately adds `noUncheckedIndexedAccess`. Loading it through
 * this typed boundary prevents that stronger host policy from becoming an
 * accidental requirement of the emitted artifact.
 */
export const loadBootstrapCore = async (): Promise<BootstrapCore> => {
  const root = new URL("../../../../bootstrap/seed/", import.meta.url);
  const [compile, lexer, module, parser] = await Promise.all([
    import(new URL("compile.ts", root).href),
    import(new URL("lexer.ts", root).href),
    import(new URL("module.ts", root).href),
    import(new URL("parser.ts", root).href),
  ]);

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
      const lexed = lexer.lex(text);
      if (lexed._tag === "Err") return lexed.error;
      const parsed = parser.parse(lexed.value);
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
      const strict = compile.compile(src) as BootstrapResult<string, BootstrapDiagnostic>;
      return strict._tag === "Ok" ? { _tag: "Ok", value: undefined } : strict;
    }
    const result = module.compileGraph([...loaded.values()]);
    return result._tag === "Ok" ? { _tag: "Ok", value: undefined } : result;
  };

  return {
    compile: compile.compile as BootstrapCore["compile"],
    buildModules: module.buildModules as BootstrapCore["buildModules"],
    buildModulesTs: module.buildModulesTs as BootstrapCore["buildModulesTs"],
    checkGraph,
  };
};
