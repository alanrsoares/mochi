/** Completion exports over the self-hosted query implementation. */
export type { CompletionItem, CompletionKind } from "@mochi/compiler/extensions";
export {
  type CompilerCompleteOptions as CompleteOptions,
  completeAt,
  moduleCompleteAt,
} from "./completion-query";
