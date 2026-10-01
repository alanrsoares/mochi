import { expect, test } from "bun:test";
import { diagnosticFromSeed } from "./seed-diagnostic";

test.each(["lex", "parse", "check", "type", undefined, "future"])(
  "normalizes diagnostic kind %s",
  (kind) => {
    expect(diagnosticFromSeed({ kind, message: "bad", start: 2, end: 4 }).kind).toBe(
      kind === undefined || kind === "future" ? "type" : kind,
    );
  },
);

test("keeps source identity, help, and fixes without editor presentation", () => {
  expect(
    diagnosticFromSeed(
      {
        kind: "type",
        message: "bad",
        start: 2,
        end: 4,
        path: "/dep.mochi",
        help: { _tag: "Some", value: "hint" },
        suggestions: [{ title: "fix", start: 2, end: 4, replaceWith: "good" }],
      },
      "/entry.mochi",
    ),
  ).toEqual({
    kind: "type",
    message: "bad",
    span: { start: 2, end: 4 },
    path: "/dep.mochi",
    help: "hint",
    suggestions: [
      {
        title: "fix",
        location: { path: "/entry.mochi", span: { start: 2, end: 4 } },
        replaceWith: "good",
      },
    ],
  });
});
