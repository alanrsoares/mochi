import { lex } from "@mochi/compiler/bootstrap/syntax";

type SeedToken = { tok: { _tag: string; value?: unknown }; start: number; end: number };
type SeedLexed = { _tag: "Ok"; value: SeedToken[] } | { _tag: "Err"; error: unknown };

/** What `highlight.mochi` reads: the tag (`TLet` → `"let"`), a string payload, the span. */
export type HighlightToken = { t: string; v?: string; span: { start: number; end: number } };

export type LexedTokens = { _tag: "Ok"; value: HighlightToken[] } | { _tag: "Err"; error: unknown };

const toToken = ({ tok, start, end }: SeedToken): HighlightToken => ({
  t: tok._tag.slice(1).toLowerCase(),
  ...(typeof tok.value === "string" ? { v: tok.value } : {}),
  span: { start, end },
});

/** The seed lexer, flattened to the `{ t, v, span }` tokens the highlighter keys on. */
export const lexTokens = (src: string): LexedTokens => {
  const lexed = lex(src) as SeedLexed;
  return lexed._tag === "Ok" ? { _tag: "Ok", value: lexed.value.map(toToken) } : lexed;
};
