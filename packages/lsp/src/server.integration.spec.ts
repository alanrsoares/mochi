import { test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

type LspServer = {
  readonly process: Bun.Subprocess<"pipe", "pipe", "pipe">;
  send: (message: unknown) => void;
  waitFor: (text: string) => Promise<string>;
};

const waitFor = async (
  read: () => string,
  text: string,
  wake: () => Promise<void>,
): Promise<string> => {
  for (let attempts = 0; attempts < 20; attempts += 1) {
    const output = read();
    if (output.includes(text)) return output;
    await Promise.race([
      wake(),
      new Promise<void>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timed out waiting for LSP output containing ${text}: ${read()}`)),
          1_000,
        ),
      ),
    ]);
  }
  throw new Error(`Timed out waiting for LSP output containing ${text}`);
};

const startLsp = (): LspServer => {
  const child = Bun.spawn([process.execPath, "packages/lsp/src/server.ts", "--stdio"], {
    cwd: join(import.meta.dir, "../../.."),
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  let output = "";
  const waiters: Array<() => void> = [];
  const decoder = new TextDecoder();
  void (async () => {
    for await (const chunk of child.stdout) {
      output += decoder.decode(chunk, { stream: true });
      for (const waiter of waiters.splice(0)) waiter();
    }
  })();
  void (async () => {
    for await (const chunk of child.stderr) {
      output += decoder.decode(chunk, { stream: true });
      for (const waiter of waiters.splice(0)) waiter();
    }
  })();
  return {
    process: child,
    send: (message) => {
      const body = JSON.stringify(message);
      child.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
    },
    waitFor: (text) =>
      waitFor(
        () => output,
        text,
        () =>
          new Promise((resolve) => {
            waiters.push(resolve);
          }),
      ),
  };
};

test("watched plugin manifests reload diagnostics without an LSP restart", async () => {
  const root = mkdtempSync(join(import.meta.dir, ".server-plugins-"));
  const manifest = join(root, "mochi.plugins.mjs");
  const source = join(root, "app.mochi");
  const uri = pathToFileURL(source).href;
  const server = startLsp();
  try {
    writeFileSync(manifest, "export default [];\n");
    writeFileSync(source, "let value = dynamic() + 1\n");
    server.send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        rootUri: pathToFileURL(root).href,
        capabilities: { workspace: {} },
        initializationOptions: { loadProjectPlugins: true, workspaceRoots: [root] },
      },
    });
    await server.waitFor('"id":1');
    server.send({ jsonrpc: "2.0", method: "initialized", params: {} });
    server.send({
      jsonrpc: "2.0",
      method: "textDocument/didOpen",
      params: {
        textDocument: { uri, languageId: "mochi", version: 1, text: "let value = dynamic() + 1\n" },
      },
    });
    server.send({
      jsonrpc: "2.0",
      method: "textDocument/didChange",
      params: {
        textDocument: { uri, version: 2 },
        contentChanges: [{ text: "let value = dynamic() + 1\n" }],
      },
    });
    await server.waitFor("unbound variable 'dynamic'");

    writeFileSync(
      manifest,
      [
        "export default [{",
        '  name: "dynamic-as-string",',
        '  inferCall: { refs: ["dynamic"], hook: () => ({ _tag: "Ok", value: { kind: "con", name: "string", args: [] } }) },',
        "}];",
        "",
      ].join("\n"),
    );
    server.send({
      jsonrpc: "2.0",
      method: "workspace/didChangeWatchedFiles",
      params: { changes: [{ uri: pathToFileURL(manifest).href, type: 2 }] },
    });
    await server.waitFor("cannot unify number with string");
  } finally {
    server.process.kill();
    await server.process.exited;
    rmSync(root, { recursive: true, force: true });
  }
});
