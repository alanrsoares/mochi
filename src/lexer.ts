// Lexer — text → tokens. Returns Result; bad char = Err, not throw.
// Each emitted token carries its source `span` (half-open [start, end)).
import { err, ok, type Result } from "@onrails/result";
import { type AlangError, lexErr } from "./errors";
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
  | { t: "bar" } // |
  | { t: "lparen" }
  | { t: "rparen" }
  | { t: "lbrace" } // {
  | { t: "rbrace" } // }
  | { t: "lbracket" } // [
  | { t: "rbracket" } // ]
  | { t: "spread" } // ... (list-pattern rest)
  | { t: "at" } // @ — lazy-List sigil (@{...})
  | { t: "hash" } // # — Map sigil (#{...})
  | { t: "dot" } // .
  | { t: "colon" } // :
  | { t: "comma" }
  | { t: "num"; v: number; raw: string } // raw source lexeme, so `3.0`/`-3` survive re-printing
  | { t: "bool"; v: boolean } // true / false
  | { t: "str"; v: string } // "..." (decoded value)
  | { t: "id"; v: string }
  | { t: "eof" };

// A token plus where it came from. `doc` carries a leading `///` comment block
// (own-line, no blank line before the token) so the parser can attach it to the
// following `let` — surfaced in hover as prose.
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

// Two-char operators, checked before single chars.
const DIGRAPHS: Record<string, Tok | undefined> = {
  "|>": { t: "pipe" },
  "=>": { t: "arrow" },
  "->": { t: "tarrow" }, // type-expression arrow (extern signatures)
};

// Single-char punctuation → token.
const PUNCT: Record<string, Tok | undefined> = {
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
  "@": { t: "at" },
  "#": { t: "hash" },
};

const isSpace = (c: string): boolean => c === " " || c === "\t" || c === "\n" || c === "\r";

// Scan a "..." literal starting at the opening quote `i`. Returns the decoded
// value and the index just past the closing quote, or null if unterminated.
const scanString = (src: string, i: number): { value: string; end: number } | null => {
  let j = i + 1;
  let value = "";
  while (j < src.length && src[j] !== '"') {
    if (src[j] === "\\" && j + 1 < src.length) {
      const n = src[j + 1]!;
      value += n === "n" ? "\n" : n === "t" ? "\t" : n; // \\ and \" fall through to the char
      j += 2;
    } else {
      value += src[j];
      j++;
    }
  }
  return j >= src.length ? null : { value, end: j + 1 };
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

export function lex(src: string): Result<Located[], AlangError> {
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
    // Line comment: // ... to end of line. Only own-line `///` comments
    // accumulate as docs; ordinary `//` comments stay invisible to tooling.
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

    // `...` (list-pattern rest) before the digraph/dot checks, so it isn't split.
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

    const punct = PUNCT[c];
    if (punct) {
      emit(punct, i, i + 1);
      i++;
      continue;
    }

    // string literal: "..." with \n \t \\ \" escapes; store the decoded value.
    if (c === '"') {
      const s = scanString(src, i);
      if (!s) return err(lexErr("unterminated string literal", span(i, src.length)));
      emit({ t: "str", v: s.value }, i, s.end);
      i = s.end;
      continue;
    }

    // number, with an optional leading `-` for negatives. Safe because alang has
    // no binary minus operator — a `-` before a digit is always a literal sign.
    const isDigit = (ch: string | undefined): boolean => ch !== undefined && ch >= "0" && ch <= "9";
    if (isDigit(c) || (c === "-" && isDigit(src[i + 1]))) {
      let j = i + 1; // past the first digit or the sign
      while (j < src.length && (isDigit(src[j]) || src[j] === ".")) j++;
      const raw = src.slice(i, j);
      emit({ t: "num", v: Number(raw), raw }, i, j);
      i = j;
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
