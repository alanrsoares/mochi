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
  // ${} interpolation (ADR 0023): tmplstart/tmplmid/tmplend bracket a
  // literal chunk before/between/after holes; a hole's own tokens are
  // ordinary tokens spliced in place (mirrors src/lexer.ts).
  | TTmplStart(value: string)
  | TTmplMid(value: string)
  | TTmplEnd(value: string)
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

// One chunk of a scanned "..." literal: a decoded literal run, or the raw
// source range of a `${expr}` hole (tokenized later by `lexParts`, via a
// recursive `lex` call — so hole tokens get real spans for free).
type TPart =
  | PLit(value: string)
  | PHole(start: number, end: number)

// Skip to (and including) a "..." literal's closing quote, starting at its
// opening quote `i`. Descends into any `${...}` holes (which may themselves
// hold strings/holes) so their braces and quotes don't confuse a caller only
// counting braces. Returns the index just past the closing quote, or None if
// unterminated. Used only by `findHoleEnd`'s prescan — decoding happens
// later, in `scanTemplate`.
let skipStrLoop = (src, j) => switch Str.get(j, src) {
  | None => None
  | Some("\"") => Some(add(j, 1))
  | Some("\\") => switch Str.get(add(j, 1), src) {
    | Some(_) => skipStrLoop(src, add(j, 2))
    | None => skipStrLoop(src, add(j, 1))
  }
  | Some("$") when Str.get(add(j, 1), src) |> Option.contains("{") =>
    switch findHoleEnd(src, add(j, 2)) {
      | Some(hEnd) => skipStrLoop(src, hEnd)
      | None => None
    }
  | Some(_) => skipStrLoop(src, add(j, 1))
}
let skipStringLiteral = (src, i) => skipStrLoop(src, add(i, 1))

// Skip to (not past) the next newline, or to end of source.
let skipLineCommentTo = (src, j) => switch Str.get(j, src) {
  | None => j
  | Some("\n") => j
  | Some(_) => skipLineCommentTo(src, add(j, 1))
}

// Find the index just past the `}` that closes a `${` hole whose contents
// start at `start` (right after the `${`). Tracks brace depth so a nested
// record literal or `switch` inside the hole doesn't close it early, and
// descends into nested string literals (which may carry their own holes).
// Mutually recursive with `skipStringLiteral`.
let findHoleLoop = (src, j, depth) => switch Str.get(j, src) {
  | None => None
  | Some("\"") => switch skipStringLiteral(src, j) {
    | Some(stop) => findHoleLoop(src, stop, depth)
    | None => None
  }
  | Some("/") when Str.get(add(j, 1), src) |> Option.contains("/") =>
    findHoleLoop(src, skipLineCommentTo(src, j), depth)
  | Some("{") => findHoleLoop(src, add(j, 1), add(depth, 1))
  | Some("}") =>
    eq(depth, 1) ? Some(add(j, 1)) : findHoleLoop(src, add(j, 1), sub(depth, 1))
  | Some(_) => findHoleLoop(src, add(j, 1), depth)
}
let findHoleEnd = (src, start) => findHoleLoop(src, start, 1)

// A literal chunk's token kind depends only on position: the sole chunk of a
// hole-free literal stays a plain `str`; otherwise first/middle/last bracket
// the holes (ADR 0023).
let literalTok = (idx, total, value) =>
  eq(total, 1)
    ? TStr(value)
    : eq(idx, 0)
      ? TTmplStart(value)
      : eq(idx, sub(total, 1))
        ? TTmplEnd(value)
        : TTmplMid(value)

// Scan a "..." literal (which may contain `${expr}` holes) starting at its
// opening quote `i`. Returns the alternating lit/hole chunks (oldest first)
// and the index just past the closing quote; None if unterminated.
let scanTemplateLoop = (src, j, value, parts) => switch Str.get(j, src) {
  | None => None
  | Some("\"") => Some({ parts: Array.append(PLit(value), parts), end: add(j, 1) })
  | Some("\\") => switch Str.get(add(j, 1), src) {
    | Some(n) => scanTemplateLoop(src, add(j, 2), Str.concat(value, escChar(n)), parts)
    | None => scanTemplateLoop(src, add(j, 1), Str.concat(value, "\\"), parts)
  }
  | Some("$") when Str.get(add(j, 1), src) |> Option.contains("{") =>
    switch findHoleEnd(src, add(j, 2)) {
      | None => None
      | Some(holeEnd) =>
        let withLit = Array.append(PLit(value), parts) in
        let withHole = Array.append(PHole(add(j, 2), sub(holeEnd, 1)), withLit) in
        scanTemplateLoop(src, holeEnd, "", withHole)
    }
  | Some(c) => scanTemplateLoop(src, add(j, 1), Str.concat(value, c), parts)
}
let scanTemplate = (src, i) => scanTemplateLoop(src, add(i, 1), "", [])

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

// Shift a located token's span by `by` — places a hole's recursively-lexed
// tokens (produced as if the hole's source started at 0) at their real
// position in the enclosing source.
let offsetLocTok = (lt, by) => { tok: lt.tok, start: add(lt.start, by), end: add(lt.end, by), doc: lt.doc }

// Splice a recursively-lexed hole's tokens (minus its trailing `eof`) onto
// `toks`, each shifted by `by` (the hole's start in the enclosing source).
let spliceHoleToks = (holeToks, by, toks) => switch Array.head(holeToks) {
  | None => toks
  | Some(ht) =>
    let toks2 = eq(ht.tok, TEof) ? toks : Array.append(offsetLocTok(ht, by), toks) in
    spliceHoleToks(Array.tail(holeToks), by, toks2)
}

// Recursively lex one `${...}` hole's own source (start/stop are its extent,
// exclusive of the braces) and splice its tokens onto `toks`. A nested lex
// error is offset to a position in the enclosing source.
let spliceHole = (src, start, stop, toks) => switch lex(Str.slice(start, stop, src)) {
  | Ok(holeToks) => Ok(spliceHoleToks(holeToks, start, toks))
  | Err(e) => Err({ message: e.message, start: add(e.start, start), end: add(e.end, start) })
}

// Emit the token(s) for one scanned "..." literal: a plain `str`, or (ADR
// 0023) `tmplstart`/spliced hole tokens/`tmplmid`s/`tmplend` for one holding
// `${expr}` interpolations. All literal-chunk tokens share the template's
// whole span, matching src/lexer.ts's `lexString`.
let lexParts = (src, parts, idx, total, wholeStart, wholeEnd, doc, toks) => switch Array.head(parts) {
  | None => Ok(toks)
  | Some(part) => switch part {
    | PLit(value) =>
      let t = mkTok(literalTok(idx, total, value), wholeStart, wholeEnd, doc) in
      lexParts(src, Array.tail(parts), add(idx, 1), total, wholeStart, wholeEnd, [], Array.append(t, toks))
    | PHole(hs, he) => switch spliceHole(src, hs, he, toks) {
      | Err(e) => Err(e)
      | Ok(toks2) => lexParts(src, Array.tail(parts), add(idx, 1), total, wholeStart, wholeEnd, doc, toks2)
    }
  }
}

// Top-level entry for a "..." literal starting at its opening quote `i`.
// Mutually recursive with `go` (continues the outer scan past the literal).
let lexString = (src, i, doc, toks) => switch scanTemplate(src, i) {
  | None => lexError("unterminated string literal", i, Str.length(src))
  | Some(scanned) => switch lexParts(src, scanned.parts, 0, Array.length(scanned.parts), i, scanned.end, doc, toks) {
    | Err(e) => Err(e)
    | Ok(toks2) => go(src, scanned.end, [], 0, true, toks2)
  }
}

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
              ? lexString(src, i, doc, toks)
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
