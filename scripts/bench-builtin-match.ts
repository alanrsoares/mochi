// Actual emitted match sites, captured callbacks and independently checked effects.
// Run separately from QA: bun scripts/bench-builtin-match.ts
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compile } from "@mochi/compiler";
import { unwrapOk } from "@onrails/result";
import { repoPath } from "./lib/repo";

type Fixture = {
  readonly name: string;
  readonly family: "Result" | "Option";
  readonly negativeEvery: number;
  readonly effect: boolean;
  readonly expensive: boolean;
  readonly source: string;
};
const settings = "type Settings = { bias: number, visit: number -> unit }\n";
const source = (family: "Result" | "Option", effect: boolean, expensive: boolean): string => {
  const finish = (n: string): string =>
    expensive
      ? `loop (i = 0, acc = ${n}) { i >= 20 ? acc : recur(i + 1, (acc * 17 + 23) % 65536) }`
      : n;
  const body = (n: string, result: string): string =>
    effect ? `let used = visit(${n}) in ${finish(result)}` : finish(result);
  return `${settings}let make = (settings: Settings) => let bias = settings.bias in let visit = settings.visit in value => switch value {
${family === "Result" ? `| Err(e) => ${body("e", "e - bias")}\n| Ok(n) => ${body("n", "n + bias")}` : `| None => ${body("0", "bias")}\n| Some(n) => ${body("n", "n + bias")}`}
}`;
};
export const matchFixtures: readonly Fixture[] = [
  {
    name: "result-captured",
    family: "Result",
    negativeEvery: 2,
    effect: false,
    expensive: false,
    source: source("Result", false, false),
  },
  {
    name: "result-skewed",
    family: "Result",
    negativeEvery: 8,
    effect: false,
    expensive: false,
    source: source("Result", false, false),
  },
  {
    name: "option-captured",
    family: "Option",
    negativeEvery: 2,
    effect: false,
    expensive: false,
    source: source("Option", false, false),
  },
  {
    name: "option-skewed",
    family: "Option",
    negativeEvery: 8,
    effect: false,
    expensive: false,
    source: source("Option", false, false),
  },
  {
    name: "result-effects",
    family: "Result",
    negativeEvery: 2,
    effect: true,
    expensive: true,
    source: source("Result", true, true),
  },
  {
    name: "option-effects",
    family: "Option",
    negativeEvery: 2,
    effect: true,
    expensive: true,
    source: source("Option", true, true),
  },
];

if (import.meta.main) {
  const baseline: Readonly<Record<string, string>> = JSON.parse(
    readFileSync(repoPath("docs/benchmarks/builtin-match-baseline.json"), "utf8"),
  );
  const out = repoPath(".cache/bench/builtin-match");
  mkdirSync(out, { recursive: true });
  const runs: unknown[] = [];
  const emitted: Readonly<Record<string, string>> = Object.fromEntries(
    matchFixtures.map((fixture) => [fixture.name, unwrapOk(compile(fixture.source))]),
  );
  for (const fixture of matchFixtures) {
    if (!emitted[fixture.name]?.includes(`_${fixture.family}_match(`))
      throw new Error("missing dispatch");
  }
  for (const round of [0, 1]) {
    for (const fixture of matchFixtures) {
      const variants = [
        { name: "ternary", code: baseline[fixture.name] },
        { name: "dispatch", code: emitted[fixture.name] },
      ];
      for (const variant of round === 0 ? variants : variants.toReversed()) {
        const file = join(out, `${fixture.name}-${variant.name}.mjs`);
        writeFileSync(
          file,
          `${variant.code}
const fixture=${JSON.stringify(fixture)};
let effects=0;
const runValue=make({bias:7,visit:n=>{effects+=n;}});
const input=Object.freeze(Array.from({length:1024},(_,i)=>Object.freeze(fixture.family==='Result'?(i%fixture.negativeEvery===0?{_tag:'Err',error:i}:{_tag:'Ok',value:i}):(i%fixture.negativeEvery===0?{_tag:'None'}:{_tag:'Some',value:i}))));
let expected=0,expectedEffects=0;
for(let i=0;i<1024;i++){const negative=i%fixture.negativeEvery===0;let value=fixture.family==='Result'?(negative?i-7:i+7):(negative?7:i+7);if(fixture.expensive)for(let k=0;k<20;k++)value=((value*17+23)%65536+65536)%65536;expected+=value;if(fixture.effect)expectedEffects+=fixture.family==='Option'&&negative?0:i;}
const run=()=>{let sum=0;for(let k=0;k<64;k++)for(let i=0;i<input.length;i++)sum+=runValue(input[i]);return sum;};
const check=sum=>{if(sum!==expected*64||effects!==expectedEffects*64)throw new Error('value or branch effects');};
for(let i=0;i<5;i++){effects=0;check(run());}
const samples=Array.from({length:12},()=>{effects=0;const start=performance.now();const sum=run();const elapsed=performance.now()-start;check(sum);return elapsed;});
console.log(JSON.stringify({version:typeof Bun==='undefined'?process.version:Bun.version,median:samples.toSorted((a,b)=>a-b)[6],samples}));
`,
        );
        for (const engine of round === 0 ? ["bun", "node"] : ["node", "bun"]) {
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
    repoPath("docs/benchmarks/builtin-match.json"),
    `${JSON.stringify({ baselineRevision: "dab9de68757225a5402bcde8aa51a5f014df632e", callsPerSample: 65536, fixtures: matchFixtures, baseline, emitted, runs }, null, 2)}\n`,
  );
}
