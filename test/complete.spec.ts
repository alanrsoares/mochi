import { expect, test } from "bun:test";
import { styledCvaExtension } from "@mochi/plugin-styled-cva";
import { completeAt } from "../src/complete";

test("Task. lists prelude namespace members", () => {
  const src = "let x = Task.";
  const labels = completeAt(src, src.length).map((i) => i.label);
  expect(labels).toContain("map");
  expect(labels).toContain("andThen");
  expect(labels).toContain("recover");
  expect(labels).toContain("run");
});

test("Task.m filters by typed prefix", () => {
  const src = "let x = Task.m";
  const labels = completeAt(src, src.length).map((i) => i.label);
  expect(labels).toEqual(["map", "mapErr", "match"]);
});

test("Result. lists Result members", () => {
  const src = "let x = Result.";
  const labels = completeAt(src, src.length).map((i) => i.label);
  expect(labels).toContain("mapErr");
  expect(labels).toContain("isOk");
});

test("record field completion after r.", () => {
  const src = "let r = { a: 1, b: true }\nlet y = r.";
  const labels = completeAt(src, src.length).map((i) => i.label);
  expect(labels).toEqual(["a", "b"]);
});

test("record field completion with partial prefix", () => {
  const src = "let r = { alpha: 1, beta: 2 }\nlet y = r.a";
  const labels = completeAt(src, src.length).map((i) => i.label);
  expect(labels).toEqual(["alpha"]);
});

test("bare identifier suggests prelude values", () => {
  const src = "let z = ma";
  const labels = completeAt(src, src.length).map((i) => i.label);
  expect(labels).toContain("map");
  expect(labels).toContain("max");
});

test("bare identifier suggests top-level lets", () => {
  const src = "let answer = 42\nlet z = ans";
  const labels = completeAt(src, src.length).map((i) => i.label);
  expect(labels).toContain("answer");
});

test("tw. without plugin yields no members", () => {
  const src = 'extern tw : a = "@styled-cva/react" "default"\nlet x = tw.';
  expect(completeAt(src, src.length)).toEqual([]);
});

test("tw. with styled-cva plugin lists HTML tags", () => {
  const src = 'extern tw : a = "@styled-cva/react" "default"\nlet x = tw.';
  const labels = completeAt(src, src.length, { plugins: [styledCvaExtension] }).map((i) => i.label);
  expect(labels).toContain("div");
  expect(labels).toContain("button");
  expect(labels).toContain("span");
});

test("tw.d with plugin filters to matching tags", () => {
  const src = 'extern tw : a = "@styled-cva/react" "default"\nlet x = tw.d';
  const labels = completeAt(src, src.length, { plugins: [styledCvaExtension] }).map((i) => i.label);
  expect(labels).toEqual(["div"]);
});
