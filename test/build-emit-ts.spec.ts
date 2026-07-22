// Differential tier for `build --emit=ts` (ADR 0026): a multi-module graph must
// emit a typed `.ts` per module that type-checks TOGETHER under `tsc --strict`.
// This guards the cross-module wiring — a `switch` in one module on a variant
// defined+exported in another, plus a piped prelude call — which single-file
// `codegenTs` can't exercise.
import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isErr } from "@onrails/result";
import { buildModulesTs } from "../src/module";

const DIR = new URL("./.tsgen-graph/", import.meta.url).pathname;
// From test/.tsgen-graph/<file>.ts back to src/runtime.
const RUNTIME = "../../src/runtime";

// A dependency (exports a variant + its ctors) and an entry that imports the
// ctors, matches on them, and pipes a prelude call.
const MODULES: Record<string, string> = {
  "shapes.al": `
export type Shape =
  | Circle(float)
  | Rect(w: float, h: float)
export let scale = (k, s) => switch s {
  | Circle(r) => Circle(mul(k, r))
  | Rect(w, h) => Rect(mul(k, w), mul(k, h))
}`,
  "main.al": `
import { Circle, Rect, scale } from "./shapes.al"
let area = s => switch s {
  | Circle(r) => mul(pi, mul(r, r))
  | Rect(w, h) => mul(w, h)
}
let shapes = [Circle(1.0), Rect(2.0, 3.0)]
let areas = shapes |> map(s => area(scale(2.0, s)))`,
};

beforeAll(async () => {
  mkdirSync(DIR, { recursive: true });
  for (const [name, src] of Object.entries(MODULES)) writeFileSync(join(DIR, name), src);
  const built = await buildModulesTs(join(DIR, "main.al"), (p) => Bun.file(p).text(), {
    runtimeImport: RUNTIME,
  });
  if (isErr(built)) throw new Error(`build --emit=ts failed: ${built.error.message}`);
  for (const { path, js } of built.value) writeFileSync(path.replace(/\.al$/, ".ts"), js);
  writeFileSync(
    join(DIR, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        target: "es2020",
        module: "esnext",
        moduleResolution: "bundler",
      },
      include: ["*.ts"],
    }),
  );
});

afterAll(() => rmSync(DIR, { recursive: true, force: true }));

test("a multi-module graph emits .ts that type-checks together under tsc --strict", () => {
  const proc = Bun.spawnSync(["bunx", "tsc", "-p", join(DIR, "tsconfig.json")], { cwd: DIR });
  const out = `${proc.stdout.toString()}${proc.stderr.toString()}`.trim();
  expect(out).toBe("");
});
