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
import { type AlangError, checkErr } from "./errors";
import { type Env, inferProgramTypes, type Scheme } from "./infer";
import { lex } from "./lexer";
import { parse } from "./parser";
import { preludeEnv } from "./prelude";

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

    const checked = check(prog, importedReg);
    if (isErr(checked)) return checked;
    const inferred = inferProgramTypes(prog, preludeEnv, { open: true, imports });
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
