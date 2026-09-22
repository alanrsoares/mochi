import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { relative } from "node:path";
import { REPO_ROOT } from "./repo";

export type SyncFileOptions = {
  readonly check?: boolean;
  readonly regenCommand?: string;
};

/**
 * Writes or verifies a generated file against expected content.
 * When `check` mode is active (explicit or via `--check` flag), exits non-zero if the disk file differs.
 */
export const syncGeneratedFile = (
  filePath: string,
  content: string,
  options: SyncFileOptions = {},
): void => {
  const check = options.check ?? process.argv.includes("--check");
  const relPath = relative(REPO_ROOT, filePath);
  if (check) {
    const onDisk = existsSync(filePath) ? readFileSync(filePath, "utf8") : null;
    if (onDisk !== content) {
      const hint = options.regenCommand ? ` — run \`${options.regenCommand}\`` : "";
      console.error(`${relPath} is stale${hint}`);
      process.exit(1);
    }
    console.error(`${relPath} is up to date`);
  } else {
    writeFileSync(filePath, content);
    console.error(`wrote ${relPath}`);
  }
};
