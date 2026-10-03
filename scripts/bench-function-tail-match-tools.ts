// Compiler/formatter impact, with both seeds loaded in separate fresh Bun processes.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoPath } from "./lib/repo";

const baselineRevision = "fa4a89a841308442690fbaa271e23e5bac75ca05";
const out = repoPath(".cache/bench/function-tail-match-tools");
mkdirSync(out, { recursive: true });
for (const name of ["compile.bundle.cjs", "syntax.bundle.mjs"]) {
  const result = spawnSync("git", ["show", `${baselineRevision}:bootstrap/seed/${name}`], {
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(result.stderr);
  writeFileSync(join(out, `previous-${name}`), result.stdout);
}
const fixtures = [
  {
    name: "compile-tour",
    source: readFileSync(repoPath("examples/example.mochi"), "utf8"),
    bundle: "compile.bundle.cjs",
    run: "api.compileWith(source,{...api.defaultOpts,runtime:false})",
    verify:
      "if(value._tag!=='Ok'||typeof value.value!=='string'||value.value!==expected.value)throw new Error('compile failed or drifted');",
  },
  {
    name: "format-codegen",
    source: readFileSync(repoPath("packages/compiler/src/codegen/codegen.mochi"), "utf8"),
    bundle: "syntax.bundle.mjs",
    run: "api.formatProgram(api.parse(api.lex(source).value).value,source)",
    verify: "if(typeof value!=='string'||value!==expected)throw new Error('format drift');",
  },
];
const runs: unknown[] = [];
for (const round of [0, 1]) {
  for (const fixture of fixtures) {
    for (const variant of round === 0 ? ["previous", "current"] : ["current", "previous"]) {
      const module =
        variant === "previous"
          ? join(out, `previous-${fixture.bundle}`)
          : repoPath(`bootstrap/seed/${fixture.bundle}`);
      const file = join(out, `${fixture.name}-${variant}.mjs`);
      writeFileSync(
        file,
        `const api=await import(${JSON.stringify(module)});
const source=${JSON.stringify(fixture.source)};
const run=()=>${fixture.run};
const expected=run();
const verify=value=>{${fixture.verify}};
for(let i=0;i<20;i++)verify(run());
const samples=Array.from({length:20},()=>{const start=performance.now();const value=run();const elapsed=performance.now()-start;verify(value);return elapsed;});
console.log(JSON.stringify({version:Bun.version,outputHash:Bun.hash(typeof expected==='string'?expected:expected.value).toString(),median:samples.toSorted((a,b)=>a-b)[10],samples}));
`,
      );
      const result = spawnSync("bun", [file], { encoding: "utf8" });
      if (result.status !== 0) throw new Error(result.stderr);
      const run = { round, fixture: fixture.name, variant, ...JSON.parse(result.stdout) };
      runs.push(run);
      console.log(JSON.stringify(run));
    }
  }
}
writeFileSync(
  repoPath("docs/benchmarks/function-tail-match-tools.json"),
  `${JSON.stringify({ baselineRevision, warmupIterations: 20, samplesPerProcess: 20, fixtures, runs }, null, 2)}\n`,
);
