// Compile once under Bun; time standalone JS in fresh Bun and Node processes.
// bun scripts/bench-optional-read.ts
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compileJs } from "@mochi/test-support";
import { repoPath } from "./lib/repo";

type Fixture = {
  readonly name: string;
  readonly source: string;
  readonly candidate: string;
  readonly escaping: boolean;
};

const wrapper = '((v) => v != null ? { _tag: "Some", value: v } : { _tag: "None" })(row.value)';
// Frozen pre-fusion output for this exact fixture; runtime:false omits helpers.
const previousMatch = `const read = (row) => ((_v) => _v._tag === "Some"
    ? (({ value: v }) => (v))(_v)
    : _v._tag === "None"
    ? (0)
    : (() => { throw new Error("non-exhaustive match"); })())(${wrapper});`;
const fixtures: readonly Fixture[] = [
  {
    name: "read-consumed",
    source: "let read = (row: Row) => row.value",
    candidate: "helper",
    escaping: false,
  },
  {
    name: "read-escaping",
    source: "let read = (row: Row) => row.value",
    candidate: "helper",
    escaping: true,
  },
  {
    name: "match-consumed",
    source: "let read = (row: Row) => switch row.value { | Some(v) => v | None => 0 }",
    candidate: "const read = (row) => { const v = row.value; return v != null ? v : 0; };",
    escaping: false,
  },
];

const out = repoPath(".cache", "bench", "optional-read");
mkdirSync(out, { recursive: true });

for (const fixture of fixtures) {
  const emitted = compileJs(`type Row = { value?: number }\n${fixture.source}`, {
    runtime: false,
    open: false,
  });
  const numeric = fixture.name === "match-consumed";
  if (!numeric && emitted.split(wrapper).length !== 2) throw new Error("optional wrapper changed");
  if (numeric && emitted.includes('_tag: "Some"')) throw new Error("match fusion missing");
  const candidate =
    fixture.candidate === "helper"
      ? `const wrap = (v) => v != null ? { _tag: "Some", value: v } : { _tag: "None" };\n${emitted.replace(wrapper, "wrap(row.value)")}`
      : fixture.candidate;
  const variants = numeric
    ? [
        { name: "previous", code: previousMatch },
        { name: "emitted", code: emitted },
        { name: "candidate", code: candidate },
      ]
    : [
        { name: "emitted", code: emitted },
        { name: "candidate", code: candidate },
      ];
  for (const { name: variant, code } of variants) {
    const file = join(out, `${fixture.name}-${variant}.mjs`);
    writeFileSync(
      file,
      `${code}
const rows = Array.from({length: 256}, (_, i) => i % 2 ? {} : {value: i});
let reads = 0;
const probe = {get value() { reads++; return 7; }};
const probed = read(probe);
if (reads !== 1 || ${numeric ? "probed" : "probed.value"} !== 7) throw new Error("single evaluation violated");
for (const value of [undefined, null, 0, 7]) {
  const result = read({value});
  if (${numeric ? "result !== (value ?? 0)" : 'result._tag !== (value == null ? "None" : "Some") || (value != null && result.value !== value)'}) throw new Error("wrong optional result");
}
const saved = new Array(1000000);
function run() {
  let total = 0;
  for (let i = 0; i < 1000000; i++) {
    const result = read(rows[i & 255]);
    ${fixture.escaping ? "saved[i] = result;" : `total += ${numeric ? "result" : 'result._tag === "Some" ? result.value : 0'};`}
  }
  ${fixture.escaping ? 'for (const result of saved) total += result._tag === "Some" ? result.value : 0;' : ""}
  if (total !== 63496928) throw new Error("wrong checksum: " + total);
  return total;
}
for (let i = 0; i < 20; i++) run();
const samples = Array.from({length: 12}, () => { const start = performance.now(); run(); return performance.now() - start; });
console.log(JSON.stringify({engine: typeof Bun === "undefined" ? process.version : Bun.version, samples, best: Math.min(...samples), median: samples.toSorted((a,b) => a-b)[6]}));
`,
    );
    for (const engine of ["bun", "node"] as const) {
      const result = spawnSync(engine, [file], { encoding: "utf8" });
      if (result.status !== 0) throw new Error(result.stderr || `${engine}: failed`);
      writeFileSync(join(out, `${fixture.name}-${variant}-${engine}.json`), result.stdout);
      console.log(`${engine}/${fixture.name}/${variant}: ${result.stdout.trim()}`);
    }
  }
}
console.log(`Standalone fixtures and timing logs: ${out}`);
