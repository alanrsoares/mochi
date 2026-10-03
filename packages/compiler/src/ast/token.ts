/**
 * Token vocabulary — what the lexer emits and what `CompilerPlugin` parse hooks
 * read (ADR 0011). Lives in `ast/` so plugin types outlive the TypeScript lexer.
 */
import type { Span } from "./span";

export type Tok =
  | { t: "let" }
  | { t: "type" }
  | { t: "extern" }
  | { t: "switch" }
  | { t: "loop" }
  | { t: "recur" }
  | { t: "do" }
  | { t: "import" }
  | { t: "export" }
  | { t: "eq" } // =
  | { t: "arrow" } // =>
  | { t: "tarrow" } // -> (type arrow)
  | { t: "pipe" } // |>
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
  | { t: "tilde" } // ~ — labeled argument / param (ADR 0098 §2)
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
  | { t: "semi" }
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
