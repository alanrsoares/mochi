// The self-hosted formatter's expression printer, diffed against the TS one.
//
// bootstrap/format.spec.mochi checks hand-written cases; this checks the corpus.
// Every top-level `let` value in every .mochi file in the repo is re-wrapped as
// `let value = <source slice>`, formatted by both printers, and compared — so
// the diff is over thousands of real expressions rather than a case list.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { format } from "@mochi/dx";
import { repoRoot } from "@mochi/test-support";
import { bootstrapModuleJs } from "@mochi/test-support/bootstrap";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";

const root = repoRoot(import.meta.url);

type AlResult = { _tag: "Ok"; value: unknown } | { _tag: "Err"; error: { message: string } };

const evalAl = (js: string, name: string): unknown =>
  new Function("match", `"use strict";\n${js}\nreturn ${name};`)(match);

const fmtJs = bootstrapModuleJs("bootstrap/format.mochi");
const alExprD = evalAl(fmtJs, "exprD") as (cts: unknown, e: unknown) => unknown;
const alNoComments = evalAl(fmtJs, "noComments");
const alRender = evalAl(bootstrapModuleJs("bootstrap/doc.mochi"), "render") as (
  d: unknown,
  width: number,
) => string;
const alLex = evalAl(bootstrapModuleJs("bootstrap/lexer.mochi"), "lex") as (
  src: string,
) => AlResult;
const alParse = evalAl(bootstrapModuleJs("bootstrap/parser.mochi"), "parse") as (
  toks: unknown,
) => AlResult;

const HEAD = "let value = ";
// The TS printer lays the expression out with `let value = ` already consuming
// 12 columns, so the bootstrap side gets the same 68 columns for its first line.
// Only that first line is comparable: TS indents continuation lines from the
// line start, not from column 12, so a broken layout would need the full
// statement printer to compare fairly. Multi-line results are therefore skipped
// here and covered by the layout cases in bootstrap/format.spec.mochi.
const WIDTH = 80 - HEAD.length;

/** Print one expression source through the bootstrap printer. */
const alExprText = (src: string): string => {
  const lr = alLex(`${HEAD}${src}`);
  if (lr._tag !== "Ok") throw new Error(`mochi lexer: ${lr.error.message}`);
  const pr = alParse(lr.value);
  if (pr._tag !== "Ok") throw new Error(`mochi parser: ${pr.error.message}`);
  const stmts = pr.value as { value: unknown }[];
  return alRender(alExprD(alNoComments, stmts[0]!.value), WIDTH);
};

/** Print the same source through the TS formatter, minus the `let value = ` head. */
const tsExprText = (src: string): string => {
  const out = format(`${HEAD}${src}`);
  if (isErr(out)) throw new Error(`ts formatter: ${out.error[0]?.message}`);
  return out.value.slice(HEAD.length).trimEnd();
};

/**
 * Every top-level `let` value, as a source slice. Two kinds are skipped:
 *
 * - slices carrying a comment — the TS printer re-attaches comments and the
 *   bootstrap one has no comment table yet, so they diverge by design;
 * - slices holding JSX. Plugin `format` hooks re-fold `h(...)` back to `<tag>`
 *   and stay a TypeScript-host seam (ADR 0011 §6), so the bootstrap printer
 *   emits the underlying call by design;
 * - slices that do not reparse standalone. A parenthesized body's span ends at
 *   its inner expression, so `(a || (b || c))` yields a slice missing its
 *   trailing `))`. Both parsers agree on that span (the parser parity corpus
 *   compares them), so it is a slicing artifact here, not a divergence.
 */
/** True when any node under `e` is a call the JSX plugin synthesized. */
const hasJsxOrigin = (node: unknown): boolean => {
  if (Array.isArray(node)) return node.some(hasJsxOrigin);
  if (typeof node !== "object" || node === null) return false;
  const rec = node as Record<string, unknown>;
  if (rec.origin === "jsx") return true;
  return Object.values(rec).some(hasJsxOrigin);
};

const exprSlices = (file: string): string[] => {
  const src = readFileSync(join(root, file), "utf8");
  const lexed = lex(src);
  if (isErr(lexed)) return [];
  const parsed = parse(unwrapOk(lexed));
  if (isErr(parsed)) return [];
  const out: string[] = [];
  for (const s of unwrapOk(parsed).stmts) {
    if (s.kind !== "let") continue;
    const slice = src.slice(s.value.span.start, s.value.span.end);
    if (slice.includes("//")) continue;
    if (isErr(parse(unwrapOk(lex(`${HEAD}${slice}`))))) continue;
    if (hasJsxOrigin(s.value)) continue;
    out.push(slice);
  }
  return out;
};

const corpus = [...new Bun.Glob("**/*.mochi").scanSync({ cwd: root })]
  .filter((p) => !p.includes("node_modules"))
  .sort();

const comparable = (file: string): string[] =>
  exprSlices(file).filter((slice) => !tsExprText(slice).includes("\n"));

for (const file of corpus) {
  test(`expression printing agrees with the TS formatter on ${file}`, () => {
    for (const slice of comparable(file)) {
      expect({ slice, out: alExprText(slice) }).toEqual({ slice, out: tsExprText(slice) });
    }
  });
}

// Guards the filters above: if a change to the skip rules quietly emptied the
// corpus, every test would still pass. Self-contained on purpose — counting
// across the tests above made this pass or fail depending on `-t` filtering.
test("the corpus compared a meaningful number of expressions", () => {
  expect(corpus.reduce((n, f) => n + comparable(f).length, 0)).toBeGreaterThan(300);
});
