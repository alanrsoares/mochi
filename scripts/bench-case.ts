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
import { loadBootstrapGraph } from "@mochi/compiler/bootstrap";
import { compileGraphBootstrap } from "@mochi/compiler/bootstrap/module";
import {
  compileBootstrapSync,
  compileTsBootstrapSync,
  inferTypesBootstrapSync,
} from "@mochi/compiler/bootstrap/sync";
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
  const loaded = await loadBootstrapGraph(entry, read(rel), (p) => readFile(p, "utf8"));
  ok(`load ${rel}`, loaded);
  if (compile && loaded._tag === "Ok") ok(`compile ${rel}`, compileGraphBootstrap(loaded.value));
};

const CASES: Record<string, () => void | Promise<void>> = {
  // Baseline: Bun start-up plus loading the seed bundles every other case pays.
  startup: () => {},
  "compile-js:pipelines": () =>
    ok("pipelines", compileBootstrapSync(read("examples/pipelines.mochi"))),
  "compile-js:example": () => ok("example", compileBootstrapSync(read("examples/example.mochi"))),
  "compile-ts:example": () =>
    ok(
      "example",
      compileTsBootstrapSync(read("examples/example.mochi"), "@mochi/compiler/runtime"),
    ),
  "infer:example": () => ok("example", inferTypesBootstrapSync(read("examples/example.mochi"))),
  "graph-compile:modules": graph("examples/modules/main.mochi", true),
  "graph-load:bootstrap-lexer": graph("bootstrap/lexer.mochi", false),
  "graph-compile:bootstrap-lexer": graph("bootstrap/lexer.mochi", true),
  "fmt:example": fmt("examples/example.mochi"),
  "fmt:snake-app": fmt("examples/snake/src/App.mochi"),
  "fmt:bootstrap-lexer": fmt("bootstrap/lexer.mochi"),
  "fmt:bootstrap-parser": fmt("bootstrap/parser.mochi"),
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
