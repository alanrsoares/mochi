// Remove ignored build / emit / scratch artifacts (see .gitignore).
import { unlinkSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Glob } from "bun";

const root = join(import.meta.dir, "..");

const dirs = [
  "out",
  "dist",
  "coverage",
  ".fixpoint-work",
  "test/.tsgen",
  "test/.tsgen-graph",
  "editors/vscode/out",
];

let n = 0;
for (const d of dirs) {
  const p = join(root, d);
  if (!existsSync(p)) continue;
  rmSync(p, { recursive: true, force: true });
  console.error(`  rm ${d}/`);
  n++;
}

for await (const p of new Glob("test/.mochi-cli-*").scan({ cwd: root, absolute: true, onlyFiles: false })) {
  rmSync(p, { recursive: true, force: true });
  console.error(`  rm ${p.slice(root.length + 1)}/`);
  n++;
}

// All `.js` outside node_modules (mochi build emit). Bootstrap TS emit beside sources.
for (const pattern of ["**/*.js", "bootstrap/*.ts", "bootstrap/*.d.mts"] as const) {
  for await (const p of new Glob(pattern).scan({ cwd: root, absolute: true })) {
    if (p.includes(`${root}/node_modules/`) || p.includes("/node_modules/")) continue;
    unlinkSync(p);
    console.error(`  rm ${p.slice(root.length + 1)}`);
    n++;
  }
}

console.error(n === 0 ? "nothing to clean" : `cleaned ${n} paths`);
