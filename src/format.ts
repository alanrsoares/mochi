// alang source formatter: parse to the AST, then pretty-print a canonical
// rendering. Idempotent — formatting formatted output is a fixed point.
//
// Most expressions print on a single line; only `switch` breaks across lines,
// one `| pattern => body` arm per line. Record destructuring is desugared by
// the parser into a temp binding plus field-access lets, so the printer detects
// that shape and re-folds it back into `let { x, y } = e`.
import { flatMap, map, pipe, type Result } from "@onrails/result";
import type {
  Ctor,
  CtorField,
  Expr,
  ExternStmt,
  ImportStmt,
  LamParam,
  MatchExpr,
  PatField,
  Pattern,
  Stmt,
  TypeExpr,
  TypeStmt,
} from "./ast";
import type { AlangError } from "./errors";
import { lex } from "./lexer";
import { parse } from "./parser";

const INDENT = "  ";

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

// A precedence-light expression printer. `ind` is the current indent (used only
// by `switch`, the one multi-line form).
const expr = (e: Expr, ind: string): string => {
  switch (e.kind) {
    case "num":
      return e.raw;
    case "bool":
      return String(e.value);
    case "str":
      return JSON.stringify(e.value);
    case "ref":
      return e.name;
    case "call":
      return `${callee(e.fn, ind)}(${e.args.map((a) => expr(a, ind)).join(", ")})`;
    case "lambda":
      return `${params(e.params)} => ${expr(e.body, ind)}`;
    case "pipe":
      return `${operand(e.left, ind)} |> ${operand(e.right, ind)}`;
    // Right-associative: a bare else-chain reprints flat; a ternary in cond
    // position must keep its parens or the reprint would reparse differently.
    case "ternary": {
      const cond = e.cond.kind === "ternary" ? `(${expr(e.cond, ind)})` : expr(e.cond, ind);
      return `${cond} ? ${expr(e.then, ind)} : ${expr(e.else, ind)}`;
    }
    case "record":
      return e.fields.length === 0
        ? "{}"
        : `{ ${e.fields.map((f) => `${f.name}: ${expr(f.value, ind)}`).join(", ")} }`;
    case "field":
      return `${member(e.target, ind)}.${e.name}`;
    case "tuple":
      return `(${e.elements.map((el) => expr(el, ind)).join(", ")})`;
    case "arr":
      return `[${e.elements.map((el) => expr(el, ind)).join(", ")}]`;
    case "list":
      return `@{${e.elements.map((el) => expr(el, ind)).join(", ")}}`;
    case "map":
      return e.entries.length === 0
        ? "#{}"
        : `#{ ${e.entries.map((en) => `${expr(en.key, ind)}: ${expr(en.value, ind)}`).join(", ")} }`;
    case "letin":
      return `let ${e.name} = ${expr(e.value, ind)} in ${expr(e.body, ind)}`;
    case "letbind":
      return `let? ${param(e.param)} = ${expr(e.value, ind)} in ${expr(e.body, ind)}`;
    case "match":
      return matchExpr(e, ind);
  }
};

// A lambda in callee or member position needs parentheses. A ternary does too
// (it binds looser than everything), and in pipe-operand position — a bare
// `a ? b : c |> f` would reparse with the ternary swallowing the pipe.
const callee = (e: Expr, ind: string): string =>
  e.kind === "lambda" || e.kind === "ternary" ? `(${expr(e, ind)})` : expr(e, ind);
const member = (e: Expr, ind: string): string =>
  e.kind === "lambda" || e.kind === "record" || e.kind === "ternary"
    ? `(${expr(e, ind)})`
    : expr(e, ind);
const operand = (e: Expr, ind: string): string =>
  e.kind === "ternary" ? `(${expr(e, ind)})` : expr(e, ind);

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
  }
};

// `{ x }` when the field puns to its own name, else `{ label: pat }`.
const patField = (f: PatField): string =>
  f.pat.kind === "pbind" && f.pat.name === f.label ? f.label : `${f.label}: ${pattern(f.pat)}`;

const matchExpr = (e: MatchExpr, ind: string): string => {
  const inner = ind + INDENT;
  const arms = e.arms.map((a) => {
    const guard = a.guard ? ` when ${expr(a.guard, inner)}` : "";
    return `${inner}| ${pattern(a.pattern)}${guard} => ${expr(a.body, inner)}`;
  });
  return `switch ${expr(e.scrutinee, ind)} {\n${arms.join("\n")}\n${ind}}`;
};

const ctorField = (f: CtorField): string =>
  f.name ? `${f.name}: ${typeExpr(f.type)}` : typeExpr(f.type);

const ctor = (c: Ctor): string =>
  c.fields.length === 0 ? c.name : `${c.name}(${c.fields.map(ctorField).join(", ")})`;

// A type expression; the left side of an arrow is parenthesized when it is
// itself an arrow ((a -> b) -> c).
const typeExpr = (te: TypeExpr): string => {
  if (te.kind === "tname") return te.name;
  if (te.kind === "tapp") {
    // A compound arg (arrow or nested application) needs parens: `Task (Option a)`.
    const arg = (a: TypeExpr): string => (a.kind === "tname" ? typeExpr(a) : `(${typeExpr(a)})`);
    return `${te.ctor} ${te.args.map(arg).join(" ")}`;
  }
  if (te.kind === "ttuple") return `(${te.elems.map(typeExpr).join(", ")})`;
  if (te.kind === "tlist") return `[${typeExpr(te.elem)}]`;
  const from = te.from.kind === "tarrow" ? `(${typeExpr(te.from)})` : typeExpr(te.from);
  return `${from} -> ${typeExpr(te.to)}`;
};

const externStmt = (s: ExternStmt): string =>
  `extern ${s.name} : ${typeExpr(s.typeExpr)} = ${JSON.stringify(s.module)} ${JSON.stringify(s.imported)}`;

const typeStmt = (s: TypeStmt): string => {
  const head = s.params.length ? `type ${s.name} ${s.params.join(" ")}` : `type ${s.name}`;
  // Transparent record alias: `type Point = { x: number, y: number }`.
  if (s.alias) {
    const fields = s.alias.map((f) => `${f.name}: ${typeExpr(f.type)}`);
    return fields.length ? `${head} = { ${fields.join(", ")} }` : `${head} = {}`;
  }
  const arms = s.ctors.map((c) => `${INDENT}| ${ctor(c)}`);
  return `${head} =\n${arms.join("\n")}`;
};

// Is `e` a field access `<tmp>.<name>` reading the given destructuring temp?
const fieldOf = (e: Expr, tmp: string): string | null =>
  e.kind === "field" && e.target.kind === "ref" && e.target.name === tmp ? e.name : null;

// Print statements, re-folding a `$d` temp + its field-access lets into a
// single `let { ... } = e`. Returns the number of statements consumed.
const importStmt = (s: ImportStmt): string =>
  `import { ${s.names.map((n) => n.name).join(", ")} } from ${JSON.stringify(s.from)}`;

// `export ` prefix for an exported declaration.
const exp = (s: Stmt, text: string): string =>
  "exported" in s && s.exported ? `export ${text}` : text;

const stmtAt = (stmts: Stmt[], i: number): { text: string; consumed: number } => {
  const s = stmts[i]!;
  if (s.kind === "import") return { text: importStmt(s), consumed: 1 };
  if (s.kind === "type") return { text: exp(s, typeStmt(s)), consumed: 1 };
  if (s.kind === "extern") return { text: exp(s, externStmt(s)), consumed: 1 };

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
      text: exp(s, `let { ${fields.join(", ")} } = ${expr(s.value, "")}`),
      consumed: j - i,
    };
  }

  return { text: exp(s, `let ${s.name} = ${expr(s.value, "")}`), consumed: 1 };
};

const program = (stmts: Stmt[]): string => {
  const out: string[] = [];
  for (let i = 0; i < stmts.length; ) {
    const { text, consumed } = stmtAt(stmts, i);
    out.push(text);
    i += consumed;
  }
  return `${out.join("\n")}\n`;
};

export const format = (src: string): Result<string, AlangError> =>
  pipe(
    lex(src),
    flatMap(parse),
    map((prog) => program(prog.stmts)),
  );
