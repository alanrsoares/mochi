/**
 * mochi language server. A thin adapter: it re-runs the compiler on every edit
 * and republishes the resulting diagnostics. All real logic lives in the
 * compiler; this file only speaks LSP.
 */
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
  type DocumentSymbol,
  type Hover,
  type Location,
  MarkupKind,
  ProposedFeatures,
  SymbolKind,
  type TextDocumentPositionParams,
  TextDocumentSyncKind,
  TextDocuments,
  TextEdit,
  type WorkspaceSymbol,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { moduleDiagnostics } from "../diagnostics";
import { format } from "../format";
import { moduleHoverAt } from "../hover";
import {
  documentSymbolsAt,
  moduleDefinitionAt,
  moduleHighlightsAt,
  modulePrepareRenameAt,
  moduleReferencesAt,
  moduleRenameAt,
  moduleTypeDefinitionAt,
  workspaceSymbolsAt,
} from "../nav";
import { isPreludePath, PRELUDE_PATH, preludeVirtualSource } from "../prelude-virtual";
import type { Span } from "../span";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.onInitialize(() => ({
  capabilities: {
    textDocumentSync: TextDocumentSyncKind.Incremental,
    hoverProvider: true,
    definitionProvider: true,
    typeDefinitionProvider: true,
    documentHighlightProvider: true,
    referencesProvider: true,
    renameProvider: { prepareProvider: true },
    codeActionProvider: true,
    documentSymbolProvider: true,
    workspaceSymbolProvider: true,
    inlayHintProvider: false,
    documentFormattingProvider: true,
    // Virtual prelude buffer for go-to-definition on builtins.
    workspace: {
      textDocumentContent: { schemes: ["mochi"] },
    },
  },
}));

const docPath = (uri: string): string => (uri.startsWith("file:") ? fileURLToPath(uri) : uri);

const uriOf = (path: string): string =>
  isPreludePath(path) ? PRELUDE_PATH : pathToFileURL(path).href;

const rangeOf = (doc: TextDocument, span: Span) => ({
  start: doc.positionAt(span.start),
  end: doc.positionAt(span.end),
});

const read = (p: string): Promise<string> => readFile(p, "utf8");

/** Range in `path` — prelude virtual, open buffer, or disk. */
const rangeAtPath = async (path: string, span: Span) => {
  if (isPreludePath(path)) {
    const doc = TextDocument.create(PRELUDE_PATH, "mochi", 0, preludeVirtualSource());
    return { uri: PRELUDE_PATH, range: rangeOf(doc, span) };
  }
  const uri = pathToFileURL(path).href;
  const open = documents.get(uri);
  if (open) return { uri, range: rangeOf(open, span) };
  const text = await read(path);
  const doc = TextDocument.create(uri, "mochi", 0, text);
  return { uri, range: rangeOf(doc, span) };
};

const symbolKind = (kind: string): SymbolKind => {
  if (kind === "type") return SymbolKind.Class;
  if (kind === "ctor") return SymbolKind.EnumMember;
  if (kind === "extern") return SymbolKind.Function;
  return SymbolKind.Variable;
};

/** Map cursor Position → byte offset → inferred type at that node. */
connection.onHover(async ({ textDocument, position }): Promise<Hover | null> => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return null;
  const info = await moduleHoverAt(
    docPath(textDocument.uri),
    doc.getText(),
    doc.offsetAt(position),
    read,
  );
  if (!info) return null;
  const fence = `\`\`\`mochi\n${info.code}\n\`\`\``;
  const value = info.doc ? `${fence}\n\n${info.doc}` : fence;
  return { contents: { kind: MarkupKind.Markdown, value } };
});

/** Go-to-definition (cross-module via export origins). */
connection.onDefinition(
  async ({ textDocument, position }: TextDocumentPositionParams): Promise<Location | null> => {
    const doc = documents.get(textDocument.uri);
    if (!doc) return null;
    const path = docPath(textDocument.uri);
    const loc = await moduleDefinitionAt(path, doc.getText(), doc.offsetAt(position), read);
    if (!loc) return null;
    return rangeAtPath(loc.path, loc.span);
  },
);

/** Go-to-type: nominal type of the expression under the cursor (needs infer). */
connection.onTypeDefinition(
  async ({ textDocument, position }: TextDocumentPositionParams): Promise<Location | null> => {
    const doc = documents.get(textDocument.uri);
    if (!doc) return null;
    const path = docPath(textDocument.uri);
    const loc = await moduleTypeDefinitionAt(path, doc.getText(), doc.offsetAt(position), read);
    if (!loc) return null;
    return rangeAtPath(loc.path, loc.span);
  },
);

/** Document highlight: occurrences in the current file. */
connection.onDocumentHighlight(async ({ textDocument, position }): Promise<DocumentHighlight[]> => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return [];
  const path = docPath(textDocument.uri);
  const hits = await moduleHighlightsAt(path, doc.getText(), doc.offsetAt(position), read);
  return hits.map((h) => ({
    range: rangeOf(doc, h.span),
    kind: h.role === "def" ? DocumentHighlightKind.Write : DocumentHighlightKind.Read,
  }));
});

/** Find all references across the import graph. */
connection.onReferences(async ({ textDocument, position }): Promise<Location[]> => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return [];
  const path = docPath(textDocument.uri);
  const refs = await moduleReferencesAt(path, doc.getText(), doc.offsetAt(position), read);
  return Promise.all(refs.map((r) => rangeAtPath(r.location.path, r.location.span)));
});

/** Rename across the import graph. */
connection.onPrepareRename(async ({ textDocument, position }) => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return null;
  const prep = await modulePrepareRenameAt(
    docPath(textDocument.uri),
    doc.getText(),
    doc.offsetAt(position),
    read,
  );
  return prep ? { range: rangeOf(doc, prep.span), placeholder: prep.name } : null;
});

connection.onRenameRequest(async ({ textDocument, position, newName }) => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return null;
  const path = docPath(textDocument.uri);
  const edits = await moduleRenameAt(path, doc.getText(), doc.offsetAt(position), newName, read);
  if (!edits) return null;
  const changes: Record<string, TextEdit[]> = {};
  for (const e of edits) {
    const { uri, range } = await rangeAtPath(e.location.path, e.location.span);
    const list = changes[uri] ?? [];
    list.push(TextEdit.replace(range, e.newText));
    changes[uri] = list;
  }
  return { changes };
});

/** Document / workspace symbols. */
connection.onDocumentSymbol(({ textDocument }): DocumentSymbol[] => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return [];
  return documentSymbolsAt(doc.getText()).map((s) => ({
    name: s.name,
    detail: s.detail,
    kind: symbolKind(s.kind),
    range: rangeOf(doc, s.span),
    selectionRange: rangeOf(doc, s.span),
  }));
});

connection.onWorkspaceSymbol(async ({ query }): Promise<WorkspaceSymbol[]> => {
  // Search from each open .mochi doc's graph (dedupe by path+span).
  const seen = new Set<string>();
  const out: WorkspaceSymbol[] = [];
  for (const doc of documents.all()) {
    if (!doc.uri.endsWith(".mochi")) continue;
    const path = docPath(doc.uri);
    const syms = await workspaceSymbolsAt(path, query, read, doc.getText());
    for (const s of syms) {
      const k = `${s.path}:${s.span.start}:${s.name}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const { uri, range } = await rangeAtPath(s.path, s.span);
      out.push({ name: s.name, kind: symbolKind(s.kind), location: { uri, range } });
    }
  }
  return out;
});

/** Quick fixes from Diagnostic.suggestions (recomputed — LSP does not round-trip them). */
connection.onCodeAction(async ({ textDocument }): Promise<CodeAction[]> => {
  const doc = documents.get(textDocument.uri);
  if (!doc) return [];
  const path = docPath(textDocument.uri);
  const published = await moduleDiagnostics(path, doc.getText(), read);
  const actions: CodeAction[] = [];
  for (const d of published) {
    for (const s of d.suggestions ?? []) {
      actions.push({
        title: s.title,
        kind: CodeActionKind.QuickFix,
        edit: {
          changes: {
            [uriOf(s.path || path)]: [TextEdit.replace(s.range, s.replaceWith)],
          },
        },
      });
    }
  }
  return actions;
});

/** Run `format(src)` on the document; return a single full-document replacement edit. */
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

const validate = async (doc: TextDocument): Promise<void> => {
  const path = docPath(doc.uri);
  const computed = await moduleDiagnostics(path, doc.getText(), read);
  const diags: Diagnostic[] = computed.map((d) => ({
    range: d.range,
    message: d.message,
    severity: DiagnosticSeverity.Error,
    source: "mochi",
    relatedInformation: d.related?.map((r) => ({
      message: r.message,
      location: {
        uri: uriOf(r.path),
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

/** Serve the virtual prelude buffer when the client opens a `mochi:` Location. */
connection.workspace.textDocumentContent.on((params) => {
  if (params.uri === PRELUDE_PATH || params.uri.startsWith("mochi:")) {
    return { text: preludeVirtualSource() };
  }
  return null;
});

connection.listen();
