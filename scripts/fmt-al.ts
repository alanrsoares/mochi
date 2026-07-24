// Dogfood mochi's own formatter on the self-hosted `bootstrap/*.mochi` sources.
// Default: rewrite each file in place. `--check`: exit non-zero if any file
// isn't already formatted (the QA-gate mode) — this keeps our formatter honest
// against ~3.4k lines of real code and blocks any regression that would move,
// drop, or corrupt our own source.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isErr, unwrapOk } from "@onrails/result";
import { format } from "../src/format";

const DIR = "bootstrap";
const check = process.argv.includes("--check");

const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".mochi"))
  .map((f) => join(DIR, f))
  .toSorted();

const drift: string[] = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const r = format(src);
  if (isErr(r)) {
    console.error(`format error in ${f}: ${r.error.kind}: ${r.error.message}`);
    process.exit(1);
  }
  const out = unwrapOk(r);
  if (out === src) continue;
  if (check) drift.push(f);
  else {
    writeFileSync(f, out);
    console.error(`  formatted ${f}`);
  }
}

if (check && drift.length) {
  console.error(
    `unformatted .mochi files (run \`bun run fmt:al\`):\n${drift.map((f) => `  ${f}`).join("\n")}`,
  );
  process.exit(1);
}
