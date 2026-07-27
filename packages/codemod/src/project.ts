import { readFileSync, writeFileSync } from "node:fs";
import type { Diagnostic } from "@mochi/compiler/errors";
import { formatError } from "@mochi/compiler/errors";
import { isErr } from "@onrails/result";
import { type CodemodOptions, type CodemodTransform, transformSource } from "./transform.ts";

export type PathTransformResult =
  | { ok: true; path: string; changed: boolean; out: string }
  | { ok: false; path: string; diagnostics: Diagnostic[] };

export type ProjectOptions = CodemodOptions & {
  /** Apply changes in place. */
  write?: boolean;
  /** Exit-style: report paths that would change without writing. */
  check?: boolean;
};

export type ProjectReport = {
  changed: string[];
  unchanged: string[];
  errors: { path: string; diagnostics: Diagnostic[] }[];
};

const defaultIgnore = (part: string) =>
  part === "node_modules" || part === "dist" || part === ".cache";

/** Expand glob patterns to sorted `.mochi` paths (repo-relative). */
export const expandMochiGlobs = (globs: string[], cwd = "."): string[] => {
  const out = new Set<string>();
  for (const pattern of globs) {
    for (const hit of new Bun.Glob(pattern).scanSync({ cwd })) {
      if (hit.split("/").some(defaultIgnore)) continue;
      if (!hit.endsWith(".mochi")) continue;
      out.add(hit);
    }
  }
  return [...out].toSorted();
};

export const transformPath = (
  path: string,
  transform: CodemodTransform,
  opts: CodemodOptions = {},
): PathTransformResult => {
  const src = readFileSync(path, "utf8");
  const r = transformSource(src, (prog) => transform(prog, { src, path }), opts);
  if (isErr(r)) return { ok: false, path, diagnostics: r.error };
  const out = r.value;
  return { ok: true, path, changed: out !== src, out };
};

/** Run a transform over many `.mochi` files. */
export const transformProject = (
  paths: string[],
  transform: CodemodTransform,
  opts: ProjectOptions = {},
): ProjectReport => {
  const report: ProjectReport = { changed: [], unchanged: [], errors: [] };
  for (const path of paths) {
    const r = transformPath(path, transform, opts);
    if (!r.ok) {
      report.errors.push({ path, diagnostics: r.diagnostics });
      continue;
    }
    if (!r.changed) {
      report.unchanged.push(path);
      continue;
    }
    if (opts.check) {
      report.changed.push(path);
      continue;
    }
    if (opts.write) {
      writeFileSync(path, r.out);
      report.changed.push(path);
      continue;
    }
    report.changed.push(path);
  }
  return report;
};

export const printProjectErrors = (report: ProjectReport): void => {
  for (const { path, diagnostics } of report.errors) {
    const src = readFileSync(path, "utf8");
    for (const d of diagnostics) {
      console.error(`${path}: ${formatError(d, src)}`);
    }
  }
};
