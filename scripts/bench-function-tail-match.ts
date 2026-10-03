// Actual function-tail match sites, captures and independently checked effects.
// Run separately from QA: bun scripts/bench-function-tail-match.ts
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compile } from "@mochi/compiler";
import { unwrapOk } from "@onrails/result";
import { matchFixtures } from "./bench-builtin-match";
import { repoPath } from "./lib/repo";

export const tailMatchFixtures = [
  ...matchFixtures,
  ...[false, true].map((effect) => ({
    name: effect ? "shape-effects" : "shape-captured",
    family: "Shape",
    negativeEvery: 8,
    effect,
    expensive: false,
    source: `type Shape = Dot | Box(value: number) | Pair(number, number)
type Settings = { bias: number, visit: number -> unit }
let make = (settings: Settings) => let bias = settings.bias in let visit = settings.visit in (value: Shape) => switch value {
  | Dot => ${effect ? "let used = visit(0) in " : ""}bias
  | Box(n) => ${effect ? "let used = visit(n) in " : ""}n + bias
  | Pair(a, b) => ${effect ? "let used = visit(a) in " : ""}a + b
}`,
  })),
];

if (import.meta.main) {
  const baseline: Readonly<Record<string, string>> = JSON.parse(
    readFileSync(repoPath("docs/benchmarks/function-tail-match-baseline.json"), "utf8"),
  );
  const out = repoPath(".cache/bench/function-tail-match");
  mkdirSync(out, { recursive: true });
  const runs: unknown[] = [];
  const emitted: Readonly<Record<string, string>> = Object.fromEntries(
    tailMatchFixtures.map((fixture) => [fixture.name, unwrapOk(compile(fixture.source))]),
  );
  for (const fixture of tailMatchFixtures) {
    const expected =
      fixture.family === "Shape" ? "switch ($match._tag)" : `_${fixture.family}_match(`;
    if (!emitted[fixture.name]?.includes(expected)) throw new Error("missing selected lowering");
    if (fixture.family !== "Shape" && emitted[fixture.name] !== baseline[fixture.name])
      throw new Error("builtin control output changed");
  }
  for (const round of [0, 1, 2, 3]) {
    for (const fixture of tailMatchFixtures.filter((fixture) => fixture.family === "Shape")) {
      const variants = [
        { name: "previous", code: baseline[fixture.name] },
        { name: "current", code: emitted[fixture.name] },
      ];
      for (const variant of round % 2 === 0 ? variants : variants.toReversed()) {
        const file = join(out, `${fixture.name}-${variant.name}.mjs`);
        writeFileSync(
          file,
          `${variant.code}
const fixture=${JSON.stringify(fixture)};
let effects=0;
const runValue=make({bias:7,visit:n=>{effects+=n;}});
const input=Object.freeze(Array.from({length:1024},(_,i)=>Object.freeze(fixture.family==='Result'?(i%fixture.negativeEvery===0?{_tag:'Err',error:i}:{_tag:'Ok',value:i}):fixture.family==='Option'?(i%fixture.negativeEvery===0?{_tag:'None'}:{_tag:'Some',value:i}):(i%fixture.negativeEvery===0?{_tag:'Dot'}:i%3===0?{_tag:'Pair',_0:i,_1:7}:{_tag:'Box',value:i}))));
let expected=0,expectedEffects=0;
for(let i=0;i<1024;i++){const negative=i%fixture.negativeEvery===0;let value=fixture.family==='Result'?(negative?i-7:i+7):(negative?7:i+7);if(fixture.expensive)for(let k=0;k<20;k++)value=((value*17+23)%65536+65536)%65536;expected+=value;if(fixture.effect)expectedEffects+=fixture.family!=='Result'&&negative?0:i;}
const run=()=>{let sum=0;for(let k=0;k<64;k++)for(let i=0;i<input.length;i++)sum+=runValue(input[i]);return sum;};
const check=sum=>{if(sum!==expected*64||effects!==expectedEffects*64)throw new Error('value or branch effects');};
for(let i=0;i<20;i++){effects=0;check(run());}
const samples=Array.from({length:20},()=>{effects=0;const start=performance.now();const sum=run();const elapsed=performance.now()-start;check(sum);return elapsed;});
console.log(JSON.stringify({version:typeof Bun==='undefined'?process.version:Bun.version,median:samples.toSorted((a,b)=>a-b)[10],samples}));
`,
        );
        for (const engine of round % 2 === 0 ? ["bun", "node"] : ["node", "bun"]) {
          const result = spawnSync(engine, [file], { encoding: "utf8" });
          if (result.status !== 0) throw new Error(result.stderr || "benchmark failed");
          const run = {
            round,
            fixture: fixture.name,
            variant: variant.name,
            engine,
            ...JSON.parse(result.stdout),
          };
          runs.push(run);
          console.log(JSON.stringify(run));
        }
      }
    }
  }
  writeFileSync(
    repoPath("docs/benchmarks/function-tail-match.json"),
    `${JSON.stringify({ baselineRevision: "fa4a89a841308442690fbaa271e23e5bac75ca05", warmupIterations: 20, samplesPerProcess: 20, callsPerSample: 65536, fixtures: tailMatchFixtures, baseline, emitted, runs }, null, 2)}\n`,
  );
}
