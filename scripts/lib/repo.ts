import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const REPO_ROOT = resolve(import.meta.dir, "../..");

export const repoPath = (...parts: readonly string[]): string => join(REPO_ROOT, ...parts);

export const BOOTSTRAP_DIR = repoPath("bootstrap");
export const BOOTSTRAP_CLI = join(BOOTSTRAP_DIR, "cli.mochi");
export const BOOTSTRAP_SEED = join(BOOTSTRAP_DIR, "seed");
export const RUNTIME_SRC = repoPath("packages", "compiler", "src", "prelude", "runtime");
export const TSC_BIN = repoPath("node_modules", ".bin", "tsc");
export const BIOME_BIN = repoPath("node_modules", ".bin", "biome");

export const sha256 = (buf: Buffer | string): string =>
  createHash("sha256").update(buf).digest("hex");

export const fileSha256 = (path: string): string => sha256(readFileSync(path));
