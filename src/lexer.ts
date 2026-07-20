// Lexer — text → tokens. Returns Result; bad char = Err, not throw.
import { err, ok, type Result } from "@onrails/result";
import { type AlangError, lexErr } from "./errors";

export type Tok =
  | { t: "let" }
  | { t: "type" }
  | { t: "switch" }
  | { t: "eq" } // =
  | { t: "arrow" } // =>
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
  | { t: "id"; v: string }
  | { t: "eof" };

const KEYWORDS: Record<string, Tok | undefined> = {
  let: { t: "let" },
  type: { t: "type" },
  switch: { t: "switch" },
};

// Two-char operators, checked before single chars.
const DIGRAPHS: Record<string, Tok | undefined> = {
  "|>": { t: "pipe" },
  "=>": { t: "arrow" },
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

export function lex(src: string): Result<Tok[], AlangError> {
  const toks: Tok[] = [];
  let i = 0;

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
      toks.push(digraph);
      i += 2;
      continue;
    }

    const punct = PUNCT[c];
    if (punct) {
      toks.push(punct);
      i++;
      continue;
    }

    if (c >= "0" && c <= "9") {
      let j = i;
      while (j < src.length && ((src[j]! >= "0" && src[j]! <= "9") || src[j] === ".")) j++;
      toks.push({ t: "num", v: Number(src.slice(i, j)) });
      i = j;
      continue;
    }

    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j]!)) j++;
      const word = src.slice(i, j);
      toks.push(KEYWORDS[word] ?? { t: "id", v: word });
      i = j;
      continue;
    }

    return err(lexErr(`unexpected char '${c}'`, i));
  }
  toks.push({ t: "eof" });
  return ok(toks);
}
