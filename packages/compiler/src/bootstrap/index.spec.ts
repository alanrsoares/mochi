import { expect, test } from "bun:test";
import { join } from "node:path";
import { repoRoot } from "@mochi/test-support";
import { unwrapOk } from "@onrails/result";
import { compile as tsCompile } from "../compile/compile.ts";
import { buildModules as tsBuildModules } from "../module/module.ts";
import { loadBootstrapCore } from "./index.ts";

test("bootstrap runtime loads the manifest-verified seed compiler", async () => {
  const src = "type Flag = On | Off\nlet value = On\n";
  const bootstrap = await loadBootstrapCore();

  expect(bootstrap.compile(src)).toEqual({ _tag: "Ok", value: unwrapOk(tsCompile(src)) });
});

test("bootstrap runtime emits typed TypeScript", async () => {
  const bootstrap = await loadBootstrapCore();
  expect(bootstrap.compileTs("let answer = 42", "@mochi/runtime")).toEqual({
    _tag: "Ok",
    value: expect.stringContaining("const answer"),
  });
});

test("bootstrap runtime builds a module graph identically to the TS oracle", async () => {
  const root = repoRoot(import.meta.url);
  const entry = join(root, "examples/modules/main.mochi");
  const bootstrap = await loadBootstrapCore();

  expect(bootstrap.buildModules(entry)).toEqual({
    _tag: "Ok",
    value: unwrapOk(await tsBuildModules(entry, (path) => Bun.file(path).text())),
  });
});

test("bootstrap runtime checks an editor buffer through its graph", async () => {
  const bootstrap = await loadBootstrapCore();
  expect(await bootstrap.checkGraph("/virtual/main.mochi", "let n = nope", async () => "")).toEqual(
    {
      _tag: "Err",
      error: { message: "unbound variable 'nope'", start: 8, end: 12 },
    },
  );
});
