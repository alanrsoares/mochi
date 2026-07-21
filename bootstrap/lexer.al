// bootstrap/lexer.al — the alang lexer, in alang. Ported from src/lexer.ts
// (the spec); test/bootstrap-lexer.spec.ts diffs the two token streams over
// every .al file in the repo — including this one.
//
// Shape notes vs the TS original:
// - `Tok` is a variant (TS: tagged record union); payloads keep field names.
// - A located token is { tok, start, end, doc } — TS flattens tok + span and
//   makes `doc` optional; here `doc` is an Option.
// - The while-loop becomes `go`, recursing once per char-or-token step. Depth
//   is fine because every recursive call is in tail position and JSC (Bun)
//   eliminates tail frames in strict mode — emitted alang modules are ESM.

type Tok =
  | TLet
  | TType
  | TExtern
  | TSwitch
  | TImport
  | TExport
  | TEq
  | TArrow
  | TTarrow
  | TPipe
  | TBar
  | TLparen
  | TRparen
  | TLbrace
  | TRbrace
  | TLbracket
  | TRbracket
  | TSpread
  | TAt
  | THash
  | TDot
  | TColon
  | TQuestion
  | TComma
  | TNum(value: number, raw: string)
  | TBool(value: bool)
  | TStr(value: string)
  | TId(value: string)
  | TEof

// scanComment's verdict: a doc line (own-line `///`), an ordinary own-line
// comment (breaks doc attachment), or a trailing comment (invisible).
type Comment =
  | DocLine(text: string, stop: number)
  | PlainOwn(stop: number)
  | Trailing(stop: number)

// --- char classes ---
// `\r` has no escape in alang string literals; build it from its code.
let cr = Str.fromCode(13)
let isSpace = c => or(eq(c, " "), or(eq(c, "\t"), or(eq(c, "\n"), eq(c, cr))))
let inRange = (lo, hi, n) => and(gte(n, lo), lte(n, hi))
let isDigit = c => Str.codeAt(0, c) |> Option.exists(inRange(48, 57))
let isIdStart = c =>
  Str.codeAt(0, c)
    |> Option.exists(n => or(inRange(65, 90, n), or(inRange(97, 122, n), eq(n, 95))))
let isIdChar = c => or(isIdStart(c), isDigit(c))
let isNumChar = c => or(isDigit(c), eq(c, "."))

// --- token tables (TS: KEYWORDS / DIGRAPHS / PUNCT records) ---
let keywordTok = word => switch word {
  | "let" => Some(TLet)
  | "type" => Some(TType)
  | "extern" => Some(TExtern)
  | "switch" => Some(TSwitch)
  | "import" => Some(TImport)
  | "export" => Some(TExport)
  | "true" => Some(TBool(true))
  | "false" => Some(TBool(false))
  | _ => None
}
let identTok = word => keywordTok(word) |> Option.unwrapOr(TId(word))

// Two-char operators, checked before single chars.
let digraphTok = two => switch two {
  | "|>" => Some(TPipe)
  | "=>" => Some(TArrow)
  | "->" => Some(TTarrow)
  | _ => None
}

let punctTok = c => switch c {
  | "|" => Some(TBar)
  | "=" => Some(TEq)
  | "(" => Some(TLparen)
  | ")" => Some(TRparen)
  | "{" => Some(TLbrace)
  | "}" => Some(TRbrace)
  | "[" => Some(TLbracket)
  | "]" => Some(TRbracket)
  | "," => Some(TComma)
  | "." => Some(TDot)
  | ":" => Some(TColon)
  | "?" => Some(TQuestion)
  | "@" => Some(TAt)
  | "#" => Some(THash)
  | _ => None
}

// --- scanners ---
// Advance `j` while `pred` holds on the char there; returns the end index.
let scanWhile = (pred, src, j) => switch Str.get(j, src) {
  | Some(c) when pred(c) => scanWhile(pred, src, add(j, 1))
  | _ => j
}

let escChar = n => switch n {
  | "n" => "\n"
  | "t" => "\t"
  | c => c
}

// Scan a "..." literal body starting just past the opening quote. Returns the
// decoded value and the index just past the closing quote; None if unterminated.
let scanStr = (src, j, acc) => switch Str.get(j, src) {
  | None => None
  | Some("\"") => Some((acc, add(j, 1)))
  | Some("\\") => switch Str.get(add(j, 1), src) {
    | Some(n) => scanStr(src, add(j, 2), Str.concat(acc, escChar(n)))
    | None => scanStr(src, add(j, 1), Str.concat(acc, "\\"))
  }
  | Some(c) => scanStr(src, add(j, 1), Str.concat(acc, c))
}

let notNewline = c => not(eq(c, "\n"))

// Line comment starting at `start` (src[start..start+2] is known to be "//").
// Only own-line `///` comments carry doc text; an own-line plain comment
// breaks doc attachment; a trailing comment is invisible.
let scanComment = (src, start, lineTok) =>
  let stop = scanWhile(notNewline, src, start) in
  lineTok
    ? Trailing(stop)
    : Str.get(add(start, 2), src) |> Option.contains("/")
    ? let textStart =
        Str.get(add(start, 3), src) |> Option.contains(" ") ? add(start, 4) : add(start, 3)
      in
      DocLine(Str.slice(textStart, stop, src), stop)
    : PlainOwn(stop)

// Attach the pending doc block (if any) and build the located token.
let mkTok = (tok, start, stop, doc) => switch doc {
  | [] => { tok: tok, start: start, end: stop, doc: None }
  | lines => { tok: tok, start: start, end: stop, doc: Some(Str.join("\n", lines)) }
}

let lexError = (message, start, stop) => Err({ message: message, start: start, end: stop })

// `Number(raw)` in the TS original can be NaN (e.g. "1.2.3"); div(0, 0) mirrors it.
let numValue = raw => Str.toNumber(raw) |> Option.unwrapOr(div(0, 0))

// A `-` before a digit is always a literal sign (alang has no binary minus).
let numStart = (src, i, c) =>
  or(isDigit(c), and(eq(c, "-"), Str.get(add(i, 1), src) |> Option.exists(isDigit)))

// Emit one token: doc attaches and clears, the line now has a token, the
// newline run resets. Mutually recursive with `go`.
let emit = (src, tok, start, stop, doc, toks) =>
  go(src, stop, [], 0, true, Array.append(mkTok(tok, start, stop, doc), toks))

// One step per token. State mirrors the TS locals: `doc` is the pending
// own-line `///` block, `nlRun` counts newlines since the last comment
// (>= 2 = a blank line, which breaks doc attachment), `lineTok` says whether
// the current line already has a token (makes a comment "trailing").
let go = (src, i, doc, nlRun, lineTok, toks) => switch Str.get(i, src) {
  | None => Ok(Array.append(mkTok(TEof, i, i, doc), toks))
  | Some(c) when isSpace(c) =>
    eq(c, "\n")
      ? let n = add(nlRun, 1) in
        let kept = lt(n, 2) ? doc : [] in
        go(src, add(i, 1), kept, n, false, toks)
      : go(src, add(i, 1), doc, nlRun, lineTok, toks)
  | Some("/") when Str.get(add(i, 1), src) |> Option.contains("/") => switch scanComment(src, i, lineTok) {
    | Trailing(stop) => go(src, stop, doc, nlRun, lineTok, toks)
    | PlainOwn(stop) => go(src, stop, [], 0, lineTok, toks)
    | DocLine(text, stop) => go(src, stop, Array.append(text, doc), 0, lineTok, toks)
  }
  | Some(c) =>
    eq(Str.slice(i, add(i, 3), src), "...")
      ? emit(src, TSpread, i, add(i, 3), doc, toks)
      : switch digraphTok(Str.slice(i, add(i, 2), src)) {
        | Some(t) => emit(src, t, i, add(i, 2), doc, toks)
        | None => switch punctTok(c) {
          | Some(t) => emit(src, t, i, add(i, 1), doc, toks)
          | None =>
            eq(c, "\"")
              ? switch scanStr(src, add(i, 1), "") {
                  | Some((value, stop)) => emit(src, TStr(value), i, stop, doc, toks)
                  | None => lexError("unterminated string literal", i, Str.length(src))
                }
              : numStart(src, i, c)
                ? let j = scanWhile(isNumChar, src, add(i, 1)) in
                  let raw = Str.slice(i, j, src) in
                  emit(src, TNum(numValue(raw), raw), i, j, doc, toks)
                : isIdStart(c)
                  ? let j = scanWhile(isIdChar, src, add(i, 1)) in
                    emit(src, identTok(Str.slice(i, j, src)), i, j, doc, toks)
                  : lexError(Str.concat("unexpected char '", Str.concat(c, "'")), i, add(i, 1))
        }
      }
}

export let lex = src => go(src, 0, [], 0, false, [])
