// Flag source files whose line count suggests they should be split or deepened.
// Long files usually mean a module has grown several responsibilities that want
// to be named and separated. Run: `bun run loc` (add `--all` to list everything).
import { Glob } from "bun";

const SPLIT = 600; // likely doing too much — split into cohesive modules
const WATCH = 400; // getting large — deepen abstractions before it hits SPLIT

const patterns = ["src/**/*.ts", "editors/**/src/**/*.ts", "scripts/**/*.ts"];
const showAll = process.argv.includes("--all");

const files: { path: string; lines: number }[] = [];
for (const pattern of patterns) {
  for await (const path of new Glob(pattern).scan(".")) {
    const lines = (await Bun.file(path).text()).split("\n").length;
    files.push({ path, lines });
  }
}
files.sort((a, b) => b.lines - a.lines);

const tier = (n: number) =>
  n >= SPLIT ? "SPLIT " : n >= WATCH ? "WATCH " : "ok    ";

const shown = showAll ? files : files.filter((f) => f.lines >= WATCH);

if (shown.length === 0) {
  console.log(`No files over ${WATCH} lines. All source files stay focused.`);
  process.exit(0);
}

for (const { path, lines } of shown) {
  console.log(`${tier(lines)} ${String(lines).padStart(5)}  ${path}`);
}

const split = files.filter((f) => f.lines >= SPLIT).length;
const watch = files.filter((f) => f.lines >= WATCH && f.lines < SPLIT).length;
console.log(
  `\n${files.length} files scanned — ${split} over ${SPLIT} (split), ${watch} over ${WATCH} (watch).`,
);
if (split > 0) process.exit(1); // fail CI when a file crosses the split line
