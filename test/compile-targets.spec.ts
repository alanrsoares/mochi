import { describe, expect, test } from "bun:test";
import { isErr, unwrapOk } from "@onrails/result";
import { codegenTs } from "../src/codegen-ts";
import { compile } from "../src/compile";
import { compileTargets } from "../src/compile-targets";
import { emitDts } from "../src/dts";

const src = `
let add = (a, b) => a + b
let n = add(1, 2)
`;

describe("compileTargets", () => {
  test("one typed pass emits js + ts + dts", () => {
    const r = unwrapOk(compileTargets(src, { runtime: true }));
    expect(r.js).toContain("const add");
    expect(r.ts).toContain("const add");
    expect(r.dts).toContain("export declare const add");
  });

  test("matches single-target APIs", () => {
    const multi = unwrapOk(compileTargets(src, { runtime: true }));
    expect(multi.js).toBe(unwrapOk(compile(src, { runtime: true })));
    expect(multi.ts).toBe(unwrapOk(codegenTs(src)));
    expect(multi.dts).toBe(unwrapOk(emitDts(src)));
  });

  test("surfaces diagnostics without partial emit", () => {
    const bad = compileTargets("let x = (\n", { runtime: true });
    expect(isErr(bad)).toBe(true);
  });
});
