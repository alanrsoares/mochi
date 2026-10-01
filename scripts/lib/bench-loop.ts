// Compare actual compiled scalar loop/recur output with the previous array lowering.
// Only the rebinding block changes; runtime helpers stay identical.
import { compileJs } from "@mochi/test-support";
import type { BenchCase } from "./bench-suites";

type LoopFixture = {
  readonly name: string;
  readonly source: string;
  readonly names: readonly string[];
  readonly args: readonly string[];
  readonly expected: (n: number) => number;
};

export type LoopKernel = {
  readonly name: string;
  readonly emitted: string;
  readonly array: string;
  readonly expected: (n: number) => number;
};

const FIXTURES: readonly LoopFixture[] = [
  {
    name: "count/2",
    source: "let run = n => loop (i = 0, acc = 0) { i >= n ? acc : recur(i + 1, acc + 1) }",
    names: ["i", "acc"],
    args: ["add(i, 1)", "add(acc, 1)"],
    expected: (n) => n,
  },
  {
    name: "sum/2",
    source: "let run = n => loop (i = 0, acc = 0) { i >= n ? acc : recur(i + 1, acc + i) }",
    names: ["i", "acc"],
    args: ["add(i, 1)", "add(acc, i)"],
    expected: (n) => (n * (n - 1)) / 2,
  },
  {
    name: "rotate/4",
    source:
      "let run = n => loop (i = 0, a = 1, b = 2, c = 3) { i >= n ? a * 100 + b * 10 + c : recur(i + 1, b, c, a) }",
    names: ["i", "a", "b", "c"],
    args: ["add(i, 1)", "b", "c", "a"],
    expected: (n) => (n % 3 === 0 ? 123 : n % 3 === 1 ? 231 : 312),
  },
  {
    name: "mixed/4",
    source:
      'let run = n => loop (i = 0, a = "left", b = "right", flag = true) { i >= n ? (a == "left" ? 10 : 20) + (flag ? 1 : 0) : recur(i + 1, b, a, !flag) }',
    names: ["i", "a", "b", "flag"],
    args: ["add(i, 1)", "b", "a", "not(flag)"],
    expected: (n) => (n % 2 === 0 ? 11 : 20),
  },
];

export const loopKernels = (): readonly LoopKernel[] =>
  FIXTURES.map((fixture) => {
    const emitted = compileJs(fixture.source, { runtime: true, open: false, stripImports: true });
    const temps = fixture.args.map((arg, i) => `const $recur${i} = ${arg};`);
    const assignments = fixture.names.map((name, i) => `${name} = $recur${i};`);
    const rebind = `{ ${temps.join(" ")} ${assignments.join(" ")} continue; }`;
    if (emitted.split(rebind).length !== 2) {
      throw new Error(`${fixture.name}: expected exactly one scalar recur rebinding`);
    }
    const array = emitted.replace(
      rebind,
      `[${fixture.names.join(", ")}] = [${fixture.args.join(", ")}]; continue;`,
    );
    return { name: fixture.name, emitted, array, expected: fixture.expected };
  });

export const loopCases = (): readonly BenchCase[] =>
  loopKernels().flatMap((kernel) =>
    (["array", "emitted"] as const).map((variant) => {
      const run = new Function(`${kernel[variant]}\nreturn run;`)() as (n: number) => number;
      // Check swaps and odd/even termination before timing. Warm the same function measured below.
      for (const n of [0, 1, 2, 3, 17, 10001]) {
        if (run(n) !== kernel.expected(n))
          throw new Error(`${kernel.name}/${variant}: wrong result`);
      }
      const n = 2000000;
      // Warm at measurement size: the sum crosses the engine's small-integer range.
      for (let i = 0; i < 30; i++) run(n);
      return {
        name: `loop ${kernel.name}/${variant}`,
        note: `${n} iterations; warmed; compilation excluded`,
        run: () => {
          const result = run(n);
          if (result !== kernel.expected(n))
            throw new Error(`${kernel.name}/${variant}: wrong result`);
          return result;
        },
      };
    }),
  );
