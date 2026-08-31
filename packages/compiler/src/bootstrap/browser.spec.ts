import { expect, test } from "bun:test";
import { inferTypesBootstrapBrowser } from "./browser.ts";

test("browser bootstrap facade exposes typed queries", () => {
  expect(inferTypesBootstrapBrowser("let answer = 42")).toEqual({
    _tag: "Ok",
    value: expect.objectContaining({
      types: expect.arrayContaining([
        expect.objectContaining({ span: { start: 13, end: 15 }, display: "number" }),
      ]),
    }),
  });
});
