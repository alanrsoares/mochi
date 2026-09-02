// Whole-file formatter parity: every .mochi file in the repo, printed by the
// self-hosted formatter and by the TypeScript one, compared byte for byte.
//
// This loads the BUILT graph modules (real ESM imports), not the concatenated
// sandbox `bootstrapModuleJs` produces: concatenation keeps only the first of
// any repeated top-level `const`, and `strLit` is defined by both
// show-type-expr.mochi and format.mochi — the formatter's would be silently
// shadowed, and its output diffed against the wrong function.
//
// This is the drift gate for the two hand-ported formatters. It replaced the
// warn-only `pre-push-formatter-drift` hook: a one-sided change to either
// packages/dx/src/format.ts or bootstrap/format.mochi now fails `bun run check`,
// so authoring order is free (ADR 0078 still names the formatter TS-owned DX).
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

type AlOk<T> = { _tag: "Ok"; value: T } | { _tag: "Err"; error: { message: string } };
let alLex: (src: string) => AlOk<unknown>;
let alParseRecovering: (toks: unknown, plugins: unknown) => { stmts: unknown[] };
let alFormatProgram: (stmts: unknown[], src: string) => string;

beforeAll(async () => {
  ensureInTreeBootstrapBuild();
  alLex = (await import(join(root, "bootstrap/lexer.js"))).lex;
  alParseRecovering = (await import(join(root, "bootstrap/parser.js"))).parseRecovering;
  alFormatProgram = (await import(join(root, "bootstrap/format.js"))).formatProgram;
});

/**
 * JSX is the one documented exclusion: plugin `format` hooks re-fold `h(...)`
 * back to `<tag>` and stay a TypeScript-host seam (ADR 0011 §6), so the
 * bootstrap printer emits the underlying call by design. Detected from the AST
 * (`origin: "jsx"`, set only by the plugin's parse hook) rather than by
 * sniffing text, where `a < b` and `Map<string, a>` both look like a tag.
 */
const hasJsxOrigin = (node: unknown): boolean => {
  if (Array.isArray(node)) return node.some(hasJsxOrigin);
  if (typeof node !== "object" || node === null) return false;
  const rec = node as Record<string, unknown>;
  if (rec.origin === "jsx") return true;
  return Object.values(rec).some(hasJsxOrigin);
};

const hasJsx = (src: string): boolean => {
  const lexed = lex(src);
  if (isErr(lexed)) return false;
  const parsed = parse(unwrapOk(lexed));
  return isErr(parsed) ? false : hasJsxOrigin(unwrapOk(parsed).stmts);
};

const corpus = [...new Bun.Glob("**/*.mochi").scanSync({ cwd: root })]
  .filter((p) => !p.includes("node_modules"))
  .sort();

const alFormat = (src: string): string => {
  const lexed = alLex(src);
  if (lexed._tag !== "Ok") throw new Error(`mochi lexer: ${lexed.error.message}`);
  return alFormatProgram(alParseRecovering(lexed.value, { _tag: "None" }).stmts, src);
};

for (const file of corpus) {
  const src = readFileSync(join(root, file), "utf8");
  if (hasJsx(src)) continue;
  test(`formatters agree byte for byte on ${file}`, () => {
    const ts = format(src);
    if (ts._tag !== "Ok") throw new Error("ts formatter failed");
    expect(alFormat(src)).toBe(ts.value);
  });
}

test("the corpus covers a meaningful number of files", () => {
  const compared = corpus.filter((f) => !hasJsx(readFileSync(join(root, f), "utf8"))).length;
  expect(compared).toBeGreaterThan(70);
});
