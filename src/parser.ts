// Parser — Pratt-style. Returns Result at the boundary.
// Internally throws a typed marker; the public `parse` catches it into an Err.
// Every node is built with its source span: leaves take the token's span,
// composites span from their first token/child to the last one consumed.
import { err, ok, type Result } from "@onrails/result";
import type {
  Ctor,
  Expr,
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

  // One lambda parameter: a name, or a `{ a, b }` record-destructuring pattern.
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

  function parseExpr(minBp = 0): Expr {
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
    const tk = next();
    if (tk.t === "num") return { kind: "num", value: tk.v, span: tk.span };
    if (tk.t === "bool") return { kind: "bool", value: tk.v, span: tk.span };
    if (tk.t === "str") return { kind: "str", value: tk.v, span: tk.span };
    if (tk.t === "id") return { kind: "ref", name: tk.v, span: tk.span };
    if (tk.t === "lparen") {
      const e = parseExpr();
      expect("rparen");
      return e;
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
      return { kind: "plit", value: tk.v, span: tk.span };
    }
    if (tk.t === "bool") {
      next();
      return { kind: "pbool", value: tk.v, span: tk.span };
    }
    if (tk.t === "str") {
      next();
      return { kind: "pstr", value: tk.v, span: tk.span };
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

  function parseType(): Stmt {
    const start = expect("type").span;
    const name = expectId().name;
    // Optional type parameters, ML-style: `type Result a e = ...`. Any ids
    // before the `=` are parameters the constructors can reference.
    const params: string[] = [];
    while (peek().t === "id") params.push(expectId().name);
    expect("eq");
    const ctors: Ctor[] = [];
    if (peek().t === "bar") next(); // optional leading bar
    ctors.push(parseCtor());
    while (peek().t === "bar") {
      next();
      ctors.push(parseCtor());
    }
    return { kind: "type", name, params, ctors, span: to(start) };
  }

  function parseCtor(): Ctor {
    const name = expectId().name;
    const argTypes: string[] = [];
    if (peek().t === "lparen") {
      next();
      if (peek().t !== "rparen") {
        argTypes.push(expectId().name);
        while (peek().t === "comma") {
          next();
          argTypes.push(expectId().name);
        }
      }
      expect("rparen");
    }
    return { name, argTypes };
  }

  function parseLet(): Stmt[] {
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
  function parseRecordDestructure(start: Span): Stmt[] {
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
    const stmts: Stmt[] = [{ kind: "let", name: tmp, nameSpan: patSpan, value, span: whole }];
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
      next();
      const inner = parseTypeExpr();
      expect("rparen");
      return inner;
    }
    const { name, span } = expectId();
    return { kind: "tname", name, span };
  }

  function parseTypeExpr(): TypeExpr {
    const from = parseTypeAtom();
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
  function parseExtern(): Stmt {
    const start = expect("extern").span;
    const { name, span: nameSpan } = expectId();
    expect("colon");
    const typeExpr = parseTypeExpr();
    expect("eq");
    const module = expectStr().value;
    const imported = expectStr().value;
    return { kind: "extern", name, nameSpan, typeExpr, module, imported, span: to(start) };
  }

  function parseStmt(): Stmt[] {
    const t = peek().t;
    if (t === "type") return [parseType()];
    if (t === "extern") return [parseExtern()];
    return parseLet();
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
