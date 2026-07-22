// Ticket 0007 — the permanent self-hosting guard, driven through the shipped
// alangc (bootstrap/cli.al) over real disk IO rather than the in-memory
// harness. See scripts/fixpoint.ts for the ceremony. Every bootstrap module —
// including compile.al and cli.al themselves — must satisfy:
//   stage2 ≡ stage3   (the binary reproduces its own emitted source), and
//   stage2 ≡ TS single-file compile   (the two implementations agree).
import { expect, test } from "bun:test";
import { runFixpoint } from "../scripts/fixpoint";

const { stage2, stage3, tsSingle } = runFixpoint();
const modules = Object.keys(stage2);

test("every bootstrap module reaches a binary fixpoint (stage2 ≡ stage3)", () => {
  for (const m of modules) expect(stage3[m]).toBe(stage2[m]);
});

test("shipped-binary output ≡ TS compiler output for every module", () => {
  for (const m of modules) expect(stage2[m]).toBe(tsSingle[m]);
});

test("all eight bootstrap modules are covered", () => {
  expect(modules.sort()).toEqual(
    ["check", "cli", "codegen", "compile", "infer", "lexer", "module", "parser"].sort(),
  );
});
