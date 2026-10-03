/**
 * Black-box conformance checks for the shipped bootstrap compiler (ADR 0105).
 *
 * This module deliberately reaches the compiler only through its bootstrap
 * facades. Do not import the hand-authored TypeScript compiler core here: this
 * is the gate intended to outlive that implementation.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { compileSyncWith, compileTsSyncWith } from "@mochi/compiler/compile/sync";
import type { CompilerOptions, CompilerPlugin } from "@mochi/compiler/extensions";
import { buildModulesTsWith, buildModulesWith, emitDtsForFileWith } from "@mochi/compiler/module";
import { format } from "@mochi/compiler/syntax";
import { preactPlugin } from "@mochi/plugin-preact";
import { reReducedPlugin } from "@mochi/plugin-re-reduced";
import { styledCvaPlugin } from "@mochi/plugin-styled-cva";
import { match } from "@onrails/pattern";

type CompileCase = { id: string; kind: "compile"; source: string; expect: string };
type DiagnosticCase = { id: string; kind: "diagnostic"; source: string; expect: string };
type RuntimeCase = {
  id: string;
  kind: "runtime";
  source: string;
  expect: string;
};
type GraphCase = { id: string; kind: "graph"; entry: string; expect: string };
type GraphDiagnosticCase = { id: string; kind: "graph-diagnostic"; entry: string; expect: string };
type TypedTsCase = { id: string; kind: "typed-ts"; source: string; expect: string };
type TypedTsGraphCase = { id: string; kind: "typed-ts-graph"; entry: string; expect: string };
type DtsCase = { id: string; kind: "dts"; entry: string; expect: string };
type FormatCase = { id: string; kind: "format"; source: string; expect: string };
/** `kind` (lex|parse|check|type) is part of the diagnostic contract (ADR 0105). */
type CompactDiagnostic = { kind?: string; message: string; start: number; end: number };
type EmittedModule = { path: string; js: string };
type Case =
  | CompileCase
  | DiagnosticCase
  | RuntimeCase
  | GraphCase
  | GraphDiagnosticCase
  | TypedTsCase
  | TypedTsGraphCase
  | DtsCase
  | FormatCase;
/** `plugins` names entries of `conformancePlugins`; the case compiles under them. */
type ManifestCase = Case & { plugins?: string[]; docs?: boolean };
/**
 * `pending` cases pin behaviour the bootstrap compiler does not have yet. Their
 * expectations come from the accepted pre-deletion compiler, reviewed like any
 * other fixture. They run but may fail; one that passes must move to `required`.
 */
type Manifest = {
  version: 1;
  coverage: { required: string[]; pending?: string[] };
  cases: ManifestCase[];
};

const baseOptions: CompilerOptions = {
  open: false,
  runtime: true,
  docs: true,
  moduleExt: ".js",
  strictEntry: false,
};

/**
 * Host plugins, in the bootstrap shape (ADR 0109), that cases may name. A case
 * naming one missing from here fails.
 */
const conformancePlugins: Record<string, CompilerPlugin> = {
  preact: preactPlugin,
  "re-reduced": reReducedPlugin,
  "styled-cva": styledCvaPlugin,
};

const optionsFor = (test: ManifestCase): CompilerOptions | string => {
  const opts = { ...baseOptions, docs: test.docs ?? baseOptions.docs };
  if (test.plugins === undefined) return opts;
  const missing = test.plugins.filter((name) => !(name in conformancePlugins));
  if (missing.length > 0) return `no bootstrap plugin ${missing.map((n) => `'${n}'`).join(", ")}`;
  return { ...opts, plugins: test.plugins.map((name) => conformancePlugins[name]!) };
};
const fixtureRoot = resolve(import.meta.dir, "../test/conformance");
const candidateRoot = join(fixtureRoot, ".candidate");

const text = (path: string): string => readFileSync(join(fixtureRoot, path), "utf8");
const expectedJson = (path: string): unknown => JSON.parse(text(path)) as unknown;
const resultError = (id: string, message: string): string => `${id}: ${message}`;
const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const compactDiagnostics = (errors: readonly CompactDiagnostic[]): CompactDiagnostic[] =>
  errors.map(({ kind, message, start, end }) => ({ kind, message, start, end }));
const evaluateRuntime = (js: string, names: string[]): unknown =>
  new Function(
    "match",
    `"use strict";\n${js.replace('import { match } from "@onrails/pattern";\n', "")}\nreturn { ${names.join(", ")} };`,
  )(match) as unknown;
const graphDiagnostic = (entry: string, error: CompactDiagnostic) => ({
  kind: error.kind,
  message: error.message.replace(fixtureRoot, "<fixtures>"),
  start: error.start,
  end: error.end,
  entry: relative(fixtureRoot, entry),
});
const graphDiagnostics = (entry: string, errors: readonly CompactDiagnostic[]) =>
  errors.map((error) => graphDiagnostic(entry, error));

const typecheck = (id: string, source: string): string | null => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-conformance-"));
  try {
    const file = join(dir, "out.ts");
    writeFileSync(file, source);
    const result = Bun.spawnSync([
      "bun",
      "x",
      "tsc",
      "--ignoreConfig",
      "--strict",
      "--noEmit",
      file,
    ]);
    return result.exitCode === 0
      ? null
      : resultError(id, (result.stdout.toString() + result.stderr.toString()).trim());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const graphOutput = (entry: string, outputs: EmittedModule[]) =>
  outputs.map(({ path, js }) => ({ path: relative(dirname(entry), path), js }));

const typecheckGraph = (id: string, entry: string, outputs: EmittedModule[]): string | null => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-conformance-"));
  try {
    const files = outputs.map(({ path, js }) => {
      const file = join(dir, relative(dirname(entry), path).replace(/\.mochi$/, ".ts"));
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, js);
      return file;
    });
    const result = Bun.spawnSync([
      "bun",
      "x",
      "tsc",
      "--ignoreConfig",
      "--strict",
      "--noEmit",
      "--module",
      "esnext",
      "--moduleResolution",
      "bundler",
      ...files,
    ]);
    return result.exitCode === 0
      ? null
      : resultError(id, (result.stdout.toString() + result.stderr.toString()).trim());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const runCase = (test: ManifestCase): string | null => {
  const options = optionsFor(test);
  if (typeof options === "string") return resultError(test.id, options);
  switch (test.kind) {
    case "compile": {
      const result = compileSyncWith(text(test.source), options);
      if (result._tag === "Err")
        return resultError(
          test.id,
          `unexpected diagnostics ${JSON.stringify(compactDiagnostics(result.error))}`,
        );
      return result.value === text(test.expect)
        ? null
        : resultError(test.id, "emitted JavaScript differs");
    }
    case "diagnostic": {
      const result = compileSyncWith(text(test.source), options);
      if (result._tag === "Ok") return resultError(test.id, "expected a diagnostic");
      const actual = compactDiagnostics(result.error);
      return JSON.stringify(actual) === JSON.stringify(expectedJson(test.expect))
        ? null
        : resultError(test.id, `diagnostic differs: ${JSON.stringify(actual)}`);
    }
    case "runtime": {
      const result = compileSyncWith(text(test.source), options);
      if (result._tag === "Err")
        return resultError(
          test.id,
          `unexpected diagnostics ${JSON.stringify(compactDiagnostics(result.error))}`,
        );
      const expected = expectedJson(test.expect) as Record<string, unknown>;
      const names = Object.keys(expected);
      const actual = evaluateRuntime(result.value, names);
      return JSON.stringify(actual) === JSON.stringify(expected)
        ? null
        : resultError(test.id, `runtime result differs: ${JSON.stringify(actual)}`);
    }
    case "graph": {
      const entry = join(fixtureRoot, test.entry);
      const result = buildModulesWith(entry, options);
      if (result._tag === "Err")
        return resultError(
          test.id,
          `unexpected diagnostics ${JSON.stringify(compactDiagnostics(result.error))}`,
        );
      const actual = graphOutput(entry, result.value);
      return JSON.stringify(actual) === JSON.stringify(expectedJson(test.expect))
        ? null
        : resultError(test.id, `module output differs: ${JSON.stringify(actual)}`);
    }
    case "graph-diagnostic": {
      const entry = join(fixtureRoot, test.entry);
      const result = buildModulesWith(entry, options);
      if (result._tag === "Ok") return resultError(test.id, "expected a graph diagnostic");
      const actual = graphDiagnostics(entry, result.error);
      return JSON.stringify(actual) === JSON.stringify(expectedJson(test.expect))
        ? null
        : resultError(test.id, `graph diagnostic differs: ${JSON.stringify(actual)}`);
    }
    case "dts": {
      const entry = join(fixtureRoot, test.entry);
      const result = emitDtsForFileWith(entry, "@mochi/runtime", options);
      if (result._tag === "Err")
        return resultError(
          test.id,
          `unexpected diagnostics ${JSON.stringify(compactDiagnostics([result.error]))}`,
        );
      return result.value === text(test.expect)
        ? null
        : resultError(test.id, `declarations differ: ${JSON.stringify(result.value)}`);
    }
    case "format": {
      const result = format(text(test.source), options.plugins);
      if (result === null) return resultError(test.id, "unexpected lex error");
      return result === text(test.expect)
        ? null
        : resultError(test.id, `formatted text differs: ${JSON.stringify(result)}`);
    }
    case "typed-ts-graph": {
      const entry = join(fixtureRoot, test.entry);
      const result = buildModulesTsWith(entry, "@mochi/runtime", options);
      if (result._tag === "Err")
        return resultError(
          test.id,
          `unexpected diagnostics ${JSON.stringify(compactDiagnostics(result.error))}`,
        );
      const actual = graphOutput(entry, result.value);
      if (JSON.stringify(actual) !== JSON.stringify(expectedJson(test.expect)))
        return resultError(test.id, "emitted TypeScript graph differs");
      return typecheckGraph(test.id, entry, result.value);
    }
  }

  const result = compileTsSyncWith(text(test.source), "@mochi/runtime", options);
  if (result._tag === "Err")
    return resultError(
      test.id,
      `unexpected diagnostics ${JSON.stringify(compactDiagnostics(result.error))}`,
    );
  if (result.value !== text(test.expect)) return resultError(test.id, "emitted TypeScript differs");
  return typecheck(test.id, result.value);
};

const candidateFor = (test: ManifestCase): { path: string; contents: string } => {
  const options = optionsFor(test);
  if (typeof options === "string") throw new Error(resultError(test.id, options));
  switch (test.kind) {
    case "compile": {
      const result = compileSyncWith(text(test.source), options);
      if (result._tag === "Err")
        throw new Error(resultError(test.id, JSON.stringify(compactDiagnostics(result.error))));
      return { path: test.expect, contents: result.value };
    }
    case "diagnostic": {
      const result = compileSyncWith(text(test.source), options);
      if (result._tag === "Ok") throw new Error(resultError(test.id, "expected a diagnostic"));
      return {
        path: test.expect,
        contents: json(compactDiagnostics(result.error)),
      };
    }
    case "runtime": {
      const result = compileSyncWith(text(test.source), options);
      if (result._tag === "Err")
        throw new Error(resultError(test.id, JSON.stringify(compactDiagnostics(result.error))));
      const expected = expectedJson(test.expect) as Record<string, unknown>;
      const names = Object.keys(expected);
      const actual = evaluateRuntime(result.value, names);
      return { path: test.expect, contents: json(actual) };
    }
    case "graph": {
      const entry = join(fixtureRoot, test.entry);
      const result = buildModulesWith(entry, options);
      if (result._tag === "Err")
        throw new Error(resultError(test.id, JSON.stringify(compactDiagnostics(result.error))));
      return {
        path: test.expect,
        contents: json(graphOutput(entry, result.value)),
      };
    }
    case "graph-diagnostic": {
      const entry = join(fixtureRoot, test.entry);
      const result = buildModulesWith(entry, options);
      if (result._tag === "Ok")
        throw new Error(resultError(test.id, "expected a graph diagnostic"));
      return { path: test.expect, contents: json(graphDiagnostics(entry, result.error)) };
    }
    case "dts": {
      const entry = join(fixtureRoot, test.entry);
      const result = emitDtsForFileWith(entry, "@mochi/runtime", options);
      if (result._tag === "Err")
        throw new Error(resultError(test.id, JSON.stringify(compactDiagnostics([result.error]))));
      return { path: test.expect, contents: result.value };
    }
    case "format": {
      const result = format(text(test.source), options.plugins);
      if (result === null) throw new Error(resultError(test.id, "unexpected lex error"));
      return { path: test.expect, contents: result };
    }
    case "typed-ts-graph": {
      const entry = join(fixtureRoot, test.entry);
      const result = buildModulesTsWith(entry, "@mochi/runtime", options);
      if (result._tag === "Err")
        throw new Error(resultError(test.id, JSON.stringify(compactDiagnostics(result.error))));
      return { path: test.expect, contents: json(graphOutput(entry, result.value)) };
    }
  }

  const result = compileTsSyncWith(text(test.source), "@mochi/runtime", options);
  if (result._tag === "Err")
    throw new Error(resultError(test.id, JSON.stringify(compactDiagnostics(result.error))));
  return { path: test.expect, contents: result.value };
};

/** The reviewed minimum contract retained after retiring TS parity. */
const coverageErrorsFor = (manifest: Manifest): string[] => {
  const ids = manifest.cases.map((test) => test.id);
  const duplicated = ids.filter((id, index) => ids.indexOf(id) !== index);
  const missing = manifest.coverage.required.filter((id) => !ids.includes(id));
  const pending = manifest.coverage.pending ?? [];
  const missingPending = pending.filter((id) => !ids.includes(id));
  const both = pending.filter((id) => manifest.coverage.required.includes(id));
  return [
    ...[...new Set(duplicated)].map((id) => `duplicate conformance case '${id}'`),
    ...missing.map((id) => `required conformance case '${id}' is missing`),
    ...missingPending.map((id) => `pending conformance case '${id}' is missing`),
    ...both.map((id) => `conformance case '${id}' is both required and pending`),
  ];
};

/**
 * Write candidate expectations for human review. This is deliberately separate
 * from the normal runner: it never mutates the checked-in fixture tree.
 */
export const freezeConformance = (out = candidateRoot): string[] => {
  const manifest = JSON.parse(text("manifest.json")) as Manifest;
  if (manifest.version !== 1)
    throw new Error(`unsupported conformance manifest version ${manifest.version}`);
  const coverageErrors = coverageErrorsFor(manifest);
  if (coverageErrors.length > 0) throw new Error(coverageErrors.join("\n"));
  rmSync(out, { recursive: true, force: true });
  const paths: string[] = [];
  const pending = new Set(manifest.coverage.pending ?? []);
  for (const test of manifest.cases) {
    // Pending expectations come from the pre-deletion compiler, not the seed.
    if (pending.has(test.id)) continue;
    const candidate = candidateFor(test);
    const path = join(out, candidate.path);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, candidate.contents);
    paths.push(path);
  }
  return paths;
};

export type PendingStatus = { id: string; failure: string | null };

/** Where each pending case stands: its current failure, or `null` once it conforms. */
export const pendingConformance = (): PendingStatus[] => {
  const manifest = JSON.parse(text("manifest.json")) as Manifest;
  const pending = new Set(manifest.coverage.pending ?? []);
  return manifest.cases
    .filter((test) => pending.has(test.id))
    .map((test) => ({ id: test.id, failure: runCase(test) }));
};

/** Execute every checked-in case. `null` means the corpus conforms. */
const readManifest = (): Manifest => JSON.parse(text("manifest.json")) as Manifest;

/** Manifest-level failures: version and coverage, before any case runs. */
export const manifestConformanceErrors = (): string[] => {
  const manifest = readManifest();
  return manifest.version !== 1
    ? [`unsupported conformance manifest version ${manifest.version}`]
    : coverageErrorsFor(manifest);
};

/** Every case id, in manifest order — one test each keeps a timeout per case. */
export const bootstrapConformanceCaseIds = (): string[] => readManifest().cases.map((c) => c.id);

/** One case's failure, or null. A pending case that conforms is itself a failure. */
export const runConformanceCase = (id: string): string | null => {
  const manifest = readManifest();
  const test = manifest.cases.find((c) => c.id === id);
  if (test === undefined) return resultError(id, "no such case");
  const failure = runCase(test);
  if (!(manifest.coverage.pending ?? []).includes(id)) return failure;
  return failure
    ? null
    : resultError(id, "pending case now conforms; move it to coverage.required");
};

export const runConformance = (): string[] => {
  const errors = manifestConformanceErrors();
  if (readManifest().version !== 1) return errors;
  return [
    ...errors,
    ...bootstrapConformanceCaseIds().flatMap((id) => runConformanceCase(id) ?? []),
  ];
};

if (import.meta.main) {
  if (process.argv.includes("--pending")) {
    for (const { id, failure } of pendingConformance())
      process.stdout.write(`${failure === null ? "conforms" : "pending "}  ${failure ?? id}\n`);
  } else if (process.argv.includes("--freeze")) {
    const paths = freezeConformance();
    process.stdout.write(`bootstrap conformance candidates: ${paths.length}\n`);
  } else {
    const failures = runConformance();
    if (failures.length === 0) process.stdout.write("bootstrap conformance: PASS\n");
    else {
      process.stderr.write(`${failures.join("\n")}\n`);
      process.exitCode = 1;
    }
  }
}
