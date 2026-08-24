/**
 * Parser — Pratt-style. Returns Result at the boundary.
 * Internally throws a typed marker; the statement loop catches it per statement,
 * records the diagnostic, and resynchronises (panic mode, ADR 0045) — the marker
 * never leaves this module.
 * Every node carries its source span: leaves from tokens, composites from first to last consumed.
 *
 * Core owns the language's own grammar only. Prefix forms a plugin owns (ADR
 * 0011) are consulted at atom position through `ParseHook`/`ParserApi`, which
 * is why nothing here knows about `<…>` sugar.
 */
import { err, ok, type Result } from "@onrails/result";
import type {
  AliasField,
  Ctor,
  CtorField,
  Expr,
  Field,
  ImportName,
  LamParam,
  LoopParam,
  MatchArm,
  PatField,
  Pattern,
  Program,
  SeqElem,
  Stmt,
  TypeExpr,
} from "../ast/ast";
import { type Span, spanning } from "../ast/span";
import { type Diagnostic, parseErr } from "../errors/errors";
import {
  type LanguagePlugin,
  type ParseHook,
  type ParserApi,
  parseHookTable,
  pluginClashes,
  resolvePlugins,
  runParseHooks,
} from "../extensions/extensions";
import type { Located, Tok } from "../lexer/lexer";

/**
 * The one throw in the compiler, and it never leaves this module: the top-level
 * statement loop catches it into a diagnostic + recovery. Plugins reach it only
 * through `ParserApi.fail`, so
 * the marker is not exported and no hook can throw past this boundary.
 */
class ParseAbort extends Error {
  constructor(readonly detail: Diagnostic) {
    super(detail.message);
  }
}

/** `plugins`: adapters whose `parse` hooks own extra prefix syntax. `undefined` → the builtin list; `[]` → hard opt-out, and any plugin-owned syntax stops parsing (`resolvePlugins`, ADR 0011). */
export type ParseOptions = { plugins?: LanguagePlugin[] };

/** What `parseRecovering` yields: a `Program` that may contain `SError` nodes, plus every parse diagnostic. */
export type RecoveredParse = { program: Program; diagnostics: Diagnostic[] };

/**
 * Core sync set for panic-mode recovery (ADR 0045): the language's own declaration
 * keywords. `eof` always terminates. Plugins add their own top-level keywords via
 * `LanguagePlugin.syncTokens` — core never names plugin syntax.
 */
const CORE_SYNC_TOKENS: readonly Tok["t"][] = ["let", "type", "extern", "import", "export"];

/** Hard stop on pathological input so one keystroke can't publish a novel of diagnostics (ADR 0045 decision 5). */
const MAX_PARSE_ERRORS = 100;

const OPENERS: readonly Tok["t"][] = ["lparen", "lbrace", "lbracket"];
const CLOSERS: readonly Tok["t"][] = ["rparen", "rbrace", "rbracket"];

/**
 * The recovering parse (ADR 0045). Always yields a `Program` — unparsable regions
 * become `SError` statements whose span covers the skipped bytes — alongside every
 * parse diagnostic in source order. `parse` is the hard-fail wrapper over this;
 * tooling that wants the partial tree (formatter, LSP) calls this directly and says so.
 */
export function parseRecovering(toks: Located[], opts: ParseOptions = {}): RecoveredParse {
  const plugins = resolvePlugins(opts.plugins);
  /**
   * Choke point (ADR 0050): every pipeline that turns source into a `Program`
   * funnels through `parseRecovering` (`parse` is a thin hard-fail wrapper
   * over it, `dx`'s format/hover/complete call it directly) and resolves its
   * plugin list here first. `pluginClashes` runs once per parse — O(plugins),
   * not O(tokens) — and its diagnostics seed the same `diagnostics` array
   * every other parse error lands in, so a clash is an ordinary `Diagnostic`
   * (errors-as-values, no throw) rather than a silent last-registrant-wins.
   */
  const clashes = pluginClashes(plugins);
  const parseHooks: Map<Tok["t"], ParseHook> = parseHookTable(plugins);
  const syncTokens = new Set<Tok["t"]>([
    ...CORE_SYNC_TOKENS,
    ...plugins.flatMap((p) => [...(p.syncTokens ?? [])]),
  ]);
  let pos = 0;
  let tmpCount = 0; // supplies fresh names for destructuring temporaries
  let last: Located = toks[0]!; // most recently consumed token (for end spans)
  const peek = () => toks[pos]!;
  /** True at the `eof` token *or* past it — a failed statement may have consumed `eof` itself. */
  const atEnd = () => pos >= toks.length || toks[pos]!.t === "eof";
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
  /**
   * Label in record fields / plugin attribute lists: `tone` or `$tone`
   * (styled-cva transient props, ADR 0009). Since ADR 0047 `$` is an ordinary
   * identifier character, so a label is just an id — kept as a named seam because
   * plugins consume it through `parserApi`.
   */
  const expectLabel = expectId;
  // span from a start marker to the last consumed token.
  const to = (start: Span): Span => spanning(start, last.span);

  /**
   * The cursor and sub-parsers a plugin's `parse` hook may use. Built once —
   * hooks share this parser's `pos`/`last`, so a hook that consumes tokens
   * advances the same cursor core resumes from. `fail` raises the private
   * `ParseAbort`, keeping the marker (and the only throw) inside this module.
   */
  const parserApi: ParserApi = {
    peek: (offset = 0) => toks[Math.min(pos + offset, toks.length - 1)]!,
    next,
    expect: <T extends Tok["t"]>(t: T) => expect(t) as Extract<Located, { t: T }>,
    expectId,
    expectLabel,
    parseExpr: () => parseExpr(),
    spanFrom: to,
    fail: (message: string, span?: Span): never => {
      throw new ParseAbort(parseErr(message, span ?? peek().span));
    },
  };

  const PIPE_BP = 5;
  const COMPOSE_BP = 6;
  // && and || share the same binding power.
  const AND_BP = 7;
  const CMP_BP = 8;
  const CONCAT_BP = 10;
  const ADD_BP = 10;
  const BACKTICK_BP = 15;
  const MUL_BP = 20;

  /**
   * Haskell-style operator sections — `(x +)` / `(+ x)` desugar to a one-param
   * lambda calling the same prelude builtin every infix already lowers to.
   */
  const OP_FN: Partial<Record<Tok["t"], string>> = {
    plus: "add",
    minus: "sub",
    star: "mul",
    slash: "div",
    percent: "mod",
    andand: "and",
    oror: "or",
    concat: "concat",
    eqeq: "eq",
    lt: "lt",
    lte: "lte",
    gt: "gt",
    gte: "gte",
  };

  const isSectionOp = (t: Tok["t"]): boolean => t === "neq" || OP_FN[t] !== undefined;

  /** Build the body of an operator section; the missing operand is already a param ref. */
  function sectionBody(opType: Tok["t"], x: Expr, y: Expr, opSpan: Span): Expr {
    const full = spanning(x.span, y.span);
    return opType === "neq"
      ? {
          kind: "call",
          fn: { kind: "ref", name: "not", span: opSpan },
          args: [
            {
              kind: "call",
              fn: { kind: "ref", name: "eq", span: opSpan },
              args: [x, y],
              span: full,
            },
          ],
          span: full,
        }
      : {
          kind: "call",
          fn: { kind: "ref", name: OP_FN[opType]!, span: opSpan },
          args: [x, y],
          span: full,
        };
  }

  /** `(provided op)` — the missing right operand becomes the lambda's param. */
  function sectionLeft(provided: Expr, opTok: Located): Expr {
    const paramRef: Expr = { kind: "ref", name: "$s", span: opTok.span };
    return {
      kind: "lambda",
      params: [{ kind: "name", name: "$s", span: opTok.span }],
      body: sectionBody(opTok.t, provided, paramRef, opTok.span),
      span: spanning(provided.span, opTok.span),
    };
  }

  /** `(op provided)` — parsed from just after `(`; consumes through `)`. */
  function tryParseRightSection(lparenSpan: Span): Expr | null {
    const opTok = peek();
    if (opTok.t === "minus" || !isSectionOp(opTok.t)) return null; // `(- x)` stays negation
    next();
    const y = parseExpr();
    const end = expect("rparen").span;
    const paramRef: Expr = { kind: "ref", name: "$s", span: opTok.span };
    return {
      kind: "lambda",
      params: [{ kind: "name", name: "$s", span: opTok.span }],
      body: sectionBody(opTok.t, paramRef, y, opTok.span),
      span: spanning(lparenSpan, end),
    };
  }

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

  /** One lambda parameter: name, `{ a, b }` record destructure, or `(a, b)` tuple destructure. */
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
      const first = expectId();
      const names = [first.name];
      const spans = [first.span];
      while (peek().t === "comma") {
        next();
        const n = expectId();
        names.push(n.name);
        spans.push(n.span);
      }
      expect("rparen");
      // A lone `(x)` is just grouping, not a 1-tuple.
      return names.length === 1
        ? { kind: "name", name: names[0]!, span: spans[0]! }
        : { kind: "ptuple", names };
    }
    const id = expectId();
    return { kind: "name", name: id.name, span: id.span };
  }

  function parseLambda(): Expr {
    const start = peek().span;
    const params: LamParam[] = [];
    if (peek().t === "id") {
      const id = expectId();
      params.push({ kind: "name", name: id.name, span: id.span }); // bare `x => ...`
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

  /**
   * `let x = value in body` — local binding as an expression. `in` is a
   * contextual keyword (unambiguous after a value expression).
   */
  function parseLetIn(): Expr {
    const start = expect("let").span;
    // let? / let! param = value in body — monadic bind (Result / Task). The
    // param is any lambda param form (name, `(a, b)` tuple, `{ a }` record).
    if (peek().t === "question" || peek().t === "bang") {
      const monad = peek().t === "question" ? ("Result" as const) : ("Task" as const);
      next();
      const paramSpan = peek().span;
      const param = parseParam();
      expect("eq");
      const value = parseExpr();
      expectIn();
      const body = parseExpr();
      return {
        kind: "letbind",
        monad,
        param,
        paramSpan,
        value,
        body,
        span: spanning(start, body.span),
      };
    }
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
    const annot = parseOptAnnot();
    expect("eq");
    const value = parseExpr();
    expectIn();
    const body = parseExpr();
    return { kind: "letin", name, nameSpan, annot, value, body, span: spanning(start, body.span) };
  }

  /** Optional `: TypeExpr` binding annotation after a let's name (ADR 0044). */
  function parseOptAnnot(): TypeExpr | undefined {
    if (peek().t !== "colon") return undefined;
    next();
    return parseTypeExpr();
  }

  /** Consume the contextual `in` keyword after a let binding's value. */
  function expectIn(): void {
    const kw = expectId();
    if (kw.name !== "in") fail(`expected 'in' after let binding, got '${kw.name}'`);
  }

  function parseCmpInfix(left: Expr, minBp: number): Expr | null {
    const tk = peek();
    if (
      (tk.t === "eqeq" ||
        tk.t === "neq" ||
        tk.t === "lt" ||
        tk.t === "lte" ||
        tk.t === "gt" ||
        tk.t === "gte") &&
      CMP_BP >= minBp
    ) {
      const opTok = next();
      if (peek().t === "rparen") return sectionLeft(left, opTok);
      const right = parseExpr(CMP_BP + 1);
      if (opTok.t === "neq") {
        return {
          kind: "call",
          fn: { kind: "ref", name: "not", span: opTok.span },
          args: [
            {
              kind: "call",
              fn: { kind: "ref", name: "eq", span: opTok.span },
              args: [left, right],
              span: spanning(left.span, right.span),
            },
          ],
          span: spanning(left.span, right.span),
        };
      }
      const fnName =
        opTok.t === "eqeq"
          ? "eq"
          : opTok.t === "lt"
            ? "lt"
            : opTok.t === "lte"
              ? "lte"
              : opTok.t === "gt"
                ? "gt"
                : "gte";
      return {
        kind: "call",
        fn: { kind: "ref", name: fnName, span: opTok.span },
        args: [left, right],
        span: spanning(left.span, right.span),
      };
    }
    return null;
  }

  /** Infix ops that lower to a prelude call (and support `(x +)` sections). */
  function parseBinOpInfix(
    left: Expr,
    minBp: number,
    isOp: (t: Tok["t"]) => boolean,
    bp: number,
  ): Expr | null {
    const tk = peek();
    if (!isOp(tk.t) || bp < minBp) return null;
    const opTok = next();
    if (peek().t === "rparen") return sectionLeft(left, opTok);
    const right = parseExpr(bp + 1);
    return {
      kind: "call",
      fn: { kind: "ref", name: OP_FN[opTok.t]!, span: opTok.span },
      args: [left, right],
      span: spanning(left.span, right.span),
    };
  }

  function parseInfix(left: Expr, minBp: number): { left: Expr; matched: boolean } {
    const tk = peek();
    if (tk.t === "pipe" && PIPE_BP >= minBp) {
      next();
      const right = parseAtomOrCall();
      return {
        left: { kind: "pipe", left, right, span: spanning(left.span, right.span) },
        matched: true,
      };
    }
    if (tk.t === "compose" && COMPOSE_BP >= minBp) {
      next();
      const right = parseExpr(COMPOSE_BP + 1);
      const paramSpan = tk.span;
      const fn: Expr = {
        kind: "lambda",
        params: [{ kind: "name", name: "$x", span: paramSpan }],
        body: {
          kind: "call",
          fn: right,
          args: [
            {
              kind: "call",
              fn: left,
              args: [{ kind: "ref", name: "$x", span: paramSpan }],
              span: left.span,
            },
          ],
          span: spanning(left.span, right.span),
        },
        span: spanning(left.span, right.span),
      };
      return { left: fn, matched: true };
    }
    const cmpResult = parseCmpInfix(left, minBp);
    if (cmpResult) return { left: cmpResult, matched: true };
    const logic = parseBinOpInfix(left, minBp, (t) => t === "andand" || t === "oror", AND_BP);
    if (logic) return { left: logic, matched: true };
    const concat = parseBinOpInfix(left, minBp, (t) => t === "concat", CONCAT_BP);
    if (concat) return { left: concat, matched: true };
    if (tk.t === "backtick" && BACKTICK_BP >= minBp) {
      next();
      const fnExpr = parseAtomOrCall();
      expect("backtick");
      const right = parseExpr(BACKTICK_BP + 1);
      return {
        left: {
          kind: "call",
          fn: fnExpr,
          args: [left, right],
          span: spanning(left.span, right.span),
        },
        matched: true,
      };
    }
    const add = parseBinOpInfix(left, minBp, (t) => t === "plus" || t === "minus", ADD_BP);
    if (add) return { left: add, matched: true };
    const mul = parseBinOpInfix(
      left,
      minBp,
      (t) => t === "star" || t === "slash" || t === "percent",
      MUL_BP,
    );
    return mul ? { left: mul, matched: true } : { left, matched: false };
  }

  function parseExpr(minBp = 0): Expr {
    if (peek().t === "let") return parseLetIn();
    // Lambda binds looser than every infix operator, so `x => …` is only a
    // fresh lambda when parseExpr starts unconstrained (minBp 0) — not as the
    // tightly-bound right operand of an operator (`parseExpr(OP_BP + 1)`),
    // where a trailing `id =>` almost always belongs to an *enclosing*
    // construct (a switch-arm guard, e.g. `when a == b => …`) instead.
    if (minBp === 0 && looksLikeLambda()) return parseLambda();
    let left = parseAtomOrCall();
    for (;;) {
      const res = parseInfix(left, minBp);
      if (!res.matched) break;
      left = res.left;
    }
    // cond ? then : else — binds looser than operators, right-associative via the
    // recursive parseExpr in the else branch (`a ? x : b ? y : z` chains).
    // Same minBp-0 gate as the lambda check above: a `?` after a tightly-bound
    // operand (e.g. the right side of `==`) belongs to the *enclosing* expr's
    // ternary, not one rooted at this operand (`a == b ? x : y` must parse as
    // `(a == b) ? x : y`, not `a == (b ? x : y)`).
    if (minBp === 0 && peek().t === "question") {
      next(); // consume ?
      const then = parseExpr();
      expect("colon");
      const els = parseExpr();
      return { kind: "ternary", cond: left, then, else: els, span: spanning(left.span, els.span) };
    }
    return left;
  }

  function parseAtomOrCall(): Expr {
    const tk = peek();
    if (tk.t === "minus" || tk.t === "bang") {
      const opTok = next();
      const operand = parseAtomOrCall();
      const fnName = opTok.t === "minus" ? "negate" : "not";
      return {
        kind: "call",
        fn: { kind: "ref", name: fnName, span: opTok.span },
        args: [operand],
        span: spanning(opTok.span, operand.span),
      };
    }
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
        // `expectLabel`, not `expectId`: `$tone` is a legal record *key*
        // (ADR 0009 transient props), so it must be a legal projection too —
        // `props.$tone` reads the field `{ $tone: … }` writes.
        const id = expectLabel();
        e = { kind: "field", target: e, name: id.name, span: spanning(e.span, id.span) };
      } else {
        return e;
      }
    }
  }

  function parseAtom(): Expr {
    if (peek().t === "switch") return parseMatch();
    if (peek().t === "loop") return parseLoop();
    if (peek().t === "recur") return parseRecur();
    if (peek().t === "lbrace") return parseRecord();
    if (peek().t === "lbracket") return parseArr();
    if (peek().t === "at") return parseList();
    if (peek().t === "hash") return parseHash();
    if (peek().t === "tmplstart") return parseInterp();
    // Plugin-owned prefix forms come after every core atom, so a plugin can
    // extend the grammar but never shadow it. Dispatch is a single lookup on
    // the leading token's claimant (claims are clash-checked at resolve time);
    // no claimant — or the claimant declining — falls through to the
    // `unexpected token` error below, which is how `plugins: []` turns a
    // plugin's syntax back into a plain parse Diagnostic (ADR 0011 decision 3).
    const hooked = runParseHooks(parseHooks, peek().t, parserApi);
    if (hooked !== null) return hooked;
    const tk = next();
    switch (tk.t) {
      case "num":
        return { kind: "num", value: tk.v, raw: tk.raw, span: tk.span };
      case "bool":
        return { kind: "bool", value: tk.v, span: tk.span };
      case "str":
        return { kind: "str", value: tk.v, span: tk.span };
      case "id":
        return { kind: "ref", name: tk.v, span: tk.span };
      case "lparen": {
        // `()` — the unit value (ADR 0054), mirroring `()` in type position.
        // Checked before everything else: a right section needs an operator
        // here, `() => e` was already routed to `parseLambda` by
        // `looksLikeLambda`, and `f()` is a postfix suffix, not an atom.
        if (peek().t === "rparen") {
          const end = next().span;
          return { kind: "unit", span: spanning(tk.span, end) };
        }
        const rightSection = tryParseRightSection(tk.span);
        if (rightSection) return rightSection;
        const first = parseExpr();
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
    }
    throw new ParseAbort(parseErr(`unexpected token ${tk.t}`, tk.span));
  }

  /** Template literal `"…${a}…${b}…"` (ADR 0023). */
  function parseInterp(): Expr {
    const start = expect("tmplstart");
    const parts: (string | Expr)[] = [(start as Located & { t: "tmplstart" }).v];
    for (;;) {
      parts.push(parseExpr());
      const tk = next();
      if (tk.t === "tmplmid") {
        parts.push(tk.v);
        continue;
      }
      if (tk.t === "tmplend") {
        parts.push(tk.v);
        return { kind: "interp", parts, span: to(start.span) };
      }
      throw new ParseAbort(parseErr(`expected \${...} to close, got ${tk.t}`, tk.span));
    }
  }

  function parseRecord(): Expr {
    const start = expect("lbrace").span;
    // A leading `...base` makes this a record update (`{ ...r, x: 1 }`). Only
    // one spread, only at the front; any fields after it need a comma.
    let spread: Expr | undefined;
    if (peek().t === "spread") {
      next();
      spread = parseExpr();
    }
    const fields: Field[] = [];
    if (peek().t !== "rbrace") {
      if (spread) expect("comma");
      fields.push(parseField());
      while (peek().t === "comma") {
        next();
        fields.push(parseField());
      }
    }
    expect("rbrace");
    return spread
      ? { kind: "record", fields, spread, span: to(start) }
      : { kind: "record", fields, span: to(start) };
  }

  function parseField(): Field {
    const id = expectLabel();
    expect("colon");
    return { name: id.name, nameSpan: id.span, value: parseExpr() };
  }

  /** Array literal: `[]`, `[e]`, `[a, ...xs, b]`. */
  function parseArr(): Expr {
    const start = expect("lbracket").span;
    const elements = parseSeqElems("rbracket");
    expect("rbracket");
    return { kind: "arr", elements, span: to(start) };
  }

  /** Lazy-List literal: `@{}`, `@{e}`, `@{a, ...xs}`. */
  function parseList(): Expr {
    const start = expect("at").span;
    expect("lbrace");
    const elements = parseSeqElems("rbrace");
    expect("rbrace");
    return { kind: "list", elements, span: to(start) };
  }

  /**
   * `#{}` → empty Map; `#{ k: v }` → Map; `#{a, b}` / `#{...s}` → Set
   * (no colons — Python-style dict vs set disambiguation).
   */
  function parseHash(): Expr {
    const start = expect("hash").span;
    expect("lbrace");
    if (peek().t === "rbrace") {
      next();
      return { kind: "map", entries: [], span: to(start) };
    }
    if (peek().t === "spread") {
      const elements = parseSeqElems("rbrace");
      expect("rbrace");
      return { kind: "set", elements, span: to(start) };
    }
    const first = parseExpr();
    if (peek().t === "colon") {
      next();
      const entries = [{ key: first, value: parseExpr() }];
      while (peek().t === "comma") {
        next();
        entries.push(parseMapEntry());
      }
      expect("rbrace");
      return { kind: "map", entries, span: to(start) };
    }
    const elements: SeqElem[] = [{ kind: "expr", expr: first }];
    while (peek().t === "comma") {
      next();
      elements.push(parseSeqElem());
    }
    expect("rbrace");
    return { kind: "set", elements, span: to(start) };
  }

  function parseSeqElems(close: "rbracket" | "rbrace"): SeqElem[] {
    const elements: SeqElem[] = [];
    if (peek().t === close) return elements;
    elements.push(parseSeqElem());
    while (peek().t === "comma") {
      next();
      elements.push(parseSeqElem());
    }
    return elements;
  }

  function parseSeqElem(): SeqElem {
    if (peek().t === "spread") {
      next();
      return { kind: "spread", expr: parseExpr() };
    }
    return { kind: "expr", expr: parseExpr() };
  }

  function parseMapEntry(): { key: Expr; value: Expr } {
    const key = parseExpr();
    expect("colon");
    return { key, value: parseExpr() };
  }

  /** `loop (acc = 0, i = 0) { body }` — tail-recursion loop (ADR 0056). */
  function parseLoop(): Expr {
    const start = expect("loop").span;
    expect("lparen");
    const params: LoopParam[] = [];
    for (;;) {
      const id = expectId();
      expect("eq");
      const init = parseExpr();
      params.push({ name: id.name, nameSpan: id.span, init });
      if (peek().t !== "comma") break;
      next();
    }
    expect("rparen");
    expect("lbrace");
    const body = parseExpr();
    const end = expect("rbrace").span;
    return { kind: "loop", params, body, span: spanning(start, end) };
  }

  /**
   * `recur(a, b)` — a first-class node (not a call) so check can enforce tail
   * position and codegen can lower it to a rebind + `continue` (ADR 0056).
   */
  function parseRecur(): Expr {
    const start = expect("recur").span;
    expect("lparen");
    const args: Expr[] = [];
    if (peek().t !== "rparen") {
      args.push(parseExpr());
      while (peek().t === "comma") {
        next();
        args.push(parseExpr());
      }
    }
    const end = expect("rparen").span;
    return { kind: "recur", args, span: spanning(start, end) };
  }

  function parseMatch(): Expr {
    const start = expect("switch").span;
    const scrutinee = parseExpr();
    expect("lbrace");
    const arms: MatchArm[] = [];
    while (peek().t === "bar") {
      next(); // consume |
      // An arm may list alternatives: `| A | B => …` (ADR 0022). Collect them
      // until `=>`/`when`; ≥2 alts becomes a `por`. The leading `|` of the NEXT
      // arm is safe — each alt stops at `=>`, so no bar remains to over-consume.
      const first = parsePattern();
      const alts = [first];
      while (peek().t === "bar") {
        next();
        alts.push(parsePattern());
      }
      const pattern: Pattern =
        alts.length === 1
          ? first
          : { kind: "por", alts, span: spanning(first.span, alts[alts.length - 1]!.span) };
      // `when <expr>` guard — contextual keyword like `in`: a pattern never
      // continues with a bare identifier, so `when` after a pattern is
      // unambiguous (and `| when => …` still binds the name `when`).
      let guard: Expr | undefined;
      const tk = peek();
      if (tk.t === "id" && tk.v === "when") {
        next();
        guard = parseExpr();
      }
      expect("arrow");
      arms.push(guard ? { pattern, guard, body: parseExpr() } : { pattern, body: parseExpr() });
    }
    if (arms.length === 0) fail("switch needs at least one | arm");
    expect("rbrace");
    return { kind: "match", scrutinee, arms, span: to(start) };
  }

  /** Argument list of a ctor pattern, after the (already consumed) ctor name. */
  function parseCtorPatArgs(): Pattern[] {
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
    return args;
  }

  function parsePattern(): Pattern {
    const tk = peek();
    switch (tk.t) {
      case "num":
        next();
        return { kind: "plit", value: tk.v, raw: tk.raw, span: tk.span };
      case "bool":
        next();
        return { kind: "pbool", value: tk.v, span: tk.span };
      case "str":
        next();
        return { kind: "pstr", value: tk.v, span: tk.span };
      case "lparen": {
        const start = next().span;
        // `()` — the unit pattern, mirroring the `()` expression (ADR 0054).
        if (peek().t === "rparen") return { kind: "punit", span: spanning(start, next().span) };
        const elems = [parsePattern()];
        while (peek().t === "comma") {
          next();
          elems.push(parsePattern());
        }
        const end = expect("rparen").span;
        return elems.length === 1
          ? elems[0]!
          : { kind: "ptuple", elems, span: spanning(start, end) };
      }
      case "lbrace": {
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
      case "lbracket":
        return parseArrPattern();
      case "at":
        return parseListPattern();
      case "id": {
        const { name, span: nameSpan } = expectId();
        if (name === "_") return { kind: "pwild", span: nameSpan };
        // `Alias.Ctor(…)` after `import * as Alias` (ADR 0002), or bare `Ctor`.
        if (peek().t === "dot") {
          next();
          const c = expectId();
          if (!/^[A-Z]/.test(c.name))
            fail(`expected constructor after '${name}.', got '${c.name}'`);
          const args = parseCtorPatArgs();
          return { kind: "pctor", ctor: c.name, args, ns: name, span: to(nameSpan) };
        }
        if (/^[A-Z]/.test(name)) {
          const args = parseCtorPatArgs();
          return { kind: "pctor", ctor: name, args, span: to(nameSpan) };
        }
        return { kind: "pbind", name, span: nameSpan };
      }
    }
    return fail(`unexpected token in pattern: ${tk.t}`);
  }

  /** List pattern: `[]`, `[a, b]`, `[head, ...tail]` (`...` must be last). */
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

  /** Lazy-List pattern: `@{}`, `@{head, ...tail}` (same grammar as list, with `@`). */
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

  /** Record-pattern field: `{ x }` puns to `x`; `{ x: pat }` matches field `x` against `pat`. */
  function parsePatField(): PatField {
    const { name: label, span: labelSpan } = expectId();
    if (peek().t === "colon") {
      next();
      // A field sub-pattern is a full pattern — binds, literals, and nesting
      // (`{ a: { b } }`, `{ v: Sm(n) }`). Nested arms lower to the guard form
      // in codegen (matcher objects stay shallow). See ADR 0012.
      return { label, labelSpan, pat: parsePattern() };
    }
    return { label, labelSpan, pat: { kind: "pbind", name: label, span: labelSpan } };
  }

  function parseType(): Extract<Stmt, { kind: "type" }> {
    const start = expect("type").span;
    const { name, span: nameSpan } = expectId();
    // Optional type parameters: `type Result<A, E> = ...`. Any ids in the
    // bracket list are parameters the constructors can reference.
    const params: string[] = [];
    if (peek().t === "lt") {
      next();
      if (peek().t !== "gt") {
        params.push(expectId().name);
        while (peek().t === "comma") {
          next();
          params.push(expectId().name);
        }
      }
      expect("gt");
    } else {
      // Read legacy ML binders so old modules can be formatted into the
      // canonical angle-bracket spelling without a flag day.
      while (peek().t === "id") params.push(expectId().name);
    }
    expect("eq");
    // A `{` after `=` starts a transparent record alias; anything else is a
    // variant. `{` can't begin a constructor (those are Uppercase ids or `|`),
    // so the two forms never collide.
    if (peek().t === "lbrace") {
      const alias = parseAliasBody();
      return { kind: "type", name, nameSpan, params, ctors: [], alias, span: to(start) };
    }
    const ctors: Ctor[] = [];
    if (peek().t === "bar") next(); // optional leading bar
    ctors.push(parseCtor());
    while (peek().t === "bar") {
      next();
      ctors.push(parseCtor());
    }
    return { kind: "type", name, nameSpan, params, ctors, span: to(start) };
  }

  /** The `{ x: T, y: U }` body of a record alias. */
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
    const id = expectId();
    expect("colon");
    return { name: id.name, nameSpan: id.span, type: parseTypeExpr() };
  }

  function parseCtor(): Ctor {
    const start = peek().span;
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
    return { name, fields, span: to(start) };
  }

  /**
   * Constructor field: `type` (positional) or `label: type` (named runtime key).
   * Full type expression (ADR 0015); one token of lookahead disambiguates.
   */
  function parseCtorField(): CtorField {
    if (peek().t === "id" && toks[pos + 1]?.t === "colon") {
      const name = expectId().name;
      next(); // consume :
      return { name, type: parseTypeExpr() };
    }
    return { name: null, type: parseTypeExpr() };
  }

  function parseLet(): Extract<Stmt, { kind: "let" }>[] {
    const start = expect("let").span;
    if (peek().t === "lbrace") return parseRecordDestructure(start);
    const { name, span: nameSpan } = expectId();
    const annot = parseOptAnnot();
    expect("eq");
    const value = parseExpr();
    return [{ kind: "let", name, nameSpan, annot, value, span: spanning(start, value.span) }];
  }

  /**
   * `let { x, y } = e` desugars to a temp binding plus field-access lets.
   * Shorthand only; `e` is evaluated once via the temp.
   */
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

  /** Type-expression parser for extern signatures. Arrows are right-associative. */
  function parseTypeAtom(): TypeExpr {
    if (peek().t === "lparen") {
      const start = next().span;
      // `()` is the nullary domain (ADR 0014 / 0015) — internal `unit`.
      if (peek().t === "rparen") {
        const end = next().span;
        return { kind: "tname", name: "unit", span: spanning(start, end) };
      }
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
    // `Alias.Name` — an alias-qualified type name (ADR 0046). Only uppercase-initial
    // names can be module aliases (mirrors the `Alias.Ctor(…)` pattern production).
    if (/^[A-Z]/.test(name) && peek().t === "dot") {
      next();
      const q = expectId();
      if (!/^[A-Z]/.test(q.name))
        fail(
          `a type variable cannot be qualified; expected a constructor after '${name}.', got '${q.name}'`,
        );
      return {
        kind: "tqual",
        alias: name,
        name: q.name,
        nameSpan: q.span,
        args: [],
        span: spanning(span, q.span),
      };
    }
    return { kind: "tname", name, span };
  }

  /** Argument list shared by `tapp` and `tqual` application (`Task<A>`, `D.Result<E, A>`). */
  function parseTypeAppArgs(): TypeExpr[] {
    const args: TypeExpr[] = [];
    if (peek().t === "lt") {
      next();
      if (peek().t !== "gt") {
        args.push(parseTypeExpr());
        while (peek().t === "comma") {
          next();
          args.push(parseTypeExpr());
        }
      }
      expect("gt");
      return args;
    }
    // Transitional ML-style applications are accepted on input; the formatter
    // always writes the angle-bracket form.
    while (peek().t === "id" || peek().t === "lparen" || peek().t === "lbracket")
      args.push(parseTypeAtom());
    return args;
  }

  /** Angle-bracket type application, tighter than `->` (`Task<A>`, `Result<A, E>`). */
  function parseTypeApp(): TypeExpr {
    const head = parseTypeAtom();
    const angled = peek().t === "lt";
    if (head.kind === "tqual") {
      const args = parseTypeAppArgs();
      const last = args[args.length - 1];
      const end = angled ? toks[pos - 1]?.span : last?.span;
      return !end ? head : { ...head, args, span: spanning(head.span, end) };
    }
    if (head.kind !== "tname" || !/^[A-Z]/.test(head.name)) return head;
    const args = parseTypeAppArgs();
    const last = args[args.length - 1];
    const end = angled ? toks[pos - 1]?.span : last?.span;
    return !last
      ? head
      : { kind: "tapp", ctor: head.name, args, span: spanning(head.span, end ?? last.span) };
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

  /** Module imports plus contextual JS calling conventions (ADR 0059). */
  function parseExtern(): Extract<Stmt, { kind: "extern" | "type" }> {
    const start = expect("extern").span;
    // An opaque foreign type has no Mochi constructors or runtime representation.
    // Its only purpose is to keep a host object (for example `three.Vector3`)
    // distinct from every other value at typed extern boundaries.
    if (peek().t === "type") {
      next();
      const { name, span: nameSpan } = expectId();
      return { kind: "type", name, nameSpan, params: [], ctors: [], span: to(start) };
    }
    const { name, span: nameSpan } = expectId();
    const params: string[] = [];
    if (peek().t === "lt") {
      next();
      params.push(expectId().name);
      while (peek().t === "comma") {
        next();
        params.push(expectId().name);
      }
      expect("gt");
    }
    expect("colon");
    const typeExpr = parseTypeExpr();
    expect("eq");
    if (peek().t === "id") {
      const convention = expectId().name;
      if (!["global", "send", "get", "set", "new"].includes(convention))
        fail(`expected extern module string or JS convention, got '${convention}'`);
      const first = expectStr().value;
      // `global "Math" "random"` selects a global member, while
      // `new "three" "Vector3"` selects an ESM constructor export.
      const second =
        (convention === "global" || convention === "new") && peek().t === "str"
          ? expectStr().value
          : "";
      return {
        kind: "extern",
        name,
        nameSpan,
        params,
        typeExpr,
        module: `mochi:${convention}:${first}`,
        imported: second,
        span: to(start),
      };
    }
    const module = expectStr().value;
    const imported = expectStr().value;
    return { kind: "extern", name, nameSpan, params, typeExpr, module, imported, span: to(start) };
  }

  /** `import { a, b } from "./mod"` or `import * as Alias from "./mod"` (ADR 0002). */
  function parseImport(): Stmt {
    const start = expect("import").span;
    if (peek().t === "star") {
      next();
      const asKw = expectId();
      if (asKw.name !== "as") fail(`expected 'as' in namespace import, got '${asKw.name}'`);
      const alias = expectId();
      const fromKw = expectId();
      if (fromKw.name !== "from") fail(`expected 'from' in import, got '${fromKw.name}'`);
      const from = expectStr().value;
      return {
        kind: "import",
        names: [],
        alias: { name: alias.name, span: alias.span },
        from,
        span: to(start),
      };
    }
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
    return { kind: "import", names, alias: null, from, span: to(start) };
  }

  function parseStmt(): Stmt[] {
    // A leading `///` comment block rides on the statement's first token; surface
    // it as the `let`/`extern`'s doc. Synthetic destructuring temps ($d…) are skipped
    // downstream, so attaching to all produced lets is harmless.
    const doc = peek().doc;
    const t = peek().t;
    switch (t) {
      case "import":
        return [parseImport()];
      case "export": {
        next();
        const inner = peek().t;
        switch (inner) {
          case "type":
            return [{ ...parseType(), exported: true }];
          case "extern": {
            const external = parseExtern();
            return [
              external.kind === "extern"
                ? { ...external, exported: true, doc }
                : { ...external, exported: true },
            ];
          }
          case "let":
            return parseLet().map((s) => ({ ...s, exported: true, doc }));
        }
        return fail("`export` must precede let, type, or extern");
      }
      case "type":
        return [parseType()];
      case "extern": {
        const external = parseExtern();
        return [external.kind === "extern" ? { ...external, doc } : external];
      }
    }
    return parseLet().map((s) => ({ ...s, doc }));
  }

  /**
   * Panic-mode skip (ADR 0045 decision 1, as amended by slice f). Recovery restarts at
   * the *offending token* — the one the diagnostic points at, located by span rather
   * than by wherever the failed attempt happened to leave the cursor — then stops at the
   * first token in the sync set whose bracket depth relative to there is 0, which is what
   * keeps recovery from resuming inside a half-open record, argument list, or `switch`
   * block, where a `let` is a `let … in`.
   *
   * Restarting by span, not by cursor, is load-bearing twice over. It makes the rule
   * mirrorable in `bootstrap/parser.mochi`, whose Result-based parser has no cursor left
   * after a failure — only the error record, which carries the span — so both parsers
   * resume on the same token. And it is strictly kinder than resuming *after* the
   * offending token: when the token that failed is itself a declaration keyword
   * (`let x let y = 2`), the second declaration survives instead of being eaten.
   *
   * Forward progress: if the offending token is the statement's own first token there is
   * nothing to rewind to, so consume one unconditionally.
   */
  const recoverFrom = (failedAt: Located, before: number, at: Span): Stmt => {
    pos = before;
    while (pos + 1 < toks.length && toks[pos]!.span.start < at.start) pos++;
    last = toks[Math.max(0, pos - 1)]!;
    if (pos === before) next(); // the offending token starts the statement — force progress
    let depth = 0;
    while (!atEnd()) {
      const t = peek().t;
      if (depth === 0 && syncTokens.has(t)) break;
      if (OPENERS.includes(t)) depth++;
      else if (CLOSERS.includes(t)) depth = Math.max(0, depth - 1);
      next();
    }
    return { kind: "error", span: spanning(failedAt.span, last.span) };
  };

  const stmts: Stmt[] = [];
  const diagnostics: Diagnostic[] = [...clashes];
  while (!atEnd()) {
    const before = pos;
    const failedAt = peek();
    try {
      stmts.push(...parseStmt());
    } catch (e) {
      if (!(e instanceof ParseAbort)) throw e; // real bug, not a parse error — let it surface
      diagnostics.push(e.detail);
      if (diagnostics.length >= MAX_PARSE_ERRORS) {
        diagnostics.push(parseErr("too many parse errors; stopping", failedAt.span));
        stmts.push({ kind: "error", span: spanning(failedAt.span, toks[toks.length - 1]!.span) });
        break;
      }
      stmts.push(recoverFrom(failedAt, before, e.detail.span ?? failedAt.span));
    }
    // A statement parse that neither threw nor consumed anything would spin forever;
    // no production does, and if one ever did this turns a hang into a diagnostic.
    if (pos === before) {
      diagnostics.push(parseErr(`unexpected token ${peek().t}`, peek().span));
      stmts.push(recoverFrom(failedAt, before, peek().span));
    }
  }
  return { program: { stmts }, diagnostics };
}

/**
 * Hard-fail railway entry (ADR 0004 as amended by ADR 0045): every parse diagnostic,
 * in source order, and no `Program` when there is any.
 */
export function parse(toks: Located[], opts: ParseOptions = {}): Result<Program, Diagnostic[]> {
  const { program, diagnostics } = parseRecovering(toks, opts);
  return diagnostics.length > 0 ? err(diagnostics) : ok(program);
}
