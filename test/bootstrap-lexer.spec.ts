// Slice C — the self-hosted lexer. bootstrap/lexer.mochi is compiled by the TS
// compiler, evaluated, and run against the TS lexer on every .mochi file in the
// repo (including lexer.mochi itself). The two token streams must be identical.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { match } from "@onrails/pattern";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { type Located, lex } from "../src/lexer";

const root = join(import.meta.dir, "..");

// Compile the mochi lexer once; strip the module scaffolding so it evals in a
// plain function scope (same harness as guards.spec.ts, plus `export`).
const lexerAlSrc = readFileSync(join(root, "bootstrap/lexer.mochi"), "utf8");
const js = unwrapOk(compile(lexerAlSrc))
  .replace(/^import .*$/m, "")
  .replace(/^export /gm, "");

// mochi runtime shapes: variants are `_tag`-tagged records, Option is Some/None.
type AlTok = { _tag: string; value?: unknown; raw?: string };
type AlDoc = { _tag: "Some"; value: string } | { _tag: "None" };
type AlLocated = { tok: AlTok; start: number; end: number; doc: AlDoc };
type AlLexErr = { message: string; start: number; end: number };
type AlResult = { _tag: "Ok"; value: AlLocated[] } | { _tag: "Err"; error: AlLexErr };
type AlLex = (src: string) => AlResult;

// The strict prologue matters: JSC (Bun) does proper tail calls only in strict
// mode, and the lexer's `go` loop recurses once per token — without PTC, big
// files overflow the stack. Emitted mochi modules are ESM (always strict), so
// this mirrors how the code really runs.
const alLex = new Function("match", `"use strict";\n${js}\nreturn lex;`)(match) as AlLex;

// Canonical token shape both lexers map into for the diff.
type Canon = {
  t: string;
  v?: unknown;
  raw?: string;
  start: number;
  end: number;
  doc: string | null;
};

const canonTs = (l: Located): Canon => ({
  t: l.t,
  v: "v" in l ? l.v : undefined,
  raw: "raw" in l ? l.raw : undefined,
  start: l.span.start,
  end: l.span.end,
  doc: l.doc ?? null,
});

// mochi ctor tag → TS `t` tag for the payload-free tokens.
const TAG_TO_T: Record<string, string> = {
  TLet: "let",
  TType: "type",
  TExtern: "extern",
  TSwitch: "switch",
  TImport: "import",
  TExport: "export",
  TEq: "eq",
  TArrow: "arrow",
  TTarrow: "tarrow",
  TPipe: "pipe",
  TBar: "bar",
  TLparen: "lparen",
  TRparen: "rparen",
  TLbrace: "lbrace",
  TRbrace: "rbrace",
  TLbracket: "lbracket",
  TRbracket: "rbracket",
  TSpread: "spread",
  TAt: "at",
  THash: "hash",
  TDot: "dot",
  TColon: "colon",
  TQuestion: "question",
  TComma: "comma",
  TEof: "eof",
};
const PAYLOAD_TAGS: Record<string, string> = {
  TNum: "num",
  TBool: "bool",
  TStr: "str",
  TTmplStart: "tmplstart",
  TTmplMid: "tmplmid",
  TTmplEnd: "tmplend",
  TId: "id",
};

const canonAl = (l: AlLocated): Canon => {
  const payload = PAYLOAD_TAGS[l.tok._tag];
  const t = payload ?? TAG_TO_T[l.tok._tag];
  if (t === undefined) throw new Error(`unknown mochi token tag: ${l.tok._tag}`);
  return {
    t,
    v: payload ? l.tok.value : undefined,
    raw: l.tok._tag === "TNum" ? l.tok.raw : undefined,
    start: l.start,
    end: l.end,
    doc: l.doc._tag === "Some" ? l.doc.value : null,
  };
};

const tsStream = (src: string): Canon[] => unwrapOk(lex(src)).map(canonTs);
const alStream = (src: string): Canon[] => {
  const r = alLex(src);
  if (r._tag === "Err") throw new Error(`mochi lexer errored: ${r.error.message}`);
  return r.value.map(canonAl);
};

// --- the corpus: every .mochi file in the repo -----------------------------------

const corpus = [...new Bun.Glob("**/*.mochi").scanSync({ cwd: root })]
  .filter((p) => !p.includes("node_modules"))
  .sort();

test("corpus includes the bootstrap lexer itself", () => {
  expect(corpus).toContain("bootstrap/lexer.mochi");
  expect(corpus.length).toBeGreaterThanOrEqual(5);
});

for (const file of corpus) {
  test(`token streams agree on ${file}`, () => {
    const src = readFileSync(join(root, file), "utf8");
    expect(alStream(src)).toEqual(tsStream(src));
  });
}

// --- targeted edge cases -------------------------------------------------------

const cases: Record<string, string> = {
  "empty source": "",
  "doc comment attaches to the next token": "/// doubles\nlet double = x => mul(x, 2)",
  "consecutive doc lines join with newline": "/// one\n/// two\nlet f = 1",
  "blank line breaks doc attachment": "/// lost\n\nlet f = 1",
  "plain own-line comment breaks doc attachment": "/// lost\n// plain\nlet f = 1",
  "trailing comment is invisible to docs": "/// kept\nlet f = 1 // trailing\nlet g = 2",
  "trailing doc-style comment does not attach": "let f = 1 /// trailing\nlet g = 2",
  "doc without following token attaches to eof": "let f = 1\n/// dangling",
  "doc text drops one leading space": "///no space\n/// one space\n///  two spaces\nlet f = 1",
  "negative number vs spread vs dot": "let f = -3.5\nlet g = [x, ...xs]\nlet h = p.x",
  "number with trailing dot chars": "let n = 1.2\nlet m = -0.5",
  "string escapes decode": 'let s = "a\\nb\\tc\\\\d\\"e"',
  "digraphs before single chars": "let f = x => x |> g\nextern h : number -> number",
  "all punctuation": "| = ( ) { } [ ] , . : @ #",
  "keywords vs identifiers":
    "let lettuce = typeof1\nswitch x { | true => import2 | false => exporter }",
  "crlf line endings": "let f = 1\r\nlet g = 2\r\n",
  "ident with underscore and digits": "let _foo_2 = bar_baz9",
  // ADR 0023 — string interpolation.
  // biome-ignore lint/suspicious/noTemplateCurlyInString: mochi source, not a JS template
  "interp: single hole": 'let s = "a ${x} b"',
  // biome-ignore lint/suspicious/noTemplateCurlyInString: mochi source, not a JS template
  "interp: multiple holes": 'let s = "${a}-${b}-${c}"',
  // biome-ignore lint/suspicious/noTemplateCurlyInString: mochi source, not a JS template
  "interp: nested interpolation in a hole": 'let s = "a ${ "b ${c} d" } e"',
  "interp: hole containing a switch (brace depth)":
    // biome-ignore lint/suspicious/noTemplateCurlyInString: mochi source, not a JS template
    'let s = "v = ${ switch n { | 0 => 1 | _ => 2 } }"',
  // biome-ignore lint/suspicious/noTemplateCurlyInString: mochi source, not a JS template
  "interp: hole containing a string with braces": 'let s = "a ${ "{}" } b"',
  // biome-ignore lint/suspicious/noTemplateCurlyInString: mochi source, not a JS template
  "interp: escaped hole opener is not a hole": 'let s = "price: \\${amount}"',
  // biome-ignore lint/suspicious/noTemplateCurlyInString: mochi source, not a JS template
  "interp: leading and trailing empty literal chunks": 'let s = "${a}"',
};

for (const [name, src] of Object.entries(cases)) {
  test(`edge case: ${name}`, () => {
    expect(alStream(src)).toEqual(tsStream(src));
  });
}

// --- error parity ---------------------------------------------------------------

const expectSameError = (src: string): void => {
  const ts = lex(src);
  const al = alLex(src);
  expect(isErr(ts)).toBe(true);
  if (al._tag !== "Err") throw new Error("expected the mochi lexer to fail");
  const tsErr = unwrapErr(ts);
  if (tsErr.span === undefined) throw new Error("expected the TS lex error to carry a span");
  expect(al.error.message).toBe(tsErr.message);
  expect(al.error.start).toBe(tsErr.span.start);
  expect(al.error.end).toBe(tsErr.span.end);
};

test("unterminated string: same message and span", () => {
  expectSameError('let s = "oops');
});

test("unexpected char: same message and span", () => {
  expectSameError("let x = ~1");
});

test("unterminated hole: same message and span", () => {
  expectSameError('let s = "a ${ 1 + 2 x"');
});

test("unterminated string after a closed hole: same message and span", () => {
  // biome-ignore lint/suspicious/noTemplateCurlyInString: mochi source, not a JS template
  expectSameError('let s = "a ${x} b');
});
