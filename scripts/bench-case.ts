// One benchmark case per process, for CodSpeed's exec harness (codspeed.yml).
// Each invocation does a single unit of work so the CPU simulation stays
// short; module loading of the seed is part of every case, as it is for the
// CLI, and `startup` measures that share alone.
//
//   bun scripts/bench-case.ts <case>
//   bun scripts/bench-case.ts --list
import { dlopen, FFIType } from "bun:ffi";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import {
  checkSync,
  compileSync,
  compileTsSync,
  emitDtsSyncWith,
  inferTypesSync,
} from "@mochi/compiler/compile/sync";
import { defaultOptions } from "@mochi/compiler/extensions";
import { loadGraph } from "@mochi/compiler/graph";
import { compileGraph } from "@mochi/compiler/module";
import { format } from "@mochi/dx/format";
import { vendorPluginsFor } from "./lib/plugins";
import { repoPath } from "./lib/repo";

type Tagged = { readonly _tag: string };

const read = (rel: string): string => readFileSync(repoPath(rel), "utf8");

/** A case that returns `Err` fails the run instead of timing an error path. */
const ok = (label: string, r: Tagged): void => {
  if (r._tag !== "Ok") throw new Error(`${label} failed: ${JSON.stringify(r).slice(0, 500)}`);
};

const fmt = (rel: string) => () => ok(rel, format(read(rel), { plugins: vendorPluginsFor(rel) }));

const graph = (rel: string, compile: boolean) => async () => {
  const entry = repoPath(rel);
  const loaded = await loadGraph(entry, read(rel), (p) => readFile(p, "utf8"));
  ok(`load ${rel}`, loaded);
  if (compile && loaded._tag === "Ok") ok(`compile ${rel}`, compileGraph(loaded.value));
};

const CASES: Record<string, () => void | Promise<void>> = {
  // Baseline: Bun start-up plus loading the seed bundles every other case pays.
  startup: () => {},
  "compile-js:pipelines": () => ok("pipelines", compileSync(read("examples/pipelines.mochi"))),
  "compile-js:example": () => ok("example", compileSync(read("examples/example.mochi"))),
  "compile-ts:example": () =>
    ok("example", compileTsSync(read("examples/example.mochi"), "@mochi/compiler/runtime")),
  "dts:example": () =>
    ok(
      "example",
      emitDtsSyncWith(read("examples/example.mochi"), "@mochi/compiler/runtime", defaultOptions),
    ),
  "check:example": () => {
    const errs = checkSync(read("examples/example.mochi"));
    if (errs.length > 0)
      throw new Error(`check example failed: ${JSON.stringify(errs).slice(0, 500)}`);
  },
  "infer:example": () => ok("example", inferTypesSync(read("examples/example.mochi"))),
  "graph-compile:modules": graph("examples/modules/main.mochi", true),
  "graph-load:bootstrap-lexer": graph("packages/compiler/src/lexer/lexer.mochi", false),
  "graph-compile:bootstrap-lexer": graph("packages/compiler/src/lexer/lexer.mochi", true),
  "fmt:example": fmt("examples/example.mochi"),
  "fmt:snake-app": fmt("examples/snake/src/App.mochi"),
  "fmt:bootstrap-lexer": fmt("packages/compiler/src/lexer/lexer.mochi"),
  "fmt:bootstrap-parser": fmt("packages/compiler/src/parser/parser.mochi"),
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
