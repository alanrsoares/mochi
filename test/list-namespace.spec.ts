// Qualified collection namespaces: `List.map`, `Array.map`, … alang has no
// overloading, so each collection carries its own `Ns.op`. `List.*` transformers
// are lazy (fuse over infinite sequences); `Array.*` mirror the eager unqualified
// ops. Access parses as plain field-access — no new syntax.
import { expect, test } from "bun:test";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { check } from "../src/check";
import { compile } from "../src/compile";
import { emitDts } from "../src/dts";
import { inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeEnv, preludeNamespaces } from "../src/prelude";

const run = (src: string, ret: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function(`${js}\nreturn ${ret};`)();
};

const schemeOf = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  const env = unwrapOk(
    inferProgram(prog, preludeEnv, { open: true, namespaces: preludeNamespaces }),
  );
  return showScheme(env.get(name)!);
};

const DBL = "let dbl = x => mul(x, 2)\n";
const BIG = "let big = x => gt(x, 4)\n";

// ---- lazy List transformers ------------------------------------------------

test("List.map is lazy — maps an infinite sequence, take pulls a prefix", () => {
  const src = `${DBL}let inc = x => add(x, 1)\nlet a = toArray(take(4)(List.map(dbl)(iterate(inc)(0))))`;
  expect(run(src, "a")).toEqual([0, 2, 4, 6]);
});

test("List.filter keeps matching elements, lazily", () => {
  const src = `${BIG}let a = toArray(take(3)(List.filter(big)(iterate(x => add(x, 1))(0))))`;
  expect(run(src, "a")).toEqual([5, 6, 7]);
});

test("map |> filter fuses with no intermediate array", () => {
  const src = `${DBL}${BIG}let a = @{1, 2, 3, 4, 5} |> List.map(dbl) |> List.filter(big) |> toArray`;
  expect(run(src, "a")).toEqual([6, 8, 10]);
});

test("List.concat joins two Lists", () => {
  expect(run("let a = toArray(List.concat(@{1, 2})(@{3, 4}))", "a")).toEqual([1, 2, 3, 4]);
});

test("List.flatMap maps and flattens", () => {
  expect(run("let a = toArray(List.flatMap(x => @{x, x})(@{1, 2}))", "a")).toEqual([1, 1, 2, 2]);
});

// ---- Array namespace mirrors the eager ops ---------------------------------

test("Array.map is the eager Array map", () => {
  expect(run(`${DBL}let a = Array.map(dbl)([1, 2, 3])`, "a")).toEqual([2, 4, 6]);
});

// ---- codegen ---------------------------------------------------------------

test("List.map lowers to the lazy runtime id, not a field access", () => {
  const out = unwrapOk(compile(`${DBL}let a = List.map(dbl)(@{1})`, { runtime: false }));
  expect(out).toContain("_List_map(dbl)");
  expect(out).not.toContain("List.map");
});

// ---- types -----------------------------------------------------------------

test("List.map has the List-preserving type", () => {
  // normalize var ids (they shift as the prelude grows) — structure is what matters
  expect(schemeOf("let f = List.map", "f").replace(/'t\d+/g, "'t")).toBe(
    "('t -> 't) -> List<'t> -> List<'t>",
  );
});

test("List.map applied to an Array is a type error", () => {
  expect(isErr(compile(`${DBL}let a = List.map(dbl)([1, 2, 3])`))).toBe(true);
});

test("an unknown namespace member is a type error", () => {
  const r = compile("let a = List.nope(@{1})");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).message).toContain("has no member 'nope'");
});

test("List erases to Iterable through a namespace op in .d.ts", () => {
  const dts = unwrapOk(
    emitDts(`${DBL.replace("let", "export let")}export let ys = List.map(dbl)(@{1, 2})`),
  );
  expect(dts).toContain("Iterable<number>");
});

// ---- reserved names --------------------------------------------------------

test("binding a namespace name is rejected", () => {
  const r = compile("let List = 5");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).message).toContain("reserved collection namespace");
});

test("importing a namespace name is rejected", () => {
  const r = compile('import { Array } from "./x"\nlet a = 1');
  expect(isErr(r)).toBe(true);
});
