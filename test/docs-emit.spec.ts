import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler";
import { _curry, add, gt, mul, pi, square } from "@mochi/compiler/runtime";
import { readRepo, repoPath } from "@mochi/test-support";
import { isErr } from "@onrails/result";
import comparison from "../docs/benchmarks/runtime-comparison.json";
import snapshots from "../docs/benchmarks/runtime-snapshots.json";

const read = (path: string): string => readRepo(import.meta.url, path);

test("published JS comparison medians and ranges match all recorded process runs", () => {
  const report = read("docs/runtime-comparison-benchmark.md");
  const readme = read("README.md");
  expect(comparison.runs).toHaveLength(80);
  for (const workload of comparison.workloads) {
    const medians: string[] = [];
    const ranges: string[] = [];
    for (const engine of ["bun", "node"]) {
      for (const variant of ["mochi", "javascript"]) {
        const runs = comparison.runs.filter(
          (run) =>
            run.workload === workload.name && run.engine === engine && run.variant === variant,
        );
        expect(runs.map((run) => run.round).toSorted()).toEqual([0, 1, 2, 3]);
        for (const run of runs) {
          expect(run.samples).toHaveLength(9);
          expect(run.samples.every((sample) => Number.isFinite(sample) && sample > 0)).toBe(true);
          expect(run.median).toBe(run.samples.toSorted((a, b) => a - b)[4]!);
        }
        const sorted = runs.map((run) => run.median).toSorted((a, b) => a - b);
        medians.push(((sorted[1]! + sorted[2]!) / 2).toFixed(3));
        ranges.push(`${sorted[0]!.toFixed(3)}–${sorted[3]!.toFixed(3)}`);
      }
    }
    const cells = `| ${medians.join(" | ")} |`;
    expect(report).toContain(cells);
    expect(readme).toContain(cells);
    expect(report).toContain(`| ${ranges.join(" | ")} |`);
  }
});

test("frozen Mochi and JS benchmark fixtures preserve representative workload behavior", () => {
  for (const fixture of comparison.workloads) {
    for (const code of [fixture.emitted, fixture.javascript]) {
      const run = new Function(
        `${code}\nreturn ${fixture.name === "optional-match" ? "read" : "run"};`,
      )();
      switch (fixture.name) {
        case "unique-ids":
        case "repeated-ids": {
          const first = { id: 1 },
            later = { id: 1 },
            other = { id: 2 };
          expect(run([])).toEqual([]);
          const result = run([first, later, other]);
          expect(result).toHaveLength(2);
          expect(result[0]).toBe(first);
          expect(result[1]).toBe(other);
          break;
        }
        case "tail-sum":
          for (const n of [0, 1, 2, 17]) expect(run(n)).toBe(n === 0 ? 0 : (n * (n - 1)) / 2);
          break;
        case "optional-match": {
          let reads = 0;
          expect(
            run({
              get value() {
                reads++;
                return -7;
              },
            }),
          ).toBe(-7);
          expect(reads).toBe(1);
          for (const value of [undefined, null, 0, 7]) expect(run({ value })).toBe(value ?? 0);
          break;
        }
        case "record-pipeline":
          expect(run([])).toBe(0);
          expect(
            run([
              { id: 1, active: false, amount: 99 },
              { id: 1, active: true, amount: 0 },
              { id: 1, active: true, amount: 99 },
              { id: 2, active: true },
              { id: 3, active: true, amount: -7 },
            ]),
          ).toBe(-7);
          break;
        default:
          throw new Error(`No behavioral guard for benchmark ${fixture.name}`);
      }
    }
  }
});

test("benchmark widget is fresh and its timings match the recorded reports", () => {
  const result = Bun.spawnSync([
    "bun",
    repoPath(import.meta.url, "scripts/gen-benchmark-widget.ts"),
    "--check",
  ]);
  expect(result.exitCode, result.stderr.toString()).toBe(0);
  for (const workload of snapshots.workloads) {
    for (const timing of [workload.bun, workload.node]) {
      const pair = [timing.before, timing.after]
        .map((n) => n.toFixed(workload.precision))
        .join(" | ");
      expect(read(workload.report)).toContain(pair);
    }
  }
});

test("saved docs output panels match the current generator", () => {
  const result = Bun.spawnSync([
    "bun",
    repoPath(import.meta.url, "scripts/gen-docs-emit.ts"),
    "--check",
  ]);
  expect(result.exitCode, result.stderr.toString()).toBe(0);
});

test("displayed JS and TS panels execute matching shape and record behavior", () => {
  for (const target of ["js", "ts"] as const) {
    const source = read(`apps/docs/src/examples/emit-shape.${target}.txt`);
    const js = new Bun.Transpiler({ loader: target })
      .transformSync(source)
      .replace(/^import .*$/gm, "");
    const run = new Function(
      "_curry",
      "mul",
      "pi",
      "square",
      `${js}\nreturn [area({ _tag: "Circle", _0: 2 }), area({ _tag: "Rect", _0: 3, _1: 4 }), (typeof widen$ === "undefined" ? widen : widen$)(3, { w: 2, label: "box" })];`,
    );
    expect(run(_curry, mul, pi, square)).toEqual([4 * Math.PI, 12, { w: 6, label: "box" }]);
  }
});

test("README sources compile and displayed outputs preserve record fields", () => {
  const readme = read("README.md");
  for (const match of readme.matchAll(/```reason\n([\s\S]*?)```/g)) {
    expect(isErr(compile(match[1]!))).toBe(false);
  }
  for (const target of ["js", "ts"] as const) {
    const source = readme.match(new RegExp(`\`\`\`${target}\\n([\\s\\S]*?)\`\`\``))![1]!;
    const js = new Bun.Transpiler({ loader: target }).transformSync(source);
    const run = new Function(
      "add",
      "gt",
      `${js}\nreturn [greet({ age: 18, name: "Ada" }), greet({ age: 17, name: "Ada" }), birthday({ age: 17, name: "Ada" })];`,
    );
    expect(run(add, gt)).toEqual(["Welcome, Ada", "Sorry, Ada", { age: 18, name: "Ada" }]);
  }
});
