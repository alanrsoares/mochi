/**
 * Codegen — AST → JavaScript source. Pure (no failure).
 * mochi owns the type system (HM inference), so emitted JS carries no type
 * annotations — the checker runs before codegen and guarantees soundness.
 * `@onrails/pattern` `.exhaustive()` forces a case for every Expr kind here: add an AST
 * node and forget it → TS compile error in the compiler, not a silent gap.
 *
 * Split across this package by concern: `codegen-core` (expr-level dispatch +
 * `GenCtx`), `codegen-loop` (loop/recur, ADR 0056), `codegen-match`
 * (switch/match), `codegen-decl` (type/extern/import/let), `codegen-deps`
 * (prelude runtime-dependency analysis). This file wires them together behind
 * the public `codegen` entrypoint.
 */
import type { Ctor, Expr, Program, TypeStmt } from "../ast/ast";
import { ctorTableOf } from "../ast/ctors";
import type { Span } from "../ast/span";
import type { CtorFactoryTs, GenCtx } from "./codegen-core";
import { genStmt } from "./codegen-decl";
import { collectValueRefs, preludePreamble, usesMatchLib } from "./codegen-deps";

export type { CtorFactoryTs } from "./codegen-core";
export { collectRuntimeDeps } from "./codegen-deps";

/**
 * `runtime`: inline the prelude builtins the program uses, so the emitted module
 * runs standalone. Off by default — callers that supply their own prelude (tests
 * via `new Function(preludeJs, …)`) keep prelude-free output.
 */
export type CodegenOptions = {
  runtime?: boolean;
  docs?: boolean;
  annotate?: (name: string, value: Expr) => string | null;
  annotateCtor?: (s: TypeStmt, c: Ctor) => CtorFactoryTs | null;
  flattenPipe?: boolean;
  tupleHelper?: boolean;
  moduleExt?: string;
  annotateParams?: (span: Span, arity: number) => { generics: string; params: (string | null)[] };
  guardBaseType?: (scrutinee: Expr) => string | null;
  annotateEmpty?: (e: Expr) => string | null;
  annotateLetin?: (value: Expr) => string | null;
  annotateCall?: (e: Expr) => string | null;
};

export const codegen = (
  prog: Program,
  imported?: Map<string, string[]>,
  opts: CodegenOptions = {},
): string => {
  // One derivation (`ctors.ts`): a user entry always binds; a builtin entry
  // (Some/Ok/…) yields to an existing key set — a user decl, or an imported
  // ctor's keys already seeded from `imported`.
  const ctorKeys = new Map(imported ?? []);
  for (const [name, e] of ctorTableOf(prog).ctor)
    if (!e.builtin || !ctorKeys.has(name)) ctorKeys.set(name, e.keys);
  const ctx: GenCtx = {
    ctorKeys,
    annotateLet: opts.annotate ?? null,
    annotateCtor: opts.annotateCtor ?? null,
    flattenPipe: opts.flattenPipe ?? false,
    tupleHelper: opts.tupleHelper ?? false,
    annotateParams: opts.annotateParams ?? null,
    guardBaseType: opts.guardBaseType ?? null,
    annotateEmpty: opts.annotateEmpty ?? null,
    annotateLetin: opts.annotateLetin ?? null,
    annotateCall: opts.annotateCall ?? null,
    moduleExt: opts.moduleExt ?? ".js",
    valueRefs: collectValueRefs(prog),
    docs: opts.docs ?? true,
  };
  const needsMatch = prog.stmts.some(
    (s) => (s.kind === "let" || s.kind === "expr") && usesMatchLib(s.value),
  );
  const header = needsMatch ? `import { match } from "@onrails/pattern";\n\n` : "";
  const preamble = opts.runtime ? preludePreamble(prog) : "";
  const body = prog.stmts.map((s) => genStmt(s, ctx)).join("\n");
  return `${header}${preamble}${body}\n`;
};
