/**
 * Multi-file driver: resolve an `import` graph of `.mochi` modules, compile each in
 * dependency order, and thread every module's EXPORT schemes into the modules
 * that import it — so a value crosses a module boundary with its full inferred
 * (and possibly polymorphic) type, not an opaque `any`.
 */
import { dirname, relative, resolve } from "node:path";
import { err, isErr, ok, type Result, ResultAsync } from "@onrails/result";
import type { Program, Stmt } from "./ast";
import type { Registry } from "./check";
import { codegen } from "./codegen";
import { DEFAULT_RUNTIME_IMPORT, emitTsModule } from "./codegen-ts";
import { toTypedProgramWith } from "./compile";
import { exportedCtorKeys, exportedCtorTable } from "./ctors";
import { type ExternBinding, externModuleDts } from "./dts";
import { checkErr, type Diagnostic, oneDiag } from "./errors";
import type { Env, Scheme } from "./infer";
import { lex } from "./lexer";
import { parse } from "./parser";

export type ModuleOutput = { path: string; js: string };
type ReadFile = (path: string) => Promise<string>;

/** Resolve an import `from` spec to an absolute `.mochi` path (`.mochi` suffix optional). */
const resolveImport = (importer: string, spec: string): string =>
  resolve(dirname(importer), `${spec.replace(/\.mochi$/, "")}.mochi`);

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
    if (s.kind === "import" || !s.exported) continue;
    if (s.kind === "type") for (const c of s.ctors) take(c.name);
    else take(s.name);
  }
  return out;
};

/** Parse a file to a Program; check/infer wait until the graph is loaded in `compileGraph`. */
const parseModule = (src: string): Result<Program, Diagnostic> => {
  const lexed = lex(src);
  return isErr(lexed) ? lexed : parse(lexed.value);
};

type Loaded = { path: string; prog: Program };

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
};

/** Collect `prog`'s imported context from already-compiled deps; missing export → Err. */
const gatherImports = (
  path: string,
  prog: Program,
  exportsByPath: Map<string, Env>,
  regByPath: Map<string, Registry>,
  keysByPath: Map<string, Map<string, string[]>>,
): Result<ModuleContext, Diagnostic[]> => {
  const imports: Env = new Map();
  const nsImports = new Map<string, Env>();
  const importedReg: Registry = { ctor: new Map(), type: new Map() };
  const importedKeys = new Map<string, string[]>();
  for (const imp of importsOf(prog)) {
    const depPath = resolveImport(path, imp.from);
    const depExports = exportsByPath.get(depPath);
    if (imp.alias) {
      // Namespace import: every export of the dep becomes a member of `alias`.
      const members: Env = new Map();
      if (depExports) for (const [name, sc] of depExports) members.set(name, sc);
      nsImports.set(imp.alias.name, members);
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
  return ok({ imports, nsImports, importedReg, importedKeys });
};

/**
 * Load the whole graph reachable from `entry`, depth-first, detecting cycles.
 * Yields modules in dependency order (a module appears after all it imports).
 */
export const loadModuleGraph = (
  entry: string,
  readFile: ReadFile,
): ResultAsync<Loaded[], Diagnostic[]> => loadGraph(resolve(entry), readFile);

const loadGraph = (entry: string, readFile: ReadFile): ResultAsync<Loaded[], Diagnostic[]> =>
  ResultAsync.defer(async () => {
    const order: Loaded[] = [];
    const state = new Map<string, "loading" | "done">();

    const visit = async (path: string): Promise<Diagnostic[] | null> => {
      const st = state.get(path);
      if (st === "done") return null;
      if (st === "loading")
        return oneDiag(checkErr(`import cycle through '${path}'`, { start: 0, end: 0 }));
      state.set(path, "loading");

      let src: string;
      try {
        src = await readFile(path);
      } catch {
        return oneDiag(checkErr(`cannot read module '${path}'`, { start: 0, end: 0 }));
      }
      const parsed = parseModule(src);
      if (isErr(parsed)) return oneDiag(parsed.error);

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

/**
 * Compile a resolved graph (synchronous — I/O already happened). Each module
 * checks + infers + codegens with prelude plus imported schemes, registry, and
 * ctor field keys.
 */
const compileGraph = (graph: Loaded[]): Result<ModuleOutput[], Diagnostic[]> => {
  const exportsByPath = new Map<string, Env>();
  const regByPath = new Map<string, Registry>();
  const keysByPath = new Map<string, Map<string, string[]>>();
  const outputs: ModuleOutput[] = [];

  for (const { path, prog } of graph) {
    const gathered = gatherImports(path, prog, exportsByPath, regByPath, keysByPath);
    if (isErr(gathered)) return gathered;

    const typed = toTypedProgramWith(prog, gathered.value);
    if (isErr(typed)) return typed;
    exportsByPath.set(path, exportsOf(prog, typed.value.res.env));
    regByPath.set(path, exportedCtorTable(prog));
    keysByPath.set(path, exportedCtorKeys(prog));
    outputs.push({ path, js: codegen(prog, gathered.value.importedKeys, { runtime: true }) });
  }
  return ok(outputs);
};

/** Resolve the graph (async), then compile it (sync) — one railway, no `Promise<Result<…>>`. */
export const buildModules = (
  entry: string,
  readFile: ReadFile,
): ResultAsync<ModuleOutput[], Diagnostic[]> =>
  loadGraph(resolve(entry), readFile).andThen(compileGraph);

export type BuildTsOptions = { runtimeImport?: string };

/**
 * Like `compileGraph`, but emits a typed `.ts` per module (ADR 0026). Each
 * module is checked + inferred with its imported context, then emitted with
 * cross-module `import` lines and imported ctor field keys for destructuring.
 */
const compileGraphTs = (
  graph: Loaded[],
  runtimeImport: string,
): Result<ModuleOutput[], Diagnostic[]> => {
  const exportsByPath = new Map<string, Env>();
  const regByPath = new Map<string, Registry>();
  const keysByPath = new Map<string, Map<string, string[]>>();
  const outputs: ModuleOutput[] = [];

  // Top-level `type` names are globally visible; map each to its declaring module
  // so cross-module references can emit `import type` without a value-import edge.
  const typeOwner = new Map<string, string>();
  for (const { path, prog } of graph)
    for (const s of prog.stmts) if (s.kind === "type") typeOwner.set(s.name, path);

  // Extern modules referenced across the graph → one `.d.ts` each.
  const externDts = new Map<string, ExternBinding[]>();

  for (const { path, prog } of graph) {
    const gathered = gatherImports(path, prog, exportsByPath, regByPath, keysByPath);
    if (isErr(gathered)) return gathered;
    const { importedKeys } = gathered.value;

    const typed = toTypedProgramWith(prog, gathered.value);
    if (isErr(typed)) return typed;
    const { env, aliases, types, letParams } = typed.value.res;

    for (const s of prog.stmts) {
      if (s.kind !== "extern") continue;
      // `.mjs` hosts resolve to `.d.mts`; `.js`/`.ts` to `.d.ts`.
      const base = s.module.replace(/\.m?[jt]s$/, "");
      const declExt = /\.mjs$/.test(s.module) ? ".d.mts" : ".d.ts";
      const dtsPath = `${resolve(dirname(path), base)}${declExt}`;
      const sc = env.get(s.name);
      if (!sc) continue;
      const bucket = externDts.get(dtsPath) ?? externDts.set(dtsPath, []).get(dtsPath)!;
      if (!bucket.some((e) => e.imported === s.imported))
        bucket.push({ imported: s.imported, scheme: sc });
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
    });
    const typeImports = crossModuleTypeImports(body, path, localTypes, typeOwner);
    const ts = typeImports.length ? `${typeImports.join("\n")}\n\n${body}` : body;

    exportsByPath.set(path, exportsOf(prog, env));
    regByPath.set(path, exportedCtorTable(prog));
    keysByPath.set(path, exportedCtorKeys(prog));
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
  loadGraph(resolve(entry), readFile).andThen((g) =>
    compileGraphTs(g, opts.runtimeImport ?? DEFAULT_RUNTIME_IMPORT),
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
): ResultAsync<ModuleContext, Diagnostic[]> =>
  loadGraph(resolve(entry), readFile).andThen((graph) => {
    const entryPath = resolve(entry);
    const exportsByPath = new Map<string, Env>();
    const regByPath = new Map<string, Registry>();
    const keysByPath = new Map<string, Map<string, string[]>>();

    for (const { path, prog } of graph) {
      const gathered = gatherImports(path, prog, exportsByPath, regByPath, keysByPath);
      if (isErr(gathered)) return gathered;
      // Entry is last in dependency order; hand back its context without compiling it.
      if (path === entryPath) return ok(gathered.value);
      const typed = toTypedProgramWith(prog, gathered.value);
      if (isErr(typed)) return typed;
      exportsByPath.set(path, exportsOf(prog, typed.value.res.env));
      regByPath.set(path, exportedCtorTable(prog));
      keysByPath.set(path, exportedCtorKeys(prog));
    }
    // Entry has no imports (graph = [entry]) — empty context.
    return ok({
      imports: new Map(),
      nsImports: new Map(),
      importedReg: { ctor: new Map(), type: new Map() },
      importedKeys: new Map(),
    });
  });
