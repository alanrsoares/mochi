import { expect, test } from "bun:test";
import { unwrapOk } from "@onrails/result";
import { formatOutput } from "./format-output";

test("output formatting keeps import order and unused bindings", () => {
  const output = unwrapOk(
    formatOutput('import{z}from"z";import{a}from"a";const unused=()=>{return z(a)}', {
      language: "js",
    }),
  );
  expect(output.indexOf('from "z"')).toBeLessThan(output.indexOf('from "a"'));
  expect(output).toContain("const unused = () => {\n  return z(a);\n};");
});

test("unparseable emitted code returns a formatter error", () => {
  const result = formatOutput("const broken = (", { language: "ts" });
  expect(result._tag).toBe("Err");
  if (result._tag === "Err")
    expect(result.error.message).toContain("Biome output formatting failed");
});
