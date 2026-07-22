// Differential tier for the TypeScript backend (ADR 0026): emit `.ts` for a
// corpus of closed-world programs and assert it type-checks under `tsc --strict`.
// This is what makes "strict-clean" a guarantee rather than a claim — if codegen
// or the typed runtime (src/runtime.ts) regresses, tsc catches it here.
import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { unwrapOk } from "@onrails/result";
import { codegenTs } from "../src/codegen-ts";

const DIR = new URL("./.tsgen/", import.meta.url).pathname;
// From test/.tsgen/<file>.ts back to src/runtime.
const RUNTIME_IMPORT = "../../src/runtime";

// Each program is closed-world: it references only prelude builtins and its own
// bindings (no open-world globals that would emit as dangling TS names).
const PROGRAMS: Record<string, string> = {
  shapes: `
type Shape =
  | Circle(float)
  | Rect(float, float)
let area = shape => switch shape {
  | Circle(r) => mul(pi, mul(r, r))
  | Rect(w, h) => mul(w, h)
}
let hypot = (a, b) => sqrt(add(mul(a, a), mul(b, b)))
let total = area(Circle(2.0))`,
  generics: `
type Tree a =
  | Leaf
  | Node(a, Tree a, Tree a)
let leaf = Leaf
let one = Node(1, Leaf, Leaf)
let size = t => switch t {
  | Leaf => 0
  | Node(_v, l, r) => add(1, add(size(l), size(r)))
}`,
  options: `
type Color = | Red | Green | Blue
let toName = c => switch c {
  | Red => "red"
  | Green => "green"
  | Blue => "blue"
}
let firstUpper = s => Str.toUpper(Str.slice(0, 1, s))
let names = map(toName, [Red, Green, Blue])`,
  records: `
type Point = { x: number, y: number }
let origin = { x: 0.0, y: 0.0 }
let shift = (p, dx) => { ...p, x: add(p.x, dx) }
let dist = p => sqrt(add(mul(p.x, p.x), mul(p.y, p.y)))
let moved = shift(origin, 3.0)`,
  // Regression guard: CURRIED / piped prelude application. A flat runtime type
  // rejects \`map(f)(xs)\`; the overloaded (curry-aware) type + pipe flattening
  // (ADR 0026) make \`xs |> map(f)\` infer its element type. Covers top-level and
  // namespace (List/Option) builtins, eager + lazy collections, interpolation.
  pipelines: `
let doubled = [1, 2, 3] |> map(x => mul(x, 2))
let evens = [1, 2, 3, 4] |> filter(x => eq(0, 0))
let total = [1, 2, 3] |> map(x => add(x, 1)) |> reduce(add, 0)
let lazyDoubled = @{1, 2, 3} |> List.map(x => mul(x, 2))
let scores = #{"a": 1, "b": 2}
let bumped = Some(5) |> Option.map(x => add(x, 1))
let greet = name => "hello \${name}!"`,
  // Regression guard for ADR 0028: INNER lambda params over concrete types
  // (`n`, `acc`) would infer `any` under strict tsc; they must be annotated.
  // `compose` is generic — its value-position params must stay BARE (their
  // `<A,B,C>` letters aren't in scope in the value), typed contextually instead.
  higherOrder: `
let compose = (f, g, x) => f(g(x))
let pipeline = xs =>
  xs
  |> map(n => add(n, 1))
  |> filter(n => eq(n, n))
  |> reduce((acc, n) => add(acc, n), 0)`,
  // Regression guard for ADR 0031: NESTED patterns lower to guard-form arms
  // (`.with((_v) => …, handler)`). ts-pattern only narrows a handler for an
  // `x is U` guard, so without the emitted type predicate the handler destructure
  // (`Some(Circle(r))` → `{ value: { _0: r } }`) sees the full union → TS2339.
  // Covers a ctor inside a ctor, and a ctor at the head of an array pattern.
  nested: `
type Shape =
  | Circle(float)
  | Rect(float, float)
let describe = os => switch os {
  | Some(Circle(r)) => mul(r, r)
  | Some(Rect(w, h)) => mul(w, h)
  | _ => 0.0
}
let firstR = xs => switch xs {
  | [Circle(r), ..._rest] => r
  | _ => 0.0
}
let a = describe(Some(Circle(2.0)))
let b = firstR([Circle(1.0), Rect(2.0, 3.0)])`,
  // Regression guard for ADR 0035: an EMPTY collection seed (\`#{}\`) threaded
  // through a stateful fold. A \`let\`-generalized binder (\`s\`) and a top-level
  // one (\`seeded\`) both make the seed polymorphic, so the empty map otherwise
  // emits \`Map<unknown, unknown>\` and fails against the fold's \`Map<number,
  // number>\` state. The annotation (IIFE param + \`const\` type) pins them.
  emptyColl: `
let bump = st => { ...st, m: Map.set(st.n, st.n, st.m), n: add(st.n, 1) }
let seeded = { m: #{}, n: 0 }
let run = () =>
  let s = { m: #{}, n: 0 } in
  bump(bump(s)).m
let run2 = () => bump(seeded).m`,
  // Regression guard for ADR 0036: a tuple literal has no contextual tuple type
  // in a return, a \`Some(…)\` payload, or a call argument, so a bare \`[a, b]\`
  // widens to \`(A | B)[]\` and fails the binding's declared tuple type. Emitting
  // \`_tuple(a, b)\` (an identity whose rest param infers as a tuple) keeps it
  // \`[A, B]\`. Covers concrete + generic tuples, and a tuple built in a match arm.
  tuples: `
let pair = () => (1, "a")
let firstRest = xs => switch xs {
  | [x, ..._rest] => Some((x, _rest))
  | _ => None
}
let p = pair()
let r = firstRest([1, 2, 3])`,
  // Regression guard for ADR 0037: a CONCRETE curried function partially applied.
  // \`_curry\` makes \`inRange(48, 57)\` / \`clamp(0, 10)\` legal at runtime, but a flat
  // \`(a, b, c) => R\` binding type rejects the sub-arity call (TS2554). The
  // partial-application overload set accepts it — used as a \`map\` callback and
  // then fully applied. Generic functions stay flat (overloads break inference).
  partialApp: `
let inRange = (lo, hi, n) => and(gte(n, lo), lte(n, hi))
let bumped = map(inRange(48, 57), [50, 99])
let clamp = (lo, hi, n) => add(lo, add(hi, n))
let atMost = clamp(0, 10)
let one = atMost(5)`,
  // Regression guard for ADR 0038: an eager-array match with NO catch-all is
  // the \`[]\` + \`[h, ...t]\` length partition (check.ts proves it total). Its
  // guard arms test \`.length\` and don't narrow \`A[]\` structurally, so
  // ts-pattern's \`.exhaustive()\` types as \`NonExhaustiveError<A[]>\` (TS2322).
  // The TS backend closes it with a throwing \`.otherwise\` instead. Covers a
  // concrete recursion and a generic (element-polymorphic) one.
  arrayMatch: `
let sumAll = xs => switch xs {
  | [] => 0
  | [h, ..._t] => add(h, sumAll(_t))
}
let count = xs => switch xs {
  | [] => 0
  | [_h, ..._t] => add(1, count(_t))
}
let s = sumAll([1, 2, 3])
let c = count([1, 2, 3])`,
  // Regression guard for ADR 0039: a match whose FIRST arm returns a record
  // field `doc: None` and a later arm returns `doc: Some(str)`. ts-pattern pins
  // the chain's return from the first arm, so a bare `None` (`Option<never>`)
  // there rejects the widening `Option<string>` arm (TS2322). The TS backend
  // annotates the nullary ctor in place (`None as Option<string>`) so the first
  // arm's field is already the wide type. Mirrors `bootstrap/lexer.al` `mkTok`.
  noneAnnot: `
let mkTok = (tok, doc) => switch doc {
  | [] => { tok: tok, doc: None }
  | lines => { tok: tok, doc: Some(Str.join("\n", lines)) }
}
let a = mkTok(1, [])
let b = mkTok(2, ["x", "y"])`,
};

beforeAll(() => {
  mkdirSync(DIR, { recursive: true });
  for (const [name, src] of Object.entries(PROGRAMS))
    writeFileSync(`${DIR}${name}.ts`, unwrapOk(codegenTs(src, { runtimeImport: RUNTIME_IMPORT })));
  writeFileSync(
    `${DIR}tsconfig.json`,
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        target: "es2020",
        module: "esnext",
        moduleResolution: "bundler",
      },
      include: ["*.ts"],
    }),
  );
});

afterAll(() => rmSync(DIR, { recursive: true, force: true }));

test("emitted .ts type-checks under tsc --strict", () => {
  const proc = Bun.spawnSync(["bunx", "tsc", "-p", `${DIR}tsconfig.json`], { cwd: DIR });
  const out = `${proc.stdout.toString()}${proc.stderr.toString()}`.trim();
  expect(out).toBe("");
});
