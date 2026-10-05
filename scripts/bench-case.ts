// One benchmark case per process, for CodSpeed's exec harness (codspeed.yml).
// Each invocation does a single unit of work so the CPU simulation stays
// short. Each case imports only the compiler surface it exercises, so the
// seed bundles another case needs are not loaded (and not counted) here;
// `startup` measures Bun alone. Formatting is covered by the Node job.
//
//   bun scripts/bench-case.ts <case>
//   bun scripts/bench-case.ts --list
import { dlopen, FFIType } from "bun:ffi";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { repoPath } from "./lib/repo";

type Tagged = { readonly _tag: string };

const read = (rel: string): string => readFileSync(repoPath(rel), "utf8");

/** A case that returns `Err` fails the run instead of timing an error path. */
const ok = (label: string, r: Tagged): void => {
  if (r._tag !== "Ok") throw new Error(`${label} failed: ${JSON.stringify(r).slice(0, 500)}`);
};

const EXAMPLE = "examples/example.mochi";
const RUNTIME = "@mochi/compiler/runtime";

const graph = (rel: string) => async () => {
  const { loadGraph } = await import("@mochi/compiler/graph");
  const { compileGraph } = await import("@mochi/compiler/module");
  const entry = repoPath(rel);
  const loaded = await loadGraph(entry, read(rel), (p) => readFile(p, "utf8"));
  ok(`load ${rel}`, loaded);
  if (loaded._tag === "Ok") ok(`compile ${rel}`, compileGraph(loaded.value));
};

const CASES: Record<string, () => void | Promise<void>> = {
  // Baseline: Bun start-up alone.
  startup: () => {},
  "compile-js:example": async () =>
    ok("example", (await import("@mochi/compiler/compile/sync")).compileSync(read(EXAMPLE))),
  "compile-ts:example": async () =>
    ok(
      "example",
      (await import("@mochi/compiler/compile/sync")).compileTsSync(read(EXAMPLE), RUNTIME),
    ),
  "dts:example": async () => {
    const { emitDtsSyncWith } = await import("@mochi/compiler/compile/sync");
    const { defaultOptions } = await import("@mochi/compiler/extensions");
    ok("example", emitDtsSyncWith(read(EXAMPLE), RUNTIME, defaultOptions));
  },
  "check:example": async () => {
    const errs = (await import("@mochi/compiler/compile/sync")).checkSync(read(EXAMPLE));
    if (errs.length > 0)
      throw new Error(`check example failed: ${JSON.stringify(errs).slice(0, 500)}`);
  },
  "infer:example": async () =>
    ok("example", (await import("@mochi/compiler/compile/sync")).inferTypesSync(read(EXAMPLE))),
  "graph-compile:modules": graph("examples/modules/main.mochi"),
  "graph-compile:bootstrap-lexer": graph("packages/compiler/src/lexer/lexer.mochi"),
  "fmt:bootstrap-parser": async () => {
    const { format } = await import("@mochi/dx/format");
    const { vendorPluginsFor } = await import("./lib/plugins");
    const rel = "packages/compiler/src/parser/parser.mochi";
    ok(rel, format(read(rel), { plugins: vendorPluginsFor(rel) }));
  },
};

const name = process.argv[2];
if (name === "--list") {
  console.log(Object.keys(CASES).join("\n"));
  process.exit(0);
}
const run = name === undefined ? undefined : CASES[name];
if (run === undefined) {
  console.error(`bench-case: unknown case '${name}'; known: ${Object.keys(CASES).join(", ")}`);
  process.exit(2);
}
await run();

// Bun ends the process without running libc `atexit` handlers, and CodSpeed's
// exec harness reports the measurement from one. Exit through libc instead.
dlopen("libc.so.6", { exit: { args: [FFIType.i32], returns: FFIType.void } }).symbols.exit(0);
