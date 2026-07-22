// LSP-shaped diagnostics, computed from `compile` but free of any editor/
// protocol dependency so it stays unit-testable under Bun. The language server
// is a thin adapter that maps these onto vscode-languageserver types.
import { resolve } from "node:path";
import { isErr } from "@onrails/result";
import { check } from "./check";
import { compile } from "./compile";
import type { AlangError } from "./errors";
import { inferProgramTypes } from "./infer";
import { lex } from "./lexer";
import { moduleContext } from "./module";
import { parse } from "./parser";
import { preludeEnv, preludeNamespaces } from "./prelude";
import { lineCol } from "./span";

// 0-based line/character — matches the LSP `Position` shape.
export type Position = { line: number; character: number };
export type Range = { start: Position; end: Position };
export type Diagnostic = { range: Range; message: string };

const posAt = (src: string, offset: number): Position => {
  const lc = lineCol(src, offset);
  return { line: lc.line - 1, character: lc.col - 1 };
};

// A span → range; spanless errors fall back to the first character so the
// squiggle still lands somewhere visible.
const rangeOf = (src: string, e: AlangError): Range =>
  e.span
    ? { start: posAt(src, e.span.start), end: posAt(src, e.span.end) }
    : { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } };

// One AlangError → the LSP-shaped diagnostic. Kind labels the message; the span
// (if any) places the squiggle.
const toDiag = (src: string, e: AlangError): Diagnostic => ({
  range: rangeOf(src, e),
  message: `${e.kind}: ${e.message}`,
});

// The pipeline short-circuits at the first error, so this yields 0 or 1
// diagnostics. Single-file: imports resolve to nothing, so a `switch` on an
// imported variant reads as an unknown constructor. Use `moduleDiagnostics`
// when a path is available.
export const diagnostics = (src: string): Diagnostic[] => {
  const r = compile(src);
  return isErr(r) ? [toDiag(src, r.error)] : [];
};

// Module-aware diagnostics: resolve `path`'s dependency graph (deps read from
// disk via `readFile`, the edited file served from the live `src` buffer) and
// check + infer the live program WITH the imported registry/schemes. This is
// what stops a match on an imported constructor from being a false "unknown
// constructor", and makes cross-module exhaustiveness real.
//
// Degradation is deliberate: the entry's own lex/parse errors are always
// reported (they never depend on deps); if the dep graph can't be resolved or a
// dep fails to compile, we fall back to single-file `diagnostics(src)` — no
// worse than before, and the user still sees their own file's errors.
export const moduleDiagnostics = async (
  path: string,
  src: string,
  readFile: (p: string) => Promise<string>,
): Promise<Diagnostic[]> => {
  const lexed = lex(src);
  if (isErr(lexed)) return [toDiag(src, lexed.error)];
  const parsed = parse(lexed.value);
  if (isErr(parsed)) return [toDiag(src, parsed.error)];
  const prog = parsed.value;

  const entry = resolve(path);
  const read = (p: string): Promise<string> =>
    resolve(p) === entry ? Promise.resolve(src) : readFile(p);
  const ctx = await moduleContext(entry, read);
  if (isErr(ctx)) return diagnostics(src);

  const checked = check(prog, ctx.value.importedReg);
  if (isErr(checked)) return [toDiag(src, checked.error)];
  const inferred = inferProgramTypes(prog, preludeEnv, {
    open: true,
    imports: ctx.value.imports,
    namespaces: preludeNamespaces,
  });
  return isErr(inferred) ? [toDiag(src, inferred.error)] : [];
};
