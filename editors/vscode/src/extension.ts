// VS Code / Cursor extension entry point. Spawns the bundled mochi language
// server over IPC and wires it to `.mochi` documents.
import * as path from "node:path";
import { commands, type ExtensionContext } from "vscode";
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
    documentSelector: [{ scheme: "file", language: "mochi" }],
  };
  client = new LanguageClient("mochi", "mochi language server", serverOptions, clientOptions);
  client.start();

  context.subscriptions.push(
    commands.registerCommand("mochi.restartLsp", () => client?.restart())
  );
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop();
}
