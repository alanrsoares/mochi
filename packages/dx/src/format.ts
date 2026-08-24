/**
 * mochi source formatter: parse to the AST, lower to a Wadler/Prettier-style
 * document IR (`doc.ts`), then lay it out against an 80-column target (ADR
 * 0025). Every breakable construct — pipe, switch, ternary, `let … in`,
 * record/map literals, call-argument lists — is a `group` that prints flat when
 * it fits the line and breaks otherwise. Formatting is idempotent: the layout
 * is a pure function of the AST and the width, and re-parsing broken output
 * yields the same AST (newlines are insignificant to the lexer).
 *
 * Record destructuring is desugared by the parser into a temp binding plus
 * field-access lets, so the printer detects that shape and re-folds it back
 * into `let { x, y } = e`; a destructuring `let (a, b) = e in body` desugars to
 * an applied lambda, which the printer re-folds too.
 *
 * Sugar a *plugin* owns re-folds through its `format` hook (ADR 0011) — JSX's
 * `h(tag, props, children)` → `<tag …>` lives in `plugins/jsx.ts`, not here.
 * Hooks run before this module's own printer and never see types: `format`
 * lexes and parses only.
 */

import type {
  CallExpr,
  Ctor,
  CtorField,
  Expr,
  ExternStmt,
  FieldExpr,
  ImportStmt,
  InterpExpr,
  LambdaExpr,
  LamParam,
  LoopExpr,
  MapExpr,
  MatchExpr,
  PatField,
  Pattern,
  PipeExpr,
  Program,
  RecordExpr,
  SeqElem,
  Stmt,
  TernaryExpr,
  TypeStmt,
} from "@mochi/compiler/ast";
import {
  breakParent,
  cat,
  type Doc,
  flat,
  group,
  hardline,
  indent,
  join,
  line,
  render,
  seq,
  softline,
  txt,
  verbatim,
} from "@mochi/compiler/doc";
import { type Diagnostic, oneDiag } from "@mochi/compiler/errors";
import type { FormatApi, FormatHook, LanguagePlugin } from "@mochi/compiler/extensions";
import { resolvePlugins, runFormatHooks } from "@mochi/compiler/extensions";
import { lex, skipStringLiteral } from "@mochi/compiler/lexer";
import { parseRecovering } from "@mochi/compiler/parser";
import { showTypeExpr } from "@mochi/compiler/show-type-expr";
import { match } from "@onrails/pattern";
import { map, mapErr, pipe, type Result } from "@onrails/result";

const WIDTH = 80;

const param = (p: LamParam): string =>
  p.kind === "name"
    ? p.name
    : p.kind === "ptuple"
      ? `(${p.names.join(", ")})`
      : `{ ${p.fields.join(", ")} }`;

/** A lone plain-name param drops its parens (`x => ...`); anything else keeps them (`(a, b) => ...`, `({ x }) => ...`). */
const params = (ps: LamParam[]): string =>
  ps.length === 1 && ps[0]!.kind === "name" ? ps[0]!.name : `(${ps.map(param).join(", ")})`;

/**
 * `JSON.stringify` handles \n \t \\ \" escaping but leaves a literal `${`
 * alone — which would reopen an interpolation hole on re-lex (ADR 0023).
 * Re-escape it so a hole-free string round-trips even when its decoded
 * value happens to contain that sequence.
 */
const escStrBody = (s: string): string => JSON.stringify(s).slice(1, -1).replace(/\$\{/g, "\\${");
const strLit = (s: string): string => `"${escStrBody(s)}"`;

// "…${x}…" (ADR 0023) — round-trip the sugar; holes render flat.
const interpText = (e: InterpExpr): string =>
  `"${e.parts.map((p) => (typeof p === "string" ? escStrBody(p) : `\${${flat(exprD(p))}}`)).join("")}"`;

const pattern = (p: Pattern): string =>
  match(p)
    .with({ kind: "pwild" }, () => "_")
    .with({ kind: "punit" }, () => "()")
    .with({ kind: "pbind" }, (p) => p.name)
    .with({ kind: "plit" }, (p) => p.raw)
    .with({ kind: "pbool" }, (p) => String(p.value))
    .with({ kind: "pstr" }, (p) => JSON.stringify(p.value))
    .with({ kind: "precord" }, (p) => `{ ${p.fields.map(patField).join(", ")} }`)
    .with({ kind: "ptuple" }, (p) => `(${p.elems.map(pattern).join(", ")})`)
    .with({ kind: "pctor" }, (p) => {
      const head = p.ns ? `${p.ns}.${p.ctor}` : p.ctor;
      return p.args.length === 0 ? head : `${head}(${p.args.map(pattern).join(", ")})`;
    })
    .with({ kind: "parr" }, (p) => {
      const head = p.elems.map(pattern);
      const rest = p.rest ? [`...${pattern(p.rest)}`] : [];
      return `[${[...head, ...rest].join(", ")}]`;
    })
    .with({ kind: "plist" }, (p) => {
      const head = p.elems.map(pattern);
      const rest = p.rest ? [`...${pattern(p.rest)}`] : [];
      return `@{${[...head, ...rest].join(", ")}}`;
    })
    .with({ kind: "por" }, (p) => p.alts.map(pattern).join(" | "))
    .exhaustive();

/** `{ x }` when the field puns to its own name, else `{ label: pat }`. */
const patField = (f: PatField): string =>
  f.pat.kind === "pbind" && f.pat.name === f.label ? f.label : `${f.label}: ${pattern(f.pat)}`;

const ctorField = (f: CtorField): string =>
  f.name ? `${f.name}: ${typeExpr(f.type)}` : typeExpr(f.type);

const ctor = (c: Ctor): string =>
  c.fields.length === 0 ? c.name : `${c.name}(${c.fields.map(ctorField).join(", ")})`;

const typeExpr = showTypeExpr;

const externStmt = (s: ExternStmt): string => {
  const params = s.params.length ? `<${s.params.join(", ")}>` : "";
  const match = /^mochi:(global|send|get|set|new):(.*)$/.exec(s.module);
  if (!match) {
    // `curried` describes the host's shape, not the type (ADR 0064).
    const shape = s.curried ? "curried " : "";
    return `extern ${s.name}${params} : ${typeExpr(s.typeExpr)} = ${shape}${JSON.stringify(s.module)} ${JSON.stringify(s.imported)}`;
  }
  const [, convention, first] = match;
  const second = s.imported === "" ? "" : ` ${JSON.stringify(s.imported)}`;
  return `extern ${s.name}${params} : ${typeExpr(s.typeExpr)} = ${convention} ${JSON.stringify(first)}${second}`;
};

/**
 * Rendered as a Doc (not a flat string) so a comment interleaved between
 * constructors can print as a leading line above the constructor it documents,
 * indented to the arm — `withComments` per ctor supplies that slot.
 */
const typeStmtD = (s: TypeStmt): Doc => {
  const head = s.params.length ? `type ${s.name}<${s.params.join(", ")}>` : `type ${s.name}`;
  if (s.ctors.length === 0 && !s.alias) return txt(`extern ${head}`);
  // Transparent record alias: `type Point = { x: number, y: number }`.
  if (s.alias) {
    const fields = s.alias.map((f) => `${f.name}: ${typeExpr(f.type)}`);
    return txt(fields.length ? `${head} = { ${fields.join(", ")} }` : `${head} = {}`);
  }
  const arms = s.ctors.map((c) => withComments(c, txt(`| ${ctor(c)}`)));
  return seq(txt(`${head} =`), indent(cat(arms.map((a) => seq(hardline, a)))));
};

const importStmtD = (s: ImportStmt): Doc => {
  if (s.alias) return txt(`import * as ${s.alias.name} from ${JSON.stringify(s.from)}`);
  const names = s.names.map((n) => txt(n.name));
  return group(
    seq(txt("import "), braced("{", "}", names), txt(` from ${JSON.stringify(s.from)}`)),
  );
};

/**
 * Comments are not in the AST, so the formatter re-scans the source for them
 * and reattaches them by span. An *own-line* comment (a line that is
 * whitespace-then-comment) attaches to the AST node that most tightly follows
 * it and prints as a leading line above that node. A *trailing* comment (code
 * then `//` on the same line) attaches to the node it most tightly follows on
 * that line and prints inline after it; if it trails a bare marker with no node
 * on the line (e.g. a ternary's `:`), it degrades to a leading comment of the
 * following node — never dropped.
 */
type Comment = {
  start: number;
  end: number;
  text: string;
  blankAfter: boolean;
  trailing: boolean; // code preceded it on its line
};

/**
 * Scan every `//` / `///` comment, string-aware: a `//` inside a string literal
 * (or a `${…}` hole) is not a comment. Reuses the lexer's string skipper so the
 * two agree exactly on where a literal ends.
 */
const collectComments = (src: string): Comment[] => {
  const out: Comment[] = [];
  let i = 0;
  let lineHasToken = false; // a non-space, non-comment char seen this line
  while (i < src.length) {
    const c = src[i]!;
    switch (c) {
      case "\n":
        lineHasToken = false;
        i++;
        continue;
      case " ":
      case "\t":
      case "\r":
        i++;
        continue;
      case '"': {
        const end = skipStringLiteral(src, i);
        if (end === null) break;
        i = end;
        lineHasToken = true;
        continue;
      }
    }
    if (c === "/" && src[i + 1] === "/") {
      let end = i;
      while (end < src.length && src[end] !== "\n") end++;
      const nextNl = src.indexOf("\n", end + 1);
      const nextLine = src.slice(end + 1, nextNl === -1 ? src.length : nextNl);
      out.push({
        start: i,
        end,
        text: src.slice(i, end).trimEnd(),
        blankAfter: nextLine.trim() === "",
        trailing: lineHasToken,
      });
      i = end;
      continue;
    }
    lineHasToken = true;
    i++;
  }
  return out;
};

/** The node a comment attaches to, keyed by node identity — LEADING prints above the node, TRAILING inline after it. A fresh AST is parsed per `format` call, so entries never outlive their source. */
const LEADING = new WeakMap<object, Comment[]>();
const TRAILING = new WeakMap<object, Comment[]>();

type Anchor = { node: Expr | Stmt | Ctor; start: number; end: number };

/**
 * Every span-carrying expression under a statement, plus the statement itself
 * and — for a `type` decl — each constructor, so a comment interleaved between
 * constructors attaches to the one it precedes instead of migrating to the next
 * statement.
 */
const collectAnchors = (stmts: Stmt[]): Anchor[] => {
  const anchors: Anchor[] = [];
  const add = (n: Expr | Stmt | Ctor): void => {
    anchors.push({ node: n, start: n.span.start, end: n.span.end });
  };
  const visit = (e: Expr): void => {
    add(e);
    switch (e.kind) {
      case "call":
        visit(e.fn);
        e.args.forEach(visit);
        break;
      case "lambda":
        visit(e.body);
        break;
      case "loop":
        e.params.forEach((lp) => {
          visit(lp.init);
        });
        visit(e.body);
        break;
      case "recur":
        e.args.forEach(visit);
        break;
      case "pipe":
        visit(e.left);
        visit(e.right);
        break;
      case "ternary":
        visit(e.cond);
        visit(e.then);
        visit(e.else);
        break;
      case "record":
        if (e.spread) visit(e.spread);
        e.fields.forEach((f) => {
          visit(f.value);
        });
        break;
      case "field":
        visit(e.target);
        break;
      case "tuple":
        e.elements.forEach(visit);
        break;
      case "arr":
      case "list":
      case "set":
        e.elements.forEach((el) => {
          visit(el.expr);
        });
        break;
      case "map":
        e.entries.forEach((en) => {
          visit(en.key);
          visit(en.value);
        });
        break;
      case "letin":
      case "letbind":
        visit(e.value);
        visit(e.body);
        break;
      case "match":
        visit(e.scrutinee);
        e.arms.forEach((a) => {
          if (a.guard) visit(a.guard);
          visit(a.body);
        });
        break;
      case "interp":
        e.parts.forEach((p) => {
          if (typeof p !== "string") visit(p);
        });
        break;
    }
  };
  for (const s of stmts) {
    add(s);
    if (s.kind === "let") visit(s.value);
    if (s.kind === "type") s.ctors.forEach(add);
  }
  return anchors;
};

/**
 * Assign each comment to an anchor. A trailing comment binds to the node it
 * most tightly follows *on the same line* (largest end at or before its start,
 * no intervening newline) as a TRAILING comment. An own-line comment — or a
 * trailing one with no node on its line, e.g. after a ternary `:` — binds to
 * the node that follows it most tightly (smallest start at or after the
 * comment; ties toward the outermost node) as a LEADING comment. Comments past
 * the last node have no anchor and are returned to emit after the final stmt.
 */
const attachComments = (stmts: Stmt[], comments: Comment[], src: string): Comment[] => {
  const anchors = collectAnchors(stmts).toSorted((a, b) => a.start - b.start || b.end - a.end);
  const tail: Comment[] = [];
  for (const c of comments) {
    if (c.trailing) {
      let trailed: Anchor | null = null;
      for (const a of anchors) {
        if (a.end <= c.start && !src.slice(a.end, c.start).includes("\n")) {
          if (trailed === null || a.end > trailed.end) trailed = a;
        }
      }
      if (trailed !== null) {
        TRAILING.set(trailed.node, [...(TRAILING.get(trailed.node) ?? []), c]);
        continue;
      }
    }
    const target = anchors.find((a) => a.start >= c.end);
    if (!target) {
      tail.push(c);
      continue;
    }
    LEADING.set(target.node, [...(LEADING.get(target.node) ?? []), c]);
  }
  return tail;
};

/** Leading comment lines for a node: each on its own line, a blank line kept after any comment the source separated from what follows. */
const leadingDocs = (node: Expr | Stmt | Ctor): Doc[] => {
  const cs = LEADING.get(node);
  return cs
    ? cs.flatMap((c) =>
        c.blankAfter ? [txt(c.text), hardline, hardline] : [txt(c.text), hardline],
      )
    : [];
};

/**
 * A trailing comment prints ` // text` after the node, then `breakParent` so
 * whatever follows lands on a new line (otherwise it would be commented out)
 * without emitting a newline here — the enclosing group / statement separator
 * supplies it. Only own-line breaks emit an actual newline.
 */
const trailingDocs = (node: Expr | Stmt | Ctor): Doc[] => {
  const cs = TRAILING.get(node);
  return cs ? cs.flatMap((c) => [txt(` ${c.text}`), breakParent]) : [];
};

const withComments = (node: Expr | Stmt | Ctor, doc: Doc): Doc => {
  const lead = leadingDocs(node);
  const trail = trailingDocs(node);
  return lead.length || trail.length ? cat([...lead, doc, ...trail]) : doc;
};

const hasLead = (node: Expr): boolean => (LEADING.get(node)?.length ?? 0) > 0;

const parenIf = (cond: boolean, d: Doc): Doc => (cond ? seq(txt("("), d, txt(")")) : d);

/**
 * A callee/member/pipe-operand needs parens when dropping them would reparse to
 * a different tree: a lambda or ternary binds looser than application, a record
 * in member position is ambiguous, and a nested pipe would re-associate.
 */
const calleeD = (e: Expr): Doc =>
  parenIf(e.kind === "lambda" || e.kind === "ternary" || e.kind === "pipe", exprD(e));
const memberD = (e: Expr): Doc =>
  parenIf(
    e.kind === "lambda" || e.kind === "record" || e.kind === "ternary" || e.kind === "pipe",
    exprD(e),
  );
const operandD = (e: Expr): Doc =>
  parenIf(e.kind === "lambda" || e.kind === "ternary" || e.kind === "pipe", exprD(e));

/** `(a, b)` / `[a, b]` / `@{a, b}` / `#{a, b}` — no inner padding; breaks one element per line when it overflows. */
const seqElemD = (el: SeqElem): Doc =>
  el.kind === "spread" ? seq(txt("..."), exprD(el.expr)) : exprD(el.expr);

const bracketed = (open: string, close: string, items: Doc[]): Doc =>
  items.length === 0
    ? txt(`${open}${close}`)
    : group(
        seq(
          txt(open),
          indent(seq(softline, join(seq(txt(","), line), items))),
          softline,
          txt(close),
        ),
      );

/** `{ a: 1, b: 2 }` / `#{ k: v }` — padded braces; breaks one entry per line. */
const braced = (open: string, close: string, items: Doc[]): Doc =>
  items.length === 0
    ? txt(`${open}${close}`)
    : group(seq(txt(open), indent(seq(line, join(seq(txt(","), line), items))), line, txt(close)));

/** `|>` is left-associative, so `a |> b |> c` is pipe(pipe(a, b), c); flatten it back to the source order [a, b, c]. */
const pipeSegments = (e: Expr): Expr[] =>
  e.kind === "pipe" ? [...pipeSegments(e.left), e.right] : [e];

/** Inline when it fits, else one `|> stage` per line indented under the head. */
const pipeD = (e: PipeExpr): Doc => {
  const [head, ...rest] = pipeSegments(e);
  return group(
    seq(operandD(head!), indent(cat(rest.map((s) => seq(line, txt("|> "), operandD(s)))))),
  );
};

/** `>>` is left-associative, so `a >> b >> c` is lambda(lambda(a, b), c); flatten it. */
const isComposeLambda = (e: Expr): boolean =>
  e.kind === "lambda" &&
  e.params.length === 1 &&
  e.params[0]!.kind === "name" &&
  e.params[0]!.name === "$x" &&
  e.body.kind === "call" &&
  e.body.args.length === 1 &&
  e.body.args[0]!.kind === "call" &&
  e.body.args[0]!.args.length === 1 &&
  e.body.args[0]!.args[0]!.kind === "ref" &&
  e.body.args[0]!.args[0]!.name === "$x";

const composeSegments = (e: Expr): Expr[] => {
  if (isComposeLambda(e)) {
    const lam = e as LambdaExpr;
    const bodyCall = lam.body as CallExpr;
    const innerCall = bodyCall.args[0]! as CallExpr;
    const left = innerCall.fn;
    const right = bodyCall.fn;
    return [...composeSegments(left), right];
  }
  return [e];
};

const lambdaD = (e: LambdaExpr): Doc => {
  const section = sectionOf(e);
  if (section) return section;

  // Refold composition: `($x) => g(f($x))` -> `f >> g` (and flatten `f >> g >> h`).
  // Inline when it fits, else one `>> stage` per line indented under the head.
  if (isComposeLambda(e)) {
    const [head, ...rest] = composeSegments(e);
    return group(
      seq(operandD(head!), indent(cat(rest.map((s) => seq(line, txt(">> "), operandD(s)))))),
    );
  }

  const head = txt(`${params(e.params)} =>`);
  // A switch body attaches to the arrow (`xs => switch xs {`) — unless it
  // carries a leading comment, which forces it onto its own indented line.
  return e.body.kind === "match" && !hasLead(e.body)
    ? seq(head, txt(" "), exprD(e.body))
    : group(seq(head, indent(seq(line, exprD(e.body)))));
};

/** A ternary branch after its `?` / `:` marker; a commented branch drops to its own indented line so the comment stays own-line (and the layout idempotent). */
const branchD = (marker: string, e: Expr): Doc =>
  hasLead(e) ? seq(txt(marker), indent(seq(hardline, exprD(e)))) : seq(txt(`${marker} `), exprD(e));

const condD = (c: Expr): Doc => parenIf(c.kind === "ternary", exprD(c));

/** Right-nested `a ? b : c ? d : e` flattens to one arm list so cascading conditionals share a single indent instead of staircasing. */
type TernaryArm = { cond: Expr; thenE: Expr };
const ternaryArms = (e: TernaryExpr): { arms: TernaryArm[]; elseE: Expr } => {
  const arms: TernaryArm[] = [{ cond: e.cond, thenE: e.then }];
  let rest: Expr = e.else;
  while (rest.kind === "ternary") {
    arms.push({ cond: rest.cond, thenE: rest.then });
    rest = rest.else;
  }
  return { arms, elseE: rest };
};

/** Inline when it fits; else `cond` / `? then` / `: cond` / `? then` / `: else` at one indent — a flat chain, not a nested pyramid. */
const ternaryD = (e: TernaryExpr): Doc => {
  const { arms, elseE } = ternaryArms(e);
  const parts: Doc[] = [line, branchD("?", arms[0]!.thenE)];
  for (let i = 1; i < arms.length; i++) {
    const a = arms[i]!;
    parts.push(
      line,
      hasLead(a.cond)
        ? seq(txt(":"), indent(seq(hardline, condD(a.cond))))
        : seq(txt(": "), condD(a.cond)),
      line,
      branchD("?", a.thenE),
    );
  }
  parts.push(line, branchD(":", elseE));
  return group(seq(condD(arms[0]!.cond), indent(cat(parts))));
};

/**
 * Does this expression *print* as `let … in …`? `letin`/`letbind` say so in
 * their `kind`, but a destructuring `let (a, b) = v in body` reaches the
 * formatter as the IIFE the parser desugared it to — it only becomes let-shaped
 * again in `refoldCall`. The chain rule below has to see through that, or every
 * destructure in a chain adds an indent step. The call shape must stay in sync
 * with `refoldCall`'s destructuring branch.
 */
const printsAsLet = (e: Expr): boolean =>
  e.kind === "letin" ||
  e.kind === "letbind" ||
  (e.kind === "call" &&
    e.args.length === 1 &&
    e.fn.kind === "lambda" &&
    e.fn.params.length === 1 &&
    e.fn.params[0]!.kind !== "name");

/**
 * `let x = v in body`; when it overflows, `in` stays at the end of the value
 * line. A chain of `let … in let … in …` stays left-aligned (flat), but the
 * terminal non-let body indents under `in` so a ternary/`=>` branch's payload
 * doesn't look unbound. Trailing comments on the value print after `in`.
 */
const letLikeD = (head: string, value: Expr, body: Expr): Doc => {
  // `line` must sit *inside* `indent` — indent only affects newlines, so a
  // sibling `line` then `indent(text)` would still print the body at the
  // outer column (same pitfall as lambda bodies above).
  const cont = printsAsLet(body) ? seq(line, exprD(body)) : indent(seq(line, exprD(body)));
  return group(
    seq(
      txt(`${head} = `),
      ...leadingDocs(value),
      exprRaw(value),
      txt(" in"),
      ...trailingDocs(value),
      cont,
    ),
  );
};

const recordD = (e: RecordExpr): Doc => {
  const fields = e.fields.map((f) => seq(txt(`${f.name}: `), exprD(f.value)));
  const items = e.spread ? [seq(txt("..."), exprD(e.spread)), ...fields] : fields;
  return braced("{", "}", items);
};

const mapD = (e: MapExpr): Doc =>
  braced(
    "#{",
    "}",
    e.entries.map((en) => seq(exprD(en.key), txt(": "), exprD(en.value))),
  );

const fieldD = (e: FieldExpr): Doc => seq(memberD(e.target), txt(`.${e.name}`));

/**
 * Binary operators the parser desugars straight into 2-arg calls (see the
 * matching *_BP constants in parser.ts) — precedence here must mirror those
 * exactly so a nested operator call gets parens only when omitting them
 * would reparse to a different tree.
 */
const BIN_OPS: Record<string, { symbol: string; prec: number }> = {
  or: { symbol: "||", prec: 7 },
  and: { symbol: "&&", prec: 7 },
  eq: { symbol: "==", prec: 8 },
  lt: { symbol: "<", prec: 8 },
  lte: { symbol: "<=", prec: 8 },
  gt: { symbol: ">", prec: 8 },
  gte: { symbol: ">=", prec: 8 },
  concat: { symbol: "++", prec: 10 },
  add: { symbol: "+", prec: 10 },
  sub: { symbol: "-", prec: 10 },
  mul: { symbol: "*", prec: 20 },
  div: { symbol: "/", prec: 20 },
  mod: { symbol: "%", prec: 20 },
};
const NEQ_PREC = 8;
const UNARY_OPS: Record<string, string> = { not: "!", negate: "-" };

const binOpOf = (e: Expr): { symbol: string; prec: number } | null =>
  e.kind !== "call" || e.fn.kind !== "ref" || e.args.length !== 2
    ? null
    : (BIN_OPS[e.fn.name] ?? null);

/**
 * `!=` desugars to `not(eq(a, b))`; an explicit `!(a == b)` desugars to the
 * exact same shape, so folding either back to `!=` is a deliberate (lossy)
 * simplification, same spirit as the composition refold above.
 */
const neqOperands = (e: Expr): [Expr, Expr] | null => {
  if (e.kind !== "call" || e.fn.kind !== "ref" || e.fn.name !== "not" || e.args.length !== 1)
    return null;
  const inner = e.args[0]!;
  return inner.kind !== "call" ||
    inner.fn.kind !== "ref" ||
    inner.fn.name !== "eq" ||
    inner.args.length !== 2
    ? null
    : [inner.args[0]!, inner.args[1]!];
};

const binOperandD = (e: Expr, parentPrec: number, isRight: boolean): Doc => {
  const info = binOpOf(e) ?? (neqOperands(e) ? { symbol: "!=", prec: NEQ_PREC } : null);
  const needsParens =
    e.kind === "lambda" || e.kind === "ternary" || e.kind === "pipe"
      ? true
      : info !== null && (isRight ? info.prec <= parentPrec : info.prec < parentPrec);
  return parenIf(needsParens, exprD(e));
};

/** `++` is left-associative (`concat(concat(a, b), c)`); flatten like `|>` so a long string-build can break one segment per line instead of overflowing. */
const CONCAT_PREC = 10;
const isConcatCall = (e: Expr): boolean =>
  e.kind === "call" && e.fn.kind === "ref" && e.fn.name === "concat" && e.args.length === 2;

const concatSegments = (e: Expr): Expr[] => {
  if (!isConcatCall(e)) return [e];
  const [l, r] = (e as CallExpr).args as [Expr, Expr];
  return [...concatSegments(l), r];
};

const concatD = (e: CallExpr): Doc => {
  const [head, ...rest] = concatSegments(e);
  return group(
    seq(
      binOperandD(head!, CONCAT_PREC, false),
      indent(cat(rest.map((s) => seq(line, txt("++ "), binOperandD(s, CONCAT_PREC, true))))),
    ),
  );
};

const binaryD = (e: CallExpr): Doc | null => {
  const neq = neqOperands(e);
  if (neq) {
    const [l, r] = neq;
    return group(seq(binOperandD(l, NEQ_PREC, false), txt(" != "), binOperandD(r, NEQ_PREC, true)));
  }
  const info = binOpOf(e);
  if (!info) return null;
  if (info.symbol === "++") return concatD(e);
  const [l, r] = e.args as [Expr, Expr];
  return group(
    seq(binOperandD(l, info.prec, false), txt(` ${info.symbol} `), binOperandD(r, info.prec, true)),
  );
};

/**
 * `not(x)` -> `!x`, `negate(x)` -> `-x`. Unary binds tighter than every infix
 * operator (its operand is parsed at atom level), so any operator-shaped
 * operand always needs parens regardless of precedence.
 */
const unaryD = (e: CallExpr): Doc | null => {
  if (e.fn.kind !== "ref" || e.args.length !== 1) return null;
  const symbol = UNARY_OPS[e.fn.name];
  if (!symbol) return null;
  const operand = e.args[0]!;
  const needsParens =
    operand.kind === "lambda" ||
    operand.kind === "ternary" ||
    operand.kind === "pipe" ||
    binOpOf(operand) !== null ||
    neqOperands(operand) !== null;
  return seq(txt(symbol), parenIf(needsParens, exprD(operand)));
};

/**
 * `($s) => op($s, y)` -> `(op y)` (right section); `($s) => op(x, $s)` ->
 * `(x op)` (left section) — see `sectionLeft`/`tryParseRightSection` in
 * parser.ts. `$`-prefixed names never lex as source identifiers (same reason
 * compose's `$x` always refolds to `>>` below), so this refold is required
 * for round-trip correctness, not just cosmetic.
 */
const sectionOf = (e: LambdaExpr): Doc | null => {
  const p = e.params[0];
  if (e.params.length !== 1 || p!.kind !== "name" || p!.name !== "$s") return null;
  const body = e.body;
  const neq = neqOperands(body);
  const info = neq ? { symbol: "!=", prec: NEQ_PREC } : binOpOf(body);
  if (!info || body.kind !== "call") return null;
  const [l, r] = neq ?? (body.args as [Expr, Expr]);
  const lIsParam = l.kind === "ref" && l.name === "$s";
  const rIsParam = r.kind === "ref" && r.name === "$s";
  if (lIsParam === rIsParam) return null; // both or neither -> not a section
  return lIsParam
    ? seq(txt(`(${info.symbol} `), binOperandD(r, info.prec, true), txt(")"))
    : seq(txt("("), binOperandD(l, info.prec, false), txt(` ${info.symbol})`));
};

/** Re-fold desugared infix/prefix/destructure calls back to surface syntax. */
const refoldCall = (e: CallExpr): Doc | null => {
  // Destructuring let-in: IIFE `(((a, b)) => body)(e)` -> `let (a, b) = e in body`
  if (e.args.length === 1 && e.fn.kind === "lambda" && e.fn.params.length === 1) {
    const p = e.fn.params[0]!;
    if (p.kind !== "name") return letLikeD(`let ${param(p)}`, e.args[0]!, e.fn.body);
  }

  // Refold composition: `($x) => g(f($x))` -> `f >> g`
  if (
    e.fn.kind === "lambda" &&
    e.fn.params.length === 1 &&
    e.fn.params[0]!.kind === "name" &&
    e.fn.params[0]!.name === "$x" &&
    e.fn.body.kind === "call" &&
    e.fn.body.args.length === 1 &&
    e.fn.body.args[0]!.kind === "call" &&
    e.fn.body.args[0]!.args.length === 1 &&
    e.fn.body.args[0]!.args[0]!.kind === "ref" &&
    e.fn.body.args[0]!.args[0]!.name === "$x"
  ) {
    const left = e.fn.body.args[0]!.fn;
    const right = e.fn.body.fn;
    return group(seq(operandD(left), txt(" >> "), operandD(right)));
  }

  return binaryD(e) ?? unaryD(e);
};

/**
 * `f(a, b)`. When the last argument is a lambda, keep `f(…, p =>` on the line
 * and let the lambda body break beneath it (the "trailing lambda hug"), rather
 * than exploding the whole argument list. The hug is a `group` with a `softline`
 * before `)` so a broken body does not glue the closer onto its last line
 * (`body)` / `body)(`) — except when the body is already braced (`switch` /
 * `loop`), where `})` hugs the closer onto the closing brace instead of leaving
 * a dangling `)\n` staircase. Otherwise the args are their own group after the
 * callee — so a short curried apply can still hug a multiline callee's `)`
 * (`…)(deps)`), instead of being locked into the callee's break decision.
 */
const callD = (e: CallExpr): Doc => {
  const refold = refoldCall(e);
  if (refold) return refold;
  const fn = calleeD(e.fn);
  if (e.args.length === 0) return seq(fn, txt("()"));
  const last = e.args[e.args.length - 1]!;
  if (last.kind === "lambda") {
    // `switch` / `loop` already end in `}`; glue `)` rather than soft-breaking
    // to a lone closer under the brace.
    const hugCloser = last.body.kind === "match" || last.body.kind === "loop";
    return group(
      seq(
        fn,
        txt("("),
        join(txt(", "), e.args.map(exprD)),
        hugCloser ? txt(")") : seq(softline, txt(")")),
      ),
    );
  }
  return seq(
    fn,
    group(
      seq(
        txt("("),
        indent(seq(softline, join(seq(txt(","), line), e.args.map(exprD)))),
        softline,
        txt(")"),
      ),
    ),
  );
};

/**
 * Inline `switch s { | A => x | _ => y }` when it fits, else one arm per line.
 * A multi-line arm body (a nested `switch`, a broken pipe) nests one level past
 * the arm's `|`, so its own lines never align with the parent's arms.
 */
/**
 * `loop (acc = 0, i = 0) { body }` (ADR 0056) — inline when it fits, else the
 * body indents on its own lines, brace layout matching `switch`.
 */
const loopD = (e: LoopExpr): Doc => {
  const params = join(
    txt(", "),
    e.params.map((p) => seq(txt(`${p.name} = `), exprD(p.init))),
  );
  return group(
    seq(txt("loop ("), params, txt(") {"), indent(seq(line, exprD(e.body))), line, txt("}")),
  );
};

const matchD = (e: MatchExpr): Doc => {
  const arms = e.arms.map((a) => {
    const guard = a.guard ? ` when ${flat(exprD(a.guard))}` : "";
    const head = txt(`| ${pattern(a.pattern)}${guard} =>`);
    // A commented arm body drops to its own indented line so the comment sits
    // above it rather than trailing the `=>`.
    return hasLead(a.body)
      ? seq(head, indent(seq(hardline, exprD(a.body))))
      : seq(head, txt(" "), indent(exprD(a.body)));
  });
  return group(
    seq(
      txt(`switch ${flat(exprD(e.scrutinee))} {`),
      indent(cat(arms.map((arm) => seq(line, arm)))),
      line,
      txt("}"),
    ),
  );
};

const exprD = (e: Expr): Doc => withComments(e, exprRaw(e));

/**
 * What a `format` hook may call back into: the recursive printers it needs to
 * lay out sub-expressions, plus the two leaf renderers whose escaping rules it
 * must not re-derive. The `Doc` combinators are plain functions in `doc.ts`, so
 * a hook imports those directly instead of receiving them here (ADR 0011).
 */
const formatApi: FormatApi = { exprD, memberD, flat, strLit };

/**
 * Resolved `format` hooks for the current `format()` call. Module-level and
 * reassigned per call, like the comment-attachment maps above: the printers are
 * a web of module-level functions referenced by name (`e.args.map(exprD)`), so
 * threading a context parameter through all of them would touch every one.
 * `format` is synchronous, so a call never observes another call's hooks.
 */
let formatHooks: FormatHook[] = [];

/** Plugin sugar first (JSX's `<tag>` re-fold, …), then this module's printer. */
const exprRaw = (e: Expr): Doc => runFormatHooks(formatHooks, e, formatApi) ?? exprCore(e);

const exprCore = (e: Expr): Doc =>
  match(e)
    .with({ kind: "num" }, (e) => txt(e.raw))
    .with({ kind: "unit" }, () => txt("()"))
    .with({ kind: "bool" }, (e) => txt(String(e.value)))
    .with({ kind: "str" }, (e) => txt(strLit(e.value)))
    .with({ kind: "interp" }, (e) => txt(interpText(e)))
    .with({ kind: "ref" }, (e) => txt(e.name))
    .with({ kind: "call" }, (e) => callD(e))
    .with({ kind: "lambda" }, (e) => lambdaD(e))
    .with({ kind: "pipe" }, (e) => pipeD(e))
    .with({ kind: "ternary" }, (e) => ternaryD(e))
    .with({ kind: "record" }, (e) => recordD(e))
    .with({ kind: "field" }, (e) => fieldD(e))
    .with({ kind: "tuple" }, (e) => bracketed("(", ")", e.elements.map(exprD)))
    .with({ kind: "arr" }, (e) => bracketed("[", "]", e.elements.map(seqElemD)))
    .with({ kind: "list" }, (e) => bracketed("@{", "}", e.elements.map(seqElemD)))
    .with({ kind: "set" }, (e) => bracketed("#{", "}", e.elements.map(seqElemD)))
    .with({ kind: "map" }, (e) => mapD(e))
    .with({ kind: "letin" }, (e) =>
      letLikeD(`let ${e.name}${e.annot ? ` : ${typeExpr(e.annot)}` : ""}`, e.value, e.body),
    )
    .with({ kind: "letbind" }, (e) =>
      letLikeD(`let${e.monad === "Result" ? "?" : "!"} ${param(e.param)}`, e.value, e.body),
    )
    .with({ kind: "match" }, (e) => matchD(e))
    .with({ kind: "loop" }, (e) => loopD(e))
    .with({ kind: "recur" }, (e) => seq(txt("recur"), bracketed("(", ")", e.args.map(exprD))))
    .exhaustive();

/** `export ` prefix for an exported declaration. */
const expPrefix = (s: Stmt): string => ("exported" in s && s.exported ? "export " : "");

/** Is `e` a field access `<tmp>.<name>` reading the given destructuring temp? */
const fieldOf = (e: Expr, tmp: string): string | null =>
  e.kind === "field" && e.target.kind === "ref" && e.target.name === tmp ? e.name : null;

type StmtDoc = { doc: Doc; consumed: number };

/**
 * Print one statement, re-folding a `$d` destructuring temp + its field-access
 * lets back into a single `let { … } = e`. Returns how many stmts it consumed.
 */
const stmtDoc = (stmts: Stmt[], i: number, src: string): StmtDoc => {
  const s = stmts[i]!;
  switch (s.kind) {
    case "import":
      return { doc: importStmtD(s), consumed: 1 };
    case "type":
      return { doc: seq(txt(expPrefix(s)), typeStmtD(s)), consumed: 1 };
    case "extern":
      return { doc: txt(expPrefix(s) + externStmt(s)), consumed: 1 };
    // C9 slice d (ADR 0045 decision 3): the span covers every byte skipped
    // during recovery, so re-emitting it verbatim is exactly what makes
    // `fmt` on a broken file never destroy code it couldn't parse. `verbatim`
    // (not `txt`) keeps the raw bytes — including any interior newlines —
    // opaque to the layout engine: no re-indentation, no re-wrapping.
    case "error":
      return { doc: verbatim(src.slice(s.span.start, s.span.end)), consumed: 1 };
  }

  if (s.name.startsWith("$")) {
    const fields: string[] = [];
    let j = i + 1;
    for (; j < stmts.length; j++) {
      const nxt = stmts[j]!;
      if (nxt.kind !== "let") break;
      const f = fieldOf(nxt.value, s.name);
      if (f === null || f !== nxt.name) break; // shorthand only
      fields.push(f);
    }
    return {
      doc: seq(txt(`${expPrefix(s)}let { ${fields.join(", ")} } = `), exprD(s.value)),
      consumed: j - i,
    };
  }

  const annot = s.annot ? ` : ${typeExpr(s.annot)}` : "";
  return {
    doc: seq(txt(`${expPrefix(s)}let ${s.name}${annot} = `), exprD(s.value)),
    consumed: 1,
  };
};

/**
 * A blank separator between two statements: a newline, only whitespace, then
 * another newline anywhere in the source gap between them. Any run of blank
 * lines collapses to exactly one; a doc comment on the following statement is
 * not whitespace, so `let a\n/// doc\nlet b` reads as adjacent (no blank).
 */
const blankBetween = /\n[^\S\n]*\n/;

/**
 * Where a statement's rendering begins in the source: its first leading
 * comment if it has one, else the statement's own token — used so a blank line
 * kept before a statement lands before its comment block, not inside it.
 */
const anchorStart = (s: Stmt): number => {
  const lead = LEADING.get(s);
  return lead?.length ? lead[0]!.start : s.span.start;
};

const program = (stmts: Stmt[], src: string, tail: Comment[]): string => {
  const parts: Doc[] = [];
  let prevEnd: number | null = null;
  for (let i = 0; i < stmts.length; ) {
    const cur = stmts[i]!;
    if (prevEnd !== null) {
      parts.push(hardline);
      if (blankBetween.test(src.slice(prevEnd, anchorStart(cur)))) parts.push(hardline);
    }
    const { doc, consumed } = stmtDoc(stmts, i, src);
    parts.push(withComments(cur, doc));
    prevEnd = stmts[i + consumed - 1]!.span.end;
    i += consumed;
  }
  // Comments after the last statement (no following node to attach to).
  if (tail.length) {
    if (prevEnd !== null) {
      parts.push(hardline);
      if (blankBetween.test(src.slice(prevEnd, tail[0]!.start))) parts.push(hardline);
    }
    parts.push(
      join(
        hardline,
        tail.map((c) => txt(c.text)),
      ),
    );
  }
  parts.push(hardline);
  return render(cat(parts), WIDTH);
};

/** `plugins`: sugar parsers *and* printers — one list, so anything a plugin can parse it can also re-fold. `undefined` → builtins (JSX); `[]` → hard opt-out (`resolvePlugins`, ADR 0011). */
export type FormatOptions = { plugins?: LanguagePlugin[] };

const layoutProgram = (prog: Program, src: string): string => {
  const errorSpans = prog.stmts.filter((s) => s.kind === "error").map((s) => s.span);
  const comments = collectComments(src).filter(
    (c) => !errorSpans.some((sp) => c.start >= sp.start && c.start < sp.end),
  );
  const tail = attachComments(prog.stmts, comments, src);
  return program(prog.stmts, src, tail);
};

/** Print an already-parsed `Program` with comment/blank-line fidelity to `src`. */
export const formatProgram = (prog: Program, src: string, opts: FormatOptions = {}): string => {
  formatHooks = resolvePlugins(opts.plugins).flatMap((p) => (p.format ? [p.format] : []));
  return layoutProgram(prog, src);
};

/**
 * C9 slice d (ADR 0045): `format` runs on `parseRecovering`, not the hard-fail
 * `parse` — a file with parse errors still formats, with every unparsable
 * region ("error" stmts) passed through verbatim rather than emitting nothing.
 * `parseRecovering` never fails, so the only remaining error channel here is
 * lex, which is still single-error and gets wrapped to match the (unchanged)
 * `Result<string, Diagnostic[]>` signature every caller already handles.
 */
export const format = (src: string, opts: FormatOptions = {}): Result<string, Diagnostic[]> => {
  formatHooks = resolvePlugins(opts.plugins).flatMap((p) => (p.format ? [p.format] : []));
  return pipe(
    lex(src),
    mapErr(oneDiag),
    map((toks) => parseRecovering(toks, { plugins: opts.plugins })),
    map(({ program }) => layoutProgram(program, src)),
  );
};
