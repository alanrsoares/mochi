// Isolated record/variant sorting; run before QA, never concurrently with it.
// bun scripts/bench-structural-compare.ts
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { preludeJsDefs } from "@mochi/compiler/prelude";
import { repoPath } from "./lib/repo";

type Fixture = {
  readonly name: string;
  readonly input: string;
  readonly model: string;
};

const fixtures: readonly Fixture[] = [
  {
    name: "records",
    input: 'ids.map(id => Object.freeze({id, note: "x".repeat(64)}))',
    model: "(a,b)=>a.id-b.id",
  },
  {
    name: "nested-records",
    input: 'ids.map(id => Object.freeze({child: Object.freeze({id}), note: "x".repeat(64)}))',
    model: "(a,b)=>a.child.id-b.child.id",
  },
  {
    name: "wide-records",
    input:
      'ids.map(id => Object.freeze({a:id, ...Object.fromEntries(Array.from({length:12},(_,i)=>["field"+i,"x".repeat(32)]))}))',
    model: "(a,b)=>a.a-b.a",
  },
  {
    name: "variants",
    input: 'ids.map(id => Object.freeze({_tag:id%2?"B":"A", _0:id, note:"x".repeat(64)}))',
    model: "(a,b)=>a._tag<b._tag?-1:a._tag>b._tag?1:a._0-b._0",
  },
  {
    name: "wide-records-late",
    input:
      'ids.map(id => Object.freeze({...Object.fromEntries(Array.from({length:12},(_,i)=>["field"+i,"x".repeat(32)])), z:id}))',
    model: "(a,b)=>a.z-b.z",
  },
  {
    name: "wide-records-equal",
    input:
      'ids.map(() => Object.freeze({a:0, ...Object.fromEntries(Array.from({length:12},(_,i)=>["field"+i,"x".repeat(32)]))}))',
    model: "()=>0",
  },
];
const baseline = readFileSync(repoPath("docs/benchmarks/structural-compare-baseline.mjs"), "utf8");
const emitted = [
  preludeJsDefs._curry,
  preludeJsDefs._compareFieldNames,
  preludeJsDefs._compareSortedKeys,
  preludeJsDefs._compareFirstKey,
  preludeJsDefs._compareRecords,
  preludeJsDefs._compare,
  preludeJsDefs.compare,
].join("\n");
const variants = [
  { name: "previous", code: baseline },
  { name: "emitted", code: emitted },
];
const out = repoPath(".cache", "bench", "structural-compare");
mkdirSync(out, { recursive: true });

type Measurement = {
  readonly version: string;
  readonly median: number;
  readonly samples: readonly number[];
};
type Run = Measurement & {
  readonly round: number;
  readonly fixture: string;
  readonly variant: string;
  readonly engine: string;
};
const runs: Run[] = [];
for (const round of [0, 1]) {
  for (const fixture of fixtures) {
    for (const variant of round === 0 ? variants : variants.toReversed()) {
      const file = join(out, `${fixture.name}-${variant.name}.mjs`);
      // Previous ordering is intentionally different: validate each result
      // against its own independent ordering model, including representatives.
      const model =
        variant.name === "previous"
          ? "(a,b)=>{const x=JSON.stringify(a),y=JSON.stringify(b);return x<y?-1:x>y?1:0;}"
          : fixture.model;
      writeFileSync(
        file,
        `${variant.code}
const ids=Array.from({length:1500},(_,i)=>(i*7919)%1500);
const input=Object.freeze(${fixture.input});
const expected=input.slice().sort(${model});
const run=()=>input.slice().sort(compare);
const verify=value=>{if(value.length!==expected.length||!value.every((x,i)=>x===expected[i]))throw new Error('sort output or representative');};
for(let i=0;i<10;i++)verify(run());
const samples=Array.from({length:12},()=>{const start=performance.now();let value;for(let i=0;i<10;i++)value=run();const time=(performance.now()-start)/10;verify(value);return time;});
console.log(JSON.stringify({version:typeof Bun==='undefined'?process.version:Bun.version,median:samples.toSorted((a,b)=>a-b)[6],samples}));
`,
      );
      for (const engine of round === 0 ? ["bun", "node"] : ["node", "bun"]) {
        const result = spawnSync(engine, [file], { encoding: "utf8" });
        if (result.status !== 0) throw new Error(result.stderr || "benchmark failed");
        const measurement: Measurement = JSON.parse(result.stdout);
        const run: Run = {
          round,
          fixture: fixture.name,
          variant: variant.name,
          engine,
          ...measurement,
        };
        runs.push(run);
        console.log(JSON.stringify(run));
      }
    }
  }
}
const revision = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
if (revision.status !== 0) throw new Error(revision.stderr);
writeFileSync(
  repoPath("docs/benchmarks/structural-compare.json"),
  `${JSON.stringify(
    {
      baseRevision: revision.stdout.trim(),
      candidate: "working tree: ADR 0145 structural comparison",
      size: 1500,
      warmupSorts: 10,
      sampleSorts: 10,
      fixtures,
      baseline,
      emitted,
      runs,
    },
    null,
    2,
  )}\n`,
);
