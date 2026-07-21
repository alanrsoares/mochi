// LSP-shaped hover, computed from the compiler pipeline but free of any
// editor/protocol dependency so it stays unit-testable under Bun. Given a byte
// offset into the source, it reports the inferred type of the smallest
// expression whose span contains that offset. The language server is a thin
// adapter that maps a cursor Position onto an offset and this string onto a
// hover popup.
import { flatMap, isErr, pipe } from "@onrails/result";
import { check } from "./check";
import { inferProgramTypes, type SymbolInfo, type TypeAt } from "./infer";
import { lex } from "./lexer";
import { parse } from "./parser";
import { preludeEnv } from "./prelude";
import { foldAliases, showType } from "./types";

// The tightest span containing `offset`, or null if none. Ties (nested spans of
// equal width) are broken toward the first — they denote the same location.
const tightest = (types: TypeAt[], offset: number): TypeAt | null => {
  let best: TypeAt | null = null;
  for (const t of types) {
    if (offset < t.span.start || offset > t.span.end) continue;
    const width = t.span.end - t.span.start;
    if (!best || width < best.span.end - best.span.start) best = t;
  }
  return best;
};

// A hover payload: `code` is the alang-fenced lead line (a bare type, or a
// TS-style `let x: T` / `(parameter) x: T` / `(property) x: T`), `doc` is an
// optional prose paragraph (a leading `///` comment) rendered below the fence.
export type HoverInfo = { code: string; doc?: string };

// TS-style lead: `kind name: type` for a named symbol, bare type otherwise.
const lead = (type: string, symbol: SymbolInfo | undefined): string => {
  if (!symbol) return type;
  if (symbol.kind === "let") return `let ${symbol.name}: ${type}`;
  if (symbol.kind === "parameter") return `(parameter) ${symbol.name}: ${type}`;
  return `(property) ${symbol.name}: ${type}`;
};

// The hover at `offset`, or null when the source doesn't typecheck or nothing
// sits under the cursor. Open-world so host globals infer.
export const hoverAt = (src: string, offset: number): HoverInfo | null => {
  const r = pipe(
    lex(src),
    flatMap(parse),
    flatMap(check),
    flatMap((prog) => inferProgramTypes(prog, preludeEnv, { open: true })),
  );
  if (isErr(r)) return null;
  const hit = tightest(r.value.types, offset);
  if (!hit) return null;
  const type = showType(foldAliases(hit.type, r.value.aliases));
  return { code: lead(type, hit.symbol), doc: hit.symbol?.doc };
};
