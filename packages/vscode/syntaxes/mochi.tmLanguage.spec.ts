import { expect, test } from "bun:test";
import grammar from "./mochi.tmLanguage.json";

type Pattern = { include?: string; match?: string; patterns?: Pattern[] };

const expressionIncludes = (grammar.repository.expression.patterns as Pattern[]).map((p) => p.include);
const controlMatch = (grammar.repository.keywords.patterns as Pattern[])[0]?.match ?? "";
const control = new RegExp(controlMatch);

test("control keywords include do, loop, recur, as, and from", () => {
  expect(control.test("do")).toBe(true);
  expect(control.test("loop")).toBe(true);
  expect(control.test("recur")).toBe(true);
  expect(control.test("as")).toBe(true);
  expect(control.test("from")).toBe(true);
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

test("when is a control keyword in guards but falls through to function calls for when(...)", () => {
  expect("when x > 0".match(control)?.[0]).toBe("when");
  expect("when cond =>".match(control)?.[0]).toBe("when");
  expect("when(".match(control)).toBeNull();
  expect("when (".match(control)).toBeNull();
  expect("when }".match(control)).toBeNull();
  expect("when ,".match(control)).toBeNull();
  expect("when:".match(control)).toBeNull();
  expect("when =".match(control)).toBeNull();
});

test("imports pattern is included ahead of braces and keywords", () => {
  const importsAt = expressionIncludes.indexOf("#imports");
  const keywordsAt = expressionIncludes.indexOf("#keywords");
  const bracesAt = expressionIncludes.indexOf("#braces");
  expect(importsAt).toBeGreaterThanOrEqual(0);
  expect(importsAt).toBeLessThan(bracesAt);
  expect(importsAt).toBeLessThan(keywordsAt);
});
