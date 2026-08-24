import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { unwrapOk } from "@onrails/result";

test("CLI bindings compile as direct Bun runtime imports", async () => {
  const source = await Bun.file(new URL("../cli.mochi", import.meta.url)).text();
  const js = unwrapOk(compile(source));

  expect(js).toContain('import { args } from "@mochi/bun/runtime";');
  expect(js).toContain('import { log } from "@mochi/bun/runtime";');
  expect(js).toContain('import { error } from "@mochi/bun/runtime";');
});

test("terminal bindings preserve lazy Task extern arity", async () => {
  const source = await Bun.file(new URL("../terminal.mochi", import.meta.url)).text();
  const js = unwrapOk(compile(source));

  expect(js).toContain('import { enter } from "@mochi/bun/runtime";');
  expect(js).toContain('import { draw as $draw } from "@mochi/bun/runtime";');
  expect(js).toContain('import { leave } from "@mochi/bun/runtime";');
  expect(js).toContain("const draw = _curry(2, $draw);");
});
