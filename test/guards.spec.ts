// Pattern guards: `| pattern when expr => body`. The guard sees the pattern's
// binds, must be bool, runs after the structural tests, and never counts
// toward exhaustiveness (it can be false). See ADR 0013.

import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { format } from "../src/format";

// Same harness as nested-patterns.spec.ts: strip the import, inject `match`.
const run = (src: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function("match", `${js}\nreturn r;`)(match);
};

const errMsg = (src: string): string => unwrapErr(compile(src)).message;

// --- evaluation -------------------------------------------------------------

test("guard on a bind pattern selects by predicate, falls through when false", () => {
  const src = `let f = n => switch n {
    | x when gt(x)(2) => "big"
    | _ => "small"
  }
  let r = [f(5), f(1)]`;
  expect(run(src)).toEqual(["big", "small"]);
});

test("guard sees ctor-pattern binds; unguarded arm still covers", () => {
  const src = `let f = o => switch o {
    | Some(x) when gt(x)(0) => x
    | Some(x) => negate(x)
    | None => 0
  }
  let r = [f(Some(3)), f(Some(-4)), f(None)]`;
  expect(run(src)).toEqual([3, 4, 0]);
});

test("guards chain in source order (first true guard wins)", () => {
  const src = `let f = n => switch n {
    | x when gt(x)(10) => "huge"
    | x when gt(x)(2) => "big"
    | _ => "small"
  }
  let r = [f(50), f(5), f(1)]`;
  expect(run(src)).toEqual(["huge", "big", "small"]);
});

test("guard composes with a nested pattern (structural tests run first)", () => {
  const src = `type Opt = | Sm(Opt) | Leaf(number) | Nn
  let f = x => switch x {
    | Sm(Leaf(n)) when gt(n)(1) => n
    | Sm(_) => -1
    | Leaf(_) => -2
    | Nn => 0
  }
  let r = [f(Sm(Leaf(9))), f(Sm(Leaf(1))), f(Sm(Nn))]`;
  expect(run(src)).toEqual([9, -1, -1]);
});

test("guard on a tuple pattern", () => {
  const src = `let bigger = p => switch p {
    | (a, b) when gt(a)(b) => a
    | (_, b) => b
  }
  let r = [bigger((5, 2)), bigger((1, 7))]`;
  expect(run(src)).toEqual([5, 7]);
});

test("guard on an eager array pattern", () => {
  const src = `let f = xs => switch xs {
    | [x, ...rest] when eq(x)(0) => length(rest)
    | [x, ...rest] => x
    | [] => -1
  }
  let r = [f([0, 9, 9]), f([5, 9]), f([])]`;
  expect(run(src)).toEqual([2, 5, -1]);
});

test("guard's `==` comparison doesn't swallow the arm's `=>` as a lambda", () => {
  // `x when x == limit => body`: the right operand of `==` is the bare
  // identifier `limit`, immediately followed by `=>` — the guard parser must
  // not mistake that for a fresh lambda `limit => body`.
  const src = `let limit = 10
  let f = n => switch n {
    | x when x == limit => "hit"
    | x => "miss"
  }
  let r = [f(10), f(5)]`;
  expect(run(src)).toEqual(["hit", "miss"]);
});

test("guard can use outer-scope names alongside pattern binds", () => {
  const src = `let limit = 10
  let f = n => switch n {
    | x when gt(x)(limit) => limit
    | x => x
  }
  let r = [f(99), f(3)]`;
  expect(run(src)).toEqual([10, 3]);
});

test("`when` still works as an ordinary identifier and pattern bind", () => {
  const src = `let when = 5
  let f = n => switch n {
    | when => when
  }
  let r = f(when)`;
  expect(run(src)).toBe(5);
});

// --- exhaustiveness: a guarded arm never counts -----------------------------

test("a lone guarded catch-all is not exhaustive", () => {
  const src = `let f = n => switch n {
    | x when gt(x)(0) => x
  }`;
  expect(isErr(compile(src))).toBe(true);
  expect(errMsg(src)).toContain("non-exhaustive");
});

test("a guarded ctor arm does not cover its constructor", () => {
  const src = `let f = o => switch o {
    | Some(x) when gt(x)(0) => x
    | None => 0
  }`;
  expect(isErr(compile(src))).toBe(true);
  expect(errMsg(src)).toContain("missing Some");
});

test("guarded bool arms do not close a bool switch", () => {
  const src = `let f = b => switch b {
    | true when false => 1
    | true => 2
    | false => 3
  }
  let r = [f(true), f(false)]`;
  expect(run(src)).toEqual([2, 3]);
  const bad = `let g = b => switch b {
    | true when false => 1
    | false => 3
  }`;
  expect(errMsg(bad)).toContain("non-exhaustive");
});

// --- rejections -------------------------------------------------------------

test("guard must be bool", () => {
  const src = `let f = n => switch n {
    | x when add(x)(1) => x
    | _ => 0
  }`;
  expect(isErr(compile(src))).toBe(true);
});

test("guards are rejected in a lazy-List switch", () => {
  const src = `let f = xs => switch xs {
    | @{x, ...rest} when gt(x)(0) => x
    | @{} => 0
    | _ => -1
  }`;
  expect(errMsg(src)).toContain("lazy-List switch");
});

test("an arm below an unguarded catch-all is unreachable", () => {
  const src = `let f = n => switch n {
    | _ => 0
    | x when gt(x)(2) => x
  }`;
  expect(errMsg(src)).toContain("unreachable arm");
});

// --- formatter --------------------------------------------------------------

test("guards format idempotently and keep the `when` clause", () => {
  const src = `let f = n => switch n {
  | x when gt(x)(2) => x
  | _ => 0
}
`;
  const once = unwrapOk(format(src));
  expect(unwrapOk(format(once))).toBe(once);
  expect(once).toContain("| x when gt(x)(2) => x");
});
