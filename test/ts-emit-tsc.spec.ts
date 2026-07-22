// Differential tier for the TypeScript backend (ADR 0026): emit `.ts` for a
// corpus of closed-world programs and assert it type-checks under `tsc --strict`.
// This is what makes "strict-clean" a guarantee rather than a claim — if codegen
// or the typed runtime (src/runtime.ts) regresses, tsc catches it here.
import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { unwrapOk } from "@onrails/result";
import { codegenTs } from "../src/codegen-ts";

const DIR = new URL("./.tsgen/", import.meta.url).pathname;
// From test/.tsgen/<file>.ts back to src/runtime.
const RUNTIME_IMPORT = "../../src/runtime";

// Each program is closed-world: it references only prelude builtins and its own
// bindings (no open-world globals that would emit as dangling TS names).
const PROGRAMS: Record<string, string> = {
  shapes: `
type Shape =
  | Circle(float)
  | Rect(float, float)
let area = shape => switch shape {
  | Circle(r) => mul(pi, mul(r, r))
  | Rect(w, h) => mul(w, h)
}
let hypot = (a, b) => sqrt(add(mul(a, a), mul(b, b)))
let total = area(Circle(2.0))`,
  generics: `
type Tree a =
  | Leaf
  | Node(a, Tree a, Tree a)
let leaf = Leaf
let one = Node(1, Leaf, Leaf)
let size = t => switch t {
  | Leaf => 0
  | Node(_v, l, r) => add(1, add(size(l), size(r)))
}`,
  options: `
type Color = | Red | Green | Blue
let toName = c => switch c {
  | Red => "red"
  | Green => "green"
  | Blue => "blue"
}
let firstUpper = s => Str.toUpper(Str.slice(0, 1, s))
let names = map(toName, [Red, Green, Blue])`,
  records: `
type Point = { x: number, y: number }
let origin = { x: 0.0, y: 0.0 }
let shift = (p, dx) => { ...p, x: add(p.x, dx) }
let dist = p => sqrt(add(mul(p.x, p.x), mul(p.y, p.y)))
let moved = shift(origin, 3.0)`,
};

beforeAll(() => {
  mkdirSync(DIR, { recursive: true });
  for (const [name, src] of Object.entries(PROGRAMS))
    writeFileSync(`${DIR}${name}.ts`, unwrapOk(codegenTs(src, { runtimeImport: RUNTIME_IMPORT })));
  writeFileSync(
    `${DIR}tsconfig.json`,
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

test("emitted .ts type-checks under tsc --strict", () => {
  const proc = Bun.spawnSync(["bunx", "tsc", "-p", `${DIR}tsconfig.json`], { cwd: DIR });
  const out = `${proc.stdout.toString()}${proc.stderr.toString()}`.trim();
  expect(out).toBe("");
});
