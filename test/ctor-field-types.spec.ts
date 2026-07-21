// ADR 0015 — constructor fields carry full type expressions. The parser AST
// port (Slice D) needs `[Expr]`, `Option Expr`, and tuple payloads; before this
// a ctor field type was a bare name.
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { emitDts } from "../src/dts";
import { format } from "../src/format";

const run = (src: string, ret: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function("match", `"use strict";\n${js}\nreturn ${ret};`)(match);
};

const AST_SRC = `type Expr =
  | ENum(value: number)
  | ECall(fn: Expr, args: [Expr])
  | EOpt(guard: Option Expr)
  | EPair(both: (Expr, Expr))

let size = e => switch e {
  | ENum(_) => 1
  | ECall(f, args) => add(size(f), reduce((acc, x) => add(acc, size(x)), 0, args))
  | EOpt(g) => g |> Option.mapOr(0, size)
  | EPair((a, b)) => add(size(a), size(b))
}

let n = size(ECall(ENum(0), [ENum(2), EOpt(Some(ENum(3))), EPair((ENum(4), ENum(5)))]))`;

test("list / applied / tuple ctor fields compile and evaluate", () => {
  expect(run(AST_SRC, "n")).toBe(5);
});

test("positional composite fields work too", () => {
  const src = `type T = | Wrap([number]) | Pick(Option number)
let a = switch Wrap([1, 2, 3]) { | Wrap(xs) => Array.length(xs) | Pick(o) => o |> Option.unwrapOr(0) }
let b = switch Pick(Some(9)) { | Wrap(xs) => Array.length(xs) | Pick(o) => o |> Option.unwrapOr(0) }`;
  expect(run(src, "[a, b]")).toEqual([3, 9]);
});

test("arrow ctor fields hold functions", () => {
  const src = `type Step a = | Done(a) | More(next: a -> Step a)
let runTwice = s => switch s {
  | Done(v) => v
  | More(f) => switch f(1) { | Done(v) => v | More(g) => switch g(2) { | Done(v) => v | More(_) => -1 } }
}
let r = runTwice(More(x => More(y => Done(add(x, y)))))`;
  expect(run(src, "r")).toBe(3);
});

test("record-alias name as a ctor field expands structurally", () => {
  const src = `type Pt = { x: number, y: number }
type Shape = | At(pos: Pt)
let s = At({ x: 3, y: 4 })
let r = switch s { | At(p) => add(p.x, p.y) }`;
  expect(run(src, "r")).toBe(7);
});

test(".d.ts renders composite ctor fields in TS syntax", () => {
  const dts = unwrapOk(emitDts(AST_SRC));
  expect(dts).toContain('{ _tag: "ECall"; fn: Expr; args: Expr[] }');
  expect(dts).toContain('{ _tag: "EOpt"; guard: Option<Expr> }');
  expect(dts).toContain('{ _tag: "EPair"; both: [Expr, Expr] }');
});

test("formatter round-trips composite ctor fields idempotently", () => {
  const once = unwrapOk(format(AST_SRC));
  expect(once).toContain("ECall(fn: Expr, args: [Expr])");
  expect(once).toContain("EOpt(guard: Option Expr)");
  expect(once).toContain("EPair(both: (Expr, Expr))");
  expect(unwrapOk(format(once))).toBe(once);
});

test("a stray lowercase type var in a ctor field is a check error", () => {
  const r = compile("type Foo = | Mk(x: a)");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).message).toContain("unknown type parameter 'a' in constructor 'Mk'");
});

test("declared params are not stray, nested or not", () => {
  const src = `type Tree a = | Leaf(a) | Node(kids: [Tree a])
let count = t => switch t {
  | Leaf(_) => 1
  | Node(ks) => reduce((acc, k) => add(acc, count(k)), 0, ks)
}
let r = count(Node([Leaf(1), Node([Leaf(2), Leaf(3)])]))`;
  expect(run(src, "r")).toBe(3);
});
