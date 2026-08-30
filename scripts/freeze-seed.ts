// Snapshot today's bootstrap graph as the ADR 0090 stage-1 TypeScript seed.
// The current executable seed emits its successor; `scripts/fixpoint.ts` then
// copies and runs that snapshot. The TypeScript compiler stays a differential
// oracle, never the seed producer.
//
//   bun scripts/freeze-seed.ts
//
// After emit, `biome format --write bootstrap/seed` (twice: first wrap of huge
// generic arrows is not idempotent). `bun run lint` covers the snapshot; generated
// `_g: any`, unused bindings, and inline struct types are path-exempt in biome.json.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { loadBootstrapCore } from "@mochi/compiler/bootstrap";

const REPO = resolve(import.meta.dir, "..");
const BOOTSTRAP = join(REPO, "bootstrap");
const ENTRY = join(BOOTSTRAP, "cli.mochi");
const SEED = join(BOOTSTRAP, "seed");
const HOST_SHIMS = ["host.mjs", "prelude.gen.mjs", "plugins/jsx-schema.gen.mjs"];
// Package export, not `@mochi/runtime`: the latter is the published name the
// CLI writes into *user* TS emit, and it does not resolve in-repo. Nested
// seed modules (`plugins/jsx.ts`) cannot share one relative path.
const RUNTIME = "@mochi/compiler/runtime";
const BIOME = join(REPO, "node_modules/.bin/biome");

const sha256 = (buf: Buffer | string): string => createHash("sha256").update(buf).digest("hex");

const walkFiles = (dir: string, prefix = ""): string[] => {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${name.name}` : name.name;
    if (name.isDirectory()) out.push(...walkFiles(join(dir, name.name), rel));
    else out.push(rel);
  }
  return out;
};

const emptyDir = (dir: string): void => {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) rmSync(join(dir, name), { recursive: true, force: true });
};

const sourceRevision = (): string =>
  execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO, encoding: "utf8" }).trim();

const tmp = await mkdtemp(join(tmpdir(), "mochi-seed-"));
const bootstrap = await loadBootstrapCore();
const built = bootstrap.buildModulesTs(ENTRY, RUNTIME);
if (built._tag === "Err") {
  rmSync(tmp, { recursive: true, force: true });
  throw new Error(`bootstrap emit failed: ${JSON.stringify(built.error)}`);
}

for (const { path, js } of built.value) {
  const rel = relative(BOOTSTRAP, path);
  const outRel = /\.mochi$/.test(rel) ? rel.replace(/\.mochi$/, ".ts") : rel;
  const dest = join(tmp, outRel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, js);
}
for (const shim of HOST_SHIMS) cpSync(join(BOOTSTRAP, shim), join(tmp, shim));

// Keep a synchronous entry for host integrations whose hooks cannot await
// dynamic seed loading (notably Vite's transform). The bundle embeds the seed
// graph, so consumers do not typecheck or import generated TS modules.
execFileSync(
  "bun",
  [
    "build",
    join(tmp, "compile.ts"),
    "--outfile",
    join(tmp, "compile.bundle.js"),
    "--target",
    "bun",
    "--external",
    "@mochi/compiler/runtime",
    "--external",
    "@onrails/pattern",
  ],
  { cwd: REPO, stdio: "inherit" },
);
execFileSync(
  "bun",
  [
    "build",
    join(tmp, "module.ts"),
    "--outfile",
    join(tmp, "module.bundle.js"),
    "--target",
    "bun",
    "--external",
    "@mochi/compiler/runtime",
    "--external",
    "@onrails/pattern",
  ],
  { cwd: REPO, stdio: "inherit" },
);

emptyDir(SEED);
cpSync(tmp, SEED, { recursive: true });
rmSync(tmp, { recursive: true, force: true });
execFileSync(BIOME, ["format", "--write", "bootstrap/seed"], { cwd: REPO, stdio: "inherit" });
// Second pass: biome's first wrap of huge generic arrows is not idempotent.
execFileSync(BIOME, ["format", "--write", "bootstrap/seed"], { cwd: REPO, stdio: "inherit" });

const files: Record<string, string> = {};
for (const rel of walkFiles(SEED).toSorted()) {
  if (rel === "manifest.json") continue;
  files[rel] = sha256(readFileSync(join(SEED, rel)));
}

const manifest = { sourceRevision: sourceRevision(), files };
writeFileSync(join(SEED, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.error(`froze ${Object.keys(files).length} files at ${manifest.sourceRevision}`);
