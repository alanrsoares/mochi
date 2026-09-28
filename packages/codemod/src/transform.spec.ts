import { expect, test } from "bun:test";
import { isErr, isOk, unwrapOk } from "@onrails/result";
import { transformSource } from "./transform.ts";
import { mapProgramExprs } from "./walk.ts";

test("transformSource renames a ref through format round-trip", () => {
  const src = "let x = 1\nlet y = x";
  const r = transformSource(src, (prog) =>
    mapProgramExprs(prog, (e) => (e._tag === "ERef" && e.name === "x" ? { ...e, name: "n" } : e)),
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
      e._tag === "ENum" ? { ...e, value: e.value + 1, raw: String(e.value + 1) } : e,
    ),
  );
  expect(isOk(r)).toBe(true);
  const out = unwrapOk(r);
  expect(out).toContain("let x = )");
  expect(out).toContain("let n = 2");
});

test("strict mode reports every recovered diagnostic", () => {
  const r = transformSource("let x = )\nlet y = )", (p) => p, { strict: true });
  expect(isErr(r) && r.error.length).toBe(2);
});

test("JSX survives the round-trip as tags", () => {
  const src = 'let v = <div class="a">{x}</div>\n';
  expect(unwrapOk(transformSource(src, (p) => p))).toBe(src);
});

test("mapExpr enters match guards and record spreads", () => {
  const src = "let f = r => switch r { | n when x > 0 => n | _ => r }\nlet g = { ...x, a: x }\n";
  const r = transformSource(src, (prog) =>
    mapProgramExprs(prog, (e) => (e._tag === "ERef" && e.name === "x" ? { ...e, name: "y" } : e)),
  );
  expect(unwrapOk(r)).toBe(src.replaceAll("x", "y"));
});
