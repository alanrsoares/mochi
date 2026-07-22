// TypeScript declaration emission.
import { expect, test } from "bun:test";
import { unwrapOk } from "@onrails/result";
import { emitDts } from "../src/dts";

const dts = (src: string): string => unwrapOk(emitDts(src)).trim();

test("a plain value declares a const of its type", () => {
  expect(dts("let answer = 42")).toBe("export declare const answer: number;");
});

test("a single-param lambda declares a unary function", () => {
  expect(dts("let inc = x => add(x, 1)")).toBe("export declare const inc: (x: number) => number;");
});

test("a multi-param lambda declares an uncurried function (matches emitted JS)", () => {
  expect(dts("let sum = (a, b) => add(a, b)")).toBe(
    "export declare const sum: (a: number, b: number) => number;",
  );
});

test("a curried definition stays curried, with generics for polymorphism", () => {
  const src =
    "type Result a e = | Ok(a) | Err(e)\nlet fmap = f => r => switch r { | Ok(v) => Ok(f(v)) | Err(e) => Err(e) }";
  expect(dts(src)).toContain(
    "export declare const fmap: <A, B, C>(f: (a: A) => B) => (r: Result<A, C>) => Result<B, C>;",
  );
});

test("a variant decl emits a tagged-union type matching the runtime", () => {
  expect(dts("type Result a e = | Ok(a) | Err(e)")).toBe(
    'export type Result<A, B> =\n  | { _tag: "Ok"; _0: A }\n  | { _tag: "Err"; _0: B };',
  );
});

test("a nullary variant emits tag-only members", () => {
  expect(dts("type Color = | Red | Green")).toBe(
    'export type Color =\n  | { _tag: "Red" }\n  | { _tag: "Green" };',
  );
});

test("externs are omitted (they are imports, not our declarations)", () => {
  expect(dts(`extern sqrt : number -> number = "node:module" "sqrt"`)).toBe("");
});

test("destructuring temps are not declared", () => {
  const out = dts("let p = { x: 1, y: 2 }\nlet { x, y } = p");
  expect(out).not.toContain("$d");
  expect(out).toContain("export declare const x: number;");
});
