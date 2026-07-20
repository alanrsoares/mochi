// Codegen — AST → JavaScript source. Pure (no failure).
// alang owns the type system (HM inference), so emitted JS carries no type
// annotations — the checker runs before codegen and guarantees soundness.
// ts-pattern .exhaustive() forces a case for every Expr kind here: add an AST
// node and forget it → TS compile error in the compiler, not a silent gap.
import { match } from "ts-pattern";
import type { CtorField, Expr, LamParam, MatchArm, Pattern, Program, Stmt } from "./ast";
import { preludeJsDefs } from "./prelude";

// A constructor's runtime field keys: a labelled field uses its label, an
// unlabelled one its position (`_0`, `_1`). Both the factory (`genType`) and the
// pattern destructure (`genWithArm`) must agree, so patterns consult this
// registry — populated per `codegen` call from the program's `type` decls.
const keysOf = (fields: CtorField[]): string[] => fields.map((f, i) => f.name ?? `_${i}`);
let ctorKeys = new Map<string, string[]>();

// The field keys of a module's EXPORTED ctors — threaded into an importer's
// `codegen` so a pattern on an imported variant destructures the right runtime
// keys (`Some(value: a)` → `{ value }`, not the positional `{ _0 }`).
export const exportedCtorKeys = (prog: Program): Map<string, string[]> => {
  const m = new Map<string, string[]>();
  for (const s of prog.stmts)
    if (s.kind === "type" && s.exported) for (const c of s.ctors) m.set(c.name, keysOf(c.fields));
  return m;
};

const genExpr = (e: Expr): string =>
  match(e)
    .with({ kind: "num" }, (n) => n.raw)
    .with({ kind: "bool" }, (b) => String(b.value))
    .with({ kind: "str" }, (s) => JSON.stringify(s.value))
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
    .with({ kind: "list" }, (l) => `[${l.elements.map(genExpr).join(", ")}]`)
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

// ---- match → @onrails/pattern chain --------------------------------------
// Emitted `switch` lowers to a match().with().exhaustive() chain. We target
// @onrails/pattern (ts-pattern-shaped, smaller runtime, pairs with
// @onrails/result + @onrails/maybe). Each arm is a single pattern, which is the
// common subset both libraries share.

// A pattern always matches (→ `.otherwise`) when it binds without narrowing: a
// wildcard, a plain name, or a record whose every field just binds.
const isCatchAll = (p: Pattern): boolean =>
  p.kind === "pwild" ||
  p.kind === "pbind" ||
  (p.kind === "precord" && p.fields.every((f) => isCatchAll(f.pat)));

// The handler parameter for a catch-all pattern: bind the name, destructure a
// record's fields, or ignore the value.
const catchAllParam = (p: Pattern): string => {
  if (p.kind === "pbind") return `(${p.name})`;
  if (p.kind === "precord") return `({ ${recordBinds(p).join(", ")} })`;
  return "()";
};

const genMatch = (m: Extract<Expr, { kind: "match" }>): string => {
  const parts = [`match(${genExpr(m.scrutinee)})`];
  let catchAll: MatchArm | undefined;
  for (const arm of m.arms) {
    if (isCatchAll(arm.pattern)) {
      catchAll ??= arm;
      continue;
    }
    parts.push(`  ${genWithArm(arm.pattern as NarrowingPattern, arm.body)}`);
  }
  if (catchAll) {
    parts.push(`  .otherwise(${catchAllParam(catchAll.pattern)} => ${genExpr(catchAll.body)})`);
  } else {
    parts.push("  .exhaustive()");
  }
  return parts.join("\n");
};

// Destructuring binds from a record pattern's fields: `{ x }` → `x`, a rename
// `{ x: y }` → `x: y`. Non-binding sub-patterns (literals, `_`) contribute none.
const recordBinds = (p: Extract<Pattern, { kind: "precord" }>): string[] =>
  p.fields.flatMap((f) =>
    f.pat.kind === "pbind" ? [f.pat.name === f.label ? f.label : `${f.label}: ${f.pat.name}`] : [],
  );

// A literal pattern rendered as a JS value for the matcher object / `.with`.
const litValue = (p: Extract<Pattern, { kind: "plit" | "pbool" | "pstr" }>): string =>
  p.kind === "pstr" ? JSON.stringify(p.value) : p.kind === "plit" ? p.raw : String(p.value);

// Patterns that narrow (everything a catch-all is not) — routed to `.with(...)`.
type NarrowingPattern = Extract<Pattern, { kind: "pctor" | "plit" | "pbool" | "pstr" | "precord" }>;

const genWithArm = (p: NarrowingPattern, body: Expr): string => {
  if (p.kind === "plit" || p.kind === "pbool" || p.kind === "pstr")
    return `.with(${litValue(p)}, () => ${genExpr(body)})`;

  if (p.kind === "precord") {
    // At least one literal field narrows (else it's a catch-all); those form the
    // matcher object, binding fields destructure in the handler.
    const lits = p.fields.flatMap((f) =>
      f.pat.kind === "plit" || f.pat.kind === "pbool" || f.pat.kind === "pstr"
        ? [`${f.label}: ${litValue(f.pat)}`]
        : [],
    );
    const bind = recordBinds(p);
    const param = bind.length ? `({ ${bind.join(", ")} })` : "()";
    return `.with({ ${lits.join(", ")} }, ${param} => ${genExpr(body)})`;
  }

  const binds: string[] = []; // "value: r" (or "_0: r" positionally)
  const litFields: string[] = []; // "value: 5" — narrows further
  const keys = ctorKeys.get(p.ctor);
  p.args.forEach((a, i) => {
    const key = keys?.[i] ?? `_${i}`;
    if (a.kind === "pbind") binds.push(key === a.name ? key : `${key}: ${a.name}`);
    else if (a.kind === "plit") litFields.push(`${key}: ${a.raw}`);
    // pwild → don't bind; nested pctor is v2
  });
  const patObj = [`_tag: ${JSON.stringify(p.ctor)}`, ...litFields].join(", ");
  const param = binds.length ? `({ ${binds.join(", ")} })` : "()";
  return `.with({ ${patObj} }, ${param} => ${genExpr(body)})`;
};

// ---- statements -----------------------------------------------------------

// A variant decl has no runtime type in JS — it lowers to constructor
// factories only. Nullary → a tagged value; n-ary → a tagging function. The
// discriminant key is `_tag`, matching the @onrails ecosystem convention
// (@onrails/result, @onrails/maybe), so their type guards (isOk/isSome/...)
// recognize alang values at the JS boundary.
const genType = (s: Extract<Stmt, { kind: "type" }>): string =>
  s.ctors
    .map((c) => {
      const tag = JSON.stringify(c.name);
      if (c.fields.length === 0) return `const ${c.name} = { _tag: ${tag} };`;
      const params = keysOf(c.fields).join(", ");
      return `const ${c.name} = (${params}) => ({ _tag: ${tag}, ${params} });`;
    })
    .join("\n");

// extern → an ESM import binding the external export to the alang name.
const genExtern = (s: Extract<Stmt, { kind: "extern" }>): string => {
  const spec = s.imported === s.name ? s.name : `${s.imported} as ${s.name}`;
  return `import { ${spec} } from ${JSON.stringify(s.module)};`;
};

// import { a, b } from "./mod"  → the compiled sibling `./mod.js`. Source paths
// name the `.al` module (with or without extension); output targets `.js`.
const genImport = (s: Extract<Stmt, { kind: "import" }>): string => {
  const names = s.names.map((n) => n.name).join(", ");
  const path = `${s.from.replace(/\.al$/, "")}.js`;
  return `import { ${names} } from ${JSON.stringify(path)};`;
};

const genStmt = (s: Stmt): string => {
  if (s.kind === "import") return genImport(s);
  if (s.kind === "type") {
    const decls = genType(s);
    return s.exported
      ? decls
          .split("\n")
          .map((l) => `export ${l}`)
          .join("\n")
      : decls;
  }
  if (s.kind === "extern") {
    // An extern is itself an import; re-export the local binding when exported.
    return s.exported ? `${genExtern(s)}\nexport { ${s.name} };` : genExtern(s);
  }
  const doExport = s.exported && !s.name.startsWith("$"); // never export destructure temps
  return `${doExport ? "export " : ""}const ${s.name} = ${genExpr(s.value)};`;
};

const hasMatch = (e: Expr): boolean =>
  match(e)
    .with({ kind: "num" }, { kind: "bool" }, { kind: "str" }, { kind: "ref" }, () => false)
    .with({ kind: "call" }, (c) => hasMatch(c.fn) || c.args.some(hasMatch))
    .with({ kind: "lambda" }, (l) => hasMatch(l.body))
    .with({ kind: "pipe" }, (p) => hasMatch(p.left) || hasMatch(p.right))
    .with({ kind: "match" }, () => true)
    .with({ kind: "record" }, (r) => r.fields.some((f) => hasMatch(f.value)))
    .with({ kind: "field" }, (f) => hasMatch(f.target))
    .with({ kind: "list" }, (l) => l.elements.some(hasMatch))
    .exhaustive();

// Every name referenced anywhere in an expression. Coarse — it counts locally
// shadowed uses too — but only ever consulted for prelude names, which are never
// worth shadowing, so the over-count is harmless.
const exprRefs = (e: Expr, acc: Set<string>): void => {
  match(e)
    .with({ kind: "num" }, { kind: "bool" }, { kind: "str" }, () => {})
    .with({ kind: "ref" }, (r) => acc.add(r.name))
    .with({ kind: "call" }, (c) => {
      exprRefs(c.fn, acc);
      for (const a of c.args) exprRefs(a, acc);
    })
    .with({ kind: "lambda" }, (l) => exprRefs(l.body, acc))
    .with({ kind: "pipe" }, (p) => {
      exprRefs(p.left, acc);
      exprRefs(p.right, acc);
    })
    .with({ kind: "match" }, (m) => {
      exprRefs(m.scrutinee, acc);
      for (const arm of m.arms) exprRefs(arm.body, acc);
    })
    .with({ kind: "record" }, (r) => {
      for (const f of r.fields) exprRefs(f.value, acc);
    })
    .with({ kind: "field" }, (f) => exprRefs(f.target, acc))
    .with({ kind: "list" }, (l) => {
      for (const el of l.elements) exprRefs(el, acc);
    })
    .exhaustive();
};

// The names a program binds at module scope — anything that would shadow a
// prelude builtin, so its runtime def must NOT be inlined (else a duplicate
// `const` and a JS SyntaxError, e.g. a user `let hypot = …`).
const boundNames = (prog: Program): Set<string> => {
  const bound = new Set<string>();
  for (const s of prog.stmts) {
    if (s.kind === "let" || s.kind === "extern") bound.add(s.name);
    else if (s.kind === "type") for (const c of s.ctors) bound.add(c.name);
    else if (s.kind === "import") for (const n of s.names) bound.add(n.name);
  }
  return bound;
};

// The prelude runtime a program needs inlined: every builtin it references and
// does not itself define, emitted in prelude declaration order for determinism.
const preludePreamble = (prog: Program): string => {
  const refs = new Set<string>();
  for (const s of prog.stmts) if (s.kind === "let") exprRefs(s.value, refs);
  const bound = boundNames(prog);
  const defs = Object.entries(preludeJsDefs)
    .filter(([name]) => refs.has(name) && !bound.has(name))
    .map(([, def]) => def);
  return defs.length ? `${defs.join("\n")}\n\n` : "";
};

// `runtime`: inline the prelude builtins the program uses, so the emitted module
// runs standalone. Off by default — callers that supply their own prelude (tests
// via `new Function(preludeJs, …)`) keep prelude-free output.
export type CodegenOptions = { runtime?: boolean };

export const codegen = (
  prog: Program,
  imported?: Map<string, string[]>,
  opts: CodegenOptions = {},
): string => {
  ctorKeys = new Map(imported ?? []);
  for (const s of prog.stmts)
    if (s.kind === "type") for (const c of s.ctors) ctorKeys.set(c.name, keysOf(c.fields));
  const needsMatch = prog.stmts.some((s) => s.kind === "let" && hasMatch(s.value));
  const header = needsMatch ? `import { match } from "@onrails/pattern";\n\n` : "";
  const preamble = opts.runtime ? preludePreamble(prog) : "";
  const body = prog.stmts.map(genStmt).join("\n");
  return `${header}${preamble}${body}\n`;
};
