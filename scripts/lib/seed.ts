import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BOOTSTRAP_SEED } from "./repo";

export const HOST_SHIMS = ["host.mjs", "prelude.gen.mjs", "plugins/jsx-schema.gen.mjs"] as const;

export type SeedManifest = {
  readonly sourceRevision: string;
  readonly emitted?: Record<string, string>;
  readonly files: Record<string, string>;
};

export const readSeedManifest = (seedDir = BOOTSTRAP_SEED): SeedManifest =>
  JSON.parse(readFileSync(join(seedDir, "manifest.json"), "utf8")) as SeedManifest;

export const walkFiles = (dir: string, prefix = ""): readonly string[] => {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${name.name}` : name.name;
    if (name.isDirectory()) out.push(...walkFiles(join(dir, name.name), rel));
    else out.push(rel);
  }
  return out;
};
