// Slice F — closing the loop. The self-hosting fixpoint ceremony
// (docs/PATH_TO_BOOTSTRAP.md §4):
//   Stage 1: the TS compiler emits each bootstrap/*.al module.
//   Stage 2: the *stage-1* compiler (lex+parse+codegen, evaluated from that
//            emitted JS) re-emits every bootstrap module.
//   Stage 3: the *stage-2* compiler re-emits them again.
// Self-hosting is proved when stage2 ≡ stage3 byte-for-byte — the compiler
// reproduces its own source exactly. We assert the stronger property too:
// stage1 ≡ stage2, i.e. the JS the TS compiler emits for the bootstrap is
// identical to the JS the bootstrap emits for itself.
//
// The "compiler" is the composition lex→parse→codegen: check/infer are
// validation gates that never alter the AST fed to codegen, so the emitted JS
// is fixed by these three passes alone (their parity is pinned by
// bootstrap-{check,infer}.spec.ts). All five bootstrap modules are compiled as
// *targets* at every stage. The three prelude runtime tables are passed in as
// Maps built from the SAME src/prelude.ts data the TS codegen consults.
import { beforeAll, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { match } from "@onrails/pattern";
import { unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { namespaceRuntime, preludeJsDefs, runtimeDeps } from "../src/prelude";

const root = join(import.meta.dir, "..");

// Modules that form the compiler (evaluated + run each stage).
const COMPILER = ["bootstrap/lexer.al", "bootstrap/parser.al", "bootstrap/codegen.al"];
// Every bootstrap module is a compilation *target* at each stage.
const TARGETS = [
  "bootstrap/lexer.al",
  "bootstrap/parser.al",
  "bootstrap/check.al",
  "bootstrap/infer.al",
  "bootstrap/codegen.al",
];

const src: Record<string, string> = Object.fromEntries(
  TARGETS.map((m) => [m, readFileSync(join(root, m), "utf8")]),
);

// TS prelude tables → Maps; insertion order preserved (drives preamble order).
const alNs = new Map(
  Object.entries(namespaceRuntime).map(([n, mm]) => [n, new Map(Object.entries(mm))]),
);
const alJsDefs = new Map(Object.entries(preludeJsDefs));
const alRuntimeDeps = new Map(Object.entries(runtimeDeps));

const strip = (js: string): string => js.replace(/^import .*$/gm, "").replace(/^export /gm, "");

// strict prologue: JSC does proper tail calls only in strict mode (ADR 0014).
const evalNames = <T extends Record<string, unknown>>(js: string, names: string[]): T =>
  new Function("match", `"use strict";\n${strip(js)}\nreturn { ${names.join(", ")} };`)(match) as T;

type AlResult = { _tag: "Ok"; value: unknown } | { _tag: "Err"; error: { message: string } };

// Compose an alang compiler (source → emitted JS) from a set of emitted module
// JS strings — this is the CLI the bootstrap would ship, minus host IO.
const makeCompiler = (mods: Record<string, string>): ((s: string) => string) => {
  const { lex } = evalNames<{ lex: (s: string) => AlResult }>(mods["bootstrap/lexer.al"]!, ["lex"]);
  const { parse } = evalNames<{ parse: (t: unknown) => AlResult }>(mods["bootstrap/parser.al"]!, [
    "parse",
  ]);
  const { codegen } = evalNames<{
    codegen: (
      stmts: unknown,
      imported: Map<string, string[]>,
      useRuntime: boolean,
      ns: Map<string, Map<string, string>>,
      jsDefs: Map<string, string>,
      deps: Map<string, string[]>,
    ) => string;
  }>(mods["bootstrap/codegen.al"]!, ["codegen"]);
  return (s: string): string => {
    const lr = lex(s);
    if (lr._tag !== "Ok") throw new Error(`lex: ${lr.error.message}`);
    const pr = parse(lr.value);
    if (pr._tag !== "Ok") throw new Error(`parse: ${pr.error.message}`);
    return codegen(pr.value, new Map(), true, alNs, alJsDefs, alRuntimeDeps);
  };
};

const emitAll = (compiler: (s: string) => string): Record<string, string> =>
  Object.fromEntries(TARGETS.map((m) => [m, compiler(src[m]!)]));

let stage1: Record<string, string>;
let stage2: Record<string, string>;
let stage3: Record<string, string>;

beforeAll(() => {
  // Stage 1: the TS compiler emits each bootstrap module.
  stage1 = Object.fromEntries(TARGETS.map((m) => [m, unwrapOk(compile(src[m]!))]));
  // Stage 2: the stage-1 compiler re-emits every module.
  stage2 = emitAll(makeCompiler(stage1));
  // Stage 3: the stage-2 compiler re-emits every module.
  stage3 = emitAll(makeCompiler(stage2));
});

for (const m of TARGETS) {
  test(`fixpoint: stage2 ≡ stage3 for ${m}`, () => {
    expect(stage2[m]).toEqual(stage3[m]);
  });
  test(`self-host: TS emit ≡ bootstrap emit for ${m}`, () => {
    expect(stage2[m]).toEqual(stage1[m]);
  });
}

test("the compiler modules are among the compiled targets", () => {
  for (const m of COMPILER) expect(TARGETS).toContain(m);
});
