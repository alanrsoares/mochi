import { expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { isErr } from "@onrails/result";
import { docsRuntimePlugins } from "./vite.config.ts";

test("docs runtime plugins reload from a cleaned-up shadow module", async () => {
  const reload = docsRuntimePlugins.reload;
  expect(reload).toBeDefined();
  if (!reload) return;

  const reloaded = await reload();
  expect(isErr(reloaded)).toBe(false);
  if (isErr(reloaded)) return;

  expect(reloaded.value.name).toBe(docsRuntimePlugins.component.name);

  const files = await readdir(import.meta.dir);
  expect(files.some((file) => file.startsWith(".mochi.plugins.runtime-"))).toBe(false);
});
