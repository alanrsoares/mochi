// alang source formatter: parse to the AST, then pretty-print a canonical
// rendering. Idempotent — formatting formatted output is a fixed point.
//
// Most expressions print on a single line; only `switch` breaks across lines,
// one `| pattern => body` arm per line. Record destructuring is desugared by
// the parser into a temp binding plus field-access lets, so the printer detects
// that shape and re-folds it back into `let { x, y } = e`.
import { flatMap, map, pipe, type Result } from "@onrails/result";
import type { Ctor, Expr, Pattern, Stmt } from "./ast";
import type { AlangError } from "./errors";
import { lex } from "./lexer";
import { parse } from "./parser";

const INDENT = "  ";

const params = (ps: string[]): string => (ps.length === 1 ? ps[0]! : `(${ps.join(", ")})`);

// A precedence-light expression printer. `ind` is the current indent (used only
// by `switch`, the one multi-line form).
const expr = (e: Expr, ind: string): string => {
  switch (e.kind) {
    case "num":
      return String(e.value);
    case "ref":
      return e.name;
    case "call":
      return `${callee(e.fn, ind)}(${e.args.map((a) => expr(a, ind)).join(", ")})`;
    case "lambda":
      return `${params(e.params)} => ${expr(e.body, ind)}`;
    case "pipe":
      return `${expr(e.left, ind)} |> ${expr(e.right, ind)}`;
    case "record":
      return e.fields.length === 0
        ? "{}"
        : `{ ${e.fields.map((f) => `${f.name}: ${expr(f.value, ind)}`).join(", ")} }`;
    case "field":
      return `${member(e.target, ind)}.${e.name}`;
    case "match":
      return matchExpr(e, ind);
  }
};

// A lambda in callee or member position needs parentheses.
const callee = (e: Expr, ind: string): string =>
  e.kind === "lambda" ? `(${expr(e, ind)})` : expr(e, ind);
const member = (e: Expr, ind: string): string =>
  e.kind === "lambda" || e.kind === "record" ? `(${expr(e, ind)})` : expr(e, ind);

const pattern = (p: Pattern): string => {
  switch (p.kind) {
    case "pwild":
      return "_";
    case "pbind":
      return p.name;
    case "plit":
      return String(p.value);
    case "pctor":
      return p.args.length === 0 ? p.ctor : `${p.ctor}(${p.args.map(pattern).join(", ")})`;
  }
};

const matchExpr = (e: Extract<Expr, { kind: "match" }>, ind: string): string => {
  const inner = ind + INDENT;
  const arms = e.arms.map((a) => `${inner}| ${pattern(a.pattern)} => ${expr(a.body, inner)}`);
  return `switch ${expr(e.scrutinee, ind)} {\n${arms.join("\n")}\n${ind}}`;
};

const ctor = (c: Ctor): string =>
  c.argTypes.length === 0 ? c.name : `${c.name}(${c.argTypes.join(", ")})`;

const typeStmt = (s: Extract<Stmt, { kind: "type" }>): string => {
  const head = s.params.length ? `type ${s.name} ${s.params.join(" ")}` : `type ${s.name}`;
  const arms = s.ctors.map((c) => `${INDENT}| ${ctor(c)}`);
  return `${head} =\n${arms.join("\n")}`;
};

// Is `e` a field access `<tmp>.<name>` reading the given destructuring temp?
const fieldOf = (e: Expr, tmp: string): string | null =>
  e.kind === "field" && e.target.kind === "ref" && e.target.name === tmp ? e.name : null;

// Print statements, re-folding a `$d` temp + its field-access lets into a
// single `let { ... } = e`. Returns the number of statements consumed.
const stmtAt = (stmts: Stmt[], i: number): { text: string; consumed: number } => {
  const s = stmts[i]!;
  if (s.kind === "type") return { text: typeStmt(s), consumed: 1 };

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
    return { text: `let { ${fields.join(", ")} } = ${expr(s.value, "")}`, consumed: j - i };
  }

  return { text: `let ${s.name} = ${expr(s.value, "")}`, consumed: 1 };
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
