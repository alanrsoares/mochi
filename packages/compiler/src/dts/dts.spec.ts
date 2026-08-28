// TypeScript declaration emission.
import { expect, test } from "bun:test";
import { emitDts } from "@mochi/compiler/dts";
import { unwrapOk } from "@onrails/result";

const dts = (src: string): string => unwrapOk(emitDts(src)).trim();

test("a plain value declares a const of its type", () => {
  expect(dts("let answer = 42")).toBe("export declare const answer: number;");
});

test("a single-param lambda declares a unary function", () => {
  expect(dts("let inc = x => add(x, 1)")).toBe("export declare const inc: (x: number) => number;");
});

test("a nullary lambda declares () => T (ADR 0014)", () => {
  expect(dts("let one = () => 1")).toBe("export declare const one: () => number;");
});

test("a unit result declares undefined, the type of the emitted value (ADR 0054)", () => {
  expect(dts("let nothing = ()")).toBe("export declare const nothing: undefined;");
  expect(dts("let drop = x => ignore(x)")).toBe(
    "export declare const drop: <A>(x: A) => undefined;",
  );
});

test("an array of functions parenthesizes the arrow (Wave 8)", () => {
  // Without parens, `(a: A) => B[]` means "function returning B[]".
  expect(dts('extern id : a -> a = "./x" "id"\nlet hs = [id]')).toBe(
    "export declare const hs: ((a: unknown) => unknown)[];",
  );
});

test("a concrete multi-param lambda declares a curry-compatible type (ADR 0093)", () => {
  // `_curry` makes it callable in any grouping — `sum(a, b)` or `sum(a)(b)` —
  // so the type is `_Curry`, which accepts every argument prefix. This replaced
  // the 2^(n-1) overload set of ADR 0037; the helper decls ride along.
  expect(dts("let sum = (a, b) => add(a, b)")).toContain(
    "export declare const sum: _Curry<[a: number, b: number], number>;",
  );
});

test("a .d.ts naming _Curry imports it from the runtime, not redeclares it", () => {
  expect(dts("let sum = (a, b) => add(a, b)")).toContain(
    'import type { _Curry } from "@mochi/runtime";',
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

// ADR 0011 §5 — component dts still fires off JSX provenance, not `fn.name === "h"`.
test("a real JSX lambda declares as a host-agnostic component (ADR 0010 #17)", () => {
  const out = dts('let Card = props => <div className="card">{props.title}</div>');
  expect(out).toContain("export declare const Card: (props:");
  expect(out).toContain(") => any;");
});

// ADR 0055 — the blessed `type Props` + annotation idiom must survive emit:
// the alias is named in the sidecar, not degraded to an open props bag.
test("an annotated component names its Props alias (ADR 0055)", () => {
  const out = dts(
    "type Props = { title: string }\nlet Card : Props -> VNode = props => <div>{props.title}</div>",
  );
  expect(out).toContain("export type Props = { title: string };");
  expect(out).toContain("export declare const Card: (props: Props) => any;");
  expect(out).not.toContain("Record<string, unknown>");
});

// ADR 0055 — `VNode` is the jsx plugin's vocabulary; it must never appear as a
// dangling (undeclared) name in TS output.
test("a bare VNode binding never leaks the plugin's type name (ADR 0055)", () => {
  const out = dts("let el = <div />");
  expect(out).toBe("export declare const el: any;");
});

// ADR 0055 — `unit` in arrow-return position renders `void`, so a declared
// handler prop accepts the host's ordinary `() => void` callbacks.
test("unit-returning fields render void, standalone unit stays undefined", () => {
  const out = dts("type P = { onRun: () -> (), tag: string }\nlet mk = (p) => p.onRun");
  expect(out).toContain("onRun: () => void");
  expect(dts("let nothing = ()")).toBe("export declare const nothing: undefined;");
});

test("a written D.Shape folds back with a type-only star import (C5 dts)", () => {
  const src = [
    'import * as D from "./shapes"',
    'extern mk : number -> D.Shape = "./shapes" "Circle"',
    "export let c : D.Shape = mk(1)",
  ].join("\n");
  const out = dts(src);
  expect(out).toContain('import type * as D from "./shapes.mochi";');
  expect(out).toContain("export declare const c: D.Shape;");
});
