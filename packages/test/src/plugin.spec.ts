import { expect, test } from "bun:test";
import { compileMochiFile } from "./plugin.ts";

const fixture = (name: string): string => new URL(`./fixtures/${name}`, import.meta.url).pathname;

test("graph compile keeps relative imports as .mochi", async () => {
  const js = await compileMochiFile(fixture("user.mochi"));
  expect(js).toContain('from "./dep.mochi"');
  expect(js).toContain("export const doubled");
  expect(js).not.toContain(".js");
});

test("graph compile threads imported schemes (strict)", async () => {
  const js = await compileMochiFile(fixture("user.mochi"));
  expect(js).toContain("const doubled");
});

test("graph compile fails on unbound names", async () => {
  await expect(compileMochiFile(fixture("unbound.mochi"))).rejects.toThrow(
    /unbound variable 'notAName'/,
  );
});
