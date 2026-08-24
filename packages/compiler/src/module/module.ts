/**
 * Multi-file driver: resolve an `import` graph of `.mochi` modules, compile each in
 * dependency order, and thread every module's EXPORT schemes into the modules
 * that import it — so a value crosses a module boundary with its full inferred
 * (and possibly polymorphic) type, not an opaque `any`.
 */
import { dirname, relative, resolve } from "node:path";
import { err, isErr, ok, type Result, ResultAsync } from "@onrails/result";
import type { Program, Stmt } from "../ast/ast";
import { exportedCtorKeys, exportedCtorTable } from "../ast/ctors";
import type { Registry } from "../check/check";
import { codegen } from "../codegen/codegen";
import { DEFAULT_RUNTIME_IMPORT, emitTsModule } from "../codegen/codegen-ts";
import { toTypedProgramWith } from "../compile/compile";
import { openMode } from "../compile/open-mode";
import { type ExternBinding, externModuleDts } from "../dts/dts";
import { checkErr, type Diagnostic, oneDiag } from "../errors/errors";
import type { LanguagePlugin } from "../extensions/extensions";
import { bindingTypeHooks, resolvePlugins } from "../extensions/extensions";
import type { AliasMap, Env, QualMap, QualScope, Scheme } from "../infer/infer";
import { lex } from "../lexer/lexer";
import { parse } from "../parser/parser";

export type ModuleOutput = { path: string; js: string };
type ReadFile = (path: string) => Promise<string>;

/** Options threaded to every per-module inference call. Each source file can also opt in through `// @mochi open`. */
export type ModuleGraphOptions = { plugins?: LanguagePlugin[]; open?: boolean };

/** Relative / absolute specs — everything else is a bare package or package subpath. */
const isPathSpec = (spec: string): boolean =>
  spec.startsWith("./") ||
  spec.startsWith("../") ||
  spec.startsWith("/") ||
  /^[A-Za-z]:[\\/]/.test(spec);

type NodeModuleBuiltin = {
  createRequire: (filename: string) => { resolve: (id: string) => string };
};

/**
 * Resolve a bare package/subpath via Node `exports` without a static
 * `node:module` import — the docs playground bundles this file for the browser
 * (worker + sync fallback), and Rollup cannot ship `createRequire`.
 */
const resolvePackageSpec = (importer: string, spec: string): string | null => {
  try {
    const getBuiltin = (globalThis as { process?: { getBuiltinModule?: (id: string) => unknown } })
      .process?.getBuiltinModule;
    const mod = getBuiltin?.("module") as NodeModuleBuiltin | undefined;
    return !mod?.createRequire ? null : mod.createRequire(importer).resolve(spec);
  } catch {
    return null;
  }
};

/**
 * Resolve an import `from` spec to an absolute `.mochi` path.
 * Relative/absolute specs append `.mochi` (suffix optional). Bare package
 * specs (`@mochi/plugin-preact/hooks`) use Node `exports` resolution from the
 * importer — same story Vite aliases paper over, so LSP/module graph can load
 * kit seams without a project-local host copy (ADR 0015 / tracer #51).
 */
export const resolveImport = (importer: string, spec: string): string => {
  if (isPathSpec(spec)) {
    return resolve(dirname(importer), `${spec.replace(/\.mochi$/, "")}.mochi`);
  }
  const pkg = resolvePackageSpec(importer, spec);
  return pkg !== null ? pkg : resolve(dirname(importer), `${spec}.mochi`);
};

const importsOf = (prog: Program): Extract<Stmt, { kind: "import" }>[] =>
  prog.stmts.filter((s): s is Extract<Stmt, { kind: "import" }> => s.kind === "import");

/** Schemes a module exports: exported `let`/`extern` bindings and exported `type` ctors. */
const exportsOf = (prog: Program, env: Env): Env => {
  const out: Env = new Map();
  const take = (name: string): void => {
    const sc = env.get(name);
    if (sc) out.set(name, sc);
  };
  for (const s of prog.stmts) {
    // An error node exports nothing — it has no name at all (ADR 0045 decision 4).
    if (s.kind === "import" || s.kind === "error" || !s.exported) continue;
    if (s.kind === "type") for (const c of s.ctors) take(c.name);
    else take(s.name);
  }
  return out;
};

/**
 * A module's own transparent record aliases, keyed by name — the same collection
 * `infer.ts` builds for a module's local `TypeScope`. Every alias is included,
 * exported or not: an exported alias's field may name a private one, and that
 * field still has to expand when the alias crosses a module edge.
 */
const aliasesOf = (prog: Program): AliasMap => {
  const out: AliasMap = new Map();
  for (const s of prog.stmts)
    if (s.kind === "type" && s.alias) out.set(s.name, { params: s.params, fields: s.alias });
  return out;
};

/** Every type name a module EXPORTS — variants and record aliases alike. This is the existence set `check.ts` reports `D.Nope` against. */
const exportedTypeNames = (prog: Program): ReadonlySet<string> =>
  new Set(prog.stmts.flatMap((s) => (s.kind === "type" && s.exported ? [s.name] : [])));

/**
 * The type-name scope a module hands its importers (C5 slice b): its exported
 * type names, plus its OWN scope — local aliases and its own qual map — so a
 * transparent alias expands in the module that DECLARED it and a field naming
 * `Other.T` resolves where it was written, not where it was imported.
 */
const qualScopeOf = (prog: Program, quals: QualMap): QualScope => ({
  types: exportedTypeNames(prog),
  scope: { aliases: aliasesOf(prog), quals },
});

/** Parse a file to a Program; check/infer wait until the graph is loaded in `compileGraph`. */
const parseModule = (src: string, opts: ModuleGraphOptions): Result<Program, Diagnostic[]> => {
  const lexed = lex(src);
  // Lex is still single-error (ADR 0004); parse is now plural (ADR 0045).
  return isErr(lexed) ? err(oneDiag(lexed.error)) : parse(lexed.value, { plugins: opts.plugins });
};

type Loaded = { path: string; prog: Program; src: string };

/**
 * Stamp the failing module's absolute `path` on each diagnostic (unless a
 * deeper failure already did), so graph consumers can tell WHICH file a span
 * points into — `moduleDiagnostics` maps dep failures onto the entry's
 * `import` statement with it.
 */
const atPath = (diags: Diagnostic[], path: string): Diagnostic[] =>
  diags.map((d) => (d.path === undefined ? { ...d, path } : d));

/**
 * What a module's imports resolve to: export SCHEMES (inference), variant
 * REGISTRY (cross-module exhaustiveness), and ctor field KEYS (destructuring).
 */
export type ModuleContext = {
  imports: Env;
  /** `import * as Alias` → Alias's export schemes (ADR 0002). */
  nsImports: Map<string, Env>;
  importedReg: Registry;
  importedKeys: Map<string, string[]>;
  /** `import * as Alias` → Alias's exported TYPE scope, so `Alias.T` resolves (C5 slice b). */
  qualTypes: QualMap;
};

/** Collect `prog`'s imported context from already-compiled deps; missing export → Err. */
const gatherImports = (
  path: string,
  prog: Program,
  exportsByPath: Map<string, Env>,
  regByPath: Map<string, Registry>,
  keysByPath: Map<string, Map<string, string[]>>,
  qualsByPath: Map<string, QualScope>,
): Result<ModuleContext, Diagnostic[]> => {
  const imports: Env = new Map();
  const nsImports = new Map<string, Env>();
  const importedReg: Registry = { ctor: new Map(), type: new Map() };
  const importedKeys = new Map<string, string[]>();
  const qualTypes = new Map<string, QualScope>();
  for (const imp of importsOf(prog)) {
    const depPath = resolveImport(path, imp.from);
    const depExports = exportsByPath.get(depPath);
    if (imp.alias) {
      // Namespace import: every export of the dep becomes a member of `alias`.
      const members: Env = new Map();
      if (depExports) for (const [name, sc] of depExports) members.set(name, sc);
      nsImports.set(imp.alias.name, members);
      // …and every exported TYPE of the dep becomes namable as `Alias.T` (C5 slice b).
      const depQual = qualsByPath.get(depPath);
      if (depQual) qualTypes.set(imp.alias.name, depQual);
    } else {
      for (const n of imp.names) {
        const sc = depExports?.get(n.name) as Scheme | undefined;
        if (!sc) return err(oneDiag(checkErr(`'${imp.from}' has no export '${n.name}'`, n.span)));
        imports.set(n.name, sc);
      }
    }
    const depReg = regByPath.get(depPath);
    if (depReg) {
      for (const [k, v] of depReg.type) importedReg.type.set(k, v);
      for (const [k, v] of depReg.ctor) importedReg.ctor.set(k, v);
    }
    const depKeys = keysByPath.get(depPath);
    if (depKeys) for (const [k, v] of depKeys) importedKeys.set(k, v);
  }
  return ok({ imports, nsImports, importedReg, importedKeys, qualTypes });
};

/**
 * Load the whole graph reachable from `entry`, depth-first, detecting cycles.
 * Yields modules in dependency order (a module appears after all it imports).
 */
export const loadModuleGraph = (
  entry: string,
  readFile: ReadFile,
  opts: ModuleGraphOptions = {},
): ResultAsync<Loaded[], Diagnostic[]> => loadGraph(resolve(entry), readFile, opts);

/** `opts.plugins` reaches every module's *parse*, so plugin-owned syntax resolves (or fails) uniformly across the graph. */
const loadGraph = (
  entry: string,
  readFile: ReadFile,
  opts: ModuleGraphOptions = {},
): ResultAsync<Loaded[], Diagnostic[]> =>
  ResultAsync.defer(async () => {
    const order: Loaded[] = [];
    const state = new Map<string, "loading" | "done">();

    const visit = async (path: string): Promise<Diagnostic[] | null> => {
      const st = state.get(path);
      if (st === "done") return null;
      if (st === "loading")
        return atPath(
          oneDiag(checkErr(`import cycle through '${path}'`, { start: 0, end: 0 })),
          path,
        );
      state.set(path, "loading");

      let src: string;
      try {
        src = await readFile(path);
      } catch {
        return atPath(
          oneDiag(checkErr(`cannot read module '${path}'`, { start: 0, end: 0 })),
          path,
        );
      }
      const parsed = parseModule(src, opts);
      if (isErr(parsed)) return atPath(parsed.error, path);

      for (const imp of importsOf(parsed.value)) {
        const dep = await visit(resolveImport(path, imp.from));
        if (dep) return dep;
      }
      state.set(path, "done");
      order.push({ path, prog: parsed.value, src });
      return null;
    };

    const failure = await visit(entry);
    return failure ? err(failure) : ok(order);
  });

/**
 * Compile a resolved graph (synchronous — I/O already happened). Each module
 * checks + infers + codegens with prelude plus imported schemes, registry, and
 * ctor field keys.
 */
const compileGraph = (
  graph: Loaded[],
  opts: ModuleGraphOptions = {},
): Result<ModuleOutput[], Diagnostic[]> => {
  const exportsByPath = new Map<string, Env>();
  const regByPath = new Map<string, Registry>();
  const keysByPath = new Map<string, Map<string, string[]>>();
  const qualsByPath = new Map<string, QualScope>();
  const outputs: ModuleOutput[] = [];

  for (const { path, prog, src } of graph) {
    const gathered = gatherImports(path, prog, exportsByPath, regByPath, keysByPath, qualsByPath);
    if (isErr(gathered)) return gathered;

    const typed = toTypedProgramWith(prog, gathered.value, {
      plugins: opts.plugins,
      open: openMode(src, opts.open),
    });
    if (isErr(typed)) return typed;
    exportsByPath.set(path, exportsOf(prog, typed.value.res.env));
    regByPath.set(path, exportedCtorTable(prog));
    keysByPath.set(path, exportedCtorKeys(prog));
    qualsByPath.set(path, qualScopeOf(prog, gathered.value.qualTypes));
    outputs.push({ path, js: codegen(prog, gathered.value.importedKeys, { runtime: true }) });
  }
  return ok(outputs);
};

/** Resolve the graph (async), then compile it (sync) — one railway, no `Promise<Result<…>>`. */
export const buildModules = (
  entry: string,
  readFile: ReadFile,
  opts: ModuleGraphOptions = {},
): ResultAsync<ModuleOutput[], Diagnostic[]> =>
  loadGraph(resolve(entry), readFile, opts).andThen((g) => compileGraph(g, opts));

export type BuildTsOptions = ModuleGraphOptions & { runtimeImport?: string };

/**
 * Like `compileGraph`, but emits a typed `.ts` per module (ADR 0026). Each
 * module is checked + inferred with its imported context, then emitted with
 * cross-module `import` lines and imported ctor field keys for destructuring.
 */
const compileGraphTs = (
  graph: Loaded[],
  runtimeImport: string,
  opts: ModuleGraphOptions = {},
): Result<ModuleOutput[], Diagnostic[]> => {
  const exportsByPath = new Map<string, Env>();
  const regByPath = new Map<string, Registry>();
  const keysByPath = new Map<string, Map<string, string[]>>();
  const qualsByPath = new Map<string, QualScope>();
  const outputs: ModuleOutput[] = [];
  // Same plugin resolution the per-module `toTypedProgramWith` calls below get,
  // so binding types in the emitted `.ts` match what `emitDts` would declare
  // (ADR 0011 — `bindingTsType` is shared by both backends).
  const tsBindingTypeHooks = bindingTypeHooks(resolvePlugins(opts.plugins));

  // Top-level `type` names are globally visible; map each to its declaring module
  // so cross-module references can emit `import type` without a value-import edge.
  const typeOwner = new Map<string, string>();
  for (const { path, prog } of graph)
    for (const s of prog.stmts) if (s.kind === "type") typeOwner.set(s.name, path);

  // Extern modules referenced across the graph → one `.d.ts` each.
  const externDts = new Map<string, ExternBinding[]>();

  for (const { path, prog, src } of graph) {
    const gathered = gatherImports(path, prog, exportsByPath, regByPath, keysByPath, qualsByPath);
    if (isErr(gathered)) return gathered;
    const { importedKeys } = gathered.value;

    const typed = toTypedProgramWith(prog, gathered.value, {
      plugins: opts.plugins,
      open: openMode(src, opts.open),
    });
    if (isErr(typed)) return typed;
    const { env, aliases, types, letParams } = typed.value.res;

    for (const s of prog.stmts) {
      if (s.kind !== "extern") continue;
      // JS conventions lower inline; unlike module externs they have no host
      // module for which a sidecar declaration should be emitted.
      if (s.module.startsWith("mochi:")) continue;
      // `.mjs` hosts resolve to `.d.mts`; `.js`/`.ts` to `.d.ts`.
      const base = s.module.replace(/\.m?[jt]s$/, "");
      const declExt = /\.mjs$/.test(s.module) ? ".d.mts" : ".d.ts";
      const dtsPath = `${resolve(dirname(path), base)}${declExt}`;
      const sc = env.get(s.name);
      if (!sc) continue;
      const bucket = externDts.get(dtsPath) ?? externDts.set(dtsPath, []).get(dtsPath)!;
      if (!bucket.some((e) => e.imported === s.imported))
        bucket.push({ imported: s.imported, scheme: sc, curried: s.curried });
    }

    const localTypes = new Set(
      prog.stmts.filter((s) => s.kind === "type").map((s) => (s as { name: string }).name),
    );
    // Emit body first, then prepend `import type` for every non-local type name referenced.
    const body = emitTsModule(prog, {
      env,
      aliases,
      types,
      letParams,
      importedKeys,
      importLines: [],
      runtimeImport,
      bindingTypeHooks: tsBindingTypeHooks,
    });
    const typeImports = crossModuleTypeImports(body, path, localTypes, typeOwner);
    const ts = typeImports.length ? `${typeImports.join("\n")}\n\n${body}` : body;

    exportsByPath.set(path, exportsOf(prog, env));
    regByPath.set(path, exportedCtorTable(prog));
    keysByPath.set(path, exportedCtorKeys(prog));
    qualsByPath.set(path, qualScopeOf(prog, gathered.value.qualTypes));
    outputs.push({ path, js: ts });
  }

  for (const [dtsPath, externs] of externDts)
    outputs.push({ path: dtsPath, js: externModuleDts(externs) });

  return ok(outputs);
};

/** Module specifier for `to` as imported from `from`; extension stripped. */
const relSpec = (from: string, to: string): string => {
  const rel = relative(dirname(from), to).replace(/\.mochi$/, "");
  return rel.startsWith(".") ? rel : `./${rel}`;
};

/**
 * `import type { … }` lines for every non-local type name the emitted `ts` text
 * references, grouped by declaring module. Skips names already bound by a value
 * import (TS2300). Builtin variants aren't in `typeOwner`; emitted inline.
 */
const crossModuleTypeImports = (
  ts: string,
  importerPath: string,
  localTypes: Set<string>,
  typeOwner: Map<string, string>,
): string[] => {
  const valueImported = new Set<string>();
  for (const m of ts.matchAll(/^import \{([^}]*)\} from/gm))
    for (const n of m[1]!.split(",")) {
      const bound = n
        .trim()
        .split(/\s+as\s+/)
        .at(-1)
        ?.trim();
      if (bound) valueImported.add(bound);
    }

  const byOwner = new Map<string, string[]>();
  for (const [name, ownerPath] of typeOwner) {
    if (ownerPath === importerPath || localTypes.has(name) || valueImported.has(name)) continue;
    if (!new RegExp(`\\b${name}\\b`).test(ts)) continue;
    const spec = relSpec(importerPath, ownerPath);
    (byOwner.get(spec) ?? byOwner.set(spec, []).get(spec)!).push(name);
  }
  return [...byOwner].map(
    ([spec, names]) =>
      `import type { ${names.toSorted().join(", ")} } from ${JSON.stringify(spec)};`,
  );
};

/** `build --emit=ts`: resolve the graph, emit a typed `.ts` beside each `.mochi`. */
export const buildModulesTs = (
  entry: string,
  readFile: ReadFile,
  opts: BuildTsOptions = {},
): ResultAsync<ModuleOutput[], Diagnostic[]> =>
  loadGraph(resolve(entry), readFile, { plugins: opts.plugins }).andThen((g) =>
    compileGraphTs(g, opts.runtimeImport ?? DEFAULT_RUNTIME_IMPORT, {
      plugins: opts.plugins,
      open: opts.open,
    }),
  );

/**
 * Resolve + compile only the dependencies of `entry`, then return the context
 * `entry` itself should be checked/inferred with. Stops at the entry so the
 * caller can run check/infer on a live buffer (LSP diagnostics/hover). Broken
 * deps surface as Err; the caller decides whether to degrade.
 */
export const moduleContext = (
  entry: string,
  readFile: ReadFile,
  opts: ModuleGraphOptions = {},
): ResultAsync<ModuleContext, Diagnostic[]> =>
  loadGraph(resolve(entry), readFile, opts).andThen((graph) => {
    const entryPath = resolve(entry);
    const exportsByPath = new Map<string, Env>();
    const regByPath = new Map<string, Registry>();
    const keysByPath = new Map<string, Map<string, string[]>>();
    const qualsByPath = new Map<string, QualScope>();

    for (const { path, prog, src } of graph) {
      const gathered = gatherImports(path, prog, exportsByPath, regByPath, keysByPath, qualsByPath);
      if (isErr(gathered)) return err(atPath(gathered.error, path));
      // Entry is last in dependency order; hand back its context without compiling it.
      if (path === entryPath) return ok(gathered.value);
      const typed = toTypedProgramWith(prog, gathered.value, {
        plugins: opts.plugins,
        open: openMode(src, opts.open),
      });
      if (isErr(typed)) return err(atPath(typed.error, path));
      exportsByPath.set(path, exportsOf(prog, typed.value.res.env));
      regByPath.set(path, exportedCtorTable(prog));
      keysByPath.set(path, exportedCtorKeys(prog));
      qualsByPath.set(path, qualScopeOf(prog, gathered.value.qualTypes));
    }
    // Entry has no imports (graph = [entry]) — empty context.
    return ok({
      imports: new Map(),
      nsImports: new Map(),
      importedReg: { ctor: new Map(), type: new Map() },
      importedKeys: new Map(),
      qualTypes: new Map(),
    });
  });
