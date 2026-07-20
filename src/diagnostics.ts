// LSP-shaped diagnostics, computed from `compile` but free of any editor/
// protocol dependency so it stays unit-testable under Bun. The language server
// is a thin adapter that maps these onto vscode-languageserver types.
import { isErr } from "@onrails/result";
import { compile } from "./compile";
import type { AlangError } from "./errors";
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

// The pipeline short-circuits at the first error, so this yields 0 or 1
// diagnostics. Message is the labelled kind + text; the range carries location.
export const diagnostics = (src: string): Diagnostic[] => {
  const r = compile(src);
  if (!isErr(r)) return [];
  const e = r.error;
  return [{ range: rangeOf(src, e), message: `${e.kind}: ${e.message}` }];
};
