/**
 * Lexer — text → tokens. Returns Result; bad char = Err, not throw.
 * Each emitted token carries its source `span` (half-open [start, end)).
 */
import { err, isErr, ok, type Result } from "@onrails/result";
import { type Diagnostic, lexErr } from "./errors";
import { type Span, span } from "./span";

export type Tok =
  | { t: "let" }
  | { t: "type" }
  | { t: "extern" }
  | { t: "switch" }
  | { t: "import" }
  | { t: "export" }
  | { t: "eq" } // =
  | { t: "arrow" } // =>
  | { t: "tarrow" } // -> (type arrow)
  | { t: "pipe" } // |>
  | { t: "compose" } // >>
  | { t: "concat" } // ++
  | { t: "bar" } // |
  | { t: "lparen" }
  | { t: "rparen" }
  | { t: "lbrace" } // {
  | { t: "rbrace" } // }
  | { t: "lbracket" } // [
  | { t: "rbracket" } // ]
  | { t: "spread" } // ... (list-pattern rest)
  | { t: "plus" } // +
  | { t: "minus" } // -
  | { t: "star" } // *
  | { t: "slash" } // /
  | { t: "percent" } // %
  | { t: "at" } // @ — lazy-List sigil (@{...})
  | { t: "hash" } // # — Map sigil (#{...})
  | { t: "dot" } // .
  | { t: "colon" } // :
  | { t: "question" } // ? (ternary)
  | { t: "eqeq" } // ==
  | { t: "neq" } // !=
  | { t: "lte" } // <=
  | { t: "gte" } // >=
  | { t: "lt" } // <
  | { t: "gt" } // >
  | { t: "andand" } // &&
  | { t: "oror" } // ||
  | { t: "bang" } // !
  | { t: "backtick" } // `
  | { t: "comma" }
  | { t: "num"; v: number; raw: string } // raw source lexeme, so `3.0`/`-3` survive re-printing
  | { t: "bool"; v: boolean } // true / false
  | { t: "str"; v: string } // "..." (decoded value)
  // ${} interpolation (ADR 0023): literal chunks and hole boundaries; hole
  // tokens are re-lexed in place between these markers.
  | { t: "tmplstart"; v: string }
  | { t: "tmplmid"; v: string }
  | { t: "tmplend"; v: string }
  | { t: "id"; v: string }
  | { t: "eof" };

/**
 * A token plus where it came from. `doc` carries a leading `///` comment block
 * (own-line, no blank line before the token) so the parser can attach it to the
 * following `let` — surfaced in hover as prose.
 */
export type Located = Tok & { span: Span; doc?: string };

const KEYWORDS: Record<string, Tok | undefined> = {
  let: { t: "let" },
  type: { t: "type" },
  extern: { t: "extern" },
  switch: { t: "switch" },
  import: { t: "import" },
  export: { t: "export" },
  true: { t: "bool", v: true },
  false: { t: "bool", v: false },
};

/** Two-char operators, checked before single chars. */
const DIGRAPHS: Record<string, Tok | undefined> = {
  "|>": { t: "pipe" },
  ">>": { t: "compose" },
  "++": { t: "concat" },
  "==": { t: "eqeq" },
  "!=": { t: "neq" },
  "<=": { t: "lte" },
  ">=": { t: "gte" },
  "&&": { t: "andand" },
  "||": { t: "oror" },
  "=>": { t: "arrow" },
  "->": { t: "tarrow" }, // type-expression arrow (extern signatures)
};

/** Single-char punctuation → token. */
const PUNCT: Record<string, Tok | undefined> = {
  "+": { t: "plus" },
  "-": { t: "minus" },
  "*": { t: "star" },
  "/": { t: "slash" },
  "%": { t: "percent" },
  "!": { t: "bang" },
  "`": { t: "backtick" },
  "<": { t: "lt" },
  ">": { t: "gt" },
  "|": { t: "bar" },
  "=": { t: "eq" },
  "(": { t: "lparen" },
  ")": { t: "rparen" },
  "{": { t: "lbrace" },
  "}": { t: "rbrace" },
  "[": { t: "lbracket" },
  "]": { t: "rbracket" },
  ",": { t: "comma" },
  ".": { t: "dot" },
  ":": { t: "colon" },
  "?": { t: "question" },
  "@": { t: "at" },
  "#": { t: "hash" },
};

const isSpace = (c: string): boolean => c === " " || c === "\t" || c === "\n" || c === "\r";

/**
 * Skip a string literal starting at its opening quote `i`, descending into any
 * `${...}` holes so their braces and quotes don't confuse a caller that's only
 * counting braces. Returns the index just past the closing quote, or null if
 * unterminated. Used only by `findHoleEnd`'s prescan — decoding happens later
 * in `scanTemplate`.
 */
export const skipStringLiteral = (src: string, i: number): number | null => {
  let j = i + 1;
  while (j < src.length && src[j] !== '"') {
    if (src[j] === "\\" && j + 1 < src.length) {
      j += 2;
      continue;
    }
    if (src[j] === "$" && src[j + 1] === "{") {
      const end = findHoleEnd(src, j + 2);
      if (end === null) return null;
      j = end;
      continue;
    }
    j++;
  }
  return j >= src.length ? null : j + 1;
};

/**
 * Find the index just past the `}` that closes a `${` hole whose contents
 * start at `start` (right after the `${`). Tracks brace depth so a nested
 * record literal or `switch` inside the hole doesn't close it early, and
 * descends into nested string literals (which may carry their own holes).
 */
const findHoleEnd = (src: string, start: number): number | null => {
  let depth = 1;
  let j = start;
  while (j < src.length) {
    const c = src[j]!;
    if (c === '"') {
      const end = skipStringLiteral(src, j);
      if (end === null) return null;
      j = end;
      continue;
    }
    if (c === "/" && src[j + 1] === "/") {
      while (j < src.length && src[j] !== "\n") j++;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return j + 1;
    }
    j++;
  }
  return null;
};

/** One chunk of a scanned `"..."` literal: a decoded literal run or a hole range. */
type TemplatePart = { kind: "lit"; value: string } | { kind: "hole"; start: number; end: number };

/**
 * Scan a `"..."` literal (which may contain `${expr}` holes) starting at the
 * opening quote `i`. `\$` escapes a literal `$`. Returns the alternating
 * lit/hole chunks and the index just past the closing quote, or null if
 * unterminated.
 */
const scanTemplate = (src: string, i: number): { parts: TemplatePart[]; end: number } | null => {
  let j = i + 1;
  let value = "";
  const parts: TemplatePart[] = [];
  while (j < src.length && src[j] !== '"') {
    if (src[j] === "\\" && src[j + 1] === "$") {
      value += "$";
      j += 2;
      continue;
    }
    if (src[j] === "$" && src[j + 1] === "{") {
      parts.push({ kind: "lit", value });
      value = "";
      const holeEnd = findHoleEnd(src, j + 2);
      if (holeEnd === null) return null;
      parts.push({ kind: "hole", start: j + 2, end: holeEnd - 1 });
      j = holeEnd;
      continue;
    }
    if (src[j] === "\\" && j + 1 < src.length) {
      const n = src[j + 1]!;
      value += n === "n" ? "\n" : n === "t" ? "\t" : n; // \\ and \" fall through to the char
      j += 2;
      continue;
    }
    value += src[j];
    j++;
  }
  if (j >= src.length) return null;
  parts.push({ kind: "lit", value });
  return { parts, end: j + 1 };
};

/** Shift a span/token by `by` — place recursively-lexed hole tokens at their real offset. */
const offsetSpan = (s: Span, by: number): Span => span(s.start + by, s.end + by);
const offsetTok = (t: Located, by: number): Located => ({ ...t, span: offsetSpan(t.span, by) });

/**
 * Emit token(s) for a `"..."` literal starting at its opening quote `i`: a plain
 * `str`, or (ADR 0023) `tmplstart`/spliced hole tokens/`tmplmid`s/`tmplend` for
 * interpolations. Returns the index just past the closing quote, or Err on
 * failure inside a hole.
 */
const lexString = (
  src: string,
  i: number,
  emit: (tok: Tok, start: number, end: number) => void,
  toks: Located[],
): Result<number, Diagnostic> => {
  const s = scanTemplate(src, i);
  if (!s) return err(lexErr("unterminated string literal", span(i, src.length)));
  if (s.parts.length === 1) {
    emit({ t: "str", v: (s.parts[0] as { kind: "lit"; value: string }).value }, i, s.end);
    return ok(s.end);
  }
  for (let k = 0; k < s.parts.length; k++) {
    const p = s.parts[k]!;
    if (p.kind === "hole") {
      const holeToks = lex(src.slice(p.start, p.end));
      if (isErr(holeToks)) {
        const e = holeToks.error;
        return err(e.kind === "lex" ? lexErr(e.message, offsetSpan(e.span, p.start)) : e);
      }
      for (const ht of holeToks.value) if (ht.t !== "eof") toks.push(offsetTok(ht, p.start));
      continue;
    }
    const kind = k === 0 ? "tmplstart" : k === s.parts.length - 1 ? "tmplend" : "tmplmid";
    emit({ t: kind, v: p.value } as Tok, i, s.end);
  }
  return ok(s.end);
};

type LineComment = { end: number; doc?: string; breaksDoc: boolean };

const scanLineComment = (src: string, start: number, lineHasToken: boolean): LineComment => {
  const isDoc = src[start + 2] === "/";
  let end = start;
  while (end < src.length && src[end] !== "\n") end++;
  if (lineHasToken) return { end, breaksDoc: false };
  if (!isDoc) return { end, breaksDoc: true };
  const textStart = src[start + 3] === " " ? start + 4 : start + 3;
  return { end, doc: src.slice(textStart, end), breaksDoc: false };
};

export function lex(src: string): Result<Located[], Diagnostic> {
  const toks: Located[] = [];
  let i = 0;
  // Doc-comment state: `pendingDoc` accumulates consecutive own-line `///` lines;
  // it attaches to the next emitted token and clears. `nlRun` counts newlines
  // since the last comment (≥2 = a blank line, which breaks attachment);
  // `lineHasToken` distinguishes an own-line comment from a trailing one.
  let pendingDoc: string[] = [];
  let nlRun = 0;
  let lineHasToken = false;
  // Table tokens are shared singletons; spread to a fresh object + attach span.
  const emit = (tok: Tok, start: number, end: number): void => {
    const t: Located = { ...tok, span: span(start, end) };
    if (pendingDoc.length) {
      t.doc = pendingDoc.join("\n");
      pendingDoc = [];
    }
    toks.push(t);
    lineHasToken = true;
    nlRun = 0;
  };

  while (i < src.length) {
    const c = src[i]!;
    if (isSpace(c)) {
      if (c === "\n") {
        lineHasToken = false;
        if (++nlRun >= 2) pendingDoc = []; // blank line breaks doc attachment
      }
      i++;
      continue;
    }
    // Line comment: only own-line `///` accumulates as docs; ordinary `//` is invisible.
    if (c === "/" && src[i + 1] === "/") {
      const comment = scanLineComment(src, i, lineHasToken);
      i = comment.end;
      if (comment.doc !== undefined) {
        pendingDoc.push(comment.doc);
        nlRun = 0;
      } else if (comment.breaksDoc) {
        pendingDoc = [];
        nlRun = 0;
      }
      continue;
    }

    // `...` (list-pattern rest) before digraph/dot checks, so it isn't split.
    if (src.slice(i, i + 3) === "...") {
      emit({ t: "spread" }, i, i + 3);
      i += 3;
      continue;
    }

    const digraph = DIGRAPHS[src.slice(i, i + 2)];
    if (digraph) {
      emit(digraph, i, i + 2);
      i += 2;
      continue;
    }

    // Hole-free literals stay a plain `str` token — zero churn for the common case.
    if (c === '"') {
      const r = lexString(src, i, emit, toks);
      if (isErr(r)) return r;
      i = r.value;
      continue;
    }

    // Optional leading `-` for negatives; binary minus desugars at parse level.
    const isDigit = (ch: string | undefined): boolean => ch !== undefined && ch >= "0" && ch <= "9";
    if (isDigit(c) || (c === "-" && isDigit(src[i + 1]))) {
      let j = i + 1;
      while (j < src.length && (isDigit(src[j]) || src[j] === ".")) j++;
      const raw = src.slice(i, j);
      emit({ t: "num", v: Number(raw), raw }, i, j);
      i = j;
      continue;
    }

    const punct = PUNCT[c];
    if (punct) {
      emit(punct, i, i + 1);
      i++;
      continue;
    }

    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j]!)) j++;
      const word = src.slice(i, j);
      emit(KEYWORDS[word] ?? { t: "id", v: word }, i, j);
      i = j;
      continue;
    }

    return err(lexErr(`unexpected char '${c}'`, span(i, i + 1)));
  }
  emit({ t: "eof" }, src.length, src.length);
  return ok(toks);
}
