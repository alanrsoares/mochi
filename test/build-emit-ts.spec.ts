// Differential tier for `build --emit=ts` (ADR 0026): a multi-module graph must
// emit a typed `.ts` per module that type-checks TOGETHER under `tsc --strict`.
// This guards the cross-module wiring — a `switch` in one module on a variant
// defined+exported in another, plus a piped prelude call — which single-file
// `codegenTs` can't exercise. It also guards gap 3 (ADR 0026): cross-module
// `import type` for a type referenced with NO value-import edge, and a `.d.ts`
// emitted for an extern module.
import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { isErr } from "@onrails/result";
import { buildModulesTs, type ModuleOutput } from "../src/module";

const DIR = new URL("./.tsgen-graph/", import.meta.url).pathname;
// From test/.tsgen-graph/<file>.ts back to src/runtime.
const RUNTIME = "../../src/runtime";

// `shapes` exports a variant + its ctors + a transform. `ops` imports the ctors
// and re-exports a value (`unit`) and a transform (`grow`) — both typed `Shape`.
// `main` imports ONLY from `ops`, never from `shapes`, yet its bindings are typed
// `Shape` — so it must emit `import type { Shape } from "./shapes"` with no value
// edge to carry it (gap 3, TS2304). `main` also declares an `extern`, forcing a
// `host.d.ts` (gap 3, TS2307).
const MODULES: Record<string, string> = {
  "shapes.mochi": `
export type Shape =
  | Circle(float)
  | Rect(w: float, h: float)
export let scale = (k, s) => switch s {
  | Circle(r) => Circle(mul(k, r))
  | Rect(w, h) => Rect(mul(k, w), mul(k, h))
}`,
  "ops.mochi": `
import { Circle, Rect, scale } from "./shapes.mochi"
export let unit = Circle(1.0)
export let grow = s => scale(2.0, s)`,
  "main.mochi": `
import { unit, grow } from "./ops.mochi"
extern log : string -> string = "./host.js" "log"
export let twice = s => grow(grow(s))
let base = twice(unit)
let noise = log("built")`,
};

let outputs: ModuleOutput[] = [];

beforeAll(async () => {
  mkdirSync(DIR, { recursive: true });
  for (const [name, src] of Object.entries(MODULES)) writeFileSync(join(DIR, name), src);
  const built = await buildModulesTs(join(DIR, "main.mochi"), (p) => Bun.file(p).text(), {
    runtimeImport: RUNTIME,
  });
  if (isErr(built)) throw new Error(`build --emit=ts failed: ${built.error.message}`);
  outputs = built.value;
  for (const { path, js } of outputs)
    writeFileSync(path.endsWith(".ts") ? path : path.replace(/\.mochi$/, ".ts"), js);
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

test("a type referenced with no import edge gets a cross-module `import type` (gap 3)", () => {
  // `main` imports only from `ops`, but its bindings are typed `Shape` (owned by
  // `shapes`). The emitter must resolve `Shape` to its declaring module.
  const mainTs = readFileSync(join(DIR, "main.ts"), "utf8");
  expect(mainTs).toContain('import type { Shape } from "./shapes";');
});

test("an extern module emits a self-contained `.d.ts` (gap 3)", () => {
  const dts = outputs.find((o) => basename(o.path) === "host.d.ts");
  expect(dts).toBeDefined();
  expect(dts?.js).toContain("export declare const log: (a: string) => string;");
});
