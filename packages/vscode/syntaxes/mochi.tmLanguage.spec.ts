import { expect, test } from "bun:test";
import grammar from "./mochi.tmLanguage.json";

type Pattern = { include?: string; match?: string; patterns?: Pattern[] };

const expressionIncludes = (grammar.repository.expression.patterns as Pattern[]).map((p) => p.include);
const controlMatch = (grammar.repository.keywords.patterns as Pattern[])[0]?.match ?? "";
const control = new RegExp(controlMatch);

test("control keywords include do, loop, and recur", () => {
  expect(control.test("do")).toBe(true);
  expect(control.test("loop")).toBe(true);
  expect(control.test("recur")).toBe(true);
  expect(control.test("looping")).toBe(false);
  expect(control.test("redo")).toBe(false);
});

test("keywords win over function-calls so loop( / recur( paint as keywords", () => {
  const keywordsAt = expressionIncludes.indexOf("#keywords");
  const callsAt = expressionIncludes.indexOf("#function-calls");
  expect(keywordsAt).toBeGreaterThanOrEqual(0);
  expect(callsAt).toBeGreaterThan(keywordsAt);
  expect("recur(".match(control)?.[0]).toBe("recur");
  expect("loop (".match(control)?.[0]).toBe("loop");
});
