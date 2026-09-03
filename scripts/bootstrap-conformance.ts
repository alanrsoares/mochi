/**
 * Black-box conformance checks for the shipped bootstrap compiler (ADR 0105).
 *
 * This module deliberately reaches the compiler only through its bootstrap
 * facades. Do not import the hand-authored TypeScript compiler core here: this
 * is the gate intended to outlive that implementation.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { buildModulesBootstrapWith } from "@mochi/compiler/bootstrap/module";
import {
  compileBootstrapSyncWith,
  compileTsBootstrapSyncWith,
} from "@mochi/compiler/bootstrap/sync";

type CompileCase = { id: string; kind: "compile"; source: string; expect: string };
type DiagnosticCase = { id: string; kind: "diagnostic"; source: string; expect: string };
type RuntimeCase = {
  id: string;
  kind: "runtime";
  source: string;
  exports: Record<string, unknown>;
};
type GraphCase = { id: string; kind: "graph"; entry: string; expect: string };
type TypedTsCase = { id: string; kind: "typed-ts"; source: string; expect: string };
type Case = CompileCase | DiagnosticCase | RuntimeCase | GraphCase | TypedTsCase;
type Manifest = { version: 1; cases: Case[] };

const options = { open: false, docs: true, moduleExt: ".js", strictEntry: false };
const fixtureRoot = resolve(import.meta.dir, "../test/conformance");

const text = (path: string): string => readFileSync(join(fixtureRoot, path), "utf8");
const expectedJson = (path: string): unknown => JSON.parse(text(path)) as unknown;
const resultError = (id: string, message: string): string => `${id}: ${message}`;

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
    const names = Object.keys(test.exports);
    const actual = new Function(
      `"use strict";\n${result.value}\nreturn { ${names.join(", ")} };`,
    )() as unknown;
    return JSON.stringify(actual) === JSON.stringify(test.exports)
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

  const result = compileTsBootstrapSyncWith(text(test.source), "@mochi/runtime", options);
  if (result._tag === "Err")
    return resultError(test.id, `unexpected diagnostic ${result.error.message}`);
  if (result.value !== text(test.expect)) return resultError(test.id, "emitted TypeScript differs");
  return typecheck(test.id, result.value);
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
  const failures = runBootstrapConformance();
  if (failures.length === 0) process.stdout.write("bootstrap conformance: PASS\n");
  else {
    process.stderr.write(`${failures.join("\n")}\n`);
    process.exitCode = 1;
  }
}
