import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { unwrapOk } from "@onrails/result";

test("test bindings compile as curried @mochi/test/runtime imports", async () => {
  const source = await Bun.file(new URL("../test.mochi", import.meta.url)).text();
  const js = unwrapOk(compile(source));

  expect(js).toContain('import { test as $test } from "@mochi/test/runtime";');
  expect(js).toContain('import { describe as $describe } from "@mochi/test/runtime";');
  expect(js).toContain('import { assertEq as $assertEq } from "@mochi/test/runtime";');
  expect(js).toContain("const test = _curry(2, $test);");
  expect(js).toContain("const assertEq = _curry(2, $assertEq);");
});
