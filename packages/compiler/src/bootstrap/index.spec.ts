import { expect, test } from "bun:test";
import { join } from "node:path";
import { repoRoot } from "@mochi/test-support";
import { unwrapOk } from "@onrails/result";
import { compile as tsCompile } from "../compile/compile.ts";
import { buildModules as tsBuildModules } from "../module/module.ts";
import {
  checkGraphBootstrapRecovering,
  createBootstrapGraphCache,
  inferEntryGraphTypesBootstrap,
  loadBootstrapCore,
} from "./index.ts";
import { inferTypesBootstrapSync } from "./sync.ts";

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

test("bootstrap typed query records source spans", () => {
  const result = inferTypesBootstrapSync("let answer = 42");
  expect(result).toEqual({
    _tag: "Ok",
    value: expect.objectContaining({
      types: expect.arrayContaining([
        expect.objectContaining({ span: { start: 13, end: 15 }, display: "number" }),
      ]),
    }),
  });
});

test("bootstrap runtime builds a module graph identically to the TS oracle", async () => {
  const root = repoRoot(import.meta.url);
  const entry = join(root, "examples/modules/main.mochi");
  const bootstrap = await loadBootstrapCore();

  const expected = unwrapOk(await tsBuildModules(entry, (path) => Bun.file(path).text()));
  expect(bootstrap.buildModules(entry)).toEqual({
    _tag: "Ok",
    value: expected.map((output) => ({
      ...output,
      js: output.js.replace(/(from\s+["'][^"']+)\.js(["'])/g, "$1.mochi$2"),
    })),
  });
});

test("bootstrap graph typed query serves the entry buffer", async () => {
  const result = await inferEntryGraphTypesBootstrap(
    "/virtual/main.mochi",
    'import { value } from "./dep"\nlet answer = value',
    async (path) => {
      if (path === "/virtual/dep.mochi") return "export let value = 42";
      throw new Error(`unexpected read: ${path}`);
    },
  );
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

test("bootstrap graph typed-query cache keys every dependency source", async () => {
  const cache = createBootstrapGraphCache();
  const entry = "/virtual/main.mochi";
  const src = 'import { value } from "./dep"\nlet answer = value';
  let dep = "export let value = 42";
  const read = async (path: string): Promise<string> => {
    if (path === "/virtual/dep.mochi") return dep;
    throw new Error(`unexpected read: ${path}`);
  };

  const first = await inferEntryGraphTypesBootstrap(entry, src, read, cache);
  const again = await inferEntryGraphTypesBootstrap(entry, src, read, cache);
  expect(again).toBe(first);
  expect(cache.entries).toHaveLength(1);
  expect(cache.prefixes).toHaveLength(2);

  const peer = await inferEntryGraphTypesBootstrap(
    "/virtual/peer.mochi",
    'import { value } from "./dep"\nlet peer = value',
    read,
    cache,
  );
  expect(peer).toMatchObject({ _tag: "Ok" });
  // The dependency state is the shared prefix; only the peer entry adds one.
  expect(cache.prefixes).toHaveLength(3);

  dep = 'export let value = "changed"';
  const changed = await inferEntryGraphTypesBootstrap(entry, src, read, cache);
  expect(changed).not.toBe(first);
  expect(cache.entries).toHaveLength(3);
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

test("bootstrap graph recovery preserves multiple entry parse diagnostics", async () => {
  const errors = await checkGraphBootstrapRecovering(
    "/virtual/main.mochi",
    "let =\nlet =\n",
    async () => "",
  );
  expect(errors).toHaveLength(2);
});

test("bootstrap graph recovery reports dependency parse diagnostics", async () => {
  const root = "/virtual/main.mochi";
  const errors = await checkGraphBootstrapRecovering(
    root,
    'import { value } from "./dep"\n',
    async (path) => {
      if (path === "/virtual/dep.mochi") return "let =\nlet =\n";
      throw new Error(`unexpected read: ${path}`);
    },
  );
  expect(errors).toHaveLength(2);
  expect(errors[0]?.path).toBe("/virtual/dep.mochi");
});

test("bootstrap graph recovery reports an import cycle", async () => {
  const errors = await checkGraphBootstrapRecovering(
    "/virtual/main.mochi",
    'import { value } from "./dep"\nexport let main = value\n',
    async (path) => {
      if (path === "/virtual/dep.mochi")
        return 'import { main } from "./main"\nexport let value = main\n';
      throw new Error(`unexpected read: ${path}`);
    },
  );
  expect(errors).toEqual([
    {
      message: "import cycle through '/virtual/main.mochi'",
      start: 0,
      end: 0,
      path: "/virtual/main.mochi",
    },
  ]);
});

test("bootstrap graph recovery reports dependency semantic diagnostics", async () => {
  const root = "/virtual/main.mochi";
  const errors = await checkGraphBootstrapRecovering(
    root,
    'import { value } from "./dep"\n',
    async (path) => {
      if (path === "/virtual/dep.mochi") return 'let value = add(1, "bad")\n';
      throw new Error(`unexpected read: ${path}`);
    },
  );
  expect(errors).toHaveLength(1);
  expect(errors[0]?.path).toBe("/virtual/dep.mochi");
  expect(errors[0]?.message).toContain("unify");
});

test("bootstrap graph recovery collects semantic errors from sibling dependencies", async () => {
  const root = "/virtual/main.mochi";
  const errors = await checkGraphBootstrapRecovering(
    root,
    'import { left } from "./left"\nimport { right } from "./right"\n',
    async (path) => {
      if (path === "/virtual/left.mochi") return 'let left = add(1, "bad")\n';
      if (path === "/virtual/right.mochi") return 'let right = add(1, "bad")\n';
      throw new Error(`unexpected read: ${path}`);
    },
  );
  expect(errors).toHaveLength(2);
  expect(errors.every((error) => error.path)).toBe(true);
});

test("bootstrap graph recovery keeps entry errors after a dependency fails", async () => {
  const errors = await checkGraphBootstrapRecovering(
    "/virtual/main.mochi",
    'import { value } from "./dep"\nlet local = add(1, "bad")\n',
    async () => 'let value = add(1, "bad")\n',
  );
  expect(errors).toHaveLength(2);
  expect(errors.some((error) => error.path === "/virtual/dep.mochi")).toBe(true);
  expect(errors.some((error) => error.path === "/virtual/main.mochi")).toBe(true);
});
