// alang source formatter: parse to the AST, lower to a Wadler/Prettier-style
// document IR, then lay it out against an 80-column target (ADR 0025). Every
// breakable construct — pipe, switch, ternary, `let … in`, record/map literals,
// call-argument lists — is a `group` that prints flat when it fits the line and
// breaks otherwise. Formatting is idempotent: the layout is a pure function of
// the AST and the width, and re-parsing broken output yields the same AST
// (newlines are insignificant to the lexer).
//
// Record destructuring is desugared by the parser into a temp binding plus
// field-access lets, so the printer detects that shape and re-folds it back
// into `let { x, y } = e`; a destructuring `let (a, b) = e in body` desugars to
// an applied lambda, which the printer re-folds too.
import { flatMap, map, pipe, type Result } from "@onrails/result";
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
  MapExpr,
  MatchExpr,
  PatField,
  Pattern,
  PipeExpr,
  RecordExpr,
  Stmt,
  TernaryExpr,
  TypeExpr,
  TypeStmt,
} from "./ast";
import type { AlangError } from "./errors";
import { lex, skipStringLiteral } from "./lexer";
import { parse } from "./parser";

const WIDTH = 80;
const INDENT = 2;

// ---- document IR -----------------------------------------------------------

// `line` is a space when its group prints flat, a newline+indent when it
// breaks; `softline` is nothing when flat; `hardline` always breaks. `group`
// asks "does the flat rendering fit the rest of this line?" and picks a mode.
// `breakparent` is zero-width but forces every enclosing group to break — used
// after a trailing `//` comment so whatever follows lands on a fresh line
// (else it would be commented out) without emitting a newline of its own.
type Doc =
  | { k: "text"; s: string }
  | { k: "line"; hard: boolean; soft: boolean }
  | { k: "cat"; parts: Doc[] }
  | { k: "indent"; doc: Doc }
  | { k: "group"; doc: Doc }
  | { k: "breakparent" };

const txt = (s: string): Doc => ({ k: "text", s });
const cat = (parts: Doc[]): Doc => ({ k: "cat", parts });
const seq = (...parts: Doc[]): Doc => ({ k: "cat", parts });
const line: Doc = { k: "line", hard: false, soft: false };
const softline: Doc = { k: "line", hard: false, soft: true };
const hardline: Doc = { k: "line", hard: true, soft: false };
const breakParent: Doc = { k: "breakparent" };
const indent = (doc: Doc): Doc => ({ k: "indent", doc });
const group = (doc: Doc): Doc => ({ k: "group", doc });

const join = (sep: Doc, parts: Doc[]): Doc =>
  cat(parts.flatMap((p, i) => (i === 0 ? [p] : [sep, p])));

type Mode = "flat" | "break";
type Item = { i: number; m: Mode; d: Doc };
// The layout worklist is an immutable cons-list (the head is the next document
// to process), so pushing work never mutates an array.
type Cell = { head: Item; tail: Work };
type Work = Cell | null;

const cons = (head: Item, tail: Work): Work => ({ head, tail });

// Prepend a cat's parts so part[0] ends up at the head (processed first).
const consParts = (parts: Doc[], i: number, m: Mode, tail: Work): Work => {
  let w = tail;
  for (let k = parts.length - 1; k >= 0; k--) w = cons({ i, m, d: parts[k]! }, w);
  return w;
};

// Would the documents on `work` (processed head-first, groups forced flat) stay
// within `width` columns before the line ends? A break-mode line or a hardline
// ends the line, so we stop and report success there.
const fits = (width: number, start: Work): boolean => {
  let rem = width;
  let work = start;
  while (rem >= 0) {
    if (!work) return true;
    const { i, m, d } = work.head;
    work = work.tail;
    switch (d.k) {
      case "text":
        rem -= d.s.length;
        break;
      case "cat":
        work = consParts(d.parts, i, m, work);
        break;
      case "indent":
        work = cons({ i: i + INDENT, m, d: d.doc }, work);
        break;
      case "group":
        work = cons({ i, m: "flat", d: d.doc }, work);
        break;
      case "line":
        if (d.hard || m === "break") return true;
        rem -= d.soft ? 0 : 1;
        break;
      case "breakparent":
        break; // zero-width here; it only forces the group that *contains* it
    }
  }
  return false;
};

// Does this document contain a hardline anywhere in its subtree? If so, every
// enclosing group must break (a group can never print "flat" across a forced
// newline). Comments introduce hardlines, so a commented node breaks its
// parents. Memoized — documents are immutable and shared during layout.
const breakCache = new WeakMap<Doc, boolean>();
const forcesBreak = (d: Doc): boolean => {
  const cached = breakCache.get(d);
  if (cached !== undefined) return cached;
  const r =
    d.k === "breakparent"
      ? true
      : d.k === "line"
        ? d.hard
        : d.k === "cat"
          ? d.parts.some(forcesBreak)
          : d.k === "indent" || d.k === "group"
            ? forcesBreak(d.doc)
            : false;
  breakCache.set(d, r);
  return r;
};

const render = (root: Doc, width: number): string => {
  const out: string[] = [];
  let pos = 0;
  let work: Work = cons({ i: 0, m: "break", d: root }, null);
  while (work) {
    const { i, m, d } = work.head;
    work = work.tail;
    switch (d.k) {
      case "text":
        out.push(d.s);
        pos += d.s.length;
        break;
      case "cat":
        work = consParts(d.parts, i, m, work);
        break;
      case "indent":
        work = cons({ i: i + INDENT, m, d: d.doc }, work);
        break;
      case "line":
        if (m === "flat" && !d.hard) {
          const s = d.soft ? "" : " ";
          out.push(s);
          pos += s.length;
        } else {
          out.push(`\n${" ".repeat(i)}`);
          pos = i;
        }
        break;
      case "group": {
        if (forcesBreak(d.doc)) {
          work = cons({ i, m: "break", d: d.doc }, work);
          break;
        }
        const cand = cons({ i, m: "flat", d: d.doc }, work);
        work = fits(width - pos, cand) ? cand : cons({ i, m: "break", d: d.doc }, work);
        break;
      }
      case "breakparent":
        break; // zero-width; its only effect is via forcesBreak
    }
  }
  return out.join("");
};

// Render a document on a single line (every group flat) — for contexts that
// never wrap: interpolation holes, `switch` scrutinees, and `when` guards.
const flat = (d: Doc): string => render(d, Number.POSITIVE_INFINITY);

// ---- leaf renderers (strings) ----------------------------------------------

const param = (p: LamParam): string =>
  p.kind === "name"
    ? p.name
    : p.kind === "ptuple"
      ? `(${p.names.join(", ")})`
      : `{ ${p.fields.join(", ")} }`;

// A lone plain-name param drops its parens (`x => ...`); anything else keeps
// them (`(a, b) => ...`, `({ x }) => ...`).
const params = (ps: LamParam[]): string =>
  ps.length === 1 && ps[0]!.kind === "name" ? ps[0]!.name : `(${ps.map(param).join(", ")})`;

// `JSON.stringify` handles \n \t \\ \" escaping but leaves a literal `${`
// alone — which would reopen an interpolation hole on re-lex (ADR 0023).
// Re-escape it so a hole-free string round-trips even when its decoded
// value happens to contain that sequence.
const escFragment = (s: string): string => JSON.stringify(s).slice(1, -1).replace(/\$\{/g, "\\${");
const strLit = (s: string): string => `"${escFragment(s)}"`;

// "…${x}…" (ADR 0023) — round-trip the sugar; holes render flat.
const interpText = (e: InterpExpr): string =>
  `"${e.parts.map((p) => (typeof p === "string" ? escFragment(p) : `\${${flat(exprD(p))}}`)).join("")}"`;

const pattern = (p: Pattern): string => {
  switch (p.kind) {
    case "pwild":
      return "_";
    case "pbind":
      return p.name;
    case "plit":
      return p.raw;
    case "pbool":
      return String(p.value);
    case "pstr":
      return JSON.stringify(p.value);
    case "precord":
      return `{ ${p.fields.map(patField).join(", ")} }`;
    case "ptuple":
      return `(${p.elems.map(pattern).join(", ")})`;
    case "pctor":
      return p.args.length === 0 ? p.ctor : `${p.ctor}(${p.args.map(pattern).join(", ")})`;
    case "parr": {
      const head = p.elems.map(pattern);
      const rest = p.rest ? [`...${pattern(p.rest)}`] : [];
      return `[${[...head, ...rest].join(", ")}]`;
    }
    case "plist": {
      const head = p.elems.map(pattern);
      const rest = p.rest ? [`...${pattern(p.rest)}`] : [];
      return `@{${[...head, ...rest].join(", ")}}`;
    }
    case "por":
      return p.alts.map(pattern).join(" | ");
  }
};

// `{ x }` when the field puns to its own name, else `{ label: pat }`.
const patField = (f: PatField): string =>
  f.pat.kind === "pbind" && f.pat.name === f.label ? f.label : `${f.label}: ${pattern(f.pat)}`;

const ctorField = (f: CtorField): string =>
  f.name ? `${f.name}: ${typeExpr(f.type)}` : typeExpr(f.type);

const ctor = (c: Ctor): string =>
  c.fields.length === 0 ? c.name : `${c.name}(${c.fields.map(ctorField).join(", ")})`;

// A type expression; the left side of an arrow is parenthesized when it is
// itself an arrow ((a -> b) -> c).
const typeExpr = (te: TypeExpr): string => {
  if (te.kind === "tname") return te.name;
  if (te.kind === "tapp") {
    // Only an arrow or a nested application needs parens as an arg
    // (`Task (Option a)`); `[a]` and `(a, b)` are already self-delimiting.
    const arg = (a: TypeExpr): string =>
      a.kind === "tapp" || a.kind === "tarrow" ? `(${typeExpr(a)})` : typeExpr(a);
    return `${te.ctor} ${te.args.map(arg).join(" ")}`;
  }
  if (te.kind === "ttuple") return `(${te.elems.map(typeExpr).join(", ")})`;
  if (te.kind === "tlist") return `[${typeExpr(te.elem)}]`;
  const from = te.from.kind === "tarrow" ? `(${typeExpr(te.from)})` : typeExpr(te.from);
  return `${from} -> ${typeExpr(te.to)}`;
};

const externStmt = (s: ExternStmt): string =>
  `extern ${s.name} : ${typeExpr(s.typeExpr)} = ${JSON.stringify(s.module)} ${JSON.stringify(s.imported)}`;

// Rendered as a Doc (not a flat string) so a comment interleaved between
// constructors can print as a leading line above the constructor it documents,
// indented to the arm — `withComments` per ctor supplies that slot.
const typeStmtD = (s: TypeStmt): Doc => {
  const head = s.params.length ? `type ${s.name} ${s.params.join(" ")}` : `type ${s.name}`;
  // Transparent record alias: `type Point = { x: number, y: number }`.
  if (s.alias) {
    const fields = s.alias.map((f) => `${f.name}: ${typeExpr(f.type)}`);
    return txt(fields.length ? `${head} = { ${fields.join(", ")} }` : `${head} = {}`);
  }
  const arms = s.ctors.map((c) => withComments(c, txt(`| ${ctor(c)}`)));
  return seq(txt(`${head} =`), indent(cat(arms.map((a) => seq(hardline, a)))));
};

const importStmt = (s: ImportStmt): string =>
  `import { ${s.names.map((n) => n.name).join(", ")} } from ${JSON.stringify(s.from)}`;

// ---- comments --------------------------------------------------------------

// Comments are not in the AST, so the formatter re-scans the source for them
// and reattaches them by span. An *own-line* comment (a line that is
// whitespace-then-comment) attaches to the AST node that most tightly follows
// it and prints as a leading line above that node. A *trailing* comment (code
// then `//` on the same line) attaches to the node it most tightly follows on
// that line and prints inline after it; if it trails a bare marker with no node
// on the line (e.g. a ternary's `:`), it degrades to a leading comment of the
// following node — never dropped.
type Comment = {
  start: number;
  end: number;
  text: string;
  blankAfter: boolean;
  trailing: boolean; // code preceded it on its line
};

// Scan every `//` / `///` comment, string-aware: a `//` inside a string literal
// (or a `${…}` hole) is not a comment. Reuses the lexer's string skipper so the
// two agree exactly on where a literal ends.
const collectComments = (src: string): Comment[] => {
  const out: Comment[] = [];
  let i = 0;
  let lineHasToken = false; // a non-space, non-comment char seen this line
  while (i < src.length) {
    const c = src[i]!;
    if (c === "\n") {
      lineHasToken = false;
      i++;
      continue;
    }
    if (c === " " || c === "\t" || c === "\r") {
      i++;
      continue;
    }
    if (c === '"') {
      const end = skipStringLiteral(src, i);
      if (end === null) break; // unterminated — parse already failed upstream
      i = end;
      lineHasToken = true;
      continue;
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

// The node a comment attaches to, keyed by node identity — LEADING prints above
// the node, TRAILING inline after it. A fresh AST is parsed per `format` call,
// so entries never outlive their source.
const LEADING = new WeakMap<object, Comment[]>();
const TRAILING = new WeakMap<object, Comment[]>();

type Anchor = { node: Expr | Stmt | Ctor; start: number; end: number };

// Every span-carrying expression under a statement, plus the statement itself
// and — for a `type` decl — each constructor, so a comment interleaved between
// constructors attaches to the one it precedes instead of migrating to the next
// statement.
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
      case "arr":
      case "list":
        e.elements.forEach(visit);
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

// Assign each comment to an anchor. A trailing comment binds to the node it
// most tightly follows *on the same line* (largest end at or before its start,
// no intervening newline) as a TRAILING comment. An own-line comment — or a
// trailing one with no node on its line, e.g. after a ternary `:` — binds to
// the node that follows it most tightly (smallest start at or after the
// comment; ties toward the outermost node) as a LEADING comment. Comments past
// the last node have no anchor and are returned to emit after the final stmt.
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

// Leading comment lines for a node: each on its own line, a blank line kept
// after any comment the source separated from what follows.
const leadingDocs = (node: Expr | Stmt | Ctor): Doc[] => {
  const cs = LEADING.get(node);
  return cs
    ? cs.flatMap((c) =>
        c.blankAfter ? [txt(c.text), hardline, hardline] : [txt(c.text), hardline],
      )
    : [];
};

// A trailing comment prints ` // text` after the node, then `breakParent` so
// whatever follows lands on a new line (otherwise it would be commented out)
// without emitting a newline here — the enclosing group / statement separator
// supplies it. Only own-line breaks emit an actual newline.
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

// ---- expression documents --------------------------------------------------

const parenIf = (cond: boolean, d: Doc): Doc => (cond ? seq(txt("("), d, txt(")")) : d);

// A callee/member/pipe-operand needs parens when dropping them would reparse to
// a different tree: a lambda or ternary binds looser than application, a record
// in member position is ambiguous, and a nested pipe would re-associate.
const calleeD = (e: Expr): Doc =>
  parenIf(e.kind === "lambda" || e.kind === "ternary" || e.kind === "pipe", exprD(e));
const memberD = (e: Expr): Doc =>
  parenIf(
    e.kind === "lambda" || e.kind === "record" || e.kind === "ternary" || e.kind === "pipe",
    exprD(e),
  );
const operandD = (e: Expr): Doc =>
  parenIf(e.kind === "lambda" || e.kind === "ternary" || e.kind === "pipe", exprD(e));

// `(a, b)` / `[a, b]` / `@{a, b}` — no inner padding; breaks one element per
// line when it overflows.
const bracketed = (open: string, close: string, elems: Expr[]): Doc =>
  elems.length === 0
    ? txt(`${open}${close}`)
    : group(
        seq(
          txt(open),
          indent(seq(softline, join(seq(txt(","), line), elems.map(exprD)))),
          softline,
          txt(close),
        ),
      );

// `{ a: 1, b: 2 }` / `#{ k: v }` — padded braces; breaks one entry per line.
const braced = (open: string, close: string, items: Doc[]): Doc =>
  items.length === 0
    ? txt(`${open}${close}`)
    : group(seq(txt(open), indent(seq(line, join(seq(txt(","), line), items))), line, txt(close)));

// `|>` is left-associative, so `a |> b |> c` is pipe(pipe(a, b), c); flatten it
// back to the source order [a, b, c].
const pipeSegments = (e: Expr): Expr[] =>
  e.kind === "pipe" ? [...pipeSegments(e.left), e.right] : [e];

// Inline when it fits, else one `|> stage` per line indented under the head.
const pipeD = (e: PipeExpr): Doc => {
  const [head, ...rest] = pipeSegments(e);
  return group(
    seq(operandD(head!), indent(cat(rest.map((s) => seq(line, txt("|> "), operandD(s)))))),
  );
};

// A multi-line body breaks after `=>` onto its own indented line, so a pipe
// body reads as a block. A `switch` is the exception: it opens its own block
// right after the arrow (`xs => switch xs {`), so it stays attached.
const lambdaD = (e: LambdaExpr): Doc => {
  const head = txt(`${params(e.params)} =>`);
  // A switch body attaches to the arrow (`xs => switch xs {`) — unless it
  // carries a leading comment, which forces it onto its own indented line.
  return e.body.kind === "match" && !hasLead(e.body)
    ? seq(head, txt(" "), exprD(e.body))
    : group(seq(head, indent(seq(line, exprD(e.body)))));
};

// A ternary branch after its `?` / `:` marker; a commented branch drops to its
// own indented line so the comment stays own-line (and the layout idempotent).
const branchD = (marker: string, e: Expr): Doc =>
  hasLead(e) ? seq(txt(marker), indent(seq(hardline, exprD(e)))) : seq(txt(`${marker} `), exprD(e));

// Inline `c ? t : e`, else break to `c` / `? t` / `: e`. A ternary in cond
// position keeps its parens (it binds looser than everything else).
const ternaryD = (e: TernaryExpr): Doc =>
  group(
    seq(
      parenIf(e.cond.kind === "ternary", exprD(e.cond)),
      indent(seq(line, branchD("?", e.then), line, branchD(":", e.else))),
    ),
  );

// `let x = v in body`; when it overflows, `in` stays at the end of the value
// line and the body drops to the next line at the same indent.
// A trailing comment on the value (`let x = v // note` then `in …` in source)
// must print AFTER the `in` keyword, not glued to the value — otherwise the
// `in` lands on the commented-out line and the output no longer parses. So
// splice the value's own comments manually: leading before, trailing after
// `in`.
const letLikeD = (head: string, value: Expr, body: Expr): Doc =>
  group(
    seq(
      txt(`${head} = `),
      ...leadingDocs(value),
      exprRaw(value),
      txt(" in"),
      ...trailingDocs(value),
      line,
      exprD(body),
    ),
  );

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

// `let (a, b) = e in body` / `let { x } = e in body` desugars to an applied
// lambda with a destructuring param (ADR 0011). Re-fold that surface `let`
// rather than leak the IIFE `(((a, b)) => body)(e)`.
const refoldLetIn = (e: CallExpr): Doc | null => {
  if (e.args.length !== 1 || e.fn.kind !== "lambda" || e.fn.params.length !== 1) return null;
  const p = e.fn.params[0]!;
  return p.kind === "name" ? null : letLikeD(`let ${param(p)}`, e.args[0]!, e.fn.body);
};

// `f(a, b)`. When the last argument is a lambda, keep `f(…, p =>` on the line
// and let the lambda body break beneath it (the "trailing lambda hug"), rather
// than exploding the whole argument list. Otherwise the args are one group that
// breaks one-per-line when it overflows.
const callD = (e: CallExpr): Doc => {
  const refold = refoldLetIn(e);
  if (refold) return refold;
  const fn = calleeD(e.fn);
  if (e.args.length === 0) return seq(fn, txt("()"));
  if (e.args[e.args.length - 1]!.kind === "lambda") {
    return seq(fn, txt("("), join(txt(", "), e.args.map(exprD)), txt(")"));
  }
  return group(
    seq(
      fn,
      txt("("),
      indent(seq(softline, join(seq(txt(","), line), e.args.map(exprD)))),
      softline,
      txt(")"),
    ),
  );
};

// Inline `switch s { | A => x | _ => y }` when it fits, else one arm per line.
// A multi-line arm body (a nested `switch`, a broken pipe) nests one level past
// the arm's `|`, so its own lines never align with the parent's arms.
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

const exprRaw = (e: Expr): Doc => {
  switch (e.kind) {
    case "num":
      return txt(e.raw);
    case "bool":
      return txt(String(e.value));
    case "str":
      return txt(strLit(e.value));
    case "interp":
      return txt(interpText(e));
    case "ref":
      return txt(e.name);
    case "call":
      return callD(e);
    case "lambda":
      return lambdaD(e);
    case "pipe":
      return pipeD(e);
    case "ternary":
      return ternaryD(e);
    case "record":
      return recordD(e);
    case "field":
      return fieldD(e);
    case "tuple":
      return bracketed("(", ")", e.elements);
    case "arr":
      return bracketed("[", "]", e.elements);
    case "list":
      return bracketed("@{", "}", e.elements);
    case "map":
      return mapD(e);
    case "letin":
      return letLikeD(`let ${e.name}`, e.value, e.body);
    case "letbind":
      return letLikeD(`let? ${param(e.param)}`, e.value, e.body);
    case "match":
      return matchD(e);
  }
};

// ---- statements ------------------------------------------------------------

// `export ` prefix for an exported declaration.
const expPrefix = (s: Stmt): string => ("exported" in s && s.exported ? "export " : "");

// Is `e` a field access `<tmp>.<name>` reading the given destructuring temp?
const fieldOf = (e: Expr, tmp: string): string | null =>
  e.kind === "field" && e.target.kind === "ref" && e.target.name === tmp ? e.name : null;

type StmtDoc = { doc: Doc; consumed: number };

// Print one statement, re-folding a `$d` destructuring temp + its field-access
// lets back into a single `let { … } = e`. Returns how many stmts it consumed.
const stmtDoc = (stmts: Stmt[], i: number): StmtDoc => {
  const s = stmts[i]!;
  if (s.kind === "import") return { doc: txt(importStmt(s)), consumed: 1 };
  if (s.kind === "type") return { doc: seq(txt(expPrefix(s)), typeStmtD(s)), consumed: 1 };
  if (s.kind === "extern") return { doc: txt(expPrefix(s) + externStmt(s)), consumed: 1 };

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

  return { doc: seq(txt(`${expPrefix(s)}let ${s.name} = `), exprD(s.value)), consumed: 1 };
};

// A blank separator between two statements: a newline, only whitespace, then
// another newline anywhere in the source gap between them. Any run of blank
// lines collapses to exactly one; a doc comment on the following statement is
// not whitespace, so `let a\n/// doc\nlet b` reads as adjacent (no blank).
const blankBetween = /\n[^\S\n]*\n/;

// Where a statement's rendering begins in the source: its first leading
// comment if it has one, else the statement's own token — used so a blank line
// kept before a statement lands before its comment block, not inside it.
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
    const { doc, consumed } = stmtDoc(stmts, i);
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

export const format = (src: string): Result<string, AlangError> =>
  pipe(
    lex(src),
    flatMap(parse),
    map((prog) => {
      const tail = attachComments(prog.stmts, collectComments(src), src);
      return program(prog.stmts, src, tail);
    }),
  );
