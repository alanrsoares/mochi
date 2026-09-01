/**
 * mochi language server. A thin adapter: it re-runs the compiler on every edit
 * and republishes the resulting diagnostics. All real logic lives in the
 * compiler; this file only speaks LSP.
 */
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createBootstrapRecoveryGraphCache } from "@mochi/compiler/bootstrap";
import type { LanguagePlugin } from "@mochi/compiler/extensions";
import { createModuleCache } from "@mochi/compiler/module";
import { isPreludePath, PRELUDE_PATH, preludeVirtualSource } from "@mochi/compiler/prelude-virtual";
import type { Span } from "@mochi/compiler/span";
import { moduleBootstrapHoverAt } from "@mochi/dx/bootstrap-hover";
import { bootstrapDocumentSymbolsAt } from "@mochi/dx/bootstrap-symbols";
import { type CompletionItem as MochiCompletion, moduleCompleteAt } from "@mochi/dx/complete";
import {
  bootstrapModuleDiagnostics,
  documentDiagnostics,
  type PublishDiagnostic,
  unusedBindingDiagnostics,
} from "@mochi/dx/diagnostics";
import { format } from "@mochi/dx/format";
import { moduleHoverAt } from "@mochi/dx/hover";
import {
  documentSymbolsAt,
  moduleDefinitionAt,
  moduleHighlightsAt,
  modulePathLinksAt,
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
  type LocationLink,
  MarkupKind,
  type Position,
  ProposedFeatures,
  type Range,
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
 * `documentDiagnostics`, retained so `onCodeAction` can read `.suggestions`
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

/** Keystroke coalescing window for `validate`, in milliseconds. */
const VALIDATE_DEBOUNCE_MS = 150;

/** Strictly-earlier document position. */
const before = (a: Position, b: Position): boolean =>
  a.line < b.line || (a.line === b.line && a.character < b.character);

/** Ranges share at least a point. Touching endpoints count, so a zero-width
 * cursor parked at either edge of a diagnostic still offers its fixes. */
const overlaps = (a: Range, b: Range): boolean =>
  !before(a.end, b.start) && !before(b.end, a.start);

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

  /** Directories never worth walking for project sources. */
  const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".fixpoint-work", ".cache"]);

  /** How long a workspace file listing stays fresh, in milliseconds. */
  const FILE_LIST_TTL_MS = 5_000;

  let fileListCache: { at: number; files: string[] } | null = null;

  /**
   * Every `.mochi` file under the trusted workspace roots.
   *
   * References and rename need the modules that IMPORT the definition, and the
   * module graph only walks imports downward — so without a project listing a
   * query raised on a definition finds nothing but the definition itself. Cached
   * briefly because both queries are interactive and a cold walk is O(project).
   */
  const collectMochiFiles = async (root: string): Promise<string[]> => {
    const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
    const out: string[] = [];
    for (const e of entries) {
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        out.push(...(await collectMochiFiles(join(root, e.name))));
      } else if (e.isFile() && e.name.endsWith(".mochi")) {
        out.push(join(root, e.name));
      }
    }
    return out;
  };

  const listFiles = async (): Promise<readonly string[]> => {
    const now = Date.now();
    if (fileListCache && now - fileListCache.at < FILE_LIST_TTL_MS) return fileListCache.files;
    const files = (await Promise.all(allowedRoots.map(collectMochiFiles))).flat();
    fileListCache = { at: now, files };
    return files;
  };

  // One memo for the session: a keystroke re-infers the edited buffer, not the
  // whole import graph behind it (ADR 0095). Dropped wholesale when a plugin
  // manifest changes, since that changes what every call site means.
  let cache = createModuleCache();
  let bootstrapCache = createBootstrapRecoveryGraphCache();
  const dxOpts = async (path: string) => ({
    cache,
    bootstrapCache: bootstrapCache.types,
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
  const diagnosticsFor = async (path: string, src: string) => {
    const opts = await dxOpts(path);
    // Vendor plugins execute in the TypeScript host. Builtin-only workspaces
    // validate their full graph through the shipped bootstrap compiler.
    if (opts.plugins === undefined) {
      const bootstrap = await bootstrapModuleDiagnostics(path, src, read, bootstrapCache);
      return [...bootstrap, ...unusedBindingDiagnostics(src, path)];
    }
    return documentDiagnostics(path, src, read, { cache: opts.cache, plugins: opts.plugins });
  };
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
    const dx = await dxOpts(path);
    const bootstrap =
      dx.plugins === undefined
        ? await moduleBootstrapHoverAt(
            path,
            doc.getText(),
            doc.offsetAt(position),
            read,
            dx.bootstrapCache,
          )
        : null;
    const result =
      bootstrap ?? (await moduleHoverAt(path, doc.getText(), doc.offsetAt(position), read, dx));
    if (!result) return null;
    const fence = `\`\`\`mochi\n${result.code}\n\`\`\``;
    const value = result.doc ? `${fence}\n\n${result.doc}` : fence;
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
    async ({
      textDocument,
      position,
    }: TextDocumentPositionParams): Promise<Location | LocationLink[] | null> => {
      const doc = documents.get(textDocument.uri);
      if (!doc) return null;
      const path = docPath(textDocument.uri);
      const offset = doc.offsetAt(position);
      const pathLink = modulePathLinksAt(doc.getText(), path).find(
        (link) => link.span.start <= offset && offset <= link.span.end,
      );
      if (pathLink) {
        const target = await rangeAtPath(pathLink.target.path, pathLink.target.span);
        return [
          {
            originSelectionRange: rangeOf(doc, pathLink.span),
            targetUri: target.uri,
            targetRange: target.range,
            targetSelectionRange: target.range,
          },
        ];
      }
      const loc = await moduleDefinitionAt(path, doc.getText(), offset, read);
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
    const refs = await moduleReferencesAt(
      path,
      doc.getText(),
      doc.offsetAt(position),
      read,
      listFiles,
    );
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
    const edits = await moduleRenameAt(
      path,
      doc.getText(),
      doc.offsetAt(position),
      newName,
      read,
      listFiles,
    );
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
  connection.onDocumentSymbol(async ({ textDocument }): Promise<DocumentSymbol[]> => {
    const doc = documents.get(textDocument.uri);
    const dx = doc ? await dxOpts(docPath(textDocument.uri)) : null;
    const symbols =
      doc && dx?.plugins === undefined ? bootstrapDocumentSymbolsAt(doc.getText()) : null;
    return !doc
      ? []
      : (symbols ?? documentSymbolsAt(doc.getText())).map((s) => ({
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
   * code action arrives before the first `validate` (rare). Only diagnostics
   * overlapping the requested range contribute: the lightbulb answers for the
   * cursor, not for the whole file. */
  connection.onCodeAction(async ({ textDocument, range }): Promise<CodeAction[]> => {
    const doc = documents.get(textDocument.uri);
    if (!doc) return [];
    const path = docPath(textDocument.uri);
    let published = diagnosticsCache.get(textDocument.uri);
    if (!published) {
      published = await diagnosticsFor(path, doc.getText());
      diagnosticsCache.set(textDocument.uri, published);
    }
    const actions: CodeAction[] = [];
    for (const d of published) {
      if (!overlaps(d.range, range)) continue;
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
    // Pin the version this batch describes: compiling the graph is async, and
    // an edit that lands mid-flight makes every range below stale.
    const version = doc.version;
    const text = doc.getText();
    const computed = await diagnosticsFor(path, text);
    // Buffer moved on (or closed) while we compiled — drop this batch rather
    // than racing the newer one. The edit that superseded it publishes its own.
    if (documents.get(doc.uri)?.version !== version) return;
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
    connection.sendDiagnostics({ uri: doc.uri, version, diagnostics: diags });
  };

  /** Pending debounced validations, keyed by URI. */
  const pendingValidations = new Map<string, ReturnType<typeof setTimeout>>();

  const cancelValidation = (uri: string): void => {
    const timer = pendingValidations.get(uri);
    if (timer === undefined) return;
    clearTimeout(timer);
    pendingValidations.delete(uri);
  };

  /**
   * Coalesce a burst of keystrokes into one compile. Every change otherwise
   * re-reads and re-checks the whole import graph, so typing a word costs one
   * graph compile per character.
   */
  const scheduleValidate = (doc: TextDocument): void => {
    cancelValidation(doc.uri);
    pendingValidations.set(
      doc.uri,
      setTimeout(() => {
        pendingValidations.delete(doc.uri);
        const current = documents.get(doc.uri);
        if (current) void validate(current);
      }, VALIDATE_DEBOUNCE_MS),
    );
  };

  documents.onDidChangeContent((e) => {
    scheduleValidate(e.document);
  });
  documents.onDidClose((e) => {
    cancelValidation(e.document.uri);
    diagnosticsCache.delete(e.document.uri);
    // Nothing checks this buffer any more — retract its squiggles instead of
    // leaving them in the client's problem list forever.
    connection.sendDiagnostics({ uri: e.document.uri, diagnostics: [] });
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
    cache = createModuleCache();
    bootstrapCache = createBootstrapRecoveryGraphCache();
    for (const doc of documents.all()) {
      if (doc.uri.endsWith(".mochi")) scheduleValidate(doc);
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
