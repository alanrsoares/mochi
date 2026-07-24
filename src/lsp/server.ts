// mochi language server. A thin adapter: it re-runs the compiler on every edit
// and republishes the resulting diagnostics. All real logic lives in the
// compiler; this file only speaks LSP.

import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isOk } from "@onrails/result";
import {
  type CodeAction,
  CodeActionKind,
  createConnection,
  type Diagnostic,
  DiagnosticSeverity,
  type DocumentHighlight,
  DocumentHighlightKind,
  type Hover,
  type Location,
  MarkupKind,
  ProposedFeatures,
  type TextDocumentPositionParams,
  TextDocumentSyncKind,
  TextDocuments,
  TextEdit,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { moduleDiagnostics } from "../diagnostics";
import { format } from "../format";
import { moduleHoverAt } from "../hover";
import { definitionAt, highlightsAt, prepareRenameAt, referencesAt, renameAt } from "../nav";
import type { Span } from "../span";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.onInitialize(() => ({
  capabilities: {
    textDocumentSync: TextDocumentSyncKind.Incremental,
    hoverProvider: true,
    definitionProvider: true,
    documentHighlightProvider: true,
    referencesProvider: true,
    renameProvider: { prepareProvider: true },
    codeActionProvider: true,
    inlayHintProvider: false,
    documentFormattingProvider: true,
  },
}));

const docPath = (uri: string): string => (uri.startsWith("file:") ? fileURLToPath(uri) : uri);

const rangeOf = (doc: TextDocument, span: Span) => ({
  start: doc.positionAt(span.start),
  end: doc.positionAt(span.end),
});

// Hover: map the cursor Position → byte offset → inferred type at that node.
connection.onHover(async ({ textDocument, position }): Promise<Hover | null> => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return null;
  const info = await moduleHoverAt(
    docPath(textDocument.uri),
    doc.getText(),
    doc.offsetAt(position),
    (p) => readFile(p, "utf8"),
  );
  if (!info) return null;
  const fence = `\`\`\`mochi\n${info.code}\n\`\`\``;
  const value = info.doc ? `${fence}\n\n${info.doc}` : fence;
  return { contents: { kind: MarkupKind.Markdown, value } };
});

// Go-to-definition: lexical symbol index (works even when typecheck fails).
// Same-file only in this slice — def path matches the open document.
connection.onDefinition(
  ({ textDocument, position }: TextDocumentPositionParams): Location | null => {
    const doc = documents.get(textDocument.uri);
    if (!doc) return null;
    const path = docPath(textDocument.uri);
    const loc = definitionAt(doc.getText(), doc.offsetAt(position), path);
    if (!loc) return null;
    return { uri: pathToFileURL(loc.path).href, range: rangeOf(doc, loc.span) };
  },
);

// Document highlight: def + uses of the binding under the cursor.
connection.onDocumentHighlight(({ textDocument, position }): DocumentHighlight[] => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return [];
  return highlightsAt(doc.getText(), doc.offsetAt(position), docPath(textDocument.uri)).map(
    (h) => ({
      range: rangeOf(doc, h.span),
      kind: h.role === "def" ? DocumentHighlightKind.Write : DocumentHighlightKind.Read,
    }),
  );
});

// Find all references (same-file).
connection.onReferences(({ textDocument, position }): Location[] => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return [];
  const path = docPath(textDocument.uri);
  return referencesAt(doc.getText(), doc.offsetAt(position), path).map((r) => ({
    uri: pathToFileURL(r.location.path).href,
    range: rangeOf(doc, r.location.span),
  }));
});

// Rename (same-file). Rejects synthetics (`$`/`_`) and non-identifier names.
connection.onPrepareRename(({ textDocument, position }) => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return null;
  const prep = prepareRenameAt(doc.getText(), doc.offsetAt(position), docPath(textDocument.uri));
  return prep ? { range: rangeOf(doc, prep.span), placeholder: prep.name } : null;
});

connection.onRenameRequest(({ textDocument, position, newName }) => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return null;
  const path = docPath(textDocument.uri);
  const edits = renameAt(doc.getText(), doc.offsetAt(position), newName, path);
  if (!edits) return null;
  return {
    changes: {
      [pathToFileURL(path).href]: edits.map((e) =>
        TextEdit.replace(rangeOf(doc, e.location.span), e.newText),
      ),
    },
  };
});

// Quick fixes from Diagnostic.suggestions (recomputed — LSP does not round-trip them).
connection.onCodeAction(async ({ textDocument }): Promise<CodeAction[]> => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return [];
  const path = docPath(textDocument.uri);
  const published = await moduleDiagnostics(path, doc.getText(), (p) => readFile(p, "utf8"));
  const actions: CodeAction[] = [];
  for (const d of published) {
    for (const s of d.suggestions ?? []) {
      actions.push({
        title: s.title,
        kind: CodeActionKind.QuickFix,
        edit: {
          changes: {
            [pathToFileURL(s.path || path).href]: [TextEdit.replace(s.range, s.replaceWith)],
          },
        },
      });
    }
  }
  return actions;
});

// Formatting: run `format(src)` on the document text. If formatting succeeds,
// return a single full-document replacement edit.
connection.onDocumentFormatting(({ textDocument }): TextEdit[] => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return [];
  const text = doc.getText();
  const formatted = format(text);
  if (!isOk(formatted)) return [];
  const fullRange = {
    start: doc.positionAt(0),
    end: doc.positionAt(text.length),
  };
  return [TextEdit.replace(fullRange, formatted.value)];
});

// Compile the document and push diagnostics (0 or 1 — the pipeline stops at the
// first error). Module-aware: imports are resolved from disk (deps) with the
// live buffer standing in for the edited file.
const validate = async (doc: TextDocument): Promise<void> => {
  const path = docPath(doc.uri);
  const computed = await moduleDiagnostics(path, doc.getText(), (p) => readFile(p, "utf8"));
  const diags: Diagnostic[] = computed.map((d) => ({
    range: d.range,
    message: d.message,
    severity: DiagnosticSeverity.Error,
    source: "mochi",
    relatedInformation: d.related?.map((r) => ({
      message: r.message,
      location: {
        uri: pathToFileURL(r.path).href,
        range: r.range,
      },
    })),
  }));
  connection.sendDiagnostics({ uri: doc.uri, diagnostics: diags });
};

documents.onDidChangeContent((e) => {
  void validate(e.document);
});
documents.listen(connection);
connection.listen();
