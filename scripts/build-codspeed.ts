// Bundle bench/codspeed.ts for Node, into .cache/codspeed/bench.mjs.
//
// Two seed seams are Bun-only and swapped at bundle time:
// - `bootstrap/seed-path.ts` loads `module.bundle.cjs` with `createRequire`
//   at run time. That file is ESM despite its name (Bun accepts it; Node's
//   `require` does not), so the bundle imports it statically instead.
// - The seed `*.bundle.cjs` files are read with the `js` loader, which
//   detects their ESM syntax.
import { join } from "node:path";
import { BOOTSTRAP_SEED, REPO_ROOT } from "./lib/repo";

const OUT = join(REPO_ROOT, ".cache", "codspeed");

const seedPathShim = `
import { join } from "node:path";
import * as moduleBundle from ${JSON.stringify(join(BOOTSTRAP_SEED, "module.bundle.cjs"))};
const SEED = ${JSON.stringify(BOOTSTRAP_SEED)};
const bundles = { "module.bundle.cjs": moduleBundle };
export const seedPath = (name) => join(SEED, name);
export const loadSeed = (name) => {
  const hit = bundles[name];
  if (hit === undefined) throw new Error("codspeed bundle: no static seed for " + name);
  return hit;
};
`;

const result = await Bun.build({
  entrypoints: [join(REPO_ROOT, "bench", "codspeed.ts")],
  outdir: OUT,
  naming: "bench.mjs",
  target: "node",
  format: "esm",
  // CodSpeed's plugin reads its native instrumentation hooks at run time.
  external: ["@codspeed/tinybench-plugin", "@codspeed/core", "tinybench"],
  plugins: [
    {
      name: "mochi-seed-for-node",
      setup(build) {
        build.onLoad({ filter: /bootstrap[\\/]seed-path\.ts$/ }, () => ({
          contents: seedPathShim,
          loader: "js",
        }));
        build.onLoad({ filter: /seed[\\/][^\\/]+\.bundle\.cjs$/ }, async (args) => ({
          contents: await Bun.file(args.path).text(),
          loader: "js",
        }));
      },
    },
  ],
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}
console.log(`built ${join(OUT, "bench.mjs")}`);
