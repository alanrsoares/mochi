import { expect, test } from "bun:test";
import { join } from "node:path";
import { repoRoot } from "@mochi/test-support";
import { unwrapOk } from "@onrails/result";
import { buildModules as tsBuildModules } from "../module/module.ts";
import { buildModulesBootstrap } from "./module.ts";

test("bundled bootstrap module graph matches the TypeScript driver", async () => {
  const entry = join(repoRoot(import.meta.url), "examples/modules/main.mochi");
  const bootstrap = buildModulesBootstrap(entry);
  const oracle = await tsBuildModules(entry, (path) => Bun.file(path).text());
  expect(bootstrap).toEqual({ _tag: "Ok", value: unwrapOk(oracle) });
});
