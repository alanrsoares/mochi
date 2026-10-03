import type { CompilerDiagnostic } from "../module/graph.ts";
import type { Diagnostic } from "./errors";

const KINDS = ["lex", "parse", "check", "type"] as const;
const isKind = (kind: string | undefined): kind is Diagnostic["kind"] =>
  kind !== undefined && (KINDS as readonly string[]).includes(kind);

/** Structural seed → host conversion; editor presentation policy stays in DX. */
export const diagnosticFromSeed = (error: CompilerDiagnostic, path = ""): Diagnostic => {
  const help = error.help?._tag === "Some" ? error.help.value : undefined;
  const suggestions = (error.suggestions ?? []).map((suggestion) => ({
    location: { path, span: { start: suggestion.start, end: suggestion.end } },
    replaceWith: suggestion.replaceWith,
    ...(suggestion.title ? { title: suggestion.title } : {}),
  }));
  return {
    kind: isKind(error.kind) ? error.kind : "type",
    message: error.message,
    span: { start: error.start, end: error.end },
    ...(error.path ? { path: error.path } : {}),
    ...(help ? { help } : {}),
    ...(suggestions.length > 0 ? { suggestions } : {}),
  };
};
