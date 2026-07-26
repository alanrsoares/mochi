/**
 * Install lefthook-managed git hooks. Idempotent — safe to re-run; wired as
 * `prepare` so `bun install` enables them.
 *
 * `--reset-hooks-path` clears a legacy `core.hooksPath=.githooks` (pre-lefthook)
 * so wrappers land in `.git/hooks/`.
 */
import { $ } from "bun";

await $`bunx lefthook install --reset-hooks-path`;
