/**
 * Point this clone at repo-tracked hooks (`.githooks/`).
 * Idempotent — safe to re-run; wired as `prepare` so `bun install` enables them.
 */
import { $ } from "bun";

const desired = ".githooks";
const current = (await $`git config --get core.hooksPath`.nothrow().text()).trim();

if (current === desired) {
  console.error(`hooks: core.hooksPath already ${desired}`);
  process.exit(0);
}

await $`git config core.hooksPath ${desired}`;
console.error(`hooks: set core.hooksPath=${desired}`);
