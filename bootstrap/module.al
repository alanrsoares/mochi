// Ticket 0013 (part a) — module-graph loader. Resolve the import graph of `.al`
// files reachable from an entry, depth-first, and yield the modules in
// DEPENDENCY ORDER (a module lands after everything it imports), detecting
// import cycles. Sync throughout: the host IO returns `Result` directly (ticket
// 0001), so there is no ResultAsync here — unlike `src/module.ts`, whose async
// file reads force its loader half into a ResultAsync.
//
// Cross-module scheme/registry threading and the actual compileGraph land in
// parts (b) and (c); this half only parses and orders.
import { lex } from "./lexer.al"
import { parse } from "./parser.al"
import { checkWith, exportedRegistry } from "./check.al"
import { inferProgramImports, exportedSchemes } from "./infer.al"
import { exportedCtorKeys, codegen } from "./codegen.al"

// Prelude tables from the generated shim (as in compile.al). Threaded opaquely
// into inferProgramImports / codegen; module.al never inspects them.
extern builtins : Map string a = "./prelude.gen.js" "builtins"
extern namespaces : Map string (Map string a) = "./prelude.gen.js" "namespaces"
extern namespaceRuntime : Map string (Map string string) = "./prelude.gen.js" "namespaceRuntime"
extern preludeJsDefs : Map string string = "./prelude.gen.js" "preludeJsDefs"
extern runtimeDeps : Map string [string] = "./prelude.gen.js" "runtimeDeps"

type Span = { start: number, end: number }
type Name = { name: string, span: Span }
// Minimal AST view: only the import ctor is ever destructured here. Under the
// single-file open-world compile that builds this module, `parse`'s real `Stmt`
// type stays opaque, so declaring just `SImport` suffices — every other stmt
// falls through the `_` arm at runtime.
type Stmt = SImport(names: [Name], from: string, span: Span)

// One loaded module: its canonical path and parsed statements.
type Loaded = { path: string, stmts: [Stmt] }

// A driver error, shaped like the compiler's `CErr`; the graph phase has no
// meaningful span, so both offsets are 0 (matching src/module.ts).
type MErr = { message: string, start: number, end: number }

extern readFile : string -> Result string string = "./host.js" "readFile"
extern resolveImport : string -> string -> string = "./host.js" "resolveImport"
extern absPath : string -> string = "./host.js" "absPath"

let mErr = message => { message: message, start: 0, end: 0 }

// Lex + parse a source file to statements. No check/infer — both need the whole
// graph's exports resolved first, which only happens in a later part.
let parseModule = src => lex(src) |> Result.flatMap(parse)

// The `from` specs of a module's import statements, in source order.
let importFromsFrom = (stmts, i, acc) => switch Array.get(i, stmts) {
  | None => acc
  | Some(s) => switch s {
      | SImport(_, from, _) => importFromsFrom(stmts, add(i, 1), Array.append(from, acc))
      | _ => importFromsFrom(stmts, add(i, 1), acc)
    }
}
let importFroms = stmts => importFromsFrom(stmts, 0, [])

// The DFS accumulator: `state` marks each path "loading" (on the stack, so
// re-entry is a cycle) or "done"; `order` collects modules in dependency order.
type Acc = { state: Map string string, order: [Loaded] }

// Visit one module: mark it loading, parse it, recurse into its deps, then mark
// it done and append it to `order`. First Err short-circuits. A path already
// "loading" is a cycle; already "done" is a no-op.
let visit = (path, acc) => switch Map.get(path, acc.state) {
  | Some("done") => Ok(acc)
  | Some("loading") => Err(mErr("import cycle through '${path}'"))
  | _ =>
      let acc1 = { state: Map.set(path, "loading", acc.state), order: acc.order } in
      switch readFile(path) {
        | Err(_) => Err(mErr("cannot read module '${path}'"))
        | Ok(src) => switch parseModule(src) {
            | Err(e) => Err(e)
            | Ok(stmts) => switch visitAll(importFroms(stmts), path, acc1) {
                | Err(e) => Err(e)
                | Ok(acc2) => Ok({
                    state: Map.set(path, "done", acc2.state),
                    order: Array.append({ path: path, stmts: stmts }, acc2.order)
                  })
              }
          }
      }
}

// Visit each dep spec, resolved against `importer`, threading the accumulator.
let visitAll = (froms, importer, acc) => switch froms {
  | [] => Ok(acc)
  | [from, ...rest] => switch visit(resolveImport(importer, from), acc) {
      | Err(e) => Err(e)
      | Ok(acc1) => visitAll(rest, importer, acc1)
    }
}

// loadGraph : string -> Result [Loaded] MErr
// Load every module reachable from `entry`, in dependency order.
export let loadGraph = entry =>
  visit(absPath(entry), { state: #{}, order: [] }) |> Result.map(acc => acc.order)

// --- part (b): compile the loaded graph -------------------------------------
// Each module checks + infers + codegens with the prelude PLUS everything its
// imports resolve to: their export SCHEMES (inference), their variant REGISTRY
// (cross-module exhaustiveness), and their ctor field KEYS (destructuring). A
// missing export is reported against the import site. Mirrors src/module.ts's
// compileGraph — sync, since loadGraph already did the IO.

let emptyReg = { ctors: #{}, types: #{} }

// Map has no bulk merge, so fold `from`'s keys into `into` (later source wins).
let mergeInto = (keys, from, into) => switch keys {
  | [] => into
  | [k, ...rest] => mergeInto(rest, from, switch Map.get(k, from) {
      | Some(v) => Map.set(k, v, into)
      | None => into
    })
}
let mergeMap = (from, into) => mergeInto(Map.keys(from), from, into)

// Pull each imported name's scheme out of the dep's published exports, folding
// into `res.imports`. A name the dep does not export errors at the name's span.
let resolveNames = (names, from, depExports, res) => switch names {
  | [] => Ok(res)
  | [n, ...rest] => switch Map.get(n.name, depExports) {
      | None => Err({ message: "'${from}' has no export '${n.name}'", start: n.span.start, end: n.span.end })
      | Some(sc) => resolveNames(rest, from, depExports,
          { imports: Map.set(n.name, sc, res.imports), reg: res.reg, keys: res.keys })
    }
}

// Fold a module's import statements into resolved { imports, reg, keys }: the
// schemes it names, and the merged registry + ctor keys of every dep it pulls.
let resolveImportsFrom = (stmts, i, path, ctx, res) => switch Array.get(i, stmts) {
  | None => Ok(res)
  | Some(SImport(names, from, _)) =>
      let dp = resolveImport(path, from) in
      let depExports = Map.getOr(#{}, dp, ctx.exportsByPath) in
      let depReg = Map.getOr(emptyReg, dp, ctx.regByPath) in
      let depKeys = Map.getOr(#{}, dp, ctx.keysByPath) in
      switch resolveNames(names, from, depExports, res) {
        | Err(e) => Err(e)
        | Ok(res1) => resolveImportsFrom(stmts, add(i, 1), path, ctx, {
            imports: res1.imports,
            reg: { ctors: mergeMap(depReg.ctors, res1.reg.ctors),
                   types: mergeMap(depReg.types, res1.reg.types) },
            keys: mergeMap(depKeys, res1.keys)
          })
      }
  | Some(_) => resolveImportsFrom(stmts, add(i, 1), path, ctx, res)
}

// Compile one module: resolve imports, check (with imported registry), infer
// (with imported schemes), codegen (with imported ctor keys), then publish this
// module's own exports/registry/keys into the ctx for later dependents.
let compileOne = (loaded, ctx) =>
  switch resolveImportsFrom(loaded.stmts, 0, loaded.path, ctx,
      { imports: #{}, reg: emptyReg, keys: #{} }) {
    | Err(e) => Err(e)
    | Ok(res) => switch checkWith(loaded.stmts, res.reg) {
        | Err(e) => Err(e)
        | Ok(_) => switch inferProgramImports(loaded.stmts, builtins, namespaces, true, res.imports) {
            | Err(e) => Err(e)
            | Ok(env) =>
                let js = codegen(loaded.stmts, res.keys, true, namespaceRuntime, preludeJsDefs, runtimeDeps) in
                Ok({
                  exportsByPath: Map.set(loaded.path, exportedSchemes(loaded.stmts, env), ctx.exportsByPath),
                  regByPath: Map.set(loaded.path, exportedRegistry(loaded.stmts), ctx.regByPath),
                  keysByPath: Map.set(loaded.path, exportedCtorKeys(loaded.stmts), ctx.keysByPath),
                  outputs: Array.append({ path: loaded.path, js: js }, ctx.outputs)
                })
          }
      }
  }

// Compile the whole ordered graph, threading the ctx; first Err short-circuits.
let compileAll = (graph, ctx) => switch graph {
  | [] => Ok(ctx.outputs)
  | [m, ...rest] => switch compileOne(m, ctx) {
      | Err(e) => Err(e)
      | Ok(ctx1) => compileAll(rest, ctx1)
    }
}

// compileGraph : [Loaded] -> Result [ModuleOutput] MErr
export let compileGraph = graph =>
  compileAll(graph, { exportsByPath: #{}, regByPath: #{}, keysByPath: #{}, outputs: [] })

// buildModules : string -> Result [ModuleOutput] MErr
// Resolve the graph then compile it — one sync railway (host IO is sync).
export let buildModules = entry => loadGraph(entry) |> Result.flatMap(compileGraph)
