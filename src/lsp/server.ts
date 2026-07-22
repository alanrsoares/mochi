// alang language server. A thin adapter: it re-runs the compiler on every edit
// and republishes the resulting diagnostics. All real logic lives in the
// compiler (`src/diagnostics.ts`); this file only speaks LSP.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
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
import { moduleDiagnostics } from "../diagnostics";
import { format } from "../format";
import { moduleHoverAt } from "../hover";

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
connection.onHover(async ({ textDocument, position }): Promise<Hover | null> => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return null;
  const path = doc.uri.startsWith("file:") ? fileURLToPath(doc.uri) : doc.uri;
  const info = await moduleHoverAt(path, doc.getText(), doc.offsetAt(position), (p) =>
    readFile(p, "utf8"),
  );
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
// first error). Module-aware: imports are resolved from disk (deps) with the
// live buffer standing in for the edited file, so a `switch` on an imported
// variant isn't flagged as an unknown constructor. Our Range shape already
// matches the LSP one.
const validate = async (doc: TextDocument): Promise<void> => {
  const path = doc.uri.startsWith("file:") ? fileURLToPath(doc.uri) : doc.uri;
  const computed = await moduleDiagnostics(path, doc.getText(), (p) => readFile(p, "utf8"));
  const diags: Diagnostic[] = computed.map((d) => ({
    range: d.range,
    message: d.message,
    severity: DiagnosticSeverity.Error,
    source: "alang",
  }));
  connection.sendDiagnostics({ uri: doc.uri, diagnostics: diags });
};

documents.onDidChangeContent((e) => {
  void validate(e.document);
});
documents.listen(connection);
connection.listen();
