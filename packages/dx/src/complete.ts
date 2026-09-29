/**
 * LSP-shaped completion, free of any editor/protocol dependency so it stays
 * unit-testable under Bun (ADR 0013).
 *
 * Member completions after `.` tolerate incomplete buffers (`Task.`, `r.ab`) via
 * a lexical rewrite that strips `.prefix` before typechecking. Value completions
 * include nested locals visible at the cursor. JSX attr names / literal-union
 * values (`$tone="…"`) read the component's prop row (Wave 12).
 *
 * The self-hosted core answers (`bootstrap-complete.ts`, ADR 0120); plugins
 * are self-hosted-core ones, and their `completeMembers` hooks list members
 * of opaque receivers (`tw.`).
 */
import type { CompletionItem, CompletionKind } from "@mochi/compiler/bootstrap/options";
import {
  type BootstrapCompleteOptions,
  bootstrapCompleteAt,
  moduleBootstrapCompleteAt,
} from "./bootstrap-complete";

export type { CompletionItem, CompletionKind };

/** Caller-owned bootstrap graph memo and the project's self-hosted-core plugins. */
export type CompleteOptions = BootstrapCompleteOptions;

/**
 * Completions at `offset`. Member trigger (after `.`) prefers namespaces, then
 * record fields, then plugin hooks. JSX attr name/value next. Otherwise values
 * visible at the cursor (prelude, top-level, nested locals).
 */
export const completeAt = (
  src: string,
  offset: number,
  opts: CompleteOptions = {},
): CompletionItem[] => bootstrapCompleteAt(src, offset, opts);

/**
 * Module-aware completion: resolve imports so `import * as R` members,
 * imported components' JSX props, and plugin-backed `tw.*` work. Degrades to
 * single-file completion if the dep graph can't be typed.
 */
export const moduleCompleteAt = (
  path: string,
  src: string,
  offset: number,
  readFile: (p: string) => Promise<string>,
  opts: CompleteOptions = {},
): Promise<CompletionItem[]> => moduleBootstrapCompleteAt(path, src, offset, readFile, opts);
