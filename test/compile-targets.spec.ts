import { describe, expect, test } from "bun:test";
import { codegenTs, compile, compileTargets, emitDts } from "@mochi/compiler";
import { compileTsSync, emitDtsSyncWith } from "@mochi/compiler/compile/sync";
import { defaultOptions } from "@mochi/compiler/extensions";
import { isErr, unwrapOk } from "@onrails/result";

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

  // #102: the barrel's typed emit is the self-hosted core's, not the TS core's.
  test("typed TS and .d.ts come from the bootstrap seed", () => {
    const multi = unwrapOk(compileTargets(src));
    expect(compileTsSync(src, "@mochi/runtime")).toEqual({ _tag: "Ok", value: multi.ts });
    expect(emitDtsSyncWith(src, "@mochi/runtime", defaultOptions)).toEqual({
      _tag: "Ok",
      value: multi.dts,
    });
  });

  test("a type error keeps its kind and span", () => {
    const bad = codegenTs('let x = 1 + "a"');
    expect(isErr(bad) && bad.error[0]).toMatchObject({ kind: "type" });
    expect(isErr(emitDts('let x = 1 + "a"'))).toBe(true);
  });
});
