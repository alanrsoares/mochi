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

test("bootstrap runtime builds a module graph identically to the TS oracle", async () => {
  const root = repoRoot(import.meta.url);
  const entry = join(root, "examples/modules/main.mochi");
  const bootstrap = await loadBootstrapCore();

  expect(bootstrap.buildModules(entry)).toEqual({
    _tag: "Ok",
    value: unwrapOk(await tsBuildModules(entry, (path) => Bun.file(path).text())),
  });
});
