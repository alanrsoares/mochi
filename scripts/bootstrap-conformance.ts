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
import { buildModulesBootstrapWith } from "@mochi/compiler/bootstrap/module";
import {
  compileBootstrapSyncWith,
  compileTsBootstrapSyncWith,
} from "@mochi/compiler/bootstrap/sync";
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
type CompactDiagnostic = { message: string; start: number; end: number };
type Case =
  | CompileCase
  | DiagnosticCase
  | RuntimeCase
  | GraphCase
  | GraphDiagnosticCase
  | TypedTsCase;
type Manifest = { version: 1; cases: Case[] };

const options = { open: false, docs: true, moduleExt: ".js", strictEntry: false };
const fixtureRoot = resolve(import.meta.dir, "../test/conformance");
const candidateRoot = join(fixtureRoot, ".candidate");

const text = (path: string): string => readFileSync(join(fixtureRoot, path), "utf8");
const expectedJson = (path: string): unknown => JSON.parse(text(path)) as unknown;
const resultError = (id: string, message: string): string => `${id}: ${message}`;
const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const evaluateRuntime = (js: string, names: string[]): unknown =>
  new Function(
    "match",
    `"use strict";\n${js.replace('import { match } from "@onrails/pattern";\n', "")}\nreturn { ${names.join(", ")} };`,
  )(match) as unknown;
const graphDiagnostic = (entry: string, error: CompactDiagnostic) => ({
  message: error.message.replace(fixtureRoot, "<fixtures>"),
  start: error.start,
  end: error.end,
  entry: relative(fixtureRoot, entry),
});

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
    if (result.exitCode === 0) return null;
    return resultError(id, (result.stdout.toString() + result.stderr.toString()).trim());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const runCase = (test: Case): string | null => {
  if (test.kind === "compile") {
    const result = compileBootstrapSyncWith(text(test.source), options);
    if (result._tag === "Err")
      return resultError(test.id, `unexpected diagnostic ${result.error.message}`);
    return result.value === text(test.expect)
      ? null
      : resultError(test.id, "emitted JavaScript differs");
  }

  if (test.kind === "diagnostic") {
    const result = compileBootstrapSyncWith(text(test.source), options);
    if (result._tag === "Ok") return resultError(test.id, "expected a diagnostic");
    const actual = {
      message: result.error.message,
      start: result.error.start,
      end: result.error.end,
    };
    return JSON.stringify(actual) === JSON.stringify(expectedJson(test.expect))
      ? null
      : resultError(test.id, `diagnostic differs: ${JSON.stringify(actual)}`);
  }

  if (test.kind === "runtime") {
    const result = compileBootstrapSyncWith(text(test.source), options);
    if (result._tag === "Err")
      return resultError(test.id, `unexpected diagnostic ${result.error.message}`);
    const expected = expectedJson(test.expect) as Record<string, unknown>;
    const names = Object.keys(expected);
    const actual = evaluateRuntime(result.value, names);
    return JSON.stringify(actual) === JSON.stringify(expected)
      ? null
      : resultError(test.id, `runtime result differs: ${JSON.stringify(actual)}`);
  }

  if (test.kind === "graph") {
    const entry = join(fixtureRoot, test.entry);
    const result = buildModulesBootstrapWith(entry, options);
    if (result._tag === "Err")
      return resultError(test.id, `unexpected diagnostic ${result.error.message}`);
    const actual = result.value.map(({ path, js }) => ({
      path: relative(dirname(entry), path),
      js,
    }));
    return JSON.stringify(actual) === JSON.stringify(expectedJson(test.expect))
      ? null
      : resultError(test.id, `module output differs: ${JSON.stringify(actual)}`);
  }

  if (test.kind === "graph-diagnostic") {
    const entry = join(fixtureRoot, test.entry);
    const result = buildModulesBootstrapWith(entry, options);
    if (result._tag === "Ok") return resultError(test.id, "expected a graph diagnostic");
    const actual = graphDiagnostic(entry, result.error);
    return JSON.stringify(actual) === JSON.stringify(expectedJson(test.expect))
      ? null
      : resultError(test.id, `graph diagnostic differs: ${JSON.stringify(actual)}`);
  }

  const result = compileTsBootstrapSyncWith(text(test.source), "@mochi/runtime", options);
  if (result._tag === "Err")
    return resultError(test.id, `unexpected diagnostic ${result.error.message}`);
  if (result.value !== text(test.expect)) return resultError(test.id, "emitted TypeScript differs");
  return typecheck(test.id, result.value);
};

const candidateFor = (test: Case): { path: string; contents: string } => {
  if (test.kind === "compile") {
    const result = compileBootstrapSyncWith(text(test.source), options);
    if (result._tag === "Err") throw new Error(resultError(test.id, result.error.message));
    return { path: test.expect, contents: result.value };
  }

  if (test.kind === "diagnostic") {
    const result = compileBootstrapSyncWith(text(test.source), options);
    if (result._tag === "Ok") throw new Error(resultError(test.id, "expected a diagnostic"));
    return {
      path: test.expect,
      contents: json({
        message: result.error.message,
        start: result.error.start,
        end: result.error.end,
      }),
    };
  }

  if (test.kind === "runtime") {
    const result = compileBootstrapSyncWith(text(test.source), options);
    if (result._tag === "Err") throw new Error(resultError(test.id, result.error.message));
    const expected = expectedJson(test.expect) as Record<string, unknown>;
    const names = Object.keys(expected);
    const actual = evaluateRuntime(result.value, names);
    return { path: test.expect, contents: json(actual) };
  }

  if (test.kind === "graph") {
    const entry = join(fixtureRoot, test.entry);
    const result = buildModulesBootstrapWith(entry, options);
    if (result._tag === "Err") throw new Error(resultError(test.id, result.error.message));
    return {
      path: test.expect,
      contents: json(
        result.value.map(({ path, js }) => ({ path: relative(dirname(entry), path), js })),
      ),
    };
  }

  if (test.kind === "graph-diagnostic") {
    const entry = join(fixtureRoot, test.entry);
    const result = buildModulesBootstrapWith(entry, options);
    if (result._tag === "Ok") throw new Error(resultError(test.id, "expected a graph diagnostic"));
    return { path: test.expect, contents: json(graphDiagnostic(entry, result.error)) };
  }

  const result = compileTsBootstrapSyncWith(text(test.source), "@mochi/runtime", options);
  if (result._tag === "Err") throw new Error(resultError(test.id, result.error.message));
  return { path: test.expect, contents: result.value };
};

/**
 * Write candidate expectations for human review. This is deliberately separate
 * from the normal runner: it never mutates the checked-in fixture tree.
 */
export const freezeBootstrapConformance = (out = candidateRoot): string[] => {
  const manifest = JSON.parse(text("manifest.json")) as Manifest;
  if (manifest.version !== 1)
    throw new Error(`unsupported conformance manifest version ${manifest.version}`);
  rmSync(out, { recursive: true, force: true });
  const paths: string[] = [];
  for (const test of manifest.cases) {
    const candidate = candidateFor(test);
    const path = join(out, candidate.path);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, candidate.contents);
    paths.push(path);
  }
  return paths;
};

/** Execute every checked-in case. `null` means the corpus conforms. */
export const runBootstrapConformance = (): string[] => {
  const manifest = JSON.parse(text("manifest.json")) as Manifest;
  if (manifest.version !== 1)
    return [`unsupported conformance manifest version ${manifest.version}`];
  return manifest.cases.flatMap((test) => {
    const failure = runCase(test);
    return failure ? [failure] : [];
  });
};

if (import.meta.main) {
  if (process.argv.includes("--freeze")) {
    const paths = freezeBootstrapConformance();
    process.stdout.write(`bootstrap conformance candidates: ${paths.length}\n`);
  } else {
    const failures = runBootstrapConformance();
    if (failures.length === 0) process.stdout.write("bootstrap conformance: PASS\n");
    else {
      process.stderr.write(`${failures.join("\n")}\n`);
      process.exitCode = 1;
    }
  }
}
