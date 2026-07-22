// Host IO shims for the self-hosted alang CLI (ticket 0001). Bound into alang
// source via `extern`; the shipped `alangc` runs as emitted JS under Bun, so
// these are plain Node/Bun calls. Synchronous by design — the compiler is a
// batch tool, and sync results keep the alang surface a plain `Result` (no
// `Promise<Result>`, per the railway conventions).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// alang Result runtime shape: { _tag: "Ok", value } | { _tag: "Err", error }.
const Ok = (value) => ({ _tag: "Ok", value });
const Err = (error) => ({ _tag: "Err", error });

const msg = (e) => String((e && e.message) || e);

// readFile : string -> Result string string
export const readFile = (path) => {
  try {
    return Ok(readFileSync(path, "utf8"));
  } catch (e) {
    return Err(msg(e));
  }
};

// writeFile : string -> string -> Result string string  (Ok carries the path)
// Uncurried: alang lowers multi-arg application to a flat call.
export const writeFile = (path, contents) => {
  try {
    writeFileSync(path, contents);
    return Ok(path);
  } catch (e) {
    return Err(msg(e));
  }
};

// resolveImport : string -> string -> string  — an importer's path and an
// import spec to the dep's absolute `.al` path (a trailing `.al` is optional).
// Uncurried; mirrors src/module.ts's resolveImport.
export const resolveImport = (importer, spec) =>
  resolve(dirname(importer), `${spec.replace(/\.al$/, "")}.al`);

// absPath : string -> string  — absolutize an entry path against the cwd, so
// the graph loader keys every module on one canonical path.
export const absPath = (p) => resolve(p);

// argv : [string]  — the process argument vector past the script name.
export const argv = process.argv.slice(2);

// print : string -> string  — write a line to stderr; returns its argument so
// it threads inside a pipeline. (stderr keeps stdout clean for emitted JS.)
export const print = (s) => {
  process.stderr.write(`${s}\n`);
  return s;
};

// formatError : string -> string -> { message, start, end } -> string
// Renders a compile diagnostic as `path:line:col: message` (1-based line/col
// from the byte offset), matching the TS CLI's human-facing form.
export const formatError = (path, src, err) => {
  const before = src.slice(0, err.start);
  const line = before.split("\n").length;
  const col = err.start - before.lastIndexOf("\n");
  return `${path}:${line}:${col}: ${err.message}`;
};

// die : string -> a  — print to stderr and exit nonzero. Return type is
// uninhabited on the alang side (never returns), so it unifies anywhere.
export const die = (msg) => {
  process.stderr.write(`${msg}\n`);
  process.exit(1);
};
