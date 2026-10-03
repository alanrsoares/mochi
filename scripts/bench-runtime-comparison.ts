// Compare actual Mochi output with equivalent handwritten JS, not historical output.
// bun scripts/bench-runtime-comparison.ts
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { arch, platform } from "node:os";
import { join } from "node:path";
import { compileJs } from "@mochi/test-support";
import { repoPath } from "./lib/repo";

type Fixture = {
  readonly name: string;
  readonly size: string;
  readonly source: string;
  readonly javascript: string;
  readonly input: string;
  readonly verify: string;
  readonly consume: string;
  readonly batch: number;
  readonly driver?: string;
  readonly guards?: string;
};
type Measurement = {
  readonly version: string;
  readonly median: number;
  readonly samples: readonly number[];
};
type Run = Measurement & {
  readonly round: number;
  readonly workload: string;
  readonly engine: string;
  readonly variant: string;
};

const dedupeJs = `const run = xs => {
  const seen = new Set();
  return xs.filter(row => {
    if (seen.has(row.id)) return false;
    seen.add(row.id); return true;
  });
};`;
const dedupeVerify = `const seen = new Set();
const expected = input.filter(row => { if (seen.has(row.id)) return false; seen.add(row.id); return true; });
const verify = value => {
  if (value.length !== expected.length || value.some((row, i) => row !== expected[i])) throw new Error('dedupe order/identity');
};`;
const fixtures: readonly Fixture[] = [
  ...[true, false].map(
    (unique): Fixture => ({
      name: unique ? "unique-ids" : "repeated-ids",
      size: unique ? "4,000 records / 4,000 IDs" : "4,000 records / 64 IDs",
      source: "let run = xs => Array.dedupeBy(row => row.id, xs)",
      javascript: dedupeJs,
      input: `Array.from({length:4000}, (_, i) => ({id:${unique ? "i" : "i % 64"}}))`,
      verify: dedupeVerify,
      consume: "value.length",
      batch: 32,
      guards: `const first = {id:1}, later = {id:1}, other = {id:2};
const result = run([first, later, other]);
if (run([]).length !== 0 || result.length !== 2 || result[0] !== first || result[1] !== other) throw new Error('representatives');`,
    }),
  ),
  {
    name: "tail-sum",
    size: "2 million iterations",
    source:
      "let run = n => loop (i = 0, acc = 0) { switch i >= n { | true => acc | false => recur(i + 1, acc + i) } }",
    javascript:
      "const run = n => { let acc = 0; for (let i = 0; i < n; i++) acc += i; return acc; };",
    input: "2000000",
    verify:
      "const verify = value => { if (value !== input * (input - 1) / 2) throw new Error('sum'); };",
    consume: "value",
    batch: 4,
    guards:
      "for (const n of [0, 1, 2, 3, 17]) if (run(n) !== n * (n - 1) / 2) throw new Error('small sums');",
  },
  {
    name: "optional-match",
    size: "1 million matches / 256 records",
    source: `type Row = { value?: number }
let read = (row: Row) => switch row.value { | Some(v) => v | None => 0 }`,
    javascript: "const read = row => { const v = row.value; return v != null ? v : 0; };",
    driver:
      "const run = rows => { let acc = 0; for (let i = 0; i < 1000000; i++) acc += read(rows[i % 256]); return acc; };",
    input: "Array.from({length:256}, (_, i) => i % 2 ? {} : {value:i})",
    verify:
      "const verify = value => { if (value !== 63496928) throw new Error('optional checksum'); };",
    consume: "value",
    batch: 4,
    guards: `let reads = 0; const probe = {get value() { reads++; return 7; }};
if (read(probe) !== 7 || reads !== 1) throw new Error('single getter evaluation');
for (const value of [undefined, null, 0, -7]) if (read({value}) !== (value ?? 0)) throw new Error('nullish/falsy payload');`,
  },
  {
    name: "record-pipeline",
    size: "20,000 records / 5,000 IDs",
    source: `type Row = { id: number, active: bool, amount?: number }
let run = (rows: Array<Row>) => rows
  |> Array.filter((row: Row) => row.active)
  |> Array.dedupeBy((row: Row) => row.id)
  |> Array.map((row: Row) => switch row.amount { | Some(v) => v | None => 0 })
  |> Array.reduce((acc, amount) => acc + amount, 0)`,
    javascript: `const run = rows => {
  const seen = new Set();
  return rows.filter(row => row.active)
    .filter(row => { if (seen.has(row.id)) return false; seen.add(row.id); return true; })
    .map(row => { const v = row.amount; return v != null ? v : 0; })
    .reduce((acc, amount) => acc + amount, 0);
};`,
    input:
      "Array.from({length:20000}, (_, i) => ({id:i % 5000, active:i % 3 !== 0, ...(i % 4 ? {amount:i % 100} : {})}))",
    verify: `const retained = new Set(); let expected = 0;
for (const row of input) { if (!row.active || retained.has(row.id)) continue; retained.add(row.id); expected += row.amount ?? 0; }
const verify = value => { if (value !== expected) throw new Error('pipeline checksum'); };`,
    consume: "value",
    batch: 16,
    guards: `if (run([]) !== 0 || run([
  {id:1,active:false,amount:99}, {id:1,active:true,amount:0},
  {id:1,active:true,amount:99}, {id:2,active:true}, {id:3,active:true,amount:-7}
]) !== -7) throw new Error('filter order/first match/optional amount');`,
  },
];

const out = repoPath(".cache", "bench", "runtime-comparison");
mkdirSync(out, { recursive: true });
const compiled = fixtures.map((fixture) => ({
  ...fixture,
  emitted: compileJs(fixture.source, { runtime: true, open: false, stripImports: true }),
}));
const runs: Run[] = [];
for (const round of [0, 1, 2, 3]) {
  for (const fixture of compiled) {
    const variants = [
      { name: "mochi", code: fixture.emitted },
      { name: "javascript", code: fixture.javascript },
    ];
    for (const variant of round % 2 ? variants.toReversed() : variants) {
      const file = join(out, `${fixture.name}-${variant.name}.mjs`);
      writeFileSync(
        file,
        `${variant.code}
${fixture.driver ?? ""}
const input = ${fixture.input};
${fixture.verify}
${fixture.guards ?? ""}
for (let i = 0; i < 20; i++) for (let j = 0; j < ${fixture.batch}; j++) verify(run(input));
let sink = 0;
const samples = Array.from({length:9}, () => {
  let value;
  const start = performance.now();
  for (let i = 0; i < ${fixture.batch}; i++) { value = run(input); sink += ${fixture.consume}; }
  const elapsed = (performance.now() - start) / ${fixture.batch};
  verify(value); return elapsed;
});
if (!Number.isFinite(sink)) throw new Error('unconsumed results');
console.log(JSON.stringify({version:typeof Bun === 'undefined' ? process.version : Bun.version, median:samples.toSorted((a,b)=>a-b)[4],samples}));
`,
      );
      for (const engine of round % 2 ? ["node", "bun"] : ["bun", "node"]) {
        const result = spawnSync(engine, [file], { encoding: "utf8" });
        if (result.status !== 0) throw new Error(result.stderr || "benchmark failed");
        const measurement: Measurement = JSON.parse(result.stdout);
        const run = {
          round,
          workload: fixture.name,
          engine,
          variant: variant.name,
          ...measurement,
        };
        runs.push(run);
        console.log(JSON.stringify(run));
      }
    }
  }
}
writeFileSync(
  join(out, "results.json"),
  `${JSON.stringify(
    {
      measured: new Date().toISOString(),
      compilerRevision: spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim(),
      environment: `${platform()} ${arch()}`,
      workloads: compiled.map(({ name, size, source, javascript, batch, emitted, driver }) => ({
        name,
        size,
        source,
        javascript,
        batch,
        emitted,
        driver,
      })),
      runs,
    },
    null,
    2,
  )}\n`,
);
