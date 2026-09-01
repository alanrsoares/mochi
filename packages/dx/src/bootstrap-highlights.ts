/** Node-only document-highlight query over the frozen bootstrap symbol index. */
import { type BootstrapOccurrence, symbolOccurrencesBootstrap } from "@mochi/compiler/bootstrap";
import { lex, parseRecovering } from "@mochi/compiler/bootstrap/syntax";
import { None } from "@mochi/compiler/runtime";
import type { Highlight } from "./nav";

/**
 * Every occurrence of the binding under `offset`, from the bootstrap pass.
 * A binding is identified by its declaration span, so shadowed names stay
 * distinct — `defStart`/`defEnd` is the key, never `name`.
 */
export const bootstrapHighlightsAt = (src: string, offset: number): Highlight[] => {
  const occurrences = bootstrapOccurrencesAt(src);
  const hit = occurrences.find((o) => o.start <= offset && offset <= o.end);
  if (!hit) return [];
  // The index emits declarations ahead of the bodies they scope; sort so a
  // caller can read the result as the file reads.
  return occurrences
    .filter((o) => o.defStart === hit.defStart && o.defEnd === hit.defEnd)
    .map(
      (o): Highlight => ({
        span: { start: o.start, end: o.end },
        role: o.role === "def" ? "def" : "use",
      }),
    )
    .sort((a, b) => a.span.start - b.span.start);
};

/** Recovering parse, so a buffer mid-edit still yields the bindings it does have. */
const bootstrapOccurrencesAt = (src: string): BootstrapOccurrence[] => {
  const lexed = lex(src) as { _tag: "Ok"; value: unknown } | { _tag: "Err" };
  if (lexed._tag === "Err") return [];
  const parsed = parseRecovering(lexed.value, None) as { stmts: unknown };
  return symbolOccurrencesBootstrap(parsed.stmts);
};
