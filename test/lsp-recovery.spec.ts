/**
 * Slice e of C9 (ADR 0045): the LSP surfaces must keep working on a file with
 * 2+ parse errors. Recovery already yields a partial `Program` (slice a/b) that
 * check/infer tolerate (slice c) — this pins that hover, document symbols,
 * completion, and go-to-definition actually READ that tree instead of calling
 * the hard-fail `parse` and blanking the editor out.
 *
 * `compile` deliberately stays hard-fail: emitting code from a file with a hole
 * would be a silent lie. `diagnostics` therefore still reports every error.
 */
import { expect, test } from "bun:test";
import { completeAt } from "../src/complete";
import { diagnostics } from "../src/diagnostics";
import { hoverAt } from "../src/hover";
import { definitionAt, documentSymbolsAt } from "../src/nav";

/** Two unparsable regions (`)` and `*` in expression position) around intact decls. */
const SRC = 'let x = )\nlet greeting = "hello"\nlet z = *\nlet n = 1 + 2\nlet m = n + 3\n';

const offsetOf = (needle: string, from = 0) => SRC.indexOf(needle, from);

test("diagnostics still reports both parse errors", () => {
  const ds = diagnostics(SRC);
  expect(ds.length).toBeGreaterThanOrEqual(2);
});

test("hover works on a binding after two parse errors", () => {
  // `greeting` precedes the second error; `m` follows both.
  expect(hoverAt(SRC, offsetOf("greeting"))?.code).toBe("let greeting: string");
  expect(hoverAt(SRC, offsetOf("m"))?.code).toBe("let m: number");
});

test("document symbols list the surviving declarations", () => {
  const names = documentSymbolsAt(SRC).map((s) => s.name);
  expect(names).toContain("greeting");
  expect(names).toContain("n");
  expect(names).toContain("m");
});

test("completion sees locals declared around the holes", () => {
  // Cursor at the end of the file, typing an identifier prefix.
  const src = `${SRC}let use = gr`;
  const labels = completeAt(src, src.length).map((i) => i.label);
  expect(labels).toContain("greeting");
});

test("go-to-definition resolves a use whose def is on the other side of a hole", () => {
  // The `n` inside `let m = n + 3` points back at `let n = 1 + 2`.
  const use = offsetOf("n + 3");
  const def = definitionAt(SRC, use);
  expect(def).not.toBeNull();
  expect(def?.span.start).toBe(offsetOf("let n") + "let ".length);
});
