import { expect, test } from "bun:test";
import { join } from "node:path";
import { repoRoot } from "@mochi/test-support";
import { unwrapOk } from "@onrails/result";
import { buildModules as tsBuildModules } from "../module/module.ts";
import { buildModulesBootstrap, inferGraphTypesBootstrap } from "./module.ts";
import { lex, parse } from "./syntax.ts";

const parseBootstrap = (source: string): unknown => {
  const tokens = lex(source) as { _tag: string; value?: unknown };
  expect(tokens._tag).toBe("Ok");
  const stmts = parse(tokens.value) as { _tag: string; value?: unknown };
  expect(stmts._tag).toBe("Ok");
  return stmts.value;
};

test("bundled bootstrap module graph matches the TypeScript driver", async () => {
  const entry = join(repoRoot(import.meta.url), "examples/modules/main.mochi");
  const bootstrap = buildModulesBootstrap(entry);
  const oracle = await tsBuildModules(entry, (path) => Bun.file(path).text());
  expect(bootstrap).toEqual({
    _tag: "Ok",
    value: unwrapOk(oracle).map((output) => ({
      ...output,
      js: output.js.replace(/(from\s+["'][^"']+)\.js(["'])/g, "$1.mochi$2"),
    })),
  });
});

test("bundled graph facade preserves Mochi sibling imports", () => {
  const result = buildModulesBootstrap(
    join(repoRoot(import.meta.url), "examples/modules/main.mochi"),
  );
  expect(unwrapOk(result).some((output) => output.js.includes('from "./geometry.mochi"'))).toBe(
    true,
  );
});

test("bundled graph query preserves inferred spans across imports", () => {
  const result = inferGraphTypesBootstrap([
    { path: "/virtual/dep.mochi", stmts: parseBootstrap("export let value = 1") },
    {
      path: "/virtual/main.mochi",
      stmts: parseBootstrap('import { value } from "./dep"\nlet answer = value'),
    },
  ]);
  expect(result).toEqual({
    _tag: "Ok",
    value: expect.arrayContaining([
      expect.objectContaining({
        path: "/virtual/main.mochi",
        types: expect.arrayContaining([
          expect.objectContaining({ span: { start: 43, end: 48 }, display: "number" }),
        ]),
      }),
    ]),
  });
});
