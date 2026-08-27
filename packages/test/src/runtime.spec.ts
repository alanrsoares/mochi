import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { unwrapOk } from "@onrails/result";
import { oneof } from "./runtime.ts";

test("test bindings compile as curried @mochi/test/runtime imports", async () => {
  const source = await Bun.file(new URL("../test.mochi", import.meta.url)).text();
  const js = unwrapOk(compile(source));

  expect(js).toContain('import { test as $test } from "@mochi/test/runtime";');
  expect(js).toContain('import { describe as $describe } from "@mochi/test/runtime";');
  expect(js).toContain('import { assertEq as $assertEq } from "@mochi/test/runtime";');
  expect(js).toContain("const test = _curry(2, $test);");
  expect(js).toContain("const assertEq = _curry(2, $assertEq);");
  expect(js).toContain("const testEach = _curry(3, $testEach);");
  expect(js).toContain("const check = _curry(3, $check);");
  expect(js).toContain("const pair = _curry(2, $pair);");
  expect(js).toContain("const testTask = _curry(2, $testTask);");
  expect(js).toContain("const testEachTask = _curry(3, $testEachTask);");
  expect(js).toContain("const testTaskSkip = _curry(2, $testTaskSkip);");
  expect(js).toContain("const testTimeout = _curry(3, $testTimeout);");
  expect(js).toContain("const testTaskTimeout = _curry(3, $testTaskTimeout);");
  expect(js).toContain("const testEachTimeout = _curry(4, $testEachTimeout);");
  expect(js).toContain("const checkTask = _curry(3, $checkTask);");
  expect(js).toContain("const checkTaskTimeout = _curry(4, $checkTaskTimeout);");
  expect(js).toContain('import { int } from "@mochi/test/runtime";');
  expect(js).not.toContain("const int = _curry");
});

test("oneof rejects an empty list", () => {
  expect(() => oneof([])).toThrow(/at least one arbitrary/);
});

test("importing the runtime under CI=true does not throw", async () => {
  const proc = Bun.spawn(["bun", "-e", 'await import("./runtime.ts")'], {
    cwd: import.meta.dir,
    env: { ...process.env, CI: "true" },
    stderr: "pipe",
    stdout: "pipe",
  });
  const stderr = await new Response(proc.stderr).text();
  expect(await proc.exited).toBe(0);
  expect(stderr).not.toContain(".only is disabled");
});
