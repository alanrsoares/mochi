// The checked-in example files must always compile, and the pipelines example
// must produce its documented results — a guard against language regressions.

import { expect, test } from "bun:test";
import { compile, compileTargets, emitDts } from "@mochi/compiler";
import type { CompilerModuleOutput } from "@mochi/compiler/graph";
import { buildModulesWith, defaultOptions } from "@mochi/compiler/module";
import { styledCvaPlugin } from "@mochi/plugin-styled-cva";
import { compileAndEval, compileJs, readRepo, repoPath, typesOf } from "@mochi/test-support";
import { match } from "@onrails/pattern";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";

const read = (p: string): string => readRepo(import.meta.url, p);
const path = (p: string): string => repoPath(import.meta.url, p);

test("builtin Result and Option matches use flat dispatch with one scrutinee evaluation", () => {
  const source = `
let result = (read: () -> Result<number, string>, log: number -> unit) => switch read() {
  | Ok(n) => let printed = log(n) in n + 1
  | Err(e) => Str.length(e)
}
let option = (read: () -> Option<number>, log: number -> unit) => let fallback = 0 in switch read() {
  | Some(n) => let printed = log(n) in n + 1
  | None => fallback
}
`;
  const emitted = unwrapOk(compileTargets(source, { runtime: false }));
  expect(emitted.js).toContain("_Result_match(");
  expect(emitted.js).toContain("_Option_match(");
  expect(emitted.ts).toContain("_Result_match(");
  expect(emitted.ts).toContain("_Option_match(");
  expect(emitted.js).not.toContain('._tag === "Ok"');
  expect(emitted.js).not.toContain('._tag === "Some"');
  expect(emitted.js).not.toContain("switch (");
  expect(emitted.ts).not.toContain("switch (");
  const result = compileAndEval(source, "result") as (
    read: () => unknown,
    log: (n: number) => void,
  ) => number;
  const option = compileAndEval(source, "option") as (
    read: () => unknown,
    log: (n: number) => void,
  ) => number;
  const visits: number[] = [];
  let reads = 0;
  expect(
    result(
      () => {
        reads += 1;
        return { _tag: "Ok", value: 2 };
      },
      (n) => visits.push(n),
    ),
  ).toBe(3);
  expect(
    result(
      () => {
        reads += 1;
        return { _tag: "Err", error: "oops" };
      },
      (n) => visits.push(n),
    ),
  ).toBe(4);
  expect(
    option(
      () => {
        reads += 1;
        return { _tag: "Some", value: 5 };
      },
      (n) => visits.push(n),
    ),
  ).toBe(6);
  expect(
    option(
      () => {
        reads += 1;
        return { _tag: "None" };
      },
      (n) => visits.push(n),
    ),
  ).toBe(0);
  expect(reads).toBe(4);
  expect(visits).toEqual([2, 5]);
});

test("function-tail constructor matches use scoped switch cases and direct returns", () => {
  const source = `
type Shape = | Dot | Box(value: number) | Pair(number, number)
let $match = 10
let run = (read: () -> Shape, log: number -> unit) => let offset = $match in switch read() {
  | Dot => offset
  | Box(offset) => let captured = () => offset in let printed = log(captured()) in switch Some(offset) {
    | Some(n) => let n = n + 1 in n
    | None => 0
  }
  | Pair(a, b) => a + b
}
let catchAll = x => switch x { | Dot => 0 | rest => switch rest { | Box(n) => n | _ => 9 } }
let looping = x => switch x { | Box(n) => loop (i = 0, total = n) { i >= 3 ? total : recur(i + 1, total + i) } | _ => 0 }
let shadowLoop = x => switch x { | Box(n) => loop (n = 0) { n >= 3 ? n : recur(n + 1) } | _ => 0 }
`;
  const emitted = unwrapOk(compileTargets(source, { runtime: false }));
  for (const output of [emitted.js, emitted.ts]) {
    expect(output).toContain("switch ($match$._tag)");
    expect(output).toContain('case "Box":');
    expect(output).toContain('case "Pair":');
    expect(output).toContain("default:");
    expect(output).not.toContain('._tag === "Box"');
    expect(output).toContain("_Option_match(");
  }
  const run = compileAndEval(source, "run") as (
    read: () => unknown,
    log: (n: number) => void,
  ) => number;
  const visits: number[] = [];
  let reads = 0;
  for (const [value, expected] of [
    [{ _tag: "Dot" }, 10],
    [{ _tag: "Box", value: 3 }, 4],
    [{ _tag: "Pair", _0: 2, _1: 5 }, 7],
  ] as const) {
    expect(
      run(
        () => {
          reads += 1;
          return value;
        },
        (n) => visits.push(n),
      ),
    ).toBe(expected);
  }
  expect(reads).toBe(3);
  expect(visits).toEqual([3]);
  expect(() =>
    run(
      () => ({ _tag: "Invalid" }),
      () => {},
    ),
  ).toThrow("non-exhaustive match");
  const catchAll = compileAndEval(source, "catchAll") as (value: unknown) => number;
  expect(catchAll({ _tag: "Box", value: 8 })).toBe(8);
  expect(catchAll({ _tag: "Pair", _0: 1, _1: 2 })).toBe(9);
  const looping = compileAndEval(source, "looping") as (value: unknown) => number;
  const shadowLoop = compileAndEval(source, "shadowLoop") as (value: unknown) => number;
  expect(looping({ _tag: "Box", value: 5 })).toBe(8);
  expect(shadowLoop({ _tag: "Box", value: 5 })).toBe(3);
});

test("builtin match dispatch preserves guarded, nested and user-constructor fallbacks", () => {
  for (const source of [
    "type Result a e = | Ok(value: a) | Err(error: e)\nlet f = x => let matched = switch x { | Ok(n) => n | Err(_) => 0 } in matched",
    "type Option a = | Some(value: a) | None\nlet f = x => let matched = switch x { | Some(n) => n | None => 0 } in matched",
    "let f = x => let matched = switch x { | Some(n) when n > 0 => n | Some(_) => 0 | None => 0 } in matched",
    "let f = x => let matched = switch x { | Ok(Some(n)) => n | Ok(None) => 0 | Err(_) => 0 } in matched",
  ]) {
    const output = unwrapOk(compileTargets(source, { runtime: false }));
    expect(output.js).not.toContain("_Result_match(");
    expect(output.js).not.toContain("_Option_match(");
  }
});

test("builtin match helpers cannot capture user bindings with their names", () => {
  const option =
    "let _Option_match = x => 99\nlet f = x => let matched = switch x { | Some(n) => n | None => 0 } in matched";
  const result =
    "let f = (_Result_match, x) => let matched = switch x { | Ok(n) => n | Err(_) => 0 } in matched";
  const runOption = compileAndEval(option, "f") as (value: unknown) => number;
  const runResult = compileAndEval(result, "f") as (unused: unknown, value: unknown) => number;
  expect(runOption({ _tag: "Some", value: 7 })).toBe(7);
  expect(runResult(() => 99, { _tag: "Ok", value: 8 })).toBe(8);
  expect(unwrapOk(compileTargets(result, { runtime: false })).js).not.toContain("_Result_match(");
});

test("compiled sorting compares record and variant payloads structurally", () => {
  const source = `
type Entry = | Box(number) | Named(value: number)
let rows = Array.sort([{value: 10}, {value: 2}, {value: -2}])
let entries = Array.sort([Named(1), Box(10), Box(2)])
let nested = compare({item: {value: 10}}, {item: {value: 2}})
let same = compare({a: 1, b: 2}, {b: 2, a: 1})
let result = (rows, entries, nested, same)
`;
  expect(compileAndEval(source, "result")).toEqual([
    [{ value: -2 }, { value: 2 }, { value: 10 }],
    [
      { _tag: "Box", _0: 2 },
      { _tag: "Box", _0: 10 },
      { _tag: "Named", value: 1 },
    ],
    1,
    0,
  ]);
  const order = compileAndEval(
    "type Row = { value?: number }\nlet order = (a: Row, b: Row) => compare(a, b)",
    "order",
  ) as (a: Record<string, unknown>, b: Record<string, unknown>) => number;
  expect(order({}, { value: undefined })).toBe(-1);
  expect(order({ value: undefined }, { value: 2 })).toBe(-1);
});

test("hosts preserve JSX declaration results without changing JS or typed TS", () => {
  const source = `
type Props = { label: string, disabled: bool }
let Button : Props -> VNode = props =>
  <button disabled={props.disabled}>{props.label}</button>
let app = <Button label="Save changes" disabled={false} />
`;
  const plain = unwrapOk(compileTargets(source));
  const mapped = unwrapOk(
    compileTargets(source, {
      dtsTypeNames: { VNode: 'import("preact").VNode' },
    }),
  );
  expect(mapped.dts).toContain('(props: Props) => import("preact").VNode');
  expect(mapped.dts).toContain('const app: import("preact").VNode;');
  expect(mapped.dts).not.toContain("any");
  expect(mapped.js).toBe(plain.js);
  expect(mapped.ts).toBe(plain.ts);
  expect(plain.dts).toContain("const app: any;");
});

type DedupeRow = { id: number };

test("dedupeBy keeps first projected representatives and evaluates projections in order", () => {
  const visits: number[] = [];
  const run = compileAndEval(
    'let run = project => Array.dedupeBy(project, [{id: 2, name: "first"}, {id: 1, name: "second"}, {id: 2, name: "last"}])',
    "run",
  ) as (project: (row: DedupeRow) => number) => unknown;
  expect(
    run((row) => {
      visits.push(row.id);
      return row.id;
    }),
  ).toEqual([
    { id: 2, name: "first" },
    { id: 1, name: "second" },
  ]);
  expect(visits).toEqual([2, 1, 2]);
  expect(
    compileAndEval("let result = Array.dedupeBy(x => {key: x % 2}, [1, 2, 3, 4])", "result"),
  ).toEqual([1, 2]);
});

test("compiled equality distinguishes missing optional keys from present undefined", () => {
  const same = compileAndEval(
    "type Fields = { a?: number, b?: number }\nlet same = (left: Fields, right: Fields) => left == right",
    "same",
  ) as (left: Record<string, unknown>, right: Record<string, unknown>) => boolean;
  expect(same({ a: undefined }, { b: undefined })).toBe(false);
  expect(same({ a: undefined }, {})).toBe(false);
  expect(same({ a: undefined }, { a: undefined })).toBe(true);
  expect(same({ a: 1 }, Object.assign(Object.create({ a: 1 }), { b: 2 }))).toBe(false);
});

test("invalid fast pipes explain how to use sections and bare functions", () => {
  for (const source of ["let x = 5 -> (+ 3)", "let x = 5 -> inc"]) {
    expect(unwrapErr(compile(source))[0]?.message).toContain("use `|>`");
  }
  expect(compileAndEval("let inc = n => n + 1\nlet x = 5 |> inc |> (+ 3)", "x")).toBe(9);
});

test("tail switch evaluates its scrutinee and recur arguments once in order", () => {
  const source = `let run = (choose: number -> bool, mark: number -> number) =>
    loop (i = 0, total = 0) { switch choose(i) {
      | true => total
      | false => recur(mark(i + 1), mark(total + i))
    } }`;
  const run = compileAndEval(source, "run") as (
    choose: (i: number) => boolean,
    mark: (n: number) => number,
  ) => number;
  const events: string[] = [];
  expect(
    run(
      (i) => {
        events.push(`choose:${i}`);
        return i === 2;
      },
      (n) => {
        events.push(`mark:${n}`);
        return n;
      },
    ),
  ).toBe(1);
  expect(events).toEqual([
    "choose:0",
    "mark:1",
    "mark:0",
    "choose:1",
    "mark:2",
    "mark:1",
    "choose:2",
  ]);
  expect(compileJs(source)).not.toContain("_step");
});

test("tail switch scalar assignments preserve rotation, captures and synthetic names", () => {
  const source = `let $loopMatch = 10
let $loopMatch$ = 20
let run = n => loop (i = 0, a = 1, b = 2, c = 3, read = () => 0) {
  switch i >= n { | true => (a, b, c, read(), $loopMatch + $loopMatch$)
    | false => recur(i + 1, b, c, a, () => i) }
}`;
  const run = compileAndEval(source, "run") as (n: number) => number[];
  expect(run(2)).toEqual([3, 1, 2, 2, 30]);
  expect(compileJs(source)).toContain("const $loopMatch$$ =");
});

test.each([
  { label: "guard", body: "switch i { | x when x >= 3 => i | _ => recur(i + 1) }" },
  {
    label: "shadow",
    body: "switch Some(i) { | Some(i) => i >= 3 ? i : recur(i + 1) | None => i }",
  },
  {
    label: "nested pattern",
    body: "switch Some(Some(i)) { | Some(Some(x)) => x >= 3 ? x : recur(x + 1) | _ => i }",
  },
  { label: "array", body: "switch [i] { | [x] => x >= 3 ? x : recur(x + 1) | _ => i }" },
])("tail switch retains the step fallback for $label", ({ body }) => {
  const source = `let out = loop (i = 0) { ${body} }`;
  expect(compileAndEval(source, "out")).toBe(3);
  expect(compileJs(source)).toContain("const _step");
});

test("nested tail switches can combine statement and step lowering", () => {
  const source = `let run = n => loop (i = 0, total = 0) { switch i >= n {
    | true => total
    | false => let next = i + 1 in switch Some(i) {
      | Some(x) when x == 1 => recur(next, total + 10)
      | _ => recur(next, total + i)
    }
  } }`;
  expect(compileAndEval(`${source}\nlet out = run(3)`, "out")).toBe(12);
  const js = compileJs(source);
  expect(js).toContain("const $loopMatch");
  expect(js).toContain("const _step");
});

test.each([
  { label: "Some first", arms: "| Some(v) => v | None => 99", expected: [0, 7, 99, 99] },
  { label: "None first", arms: "| None => 99 | Some(v) => v", expected: [0, 7, 99, 99] },
  {
    label: "payload uses synthetic base",
    arms: "| Some($optional) => $optional | None => 99",
    expected: [0, 7, 99, 99],
  },
  { label: "discard payload", arms: "| Some(_) => 1 | None => 99", expected: [1, 1, 99, 99] },
])("optional field match fusion: $label", ({ arms, expected }) => {
  const src = `type Row = { value?: number }
let read = (row: Row) => switch row.value { ${arms} }`;
  const fn = compileAndEval(src, "read") as (row: Record<string, unknown>) => number;
  expect([0, 7, undefined, null].map((value) => fn({ value }))).toEqual([...expected]);
  expect(compileJs(src, { open: false })).not.toContain('_tag: "Some"');
});

test("optional match fusion evaluates targets and getters once, before only the selected body", () => {
  const src = `type Row = { value?: number }
let read = (get: () -> Row, mark: number -> number) => switch get().value {
  | Some(v) => mark(v)
  | None => mark(99)
}`;
  const fn = compileAndEval(src, "read") as (
    get: () => Record<string, unknown>,
    mark: (value: number) => number,
  ) => number;
  const events: string[] = [];
  expect(
    fn(
      () => {
        events.push("target");
        return {
          get value() {
            events.push("field");
            return 7;
          },
        };
      },
      (value) => {
        events.push(`body:${value}`);
        return value;
      },
    ),
  ).toBe(7);
  expect(events).toEqual(["target", "field", "body:7"]);
  events.length = 0;
  expect(
    fn(
      () => {
        events.push("target");
        return {
          get value() {
            events.push("field");
            return undefined;
          },
        };
      },
      (value) => {
        events.push(`body:${value}`);
        return value;
      },
    ),
  ).toBe(99);
  expect(events).toEqual(["target", "field", "body:99"]);
  expect(compileJs(src, { open: false })).not.toContain('_tag: "Some"');
});

test("optional match fusion preserves nested bindings, record results and synthetic-name references", () => {
  const src = `type Row = { value?: number }
let $optional = 5
let $optional$ = 2
let read = (row: Row) => switch row.value {
  | Some(v) => let old = v in { value: old + $optional + $optional$, next: () => v }
  | None => { value: $optional, next: () => $optional$ }
}
let present = read({ value: 7 })
let absent = read({})`;
  expect(
    compileAndEval(src, "[present.value, present.next(), absent.value, absent.next()]"),
  ).toEqual([14, 7, 5, 2]);
  expect(compileJs(src, { open: false })).not.toContain('_tag: "Some"');
});

test("optional match fusion composes with loop tail-switch lowering", () => {
  const src = `type Row = { value?: number }
let run = (row: Row) => loop (i = 0) {
  switch row.value {
    | Some(n) => i >= n ? i : recur(i + 1)
    | None => i
  }
}`;
  const fn = compileAndEval(src, "run") as (row: Record<string, unknown>) => number;
  expect([fn({ value: 7 }), fn({})]).toEqual([7, 0]);
  expect(compileJs(src, { open: false })).not.toContain('_tag: "Some"');
});

test.each([
  {
    label: "guard",
    arms: "| Some(v) when v > 3 => v | Some(_) => 1 | None => 0",
    expected: [1, 7, 0],
  },
  {
    label: "catch-all binding exposes Option",
    arms: "| Some(v) when v > 3 => Some(v) | rest => rest",
    expected: [{ _tag: "Some", value: 0 }, { _tag: "Some", value: 7 }, { _tag: "None" }],
  },
  {
    label: "nested payload pattern",
    arms: "| Some(0) => 10 | Some(v) => v | None => 0",
    expected: [10, 7, 0],
  },
])("optional field match fallback: $label", ({ arms, expected }) => {
  const src = `type Row = { value?: number }
let read = (row: Row) => switch row.value { ${arms} }`;
  const fn = compileAndEval(src, "read") as (row: Record<string, unknown>) => unknown;
  expect([0, 7, undefined].map((value) => fn({ value }))).toEqual([...expected]);
  expect(compileJs(src, { open: false })).toContain('_tag: "Some"');
});

test("direct loop/recur rotates state simultaneously across nested loop scopes", () => {
  const src = `let out = loop (i = 0, a = 1, b = 2, c = 3) {
    i >= 4 ? (a, b, c) : recur(
      loop (j = i, k = 0) { k >= 1 ? j : recur(j + 1, k + 1) },
      b, c, a
    )
  }`;
  expect(compileAndEval(src, "out")).toEqual([2, 3, 1]);
});

test("tuple wildcards discard positions in lambdas and let bindings", () => {
  for (const names of ["a, _, _", "_, a, _", "_, _, a", "_, _, _"]) {
    const value = names.includes("a") ? "a" : "42";
    const src = `let pick = ((${names})) => ${value}
let viaLambda = pick((10, 20, 30))
let viaLet = let (${names}) = (10, 20, 30) in ${value}`;
    const expected = names.includes("a") ? [10, 20, 30][names.split(", ").indexOf("a")] : 42;
    expect(compileAndEval(src, "[viaLambda, viaLet]")).toEqual([expected, expected]);
  }
});

test("saturated calls take the raw twin and evaluate like the curried path", () => {
  const src = `let fact = (n, acc) => n == 0 ? acc : fact(n - 1, acc * n)
let sub3 = (a, b, c) => a - b - c
let shadowed = (sub3, x) => sub3(x, x)
let result = [fact(5, 1), fact(5)(1), sub3(10, 3, 2), sub3(10)(3, 2), 1->sub3(1, 1), shadowed((p, q) => p + q, 4)]`;
  const js = compileJs(src);
  expect(js).toContain("const fact$ = (n, acc) =>");
  expect(js).toContain("const fact = _curry(2, fact$);");
  expect(js).toContain("fact$(sub(n, 1), mul(acc, n))");
  expect(js).toContain("fact$(5, 1)");
  expect(js).toContain("fact(5)(1)");
  expect(js).not.toContain("sub3$");
  expect(compileAndEval(src, "result")).toEqual([120, 120, 5, 5, -1, 8]);
});

test("single-key styled-cva variants remain precise through component bindings", () => {
  const component = `extern tw : a = "@styled-cva/react" "default"
let Badge = tw.span("base", { variants: { $tone: { rose: "a" } } })
let Copy = Badge`;
  for (const name of ["Badge", "Copy"]) {
    const valid = `${component}\nexport let good = <${name} $tone="rose" />`;
    const invalid = `${component}\nexport let bad = <${name} $tone="blue" />`;
    const opts = { plugins: [styledCvaPlugin] };
    expect(isErr(compile(invalid, opts))).toBe(true);
    const targets = unwrapOk(compileTargets(valid, opts));
    expect(targets.dts).toContain('$tone?: "rose"');
  }
});

test("typed targets suppress docs on every declaration kind", () => {
  const src = [
    "/// A point.\ntype Point = { x: number }",
    "/// A choice.\ntype Choice = Left(number) | Right",
    '/// A synonym.\ntype Tone = "rose" | "amber"',
    "/// A handle.\nextern type Handle",
    "/// An answer.\nlet answer = 42",
  ].join("\n");
  const targets = unwrapOk(compileTargets(src, { docs: false }));
  expect(targets.ts).not.toContain("/**");
  expect(targets.dts).not.toContain("/**");
});

/** A recorded type's tag in the self-hosted `Type` union (`TyFn`, `TyCon`, …). */
type Tagged = { _tag?: string };

/** Build the graph at repo path `entry` through the self-hosted core; throws on a diagnostic. */
const build = (entry: string): CompilerModuleOutput[] => {
  const r = buildModulesWith(path(entry), defaultOptions);
  if (r._tag === "Err") throw new Error(`${entry}: ${r.error.map((d) => d.message).join("; ")}`);
  return r.value;
};

test("example.mochi compiles", () => {
  expect(isErr(compile(read("examples/example.mochi")))).toBe(false);
});

test("example.mochi runs to its documented Option values", () => {
  expect(compileAndEval(read("examples/example.mochi"), "[lookedUp, firstName]")).toEqual([
    { _tag: "Some", value: 30 },
    { _tag: "Some", value: "alice" },
  ]);
});

test("an unused local Some ctor does not suppress the runtime one Map.get needs", () => {
  const src = `type Option<a> =
  | Some(value: a)
  | None
let hit = Map.get("a", #{"a": 1})
let miss = Map.get("b", #{"a": 1})`;
  expect(compileAndEval(src, "[hit, miss]")).toEqual([
    { _tag: "Some", value: 1 },
    { _tag: "None" },
  ]);
});

test("Dict<a> is an immutable string-keyed dictionary (ADR 0150)", () => {
  const src = `let empty : Dict<number> = Dict.empty
let d = empty |> Dict.set("a", 1) |> Dict.set("__proto__", 2)
let gone = Dict.remove("a", d)
let es = Dict.entries(d)
let total = Dict.values(Dict.map(n => n * 10, d)) |> reduce((acc, n) => acc + n, 0)
let out = (
  Dict.get("a", d),
  Dict.get("missing", d),
  Dict.getOr(0, "zzz", d),
  Dict.has("a", gone),
  Dict.size(empty),
  Dict.size(d),
  Dict.fromEntries(es) == d,
  total
)`;
  expect(compileAndEval(src, "out")).toEqual([
    { _tag: "Some", value: 1 },
    { _tag: "None" },
    0,
    false,
    0,
    2,
    true,
    30,
  ]);
});

test("examples/life/main.mochi builds with the Bun terminal bindings", () => {
  expect(build("examples/life/main.mochi").length).toBeGreaterThan(0);
});

test("Bun terminal binding settles Err on a forced write failure", async () => {
  const host = await import("@mochi/bun/runtime");
  const writes: string[] = [];
  const orig = process.stdout.write;
  process.stdout.write = ((chunk: string | Uint8Array) => {
    writes.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString());
    return true;
  }) as typeof process.stdout.write;
  try {
    host.__forceFailNextWrite();
    expect(await host.draw("label", "frame")()).toEqual({
      _tag: "Err",
      error: "forced write failure",
    });
    expect(writes).toEqual([]);
    // Cleared after one shot — next draw is Ok again.
    expect(await host.draw("label", "frame")()).toEqual({ _tag: "Ok", value: undefined });
    expect(writes.some((w) => w.includes("label"))).toBe(true);
  } finally {
    process.stdout.write = orig;
  }
});

test("examples/pipelines.mochi compiles and produces its documented values", () => {
  // Output is standalone (prelude inlined) — only the @onrails/pattern import is
  // stripped, and `match` injected in its place.
  const js = unwrapOk(compile(read("examples/pipelines.mochi"))).replace(/^import .*$/m, "");
  const out = new Function("match", `${js}\nreturn { composed, piped, happy, sad };`)(
    match,
  ) as Record<string, number>;
  expect(out).toEqual({ composed: 22, piped: 81, happy: 20, sad: -1 });
});

test("examples/interop exercises typed JS extern conventions at runtime", () => {
  const js = unwrapOk(compile(read("examples/interop/main.mochi"))).replace(
    'import { Vector3 as $vector3 } from "three";',
    "const $vector3 = class { constructor(x, y, z) { this.x = x; this.y = y; this.z = z; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } };",
  );
  const out = new Function(`${js}\nreturn { displayName, renamed, sampled, epoch, pointX };`)() as {
    displayName: string;
    renamed: string;
    sampled: number;
    epoch: Date;
    pointX: number;
  };
  expect(out.displayName).toBe("Mochi");
  expect(out.renamed).toBe("Mochi");
  expect(out.sampled).toBeGreaterThanOrEqual(0);
  expect(out.sampled).toBeLessThan(1);
  expect(out.epoch.getTime()).toBe(0);
  expect(out.pointX).toBe(4);
});

/**
 * Compile examples/async and hand its exports back. Prelude `Task.*` is inlined,
 * but the two domain effects are `extern`s — stripping the imports leaves them
 * free, so the real host module is injected in their place.
 */
const runAsyncExample = async (): Promise<Record<string, Promise<unknown>>> => {
  const js = unwrapOk(compile(read("examples/async/main.mochi")))
    .replace(/^import .*$/gm, "")
    .replace(/^export /gm, "");
  const host = await import(path("examples/async/runtime.mjs"));
  return new Function(
    "match",
    "fetchUser",
    "fetchPlan",
    `${js}\nreturn { result, found, recovered, offline, everyone, partial, fastest };`,
  )(match, host.fetchUser, host.fetchPlan) as Record<string, Promise<unknown>>;
};

test("examples/async composes a typed Task pipeline that runs to its value", async () => {
  // Pipeline: of(20) -> +1 -> delay -> *2.
  expect(await (await runAsyncExample()).result).toEqual({ _tag: "Ok", value: 42 });
});

test("examples/async carries failures on Task's error channel (ADR 0006)", async () => {
  const out = await runAsyncExample();
  expect(await out.found).toEqual({ _tag: "Ok", value: "Ada is on the pro plan" });
  // A 404 is recovered on the error track; an unreachable host stays an Err.
  expect(await out.recovered).toEqual({
    _tag: "Ok",
    value: "user 7 has no plan — showing the demo one",
  });
  expect(await out.offline).toEqual({
    _tag: "Err",
    error: { _tag: "Offline", _0: "network down" },
  });
});

test("examples/async fans out with Task.all/traverse/race (ADR 0074)", async () => {
  const out = await runAsyncExample();
  // traverse keeps INPUT order and collects into one Ok.
  expect(await out.everyone).toEqual({ _tag: "Ok", value: ["Ada", "Ada"] });
  // Fail-fast: the 404 settles the whole fan-out on the error track.
  expect(await out.partial).toEqual({ _tag: "Err", error: { _tag: "NotFound", _0: 7 } });
  // race settles on the first task to settle, not the first in the array.
  expect(await out.fastest).toEqual({ _tag: "Ok", value: "quick" });
});

test("examples/modules builds the whole graph and wires imports", () => {
  const outs = build("examples/modules/main.mochi");
  const main = outs.find((o) => o.path.endsWith("main.mochi"))!.js;
  const geometry = outs.find((o) => o.path.endsWith("geometry.mochi"))!.js;
  expect(main).toContain('import { area, hypot, Circle, Rect } from "./geometry.js";');
  expect(geometry).toContain("export const area");
});

// A worked multi-module example for C5: with `import * as D`, every type ./shapes
// exports is writable as `D.T` in any type position — nullary and applied variants
// cross nominally, and a transparent record alias EXPANDS across the edge (aliases
// are structural, ADR 0005). Checked in as `examples/qualified-types/`, so the
// bootstrap differential corpus (which globs every `.mochi` in the repo) also
// exercises the self-hosted graph's qualified-type path (C5 slice d).
test("a graph naming imported TYPES through a namespace alias builds (C5 slice b)", () => {
  const outs = build("examples/qualified-types/main.mochi");
  const main = outs.find((o) => o.path.endsWith("main.mochi"))!.js;
  // `D` is only ever used in type positions, so no value is read through it;
  // the ctors and `area` arrive through the ordinary named import.
  expect(main).toContain('import { area, Circle, Rect, Box } from "./shapes.js";');
  expect(main).not.toContain("D.");
});

// ADR 0055 — the blessed prop-contract exemplar: the annotated docs component
// keeps its alias name in the sidecar (not an open props bag), so the TSX
// consumer (Playground.tsx) is checked against the mochi contract.
test("annotated docs component sidecar names its Props alias (ADR 0055)", () => {
  const src = read("apps/docs/src/components/PlaygroundView.mochi");
  const dts = unwrapOk(emitDts(src));
  expect(dts).toContain("export type Props = {");
  expect(dts).toContain("(props: Props) => any");
  expect(dts).not.toContain("Record<string, unknown>");
});

test("docs tour snippets compile (source of HighlightCode panels)", () => {
  for (const name of ["variants", "records", "jsx"] as const) {
    const src = read(`apps/docs/src/examples/${name}.mochi`);
    const r = compile(src);
    expect(isErr(r), `${name}.mochi: ${isErr(r) ? JSON.stringify(r.error) : ""}`).toBe(false);
  }
});

test("docs playground presets emit every displayed target", () => {
  for (const name of ["jsx", "result", "task", "row-poly", "pipelines"] as const) {
    const src = read(`apps/docs/src/examples/presets/${name}.mochi`);
    const result = compileTargets(src, { runtime: true });
    expect(
      isErr(result),
      `presets/${name}.mochi: ${isErr(result) ? JSON.stringify(result.error) : ""}`,
    ).toBe(false);
    if (isErr(result)) continue;
    expect(result.value.js.trim().length, `${name} JavaScript is empty`).toBeGreaterThan(0);
    expect(result.value.ts.trim().length, `${name} TypeScript is empty`).toBeGreaterThan(0);
    expect(result.value.dts.trim().length, `${name} .d.ts is empty`).toBeGreaterThan(0);
  }
});

test("let? dispatches Option and Result from the value head (ADR 0079)", () => {
  const src = `let o = let? x = Some(20) in Some(add(x, 1))
let r = let? x = Ok(20) in Ok(add(x, 1))`;
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  const out = new Function("match", `${js}\nreturn { o, r };`)(match) as {
    o: { _tag: string; value?: number };
    r: { _tag: string; value?: number };
  };
  expect(out.o).toEqual({ _tag: "Some", value: 21 });
  expect(out.r).toEqual({ _tag: "Ok", value: 21 });
});

test("Set.empty is a writable empty Set (ADR 0080)", () => {
  const js = unwrapOk(compile("let s = Set.add(1, Set.empty)")).replace(/^import .*$/m, "");
  const out = new Function(`${js}\nreturn s;`)() as Set<number>;
  expect([...out]).toEqual([1]);
});

test("a string-literal union synonym accepts a member (ADR 0081)", () => {
  const src = `type Tone = "rose" | "amber"
let t : Tone = "rose"`;
  expect(isErr(compile(src))).toBe(false);
  expect(isErr(compile(`type Tone = "rose" | "amber"\nlet t : Tone = "taupe"`))).toBe(true);
});

test("a tuple let types its names from the value before the body", () => {
  // `let (a, b) = v in body` is `((a, b) => body)(v)`; the body must not fix a
  // union-domain name before `v` supplies its type.
  const src = `let apply = (arg: number | (number -> number)) => 1
let pair = (n: number) =>
  let (m, set) = (n, apply) in set(x => x + m) + set(m + 1)`;
  expect(isErr(compile(src))).toBe(false);
});

test("a tuple let still records its lambda's type at the lambda span", () => {
  // Hover and the TS backend's parameter annotations read the arrow from there.
  const src = "let pair = (n: number) =>\n  let (m, k) = (n, 1) in m + k";
  const lamStart = src.indexOf("(m, k)");
  const hit = typesOf(src, { open: false }).find((t) => t.span.start === lamStart);
  expect((hit?.ty as Tagged | undefined)?._tag).toBe("TyFn");
});

test("an optional record field may be omitted and reads as Option (ADR 0098)", () => {
  const src = `type Props = { id?: string, n: number }
let ok : Props = { n: 1 }
let getId = (p: Props) => p.id`;
  expect(isErr(compile(src))).toBe(false);
  expect(
    isErr(compile(`type Props = { id?: string, n: number }\nlet bad : Props = { id: "x" }`)),
  ).toBe(true);
  const dts = unwrapOk(compileTargets(src)).dts;
  expect(dts).toContain("id?: string");
  expect(
    compileAndEval(
      `type Props = { id?: string }
let missing = (p: Props) => p.id
let hit = (p: Props) => p.id
let a = missing({})
let b = hit({ id: "x" })`,
      "{ a, b }",
    ),
  ).toEqual({ a: { _tag: "None" }, b: { _tag: "Some", value: "x" } });
});

test("labeled params with defaults fill in the callee (ADR 0098 §2)", () => {
  const src = `let f = (~tone: string = "rose", ~size?: number) => (tone, size)
let a = f()
let b = f(~tone="amber")
let c = f(~tone="amber", ~size=3)
let tone = "pun"
let d = f(~tone)`;
  expect(isErr(compile(src))).toBe(false);
  expect(compileAndEval(src, "{ a, b, c, d }")).toEqual({
    a: ["rose", { _tag: "None" }],
    b: ["amber", { _tag: "None" }],
    c: ["amber", { _tag: "Some", value: 3 }],
    d: ["pun", { _tag: "None" }],
  });
});

test("docstrings are retained across JS, TS, and .d.ts targets (ADR 0094)", () => {
  const src = `/// Add two integers.
export let addInt = (a, b) => add(a, b)

/// Point in 2D space.
export type Point = { x: number, y: number }`;
  const targets = unwrapOk(compileTargets(src));
  expect(targets.js).toContain("/**\n * Add two integers.\n */\nexport const addInt");
  expect(targets.ts).toContain("/**\n * Add two integers.\n */\nexport const addInt");
  expect(targets.ts).toContain("/**\n * Point in 2D space.\n */\nexport type Point =");
  expect(targets.dts).toContain("/**\n * Add two integers.\n */\nexport declare const addInt");
  expect(targets.dts).toContain("/**\n * Point in 2D space.\n */\nexport type Point =");
});

test("Map/Set resolve composite keys structurally (ADR 0152)", () => {
  const src = `let m = Map.empty |> Map.set((1, 2), "a") |> Map.set((1, 2), "b") |> Map.set((3, 4), "c")
let s = Set.fromArray([[1], [1], [2]]) |> Set.add([2]) |> Set.add([3])
let out = (
  Map.size(m),
  Map.get((1, 2), m),
  Map.getOr("z", (9, 9), m),
  Map.has((3, 4), Map.delete((3, 4), m)),
  Set.size(s),
  Set.has([3], s),
  Set.size(Set.union(s, Set.fromArray([[1], [7]]))),
  Set.size(Set.diff(s, Set.fromArray([[1]])))
)`;
  expect(compileAndEval(src, "out")).toEqual([
    2,
    { _tag: "Some", value: "b" },
    "z",
    false,
    3,
    true,
    4,
    2,
  ]);
});

test("pipe placeholder fills the marked argument (ADR 0153)", () => {
  const src = `let f3 = (a, b, c) => a * 100 + b * 10 + c
let out = [5 |> f3(1, _, 3), 5 -> f3(1, _, 3), 5 |> f3(_, 2, 3), 5 |> f3(_, _, 3), (2 + 3) |> f3(_, _, 0)]`;
  expect(compileAndEval(src, "out")).toEqual([153, 153, 523, 553, 550]);
  // a non-atomic piped value is bound once, not copied into every `_`
  expect(compileJs(src)).toContain("$pipe");
});

test("record type spread splices alias fields; later field wins (ADR 0154)", () => {
  const src = `type A = { id: number, name: string }
type B = { ...A, extra: string }
type C = { ...A, name: bool }
type P<T> = { v: T }
type Q<T> = { ...P<T>, n: number }
let b : B = { id: 1, name: "a", extra: "e" }
let c : C = { id: 1, name: true }
let q : Q<string> = { v: "x", n: 2 }
let out = (b.id, b.extra, c.name, q.v, q.n)`;
  expect(compileAndEval(src, "out")).toEqual([1, "e", true, "x", 2]);
  const emitted = unwrapOk(compileTargets(src, { runtime: false }));
  expect(emitted.ts).toContain("export type B = A & { extra: string };");
  // an override must not also demand the spread's own, differing, field type
  expect(emitted.ts).toContain('export type C = Omit<A, "name"> & { name: boolean };');
  expect(emitted.ts).toContain("export type Q<A> = { v: A } & { n: number };");
});

test("record type spread is typed: missing and overridden fields are checked", () => {
  const head = "type A = { id: number, name: string }\n";
  expect(
    isErr(compile(`${head}type B = { ...A, extra: string }\nlet b: B = { name: "a", extra: "e" }`)),
  ).toBe(true);
  expect(
    isErr(compile(`${head}type C = { ...A, name: bool }\nlet c: C = { id: 1, name: "s" }`)),
  ).toBe(true);
  expect(
    isErr(compile(`${head}type C = { ...A, name: bool }\nlet c: C = { id: 1, name: true }`)),
  ).toBe(false);
  // a spread written after a field overrides it, so the spread's type wins
  const later = `${head}type D = { name: bool, ...A }\n`;
  expect(isErr(compile(`${later}let d: D = { id: 1, name: "s" }`))).toBe(false);
  expect(isErr(compile(`${later}let d: D = { id: 1, name: true }`))).toBe(true);
  expect(unwrapOk(compileTargets(later, { runtime: false })).ts).toContain(
    "export type D = { id: number; name: string };",
  );
});
