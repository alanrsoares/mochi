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
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import {
  BIOME_BIN,
  BOOTSTRAP_DIR,
  BOOTSTRAP_SEED,
  HOST_SHIMS,
  loadCachedTsEmit,
  REPO_ROOT,
  readSeedManifest,
  sha256,
  walkFiles,
} from "./lib";
import { hostTypesDts } from "./lib/host-types";

// Package export, not `@mochi/runtime`: the latter is the published name the
// CLI writes into *user* TS emit, and it does not resolve in-repo. Nested
// seed modules (`plugins/jsx.ts`) cannot share one relative path.
const RUNTIME = "@mochi/compiler/runtime";
/** What `syntax-entry.ts` re-exports; the ESM twin's `.d.mts` declares these. */
const SYNTAX_EXPORTS = [
  "lex",
  "parse",
  "parseRecovering",
  "parseWith",
  "formatProgram",
  "formatProgramWith",
  "formatHooksFor",
  "freshRowVar",
  "freshVar",
  "rExtend",
  "tArrow",
  "tCon",
  "tLit",
  "tPrim",
  "tRecord",
  "tTuple",
  "tUnion",
  "UNIT",
  "zonk",
  "showType",
  "tBool",
  "tNumber",
  "tString",
  "widenLits",
  "foldAliases",
] as const;

// `--check` re-emits into a temp directory and diffs against the committed
// seed instead of overwriting it. Nothing else notices a stale seed: the
// fixpoint compares stages against each other, and the parity specs compile
// `bootstrap/*.mochi` through the TypeScript oracle — neither runs the
// artifact the CLI actually ships.
const CHECK = process.argv.includes("--check");

const emptyDir = (dir: string): void => {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) rmSync(join(dir, name), { recursive: true, force: true });
};

const sourceRevision = (): string =>
  execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" }).trim();

const stripBundleSourceLabels = (file: string): void => {
  const source = readFileSync(file, "utf8");
  writeFileSync(file, source.replace(/^\/\/ .*\/mochi-seed-[^\n]+\n/gm, ""));
};

const tmp = await mkdtemp(join(tmpdir(), "mochi-seed-"));
const built = loadCachedTsEmit(RUNTIME);
if (built._tag === "Err") {
  rmSync(tmp, { recursive: true, force: true });
  throw new Error(`bootstrap emit failed: ${JSON.stringify(built.error)}`);
}

for (const { path, js } of built.value) {
  const rel = relative(BOOTSTRAP_DIR, path);
  const outRel = /\.mochi$/.test(rel) ? rel.replace(/\.mochi$/, ".ts") : rel;
  const dest = join(tmp, outRel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, js);
}
for (const shim of HOST_SHIMS) cpSync(join(BOOTSTRAP_DIR, shim), join(tmp, shim));

// Keep a synchronous entry for host integrations whose hooks cannot await
// dynamic seed loading (notably Vite's transform). The bundle embeds the seed
// graph, so consumers do not typecheck or import generated TS modules.
// `dts.ts` imports `compile.ts`, so the entry adds its single-file drivers.
writeFileSync(
  join(tmp, "compile-entry.ts"),
  'export * from "./compile.ts";\nexport { compileTargetsWith, emitDtsTextWith } from "./dts.ts";\n',
);
execFileSync(
  "bun",
  [
    "build",
    join(tmp, "compile-entry.ts"),
    "--outfile",
    join(tmp, "compile.bundle.cjs"),
    "--target",
    "bun",
    "--external",
    "@mochi/compiler/runtime",
    "--external",
    "@onrails/pattern",
  ],
  { cwd: REPO_ROOT, stdio: "inherit" },
);
stripBundleSourceLabels(join(tmp, "compile.bundle.cjs"));
// Browser consumers (the docs playground worker) cannot load the synchronous
// CommonJS host bundle. Keep an equivalent ESM artifact beside it.
execFileSync(
  "bun",
  [
    "build",
    join(tmp, "compile-entry.ts"),
    "--outfile",
    join(tmp, "compile.bundle.mjs"),
    "--target",
    "browser",
    "--format",
    "esm",
    "--external",
    "@mochi/compiler/runtime",
    "--external",
    "@onrails/pattern",
  ],
  { cwd: REPO_ROOT, stdio: "inherit" },
);
stripBundleSourceLabels(join(tmp, "compile.bundle.mjs"));
rmSync(join(tmp, "compile-entry.ts"), { force: true });
writeFileSync(
  join(tmp, "compile.bundle.d.mts"),
  `export type BootstrapDiagnostic = { message: string; start: number; end: number };\nexport type BootstrapResult<A> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: BootstrapDiagnostic[] };\nexport type BootstrapInferResult = { env: Map<string, unknown>; types: Array<{ span: { start: number; end: number }; ty: unknown; display: string }>; aliases: Map<string, unknown>; letParams: unknown[] };\nexport const compile: (src: string) => BootstrapResult<string>;\nexport const compileTs: (src: string, runtimeImport: string) => BootstrapResult<string>;\nexport const inferTypes: (src: string) => BootstrapResult<BootstrapInferResult>;\n`,
);
execFileSync(
  "bun",
  [
    "build",
    join(tmp, "module.ts"),
    "--outfile",
    join(tmp, "module.bundle.cjs"),
    "--target",
    "bun",
    "--external",
    "@mochi/compiler/runtime",
    "--external",
    "@onrails/pattern",
  ],
  { cwd: REPO_ROOT, stdio: "inherit" },
);
stripBundleSourceLabels(join(tmp, "module.bundle.cjs"));
writeFileSync(
  join(tmp, "syntax-entry.ts"),
  'export { lex } from "./lexer.ts";\nexport { parse, parseRecovering, parseWith } from "./parser.ts";\nexport { formatProgram, formatProgramWith } from "./format.ts";\nexport { formatHooksFor } from "./extensions.ts";\nexport { freshRowVar, freshVar, rExtend, tArrow, tCon, tLit, tPrim, showType, tRecord, tTuple, tUnion, UNIT, zonk } from "./types.ts";\nexport { foldAliases, tBool, tNumber, tString, widenLits } from "./schemes.ts";\n',
);
// ESM, imported statically by the host façades (`bootstrap/syntax.ts`,
// `bootstrap/types.ts`), so the formatter and the type constructors also run in
// the browser (the docs playground). A runtime `loadSeed` needs Node.
execFileSync(
  "bun",
  [
    "build",
    join(tmp, "syntax-entry.ts"),
    "--outfile",
    join(tmp, "syntax.bundle.mjs"),
    "--target",
    "browser",
    "--format",
    "esm",
    "--external",
    "@mochi/compiler/runtime",
    "--external",
    "@onrails/pattern",
  ],
  { cwd: REPO_ROOT, stdio: "inherit" },
);
stripBundleSourceLabels(join(tmp, "syntax.bundle.mjs"));
writeFileSync(
  join(tmp, "syntax.bundle.d.mts"),
  `${SYNTAX_EXPORTS.map((name) => `export declare const ${name}: unknown;`).join("\n")}\n`,
);
rmSync(join(tmp, "syntax-entry.ts"), { force: true });

// Types host plugins build against (ADR 0109), copied out of the emit so hosts
// never compile the seed itself under their own, stricter flags.
writeFileSync(
  join(tmp, "host-types.d.ts"),
  hostTypesDts(
    tmp,
    [
      { file: "ast.ts", names: ["Expr", "Field", "Pattern", "Span", "Stmt", "TypeExpr"] },
      { file: "infer.ts", names: ["HostPlugin", "IErr", "InferApi", "LocTok", "TsApi"] },
      { file: "lexer.ts", names: ["Tok"] },
      { file: "types.ts", names: ["Row", "St", "Ty"] },
    ],
    [
      {
        name: "SeedTypeCtors",
        values: [
          {
            file: "types.ts",
            names: [
              "tCon",
              "tArrow",
              "tRecord",
              "tTuple",
              "tLit",
              "tUnion",
              "tPrim",
              "UNIT",
              "rExtend",
              "freshVar",
              "freshRowVar",
              "zonk",
              "showType",
            ],
          },
          {
            file: "schemes.ts",
            names: ["tNumber", "tString", "tBool", "widenLits", "foldAliases"],
          },
        ],
      },
    ],
  ),
);

const hashesOf = (dir: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const rel of walkFiles(dir).toSorted()) {
    if (rel === "manifest.json") continue;
    out[rel] = sha256(readFileSync(join(dir, rel)));
  }
  return out;
};

// Hashed BEFORE biome runs. The formatter only covers `bootstrap/seed/**/*.ts`
// (biome.json `files.includes`), so a temp directory cannot be formatted the
// same way — and the raw emit is the more sensitive comparison anyway, since
// formatting normalises differences away.
const emitted = hashesOf(tmp);

if (CHECK) {
  const committed = readSeedManifest();
  rmSync(tmp, { recursive: true, force: true });
  if (committed.emitted === undefined) {
    console.error("bootstrap/seed/manifest.json predates the freshness check");
    console.error("run `bun run seed:freeze` and commit the result");
    process.exit(1);
  }
  const names = [
    ...new Set([...Object.keys(emitted), ...Object.keys(committed.emitted)]),
  ].toSorted();
  const stale = names.filter((rel) => emitted[rel] !== committed.emitted?.[rel]);
  if (stale.length > 0) {
    console.error(
      `bootstrap/seed is stale — ${stale.length} file(s) differ from what today's sources emit:`,
    );
    for (const rel of stale.slice(0, 10)) {
      const was = committed.emitted[rel];
      const now = emitted[rel];
      const state = was === undefined ? "new" : now === undefined ? "removed" : "changed";
      console.error(`  ${rel} (${state})`);
    }
    if (stale.length > 10) console.error(`  … and ${stale.length - 10} more`);
    console.error("run `bun run seed:freeze` and commit the result");
    process.exit(1);
  }
  console.error(`seed is current (${Object.keys(emitted).length} files)`);
  process.exit(0);
}

emptyDir(BOOTSTRAP_SEED);
cpSync(tmp, BOOTSTRAP_SEED, { recursive: true });
rmSync(tmp, { recursive: true, force: true });
execFileSync(BIOME_BIN, ["format", "--write", "bootstrap/seed"], {
  cwd: REPO_ROOT,
  stdio: "inherit",
});
// Second pass: biome's first wrap of huge generic arrows is not idempotent.
execFileSync(BIOME_BIN, ["format", "--write", "bootstrap/seed"], {
  cwd: REPO_ROOT,
  stdio: "inherit",
});

const files = hashesOf(BOOTSTRAP_SEED);
const manifest = { sourceRevision: sourceRevision(), emitted, files };
writeFileSync(join(BOOTSTRAP_SEED, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.error(`froze ${Object.keys(files).length} files at ${manifest.sourceRevision}`);
