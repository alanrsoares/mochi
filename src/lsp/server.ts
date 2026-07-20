// alang language server. A thin adapter: it re-runs the compiler on every edit
// and republishes the resulting diagnostics. All real logic lives in the
// compiler (`src/diagnostics.ts`); this file only speaks LSP.

import {
  createConnection,
  type Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { diagnostics as compute } from "../diagnostics";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.onInitialize(() => ({
  capabilities: { textDocumentSync: TextDocumentSyncKind.Incremental },
}));

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
