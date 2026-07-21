// alang language server. A thin adapter: it re-runs the compiler on every edit
// and republishes the resulting diagnostics. All real logic lives in the
// compiler (`src/diagnostics.ts`); this file only speaks LSP.

import { isOk } from "@onrails/result";
import {
  createConnection,
  type Diagnostic,
  DiagnosticSeverity,
  type Hover,
  MarkupKind,
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
  TextEdit,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { diagnostics as compute } from "../diagnostics";
import { format } from "../format";
import { hoverAt } from "../hover";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.onInitialize(() => ({
  capabilities: {
    textDocumentSync: TextDocumentSyncKind.Incremental,
    hoverProvider: true,
    inlayHintProvider: false,
    documentFormattingProvider: true,
  },
}));

// Hover: map the cursor Position → byte offset → inferred type at that node.
// Hover is the preferred mechanism for inspecting type hints.
connection.onHover(({ textDocument, position }): Hover | null => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return null;
  const info = hoverAt(doc.getText(), doc.offsetAt(position));
  if (!info) return null;
  const fence = `\`\`\`alang\n${info.code}\n\`\`\``;
  const value = info.doc ? `${fence}\n\n${info.doc}` : fence;
  return { contents: { kind: MarkupKind.Markdown, value } };
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
// first error). Our Range shape already matches the LSP one.
const validate = (doc: TextDocument): void => {
  const diags: Diagnostic[] = compute(doc.getText()).map((d) => ({
    range: d.range,
    message: d.message,
    severity: DiagnosticSeverity.Error,
    source: "alang",
  }));
  connection.sendDiagnostics({ uri: doc.uri, diagnostics: diags });
};

documents.onDidChangeContent((e) => validate(e.document));
documents.listen(connection);
connection.listen();
