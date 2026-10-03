import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compile } from "@mochi/compiler";
import { repoPath } from "@mochi/test-support";
import { unwrapOk } from "@onrails/result";

const CLI = repoPath(import.meta.url, "packages/cli/src/cli.ts");
const source = `
type Shape = Circle(number) | Rect(number, number)
export let area = shape => switch shape { | Circle(r) => r * r | Rect(w, h) => w * h }
export let option = x => switch x { | Some(n) => n | None => 0 }
`;

test("CLI formats JS/TS stdout while raw compiler output keeps its contract", () => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-output-"));
  try {
    const input = join(dir, "shape.mochi");
    writeFileSync(input, source);
    // Output formatting must not inherit arbitrary consumer configuration.
    writeFileSync(join(dir, "biome.json"), '{"formatter":{"enabled":false}}');
    for (const args of [[input], ["ts", input]]) {
      const run = Bun.spawnSync([process.execPath, CLI, ...args], { cwd: dir });
      expect(run.exitCode, run.stderr.toString()).toBe(0);
      const output = run.stdout.toString();
      expect(output).toContain('switch ($match._tag) {\n    case "Circle": {');
      expect(output).toContain("return");
      expect(output).toMatch(/_Option_match\(\s*x,/);
      expect(output.endsWith("\n")).toBe(true);
      if (args.length === 1) {
        const api = new Function(`${output.replace(/^export /gm, "")}\nreturn {area, option};`)();
        expect(api.area({ _tag: "Circle", _0: 3 })).toBe(9);
        expect(api.area({ _tag: "Rect", _0: 2, _1: 5 })).toBe(10);
        expect(api.option({ _tag: "Some", value: 7 })).toBe(7);
        expect(api.option({ _tag: "None" })).toBe(0);
      }
    }
    expect(unwrapOk(compile(source))).toContain('switch ($match._tag) { case "Circle":');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("graph builds format each JS/TS module and JSX output", () => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-build-format-"));
  try {
    writeFileSync(join(dir, "shape.mochi"), source);
    writeFileSync(
      join(dir, "main.mochi"),
      'import {area} from "./shape"\nexport let evaluate = area',
    );
    for (const args of [[], ["--emit=ts"]]) {
      const run = Bun.spawnSync([process.execPath, CLI, "build", ...args, join(dir, "main.mochi")]);
      expect(run.exitCode, run.stderr.toString()).toBe(0);
      const ext = args.length ? "ts" : "js";
      expect(readFileSync(join(dir, `shape.${ext}`), "utf8")).toContain('case "Circle": {\n');
      expect(readFileSync(join(dir, `main.${ext}`), "utf8")).toContain(
        `import { area } from "${args.length ? "./shape" : "./shape.js"}";`,
      );
    }
    writeFileSync(
      join(dir, "app.mochi"),
      'extern h : a = "preact" "h"\nexport let app = <div className="hello" />',
    );
    const jsx = Bun.spawnSync([
      process.execPath,
      CLI,
      "build",
      "--emit=ts",
      join(dir, "app.mochi"),
    ]);
    expect(jsx.exitCode, jsx.stderr.toString()).toBe(0);
    expect(readFileSync(join(dir, "app.tsx"), "utf8")).toContain('<div className={"hello"} />');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("formatter failure leaves existing build files intact", () => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-format-failure-"));
  try {
    writeFileSync(join(dir, "main.mochi"), source);
    writeFileSync(join(dir, "main.js"), "previous output\n");
    const run = Bun.spawnSync([process.execPath, CLI, "build", join(dir, "main.mochi")], {
      env: { ...process.env, BIOME_BINARY: join(dir, "missing-biome") },
    });
    expect(run.exitCode).not.toBe(0);
    expect(run.stderr.toString()).toContain("Biome output formatting failed");
    expect(readFileSync(join(dir, "main.js"), "utf8")).toBe("previous output\n");
    expect(existsSync(join(dir, "main.ts"))).toBe(false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
