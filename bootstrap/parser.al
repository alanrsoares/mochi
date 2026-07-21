// bootstrap/parser.al — the alang parser, in alang. Ported from src/parser.ts
// (the spec); test/bootstrap-parser.spec.ts diffs canonical AST JSON against
// the TS parser on every .al file in the repo — including this one.
//
// Shape notes vs the TS original:
// - The mutable cursor (`pos`/`last`) becomes threading: every production takes
//   `(toks, pos)` and returns `Ok((node, pos))` or `Err({ message, start, end })`.
//   `to(start)` is derived — the last consumed token is `toks[pos - 1]`.
// - `ParseAbort` (throw/catch) becomes `Result.flatMap` chains: one nesting
//   level per sequenced step. This file is the do-notation pain measurement
//   called for in docs/PATH_TO_BOOTSTRAP.md §2.4.
// - `Tok` is declared here again (same shape as bootstrap/lexer.al) — modules
//   arrive with Slice F; until then the differential suite keeps both honest,
//   and the `_tag` runtime shape makes the two declarations interchangeable.
// - TS optional fields become Options (`doc`, `guard`, `rest`, `alias`), the
//   `exported?` flag a plain bool, and `CtorField.type` is `fieldType` (`type`
//   is a keyword here). The test harness canonicalizes both shapes.

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
  | TComma
  | TNum(value: number, raw: string)
  | TBool(value: bool)
  | TStr(value: string)
  | TId(value: string)
  | TEof

type Span = { start: number, end: number }
type LocTok = { tok: Tok, start: number, end: number, doc: Option string }
type Name = { name: string, span: Span }
type PErr = { message: string, start: number, end: number }

// --- the AST (mirrors src/ast.ts; `kind` strings become constructors) ---

type LamParam =
  | LPName(name: string)
  | LPRecord(fields: [string])
  | LPTuple(names: [string])

type Field = { name: string, value: Expr }
type MapEntry = { key: Expr, value: Expr }
type MatchArm = { pattern: Pattern, guard: Option Expr, body: Expr }
type PatField = { label: string, pat: Pattern }

type Expr =
  | ENum(value: number, raw: string, span: Span)
  | EBool(value: bool, span: Span)
  | EStr(value: string, span: Span)
  | ERef(name: string, span: Span)
  | ECall(fn: Expr, args: [Expr], span: Span)
  | ELambda(params: [LamParam], body: Expr, span: Span)
  | ELetIn(name: string, nameSpan: Span, value: Expr, body: Expr, span: Span)
  | EPipe(left: Expr, right: Expr, span: Span)
  | EMatch(scrutinee: Expr, arms: [MatchArm], span: Span)
  | ERecord(fields: [Field], span: Span)
  | EField(target: Expr, name: string, span: Span)
  | ETuple(elements: [Expr], span: Span)
  | EArr(elements: [Expr], span: Span)
  | EList(elements: [Expr], span: Span)
  | EMap(entries: [MapEntry], span: Span)

type Pattern =
  | PWild(span: Span)
  | PBind(name: string, span: Span)
  | PLit(value: number, raw: string, span: Span)
  | PBool(value: bool, span: Span)
  | PStr(value: string, span: Span)
  | PTuple(elems: [Pattern], span: Span)
  | PRecord(fields: [PatField], span: Span)
  | PCtor(ctor: string, args: [Pattern], span: Span)
  | PArr(elems: [Pattern], rest: Option Pattern, span: Span)
  | PList(elems: [Pattern], rest: Option Pattern, span: Span)

type TypeExpr =
  | TyName(name: string, span: Span)
  | TyArrow(from: TypeExpr, to: TypeExpr, span: Span)
  | TyApp(ctor: string, args: [TypeExpr], span: Span)
  | TyTuple(elems: [TypeExpr], span: Span)
  | TyList(elem: TypeExpr, span: Span)

type CtorField = { name: Option string, fieldType: TypeExpr }
type Ctor = { name: string, fields: [CtorField] }
type AliasField = { name: string, fieldType: TypeExpr }

type Stmt =
  | SLet(name: string, nameSpan: Span, value: Expr, exported: bool, doc: Option string, span: Span)
  | SType(name: string, params: [string], ctors: [Ctor], alias: Option [AliasField], exported: bool, span: Span)
  | SExtern(name: string, nameSpan: Span, typeExpr: TypeExpr, module: string, imported: string, exported: bool, span: Span)
  | SImport(names: [Name], from: string, span: Span)

// --- token plumbing ---

// The TS `t` tag of a token — error messages must match the TS parser's.
let tokName = t => switch t {
  | TLet => "let"
  | TType => "type"
  | TExtern => "extern"
  | TSwitch => "switch"
  | TImport => "import"
  | TExport => "export"
  | TEq => "eq"
  | TArrow => "arrow"
  | TTarrow => "tarrow"
  | TPipe => "pipe"
  | TBar => "bar"
  | TLparen => "lparen"
  | TRparen => "rparen"
  | TLbrace => "lbrace"
  | TRbrace => "rbrace"
  | TLbracket => "lbracket"
  | TRbracket => "rbracket"
  | TSpread => "spread"
  | TAt => "at"
  | THash => "hash"
  | TDot => "dot"
  | TColon => "colon"
  | TComma => "comma"
  | TNum(_, _) => "num"
  | TBool(_) => "bool"
  | TStr(_) => "str"
  | TId(_) => "id"
  | TEof => "eof"
}

// The stream is TEof-terminated, so the fallback is unreachable in practice.
let eofTok = { tok: TEof, start: 0, end: 0, doc: None }
let tokAt = (toks, i) => Array.get(i, toks) |> Option.unwrapOr(eofTok)

let spanOf = lt => { start: lt.start, end: lt.end }
let spanning = (a, b) => { start: a.start, end: b.end }
// Span from a start marker to the last consumed token (TS `to(start)`).
let toEnd = (start, toks, pos) => { start: start.start, end: (tokAt(toks, sub(pos, 1))).end }

let cat = parts => Str.join("", parts)
let errAt = (message, lt) => Err({ message: message, start: lt.start, end: lt.end })

let expectTok = (t, toks, pos) =>
  let lt = tokAt(toks, pos) in
  switch eq(lt.tok, t) {
    | true => Ok(add(pos, 1))
    | false => errAt(cat(["expected ", tokName(t), ", got ", tokName(lt.tok)]), lt)
  }

let expectId = (toks, pos) =>
  let lt = tokAt(toks, pos) in
  switch lt.tok {
    | TId(name) => Ok(({ name: name, span: spanOf(lt) }, add(pos, 1)))
    | t => errAt(cat(["expected id, got ", tokName(t)]), lt)
  }

let expectStr = (toks, pos) =>
  let lt = tokAt(toks, pos) in
  switch lt.tok {
    | TStr(value) => Ok((value, add(pos, 1)))
    | t => errAt(cat(["expected str, got ", tokName(t)]), lt)
  }

// Consume the contextual `in` keyword after a let binding's value.
let expectIn = (toks, pos) =>
  expectId(toks, pos) |> Result.flatMap(((kw, p)) => switch eq(kw.name, "in") {
    | true => Ok(p)
    | false => errAt(cat(["expected 'in' after let binding, got '", kw.name, "'"]), tokAt(toks, p))
  })

let isUpper = s => Str.codeAt(0, s) |> Option.exists(n => and(gte(n, 65), lte(n, 90)))

// --- generic comma-separated lists ---

// `item (, item)*` — at least one item; the caller peeks the closer for empty.
let sepBy = (parseItem, toks, pos, acc) =>
  parseItem(toks, pos) |> Result.flatMap(((item, p)) =>
    let items = Array.append(item, acc) in
    switch eq((tokAt(toks, p)).tok, TComma) {
      | true => sepBy(parseItem, toks, add(p, 1), items)
      | false => Ok((items, p))
    })

// A possibly-empty comma list ended by `close`; does NOT consume the closer.
let listUntil = (close, parseItem, toks, pos) =>
  switch eq((tokAt(toks, pos)).tok, close) {
    | true => Ok(([], pos))
    | false => sepBy(parseItem, toks, pos, [])
  }

// --- expressions ---

// `(…) =>` needs unbounded lookahead: scan to the matching rparen.
let scanLambdaDepth = (toks, k, depth) => switch (tokAt(toks, k)).tok {
  | TLparen => scanLambdaDepth(toks, add(k, 1), add(depth, 1))
  | TRparen => switch eq(depth, 1) {
    | true => eq((tokAt(toks, add(k, 1))).tok, TArrow)
    | false => scanLambdaDepth(toks, add(k, 1), sub(depth, 1))
  }
  | TEof => false
  | _ => scanLambdaDepth(toks, add(k, 1), depth)
}

let looksLikeLambda = (toks, pos) => switch (tokAt(toks, pos)).tok {
  | TId(_) => eq((tokAt(toks, add(pos, 1))).tok, TArrow)
  | TLparen => scanLambdaDepth(toks, pos, 0)
  | _ => false
}

// The span of a node, for composite spans (TS reads `.span` directly).
let exprSpan = e => switch e {
  | ENum(_, _, sp) => sp
  | EBool(_, sp) => sp
  | EStr(_, sp) => sp
  | ERef(_, sp) => sp
  | ECall(_, _, sp) => sp
  | ELambda(_, _, sp) => sp
  | ELetIn(_, _, _, _, sp) => sp
  | EPipe(_, _, sp) => sp
  | EMatch(_, _, sp) => sp
  | ERecord(_, sp) => sp
  | EField(_, _, sp) => sp
  | ETuple(_, sp) => sp
  | EArr(_, sp) => sp
  | EList(_, sp) => sp
  | EMap(_, sp) => sp
}

let tySpan = t => switch t {
  | TyName(_, sp) => sp
  | TyArrow(_, _, sp) => sp
  | TyApp(_, _, sp) => sp
  | TyTuple(_, sp) => sp
  | TyList(_, sp) => sp
}

// One lambda parameter: a name, `{ a, b }` record-destructuring, or `(a, b)`
// tuple-destructuring. A lone `(x)` is just grouping, not a 1-tuple.
let parseParam = (toks, pos) => switch (tokAt(toks, pos)).tok {
  | TLbrace =>
    listUntil(TRbrace, expectId, toks, add(pos, 1)) |> Result.flatMap(((fields, p)) =>
      expectTok(TRbrace, toks, p) |> Result.map(p2 => (LPRecord(fields |> map(f => f.name)), p2)))
  | TLparen =>
    sepBy(expectId, toks, add(pos, 1), []) |> Result.flatMap(((names, p)) =>
      expectTok(TRparen, toks, p) |> Result.map(p2 => switch names {
        | [single] => (LPName(single.name), p2)
        | many => (LPTuple(many |> map(n => n.name)), p2)
      }))
  | _ => expectId(toks, pos) |> Result.map(((nm, p)) => (LPName(nm.name), p))
}

let parseLambda = (toks, pos) =>
  let start = spanOf(tokAt(toks, pos)) in
  switch (tokAt(toks, pos)).tok {
    | TId(name) =>
      expectTok(TArrow, toks, add(pos, 1)) |> Result.flatMap(p =>
        parseExpr(toks, p) |> Result.map(((body, p2)) =>
          (ELambda([LPName(name)], body, spanning(start, exprSpan(body))), p2)))
    | _ =>
      expectTok(TLparen, toks, pos) |> Result.flatMap(p =>
        listUntil(TRparen, parseParam, toks, p) |> Result.flatMap(((params, p2)) =>
        expectTok(TRparen, toks, p2) |> Result.flatMap(p3 =>
        expectTok(TArrow, toks, p3) |> Result.flatMap(p4 =>
        parseExpr(toks, p4) |> Result.map(((body, p5)) =>
          (ELambda(params, body, spanning(start, exprSpan(body))), p5))))))
  }

// let x = value in body — non-recursive local binding. `let (a, b) = v in b`
// desugars to an applied tuple-param lambda, exactly like the TS parser.
let parseLetIn = (toks, pos) =>
  let start = spanOf(tokAt(toks, pos)) in
  expectTok(TLet, toks, pos) |> Result.flatMap(p =>
    switch eq((tokAt(toks, p)).tok, TLparen) {
      | true =>
        let paramStart = spanOf(tokAt(toks, p)) in
        parseParam(toks, p) |> Result.flatMap(((param, p1)) =>
        expectTok(TEq, toks, p1) |> Result.flatMap(p2 =>
        parseExpr(toks, p2) |> Result.flatMap(((value, p3)) =>
        expectIn(toks, p3) |> Result.flatMap(p4 =>
        parseExpr(toks, p4) |> Result.map(((body, p5)) =>
          let fn = ELambda([param], body, spanning(paramStart, exprSpan(body))) in
          (ECall(fn, [value], spanning(start, exprSpan(body))), p5))))))
      | false =>
        expectId(toks, p) |> Result.flatMap(((nm, p1)) =>
        expectTok(TEq, toks, p1) |> Result.flatMap(p2 =>
        parseExpr(toks, p2) |> Result.flatMap(((value, p3)) =>
        expectIn(toks, p3) |> Result.flatMap(p4 =>
        parseExpr(toks, p4) |> Result.map(((body, p5)) =>
          (ELetIn(nm.name, nm.span, value, body, spanning(start, exprSpan(body))), p5))))))
    })

let parseExpr = (toks, pos) => switch (tokAt(toks, pos)).tok {
  | TLet => parseLetIn(toks, pos)
  | _ => switch looksLikeLambda(toks, pos) {
    | true => parseLambda(toks, pos)
    | false => parseAtomOrCall(toks, pos) |> Result.flatMap(((left, p)) => pipeLoop(left, toks, p))
  }
}

let pipeLoop = (left, toks, pos) => switch eq((tokAt(toks, pos)).tok, TPipe) {
  | true =>
    parseAtomOrCall(toks, add(pos, 1)) |> Result.flatMap(((right, p)) =>
      pipeLoop(EPipe(left, right, spanning(exprSpan(left), exprSpan(right))), toks, p))
  | false => Ok((left, pos))
}

// Postfix chain: calls `f(...)` and field access `.name`.
let postfixLoop = (e, toks, pos) => switch (tokAt(toks, pos)).tok {
  | TLparen =>
    listUntil(TRparen, parseExpr, toks, add(pos, 1)) |> Result.flatMap(((args, p)) =>
      expectTok(TRparen, toks, p) |> Result.flatMap(p2 =>
        postfixLoop(ECall(e, args, toEnd(exprSpan(e), toks, p2)), toks, p2)))
  | TDot =>
    expectId(toks, add(pos, 1)) |> Result.flatMap(((id, p)) =>
      postfixLoop(EField(e, id.name, spanning(exprSpan(e), id.span)), toks, p))
  | _ => Ok((e, pos))
}

let parseAtomOrCall = (toks, pos) =>
  parseAtom(toks, pos) |> Result.flatMap(((e, p)) => postfixLoop(e, toks, p))

let parseAtom = (toks, pos) =>
  let lt = tokAt(toks, pos) in
  let sp = spanOf(lt) in
  switch lt.tok {
    | TSwitch => parseMatch(toks, pos)
    | TLbrace => parseRecord(toks, pos)
    | TLbracket => parseArr(toks, pos)
    | TAt => parseList(toks, pos)
    | THash => parseMap(toks, pos)
    | TNum(value, raw) => Ok((ENum(value, raw, sp), add(pos, 1)))
    | TBool(value) => Ok((EBool(value, sp), add(pos, 1)))
    | TStr(value) => Ok((EStr(value, sp), add(pos, 1)))
    | TId(name) => Ok((ERef(name, sp), add(pos, 1)))
    | TLparen =>
      parseExpr(toks, add(pos, 1)) |> Result.flatMap(((first, p)) =>
        switch eq((tokAt(toks, p)).tok, TComma) {
          | true =>
            sepBy(parseExpr, toks, add(p, 1), [first]) |> Result.flatMap(((elements, p2)) =>
              expectTok(TRparen, toks, p2) |> Result.map(p3 =>
                (ETuple(elements, toEnd(sp, toks, p3)), p3)))
          | false => expectTok(TRparen, toks, p) |> Result.map(p2 => (first, p2))
        })
    | t => errAt(cat(["unexpected token ", tokName(t)]), lt)
  }

let parseField = (toks, pos) =>
  expectId(toks, pos) |> Result.flatMap(((nm, p)) =>
    expectTok(TColon, toks, p) |> Result.flatMap(p2 =>
      parseExpr(toks, p2) |> Result.map(((value, p3)) => ({ name: nm.name, value: value }, p3))))

let parseRecord = (toks, pos) =>
  let start = spanOf(tokAt(toks, pos)) in
  expectTok(TLbrace, toks, pos) |> Result.flatMap(p =>
    listUntil(TRbrace, parseField, toks, p) |> Result.flatMap(((fields, p2)) =>
      expectTok(TRbrace, toks, p2) |> Result.map(p3 =>
        (ERecord(fields, toEnd(start, toks, p3)), p3))))

let parseArr = (toks, pos) =>
  let start = spanOf(tokAt(toks, pos)) in
  expectTok(TLbracket, toks, pos) |> Result.flatMap(p =>
    listUntil(TRbracket, parseExpr, toks, p) |> Result.flatMap(((elements, p2)) =>
      expectTok(TRbracket, toks, p2) |> Result.map(p3 =>
        (EArr(elements, toEnd(start, toks, p3)), p3))))

// `@{…}` lazy-List literal — the `@` sigil keeps it clear of records.
let parseList = (toks, pos) =>
  let start = spanOf(tokAt(toks, pos)) in
  expectTok(TAt, toks, pos) |> Result.flatMap(p =>
    expectTok(TLbrace, toks, p) |> Result.flatMap(p1 =>
    listUntil(TRbrace, parseExpr, toks, p1) |> Result.flatMap(((elements, p2)) =>
      expectTok(TRbrace, toks, p2) |> Result.map(p3 =>
        (EList(elements, toEnd(start, toks, p3)), p3)))))

let parseMapEntry = (toks, pos) =>
  parseExpr(toks, pos) |> Result.flatMap(((key, p)) =>
    expectTok(TColon, toks, p) |> Result.flatMap(p2 =>
      parseExpr(toks, p2) |> Result.map(((value, p3)) => ({ key: key, value: value }, p3))))

// `#{ key: value, … }` Map literal — keys are full expressions.
let parseMap = (toks, pos) =>
  let start = spanOf(tokAt(toks, pos)) in
  expectTok(THash, toks, pos) |> Result.flatMap(p =>
    expectTok(TLbrace, toks, p) |> Result.flatMap(p1 =>
    listUntil(TRbrace, parseMapEntry, toks, p1) |> Result.flatMap(((entries, p2)) =>
      expectTok(TRbrace, toks, p2) |> Result.map(p3 =>
        (EMap(entries, toEnd(start, toks, p3)), p3)))))

// --- pattern matching ---

// `when <expr>` guard — contextual keyword, like `in`.
let parseGuard = (toks, pos) => switch (tokAt(toks, pos)).tok {
  | TId("when") => parseExpr(toks, add(pos, 1)) |> Result.map(((g, p)) => (Some(g), p))
  | _ => Ok((None, pos))
}

let armsLoop = (toks, pos, acc) => switch eq((tokAt(toks, pos)).tok, TBar) {
  | true =>
    parsePattern(toks, add(pos, 1)) |> Result.flatMap(((pattern, p1)) =>
    parseGuard(toks, p1) |> Result.flatMap(((guard, p2)) =>
    expectTok(TArrow, toks, p2) |> Result.flatMap(p3 =>
    parseExpr(toks, p3) |> Result.flatMap(((body, p4)) =>
      armsLoop(toks, p4, Array.append({ pattern: pattern, guard: guard, body: body }, acc))))))
  | false => Ok((acc, pos))
}

let parseMatch = (toks, pos) =>
  let start = spanOf(tokAt(toks, pos)) in
  expectTok(TSwitch, toks, pos) |> Result.flatMap(p =>
    parseExpr(toks, p) |> Result.flatMap(((scrutinee, p1)) =>
    expectTok(TLbrace, toks, p1) |> Result.flatMap(p2 =>
    armsLoop(toks, p2, []) |> Result.flatMap(((arms, p3)) =>
      switch Array.length(arms) {
        | 0 => errAt("switch needs at least one | arm", tokAt(toks, p3))
        | _ => expectTok(TRbrace, toks, p3) |> Result.map(p4 =>
            (EMatch(scrutinee, arms, toEnd(start, toks, p4)), p4))
      }))))

// A ctor pattern's argument list, after the (already consumed) ctor name.
let parseCtorArgs = (ctor, nameSpan, toks, pos) =>
  switch eq((tokAt(toks, pos)).tok, TLparen) {
    | true =>
      listUntil(TRparen, parsePattern, toks, add(pos, 1)) |> Result.flatMap(((args, p)) =>
        expectTok(TRparen, toks, p) |> Result.map(p2 =>
          (PCtor(ctor, args, toEnd(nameSpan, toks, p2)), p2)))
    | false => Ok((PCtor(ctor, [], nameSpan), pos))
  }

let parsePattern = (toks, pos) =>
  let lt = tokAt(toks, pos) in
  let sp = spanOf(lt) in
  switch lt.tok {
    | TNum(value, raw) => Ok((PLit(value, raw, sp), add(pos, 1)))
    | TBool(value) => Ok((PBool(value, sp), add(pos, 1)))
    | TStr(value) => Ok((PStr(value, sp), add(pos, 1)))
    | TLparen =>
      // `(p, p, …)` destructures a tuple; a lone `(p)` is just grouping.
      sepBy(parsePattern, toks, add(pos, 1), []) |> Result.flatMap(((elems, p)) =>
        expectTok(TRparen, toks, p) |> Result.map(p2 => switch elems {
          | [single] => (single, p2)
          | many => (PTuple(many, toEnd(sp, toks, p2)), p2)
        }))
    | TLbrace =>
      listUntil(TRbrace, parsePatField, toks, add(pos, 1)) |> Result.flatMap(((fields, p)) =>
        expectTok(TRbrace, toks, p) |> Result.map(p2 =>
          (PRecord(fields, toEnd(sp, toks, p2)), p2)))
    | TLbracket => parseArrPattern(toks, pos)
    | TAt => parseListPattern(toks, pos)
    | TId("_") => Ok((PWild(sp), add(pos, 1)))
    | TId(name) => switch isUpper(name) {
      | true => parseCtorArgs(name, sp, toks, add(pos, 1))
      | false => Ok((PBind(name, sp), add(pos, 1)))
    }
    | t => errAt(cat(["unexpected token in pattern: ", tokName(t)]), lt)
  }

// A `...` rest capture must bind a name or `_`.
let restOk = rest => switch rest {
  | None => true
  | Some(PBind(_, _)) => true
  | Some(PWild(_)) => true
  | Some(_) => false
}

// Elements of a sequence pattern; a `...rest` is terminal.
let patElemsLoop = (toks, pos, acc) => switch (tokAt(toks, pos)).tok {
  | TSpread =>
    parsePattern(toks, add(pos, 1)) |> Result.map(((rest, p)) => (acc, Some(rest), p))
  | _ =>
    parsePattern(toks, pos) |> Result.flatMap(((pat, p)) =>
      let elems = Array.append(pat, acc) in
      switch eq((tokAt(toks, p)).tok, TComma) {
        | true => patElemsLoop(toks, add(p, 1), elems)
        | false => Ok((elems, None, p))
      })
}

let parseArrPattern = (toks, pos) =>
  let start = spanOf(tokAt(toks, pos)) in
  expectTok(TLbracket, toks, pos) |> Result.flatMap(p =>
    switch eq((tokAt(toks, p)).tok, TRbracket) {
      | true => Ok((PArr([], None, toEnd(start, toks, add(p, 1))), add(p, 1)))
      | false =>
        patElemsLoop(toks, p, []) |> Result.flatMap(((elems, rest, p2)) =>
          switch restOk(rest) {
            | false => errAt("list `...` rest must bind a name or `_`", tokAt(toks, p2))
            | true => expectTok(TRbracket, toks, p2) |> Result.map(p3 =>
                (PArr(elems, rest, toEnd(start, toks, p3)), p3))
          })
    })

// `@{}` / `@{head, ...tail}` lazy-List pattern; check.ts restricts the forms.
let parseListPattern = (toks, pos) =>
  let start = spanOf(tokAt(toks, pos)) in
  expectTok(TAt, toks, pos) |> Result.flatMap(p =>
    expectTok(TLbrace, toks, p) |> Result.flatMap(p1 =>
      switch eq((tokAt(toks, p1)).tok, TRbrace) {
        | true => Ok((PList([], None, toEnd(start, toks, add(p1, 1))), add(p1, 1)))
        | false =>
          patElemsLoop(toks, p1, []) |> Result.flatMap(((elems, rest, p2)) =>
            switch restOk(rest) {
              | false => errAt("list `...` rest must bind a name or `_`", tokAt(toks, p2))
              | true => expectTok(TRbrace, toks, p2) |> Result.map(p3 =>
                  (PList(elems, rest, toEnd(start, toks, p3)), p3))
            })
      }))

// `{ x }` puns to binding `x`; `{ x: pat }` matches `x` against a full pattern.
let parsePatField = (toks, pos) =>
  expectId(toks, pos) |> Result.flatMap(((nm, p)) =>
    switch eq((tokAt(toks, p)).tok, TColon) {
      | true => parsePattern(toks, add(p, 1)) |> Result.map(((pat, p2)) =>
          ({ label: nm.name, pat: pat }, p2))
      | false => Ok(({ label: nm.name, pat: PBind(nm.name, nm.span) }, p))
    })

// --- type expressions (extern signatures + ctor fields) ---

let parseTypeAtom = (toks, pos) =>
  let lt = tokAt(toks, pos) in
  let sp = spanOf(lt) in
  switch lt.tok {
    | TLparen =>
      // `(a, b)` is a tuple type; a lone `(t)` is just grouping.
      parseTypeExpr(toks, add(pos, 1)) |> Result.flatMap(((inner, p)) =>
        switch eq((tokAt(toks, p)).tok, TComma) {
          | true =>
            sepBy(parseTypeExpr, toks, add(p, 1), [inner]) |> Result.flatMap(((elems, p2)) =>
              expectTok(TRparen, toks, p2) |> Result.map(p3 =>
                (TyTuple(elems, toEnd(sp, toks, p3)), p3)))
          | false => expectTok(TRparen, toks, p) |> Result.map(p2 => (inner, p2))
        })
    | TLbracket =>
      parseTypeExpr(toks, add(pos, 1)) |> Result.flatMap(((elem, p)) =>
        expectTok(TRbracket, toks, p) |> Result.map(p2 =>
          (TyList(elem, toEnd(sp, toks, p2)), p2)))
    | _ => expectId(toks, pos) |> Result.map(((nm, p)) => (TyName(nm.name, nm.span), p))
  }

let startsTypeAtom = t => switch t {
  | TId(_) => true
  | TLparen => true
  | TLbracket => true
  | _ => false
}

let typeArgsLoop = (toks, pos, acc, lastSp) =>
  switch startsTypeAtom((tokAt(toks, pos)).tok) {
    | true => parseTypeAtom(toks, pos) |> Result.flatMap(((a, p)) =>
        typeArgsLoop(toks, p, Array.append(a, acc), Some(tySpan(a))))
    | false => Ok((acc, lastSp, pos))
  }

// Type application by juxtaposition, tighter than `->`: only an Uppercase
// constructor head takes args (`Task a`, `Result a e`).
let parseTypeApp = (toks, pos) =>
  parseTypeAtom(toks, pos) |> Result.flatMap(((head, p)) =>
    switch head {
      | TyName(name, sp) when isUpper(name) =>
        typeArgsLoop(toks, p, [], None) |> Result.map(((args, lastSp, p2)) =>
          switch lastSp {
            | None => (head, p2)
            | Some(ls) => (TyApp(name, args, spanning(sp, ls)), p2)
          })
      | _ => Ok((head, p))
    })

// Arrows are right-associative.
let parseTypeExpr = (toks, pos) =>
  parseTypeApp(toks, pos) |> Result.flatMap(((from, p)) =>
    switch eq((tokAt(toks, p)).tok, TTarrow) {
      | true => parseTypeExpr(toks, add(p, 1)) |> Result.map(((to, p2)) =>
          (TyArrow(from, to, spanning(tySpan(from), tySpan(to))), p2))
      | false => Ok((from, p))
    })

// --- statements ---

// A constructor field: `type` (positional) or `label: type` — one token of
// lookahead tells them apart (ADR 0015).
let parseCtorField = (toks, pos) =>
  let isLabel = switch (tokAt(toks, pos)).tok {
    | TId(_) => eq((tokAt(toks, add(pos, 1))).tok, TColon)
    | _ => false
  } in
  switch isLabel {
    | true =>
      expectId(toks, pos) |> Result.flatMap(((nm, p)) =>
        parseTypeExpr(toks, add(p, 1)) |> Result.map(((t, p2)) =>
          ({ name: Some(nm.name), fieldType: t }, p2)))
    | false =>
      parseTypeExpr(toks, pos) |> Result.map(((t, p)) => ({ name: None, fieldType: t }, p))
  }

let parseCtor = (toks, pos) =>
  expectId(toks, pos) |> Result.flatMap(((nm, p)) =>
    switch eq((tokAt(toks, p)).tok, TLparen) {
      | true =>
        listUntil(TRparen, parseCtorField, toks, add(p, 1)) |> Result.flatMap(((fields, p2)) =>
          expectTok(TRparen, toks, p2) |> Result.map(p3 =>
            ({ name: nm.name, fields: fields }, p3)))
      | false => Ok(({ name: nm.name, fields: [] }, p))
    })

let ctorsLoop = (toks, pos, acc) =>
  parseCtor(toks, pos) |> Result.flatMap(((c, p)) =>
    let cs = Array.append(c, acc) in
    switch eq((tokAt(toks, p)).tok, TBar) {
      | true => ctorsLoop(toks, add(p, 1), cs)
      | false => Ok((cs, p))
    })

let parseAliasField = (toks, pos) =>
  expectId(toks, pos) |> Result.flatMap(((nm, p)) =>
    expectTok(TColon, toks, p) |> Result.flatMap(p2 =>
      parseTypeExpr(toks, p2) |> Result.map(((t, p3)) => ({ name: nm.name, fieldType: t }, p3))))

// The `{ x: T, y: U }` body of a transparent record alias.
let parseAliasBody = (toks, pos) =>
  expectTok(TLbrace, toks, pos) |> Result.flatMap(p =>
    listUntil(TRbrace, parseAliasField, toks, p) |> Result.flatMap(((fields, p2)) =>
      expectTok(TRbrace, toks, p2) |> Result.map(p3 => (fields, p3))))

// Optional ML-style type parameters: any ids before the `=`.
let typeParamsLoop = (toks, pos, acc) => switch (tokAt(toks, pos)).tok {
  | TId(name) => typeParamsLoop(toks, add(pos, 1), Array.append(name, acc))
  | _ => (acc, pos)
}

// `type` decl: a `{` after `=` starts a record alias; anything else a variant.
let parseType = (toks, pos) =>
  let start = spanOf(tokAt(toks, pos)) in
  expectTok(TType, toks, pos) |> Result.flatMap(p =>
    expectId(toks, p) |> Result.flatMap(((nm, p1)) =>
      let (params, p2) = typeParamsLoop(toks, p1, []) in
      expectTok(TEq, toks, p2) |> Result.flatMap(p3 =>
        switch eq((tokAt(toks, p3)).tok, TLbrace) {
          | true =>
            parseAliasBody(toks, p3) |> Result.map(((alias, p4)) =>
              (SType(nm.name, params, [], Some(alias), false, toEnd(start, toks, p4)), p4))
          | false =>
            let afterBar = switch eq((tokAt(toks, p3)).tok, TBar) {
              | true => add(p3, 1)
              | false => p3
            } in
            ctorsLoop(toks, afterBar, []) |> Result.map(((ctors, p4)) =>
              (SType(nm.name, params, ctors, None, false, toEnd(start, toks, p4)), p4))
        })))

// extern name : type = "module" "export"
let parseExtern = (toks, pos) =>
  let start = spanOf(tokAt(toks, pos)) in
  expectTok(TExtern, toks, pos) |> Result.flatMap(p =>
    expectId(toks, p) |> Result.flatMap(((nm, p1)) =>
    expectTok(TColon, toks, p1) |> Result.flatMap(p2 =>
    parseTypeExpr(toks, p2) |> Result.flatMap(((t, p3)) =>
    expectTok(TEq, toks, p3) |> Result.flatMap(p4 =>
    expectStr(toks, p4) |> Result.flatMap(((moduleName, p5)) =>
    expectStr(toks, p5) |> Result.map(((importedName, p6)) =>
      (SExtern(nm.name, nm.span, t, moduleName, importedName, false, toEnd(start, toks, p6)), p6))))))))

// import { a, b } from "./mod" — `from` is contextual (still a valid id).
let parseImport = (toks, pos) =>
  let start = spanOf(tokAt(toks, pos)) in
  expectTok(TImport, toks, pos) |> Result.flatMap(p =>
    expectTok(TLbrace, toks, p) |> Result.flatMap(p1 =>
    listUntil(TRbrace, expectId, toks, p1) |> Result.flatMap(((names, p2)) =>
    expectTok(TRbrace, toks, p2) |> Result.flatMap(p3 =>
    expectId(toks, p3) |> Result.flatMap(((kw, p4)) =>
      switch eq(kw.name, "from") {
        | false => errAt(cat(["expected 'from' in import, got '", kw.name, "'"]), tokAt(toks, p4))
        | true => expectStr(toks, p4) |> Result.map(((path, p5)) =>
            (SImport(names, path, toEnd(start, toks, p5)), p5))
      })))))

// `let { x, y } = e` desugars to a `$dN` temp binding plus one field-access
// `let` per name — mirrors the TS parser, including the temp counter.
let parseRecordDestructure = (start, toks, pos, tmp) =>
  let openSp = spanOf(tokAt(toks, pos)) in
  expectTok(TLbrace, toks, pos) |> Result.flatMap(p =>
    listUntil(TRbrace, expectId, toks, p) |> Result.flatMap(((fields, p1)) =>
      let closeSp = spanOf(tokAt(toks, p1)) in
      expectTok(TRbrace, toks, p1) |> Result.flatMap(p2 =>
      expectTok(TEq, toks, p2) |> Result.flatMap(p3 =>
      parseExpr(toks, p3) |> Result.map(((value, p4)) =>
        let whole = spanning(start, exprSpan(value)) in
        let patSpan = spanning(openSp, closeSp) in
        let tmpName = Str.concat("$d", show(tmp)) in
        let header = SLet(tmpName, patSpan, value, false, None, whole) in
        let access = f =>
          SLet(f.name, f.span, EField(ERef(tmpName, f.span), f.name, f.span), false, None, f.span) in
        (Array.prepend(header, fields |> map(access)), p4, add(tmp, 1)))))))

let parseLet = (toks, pos, tmp) =>
  let start = spanOf(tokAt(toks, pos)) in
  expectTok(TLet, toks, pos) |> Result.flatMap(p =>
    switch eq((tokAt(toks, p)).tok, TLbrace) {
      | true => parseRecordDestructure(start, toks, p, tmp)
      | false =>
        expectId(toks, p) |> Result.flatMap(((nm, p1)) =>
        expectTok(TEq, toks, p1) |> Result.flatMap(p2 =>
        parseExpr(toks, p2) |> Result.map(((value, p3)) =>
          ([SLet(nm.name, nm.span, value, false, None, spanning(start, exprSpan(value)))], p3, tmp))))
    })

// Rebuilders for the export/doc metadata the TS parser spreads on.
let setLetMeta = (exported, doc, s) => switch s {
  | SLet(name, nameSpan, value, _, _, span) => SLet(name, nameSpan, value, exported, doc, span)
  | other => other
}
let setTypeExported = s => switch s {
  | SType(name, params, ctors, alias, _, span) => SType(name, params, ctors, alias, true, span)
  | other => other
}
let setExternExported = s => switch s {
  | SExtern(name, nameSpan, t, m, i, _, span) => SExtern(name, nameSpan, t, m, i, true, span)
  | other => other
}

// A statement can desugar to several (record destructure); the leading `///`
// doc block rides on the first token and attaches to every produced `let`.
let parseStmt = (toks, pos, tmp) =>
  let lt = tokAt(toks, pos) in
  let doc = lt.doc in
  switch lt.tok {
    | TImport => parseImport(toks, pos) |> Result.map(((s, p)) => ([s], p, tmp))
    | TExport => switch (tokAt(toks, add(pos, 1))).tok {
      | TType => parseType(toks, add(pos, 1)) |> Result.map(((s, p)) =>
          ([setTypeExported(s)], p, tmp))
      | TExtern => parseExtern(toks, add(pos, 1)) |> Result.map(((s, p)) =>
          ([setExternExported(s)], p, tmp))
      | TLet => parseLet(toks, add(pos, 1), tmp) |> Result.map(((stmts, p, tmp2)) =>
          (stmts |> map(setLetMeta(true, doc)), p, tmp2))
      | _ => errAt("`export` must precede let, type, or extern", tokAt(toks, add(pos, 1)))
    }
    | TType => parseType(toks, pos) |> Result.map(((s, p)) => ([s], p, tmp))
    | TExtern => parseExtern(toks, pos) |> Result.map(((s, p)) => ([s], p, tmp))
    | _ => parseLet(toks, pos, tmp) |> Result.map(((stmts, p, tmp2)) =>
        (stmts |> map(setLetMeta(false, doc)), p, tmp2))
  }

let stmtsLoop = (toks, pos, tmp, acc) => switch (tokAt(toks, pos)).tok {
  | TEof => Ok(acc)
  | _ => parseStmt(toks, pos, tmp) |> Result.flatMap(((stmts, p, tmp2)) =>
      stmtsLoop(toks, p, tmp2, Array.concat(acc, stmts)))
}

export let parse = toks => stmtsLoop(toks, 0, 0, [])
