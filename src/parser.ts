// Parser — Pratt-style. Returns Result at the boundary.
// Internally throws a typed marker; the public `parse` catches it into an Err.
// Every node is built with its source span: leaves take the token's span,
// composites span from their first token/child to the last one consumed.
import { err, ok, type Result } from "@onrails/result";
import type {
  AliasField,
  Ctor,
  CtorField,
  Expr,
  ImportName,
  LamParam,
  MatchArm,
  PatField,
  Pattern,
  Program,
  Stmt,
  TypeExpr,
} from "./ast";
import { type AlangError, parseErr } from "./errors";
import type { Located, Tok } from "./lexer";
import { type Span, spanning } from "./span";

class ParseAbort extends Error {
  constructor(readonly detail: AlangError) {
    super(detail.message);
  }
}

export function parse(toks: Located[]): Result<Program, AlangError> {
  let pos = 0;
  let tmpCount = 0; // supplies fresh names for destructuring temporaries
  let last: Located = toks[0]!; // most recently consumed token (for end spans)
  const peek = () => toks[pos]!;
  const next = () => {
    last = toks[pos++]!;
    return last;
  };
  const fail = (msg: string): never => {
    throw new ParseAbort(parseErr(msg, peek().span));
  };
  const expect = (t: Tok["t"]) => {
    const tk = next();
    if (tk.t !== t) throw new ParseAbort(parseErr(`expected ${t}, got ${tk.t}`, tk.span));
    return tk;
  };
  const expectId = (): { name: string; span: Span } => {
    const tk = expect("id") as Located & { t: "id"; v: string };
    return { name: tk.v, span: tk.span };
  };
  // span from a start marker to the last consumed token.
  const to = (start: Span): Span => spanning(start, last.span);

  const PIPE_BP = 1;

  // ---- expressions -------------------------------------------------------

  function looksLikeLambda(): boolean {
    if (peek().t === "id" && toks[pos + 1]?.t === "arrow") return true;
    if (peek().t !== "lparen") return false;
    let depth = 0;
    for (let k = pos; k < toks.length; k++) {
      const t = toks[k]!.t;
      if (t === "lparen") depth++;
      else if (t === "rparen") {
        depth--;
        if (depth === 0) return toks[k + 1]?.t === "arrow";
      } else if (t === "eof") return false;
    }
    return false;
  }

  // One lambda parameter: a name, a `{ a, b }` record-destructuring pattern, or
  // an `(a, b)` tuple-destructuring pattern.
  function parseParam(): LamParam {
    if (peek().t === "lbrace") {
      next();
      const fields: string[] = [];
      if (peek().t !== "rbrace") {
        fields.push(expectId().name);
        while (peek().t === "comma") {
          next();
          fields.push(expectId().name);
        }
      }
      expect("rbrace");
      return { kind: "precord", fields };
    }
    if (peek().t === "lparen") {
      next();
      const names = [expectId().name];
      while (peek().t === "comma") {
        next();
        names.push(expectId().name);
      }
      expect("rparen");
      // A lone `(x)` is just grouping, not a 1-tuple.
      return names.length === 1 ? { kind: "name", name: names[0]! } : { kind: "ptuple", names };
    }
    return { kind: "name", name: expectId().name };
  }

  function parseLambda(): Expr {
    const start = peek().span;
    const params: LamParam[] = [];
    if (peek().t === "id") {
      params.push({ kind: "name", name: expectId().name }); // bare `x => ...`
    } else {
      expect("lparen");
      if (peek().t !== "rparen") {
        params.push(parseParam());
        while (peek().t === "comma") {
          next();
          params.push(parseParam());
        }
      }
      expect("rparen");
    }
    expect("arrow");
    const body = parseExpr();
    return { kind: "lambda", params, body, span: spanning(start, body.span) };
  }

  // let x = value in body — a local binding as an expression. `in` is a
  // contextual keyword (a plain id), never reserved, since an expression never
  // continues with a bare identifier: the `in` following `value` is unambiguous.
  function parseLetIn(): Expr {
    const start = expect("let").span;
    // `let (a, b) = value in body` — tuple destructure, desugared to an applied
    // lambda `((a, b)) => body` called with `value`. Reuses the tuple lambda
    // param; the bindings are monomorphic (lambda-bound), like any destructure.
    if (peek().t === "lparen") {
      const paramStart = peek().span;
      const param = parseParam();
      expect("eq");
      const value = parseExpr();
      expectIn();
      const body = parseExpr();
      const fn: Expr = {
        kind: "lambda",
        params: [param],
        body,
        span: spanning(paramStart, body.span),
      };
      return { kind: "call", fn, args: [value], span: spanning(start, body.span) };
    }
    const { name, span: nameSpan } = expectId();
    expect("eq");
    const value = parseExpr();
    expectIn();
    const body = parseExpr();
    return { kind: "letin", name, nameSpan, value, body, span: spanning(start, body.span) };
  }

  // Consume the contextual `in` keyword after a let binding's value.
  function expectIn(): void {
    const kw = expectId();
    if (kw.name !== "in") fail(`expected 'in' after let binding, got '${kw.name}'`);
  }

  function parseExpr(minBp = 0): Expr {
    if (peek().t === "let") return parseLetIn();
    if (looksLikeLambda()) return parseLambda();
    let left = parseAtomOrCall();
    while (peek().t === "pipe" && PIPE_BP >= minBp) {
      next(); // consume |>
      const right = parseAtomOrCall();
      left = { kind: "pipe", left, right, span: spanning(left.span, right.span) };
    }
    return left;
  }

  function parseAtomOrCall(): Expr {
    let e = parseAtom();
    // postfix chain: calls f(...) and field access .name
    for (;;) {
      if (peek().t === "lparen") {
        next();
        const args: Expr[] = [];
        if (peek().t !== "rparen") {
          args.push(parseExpr());
          while (peek().t === "comma") {
            next();
            args.push(parseExpr());
          }
        }
        expect("rparen");
        e = { kind: "call", fn: e, args, span: to(e.span) };
      } else if (peek().t === "dot") {
        next();
        const id = expectId();
        e = { kind: "field", target: e, name: id.name, span: spanning(e.span, id.span) };
      } else {
        return e;
      }
    }
  }

  function parseAtom(): Expr {
    if (peek().t === "switch") return parseMatch();
    if (peek().t === "lbrace") return parseRecord();
    if (peek().t === "lbracket") return parseArr();
    if (peek().t === "at") return parseList();
    if (peek().t === "hash") return parseMap();
    const tk = next();
    if (tk.t === "num") return { kind: "num", value: tk.v, raw: tk.raw, span: tk.span };
    if (tk.t === "bool") return { kind: "bool", value: tk.v, span: tk.span };
    if (tk.t === "str") return { kind: "str", value: tk.v, span: tk.span };
    if (tk.t === "id") return { kind: "ref", name: tk.v, span: tk.span };
    if (tk.t === "lparen") {
      const first = parseExpr();
      // `(e, e, …)` is a tuple; a lone `(e)` is just grouping.
      if (peek().t === "comma") {
        const elements = [first];
        while (peek().t === "comma") {
          next();
          elements.push(parseExpr());
        }
        const end = expect("rparen").span;
        return { kind: "tuple", elements, span: spanning(tk.span, end) };
      }
      expect("rparen");
      return first;
    }
    throw new ParseAbort(parseErr(`unexpected token ${tk.t}`, tk.span));
  }

  function parseRecord(): Expr {
    const start = expect("lbrace").span;
    const fields: { name: string; value: Expr }[] = [];
    if (peek().t !== "rbrace") {
      fields.push(parseField());
      while (peek().t === "comma") {
        next();
        fields.push(parseField());
      }
    }
    expect("rbrace");
    return { kind: "record", fields, span: to(start) };
  }

  function parseField(): { name: string; value: Expr } {
    const name = expectId().name;
    expect("colon");
    return { name, value: parseExpr() };
  }

  // A list literal: `[]`, `[e]`, `[e, e, ...]`. Elements are full expressions.
  function parseArr(): Expr {
    const start = expect("lbracket").span;
    const elements: Expr[] = [];
    if (peek().t !== "rbracket") {
      elements.push(parseExpr());
      while (peek().t === "comma") {
        next();
        elements.push(parseExpr());
      }
    }
    expect("rbracket");
    return { kind: "arr", elements, span: to(start) };
  }

  // A lazy-List literal: `@{}`, `@{e}`, `@{e, e, ...}`. Same shape as a list
  // literal but braces + the `@` sigil, so it never collides with a record.
  function parseList(): Expr {
    const start = expect("at").span;
    expect("lbrace");
    const elements: Expr[] = [];
    if (peek().t !== "rbrace") {
      elements.push(parseExpr());
      while (peek().t === "comma") {
        next();
        elements.push(parseExpr());
      }
    }
    expect("rbrace");
    return { kind: "list", elements, span: to(start) };
  }

  // A Map literal: `#{}`, `#{ key: value, ... }`. Keys are full expressions
  // (usually string/number literals), not identifiers like record fields.
  function parseMap(): Expr {
    const start = expect("hash").span;
    expect("lbrace");
    const entries: { key: Expr; value: Expr }[] = [];
    if (peek().t !== "rbrace") {
      entries.push(parseMapEntry());
      while (peek().t === "comma") {
        next();
        entries.push(parseMapEntry());
      }
    }
    expect("rbrace");
    return { kind: "map", entries, span: to(start) };
  }

  function parseMapEntry(): { key: Expr; value: Expr } {
    const key = parseExpr();
    expect("colon");
    return { key, value: parseExpr() };
  }

  // ---- pattern matching --------------------------------------------------

  function parseMatch(): Expr {
    const start = expect("switch").span;
    const scrutinee = parseExpr();
    expect("lbrace");
    const arms: MatchArm[] = [];
    while (peek().t === "bar") {
      next(); // consume |
      const pattern = parsePattern();
      expect("arrow");
      arms.push({ pattern, body: parseExpr() });
    }
    if (arms.length === 0) fail("switch needs at least one | arm");
    expect("rbrace");
    return { kind: "match", scrutinee, arms, span: to(start) };
  }

  function parsePattern(): Pattern {
    const tk = peek();
    if (tk.t === "num") {
      next();
      return { kind: "plit", value: tk.v, raw: tk.raw, span: tk.span };
    }
    if (tk.t === "bool") {
      next();
      return { kind: "pbool", value: tk.v, span: tk.span };
    }
    if (tk.t === "str") {
      next();
      return { kind: "pstr", value: tk.v, span: tk.span };
    }
    if (tk.t === "lparen") {
      const start = next().span;
      const elems = [parsePattern()];
      while (peek().t === "comma") {
        next();
        elems.push(parsePattern());
      }
      const end = expect("rparen").span;
      // `(p, p, …)` destructures a tuple; a lone `(p)` is just grouping.
      return elems.length === 1 ? elems[0]! : { kind: "ptuple", elems, span: spanning(start, end) };
    }
    if (tk.t === "lbrace") {
      const start = next().span;
      const fields: PatField[] = [];
      if (peek().t !== "rbrace") {
        fields.push(parsePatField());
        while (peek().t === "comma") {
          next();
          fields.push(parsePatField());
        }
      }
      expect("rbrace");
      return { kind: "precord", fields, span: to(start) };
    }
    if (tk.t === "lbracket") return parseArrPattern();
    if (tk.t === "at") return parseListPattern();
    if (tk.t === "id") {
      const { name, span: nameSpan } = expectId();
      if (name === "_") return { kind: "pwild", span: nameSpan };
      if (/^[A-Z]/.test(name)) {
        const args: Pattern[] = [];
        if (peek().t === "lparen") {
          next();
          if (peek().t !== "rparen") {
            args.push(parsePattern());
            while (peek().t === "comma") {
              next();
              args.push(parsePattern());
            }
          }
          expect("rparen");
        }
        return { kind: "pctor", ctor: name, args, span: to(nameSpan) };
      }
      return { kind: "pbind", name, span: nameSpan };
    }
    return fail(`unexpected token in pattern: ${tk.t}`);
  }

  // A list pattern: `[]`, `[a, b]`, `[head, ...tail]`. A `...` marks the rest
  // capture, which must be the LAST element and bind a name (or `_`).
  function parseArrPattern(): Pattern {
    const start = expect("lbracket").span;
    const elems: Pattern[] = [];
    let rest: Pattern | null = null;
    if (peek().t !== "rbracket") {
      for (;;) {
        if (peek().t === "spread") {
          next();
          rest = parsePattern();
          break; // rest is terminal
        }
        elems.push(parsePattern());
        if (peek().t !== "comma") break;
        next();
      }
    }
    if (rest && rest.kind !== "pbind" && rest.kind !== "pwild")
      fail("list `...` rest must bind a name or `_`");
    expect("rbracket");
    return { kind: "parr", elems, rest, span: to(start) };
  }

  // A lazy-List pattern: `@{}`, `@{head, ...tail}`. Same grammar as a list
  // pattern with braces + the `@` sigil. `...rest` must bind a name (or `_`);
  // check.ts further restricts to the empty and single-head-cons forms.
  function parseListPattern(): Pattern {
    const start = expect("at").span;
    expect("lbrace");
    const elems: Pattern[] = [];
    let rest: Pattern | null = null;
    if (peek().t !== "rbrace") {
      for (;;) {
        if (peek().t === "spread") {
          next();
          rest = parsePattern();
          break; // rest is terminal
        }
        elems.push(parsePattern());
        if (peek().t !== "comma") break;
        next();
      }
    }
    if (rest && rest.kind !== "pbind" && rest.kind !== "pwild")
      fail("list `...` rest must bind a name or `_`");
    expect("rbrace");
    return { kind: "plist", elems, rest, span: to(start) };
  }

  // A record-pattern field: `{ x }` puns to binding `x`; `{ x: pat }` matches
  // field `x` against `pat`.
  function parsePatField(): PatField {
    const { name: label, span } = expectId();
    if (peek().t === "colon") {
      next();
      const pat = parsePattern();
      // Runtime match is shallow (@onrails object patterns compare by ===), so a
      // field sub-pattern may bind or narrow on a literal, but not nest.
      if (pat.kind === "pctor" || pat.kind === "precord")
        fail("record pattern fields cannot nest; use a name or a literal");
      return { label, pat };
    }
    return { label, pat: { kind: "pbind", name: label, span } };
  }

  // ---- statements --------------------------------------------------------

  function parseType(): Extract<Stmt, { kind: "type" }> {
    const start = expect("type").span;
    const name = expectId().name;
    // Optional type parameters, ML-style: `type Result a e = ...`. Any ids
    // before the `=` are parameters the constructors can reference.
    const params: string[] = [];
    while (peek().t === "id") params.push(expectId().name);
    expect("eq");
    // A `{` after `=` starts a transparent record alias; anything else is a
    // variant. `{` can't begin a constructor (those are Uppercase ids or `|`),
    // so the two forms never collide.
    if (peek().t === "lbrace") {
      const alias = parseAliasBody();
      return { kind: "type", name, params, ctors: [], alias, span: to(start) };
    }
    const ctors: Ctor[] = [];
    if (peek().t === "bar") next(); // optional leading bar
    ctors.push(parseCtor());
    while (peek().t === "bar") {
      next();
      ctors.push(parseCtor());
    }
    return { kind: "type", name, params, ctors, span: to(start) };
  }

  // The `{ x: T, y: U }` body of a record alias. Each field is `name: TypeExpr`;
  // the empty record `{}` is allowed. No trailing comma.
  function parseAliasBody(): AliasField[] {
    expect("lbrace");
    const fields: AliasField[] = [];
    if (peek().t !== "rbrace") {
      fields.push(parseAliasField());
      while (peek().t === "comma") {
        next();
        fields.push(parseAliasField());
      }
    }
    expect("rbrace");
    return fields;
  }

  function parseAliasField(): AliasField {
    const name = expectId().name;
    expect("colon");
    return { name, type: parseTypeExpr() };
  }

  function parseCtor(): Ctor {
    const name = expectId().name;
    const fields: CtorField[] = [];
    if (peek().t === "lparen") {
      next();
      if (peek().t !== "rparen") {
        fields.push(parseCtorField());
        while (peek().t === "comma") {
          next();
          fields.push(parseCtorField());
        }
      }
      expect("rparen");
    }
    return { name, fields };
  }

  // A constructor field: `type` (positional) or `label: type` (named — its
  // runtime key). `Ok(value: a)` names the payload `value`; `Circle(float)`
  // leaves it positional.
  function parseCtorField(): CtorField {
    const first = expectId().name;
    if (peek().t === "colon") {
      next();
      return { name: first, type: expectId().name };
    }
    return { name: null, type: first };
  }

  function parseLet(): Extract<Stmt, { kind: "let" }>[] {
    const start = expect("let").span;
    if (peek().t === "lbrace") return parseRecordDestructure(start);
    const { name, span: nameSpan } = expectId();
    expect("eq");
    const value = parseExpr();
    return [{ kind: "let", name, nameSpan, value, span: spanning(start, value.span) }];
  }

  // `let { x, y } = e` desugars to a temp binding of `e` plus one field-access
  // `let` per name, so it reuses inference/codegen with no downstream changes.
  // Shorthand only for now (each field binds a variable of the same name); `e`
  // is evaluated once, via the temp. Spans point at each field's identifier so
  // hover/inlay/errors land on the binding the user wrote.
  function parseRecordDestructure(start: Span): Extract<Stmt, { kind: "let" }>[] {
    const open = expect("lbrace").span;
    const fields: { name: string; span: Span }[] = [];
    if (peek().t !== "rbrace") {
      fields.push(expectId());
      while (peek().t === "comma") {
        next();
        fields.push(expectId());
      }
    }
    const close = expect("rbrace").span;
    expect("eq");
    const value = parseExpr();
    const whole = spanning(start, value.span);
    const patSpan = spanning(open, close);
    const tmp = `$d${tmpCount++}`;
    const stmts: Extract<Stmt, { kind: "let" }>[] = [
      { kind: "let", name: tmp, nameSpan: patSpan, value, span: whole },
    ];
    for (const f of fields) {
      const target: Expr = { kind: "ref", name: tmp, span: f.span };
      const access: Expr = { kind: "field", target, name: f.name, span: f.span };
      stmts.push({ kind: "let", name: f.name, nameSpan: f.span, value: access, span: f.span });
    }
    return stmts;
  }

  // Type-expression parser for extern signatures. Arrows are right-associative.
  function parseTypeAtom(): TypeExpr {
    if (peek().t === "lparen") {
      const start = next().span;
      const inner = parseTypeExpr();
      // `(a, b)` is a tuple type; a lone `(t)` is just grouping.
      if (peek().t === "comma") {
        const elems = [inner];
        while (peek().t === "comma") {
          next();
          elems.push(parseTypeExpr());
        }
        const end = expect("rparen").span;
        return { kind: "ttuple", elems, span: spanning(start, end) };
      }
      expect("rparen");
      return inner;
    }
    if (peek().t === "lbracket") {
      const start = next().span; // [
      const elem = parseTypeExpr();
      const end = expect("rbracket").span;
      return { kind: "tlist", elem, span: spanning(start, end) };
    }
    const { name, span } = expectId();
    return { kind: "tname", name, span };
  }

  // Type application by juxtaposition, tighter than `->`: `Task a`, `Result a e`.
  // Only an Uppercase constructor head takes args; a nested applied arg must be
  // parenthesized (`Task (Option a)`). Arg atoms are ids or parenthesized types.
  function parseTypeApp(): TypeExpr {
    const head = parseTypeAtom();
    if (head.kind !== "tname" || !/^[A-Z]/.test(head.name)) return head;
    const args: TypeExpr[] = [];
    while (peek().t === "id" || peek().t === "lparen" || peek().t === "lbracket")
      args.push(parseTypeAtom());
    const last = args[args.length - 1];
    if (!last) return head;
    return { kind: "tapp", ctor: head.name, args, span: spanning(head.span, last.span) };
  }

  function parseTypeExpr(): TypeExpr {
    const from = parseTypeApp();
    if (peek().t !== "tarrow") return from;
    next();
    const to = parseTypeExpr();
    return { kind: "tarrow", from, to, span: spanning(from.span, to.span) };
  }

  const expectStr = (): { value: string; span: Span } => {
    const tk = expect("str") as Located & { t: "str"; v: string };
    return { value: tk.v, span: tk.span };
  };

  // extern name : type = "module" "export"
  function parseExtern(): Extract<Stmt, { kind: "extern" }> {
    const start = expect("extern").span;
    const { name, span: nameSpan } = expectId();
    expect("colon");
    const typeExpr = parseTypeExpr();
    expect("eq");
    const module = expectStr().value;
    const imported = expectStr().value;
    return { kind: "extern", name, nameSpan, typeExpr, module, imported, span: to(start) };
  }

  // import { a, b } from "./mod"  — `from` is contextual (still a valid id).
  function parseImport(): Stmt {
    const start = expect("import").span;
    expect("lbrace");
    const names: ImportName[] = [];
    if (peek().t !== "rbrace") {
      const first = expectId();
      names.push({ name: first.name, span: first.span });
      while (peek().t === "comma") {
        next();
        const n = expectId();
        names.push({ name: n.name, span: n.span });
      }
    }
    expect("rbrace");
    const kw = expectId();
    if (kw.name !== "from") fail(`expected 'from' in import, got '${kw.name}'`);
    const from = expectStr().value;
    return { kind: "import", names, from, span: to(start) };
  }

  function parseStmt(): Stmt[] {
    // A leading `///` comment block rides on the statement's first token; surface
    // it as the `let`'s doc. Synthetic destructuring temps ($d…) are skipped
    // downstream, so attaching to all produced lets is harmless.
    const doc = peek().doc;
    const t = peek().t;
    if (t === "import") return [parseImport()];
    if (t === "export") {
      next();
      const inner = peek().t;
      if (inner === "type") return [{ ...parseType(), exported: true }];
      if (inner === "extern") return [{ ...parseExtern(), exported: true }];
      if (inner === "let") return parseLet().map((s) => ({ ...s, exported: true, doc }));
      return fail("`export` must precede let, type, or extern");
    }
    if (t === "type") return [parseType()];
    if (t === "extern") return [parseExtern()];
    return parseLet().map((s) => ({ ...s, doc }));
  }

  try {
    const stmts: Stmt[] = [];
    while (peek().t !== "eof") stmts.push(...parseStmt());
    return ok({ stmts });
  } catch (e) {
    if (e instanceof ParseAbort) return err(e.detail);
    throw e; // real bug, not a parse error — let it surface
  }
}
