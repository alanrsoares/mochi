// VS Code / Cursor extension entry point. Spawns the bundled mochi language
// server and wires it to `.mochi` documents.
//
// The server is a CJS bundle, but the frozen seed it loads (`bootstrap/seed/*.bundle.cjs`)
// is Bun's module format. Electron's Node cannot execute that, so the server
// runs under Bun. Stdio, not Node IPC: Bun is spawned, not forked.
import { existsSync } from "node:fs";
import { homedir } from "node:os";
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
    "mochi: vendor plugins (mochi.plugins.ts) are disabled in Restricted Mode. Trust the workspace to enable them.",
  );
};

/** Absolute `bun` binary. GUI apps often lack `~/.bun/bin` on PATH. */
const resolveBun = (): string | undefined => {
  const fromEnv = process.env.MOCHI_BUN;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const dirs = (process.env.PATH ?? "").split(path.delimiter);
  for (const dir of dirs) {
    const candidate = path.join(dir, "bun");
    if (candidate && existsSync(candidate)) return candidate;
  }
  const fallbacks = [
    path.join(homedir(), ".bun", "bin", "bun"),
    "/opt/homebrew/bin/bun",
    "/usr/local/bin/bun",
  ];
  return fallbacks.find((candidate) => existsSync(candidate));
};

const startLanguageClient = (context: ExtensionContext): void => {
  const bun = resolveBun();
  if (!bun) {
    void window.showErrorMessage(
      "mochi: language server needs Bun. Install it from https://bun.sh, or set MOCHI_BUN to the bun binary.",
    );
    return;
  }
  const module = context.asAbsolutePath(path.join("out", "server.js"));
  const serverOptions: ServerOptions = {
    run: { module, runtime: bun, transport: TransportKind.stdio },
    debug: { module, runtime: bun, transport: TransportKind.stdio },
  };
  // Forward mochi.plugins.ts / .mjs create/change/delete events so the server
  // can hot-reload the vendor-plugin list without an LSP restart.
  const pluginWatcher = workspace.createFileSystemWatcher("**/mochi.plugins.{ts,mjs}");
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
