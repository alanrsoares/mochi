// Compile once; time frozen JS in separate Bun/Node processes.
// bun scripts/bench-tail-switch.ts
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compileJs } from "@mochi/test-support";
import { repoPath } from "./lib/repo";

type Fixture = {
  readonly name: string;
  readonly source: string;
  readonly candidate: string;
  readonly previous: string;
  readonly input: string;
  readonly expected: string;
};

const fixtures: readonly Fixture[] = [
  {
    name: "count",
    source:
      "let run = n => loop (i = 0, acc = 0) { switch i >= n { | true => acc | false => recur(i + 1, acc + 1) } }",
    candidate:
      "const run = n => { let i = 0, acc = 0; while (true) { const v = gte(i, n); if (v === true) return acc; if (v === false) { const a = add(i, 1), b = add(acc, 1); i = a; acc = b; continue; } throw new Error('non-exhaustive match'); } };",
    previous:
      'const run = n => { let i = 0; let acc = 0; while (true) { const _step = ((_v) => _v === true ? (_done(acc)) : _v === false ? (_recur(add(i, 1), add(acc, 1))) : (() => { throw new Error("non-exhaustive match"); })())(gte(i, n)); if (_step._tag === "recur") { [i, acc] = _step.args; continue; } return _step.value; } };',
    input: "n",
    expected: "n",
  },
  {
    name: "sum",
    source:
      "let run = n => loop (i = 0, acc = 0) { switch i >= n { | true => acc | false => recur(i + 1, acc + i) } }",
    candidate:
      "const run = n => { let i = 0, acc = 0; while (true) { const v = gte(i, n); if (v === true) return acc; if (v === false) { const a = add(i, 1), b = add(acc, i); i = a; acc = b; continue; } throw new Error('non-exhaustive match'); } };",
    previous:
      'const run = n => { let i = 0; let acc = 0; while (true) { const _step = ((_v) => _v === true ? (_done(acc)) : _v === false ? (_recur(add(i, 1), add(acc, i))) : (() => { throw new Error("non-exhaustive match"); })())(gte(i, n)); if (_step._tag === "recur") { [i, acc] = _step.args; continue; } return _step.value; } };',
    input: "n",
    expected: "n * (n - 1) / 2",
  },
  {
    name: "option-scan",
    source:
      "let run = xs => loop (i = 0, acc = 0) { switch Array.get(i, xs) { | None => acc | Some(x) => recur(i + 1, acc + x) } }",
    candidate:
      "const run = xs => { let i = 0, acc = 0; while (true) { const v = _Array_get(i, xs); if (v._tag === 'None') return acc; if (v._tag === 'Some') { const {value: x} = v; const a = add(i, 1), b = add(acc, x); i = a; acc = b; continue; } throw new Error('non-exhaustive match'); } };",
    previous:
      'const run = xs => { let i = 0; let acc = 0; while (true) { const _step = ((_v) => _v._tag === "None" ? (_done(acc)) : _v._tag === "Some" ? (({ value: x }) => (_recur(add(i, 1), add(acc, x))))(_v) : (() => { throw new Error("non-exhaustive match"); })())(_Array_get(i, xs)); if (_step._tag === "recur") { [i, acc] = _step.args; continue; } return _step.value; } };',
    input: "Array.from({length:n}, (_, i) => i & 255)",
    expected: "Math.floor(n / 256) * 32640 + (n % 256) * ((n % 256) - 1) / 2",
  },
];

const out = repoPath(".cache", "bench", "tail-switch");
mkdirSync(out, { recursive: true });
for (const fixture of fixtures) {
  const emitted = compileJs(fixture.source, { runtime: true, open: false, stripImports: true });
  const start = emitted.indexOf("const run = ");
  if (start < 0) throw new Error("run binding missing");
  const candidate = emitted.slice(0, start) + fixture.candidate;
  const previous =
    emitted.slice(0, start) +
    '\nconst _recur = (...args) => ({ _tag: "recur", args }); const _done = value => ({ _tag: "done", value });\n' +
    fixture.previous;
  if (emitted.includes("const _step")) throw new Error("production statement lowering missing");
  for (const variant of [
    { name: "previous", code: previous },
    { name: "emitted", code: emitted },
    { name: "candidate", code: candidate },
  ]) {
    const file = join(out, `${fixture.name}-${variant.name}.mjs`);
    writeFileSync(
      file,
      `${variant.code}
const input = n => ${fixture.input};
const expected = n => ${fixture.expected};
for (const n of [0, 1, 2, 3, 17, 10001]) {
  if (run(input(n)) !== expected(n)) throw new Error('wrong result');
}
const n = 2000000, value = input(n);
for (let i = 0; i < 30; i++) if (run(value) !== expected(n)) throw new Error('warmup result');
const samples = Array.from({length:12}, () => {
  const start = performance.now(); const result = run(value); const time = performance.now() - start;
  if (result !== expected(n)) throw new Error('wrong checksum'); return time;
});
console.log(JSON.stringify({engine: typeof Bun === 'undefined' ? process.version : Bun.version, best: Math.min(...samples), median: samples.toSorted((a,b) => a-b)[6], samples}));
`,
    );
    for (const engine of ["bun", "node"]) {
      const result = spawnSync(engine, [file], { encoding: "utf8" });
      if (result.status !== 0) throw new Error(result.stderr || "benchmark failed");
      writeFileSync(join(out, `${fixture.name}-${variant.name}-${engine}.json`), result.stdout);
      console.log(`${engine}/${fixture.name}/${variant.name}: ${result.stdout.trim()}`);
    }
  }
}
