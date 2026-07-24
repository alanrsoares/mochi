import { expect, test } from "bun:test";
import { toPublish } from "../src/diagnostics";
import { type Diagnostic, formatError } from "../src/errors";

const rich: Diagnostic = {
  kind: "type",
  message: "unbound variable 'z'",
  span: { start: 18, end: 19 },
  labels: [
    { location: { path: "/t.mochi", span: { start: 4, end: 5 } }, message: "defined here as 'x'" },
  ],
  help: "check the name, or bind `z` before using it",
  suggestions: [
    {
      location: { path: "/t.mochi", span: { start: 18, end: 19 } },
      replaceWith: "x",
      title: "Did you mean 'x'?",
    },
  ],
};

test("formatError renders labels, help, and suggestions", () => {
  const src = "let x = 1\nlet y = z";
  const out = formatError(rich, src, { path: "/t.mochi" });
  expect(out).toBe(
    [
      "TypeError at 2:9: unbound variable 'z'",
      "  /t.mochi:1:5: defined here as 'x'",
      "help: check the name, or bind `z` before using it",
      "suggestion: Did you mean 'x'?",
    ].join("\n"),
  );
});

test("toPublish maps labels to related and keeps suggestions", () => {
  const src = "let x = 1\nlet y = z";
  const pub = toPublish(src, rich, "/t.mochi");
  expect(pub.message).toContain("help: check the name");
  expect(pub.related).toEqual([
    {
      message: "defined here as 'x'",
      path: "/t.mochi",
      range: { start: { line: 0, character: 4 }, end: { line: 0, character: 5 } },
    },
  ]);
  expect(pub.suggestions?.[0]?.replaceWith).toBe("x");
  expect(pub.suggestions?.[0]?.title).toBe("Did you mean 'x'?");
});
