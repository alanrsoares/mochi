// The self-hosted formatter's expression printer, diffed against the TS one.
//
// bootstrap/format.spec.mochi checks hand-written cases; this checks expression
// printing over the corpus, one `let` value at a time. Whole-FILE agreement
// (statements, comments, blank lines) is test/bootstrap-format-file.spec.ts —
// this one survives because a failure here names the expression that broke,
// where the file-level diff names only the file.
import { beforeAll, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { format } from "@mochi/dx";
import { repoRoot } from "@mochi/test-support";
import { ensureInTreeBootstrapBuild } from "@mochi/test-support/bootstrap";
import { isErr, unwrapOk } from "@onrails/result";

const root = repoRoot(import.meta.url);

const HEAD = "let value = ";

type AlOk<T> = { _tag: "Ok"; value: T } | { _tag: "Err"; error: { message: string } };
let alLex: (src: string) => AlOk<unknown>;
let alParseRecovering: (toks: unknown, plugins: unknown) => { stmts: unknown[] };
let alFormatProgram: (stmts: unknown[], src: string) => string;

// The BUILT modules, not `bootstrapModuleJs`'s concatenated sandbox: the
// formatter reaches the prelude tables through `extern`, which import stripping
// leaves unbound, and repeated top-level names across concatenated modules
// shadow each other (`strLit` is defined by show-type-expr.mochi too).
beforeAll(async () => {
  ensureInTreeBootstrapBuild();
  alLex = (await import(join(root, "bootstrap/lexer.js"))).lex;
  alParseRecovering = (await import(join(root, "bootstrap/parser.js"))).parseRecovering;
  alFormatProgram = (await import(join(root, "bootstrap/format.js"))).formatProgram;
});

/** Print one expression by formatting the wrapped program and dropping the head. */
const alExprText = (src: string): string => {
  const wrapped = `${HEAD}${src}`;
  const lexed = alLex(wrapped);
  if (lexed._tag !== "Ok") throw new Error(`mochi lexer: ${lexed.error.message}`);
  const stmts = alParseRecovering(lexed.value, { _tag: "None" }).stmts;
  return alFormatProgram(stmts, wrapped).slice(HEAD.length).trimEnd();
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
    if (isErr(parse(unwrapOk(lex(`${HEAD}${slice}`))))) continue;
    if (hasJsxOrigin(s.value)) continue;
    out.push(slice);
  }
  return out;
};

const corpus = [...new Bun.Glob("**/*.mochi").scanSync({ cwd: root })]
  .filter((p) => !p.includes("node_modules"))
  .sort();

const comparable = (file: string): string[] => exprSlices(file);

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
