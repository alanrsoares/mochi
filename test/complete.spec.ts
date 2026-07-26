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

test("nested lambda param completes inside body", () => {
  const src = "let f = (answer) => ans";
  const labels = completeAt(src, src.length).map((i) => i.label);
  expect(labels).toContain("answer");
});

const TW = `extern tw : a = "@styled-cva/react" "default"
let BadgeShell = tw.div("base", {
  variants: { $tone: { rose: "a", amber: "b", emerald: "c" } },
  defaultVariants: { $tone: "rose" }
})
`;

test("JSX attr name completes component props", () => {
  const src = `${TW}let el = <BadgeShell `;
  const labels = completeAt(src, src.length, { plugins: [styledCvaExtension] }).map((i) => i.label);
  expect(labels).toContain("$tone");
});

test('JSX $tone=" completes literal union members', () => {
  const src = `${TW}let el = <BadgeShell $tone="`;
  const items = completeAt(src, src.length, { plugins: [styledCvaExtension] });
  expect(items.map((i) => i.label).toSorted()).toEqual(["amber", "emerald", "rose"]);
  expect(items.every((i) => i.kind === "literal")).toBe(true);
});

test('JSX $tone="ro filters lit prefix', () => {
  const src = `${TW}let el = <BadgeShell $tone="ro`;
  const labels = completeAt(src, src.length, { plugins: [styledCvaExtension] }).map((i) => i.label);
  expect(labels).toEqual(["rose"]);
});

test("nested letin binding completes in body", () => {
  const src = "let f = () => let local = 1 in loc";
  const labels = completeAt(src, src.length).map((i) => i.label);
  expect(labels).toContain("local");
});

test("lambda param does not complete outside the lambda", () => {
  const src = "let f = (secret) => 1\nlet z = sec";
  const labels = completeAt(src, src.length).map((i) => i.label);
  expect(labels).not.toContain("secret");
});

test("shadowed local completes as the inner binding", () => {
  const src = "let x = 1\nlet f = () => let x = 2 in x";
  const items = completeAt(src, src.length).filter((i) => i.label === "x");
  expect(items.some((i) => i.detail === "local")).toBe(true);
});
