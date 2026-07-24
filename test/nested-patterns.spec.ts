// Nested patterns: `Sm(Sm(n))`, `Ok((a, b))`, ctors inside tuples/arrays.
// Guard against the v2 hole where codegen silently dropped nested sub-patterns
// (free variables in the emitted body) and check counted a narrowing arm
// (`Sm(Sm(n))`, `Sm(0)`) as covering its whole constructor. See ADR 0012.

import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { format } from "../src/format";

// Compiled output is standalone except the @onrails/pattern import — strip it
// and inject `match` (same harness as examples.spec.ts). `r` is the result.
const run = (src: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function("match", `${js}\nreturn r;`)(match);
};

const errMsg = (src: string): string => unwrapErr(compile(src))[0]!.message;

const OPT = "type Opt = | Sm(Opt) | Leaf(number) | Nn\n";

test("depth-2 nested ctor pattern binds through both layers", () => {
  const src = `${OPT}let f = x => switch x {
    | Sm(Sm(inner)) => 2
    | Sm(_) => 1
    | Leaf(n) => n
    | Nn => 0
  }
  let r = f(Sm(Sm(Nn)))`;
  expect(run(src)).toBe(2);
});

test("nested bind carries the VALUE, not just the tag", () => {
  const src = `${OPT}let unwrap = x => switch x {
    | Sm(Leaf(n)) => n
    | _ => 0
  }
  let r = unwrap(Sm(Leaf(42)))`;
  expect(run(src)).toBe(42);
});

test("depth-3 nesting matches and mismatches correctly", () => {
  const src = `${OPT}let f = x => switch x {
    | Sm(Sm(Leaf(n))) => n
    | _ => 0
  }
  let r = [f(Sm(Sm(Leaf(7)))), f(Sm(Leaf(7))), f(Nn)]`;
  expect(run(src)).toEqual([7, 0, 0]);
});

test("literal inside a nested ctor narrows", () => {
  const src = `${OPT}let f = x => switch x {
    | Sm(Leaf(0)) => 100
    | Sm(Leaf(n)) => n
    | _ => 0
  }
  let r = [f(Sm(Leaf(0))), f(Sm(Leaf(5)))]`;
  expect(run(src)).toEqual([100, 5]);
});

test("tuple inside a ctor destructures", () => {
  const src = `type Box a = | B(a) | Empty
  let f = x => switch x {
    | B((a, b)) => add(a, b)
    | Empty => 0
  }
  let r = f(B((3, 4)))`;
  expect(run(src)).toBe(7);
});

test("ctor inside a tuple arm guards and binds", () => {
  const src = `${OPT}let f = t => switch t {
    | (Leaf(n), y) => add(n, y)
    | (_, y) => y
  }
  let r = [f((Leaf(10), 1)), f((Nn, 5))]`;
  expect(run(src)).toEqual([11, 5]);
});

test("record inside a ctor: literal field narrows, bind field extracts", () => {
  const src = `type Box a = | B(a) | Empty
  let f = x => switch x {
    | B({ kind: 0, v }) => v
    | B({ kind, v }) => kind
    | Empty => 0
  }
  let r = [f(B({ kind: 0, v: 9 })), f(B({ kind: 3, v: 9 }))]`;
  expect(run(src)).toEqual([9, 3]);
});

test("ctor inside an array pattern", () => {
  const src = `${OPT}let f = xs => switch xs {
    | [Leaf(n), ...rest] => n
    | _ => 0
  }
  let r = [f([Leaf(8), Nn]), f([Nn])]`;
  expect(run(src)).toEqual([8, 0]);
});

test("ctor inside a lazy-List arm pulls only the prefix", () => {
  const src = `${OPT}let f = xs => switch xs {
    | @{Leaf(n), ...rest} => n
    | _ => 0
  }
  let r = [f(@{Leaf(6), Nn}), f(@{Nn})]`;
  expect(run(src)).toEqual([6, 0]);
});

// --- flat fixes that rode along ---

test("string literal in ctor arg narrows (was silently dropped)", () => {
  const src = `type Ev = | E(string)
  let f = e => switch e {
    | E("click") => 1
    | E(_) => 0
  }
  let r = [f(E("click")), f(E("scroll"))]`;
  expect(run(src)).toEqual([1, 0]);
});

test("bool literal in ctor arg narrows (was silently dropped)", () => {
  const src = `type Flag = | F(bool)
  let f = x => switch x {
    | F(true) => 1
    | F(_) => 0
  }
  let r = [f(F(true)), f(F(false))]`;
  expect(run(src)).toEqual([1, 0]);
});

test("nested-record catch-all destructures through both layers", () => {
  // `{ a: { b } }` is irrefutable → `.otherwise` — binds b, not a free var.
  const src = `let f = rec => switch rec {
    | { a: { b } } => b
  }
  let r = f({ a: { b: 5 } })`;
  expect(run(src)).toBe(5);
});

// --- exhaustiveness: narrowing arms must not count as coverage ---

test("nested-ctor arm does not cover its constructor", () => {
  const src = `${OPT}let f = x => switch x {
    | Sm(Sm(n)) => 1
    | Leaf(n) => n
    | Nn => 0
  }`;
  expect(isErr(compile(src))).toBe(true);
  expect(errMsg(src)).toContain("missing Sm");
  expect(errMsg(src)).toContain("Sm(_)"); // the hint
});

test("literal-arg arm does not cover its constructor", () => {
  const src = `${OPT}let f = x => switch x {
    | Leaf(0) => 1
    | Sm(_) => 2
    | Nn => 0
  }`;
  expect(isErr(compile(src))).toBe(true);
  expect(errMsg(src)).toContain("missing Leaf");
});

test("narrowing arm plus covering arm is exhaustive", () => {
  const src = `${OPT}let f = x => switch x {
    | Sm(Sm(n)) => 2
    | Sm(_) => 1
    | Leaf(n) => n
    | Nn => 0
  }
  let r = f(Sm(Nn))`;
  expect(run(src)).toBe(1);
});

// --- nested validation + plist rejection ---

test("unknown nested constructor is a check error at the nested site", () => {
  const src = `${OPT}let f = x => switch x {
    | Sm(Ghost(n)) => n
    | _ => 0
  }`;
  expect(errMsg(src)).toContain("unknown constructor 'Ghost'");
});

test("nested ctor arity is validated", () => {
  const src = `${OPT}let f = x => switch x {
    | Sm(Nn(1)) => 1
    | _ => 0
  }`;
  expect(errMsg(src)).toContain("'Nn' expects 0 arg(s), got 1");
});

test("lazy-List pattern cannot nest inside another pattern", () => {
  const src = `type Box a = | B(a) | Empty
  let f = x => switch x {
    | B(@{}) => 0
    | _ => 1
  }`;
  expect(errMsg(src)).toContain("lazy-List pattern cannot nest");
});

// --- formatter already recurses; guard it stays that way ---

test("nested patterns format idempotently", () => {
  const src = `${OPT}let f = x => switch x {
  | Sm(Sm(Leaf(n))) => n
  | Sm((_)) => 1
  | _ => 0
}
`;
  const once = unwrapOk(format(src));
  expect(unwrapOk(format(once))).toBe(once);
  expect(once).toContain("Sm(Sm(Leaf(n)))");
});

// --- record literals as arm bodies -------------------------------------------
// Every arm-handler emit site must parenthesize a record-literal body, else JS
// parses `() => { k: v }` as a statement block. Found by the bootstrap lexer
// (its `mkTok` returns records from switch arms); covers the flat matcher arm,
// the guard form, literal arms, and `.otherwise`.

test("record-literal bodies survive every arm form", () => {
  const src = `let f = o => switch o {
    | Some(0) => { kind: "zero", n: 0 }
    | Some(x) when gt(x, 9) => { kind: "big", n: x }
    | Some(x) => { kind: "some", n: x }
    | None => { kind: "none", n: -1 }
  }
  let r = [f(Some(0)), f(Some(10)), f(Some(5)), f(None)]`;
  expect(run(src)).toEqual([
    { kind: "zero", n: 0 },
    { kind: "big", n: 10 },
    { kind: "some", n: 5 },
    { kind: "none", n: -1 },
  ]);
});
