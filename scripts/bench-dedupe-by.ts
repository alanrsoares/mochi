// Freeze the emitted runtime and time it in isolated Bun/Node processes.
// bun scripts/bench-dedupe-by.ts
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { preludeJsDefs } from "@mochi/compiler/prelude";
import { repoPath } from "./lib/repo";

type Fixture = {
  readonly name: string;
  readonly input: string;
  readonly projection: string;
  readonly expected: number;
};

const fixtures: readonly Fixture[] = [
  {
    name: "numbers-1000",
    input: "Array.from({length:1000},(_,i)=>i)",
    projection: "x=>x",
    expected: 1000,
  },
  {
    name: "numbers-4000",
    input: "Array.from({length:4000},(_,i)=>i)",
    projection: "x=>x",
    expected: 4000,
  },
  {
    name: "strings",
    input: "Array.from({length:4000},(_,i)=>'key'+i)",
    projection: "x=>x",
    expected: 4000,
  },
  {
    name: "repeated-64",
    input: "Array.from({length:4000},(_,i)=>i%64)",
    projection: "x=>x",
    expected: 64,
  },
  { name: "all-equal", input: "Array.from({length:4000},()=>1)", projection: "x=>x", expected: 1 },
  {
    name: "records-projected",
    input: "Array.from({length:4000},(_,i)=>({id:i}))",
    projection: "x=>x.id",
    expected: 4000,
  },
  {
    name: "records-structural",
    input: "Array.from({length:400},(_,i)=>({id:i}))",
    projection: "x=>x",
    expected: 400,
  },
  {
    name: "records-nested-4000",
    input: "Array.from({length:4000},(_,i)=>({id:i,name:'n'+(i%50),pos:{x:i,y:1}}))",
    projection: "x=>x",
    expected: 4000,
  },
  {
    name: "records-repeated-4000",
    input: "Array.from({length:4000},(_,i)=>({id:i%100,pos:[i%100,1]}))",
    projection: "x=>x",
    expected: 100,
  },
  {
    name: "mixed",
    input: "Array.from({length:4000},(_,i)=>i%2?'key'+i:i)",
    projection: "x=>x",
    expected: 4000,
  },
];

const previous = `const _Array_dedupeBy = _curry(2, (f, xs) => {
  const seen = [];
  return xs.filter(x => {
    const k = f(x);
    if (seen.some(s => eq(s, k))) return false;
    seen.push(k); return true;
  });
});`;
const guards = `
const same = (a,b) => a.length===b.length && a.every((x,i)=>Object.is(x,b[i]));
const check = (xs, expected) => { if(!same(_Array_dedupeBy(x=>x,xs),expected)) throw new Error('edge guard'); };
check([NaN,NaN],[NaN,NaN]); check([-0,0,-0],[-0]);
check([null,undefined,null,undefined],[null,undefined]); check([,undefined],[undefined]);
const a={id:1},b={id:1}; check([a,b,a],[a]);
const f=()=>1,g=()=>1;check([f,f,g],[f,g]);
const s=Symbol('x'),t=Symbol('x');check([s,s,t],[s,t]);check([1n,1n,2n],[1n,2n]);
check([1,'1',1,'1'],[1,'1']);
const visited=[],values=[1,2,1,3];
if(!same(_Array_dedupeBy(x=>{visited.push(x);return x;},values),[1,2,3]) || !same(visited,values)) throw new Error('projection guard');
`;

const out = repoPath(".cache", "bench", "dedupe-by");
mkdirSync(out, { recursive: true });
for (const round of [0, 1]) {
  for (const fixture of fixtures) {
    const variants = [
      { name: "previous", code: previous },
      { name: "emitted", code: preludeJsDefs._Array_dedupeBy },
    ];
    const ordered = round === 0 ? variants : variants.toReversed();
    for (const variant of ordered) {
      const file = join(out, `${fixture.name}-${variant.name}.mjs`);
      writeFileSync(
        file,
        `${preludeJsDefs._curry}\n${preludeJsDefs.eq}\n${preludeJsDefs._hashStr}\n${preludeJsDefs._eqHash}\n${variant.code}\n${guards}
const input=${fixture.input},project=${fixture.projection};
const run=()=>_Array_dedupeBy(project,input);
const verify=value=>{if(value.length!==${fixture.expected})throw new Error('length');for(let i=0;i<value.length;i++)if(value[i]!==input[i])throw new Error('order or representative');};
for(let i=0;i<8;i++)verify(run());
const samples=Array.from({length:12},()=>{const start=performance.now();const value=run();const time=performance.now()-start;verify(value);return time;});
console.log(JSON.stringify({version:typeof Bun==='undefined'?process.version:Bun.version,median:samples.toSorted((a,b)=>a-b)[6],samples}));`,
      );
      for (const engine of ["bun", "node"]) {
        const result = spawnSync(engine, [file], { encoding: "utf8" });
        if (result.status !== 0) throw new Error(result.stderr || "benchmark failed");
        writeFileSync(
          join(out, `${fixture.name}-${variant.name}-${engine}-${round}.json`),
          result.stdout,
        );
        console.log(
          JSON.stringify({
            round,
            fixture: fixture.name,
            variant: variant.name,
            engine,
            ...JSON.parse(result.stdout),
          }),
        );
      }
    }
  }
}
