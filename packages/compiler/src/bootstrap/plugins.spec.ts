import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildModulesBootstrapWith } from "./module.ts";
import {
  type BootstrapInferCallHook,
  type BootstrapOptions,
  type BootstrapPlugin,
  defaultBootstrapOptions,
} from "./options.ts";
import { compileBootstrapSyncWith } from "./sync.ts";

// A host plugin in the self-hosted shape (ADR 0109): claims `magic(…)` calls
// and types them as `number`, so an otherwise unbound name compiles.
const claimMagic: BootstrapInferCallHook = (fn, _args, _origin, st) => {
  const ref = fn as { _tag: string; name?: string };
  return ref._tag === "ERef" && ref.name === "magic"
    ? {
        _tag: "Ok",
        value: { _tag: "Some", value: [{ _tag: "TyCon", name: "number", args: [] }, st] },
      }
    : { _tag: "Ok", value: { _tag: "None" } };
};

const magicPlugin: BootstrapPlugin = {
  name: "magic",
  parse: { _tag: "None" },
  inferCall: { _tag: "Some", value: claimMagic },
};

const withPlugins = (plugins?: readonly BootstrapPlugin[]): BootstrapOptions => ({
  ...defaultBootstrapOptions,
  plugins,
});

const magicSrc = 'export let n : number = magic("x")\n';

test("a host inferCall plugin types calls the core cannot", () => {
  expect(compileBootstrapSyncWith(magicSrc, withPlugins())._tag).toBe("Err");
  const res = compileBootstrapSyncWith(magicSrc, withPlugins([magicPlugin]));
  expect(res._tag).toBe("Ok");
  if (res._tag === "Ok") expect(res.value).toContain('magic("x")');
});

test("an empty plugin list opts out of the builtin JSX plugin", () => {
  const src = "export let v = <div />\n";
  expect(compileBootstrapSyncWith(src, { ...withPlugins(), open: true })._tag).toBe("Ok");
  const res = compileBootstrapSyncWith(src, { ...withPlugins([]), open: true });
  expect(res._tag === "Err" && res.error[0]?.kind).toBe("parse");
});

const dir = mkdtempSync(join(tmpdir(), "mochi-bootstrap-plugins-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

test("graph builds hand the plugin list to every module", () => {
  writeFileSync(join(dir, "dep.mochi"), magicSrc);
  writeFileSync(join(dir, "main.mochi"), 'import { n } from "./dep.mochi"\nexport let m = n + 1\n');
  const entry = join(dir, "main.mochi");
  expect(buildModulesBootstrapWith(entry, withPlugins())._tag).toBe("Err");
  const res = buildModulesBootstrapWith(entry, withPlugins([magicPlugin]));
  expect(res._tag).toBe("Ok");
  if (res._tag === "Ok")
    expect(res.value.map((m) => m.path.split("/").pop())).toEqual(["dep.mochi", "main.mochi"]);
});
