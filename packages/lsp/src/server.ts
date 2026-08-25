/**
 * mochi language server. A thin adapter: it re-runs the compiler on every edit
 * and republishes the resulting diagnostics. All real logic lives in the
 * compiler; this file only speaks LSP.
 */
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { LanguagePlugin } from "@mochi/compiler/extensions";
import { isPreludePath, PRELUDE_PATH, preludeVirtualSource } from "@mochi/compiler/prelude-virtual";
import type { Span } from "@mochi/compiler/span";
import { type CompletionItem as MochiCompletion, moduleCompleteAt } from "@mochi/dx/complete";
import {
  moduleDiagnostics,
  type PublishDiagnostic,
  unusedLocalDiagnostics,
} from "@mochi/dx/diagnostics";
import { format } from "@mochi/dx/format";
import { moduleHoverAt } from "@mochi/dx/hover";
import {
  documentSymbolsAt,
  moduleDefinitionAt,
  moduleHighlightsAt,
  modulePrepareRenameAt,
  moduleReferencesAt,
  moduleRenameAt,
  moduleTypeDefinitionAt,
  workspaceSymbolsAt,
} from "@mochi/dx/nav";
import { isOk } from "@onrails/result";
import {
  type CodeAction,
  CodeActionKind,
  type CompletionItem,
  CompletionItemKind,
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
import { clearPluginsCache, PLUGIN_FILENAMES, pluginsForDocument } from "./load-plugins.ts";

/** Client → server init payload (editor extension). */
export type MochiInitOptions = {
  /** Load `mochi.plugins.ts` when true (requires trusted workspace on client). */
  loadProjectPlugins?: boolean;
  /** Workspace folder roots — manifests must resolve under one of these. */
  workspaceRoots?: string[];
};

/** Cached diagnostics for a document, keyed by URI — the raw result of
 * `moduleDiagnostics`, retained so `onCodeAction` can read `.suggestions`
 * without re-running the compiler on every lightbulb request. */
export type CachedDiagnostics = PublishDiagnostic[];

/** Options for {@link startServer}. */
export type ServerOptions = {
  /** Fixed plugin list (tests / custom launchers). Overrides project discovery. */
  plugins?: LanguagePlugin[];
  /** Load `mochi.plugins.ts` upward from each open file (default false). */
  loadProjectPlugins?: boolean;
};

const docPath = (uri: string): string => (uri.startsWith("file:") ? fileURLToPath(uri) : uri);

const uriOf = (path: string): string =>
  isPreludePath(path) ? PRELUDE_PATH : pathToFileURL(path).href;

const rangeOf = (doc: TextDocument, span: Span) => ({
  start: doc.positionAt(span.start),
  end: doc.positionAt(span.end),
});

const read = (p: string): Promise<string> => readFile(p, "utf8");

const symbolKind = (kind: string): SymbolKind => {
  switch (kind) {
    case "type":
      return SymbolKind.Class;
    case "ctor":
      return SymbolKind.EnumMember;
    case "extern":
      return SymbolKind.Function;
  }
  return SymbolKind.Variable;
};

/**
 * Wire the LSP connection and start listening. `opts.plugins` is the
 * project's vendor-plugin list (styled-cva, …) — the same list the project's
 * Vite plugin / `gen-mochi-dts` script pass to `compile`/`emitDts`. This file
 * never imports a concrete plugin: the caller (a project's LSP launcher, or
 * #20's shared plugin-list module) supplies it, so hover/diagnostics stop
 * lying about a `tw.*` factory's type relative to what Vite actually emits.
 * Omitted `plugins` resolves to the default/builtin list; `[]` is the hard
 * opt-out (`resolvePlugins`, ADR 0011).
 */
export function startServer(opts: ServerOptions = {}): void {
  const fixedPlugins = opts.plugins;
  let loadProjectPlugins = opts.loadProjectPlugins === true && fixedPlugins === undefined;
  let allowedRoots: string[] = [];
  const dxOpts = async (path: string) => ({
    plugins: loadProjectPlugins
      ? await pluginsForDocument(path, {
          allowedRoots,
          onError: (file, error) => {
            const message = error instanceof Error ? error.message : String(error);
            connection.console.error(
              `mochi: failed to load plugins from ${file}: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
            );
            connection.window.showWarningMessage(
              `mochi: failed to load plugins from ${file}: ${message} — falling back to builtin plugins`,
            );
          },
        })
      : fixedPlugins,
  });
  const connection = createConnection(ProposedFeatures.all);
  const documents = new TextDocuments(TextDocument);
  /** Last diagnostics computed by `validate`, per document URI — see
   * {@link CachedDiagnostics}. Written on every `validate` call (so staleness
   * matches published diagnostics exactly) and deleted on document close. */
  const diagnosticsCache = new Map<string, CachedDiagnostics>();

  connection.onInitialize((params) => {
    const init = params.initializationOptions as MochiInitOptions | undefined;
    if (fixedPlugins === undefined) {
      loadProjectPlugins = init?.loadProjectPlugins === true;
    }
    allowedRoots =
      init?.workspaceRoots ?? params.workspaceFolders?.map((f) => fileURLToPath(f.uri)) ?? [];
    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        hoverProvider: true,
        completionProvider: { triggerCharacters: [".", '"', "'", "=", " "] },
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
    };
  });

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

  /** Map cursor Position → byte offset → inferred type at that node. */
  connection.onHover(async ({ textDocument, position }): Promise<Hover | null> => {
    const doc = documents.get(textDocument.uri);
    if (!doc) return null;
    const path = docPath(textDocument.uri);
    const info = await moduleHoverAt(
      path,
      doc.getText(),
      doc.offsetAt(position),
      read,
      await dxOpts(path),
    );
    if (!info) return null;
    const fence = `\`\`\`mochi\n${info.code}\n\`\`\``;
    const value = info.doc ? `${fence}\n\n${info.doc}` : fence;
    return { contents: { kind: MarkupKind.Markdown, value } };
  });

  const lspCompletionKind = (kind: MochiCompletion["kind"]): CompletionItemKind => {
    switch (kind) {
      case "method":
        return CompletionItemKind.Method;
      case "literal":
        return CompletionItemKind.EnumMember;
      case "field":
      case "member":
        return CompletionItemKind.Field;
      case "ctor":
        return CompletionItemKind.EnumMember;
      case "type":
        return CompletionItemKind.Class;
    }
    return CompletionItemKind.Variable;
  };

  /** Completions at cursor — namespaces, record fields, plugin members, top-level values. */
  connection.onCompletion(async ({ textDocument, position }): Promise<CompletionItem[]> => {
    const doc = documents.get(textDocument.uri);
    if (!doc) return [];
    const path = docPath(textDocument.uri);
    const items = await moduleCompleteAt(
      path,
      doc.getText(),
      doc.offsetAt(position),
      read,
      await dxOpts(path),
    );
    return items.map((i) => ({
      label: i.label,
      kind: lspCompletionKind(i.kind),
      detail: i.detail,
    }));
  });

  /** Go-to-definition (cross-module via export origins). */
  connection.onDefinition(
    async ({ textDocument, position }: TextDocumentPositionParams): Promise<Location | null> => {
      const doc = documents.get(textDocument.uri);
      if (!doc) return null;
      const path = docPath(textDocument.uri);
      const loc = await moduleDefinitionAt(path, doc.getText(), doc.offsetAt(position), read);
      return !loc ? null : rangeAtPath(loc.path, loc.span);
    },
  );

  /** Go-to-type: nominal type of the expression under the cursor (needs infer). */
  connection.onTypeDefinition(
    async ({ textDocument, position }: TextDocumentPositionParams): Promise<Location | null> => {
      const doc = documents.get(textDocument.uri);
      if (!doc) return null;
      const path = docPath(textDocument.uri);
      const loc = await moduleTypeDefinitionAt(
        path,
        doc.getText(),
        doc.offsetAt(position),
        read,
        await dxOpts(path),
      );
      return !loc ? null : rangeAtPath(loc.path, loc.span);
    },
  );

  /** Document highlight: occurrences in the current file. */
  connection.onDocumentHighlight(
    async ({ textDocument, position }): Promise<DocumentHighlight[]> => {
      const doc = documents.get(textDocument.uri);
      if (!doc) return [];
      const path = docPath(textDocument.uri);
      const hits = await moduleHighlightsAt(path, doc.getText(), doc.offsetAt(position), read);
      return hits.map((h) => ({
        range: rangeOf(doc, h.span),
        kind: h.role === "def" ? DocumentHighlightKind.Write : DocumentHighlightKind.Read,
      }));
    },
  );

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
    return !doc
      ? []
      : documentSymbolsAt(doc.getText()).map((s) => ({
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

  /** Quick fixes from Diagnostic.suggestions — read from the cache `validate`
   * populates on every content change, so this doesn't re-run the compiler
   * per lightbulb request. Falls back to computing (and caching) once if a
   * code action arrives before the first `validate` (rare). */
  connection.onCodeAction(async ({ textDocument }): Promise<CodeAction[]> => {
    const doc = documents.get(textDocument.uri);
    if (!doc) return [];
    const path = docPath(textDocument.uri);
    let published = diagnosticsCache.get(textDocument.uri);
    if (!published) {
      published = await moduleDiagnostics(path, doc.getText(), read, await dxOpts(path));
      diagnosticsCache.set(textDocument.uri, published);
    }
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

  /** Run `format` on the document — with the server's plugins, so sugar a plugin owns (JSX) re-folds here exactly as `mochi fmt` does — and return a single full-document replacement edit. */
  connection.onDocumentFormatting(async ({ textDocument }): Promise<TextEdit[]> => {
    const doc = documents.get(textDocument.uri);
    if (!doc) return [];
    const path = docPath(textDocument.uri);
    const text = doc.getText();
    const formatted = format(text, await dxOpts(path));
    if (!isOk(formatted)) return [];
    const fullRange = {
      start: doc.positionAt(0),
      end: doc.positionAt(text.length),
    };
    return [TextEdit.replace(fullRange, formatted.value)];
  });

  const validate = async (doc: TextDocument): Promise<void> => {
    const path = docPath(doc.uri);
    const opts = await dxOpts(path);
    const text = doc.getText();
    const computed = [
      ...(await moduleDiagnostics(path, text, read, opts)),
      ...unusedLocalDiagnostics(text, path, opts),
    ];
    diagnosticsCache.set(doc.uri, computed);
    const diags: Diagnostic[] = computed.map((d) => ({
      range: d.range,
      message: d.message,
      severity: d.severity === "warning" ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error,
      ...(d.code ? { code: d.code } : {}),
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
  documents.onDidClose((e) => {
    diagnosticsCache.delete(e.document.uri);
  });
  documents.listen(connection);

  /**
   * Re-load plugins when `mochi.plugins.ts` (or `.mjs`) changes on disk. The
   * client (vscode-languageclient) owns watcher registration — this handler
   * only reacts to the notification. Clears the module-level cache (and its
   * ESM-cache-busting generation) and republishes diagnostics for every open
   * `.mochi` document so plugin-dependent hover/completion/diagnostics
   * reflect the new manifest without an LSP restart.
   */
  connection.onDidChangeWatchedFiles(({ changes }) => {
    const manifestChanged = changes.some((change) =>
      (PLUGIN_FILENAMES as readonly string[]).includes(basename(fileURLToPath(change.uri))),
    );
    if (!manifestChanged) return;
    clearPluginsCache();
    for (const doc of documents.all()) {
      if (doc.uri.endsWith(".mochi")) void validate(doc);
    }
  });

  /** Serve the virtual prelude buffer when the client opens a `mochi:` Location. */
  connection.workspace.textDocumentContent.on((params) =>
    params.uri === PRELUDE_PATH || params.uri.startsWith("mochi:")
      ? { text: preludeVirtualSource() }
      : null,
  );

  connection.listen();
}

if (import.meta.main) startServer();
