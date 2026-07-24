// VS Code / Cursor extension entry point. Spawns the bundled mochi language
// server over IPC and wires it to `.mochi` documents.
import * as path from "node:path";
import { commands, type ExtensionContext, languages, workspace } from "vscode";
import {
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext): void {
  const module = context.asAbsolutePath(path.join("out", "server.js"));
  const serverOptions: ServerOptions = {
    run: { module, transport: TransportKind.ipc },
    debug: { module, transport: TransportKind.ipc },
  };
  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: "file", language: "mochi" },
      { scheme: "mochi", language: "mochi" }, // virtual prelude (DX slice 9)
    ],
  };
  client = new LanguageClient("mochi", "mochi language server", serverOptions, clientOptions);
  client.start();

  // Content-provider docs often open as plaintext; force mochi language + grammar.
  context.subscriptions.push(
    workspace.onDidOpenTextDocument((doc) => {
      if (doc.uri.scheme === "mochi" && doc.languageId !== "mochi") {
        void languages.setTextDocumentLanguage(doc, "mochi");
      }
    }),
    commands.registerCommand("mochi.restartLsp", () => client?.restart()),
  );
}

export const deactivate = (): Thenable<void> | undefined => client?.stop();
