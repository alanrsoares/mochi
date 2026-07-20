// LSP-shaped hover, computed from the compiler pipeline but free of any
// editor/protocol dependency so it stays unit-testable under Bun. Given a byte
// offset into the source, it reports the inferred type of the smallest
// expression whose span contains that offset. The language server is a thin
// adapter that maps a cursor Position onto an offset and this string onto a
// hover popup.
import { flatMap, isErr, pipe } from "@onrails/result";
import { check } from "./check";
import { inferProgramTypes, type TypeAt } from "./infer";
import { lex } from "./lexer";
import { parse } from "./parser";
import { preludeEnv } from "./prelude";
import { showType } from "./types";

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

// The inferred type at `offset`, rendered, or null when the source doesn't
// typecheck or nothing sits under the cursor. Open-world so host globals infer.
export const hoverAt = (src: string, offset: number): string | null => {
  const r = pipe(
    lex(src),
    flatMap(parse),
    flatMap(check),
    flatMap((prog) => inferProgramTypes(prog, preludeEnv, { open: true })),
  );
  if (isErr(r)) return null;
  const hit = tightest(r.value.types, offset);
  return hit ? showType(hit.type) : null;
};
