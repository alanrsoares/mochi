// Codegen — AST → JavaScript source. Pure (no failure).
// alang owns the type system (HM inference), so emitted JS carries no type
// annotations — the checker runs before codegen and guarantees soundness.
// ts-pattern .exhaustive() forces a case for every Expr kind here: add an AST
// node and forget it → TS compile error in the compiler, not a silent gap.
import { match } from "ts-pattern";
import type { Expr, LamParam, MatchArm, Pattern, Program, Stmt } from "./ast";

const genExpr = (e: Expr): string =>
  match(e)
    .with({ kind: "num" }, (n) => String(n.value))
    .with({ kind: "ref" }, (r) => r.name)
    .with({ kind: "call" }, (c) => `${genCallee(c.fn)}(${c.args.map(genExpr).join(", ")})`)
    .with(
      { kind: "lambda" },
      (l) => `(${l.params.map(genParam).join(", ")}) => ${genLambdaBody(l.body)}`,
    )
    // desugar inline: a |> f  →  f(a)
    .with({ kind: "pipe" }, (p) => `${genCallee(p.right)}(${genExpr(p.left)})`)
    .with({ kind: "match" }, genMatch)
    .with({ kind: "record" }, (r) =>
      r.fields.length === 0
        ? "{}"
        : `{ ${r.fields.map((f) => `${f.name}: ${genExpr(f.value)}`).join(", ")} }`,
    )
    .with({ kind: "field" }, (f) => `${genMember(f.target)}.${f.name}`)
    .exhaustive();

// A lambda parameter lowers to JS: a name, or native object destructuring.
const genParam = (p: LamParam): string =>
  p.kind === "name" ? p.name : `{ ${p.fields.join(", ")} }`;

// A lambda in callee position must be parenthesized: `((x) => ...)(arg)`.
const genCallee = (e: Expr): string => (e.kind === "lambda" ? `(${genExpr(e)})` : genExpr(e));

// A record or lambda in member-target position needs parens: `({...}).x`.
const genMember = (e: Expr): string =>
  e.kind === "record" || e.kind === "lambda" ? `(${genExpr(e)})` : genExpr(e);

// A record literal as a concise arrow body must be parenthesized, else JS
// parses `=> { ... }` as a statement block: `=> ({ x: 1 })`.
const genLambdaBody = (e: Expr): string => (e.kind === "record" ? `(${genExpr(e)})` : genExpr(e));

// ---- match → ts-pattern chain --------------------------------------------

const genMatch = (m: Extract<Expr, { kind: "match" }>): string => {
  const parts = [`match(${genExpr(m.scrutinee)})`];
  let catchAll: MatchArm | undefined;
  for (const arm of m.arms) {
    if (arm.pattern.kind === "pwild" || arm.pattern.kind === "pbind") {
      catchAll ??= arm;
      continue;
    }
    parts.push(`  ${genWithArm(arm.pattern, arm.body)}`);
  }
  if (catchAll) {
    const p = catchAll.pattern;
    const param = p.kind === "pbind" ? `(${p.name})` : "()";
    parts.push(`  .otherwise(${param} => ${genExpr(catchAll.body)})`);
  } else {
    parts.push("  .exhaustive()");
  }
  return parts.join("\n");
};

const genWithArm = (
  p: Extract<Pattern, { kind: "pctor" }> | Extract<Pattern, { kind: "plit" }>,
  body: Expr,
): string => {
  if (p.kind === "plit") return `.with(${p.value}, () => ${genExpr(body)})`;

  const binds: string[] = []; // "_0: r"
  const litFields: string[] = []; // "_0: 5" — narrows further
  p.args.forEach((a, i) => {
    if (a.kind === "pbind") binds.push(`_${i}: ${a.name}`);
    else if (a.kind === "plit") litFields.push(`_${i}: ${a.value}`);
    // pwild → don't bind; nested pctor is v2
  });
  const patObj = [`tag: ${JSON.stringify(p.ctor)}`, ...litFields].join(", ");
  const param = binds.length ? `({ ${binds.join(", ")} })` : "()";
  return `.with({ ${patObj} }, ${param} => ${genExpr(body)})`;
};

// ---- statements -----------------------------------------------------------

// A variant decl has no runtime type in JS — it lowers to constructor
// factories only. Nullary → a tagged value; n-ary → a tagging function.
const genType = (s: Extract<Stmt, { kind: "type" }>): string =>
  s.ctors
    .map((c) => {
      const tag = JSON.stringify(c.name);
      if (c.argTypes.length === 0) return `const ${c.name} = { tag: ${tag} };`;
      const params = c.argTypes.map((_, i) => `_${i}`).join(", ");
      return `const ${c.name} = (${params}) => ({ tag: ${tag}, ${params} });`;
    })
    .join("\n");

const genStmt = (s: Stmt): string =>
  s.kind === "type" ? genType(s) : `const ${s.name} = ${genExpr(s.value)};`;

const hasMatch = (e: Expr): boolean =>
  match(e)
    .with({ kind: "num" }, { kind: "ref" }, () => false)
    .with({ kind: "call" }, (c) => hasMatch(c.fn) || c.args.some(hasMatch))
    .with({ kind: "lambda" }, (l) => hasMatch(l.body))
    .with({ kind: "pipe" }, (p) => hasMatch(p.left) || hasMatch(p.right))
    .with({ kind: "match" }, () => true)
    .with({ kind: "record" }, (r) => r.fields.some((f) => hasMatch(f.value)))
    .with({ kind: "field" }, (f) => hasMatch(f.target))
    .exhaustive();

export const codegen = (prog: Program): string => {
  const needsMatch = prog.stmts.some((s) => s.kind === "let" && hasMatch(s.value));
  const header = needsMatch ? `import { match } from "ts-pattern";\n\n` : "";
  const body = prog.stmts.map(genStmt).join("\n");
  return `${header}${body}\n`;
};
