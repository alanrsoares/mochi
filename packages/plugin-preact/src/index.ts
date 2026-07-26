/**
 * Preact host adapter (ADR 0015).
 *
 * Kit-owned seam: honest hook schemes live in `hooks.mochi`; this package
 * registers a thin `HostExtension` placeholder for future `inferCall` /
 * Rules-of-Hooks checks. Register via the project vendor-plugin list.
 */
import type { HostExtension } from "../../../src/extensions";

/**
 * v0: types come from `hooks.mochi` externs (ADR 0012 preference 1).
 * Later waves may add `inferCall` (updater overloads) / a `check` hook.
 */
export const preactExtension: HostExtension = {
  name: "preact",
};
