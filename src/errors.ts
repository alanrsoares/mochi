// alang error union — errors as values, one app-level type.
// Every kind may carry a source `span`; lex always does.
import { lineCol, type Span } from "./span";

export type AlangError =
  | { kind: "lex"; message: string; span: Span }
  | { kind: "parse"; message: string; span?: Span }
  | { kind: "check"; message: string; span?: Span }
  | { kind: "type"; message: string; span?: Span };

export const lexErr = (message: string, span: Span): AlangError => ({ kind: "lex", message, span });
export const parseErr = (message: string, span?: Span): AlangError => ({
  kind: "parse",
  message,
  span,
});
export const checkErr = (message: string, span?: Span): AlangError => ({
  kind: "check",
  message,
  span,
});
export const typeErr = (message: string, span?: Span): AlangError => ({
  kind: "type",
  message,
  span,
});

const label: Record<AlangError["kind"], string> = {
  lex: "LexError",
  parse: "ParseError",
  check: "CheckError",
  type: "TypeError",
};

// Human-readable diagnostic. With `src`, a span renders as line:col; without
// it, the raw offset. No span → just the labelled message.
export const formatError = (e: AlangError, src?: string): string => {
  const at = e.span
    ? src
      ? ((p) => ` at ${p.line}:${p.col}`)(lineCol(src, e.span.start))
      : ` at ${e.span.start}`
    : "";
  return `${label[e.kind]}${at}: ${e.message}`;
};
