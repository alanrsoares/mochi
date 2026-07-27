import { expect, test } from "bun:test";
import { isErr, isOk, unwrapOk } from "@onrails/result";
import { transformSource } from "./transform.ts";
import { mapProgramExprs } from "./walk.ts";

test("transformSource renames a ref through format round-trip", () => {
  const src = "let x = 1\nlet y = x";
  const r = transformSource(src, (prog) =>
    mapProgramExprs(prog, (e) => (e.kind === "ref" && e.name === "x" ? { ...e, name: "n" } : e)),
  );
  expect(isOk(r)).toBe(true);
  expect(unwrapOk(r)).toBe("let x = 1\nlet y = n\n");
});

test("strict mode rejects unparseable source", () => {
  const r = transformSource("let x = )", (p) => p, { strict: true });
  expect(isErr(r)).toBe(true);
});

test("recovery mode preserves error stmt verbatim", () => {
  const src = "let x = )\nlet n = 1";
  const r = transformSource(src, (prog) =>
    mapProgramExprs(prog, (e) =>
      e.kind === "num" ? { ...e, value: e.value + 1, raw: String(e.value + 1) } : e,
    ),
  );
  expect(isOk(r)).toBe(true);
  const out = unwrapOk(r);
  expect(out).toContain("let x = )");
  expect(out).toContain("let n = 2");
});
