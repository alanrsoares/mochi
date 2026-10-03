import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileSyncWith } from "../compile/sync.ts";
import { tNumber } from "../infer/host-types.ts";
import { checkGraphRecovering } from "../module/graph.ts";
import { buildModulesWith } from "../module/host.ts";
import {
  type CompilerInferCallHook,
  type CompilerOptions,
  type CompilerPlugin,
  defaultOptions,
} from "./options.ts";

// A host plugin in the self-hosted shape (ADR 0109): claims `magic(…)` calls
// and types them as `number`, so an otherwise unbound name compiles.
const claimMagic: CompilerInferCallHook = (fn, _args, _origin, st) =>
  fn._tag === "ERef" && fn.name === "magic"
    ? { _tag: "Ok", value: { _tag: "Some", value: [tNumber, st] } }
    : { _tag: "Ok", value: { _tag: "None" } };

const magicPlugin: CompilerPlugin = { name: "magic", inferCall: claimMagic };

const withPlugins = (plugins?: readonly CompilerPlugin[]): CompilerOptions => ({
  ...defaultOptions,
  plugins,
});

const magicSrc = 'export let n : number = magic("x")\n';

test("a host inferCall plugin types calls the core cannot", () => {
  expect(compileSyncWith(magicSrc, withPlugins())._tag).toBe("Err");
  const res = compileSyncWith(magicSrc, withPlugins([magicPlugin]));
  expect(res._tag).toBe("Ok");
  if (res._tag === "Ok") expect(res.value).toContain('magic("x")');
});

test("an empty plugin list opts out of the builtin JSX plugin", () => {
  const src = "export let v = <div />\n";
  expect(compileSyncWith(src, { ...withPlugins(), open: true })._tag).toBe("Ok");
  const res = compileSyncWith(src, { ...withPlugins([]), open: true });
  expect(res._tag === "Err" && res.error[0]?.kind).toBe("parse");
});

test("a hook-less plugin named like a builtin disables it, keeping the rest (ADR 0049)", () => {
  const src = 'export let v = <div />\nexport let n : number = magic("x")\n';
  const withJsx = compileSyncWith(src, { ...withPlugins([magicPlugin]), open: true });
  expect(withJsx._tag).toBe("Ok");
  const res = compileSyncWith(src, {
    ...withPlugins([{ name: "jsx" }, magicPlugin]),
    open: true,
  });
  expect(res._tag === "Err" && res.error[0]?.kind).toBe("parse");
  const noJsx = compileSyncWith(magicSrc, withPlugins([{ name: "jsx" }, magicPlugin]));
  expect(noJsx._tag).toBe("Ok");
});

const dir = mkdtempSync(join(tmpdir(), "mochi-bootstrap-plugins-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

test("graph builds hand the plugin list to every module", () => {
  writeFileSync(join(dir, "dep.mochi"), magicSrc);
  writeFileSync(join(dir, "main.mochi"), 'import { n } from "./dep.mochi"\nexport let m = n + 1\n');
  const entry = join(dir, "main.mochi");
  expect(buildModulesWith(entry, withPlugins())._tag).toBe("Err");
  const res = buildModulesWith(entry, withPlugins([magicPlugin]));
  expect(res._tag).toBe("Ok");
  if (res._tag === "Ok")
    expect(res.value.map((m) => m.path.split("/").pop())).toEqual(["dep.mochi", "main.mochi"]);
});

test("editor graph checks run the plugin list over every module", async () => {
  const entry = join(dir, "main.mochi");
  const read = (path: string) => Bun.file(path).text();
  const src = await read(entry);
  expect(await checkGraphRecovering(entry, src, read)).not.toEqual([]);
  expect(await checkGraphRecovering(entry, src, read, undefined, [magicPlugin])).toEqual([]);
  const single = join(dir, "single.mochi");
  writeFileSync(single, magicSrc);
  expect(await checkGraphRecovering(single, magicSrc, read)).not.toEqual([]);
  expect(await checkGraphRecovering(single, magicSrc, read, undefined, [magicPlugin])).toEqual([]);
});
