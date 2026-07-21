// Slice F — self-hosted codegen. bootstrap/codegen.al is compiled by the TS
// compiler, evaluated, and fed the bootstrap parser's AST; the JS it emits for
// every .al file in the repo — including codegen.al itself — must be byte-for-
// byte identical to the TS codegen's output. The three prelude runtime tables
// (namespaceRuntime / preludeJsDefs / runtimeDeps) are passed in as Maps built
// from the SAME src/prelude.ts data both codegens consult — the prelude is not
// forked (docs/PATH_TO_BOOTSTRAP.md §6). Targeted parity cases pin the emit for
// features whose codegen is subtle (nested patterns, guards, lazy List, let?).
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { match } from "@onrails/pattern";
import { unwrapOk } from "@onrails/result";
import { codegen } from "../src/codegen";
import { compile } from "../src/compile";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { namespaceRuntime, preludeJsDefs, runtimeDeps } from "../src/prelude";

const root = join(import.meta.dir, "..");

const compileAl = (path: string): string =>
  unwrapOk(compile(readFileSync(join(root, path), "utf8")))
    .replace(/^import .*$/m, "")
    .replace(/^export /gm, "");

// The strict prologue matters: JSC does proper tail calls only in strict mode
// (ADR 0014) — codegen.al's cursor loops recurse once per stmt/arm/field.
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

type AlCodegen = {
  codegen: (
    stmts: unknown,
    imported: Map<string, string[]>,
    useRuntime: boolean,
    ns: Map<string, Map<string, string>>,
    jsDefs: Map<string, string>,
    runtimeDeps: Map<string, string[]>,
  ) => string;
};

const alCodegen = evalAlNames<AlCodegen>(compileAl("bootstrap/codegen.al"), ["codegen"]).codegen;

// The TS prelude tables, converted to Maps — the SAME data both codegens read.
// Insertion order is preserved (preludeJsDefs drives preamble emit order), so
// the two outputs stay byte-identical.
const alNs = new Map(
  Object.entries(namespaceRuntime).map(([ns, members]) => [ns, new Map(Object.entries(members))]),
);
const alJsDefs = new Map(Object.entries(preludeJsDefs));
const alRuntimeDeps = new Map(Object.entries(runtimeDeps));

// One codegen call each side, runtime inlined, no cross-module ctor imports.
const tsEmit = (src: string): string =>
  codegen(unwrapOk(parse(unwrapOk(lex(src)))), new Map(), { runtime: true });

const alEmit = (src: string): string => {
  const lr = alLex(src);
  if (lr._tag !== "Ok") throw new Error(`alang lexer errored: ${lr.error.message}`);
  const pr = alParse(lr.value);
  if (pr._tag !== "Ok") throw new Error(`alang parser errored: ${pr.error.message}`);
  return alCodegen(pr.value, new Map(), true, alNs, alJsDefs, alRuntimeDeps);
};

// ---- the corpus: every .al file in the repo --------------------------------

const corpus = [...new Bun.Glob("**/*.al").scanSync({ cwd: root })]
  .filter((p) => !p.includes("node_modules"))
  .sort();

test("corpus includes the bootstrap codegen itself", () => {
  expect(corpus).toContain("bootstrap/codegen.al");
});

for (const file of corpus) {
  test(`codegen emit agrees on ${file}`, () => {
    const src = readFileSync(join(root, file), "utf8");
    expect(alEmit(src)).toEqual(tsEmit(src));
  });
}

// ---- targeted cases: subtle emit paths -------------------------------------

const cases: Record<string, string> = {
  "nested ctor pattern (guard form)":
    "type N = | Z | Sm(N)\nlet f = n => switch n { | Sm(Sm(m)) => m | _ => n }",
  "when guard": "let f = n => switch n { | x when eq(x, 0) => 1 | _ => 0 }",
  "tuple destructure in match": "let f = p => switch p { | (a, b) => add(a, b) }",
  "record literal arrow body": "let mk = x => { value: x }",
  "curried multi-arg lambda": "let addThree = (a, b, c) => add(a, add(b, c))",
  "let in binding": "let f = x => let y = add(x, 1) in add(y, y)",
  "let? monadic bind":
    'extern parseNum : string -> Result number string = "m" "p"\nlet f = s => let? n = parseNum(s) in Ok(add(n, 1))',
  "lazy list match": "let f = xs => switch xs { | @{} => 0 | @{h, ...t} => h }",
  ternary: "let f = b => b ? 1 : 0",
  pipe: "let f = x => x |> add(1)",
  "map literal": 'let m = #{ "a": 1, "b": 2 }',
  "nullary + n-ary ctors": "type T = | A | B(number) | C(number, number)",
  "string escapes": 'let s = "a\\tb\\nc\\"d\\\\e"',
  // biome-ignore lint/suspicious/noTemplateCurlyInString: alang source, not a JS template
  "interp: single hole": 'let s = "a ${x} b"',
  // biome-ignore lint/suspicious/noTemplateCurlyInString: alang source, not a JS template
  "interp: multiple holes and a call": 'let s = "${a}-${add(b, 1)}-${c}"',
  // biome-ignore lint/suspicious/noTemplateCurlyInString: alang source, not a JS template
  "interp: nested interpolation": 'let s = "outer ${ "inner ${x}" } end"',
  "interp: literal chunk needing re-escaping (backslash/backtick/${)":
    // biome-ignore lint/suspicious/noTemplateCurlyInString: alang source, not a JS template
    'let s = "a\\\\b`c ${x} d\\${e}"',
};

for (const [name, src] of Object.entries(cases)) {
  test(`codegen parity: ${name}`, () => {
    expect(alEmit(src)).toEqual(tsEmit(src));
  });
}
