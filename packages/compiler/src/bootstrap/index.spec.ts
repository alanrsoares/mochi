import { expect, test } from "bun:test";
import { join } from "node:path";
import { repoRoot } from "@mochi/test-support";
import { unwrapOk } from "@onrails/result";
import { compile as tsCompile } from "../compile/compile.ts";
import { buildModules as tsBuildModules } from "../module/module.ts";
import { checkGraphBootstrapRecovering, loadBootstrapCore } from "./index.ts";

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

  const expected = unwrapOk(await tsBuildModules(entry, (path) => Bun.file(path).text()));
  expect(bootstrap.buildModules(entry)).toEqual({
    _tag: "Ok",
    value: expected.map((output) => ({
      ...output,
      js: output.js.replace(/(from\s+["'][^"']+)\.js(["'])/g, "$1.mochi$2"),
    })),
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
