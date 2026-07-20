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
  | { t: "eq" } // =
  | { t: "arrow" } // =>
  | { t: "tarrow" } // -> (type arrow)
  | { t: "pipe" } // |>
  | { t: "bar" } // |
  | { t: "lparen" }
  | { t: "rparen" }
  | { t: "lbrace" } // {
  | { t: "rbrace" } // }
  | { t: "dot" } // .
  | { t: "colon" } // :
  | { t: "comma" }
  | { t: "num"; v: number }
  | { t: "bool"; v: boolean } // true / false
  | { t: "str"; v: string } // "..." (decoded value)
  | { t: "id"; v: string }
  | { t: "eof" };

// A token plus where it came from.
export type Located = Tok & { span: Span };

const KEYWORDS: Record<string, Tok | undefined> = {
  let: { t: "let" },
  type: { t: "type" },
  extern: { t: "extern" },
  switch: { t: "switch" },
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
  ",": { t: "comma" },
  ".": { t: "dot" },
  ":": { t: "colon" },
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

export function lex(src: string): Result<Located[], AlangError> {
  const toks: Located[] = [];
  let i = 0;
  // Table tokens are shared singletons; spread to a fresh object + attach span.
  const emit = (tok: Tok, start: number, end: number): void => {
    toks.push({ ...tok, span: span(start, end) });
  };

  while (i < src.length) {
    const c = src[i]!;
    if (isSpace(c)) {
      i++;
      continue;
    }
    // line comment: // ... to end of line
    if (c === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
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

    if (c >= "0" && c <= "9") {
      let j = i;
      while (j < src.length && ((src[j]! >= "0" && src[j]! <= "9") || src[j] === ".")) j++;
      emit({ t: "num", v: Number(src.slice(i, j)) }, i, j);
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
