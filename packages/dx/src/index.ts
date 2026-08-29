/** DX query + format surfaces over `@mochi/compiler` (ADR 0048). */
export { type CompletionItem, type CompletionKind, completeAt, moduleCompleteAt } from "./complete";
export {
  diagnostics,
  documentDiagnostics,
  moduleDiagnostics,
  type Position,
  type PublishDiagnostic,
  type Range,
  toPublish,
} from "./diagnostics";
export { type FormatOptions, format, formatProgram } from "./format";
export { type HoverInfo, hoverAt, hoverAtOption, moduleHoverAt } from "./hover";
export {
  type DocSymbol,
  definitionAt,
  documentSymbolsAt,
  type Highlight,
  highlightsAt,
  type ListFiles,
  moduleDefinitionAt,
  moduleHighlightsAt,
  modulePrepareRenameAt,
  moduleReferencesAt,
  moduleRenameAt,
  moduleTypeDefinitionAt,
  prepareRenameAt,
  type Ref,
  type RenameEdit,
  referencesAt,
  renameAt,
  typeDefinitionAt,
  workspaceSymbolsAt,
} from "./nav";
