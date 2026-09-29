// CodSpeed entry (.github/workflows/codspeed.yml). Small versions of the
// `bun run bench` cases (`CODSPEED_SUITES` in scripts/lib/bench-suites.ts),
// run under Node through tinybench. In CI, CodSpeed counts instructions under simulation, so results
// do not depend on the runner's load. Outside CodSpeed, `withCodSpeed` falls
// back to plain tinybench.
//
// Node cannot load the Bun-style TS sources, so `scripts/build-codspeed.ts`
// bundles this file first; `bun run bench:codspeed` builds and runs it.
//
// The benchmarks run in a worker with a large stack. The self-hosted compiler
// recurses once per character and per list element, and relies on the proper
// tail calls JavaScriptCore (Bun) implements. V8 does not, so on Node's default
// ~1 MB main-thread stack a large file overflows, and `--stack-size` cannot go
// past the OS thread stack. A worker's stack is sized at creation.
import { isMainThread, Worker } from "node:worker_threads";
import { withCodSpeed } from "@codspeed/tinybench-plugin";
import { Bench } from "tinybench";
import { CODSPEED_SUITES } from "../scripts/lib/bench-suites";

const STACK_MB = 512;

const runBenchmarks = async (): Promise<void> => {
  // One iteration after one warmup: CodSpeed's simulation needs no more, and
  // it keeps the local fallback run short.
  const bench = withCodSpeed(
    new Bench({ iterations: 1, warmupIterations: 1, time: 0, warmupTime: 0 }),
  );
  for (const suite of Object.values(CODSPEED_SUITES)) {
    for (const c of await suite.cases(process.cwd())) {
      bench.add(c.name, async () => {
        await c.run();
      });
    }
  }
  await bench.run();
  console.table(bench.table());
};

if (isMainThread) {
  const worker = new Worker(new URL(import.meta.url), {
    resourceLimits: { stackSizeMb: STACK_MB },
  });
  worker.on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
  });
  worker.on("exit", (code) => {
    if (code !== 0) process.exitCode = code;
  });
} else {
  await runBenchmarks();
}
