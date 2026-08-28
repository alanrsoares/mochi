/**
 * The self-hosted TypeScript backend (ADR 0090): `bootstrap/codegen-ts.mochi`
 * drives the shared codegen's `GenOpts` hooks from `inferProgramTypes`'s
 * span → type table. This is the north-star check for stage 1 — the emitted
 * program must not merely parse, it must survive `tsc --strict`.
 */

import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ensureInTreeBootstrapBuild } from "@mochi/test-support/bootstrap";

ensureInTreeBootstrapBuild();
const REPO = resolve(import.meta.dir, "..");
const RUNTIME = join(REPO, "packages/compiler/src/prelude/runtime");

type AlResult = { _tag: "Ok"; value: string } | { _tag: "Err"; error: unknown };
const { compileTs } = (await import("../bootstrap/compile.js")) as {
  compileTs: (src: string, runtimeImport: string) => AlResult;
};

const emit = (src: string): string => {
  const r = compileTs(src, RUNTIME);
  if (r._tag !== "Ok") throw new Error(`bootstrap ts emit failed: ${JSON.stringify(r.error)}`);
  return r.value;
};

/** Run `tsc --strict` over one emitted module; returns its diagnostics ("" = clean). */
const tscErrors = (ts: string): string => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-ts-emit-"));
  try {
    writeFileSync(join(dir, "out.ts"), ts);
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          moduleResolution: "bundler",
          module: "esnext",
          target: "esnext",
          types: [],
          paths: {
            "@onrails/pattern": [join(REPO, "node_modules/@onrails/pattern/dist/index.d.ts")],
            "@onrails/result": [join(REPO, "node_modules/@onrails/result/dist/index.d.ts")],
          },
        },
        include: ["**/*.ts"],
      }),
    );
    const p = Bun.spawnSync(["bun", "x", "tsc", "-p", dir], { cwd: REPO });
    return (p.stdout.toString() + p.stderr.toString()).trim();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test("a concrete function binding gets curried overloads (ADR 0037)", () => {
  expect(emit("let addPair = (a, b) => add(a, b)")).toContain(
    "const addPair: { (a: number): (b: number) => number; (a: number, b: number): number; } =",
  );
});

test("a generic binding scopes its letters on the value lambda (ADR 0032)", () => {
  expect(emit("let identity = value => value")).toContain(
    "const identity: <A>(value: A) => A = <A>(value: A) => value;",
  );
});

test("a variant emits a tagged union plus typed ctor factories", () => {
  const ts = emit("type Shape a = Dot | Wrap(value: a)\nlet w = Wrap(1)");
  expect(ts).toContain(
    'export type Shape<A> =\n  | { _tag: "Dot" }\n  | { _tag: "Wrap"; value: A };',
  );
  // unused nullary Dot is pattern-only in this snippet — no factory
  expect(ts).not.toContain("const Dot:");
  expect(ts).toContain('const Wrap = <A>(value: A): Shape<A> => ({ _tag: "Wrap", value });');
  // applied ctor cast pins the phantom param (ADR 0043)
  expect(ts).toContain("(Wrap(1) as Shape<number>)");
});

test("the runtime is imported, not inlined (ADR 0075)", () => {
  expect(emit("let addPair = (a, b) => add(a, b)")).toContain("import { _curry, add } from");
});

// The north star: a program exercising variants, generics, matching, ctor casts,
// tuples and pipes must emit TypeScript that `tsc --strict` accepts outright.
test("emitted TypeScript is strict-clean", () => {
  const src = [
    "type Shape a = Dot | Wrap(value: a)",
    "let w = Wrap(1)",
    "let f = s => switch s { | Dot => 0 | Wrap(x) => x }",
    "let addPair = (a, b) => add(a, b)",
    "let identity = value => value",
    "let pt = (1, 2)",
    "let n = 1 |> add(2)",
  ].join("\n");
  expect(tscErrors(emit(src))).toBe("");
});

// ---- the graph driver (ADR 0090) -------------------------------------------
// Single-file `compileTs` never resolves an import, so it cannot exercise the
// three things stage 1 actually needs: imported ctor keys threaded into the
// emitter, a cross-module `import type` for a type reachable with NO
// value-import edge, and a sidecar declaration for an extern host module. Same
// fixture as the TypeScript oracle's `test/build-emit-ts.spec.ts`, run through
// the SELF-HOSTED `buildModulesTs`.

type Output = { path: string; js: string };
const { buildModulesTs } = (await import("../bootstrap/module.js")) as {
  buildModulesTs: (
    entry: string,
    runtimeImport: string,
  ) => { _tag: string; value: Output[]; error: { message: string } };
};

// Inside `test/`, not the OS temp dir: the emitted modules import
// `@onrails/pattern`, which only resolves under the repo's `node_modules`.
const GRAPH_DIR = new URL("./.bts-graph/", import.meta.url).pathname;
// From test/.bts-graph/<file>.ts back to the typed runtime.
const GRAPH_RUNTIME = "../../packages/compiler/src/prelude/runtime";

const GRAPH: Record<string, string> = {
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
extern tag : string -> string -> string = "./host.js" "tag"
extern prefix : string -> string -> string = curried "./host.js" "prefix"
export let twice = s => grow(grow(s))
let base = twice(unit)
let noise = log("built")
let flat = tag("a", "b")
let curried = prefix("a")("b")`,
};

let graphOutputs: Output[] = [];

beforeAll(() => {
  mkdirSync(GRAPH_DIR, { recursive: true });
  for (const [name, src] of Object.entries(GRAPH)) writeFileSync(join(GRAPH_DIR, name), src);
  const built = buildModulesTs(join(GRAPH_DIR, "main.mochi"), GRAPH_RUNTIME);
  if (built._tag !== "Ok") throw new Error(`bootstrap graph emit failed: ${built.error.message}`);
  graphOutputs = built.value;
  for (const { path, js } of graphOutputs)
    writeFileSync(path.endsWith(".mochi") ? path.replace(/\.mochi$/, ".ts") : path, js);
  writeFileSync(
    join(GRAPH_DIR, "tsconfig.json"),
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

afterAll(() => rmSync(GRAPH_DIR, { recursive: true, force: true }));

test("the graph driver emits a cross-module `import type` with no value edge", () => {
  // `main` imports only from `ops`, yet its bindings are typed `Shape`, which
  // `shapes` owns — the driver must resolve that name to its declaring module.
  expect(readFileSync(join(GRAPH_DIR, "main.ts"), "utf8")).toContain(
    'import type { Shape } from "./shapes";',
  );
});

test("the graph driver emits a self-contained extern sidecar (ADR 0064)", () => {
  const dts = graphOutputs.find((o) => o.path.endsWith("host.d.ts"));
  expect(dts).toBeDefined();
  expect(dts?.js).toContain("export declare const log: (a: string) => string;");
  // `tag` is flat: the sidecar offers every grouping `_curry` accepts.
  expect(dts?.js).toContain("(a: string, b: string): string;");
  // `prefix` is curried: one argument per call, no overloads (ADR 0064).
  expect(dts?.js).toContain("export declare const prefix: (a: string) => (b: string) => string;");
});

test("the graph's modules type-check TOGETHER under tsc --strict", () => {
  const p = Bun.spawnSync(["bun", "x", "tsc", "-p", join(GRAPH_DIR, "tsconfig.json")], {
    cwd: GRAPH_DIR,
  });
  expect(`${p.stdout.toString()}${p.stderr.toString()}`.trim()).toBe("");
});
