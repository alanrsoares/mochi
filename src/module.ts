// Multi-file driver: resolve an `import` graph of `.al` modules, compile each in
// dependency order, and thread every module's EXPORT schemes into the modules
// that import it — so a value crosses a module boundary with its full inferred
// (and possibly polymorphic) type, not an opaque `any`.
//
// This is the seam the "compiler on many cores" idea hangs off: modules with no
// path between them are independent compilation units and could be inferred in
// parallel. We compile them sequentially here; the dependency order is the only
// constraint.
import { dirname, resolve } from "node:path";
import { err, isErr, ok, type Result, ResultAsync } from "@onrails/result";
import type { Program, Stmt } from "./ast";
import { check, exportedRegistry, type Registry } from "./check";
import { codegen, exportedCtorKeys } from "./codegen";
import { DEFAULT_RUNTIME_IMPORT, emitTsModule } from "./codegen-ts";
import { type AlangError, checkErr } from "./errors";
import { type Env, inferProgramTypes, type Scheme } from "./infer";
import { lex } from "./lexer";
import { parse } from "./parser";
import { preludeEnv, preludeNamespaces } from "./prelude";

export type ModuleOutput = { path: string; js: string };
type ReadFile = (path: string) => Promise<string>;

// An import `from` spec resolved to an absolute `.al` path, relative to the
// importer's directory. A trailing `.al` in the spec is optional.
const resolveImport = (importer: string, spec: string): string =>
  resolve(dirname(importer), `${spec.replace(/\.al$/, "")}.al`);

const importsOf = (prog: Program): Extract<Stmt, { kind: "import" }>[] =>
  prog.stmts.filter((s): s is Extract<Stmt, { kind: "import" }> => s.kind === "import");

// The schemes a module makes available: exported `let`/`extern` bindings, and
// the constructors of an exported `type`.
const exportsOf = (prog: Program, env: Env): Env => {
  const out: Env = new Map();
  const take = (name: string): void => {
    const sc = env.get(name);
    if (sc) out.set(name, sc);
  };
  for (const s of prog.stmts) {
    if (s.kind === "import" || !s.exported) continue;
    if (s.kind === "type") for (const c of s.ctors) take(c.name);
    else take(s.name);
  }
  return out;
};

// Parse a file to a Program. Neither `check` nor inference runs here — both
// need this module's imports resolved first, which only happens in
// `compileGraph` once the whole graph is loaded.
const parseModule = (src: string): Result<Program, AlangError> => {
  const lexed = lex(src);
  if (isErr(lexed)) return lexed;
  return parse(lexed.value);
};

type Loaded = { path: string; prog: Program };

// What a module's imports resolve to: export SCHEMES (inference), variant
// REGISTRY (cross-module exhaustiveness), and ctor field KEYS (destructuring).
export type ModuleContext = {
  imports: Env;
  importedReg: Registry;
  importedKeys: Map<string, string[]>;
};

// Collect `prog`'s imported context from the already-compiled deps. A missing
// export is reported against the import site. Shared by the full-graph compile
// and the LSP's dep-only `moduleContext`.
const gatherImports = (
  path: string,
  prog: Program,
  exportsByPath: Map<string, Env>,
  regByPath: Map<string, Registry>,
  keysByPath: Map<string, Map<string, string[]>>,
): Result<ModuleContext, AlangError> => {
  const imports: Env = new Map();
  const importedReg: Registry = { ctor: new Map(), type: new Map() };
  const importedKeys = new Map<string, string[]>();
  for (const imp of importsOf(prog)) {
    const depPath = resolveImport(path, imp.from);
    const depExports = exportsByPath.get(depPath);
    for (const n of imp.names) {
      const sc = depExports?.get(n.name) as Scheme | undefined;
      if (!sc) return err(checkErr(`'${imp.from}' has no export '${n.name}'`, n.span));
      imports.set(n.name, sc);
    }
    const depReg = regByPath.get(depPath);
    if (depReg) {
      for (const [k, v] of depReg.type) importedReg.type.set(k, v);
      for (const [k, v] of depReg.ctor) importedReg.ctor.set(k, v);
    }
    const depKeys = keysByPath.get(depPath);
    if (depKeys) for (const [k, v] of depKeys) importedKeys.set(k, v);
  }
  return ok({ imports, importedReg, importedKeys });
};

// Load the whole graph reachable from `entry`, depth-first, detecting cycles.
// Yields modules in DEPENDENCY ORDER (a module appears after all it imports).
// The async file reads are the reason this half is a ResultAsync.
const loadGraph = (entry: string, readFile: ReadFile): ResultAsync<Loaded[], AlangError> =>
  ResultAsync.defer(async () => {
    const order: Loaded[] = [];
    const state = new Map<string, "loading" | "done">();

    const visit = async (path: string): Promise<AlangError | null> => {
      const st = state.get(path);
      if (st === "done") return null;
      if (st === "loading") return checkErr(`import cycle through '${path}'`, { start: 0, end: 0 });
      state.set(path, "loading");

      let src: string;
      try {
        src = await readFile(path);
      } catch {
        return checkErr(`cannot read module '${path}'`, { start: 0, end: 0 });
      }
      const parsed = parseModule(src);
      if (isErr(parsed)) return parsed.error;

      for (const imp of importsOf(parsed.value)) {
        const dep = await visit(resolveImport(path, imp.from));
        if (dep) return dep;
      }
      state.set(path, "done");
      order.push({ path, prog: parsed.value });
      return null;
    };

    const failure = await visit(entry);
    return failure ? err(failure) : ok(order);
  });

// Compile a resolved graph (synchronous — the I/O already happened). Each module
// checks + infers + codegens with prelude plus everything its imports resolve
// to: their export SCHEMES (inference), their variant REGISTRY (cross-module
// exhaustiveness), and their ctor field KEYS (pattern destructuring). A missing
// export is reported against the import site.
const compileGraph = (graph: Loaded[]): Result<ModuleOutput[], AlangError> => {
  const exportsByPath = new Map<string, Env>();
  const regByPath = new Map<string, Registry>();
  const keysByPath = new Map<string, Map<string, string[]>>();
  const outputs: ModuleOutput[] = [];

  for (const { path, prog } of graph) {
    const gathered = gatherImports(path, prog, exportsByPath, regByPath, keysByPath);
    if (isErr(gathered)) return gathered;
    const { imports, importedReg, importedKeys } = gathered.value;

    const checked = check(prog, importedReg);
    if (isErr(checked)) return checked;
    const inferred = inferProgramTypes(prog, preludeEnv, {
      open: true,
      imports,
      namespaces: preludeNamespaces,
    });
    if (isErr(inferred)) return inferred;
    exportsByPath.set(path, exportsOf(prog, inferred.value.env));
    regByPath.set(path, exportedRegistry(prog));
    keysByPath.set(path, exportedCtorKeys(prog));
    outputs.push({ path, js: codegen(prog, importedKeys, { runtime: true }) });
  }
  return ok(outputs);
};

// Resolve the graph (async), then compile it (sync) — one railway, no
// `Promise<Result<…>>` at the seam.
export const buildModules = (
  entry: string,
  readFile: ReadFile,
): ResultAsync<ModuleOutput[], AlangError> =>
  loadGraph(resolve(entry), readFile).andThen(compileGraph);

export type BuildTsOptions = { runtimeImport?: string };

// Like `compileGraph`, but emits a typed `.ts` per module (ADR 0026). Each
// module is checked + inferred with its imported context, then emitted with two
// extra ingredients over the single-file `codegenTs`: cross-module `import`
// lines (the values each `import` names, plus the dep's exported TYPE names so
// annotations referencing an imported variant resolve), and the imported ctor
// field keys for pattern destructuring.
const compileGraphTs = (
  graph: Loaded[],
  runtimeImport: string,
): Result<ModuleOutput[], AlangError> => {
  const exportsByPath = new Map<string, Env>();
  const regByPath = new Map<string, Registry>();
  const keysByPath = new Map<string, Map<string, string[]>>();
  const outputs: ModuleOutput[] = [];

  for (const { path, prog } of graph) {
    const gathered = gatherImports(path, prog, exportsByPath, regByPath, keysByPath);
    if (isErr(gathered)) return gathered;
    const { imports, importedReg, importedKeys } = gathered.value;

    const checked = check(prog, importedReg);
    if (isErr(checked)) return checked;
    const inferred = inferProgramTypes(prog, preludeEnv, {
      open: true,
      imports,
      namespaces: preludeNamespaces,
    });
    if (isErr(inferred)) return inferred;

    // Cross-module TYPE imports. The value imports (ctors/functions) are emitted
    // by codegen's body already (with `moduleExt: ""`); here we add only the
    // dep's exported type names as `import type`, so emitted annotations that
    // mention an imported variant resolve. Skip type names this module declares.
    const localTypes = new Set(
      prog.stmts
        .filter((s): s is Extract<Stmt, { kind: "type" }> => s.kind === "type")
        .map((s) => s.name),
    );
    const importLines: string[] = [];
    for (const imp of importsOf(prog)) {
      const depReg = regByPath.get(resolveImport(path, imp.from));
      const depTypes = depReg ? [...depReg.type.keys()].filter((t) => !localTypes.has(t)) : [];
      if (depTypes.length)
        importLines.push(
          `import type { ${depTypes.join(", ")} } from ${JSON.stringify(imp.from.replace(/\.al$/, ""))};`,
        );
    }

    const ts = emitTsModule(prog, {
      env: inferred.value.env,
      aliases: inferred.value.aliases,
      importedKeys,
      importLines,
      runtimeImport,
    });
    exportsByPath.set(path, exportsOf(prog, inferred.value.env));
    regByPath.set(path, exportedRegistry(prog));
    keysByPath.set(path, exportedCtorKeys(prog));
    outputs.push({ path, js: ts });
  }
  return ok(outputs);
};

// `build --emit=ts`: resolve the graph, emit a typed `.ts` beside each `.al`.
export const buildModulesTs = (
  entry: string,
  readFile: ReadFile,
  opts: BuildTsOptions = {},
): ResultAsync<ModuleOutput[], AlangError> =>
  loadGraph(resolve(entry), readFile).andThen((g) =>
    compileGraphTs(g, opts.runtimeImport ?? DEFAULT_RUNTIME_IMPORT),
  );

// Resolve + compile only the DEPENDENCIES of `entry` (dependency order), then
// return the context `entry` itself should be checked/inferred with. Unlike
// `buildModules` it stops at the entry — never checking, inferring, or
// codegen-ing it — so the caller can run those on a live, possibly-unsaved
// buffer. This is what lets LSP diagnostics see imported constructors (else a
// `switch` on an imported variant is a false "unknown constructor"). A broken
// dep surfaces as an Err; the caller decides whether to degrade.
export const moduleContext = (
  entry: string,
  readFile: ReadFile,
): ResultAsync<ModuleContext, AlangError> =>
  loadGraph(resolve(entry), readFile).andThen((graph) => {
    const entryPath = resolve(entry);
    const exportsByPath = new Map<string, Env>();
    const regByPath = new Map<string, Registry>();
    const keysByPath = new Map<string, Map<string, string[]>>();

    for (const { path, prog } of graph) {
      const gathered = gatherImports(path, prog, exportsByPath, regByPath, keysByPath);
      if (isErr(gathered)) return gathered;
      // The entry is last in dependency order; its deps are now compiled, so
      // hand back its context without touching the (live) entry itself.
      if (path === entryPath) return ok(gathered.value);
      const checked = check(prog, gathered.value.importedReg);
      if (isErr(checked)) return checked;
      const inferred = inferProgramTypes(prog, preludeEnv, {
        open: true,
        imports: gathered.value.imports,
        namespaces: preludeNamespaces,
      });
      if (isErr(inferred)) return inferred;
      exportsByPath.set(path, exportsOf(prog, inferred.value.env));
      regByPath.set(path, exportedRegistry(prog));
      keysByPath.set(path, exportedCtorKeys(prog));
    }
    // Entry has no imports (graph = [entry]) — empty context.
    return ok({
      imports: new Map(),
      importedReg: { ctor: new Map(), type: new Map() },
      importedKeys: new Map(),
    });
  });
