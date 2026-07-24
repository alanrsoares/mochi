// Slice E1 — self-hosted checker. bootstrap/check.mochi is compiled by the TS
// compiler, evaluated, and fed the bootstrap parser's AST; its verdict (ok, or
// the first check error's message + span) must match the TS checker's on every
// .mochi file in the repo — including check.mochi itself.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { match } from "@onrails/pattern";
import { isOk, unwrapErr, unwrapOk } from "@onrails/result";
import { check } from "../src/check";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { bootstrapModuleJs } from "./support/bootstrap";

const root = join(import.meta.dir, "..");

const compileAl = bootstrapModuleJs;

// The strict prologue matters: JSC does proper tail calls only in strict mode,
// and the checker's index loops recurse once per element (ADR 0014).
const evalAl = (js: string, name: string): ((x: never) => AlResult) =>
  new Function("match", `"use strict";\n${js}\nreturn ${name};`)(match);

type AlErr = { message: string; start: number; end: number };
type AlResult = { _tag: "Ok"; value: unknown } | { _tag: "Err"; error: AlErr };

const alLex = evalAl(compileAl("bootstrap/lexer.mochi"), "lex") as (src: string) => AlResult;
const alParse = evalAl(compileAl("bootstrap/parser.mochi"), "parse") as (toks: unknown) => AlResult;
const alCheck = evalAl(compileAl("bootstrap/check.mochi"), "check") as (stmts: unknown) => AlResult;

// ---- one canonical verdict shape for both checkers -------------------------------

type Verdict = { ok: true } | { ok: false; message: string; start: number; end: number };

const tsVerdict = (src: string): Verdict => {
  const r = check(unwrapOk(parse(unwrapOk(lex(src)))));
  if (isOk(r)) return { ok: true };
  const e = unwrapErr(r)[0]!;
  if (e.span === undefined) throw new Error("TS check error without a span");
  return { ok: false, message: e.message, start: e.span.start, end: e.span.end };
};

const alVerdict = (src: string): Verdict => {
  const lr = alLex(src);
  if (lr._tag !== "Ok") throw new Error(`mochi lexer errored: ${lr.error.message}`);
  const pr = alParse(lr.value);
  if (pr._tag !== "Ok") throw new Error(`mochi parser errored: ${pr.error.message}`);
  const cr = alCheck(pr.value);
  return cr._tag === "Ok"
    ? { ok: true }
    : { ok: false, message: cr.error.message, start: cr.error.start, end: cr.error.end };
};

// ---- the corpus: every .mochi file in the repo -------------------------------------

const corpus = [...new Bun.Glob("**/*.mochi").scanSync({ cwd: root })]
  .filter((p) => !p.includes("node_modules"))
  .sort();

test("corpus includes the bootstrap checker itself", () => {
  expect(corpus).toContain("bootstrap/check.mochi");
});

for (const file of corpus) {
  test(`check verdicts agree on ${file}`, () => {
    const src = readFileSync(join(root, file), "utf8");
    expect(alVerdict(src)).toEqual(tsVerdict(src));
  });
}

// ---- targeted cases (ok: the verdict BOTH checkers must reach) --------------------

const cases: Record<string, { src: string; ok: boolean }> = {
  "exhaustive variant switch": {
    src: "type C = | R | G\nlet f = c => switch c { | R => 1 | G => 2 }",
    ok: true,
  },
  "missing ctor": {
    src: "type C = | R | G | B\nlet f = c => switch c { | R => 1 }",
    ok: false,
  },
  "narrowing arm hint": {
    src: "type P = | Sm(value: number) | Nn\nlet f = p => switch p { | Sm(0) => 1 | Nn => 2 }",
    ok: false,
  },
  "nested narrowing hint": {
    src: "type P = | Sm(value: P) | Nn\nlet f = p => switch p { | Sm(Sm(n)) => 1 | Nn => 2 }",
    ok: false,
  },
  "catch-all covers the rest": {
    src: "type C = | R | G | B\nlet f = c => switch c { | R => 1 | _ => 0 }",
    ok: true,
  },
  "duplicate type": { src: "type T = | A\ntype T = | B", ok: false },
  "duplicate constructor": { src: "type T = | A\ntype U = | A", ok: false },
  "unknown constructor": {
    src: "let f = x => switch x { | Zz(n) => n | _ => 0 }",
    ok: false,
  },
  "wrong arity on builtin Some": {
    src: "let f = x => switch x { | Some(a, b) => a | _ => 0 }",
    ok: false,
  },
  "mixed variants": {
    src: "type A = | A1 | A2\ntype B = | B1\nlet f = x => switch x { | A1 => 1 | B1 => 2 | A2 => 3 }",
    ok: false,
  },
  "bool switch, both cases": {
    src: "let f = b => switch b { | true => 1 | false => 0 }",
    ok: true,
  },
  "bool switch, one case": { src: "let f = b => switch b { | true => 1 }", ok: false },
  "array switch, empty + cons": {
    src: "let f = xs => switch xs { | [] => 0 | [x, ...r] => x }",
    ok: true,
  },
  "array switch, fixed-length only": {
    src: "let f = xs => switch xs { | [] => 0 | [a, b] => a }",
    ok: false,
  },
  "lazy list switch with a guard": {
    src: "let f = xs => switch xs { | @{h, ...t} when gt(h, 0) => h | @{} => 0 | _ => 1 }",
    ok: false,
  },
  "guarded catch-all does not count": {
    src: "let f = x => switch x { | _ when true => 1 }",
    ok: false,
  },
  "unreachable arm after catch-all": {
    src: "let f = x => switch x { | _ => 1 | 0 => 2 }",
    ok: false,
  },
  "nested lazy-List pattern rejected": {
    src: "let f = x => switch x { | Some(@{h, ...t}) => h | _ => 0 }",
    ok: false,
  },
  "top-level lazy list with nested ctor elems": {
    src: "let f = xs => switch xs { | @{Some(x), ...t} => x | @{} => 0 | _ => 1 }",
    ok: true,
  },
  "builtin Option covered": {
    src: "let f = o => switch o { | Some(x) => x | None => 0 }",
    ok: true,
  },
  "builtin Option missing None": {
    src: "let f = o => switch o { | Some(x) => x }",
    ok: false,
  },
  "reserved name as let": { src: "let Str = 1", ok: false },
  "reserved name as type": { src: "type List = | L", ok: false },
  "reserved name as extern": { src: 'extern Map : a -> a = "m" "x"', ok: false },
  "reserved name in import": { src: 'import { Set } from "./m"', ok: false },
  "Option redeclaration wins": {
    src: "type Option a = | Some(value: a) | None\nlet f = o => switch o { | Some(x) => x | None => 0 }",
    ok: true,
  },
  "stray type var in ctor field": { src: "type T a = | K(a, q)", ok: false },
  "record alias registers no ctors": {
    src: "type Point = { x: number, y: number }\nlet f = p => switch p { | { x, y } => x }",
    ok: true,
  },
  "match nested in scrutinee reported first": {
    src: "type C = | R | G\nlet f = c => switch (switch c { | R => 1 }) { | 1 => 1 | _ => 0 }",
    ok: false,
  },
  "guard body match checked": {
    src: "type C = | R | G\nlet f = c => switch c { | R => switch c { | R => 1 } | G => 2 }",
    ok: false,
  },
  // ADR 0021 — record update: checkExpr must fold into the spread expr, not
  // just the fields.
  "record update spread expr checked": {
    src: "type C = | R | G\nlet f = c => { ...{ x: switch c { | R => 1 } }, y: 2 }",
    ok: false,
  },
  // ADR 0022 — or-patterns: coverage flattening + consistent-binds.
  "or-pattern: alts flatten to cover every ctor": {
    src: "type C = | R | G | B\nlet f = c => switch c { | R | G => 1 | B => 2 }",
    ok: true,
  },
  "or-pattern: alts leave a ctor uncovered": {
    src: "type C = | R | G | B\nlet f = c => switch c { | R | G => 1 }",
    ok: false,
  },
  "or-pattern: catch-all alt rejected": {
    src: "type C = | R | G\nlet f = c => switch c { | R | _ => 1 | G => 2 }",
    ok: false,
  },
  "or-pattern: array pattern alt rejected": {
    src: "let f = xs => switch xs { | [] | [a, ...r] => 1 }",
    ok: false,
  },
  "or-pattern: consistent binds across alts": {
    src: "type P = | Sm(value: number) | Lg(value: number)\nlet f = p => switch p { | Sm(v) | Lg(v) => v }",
    ok: true,
  },
  "or-pattern: differing bound names rejected": {
    src: "type P = | Sm(value: number) | Lg(value: number)\nlet f = p => switch p { | Sm(v) | Lg(w) => v | _ => 0 }",
    ok: false,
  },
  "or-pattern: same name at a differing position rejected": {
    src: "type T = | Pair(a: number, b: number)\nlet f = t => switch t { | Pair(x, _) | Pair(_, x) => x | _ => 0 }",
    ok: false,
  },
  "or-pattern: name bound twice within one alt rejected": {
    src: "type T = | Pair(a: number, b: number)\nlet f = t => switch t { | Pair(x, x) | Pair(x, _) => x | _ => 0 }",
    ok: false,
  },
};

for (const [name, { src, ok }] of Object.entries(cases)) {
  test(`check parity: ${name}`, () => {
    const ts = tsVerdict(src);
    expect(ts.ok).toBe(ok);
    expect(alVerdict(src)).toEqual(ts);
  });
}
