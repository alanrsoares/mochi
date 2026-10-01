// Compile under Bun, measure the frozen emitted JS under Node. No compiler in the timed process.
// bun scripts/bench-loop-node.ts
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loopKernels } from "./lib/bench-loop";
import { repoPath } from "./lib/repo";

const out = repoPath(".cache", "bench", "loop-recur");
mkdirSync(out, { recursive: true });
const version = spawnSync("node", ["--version"], { encoding: "utf8" });
if (version.status !== 0) throw new Error(version.stderr || "Node is required");
console.log(`Node ${version.stdout.trim()}; 12 runs of 2,000,000 iterations`);

for (const kernel of loopKernels()) {
  for (const variant of ["array", "emitted"] as const) {
    const name = `${kernel.name.replace("/", "-")}-${variant}`;
    const file = join(out, `${name}.mjs`);
    writeFileSync(
      file,
      `${kernel[variant]}
const expected = ${kernel.expected.toString()};
for (const n of [0, 1, 2, 3, 17, 10001]) {
  if (run(n) !== expected(n)) throw new Error("wrong result");
}
for (let i = 0; i < 30; i++) run(2000000);
const trace = process.argv.includes("--gc");
if (trace) globalThis.gc();
console.log("MEASURE_START");
const samples = [];
for (let i = 0; i < 12; i++) {
  const start = performance.now();
  const value = run(2000000);
  samples.push(performance.now() - start);
  if (value !== expected(2000000)) throw new Error("wrong result");
}
if (trace) globalThis.gc();
console.log("MEASURE_END");
console.log(JSON.stringify({samples, best: Math.min(...samples), median: samples.toSorted((a,b) => a-b)[6]}));
`,
    );
    const timed = spawnSync("node", [file], { encoding: "utf8" });
    if (timed.status !== 0) throw new Error(timed.stderr || `${name}: timing failed`);
    const trace = spawnSync("node", ["--expose-gc", "--trace-gc-nvp", file, "--gc"], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
    if (trace.status !== 0) throw new Error(trace.stderr || `${name}: GC trace failed`);
    writeFileSync(join(out, `${name}-timing.log`), timed.stdout);
    writeFileSync(join(out, `${name}-gc.log`), trace.stdout + trace.stderr);
    const measured = trace.stdout.split("MEASURE_START\n")[1]?.split("MEASURE_END")[0];
    if (measured === undefined) throw new Error(`${name}: missing measurement markers`);
    const events = measured.split("\n").filter((line) => line.includes(" gc="));
    const allocated = events.reduce(
      (total, line) => total + Number(line.match(/ allocated=(\d+)/)?.[1] ?? 0),
      0,
    );
    const samples = timed.stdout.trim().split("\n").at(-1);
    console.log(
      `${name}: ${samples}; GC events=${events.length}; trace allocated=${allocated} bytes`,
    );
  }
}
console.log(`raw timing and GC logs: ${out}`);
