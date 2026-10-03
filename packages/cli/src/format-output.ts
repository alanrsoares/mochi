import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { err, isErr, ok, type Result, trySync } from "@onrails/result";

export type OutputLanguage = "js" | "ts" | "tsx";
export type OutputFormatOptions = {
  readonly language: OutputLanguage;
  readonly lineWidth?: number;
};

/** Format at the host output boundary, independently of the caller's project config. */
export function formatOutput(source: string, options: OutputFormatOptions): Result<string, Error> {
  if (source.trim() === "") return ok(source);
  const result = trySync(() =>
    spawnSync(
      process.execPath,
      [
        fileURLToPath(import.meta.resolve("@biomejs/biome/bin/biome")),
        "format",
        `--config-path=${fileURLToPath(new URL("./output-format.json", import.meta.url))}`,
        `--stdin-file-path=emit.${options.language}`,
        `--line-width=${options.lineWidth ?? 88}`,
      ],
      { input: source, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    ),
  );
  if (isErr(result)) return result;
  if (result.value.error) return err(result.value.error);
  if (result.value.status !== 0)
    return err(new Error(`Biome output formatting failed: ${result.value.stderr.trim()}`));
  return ok(result.value.stdout);
}
