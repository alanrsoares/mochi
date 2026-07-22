// Ticket 0013 (part b) — bootstrap/module.al's compileGraph / buildModules.
// Having loaded the graph (part a) and added the four cross-module seams, we
// now compile a real multi-module program end to end and DIFFERENTIAL-check it
// against the TS driver (src/module.ts): same module order, byte-identical JS
// per module. Then we assert the cross-module gates actually fire — a
// non-exhaustive switch over an IMPORTED variant, and a missing export.

import { beforeAll, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { readFile as fsRead } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { buildModules as tsBuild } from "../src/module";

const root = join(import.meta.dir, "..");

type Out = { path: string; js: string };
type MErr = { message: string; start: number; end: number };
type Res = { _tag: "Ok"; value: Out[] } | { _tag: "Err"; error: MErr };

let buildModules: (entry: string) => Res;

const bases = (outs: Out[]): string[] => outs.map((o) => basename(o.path));

beforeAll(async () => {
  execFileSync("bun", ["src/cli.ts", "build", "bootstrap/cli.al"], { cwd: root });
  const js = execFileSync("bun", ["src/cli.ts", "bootstrap/module.al"], {
    cwd: root,
    encoding: "utf8",
  });
  writeFileSync(join(root, "bootstrap/module.js"), js);
  ({ buildModules } = await import(join(root, "bootstrap/module.js")));
});

test("compiles examples/modules end to end", () => {
  const r = buildModules(join(root, "examples/modules/main.al"));
  expect(r._tag).toBe("Ok");
  if (r._tag !== "Ok") return;
  // geometry before main — dependency order.
  expect(bases(r.value)).toEqual(["geometry.al", "main.al"]);
  for (const o of r.value) expect(o.js.length).toBeGreaterThan(0);
});

test("matches the TS buildModules driver byte for byte", async () => {
  const ts = await tsBuild(join(root, "examples/modules/main.al"), (p) => fsRead(p, "utf8"));
  expect(ts._tag).toBe("Ok");
  const boot = buildModules(join(root, "examples/modules/main.al"));
  expect(boot._tag).toBe("Ok");
  if (ts._tag !== "Ok" || boot._tag !== "Ok") return;

  const tsBy = new Map(ts.value.map((o) => [basename(o.path), o.js]));
  const bootBy = new Map(boot.value.map((o) => [basename(o.path), o.js]));
  expect([...bootBy.keys()].sort()).toEqual([...tsBy.keys()].sort());
  for (const [name, tsJs] of tsBy) expect(bootBy.get(name)).toBe(tsJs);
});

test("cross-module exhaustiveness fires: dropping an imported ctor arm fails", () => {
  const dir = mkdtempSync(join(tmpdir(), "alang-mod-"));
  writeFileSync(
    join(dir, "shapes.al"),
    "export type Shape = Circle(r: number) | Square(s: number)\n",
  );
  // Missing the Square arm — only catchable with shapes' registry imported.
  writeFileSync(
    join(dir, "app.al"),
    'import { Circle, Square } from "./shapes"\nlet f = s => switch s { | Circle(r) => r }\n',
  );
  const r = buildModules(join(dir, "app.al"));
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") expect(r.error.message).toContain("non-exhaustive");
});

test("reports a missing export against the import site", () => {
  const dir = mkdtempSync(join(tmpdir(), "alang-mod-"));
  writeFileSync(join(dir, "lib.al"), "export let a = 1\n");
  writeFileSync(join(dir, "use.al"), 'import { a, nope } from "./lib"\nlet x = a\n');
  const r = buildModules(join(dir, "use.al"));
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") {
    expect(r.error.message).toContain("has no export 'nope'");
    expect(r.error.end).toBeGreaterThan(r.error.start); // pinned to the name span
  }
});
