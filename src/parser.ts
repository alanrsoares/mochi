// Parser — Pratt-style. Returns Result at the boundary.
// Internally throws a typed marker; the public `parse` catches it into an Err.
import { err, ok, type Result } from "@onrails/result";
import type { Ctor, Expr, MatchArm, Pattern, Program, Stmt } from "./ast";
import { type AlangError, parseErr } from "./errors";
import type { Tok } from "./lexer";

class ParseAbort extends Error {
  constructor(readonly detail: AlangError) {
    super(detail.message);
  }
}

export function parse(toks: Tok[]): Result<Program, AlangError> {
  let pos = 0;
  const peek = () => toks[pos]!;
  const next = () => toks[pos++]!;
  const fail = (msg: string): never => {
    throw new ParseAbort(parseErr(msg));
  };
  const expect = (t: Tok["t"]) => {
    const tk = next();
    if (tk.t !== t) fail(`expected ${t}, got ${tk.t}`);
    return tk;
  };
  const expectId = (): string => (expect("id") as { t: "id"; v: string }).v;

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

  function parseLambda(): Expr {
    const params: string[] = [];
    if (peek().t === "id") {
      params.push(expectId());
    } else {
      expect("lparen");
      if (peek().t !== "rparen") {
        params.push(expectId());
        while (peek().t === "comma") {
          next();
          params.push(expectId());
        }
      }
      expect("rparen");
    }
    expect("arrow");
    return { kind: "lambda", params, body: parseExpr() };
  }

  function parseExpr(minBp = 0): Expr {
    if (looksLikeLambda()) return parseLambda();
    let left = parseAtomOrCall();
    while (peek().t === "pipe" && PIPE_BP >= minBp) {
      next(); // consume |>
      left = { kind: "pipe", left, right: parseAtomOrCall() };
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
        e = { kind: "call", fn: e, args };
      } else if (peek().t === "dot") {
        next();
        e = { kind: "field", target: e, name: expectId() };
      } else {
        return e;
      }
    }
  }

  function parseAtom(): Expr {
    if (peek().t === "switch") return parseMatch();
    if (peek().t === "lbrace") return parseRecord();
    const tk = next();
    if (tk.t === "num") return { kind: "num", value: tk.v };
    if (tk.t === "id") return { kind: "ref", name: tk.v };
    if (tk.t === "lparen") {
      const e = parseExpr();
      expect("rparen");
      return e;
    }
    return fail(`unexpected token ${tk.t}`);
  }

  function parseRecord(): Expr {
    expect("lbrace");
    const fields: { name: string; value: Expr }[] = [];
    if (peek().t !== "rbrace") {
      fields.push(parseField());
      while (peek().t === "comma") {
        next();
        fields.push(parseField());
      }
    }
    expect("rbrace");
    return { kind: "record", fields };
  }

  function parseField(): { name: string; value: Expr } {
    const name = expectId();
    expect("colon");
    return { name, value: parseExpr() };
  }

  // ---- pattern matching --------------------------------------------------

  function parseMatch(): Expr {
    expect("switch");
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
    return { kind: "match", scrutinee, arms };
  }

  function parsePattern(): Pattern {
    const tk = peek();
    if (tk.t === "num") {
      next();
      return { kind: "plit", value: tk.v };
    }
    if (tk.t === "id") {
      const name = expectId();
      if (name === "_") return { kind: "pwild" };
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
        return { kind: "pctor", ctor: name, args };
      }
      return { kind: "pbind", name };
    }
    return fail(`unexpected token in pattern: ${tk.t}`);
  }

  // ---- statements --------------------------------------------------------

  function parseType(): Stmt {
    expect("type");
    const name = expectId();
    expect("eq");
    const ctors: Ctor[] = [];
    if (peek().t === "bar") next(); // optional leading bar
    ctors.push(parseCtor());
    while (peek().t === "bar") {
      next();
      ctors.push(parseCtor());
    }
    return { kind: "type", name, ctors };
  }

  function parseCtor(): Ctor {
    const name = expectId();
    const argTypes: string[] = [];
    if (peek().t === "lparen") {
      next();
      if (peek().t !== "rparen") {
        argTypes.push(expectId());
        while (peek().t === "comma") {
          next();
          argTypes.push(expectId());
        }
      }
      expect("rparen");
    }
    return { name, argTypes };
  }

  function parseLet(): Stmt {
    expect("let");
    const name = expectId();
    expect("eq");
    return { kind: "let", name, value: parseExpr() };
  }

  function parseStmt(): Stmt {
    return peek().t === "type" ? parseType() : parseLet();
  }

  try {
    const stmts: Stmt[] = [];
    while (peek().t !== "eof") stmts.push(parseStmt());
    return ok({ stmts });
  } catch (e) {
    if (e instanceof ParseAbort) return err(e.detail);
    throw e; // real bug, not a parse error — let it surface
  }
}
