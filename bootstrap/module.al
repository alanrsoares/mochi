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
