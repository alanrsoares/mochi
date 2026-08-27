/**
 * The self-hosted TypeScript backend (ADR 0090): `bootstrap/codegen-ts.mochi`
 * drives the shared codegen's `GenOpts` hooks from `inferProgramTypes`'s
 * span → type table. This is the north-star check for stage 1 — the emitted
 * program must not merely parse, it must survive `tsc --strict`.
 */

import { expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
  // nullary const keeps its literal `_tag` instead of widening to string
  expect(ts).toContain('const Dot: Shape<never> = { _tag: "Dot" };');
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
