// Slice D — the self-hosted parser. bootstrap/parser.al is compiled by the TS
// compiler, evaluated, and fed the bootstrap lexer's tokens; its AST must match
// the TS parser's on every .al file in the repo (including parser.al itself).
// Both ASTs map into one canonical JSON shape before the diff.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { match } from "@onrails/pattern";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import type {
  AliasField,
  Ctor,
  Expr,
  LamParam,
  MatchArm,
  Pattern,
  Stmt,
  TypeExpr,
} from "../src/ast";
import { compile } from "../src/compile";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import type { Span } from "../src/span";

const root = join(import.meta.dir, "..");

const compileAl = (path: string): string =>
  unwrapOk(compile(readFileSync(join(root, path), "utf8")))
    .replace(/^import .*$/m, "")
    .replace(/^export /gm, "");

// The strict prologue matters: JSC does proper tail calls only in strict mode,
// and both the lexer's and the parser's loops recurse once per token (ADR 0014).
const evalAl = (js: string, name: string): ((x: never) => AlResult) =>
  new Function("match", `"use strict";\n${js}\nreturn ${name};`)(match);

type AlErr = { message: string; start: number; end: number };
type AlResult = { _tag: "Ok"; value: unknown } | { _tag: "Err"; error: AlErr };

const alLex = evalAl(compileAl("bootstrap/lexer.al"), "lex") as (src: string) => AlResult;
const alParse = evalAl(compileAl("bootstrap/parser.al"), "parse") as (toks: unknown) => AlResult;

// ---- canonical AST (both parsers map into this) --------------------------------

type Canon = Record<string, unknown>;

// -- TS side --

const cSpan = (s: Span): Canon => ({ start: s.start, end: s.end });

const cParam = (p: LamParam): Canon =>
  p.kind === "name"
    ? { kind: "name", name: p.name }
    : p.kind === "precord"
      ? { kind: "precord", fields: p.fields }
      : { kind: "ptuple", names: p.names };

const cArm = (a: MatchArm): Canon => ({
  pattern: cPat(a.pattern),
  guard: a.guard ? cExpr(a.guard) : null,
  body: cExpr(a.body),
});

const cExpr = (e: Expr): Canon => {
  switch (e.kind) {
    case "num":
      return { kind: "num", value: e.value, raw: e.raw, span: cSpan(e.span) };
    case "bool":
    case "str":
      return { kind: e.kind, value: e.value, span: cSpan(e.span) };
    case "ref":
      return { kind: "ref", name: e.name, span: cSpan(e.span) };
    case "call":
      return { kind: "call", fn: cExpr(e.fn), args: e.args.map(cExpr), span: cSpan(e.span) };
    case "lambda":
      return {
        kind: "lambda",
        params: e.params.map(cParam),
        body: cExpr(e.body),
        span: cSpan(e.span),
      };
    case "letin":
      return {
        kind: "letin",
        name: e.name,
        nameSpan: cSpan(e.nameSpan),
        value: cExpr(e.value),
        body: cExpr(e.body),
        span: cSpan(e.span),
      };
    case "letbind":
      return {
        kind: "letbind",
        param: cParam(e.param),
        paramSpan: cSpan(e.paramSpan),
        value: cExpr(e.value),
        body: cExpr(e.body),
        span: cSpan(e.span),
      };
    case "pipe":
      return { kind: "pipe", left: cExpr(e.left), right: cExpr(e.right), span: cSpan(e.span) };
    case "ternary":
      return {
        kind: "ternary",
        cond: cExpr(e.cond),
        // biome-ignore lint/suspicious/noThenProperty: mirrors the AST field; plain data, never awaited
        then: cExpr(e.then),
        else: cExpr(e.else),
        span: cSpan(e.span),
      };
    case "match":
      return {
        kind: "match",
        scrutinee: cExpr(e.scrutinee),
        arms: e.arms.map(cArm),
        span: cSpan(e.span),
      };
    case "record":
      return {
        kind: "record",
        fields: e.fields.map((f) => ({ name: f.name, value: cExpr(f.value) })),
        span: cSpan(e.span),
      };
    case "field":
      return { kind: "field", target: cExpr(e.target), name: e.name, span: cSpan(e.span) };
    case "tuple":
    case "arr":
    case "list":
      return { kind: e.kind, elements: e.elements.map(cExpr), span: cSpan(e.span) };
    case "map":
      return {
        kind: "map",
        entries: e.entries.map((en) => ({ key: cExpr(en.key), value: cExpr(en.value) })),
        span: cSpan(e.span),
      };
  }
};

const cPat = (p: Pattern): Canon => {
  switch (p.kind) {
    case "pwild":
      return { kind: "pwild", span: cSpan(p.span) };
    case "pbind":
      return { kind: "pbind", name: p.name, span: cSpan(p.span) };
    case "plit":
      return { kind: "plit", value: p.value, raw: p.raw, span: cSpan(p.span) };
    case "pbool":
    case "pstr":
      return { kind: p.kind, value: p.value, span: cSpan(p.span) };
    case "ptuple":
      return { kind: "ptuple", elems: p.elems.map(cPat), span: cSpan(p.span) };
    case "precord":
      return {
        kind: "precord",
        fields: p.fields.map((f) => ({ label: f.label, pat: cPat(f.pat) })),
        span: cSpan(p.span),
      };
    case "pctor":
      return { kind: "pctor", ctor: p.ctor, args: p.args.map(cPat), span: cSpan(p.span) };
    case "parr":
    case "plist":
      return {
        kind: p.kind,
        elems: p.elems.map(cPat),
        rest: p.rest ? cPat(p.rest) : null,
        span: cSpan(p.span),
      };
  }
};

const cTy = (t: TypeExpr): Canon => {
  switch (t.kind) {
    case "tname":
      return { kind: "tname", name: t.name, span: cSpan(t.span) };
    case "tarrow":
      return { kind: "tarrow", from: cTy(t.from), to: cTy(t.to), span: cSpan(t.span) };
    case "tapp":
      return { kind: "tapp", ctor: t.ctor, args: t.args.map(cTy), span: cSpan(t.span) };
    case "ttuple":
      return { kind: "ttuple", elems: t.elems.map(cTy), span: cSpan(t.span) };
    case "tlist":
      return { kind: "tlist", elem: cTy(t.elem), span: cSpan(t.span) };
  }
};

const cCtor = (c: Ctor): Canon => ({
  name: c.name,
  fields: c.fields.map((f) => ({ name: f.name, type: cTy(f.type) })),
});

const cAliasField = (f: AliasField): Canon => ({ name: f.name, type: cTy(f.type) });

const cStmt = (s: Stmt): Canon => {
  switch (s.kind) {
    case "let":
      return {
        kind: "let",
        name: s.name,
        nameSpan: cSpan(s.nameSpan),
        value: cExpr(s.value),
        exported: s.exported === true,
        doc: s.doc ?? null,
        span: cSpan(s.span),
      };
    case "type":
      return {
        kind: "type",
        name: s.name,
        params: s.params,
        ctors: s.ctors.map(cCtor),
        alias: s.alias ? s.alias.map(cAliasField) : null,
        exported: s.exported === true,
        span: cSpan(s.span),
      };
    case "extern":
      return {
        kind: "extern",
        name: s.name,
        nameSpan: cSpan(s.nameSpan),
        typeExpr: cTy(s.typeExpr),
        module: s.module,
        imported: s.imported,
        exported: s.exported === true,
        span: cSpan(s.span),
      };
    case "import":
      return {
        kind: "import",
        names: s.names.map((n) => ({ name: n.name, span: cSpan(n.span) })),
        from: s.from,
        span: cSpan(s.span),
      };
  }
};

// -- alang side: `_tag`-tagged runtime records, Options as Some/None --

// biome-ignore lint/suspicious/noExplicitAny: untyped alang runtime values
type Al = any;

const opt = <T>(o: Al, f: (v: Al) => T): T | null => (o._tag === "Some" ? f(o.value) : null);

const aParam = (p: Al): Canon => {
  if (p._tag === "LPName") return { kind: "name", name: p.name };
  if (p._tag === "LPRecord") return { kind: "precord", fields: p.fields };
  return { kind: "ptuple", names: p.names };
};

const aArm = (a: Al): Canon => ({
  pattern: aPat(a.pattern),
  guard: opt(a.guard, aExpr),
  body: aExpr(a.body),
});

const A_EXPR: Record<string, (e: Al) => Canon> = {
  ENum: (e) => ({ kind: "num", value: e.value, raw: e.raw, span: e.span }),
  EBool: (e) => ({ kind: "bool", value: e.value, span: e.span }),
  EStr: (e) => ({ kind: "str", value: e.value, span: e.span }),
  ERef: (e) => ({ kind: "ref", name: e.name, span: e.span }),
  ECall: (e) => ({ kind: "call", fn: aExpr(e.fn), args: e.args.map(aExpr), span: e.span }),
  ELambda: (e) => ({
    kind: "lambda",
    params: e.params.map(aParam),
    body: aExpr(e.body),
    span: e.span,
  }),
  ELetIn: (e) => ({
    kind: "letin",
    name: e.name,
    nameSpan: e.nameSpan,
    value: aExpr(e.value),
    body: aExpr(e.body),
    span: e.span,
  }),
  EPipe: (e) => ({ kind: "pipe", left: aExpr(e.left), right: aExpr(e.right), span: e.span }),
  // al-side fields are `thenE`/`elseE` (`else` is a JS reserved word); canon
  // folds them back to the TS AST's `then`/`else`.
  ETernary: (e) => ({
    kind: "ternary",
    cond: aExpr(e.cond),
    // biome-ignore lint/suspicious/noThenProperty: mirrors the AST field; plain data, never awaited
    then: aExpr(e.thenE),
    else: aExpr(e.elseE),
    span: e.span,
  }),
  EMatch: (e) => ({
    kind: "match",
    scrutinee: aExpr(e.scrutinee),
    arms: e.arms.map(aArm),
    span: e.span,
  }),
  ERecord: (e) => ({
    kind: "record",
    fields: e.fields.map((f: Al) => ({ name: f.name, value: aExpr(f.value) })),
    span: e.span,
  }),
  EField: (e) => ({ kind: "field", target: aExpr(e.target), name: e.name, span: e.span }),
  ETuple: (e) => ({ kind: "tuple", elements: e.elements.map(aExpr), span: e.span }),
  EArr: (e) => ({ kind: "arr", elements: e.elements.map(aExpr), span: e.span }),
  EList: (e) => ({ kind: "list", elements: e.elements.map(aExpr), span: e.span }),
  EMap: (e) => ({
    kind: "map",
    entries: e.entries.map((en: Al) => ({ key: aExpr(en.key), value: aExpr(en.value) })),
    span: e.span,
  }),
};
const aExpr = (e: Al): Canon => {
  const f = A_EXPR[e._tag];
  if (!f) throw new Error(`unknown alang expr tag: ${e._tag}`);
  return f(e);
};

const A_PAT: Record<string, (p: Al) => Canon> = {
  PWild: (p) => ({ kind: "pwild", span: p.span }),
  PBind: (p) => ({ kind: "pbind", name: p.name, span: p.span }),
  PLit: (p) => ({ kind: "plit", value: p.value, raw: p.raw, span: p.span }),
  PBool: (p) => ({ kind: "pbool", value: p.value, span: p.span }),
  PStr: (p) => ({ kind: "pstr", value: p.value, span: p.span }),
  PTuple: (p) => ({ kind: "ptuple", elems: p.elems.map(aPat), span: p.span }),
  PRecord: (p) => ({
    kind: "precord",
    fields: p.fields.map((f: Al) => ({ label: f.label, pat: aPat(f.pat) })),
    span: p.span,
  }),
  PCtor: (p) => ({ kind: "pctor", ctor: p.ctor, args: p.args.map(aPat), span: p.span }),
  PArr: (p) => ({ kind: "parr", elems: p.elems.map(aPat), rest: opt(p.rest, aPat), span: p.span }),
  PList: (p) => ({
    kind: "plist",
    elems: p.elems.map(aPat),
    rest: opt(p.rest, aPat),
    span: p.span,
  }),
};
const aPat = (p: Al): Canon => {
  const f = A_PAT[p._tag];
  if (!f) throw new Error(`unknown alang pattern tag: ${p._tag}`);
  return f(p);
};

const A_TY: Record<string, (t: Al) => Canon> = {
  TyName: (t) => ({ kind: "tname", name: t.name, span: t.span }),
  TyArrow: (t) => ({ kind: "tarrow", from: aTy(t.from), to: aTy(t.to), span: t.span }),
  TyApp: (t) => ({ kind: "tapp", ctor: t.ctor, args: t.args.map(aTy), span: t.span }),
  TyTuple: (t) => ({ kind: "ttuple", elems: t.elems.map(aTy), span: t.span }),
  TyList: (t) => ({ kind: "tlist", elem: aTy(t.elem), span: t.span }),
};
const aTy = (t: Al): Canon => {
  const f = A_TY[t._tag];
  if (!f) throw new Error(`unknown alang type-expr tag: ${t._tag}`);
  return f(t);
};

const aCtor = (c: Al): Canon => ({
  name: c.name,
  fields: c.fields.map((f: Al) => ({ name: opt(f.name, (n) => n), type: aTy(f.fieldType) })),
});

const A_STMT: Record<string, (s: Al) => Canon> = {
  SLet: (s) => ({
    kind: "let",
    name: s.name,
    nameSpan: s.nameSpan,
    value: aExpr(s.value),
    exported: s.exported,
    doc: opt(s.doc, (d) => d),
    span: s.span,
  }),
  SType: (s) => ({
    kind: "type",
    name: s.name,
    params: s.params,
    ctors: s.ctors.map(aCtor),
    alias: opt(s.alias, (fs: Al) => fs.map((f: Al) => ({ name: f.name, type: aTy(f.fieldType) }))),
    exported: s.exported,
    span: s.span,
  }),
  SExtern: (s) => ({
    kind: "extern",
    name: s.name,
    nameSpan: s.nameSpan,
    typeExpr: aTy(s.typeExpr),
    module: s.module,
    imported: s.imported,
    exported: s.exported,
    span: s.span,
  }),
  SImport: (s) => ({
    kind: "import",
    names: s.names.map((n: Al) => ({ name: n.name, span: n.span })),
    from: s.from,
    span: s.span,
  }),
};
const aStmt = (s: Al): Canon => {
  const f = A_STMT[s._tag];
  if (!f) throw new Error(`unknown alang stmt tag: ${s._tag}`);
  return f(s);
};

// ---- drivers -------------------------------------------------------------------

const tsAst = (src: string): Canon[] => unwrapOk(parse(unwrapOk(lex(src)))).stmts.map(cStmt);

const alAst = (src: string): Canon[] => {
  const lr = alLex(src);
  if (lr._tag !== "Ok") throw new Error(`alang lexer errored: ${lr.error.message}`);
  const pr = alParse(lr.value);
  if (pr._tag !== "Ok") throw new Error(`alang parser errored: ${pr.error.message}`);
  return (pr.value as Al[]).map(aStmt);
};

// ---- the corpus: every .al file in the repo -------------------------------------

const corpus = [...new Bun.Glob("**/*.al").scanSync({ cwd: root })]
  .filter((p) => !p.includes("node_modules"))
  .sort();

test("corpus includes the bootstrap parser itself", () => {
  expect(corpus).toContain("bootstrap/parser.al");
  expect(corpus).toContain("bootstrap/lexer.al");
});

for (const file of corpus) {
  test(`ASTs agree on ${file}`, () => {
    const src = readFileSync(join(root, file), "utf8");
    expect(alAst(src)).toEqual(tsAst(src));
  });
}

// ---- targeted edge cases ---------------------------------------------------------

const cases: Record<string, string> = {
  "lambda forms":
    "let f = x => x\nlet g = (a, b) => a\nlet h = () => 1\nlet i = ({ x, y }) => x\nlet j = ((a, b)) => a\nlet k = (x) => x",
  "let-in and tuple let-in":
    "let f = let a = 1 in add(a, 2)\nlet g = let (x, y) = (1, 2) in add(x, y)",
  "pipe chain": "let r = x |> f |> g(1) |> h",
  "call and field chains": "let a = f(1)(2).x.y(3)",
  "tuple vs grouping": "let t = (1, 2, 3)\nlet g = (1)",
  "collection literals":
    'let a = []\nlet b = [1, 2]\nlet c = @{}\nlet d = @{1, 2}\nlet e = #{}\nlet f = #{ "k": 1, "j": 2 }\nlet r = { x: 1, y: 2 }\nlet z = {}',
  "match with every pattern form":
    'let f = v => switch v { | 0 => 1 | -1.5 => 2 | true => 3 | "s" => 4 | (a, b) => 5 | { x, y: 0 } => 6 | Some(Some(n)) => 7 | [] => 8 | [h, ...t] => 9 | [_, x] => 10 | _ => 11 }',
  "match with guards": "let f = v => switch v { | Some(x) when gt(x, 0) => x | _ => 0 }",
  "lazy list patterns": "let f = v => switch v { | @{} => 0 | @{h, ...t} => h }",
  "type decl: variant, params, composite fields (ADR 0015)":
    "type Tree a = | Leaf(a) | Node(kids: [Tree a], tag: Option string, fn: a -> a, pair: (a, a))",
  "type decl: leading bar and bare ctors": "type Color =\n  | Red\n  | Green\n  | Blue",
  "type decl: record alias": "type Point = { x: number, y: number }\ntype Box a = { value: a }",
  "extern signatures":
    'extern clamp : number -> number -> number = "./m" "clamp"\nextern pick : (a, b) -> [a] -> Option a = "./m" "pick"',
  "import and exports":
    'import { a, b } from "./mod"\nexport let x = 1\nexport type T = | K\nexport extern e : a -> a = "./m" "e"',
  "doc comments attach":
    "/// doubles things\n/// really\nlet double = x => mul(x, 2)\n/// exported doc\nexport let e = 1",
  "record destructure with temp counter": "let { a, b } = p\nlet { c } = q",
  "negative and float raws": "let a = -3.5\nlet b = 3.0\nlet c = -0",
  "nested switch in let-in body":
    "let f = x => let y = switch x { | Some(v) => v | None => 0 } in add(y, 1)",
  "empty params lambda calling a ctor": "let mk = () => Some({ tok: 1, at: (2, 3) })",
  "ternary, chained and nested (ADR 0016)":
    'let a = gt(x, 0) ? 1 : lt(x, 0) ? -1 : 0\nlet b = x |> f ? "y" : "n"\nlet c = (p ? q : r) ? 1 : 2\nlet m = #{ true ? 1 : 2 : "v" }',
};

for (const [name, src] of Object.entries(cases)) {
  test(`edge case: ${name}`, () => {
    expect(alAst(src)).toEqual(tsAst(src));
  });
}

// ---- error parity ----------------------------------------------------------------

const expectSameError = (src: string): void => {
  const ts = parse(unwrapOk(lex(src)));
  expect(isErr(ts)).toBe(true);
  const lr = alLex(src);
  if (lr._tag !== "Ok") throw new Error("expected the alang lexer to succeed");
  const al = alParse(lr.value);
  if (al._tag !== "Err") throw new Error("expected the alang parser to fail");
  const tsErr = unwrapErr(ts);
  if (tsErr.span === undefined) throw new Error("expected the TS parse error to carry a span");
  expect(al.error.message).toBe(tsErr.message);
  expect(al.error.start).toBe(tsErr.span.start);
  expect(al.error.end).toBe(tsErr.span.end);
};

const errorCases: Record<string, string> = {
  "missing binder": "let = 1",
  "missing eq": "let x 1",
  "empty switch": "let f = x => switch x { }",
  "unexpected token as atom": "let f = )",
  "unexpected token in pattern": "let f = x => switch x { | => 1 }",
  "bad rest pattern": "let f = x => switch x { | [a, ...1] => 1 }",
  "missing in": "let f = x => let y = 1 z",
  "bad from in import": 'import { a } too "x"',
  "export non-decl": "export switch",
  "unclosed record": "let r = { x: 1",
  "ctor field needs a type": "type T = | K(:)",
  "ternary missing colon": "let r = true ? 1",
};

for (const [name, src] of Object.entries(errorCases)) {
  test(`error parity: ${name}`, () => {
    expectSameError(src);
  });
}
