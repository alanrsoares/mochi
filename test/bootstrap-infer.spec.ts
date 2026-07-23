// Slice E2 — self-hosted inference. bootstrap/infer.al is compiled by the TS
// compiler, evaluated, and fed the bootstrap parser's AST; its inferred
// scheme for every top-level name declared in a file (alpha-normalized var
// ids) must match the TS inferrer's on every .al file in the repo —
// including infer.al itself. Corpus runs `open: true` (unresolved refs —
// e.g. cross-file imports this standalone port doesn't resolve — become
// opaque fresh vars rather than errors, per infer.al's design note #6);
// strict-mode (`open: false`) error parity gets its own targeted cases.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import type { Program } from "../src/ast";
import { inferProgram } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeEnv, preludeNamespaces } from "../src/prelude";
import type { Row, Type } from "../src/types";
import { showType } from "../src/types";
import { bootstrapModuleJs } from "./support/bootstrap";

const root = join(import.meta.dir, "..");

const compileAl = bootstrapModuleJs;

// The strict prologue matters: JSC does proper tail calls only in strict mode
// (ADR 0014) — infer.al's env/subst threading recurses once per binding/arm.
const evalAlNames = <T extends Record<string, unknown>>(js: string, names: string[]): T =>
  new Function("match", `"use strict";\n${js}\nreturn { ${names.join(", ")} };`)(match) as T;

type AlErr = { message: string; start: number; end: number };
type AlResult = { _tag: "Ok"; value: unknown } | { _tag: "Err"; error: AlErr };

const alLex = evalAlNames<{ lex: (src: string) => AlResult }>(compileAl("bootstrap/lexer.al"), [
  "lex",
]).lex;
const alParse = evalAlNames<{ parse: (toks: unknown) => AlResult }>(
  compileAl("bootstrap/parser.al"),
  ["parse"],
).parse;

type AlInfer = {
  inferProgram: (
    stmts: unknown,
    builtins: Map<string, unknown>,
    namespaces: Map<string, Map<string, unknown>>,
    openMode: boolean,
  ) => AlResult;
  tVar: (id: number) => unknown;
  tCon: (name: string, args: unknown[]) => unknown;
  tArrow: (from: unknown, to: unknown) => unknown;
  tRecord: (row: unknown) => unknown;
  rVar: (id: number) => unknown;
  rExtend: (label: string, fieldType: unknown, rest: unknown) => unknown;
  RowEmpty: unknown;
  showType: (t: unknown) => string;
};

const alInfer = evalAlNames<AlInfer>(compileAl("bootstrap/infer.al"), [
  "inferProgram",
  "tVar",
  "tCon",
  "tArrow",
  "tRecord",
  "rVar",
  "rExtend",
  "RowEmpty",
  "showType",
]);

// ---- TS Type/Row -> mochi Ty/Row runtime value, via the compiled module's
// own constructors — so the SAME preludeEnv/preludeNamespaces data seeds
// both inferrers (locked design decision #3: the prelude is not forked). ----

const tsTypeToAl = (t: Type): unknown => {
  switch (t.kind) {
    case "var":
      return alInfer.tVar(t.id);
    case "con":
      return alInfer.tCon(
        t.name,
        t.args.map((a) => tsTypeToAl(a)),
      );
    case "arrow":
      return alInfer.tArrow(tsTypeToAl(t.from), tsTypeToAl(t.to));
    case "record":
      return alInfer.tRecord(tsRowToAl(t.row));
  }
};

const tsRowToAl = (r: Row): unknown => {
  switch (r.kind) {
    case "empty":
      return alInfer.RowEmpty;
    case "rvar":
      return alInfer.rVar(r.id);
    case "extend":
      return alInfer.rExtend(r.label, tsTypeToAl(r.type), tsRowToAl(r.rest));
  }
};

const alBuiltins = new Map(Object.entries(preludeEnv).map(([name, t]) => [name, tsTypeToAl(t)]));
const alNamespaces = new Map(
  Object.entries(preludeNamespaces).map(([ns, members]) => [
    ns,
    new Map(Object.entries(members).map(([name, t]) => [name, tsTypeToAl(t)])),
  ]),
);

// ---- alpha-normalize var ids so two independent fresh-var counters can be
// compared: each scheme string gets its own 't3'/'r7' -> 't0'/'r0' renaming,
// in order of first appearance (locked design decision #5). ----

const normalize = (s: string): string => {
  const seen = new Map<string, number>();
  let counter = 0;
  return s.replace(/'([tr])(\d+)/g, (_m, kind: string, id: string) => {
    const key = kind + id;
    if (!seen.has(key)) seen.set(key, counter++);
    return `'${kind}${seen.get(key)}`;
  });
};

// ---- one canonical verdict shape for both inferrers -----------------------

type Verdict =
  | { ok: true; schemes: Record<string, string> }
  | { ok: false; start: number; end: number };

// Names a file itself declares (ctors/lets/externs) — the subset of the
// (much larger, prelude-seeded) env worth comparing per file. Both sides
// parse the same source independently; parser parity ([slice D]) already
// guarantees they agree on this list, so the TS AST is the one source of
// truth for which names to look up in either env.
const declaredNames = (prog: Program): string[] => {
  const names: string[] = [];
  for (const s of prog.stmts) {
    if (s.kind === "let") names.push(s.name);
    else if (s.kind === "type") for (const c of s.ctors) names.push(c.name);
    else if (s.kind === "extern") names.push(s.name);
  }
  return names;
};

const tsInferVerdict = (src: string): Verdict => {
  const prog = unwrapOk(parse(unwrapOk(lex(src))));
  const r = inferProgram(prog, preludeEnv, { open: true, namespaces: preludeNamespaces });
  if (isErr(r)) {
    if (r.error.span === undefined)
      throw new Error(`TS infer error without a span: ${r.error.message}`);
    return { ok: false, start: r.error.span.start, end: r.error.span.end };
  }
  const env = r.value;
  const schemes: Record<string, string> = {};
  for (const name of declaredNames(prog)) {
    const sc = env.get(name);
    if (!sc) throw new Error(`TS env missing declared name '${name}'`);
    schemes[name] = normalize(showType(sc.type));
  }
  return { ok: true, schemes };
};

const alInferVerdict = (src: string, prog: Program): Verdict => {
  const lr = alLex(src);
  if (lr._tag !== "Ok") throw new Error(`mochi lexer errored: ${lr.error.message}`);
  const pr = alParse(lr.value);
  if (pr._tag !== "Ok") throw new Error(`mochi parser errored: ${pr.error.message}`);
  const ir = alInfer.inferProgram(pr.value, alBuiltins, alNamespaces, true);
  if (ir._tag !== "Ok") return { ok: false, start: ir.error.start, end: ir.error.end };
  const env = ir.value as Map<string, { vars: number[]; rvars: number[]; ty: unknown }>;
  const schemes: Record<string, string> = {};
  for (const name of declaredNames(prog)) {
    const sc = env.get(name);
    if (!sc) throw new Error(`mochi env missing declared name '${name}'`);
    schemes[name] = normalize(alInfer.showType(sc.ty));
  }
  return { ok: true, schemes };
};

// ---- the corpus: every .al file in the repo --------------------------------

const corpus = [...new Bun.Glob("**/*.al").scanSync({ cwd: root })]
  .filter((p) => !p.includes("node_modules"))
  .sort();

test("corpus includes the bootstrap inferrer itself", () => {
  expect(corpus).toContain("bootstrap/infer.al");
});

for (const file of corpus) {
  test(`infer verdicts agree on ${file}`, () => {
    const src = readFileSync(join(root, file), "utf8");
    const prog = unwrapOk(parse(unwrapOk(lex(src))));
    expect(alInferVerdict(src, prog)).toEqual(tsInferVerdict(src));
  });
}

// ---- targeted cases: strict-mode (open: false) error parity ---------------

const strictTsVerdict = (src: string): Verdict => {
  const prog = unwrapOk(parse(unwrapOk(lex(src))));
  const r = inferProgram(prog, preludeEnv, { open: false });
  if (isErr(r)) {
    if (r.error.span === undefined)
      throw new Error(`TS infer error without a span: ${r.error.message}`);
    return { ok: false, start: r.error.span.start, end: r.error.span.end };
  }
  return { ok: true, schemes: {} };
};

const strictAlVerdict = (src: string): Verdict => {
  const lr = alLex(src);
  if (lr._tag !== "Ok") throw new Error(`mochi lexer errored: ${lr.error.message}`);
  const pr = alParse(lr.value);
  if (pr._tag !== "Ok") throw new Error(`mochi parser errored: ${pr.error.message}`);
  const ir = alInfer.inferProgram(pr.value, alBuiltins, new Map(), false);
  if (ir._tag !== "Ok") return { ok: false, start: ir.error.start, end: ir.error.end };
  return { ok: true, schemes: {} };
};

const cases: Record<string, { src: string; ok: boolean }> = {
  "unbound variable, strict mode": { src: "let f = x => plusOne(x)", ok: false },
  "self-reference is bound, not unbound": { src: "let f = x => f(x)", ok: true },
  "occurs check": { src: "let f = x => f", ok: false },
  "unify mismatch on literal": { src: "let f = x => add(x, true)", ok: false },
  "record field access, open row": { src: "let getX = p => p.x", ok: true },
  "mutual recursion": {
    src: "let isEven = n => n |> eq(0) ? true : isOdd(n)\nlet isOdd = n => n |> eq(0) ? false : isEven(n)",
    ok: true,
  },
  "tuple binding sugar": { src: "let f = ((a, b)) => add(a, b)", ok: true },
  "let? monadic bind": {
    src: 'extern parseNum : string -> Result number string = "m" "p"\nlet f = s => let? n = parseNum(s) in Ok(add(n, 1))',
    ok: true,
  },
  // ADR 0021 — record update is update-only: base type returned, wrong-typed
  // or base-absent fields rejected.
  "record update: base type returned": {
    src: "let base = { x: 1, y: 2 }\nlet r = { ...base, x: 3 }",
    ok: true,
  },
  "record update: wrong-typed field rejected": {
    src: 'let base = { x: 1, y: 2 }\nlet r = { ...base, x: "s" }',
    ok: false,
  },
  "record update: field absent from closed base rejected": {
    src: "let base = { x: 1 }\nlet r = { ...base, y: 2 }",
    ok: false,
  },
};

for (const [name, { src, ok }] of Object.entries(cases)) {
  test(`infer parity: ${name}`, () => {
    const ts = strictTsVerdict(src);
    expect(ts.ok).toBe(ok);
    const al = strictAlVerdict(src);
    expect(al.ok).toBe(ts.ok);
    if (!ts.ok && !al.ok) {
      expect({ start: al.start, end: al.end }).toEqual({ start: ts.start, end: ts.end });
    }
  });
}
