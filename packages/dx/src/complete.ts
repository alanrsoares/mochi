/** Completion exports over the self-hosted query implementation. */
export type { CompletionItem, CompletionKind } from "@mochi/compiler/bootstrap/options";
export {
  type BootstrapCompleteOptions as CompleteOptions,
  bootstrapCompleteAt as completeAt,
  moduleBootstrapCompleteAt as moduleCompleteAt,
} from "./bootstrap-complete";
