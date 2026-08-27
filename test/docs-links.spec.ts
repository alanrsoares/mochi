// C10 — relative links in README + docs/ must resolve. Stale `example.mochi`
// (moved to `examples/` in c84df4d) is the bug this catches. Fenced code is
// stripped so JSX `src="logo.png"` examples (fenced or inline) are not treated
// as repo paths.
import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { repoRoot } from "@mochi/test-support";

const root = repoRoot(import.meta.url);

const mdFiles = (dir: string): string[] => {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...mdFiles(p));
    else if (name.endsWith(".md")) out.push(p);
  }
  return out;
};

const LINK = /\[[^\]]*\]\(([^)]+)\)|(?:href|src)="([^"]+)"/g;

test("README and docs/ relative links resolve (C10)", () => {
  const files = [join(root, "README.md"), ...mdFiles(join(root, "docs"))];
  const missing: string[] = [];
  for (const file of files) {
    const src = readFileSync(file, "utf8")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "");
    const dir = dirname(file);
    for (const m of src.matchAll(LINK)) {
      const raw = (m[1] ?? m[2] ?? "").trim();
      const dest = raw
        .replace(/^<|>$/g, "")
        .replace(/\s+".*"$/, "")
        .replace(/\s+'.*'$/, "");
      if (!dest || dest.startsWith("#")) continue;
      if (/^[a-z][a-z0-9+.-]*:/i.test(dest)) continue;
      const pathOnly = dest.split("#")[0]!;
      if (pathOnly === "") continue;
      const resolved = resolve(dir, pathOnly);
      if (!existsSync(resolved)) missing.push(`${file.slice(root.length + 1)} → ${dest}`);
    }
  }
  expect(missing).toEqual([]);
});
