// Dogfood the LSP's own diagnostics on every `.mochi` source in the repository:
// resolve each file's module graph and report what the editor would underline.
// Exits non-zero if any file has a diagnostic (the QA-gate mode).
//
// Not part of `bun run lint` (biome, ~0.5s) — a graph resolve per file costs
// seconds, and every `.mochi` file here is already type-checked by something in
// `check:full`. This is the standalone sweep, and the shape a `mochi check`
// command would take.
import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { createBootstrapRecoveryGraphCache } from "@mochi/compiler/bootstrap";
import { createModuleCache } from "@mochi/compiler/module";
import { moduleDiagnostics, type PublishDiagnostic } from "@mochi/dx/diagnostics";
import { pluginsForDocument } from "@mochi/lsp/load-plugins";

const root = resolve(".");
const globs = process.argv.slice(2).filter((a) => !a.startsWith("-"));

/** `fixtures/` is deliberately broken input — `let x = notAName` is the test. */
const isExempt = (file: string): boolean =>
  file.split("/").some((part) => part === "node_modules" || part === "dist") ||
  file.includes("/fixtures/");

const files = (globs.length > 0 ? globs : ["**/*.mochi"])
  .flatMap((g) => [...new Bun.Glob(g).scanSync({ cwd: root })])
  .filter((f) => f.endsWith(".mochi") && !isExempt(f))
  .toSorted();

// One read per path for the whole sweep. Neighbouring entries share most of
// their dependency graph, so the same prelude/module text is asked for dozens
// of times.
const reads = new Map<string, Promise<string>>();
const read = (p: string): Promise<string> => {
  const key = resolve(p);
  const hit = reads.get(key);
  if (hit) return hit;
  const pending = readFile(key, "utf8");
  reads.set(key, pending);
  return pending;
};

// Findings and the summary are this script's OUTPUT, so they go to stdout and
// `lint:mochi > findings.txt` works. stderr carries only what must never land in
// that file: the progress line, and manifest load failures.
//
// A graph resolve per file means ~20s of work with nothing to show for it. On a
// TTY, overwrite one line with the file in flight so the sweep is visibly alive;
// when piped, stay quiet so a redirect or a CI log stays clean.
const live = process.stderr.isTTY === true;
const showProgress = (done: number, file: string): void => {
  if (live) process.stderr.write(`\r\u001b[2K[${done}/${files.length}] ${file}`);
};
const clearProgress = (): void => {
  if (live) process.stderr.write("\r\u001b[2K");
};

const report = (file: string, d: PublishDiagnostic): string => {
  const at = `${file}:${d.range.start.line + 1}:${d.range.start.character + 1}`;
  const [head, ...rest] = d.message.split("\n");
  return [`${at} ${head}`, ...rest.map((line) => `  ${line}`)].join("\n");
};

// Neighbouring entries share almost all of their graph — without this the
// 34-file `bootstrap/` sweep infers the whole compiler 34 times.
const cache = createModuleCache();
const bootstrapCache = createBootstrapRecoveryGraphCache();

const started = Date.now();
let failures = 0;
let done = 0;
for (const file of files) {
  showProgress(done, file);
  done += 1;
  const path = resolve(root, file);
  // A tree's `mochi.plugins.ts` decides what its vendor calls mean: sweeping
  // without it reports the host kit's own call sites as type errors. Same
  // upward walk (and cache) the language server does.
  const plugins = await pluginsForDocument(path, {
    allowedRoots: [root],
    onError: (manifest, error) => {
      console.error(`${relative(root, manifest)}: failed to load — ${String(error)}`);
    },
  });
  const opts = plugins === undefined ? { bootstrapCache } : { plugins, cache };
  for (const d of await moduleDiagnostics(path, await read(path), read, opts)) {
    failures += 1;
    clearProgress();
    console.log(report(file, d));
  }
}
clearProgress();

const elapsed = `${((Date.now() - started) / 1000).toFixed(1)}s`;
console.log(
  failures === 0
    ? `checked ${files.length} .mochi files in ${elapsed} — no diagnostics`
    : `\n${failures} diagnostic${failures === 1 ? "" : "s"} across ${files.length} .mochi files (${elapsed})`,
);
if (failures > 0) process.exit(1);
