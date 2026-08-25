/**
 * Open-world inference is an explicit escape hatch for files that intentionally
 * refer to host globals. A file-local directive wins over the caller's default
 * so a module graph can mix strict Mochi with one host-global-heavy adapter.
 */
export const openMode = (src: string, requested = false): boolean =>
  requested || /^\s*"use open"[ \t]*(?:\r?\n|$)/.test(src);
