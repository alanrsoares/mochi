// `curried` extern hosts (ADR 0064). A signature always describes MOCHI-side
// usage — `a -> b -> c` is one type, and parentheses in it are only grouping.
// How the host itself is shaped is a property of the JS artifact, so it lives in
// the calling-convention slot alongside `send`/`new`/`global` (ADR 0059).
import { expect, test } from "bun:test";
import { basename } from "node:path";
import { compile } from "@mochi/compiler/compile";
import { buildModulesTs } from "@mochi/compiler/module";
import { format } from "@mochi/dx/format";
import { compileAndEval, compileJs } from "@mochi/test-support";
import { isErr, unwrapOk } from "@onrails/result";

const js = (src: string) => compileJs(src, { runtime: true });

const FLAT = 'extern add : number -> number -> number = "./m" "add"\n';
const CURRIED = 'extern add : number -> number -> number = curried "./m" "add"\n';

// `stripImports` drops the import line, so the host is injected under the name
// the emit expects — an arity-≥2 extern binds it as `$name`.
const hosts = async () => ({
  match: (await import("@onrails/pattern")).match,
  $add: undefined as unknown,
});

test("a flat host keeps the direct _curry bridge", () => {
  expect(js(FLAT)).toContain("const add = _curry(2, $add);");
});

test("a curried host is applied one argument at a time", () => {
  expect(js(CURRIED)).toContain("const add = _curry(2, ($a0, $a1) => $add($a0)($a1));");
});

test("arity 3 nests the applications", () => {
  const src = 'extern f : a -> b -> c -> d = curried "./m" "f"\n';
  expect(js(src)).toContain("_curry(3, ($a0, $a1, $a2) => $f($a0)($a1)($a2));");
});

test("below arity 2 the two host shapes coincide — plain import", () => {
  const src = 'extern f : number -> number = curried "./m" "f"\n';
  expect(js(src)).toContain('import { f } from "./m";');
  expect(js(src)).not.toContain("_curry");
});

test("the signature is untouched — grouping stays pure grouping", () => {
  // Both spellings are the same type and the same emit; `fmt` normalizes the
  // redundant parentheses away rather than giving them a meaning.
  const grouped = 'extern add : number -> (number -> number) = curried "./m" "add"\n';
  expect(js(grouped)).toBe(js(CURRIED));
  expect(unwrapOk(format(grouped))).toBe(CURRIED);
});

test("a curried host serves every mochi call shape", async () => {
  const g = { ...(await hosts()), $add: (a: number) => (b: number) => a + b };
  expect(compileAndEval(`${CURRIED}let r = add(1, 2)`, "r", g)).toBe(3);
  expect(compileAndEval(`${CURRIED}let r = add(1)(2)`, "r", g)).toBe(3);
  expect(compileAndEval(`${CURRIED}let inc = add(1)\nlet r = inc(41)`, "r", g)).toBe(42);
});

test("a flat host still serves every mochi call shape", async () => {
  const g = { ...(await hosts()), $add: (a: number, b: number) => a + b };
  expect(compileAndEval(`${FLAT}let r = add(1, 2)`, "r", g)).toBe(3);
  expect(compileAndEval(`${FLAT}let r = add(1)(2)`, "r", g)).toBe(3);
});

test("the formatter round-trips the convention", () => {
  expect(unwrapOk(format(CURRIED))).toBe(CURRIED);
  expect(unwrapOk(format(FLAT))).toBe(FLAT);
});

test("`curried` does not combine with a JS convention", () => {
  const res = compile('extern trim : string -> string = curried send "trim"\n');
  expect(isErr(res)).toBe(true);
  if (!isErr(res)) throw new Error("unreachable");
  expect(res.error[0]?.message).toContain("'curried' applies to a module extern");
});

test("a curried host's .d.ts declares the host's own nested shape", async () => {
  const files: Record<string, string> = {
    "/p/main.mochi": `${CURRIED}extern tag : string -> string -> string = "./m" "tag"\nlet a = add(1, 2)\nlet b = tag("x", "y")\n`,
  };
  const built = await buildModulesTs("/p/main.mochi", async (p: string) => {
    const src = files[p];
    if (src === undefined) throw new Error(`no such file ${p}`);
    return src;
  });
  if (isErr(built)) throw new Error(built.error[0]!.message);
  const dts = built.value.find((o) => basename(o.path) === "m.d.ts");
  expect(dts).toBeDefined();
  // The sidecar describes the HOST: one argument per call, no partial-application
  // overloads (mochi's `_curry` wraps this host, it is not exported by it).
  expect(dts?.js).toContain("export declare const add: (a: number) => (b: number) => number;");
  // A flat host keeps the overload set covering every grouping `_curry` accepts.
  expect(dts?.js).toContain("export declare const tag: {");
  expect(dts?.js).toContain("(a: string, b: string): string;");
});
