// Ticket 0006 — the shipped `alangc` entry point. Reads the path in argv[0],
// reads that file, runs the whole self-hosted pipeline (compile.al), and on
// success writes the emitted JS to a sibling `.js`; on failure prints a
// `path:line:col: message` diagnostic and exits nonzero.
//
// Single-file only: the source may not contain `import` statements. Multi-file
// import graphs (porting module.ts) are out of scope — a later ticket.
// Runs as emitted JS under Bun; the only npm deps are @onrails/{pattern,result}.
import { compile } from "./compile.al"

type Diag = { message: string, start: number, end: number }

extern readFile : string -> Result string string = "./host.js" "readFile"
extern writeFile : string -> string -> Result string string = "./host.js" "writeFile"
extern argv : [string] = "./host.js" "argv"
extern print : string -> string = "./host.js" "print"
extern die : string -> a = "./host.js" "die"
extern formatError : string -> string -> Diag -> string = "./host.js" "formatError"

// "foo.al" -> "foo.js"  (drops the 3-char `.al` suffix).
let outPath = path => Str.concat(Str.slice(0, sub(Str.length(path), 3), path), ".js")

// build : string -> Result string string  (Ok = written path, Err = diagnostic)
let build = path =>
  readFile(path)
    |> Result.flatMap(src =>
      compile(src)
        |> Result.mapErr(e => formatError(path, src, e))
        |> Result.flatMap(js => writeFile(outPath(path), js)))

// Entry: fire on the real argv the moment the module is evaluated.
export let main = switch Array.get(0, argv) {
  | None => die("usage: alangc <file.al>")
  | Some(path) => switch build(path) {
      | Ok(out) => print(Str.concat("wrote ", out))
      | Err(msg) => die(msg)
    }
}
