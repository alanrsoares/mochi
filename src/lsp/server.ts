// alang language server. A thin adapter: it re-runs the compiler on every edit
// and republishes the resulting diagnostics. All real logic lives in the
// compiler (`src/diagnostics.ts`); this file only speaks LSP.

import {
  createConnection,
  type Diagnostic,
  DiagnosticSeverity,
  type Hover,
  MarkupKind,
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { diagnostics as compute } from "../diagnostics";
import { hoverAt } from "../hover";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.onInitialize(() => ({
  capabilities: {
    textDocumentSync: TextDocumentSyncKind.Incremental,
    hoverProvider: true,
  },
}));

// Hover: map the cursor Position → byte offset → inferred type at that node.
connection.onHover(({ textDocument, position }): Hover | null => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return null;
  const type = hoverAt(doc.getText(), doc.offsetAt(position));
  if (!type) return null;
  return { contents: { kind: MarkupKind.Markdown, value: `\`\`\`alang\n${type}\n\`\`\`` } };
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
