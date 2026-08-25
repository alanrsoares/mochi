import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { unwrapOk } from "@onrails/result";
import { option } from "./runtime";

test("option converts JavaScript nullish values to Mochi Option tags", () => {
  expect(option(null)).toEqual({ _tag: "None" });
  expect(option(undefined)).toEqual({ _tag: "None" });
  expect(option(0)).toEqual({ _tag: "Some", value: 0 });
});

test("canvas bindings compile as curried typed externs", async () => {
  const source = await Bun.file(new URL("../canvas.mochi", import.meta.url)).text();
  const js = unwrapOk(compile(source));

  expect(js).toContain('import { context2d } from "@mochi/web/runtime";');
  expect(js).toContain("const clearRect = _curry(5, $clearRect);");
  expect(js).toContain("const startCanvasLoop = _curry(2, $startCanvasLoop);");
  expect(js).toContain("const setLineCap = _curry(2, $setLineCap);");
  expect(js).toContain("const setLineJoin = _curry(2, $setLineJoin);");
});

test("timer binding stays fully applied at its two runtime arguments", async () => {
  const source = await Bun.file(new URL("../dom.mochi", import.meta.url)).text();
  const js = unwrapOk(compile(source));

  expect(js).toContain("const every = _curry(2, $every);");
  expect(js).toContain("const onKeyDown = _curry(2, $onKeyDown);");
});

test("time binding keeps the browser clock separate from DOM", async () => {
  const source = await Bun.file(new URL("../time.mochi", import.meta.url)).text();
  const js = unwrapOk(compile(source));

  expect(js).toContain('import { performanceNow } from "@mochi/web/runtime";');
});
