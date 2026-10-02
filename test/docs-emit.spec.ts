import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler";
import { _curry, add, gt, mul, pi, square } from "@mochi/compiler/runtime";
import { readRepo, repoPath } from "@mochi/test-support";
import { isErr } from "@onrails/result";

const read = (path: string): string => readRepo(import.meta.url, path);

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
      `${js}\nreturn [area({ _tag: "Circle", _0: 2 }), area({ _tag: "Rect", _0: 3, _1: 4 }), widen(3, { w: 2, label: "box" })];`,
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
