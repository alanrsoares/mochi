// VS Code / Cursor extension entry point. Spawns the bundled mochi language
// server over IPC and wires it to `.mochi` documents.
import * as path from "node:path";
import {
  commands,
  type ExtensionContext,
  languages,
  type WorkspaceConfiguration,
  window,
  workspace,
} from "vscode";
import {
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

type MochiInitOptions = {
  loadProjectPlugins: boolean;
  workspaceRoots: string[];
};

let client: LanguageClient | undefined;
let warnedRestricted = false;

const buildInitOptions = (): MochiInitOptions => {
  const cfg = workspace.getConfiguration("mochi");
  const wantPlugins = cfg.get<boolean>("loadProjectPlugins", true);
  return {
    loadProjectPlugins: wantPlugins && workspace.isTrusted,
    workspaceRoots: workspace.workspaceFolders?.map((f) => f.uri.fsPath) ?? [],
  };
};

const maybeWarnRestricted = (cfg: WorkspaceConfiguration): void => {
  if (warnedRestricted || workspace.isTrusted || !cfg.get<boolean>("loadProjectPlugins", true)) {
    return;
  }
  warnedRestricted = true;
  void window.showWarningMessage(
    "mochi: vendor plugins (mochi.plugins.mjs) are disabled in Restricted Mode. Trust the workspace to enable them.",
  );
};

const startLanguageClient = (context: ExtensionContext): void => {
  const module = context.asAbsolutePath(path.join("out", "server.js"));
  const serverOptions: ServerOptions = {
    run: { module, transport: TransportKind.ipc },
    debug: { module, transport: TransportKind.ipc, options: { execArgv: ["--nolazy"] } },
  };
  // Forward mochi.plugins.mjs create/change/delete events so the server
  // can hot-reload the vendor-plugin list without an LSP restart.
  const pluginWatcher = workspace.createFileSystemWatcher("**/mochi.plugins.mjs");
  context.subscriptions.push(pluginWatcher);
  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: "file", language: "mochi" },
      { scheme: "mochi", language: "mochi" }, // virtual prelude (DX slice 9)
    ],
    initializationOptions: buildInitOptions(),
    synchronize: { fileEvents: pluginWatcher },
  };
  void client?.stop();
  client = new LanguageClient("mochi", "mochi language server", serverOptions, clientOptions);
  void client.start();
  maybeWarnRestricted(workspace.getConfiguration("mochi"));
};

export function activate(context: ExtensionContext): void {
  startLanguageClient(context);

  context.subscriptions.push(
    workspace.onDidOpenTextDocument((doc) => {
      if (doc.uri.scheme === "mochi" && doc.languageId !== "mochi") {
        void languages.setTextDocumentLanguage(doc, "mochi");
      }
    }),
    workspace.onDidGrantWorkspaceTrust(() => {
      warnedRestricted = false;
      startLanguageClient(context);
    }),
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("mochi.loadProjectPlugins")) startLanguageClient(context);
    }),
    commands.registerCommand("mochi.restartLsp", () => startLanguageClient(context)),
  );
}

export const deactivate = (): Thenable<void> | undefined => client?.stop();
