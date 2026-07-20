// The prelude: builtin signatures the inferencer starts with, plus the JS
// runtime that backs them. Kept tiny for now — arithmetic and comparison.
import type { Ctor } from "./ast";
import { type Type, tArrow, tBool, tCon, tNumber, tString, tVar } from "./types";

const bin = (a: Type, b: Type, r: Type): Type => tArrow(a, tArrow(b, r));
const num2 = bin(tNumber, tNumber, tNumber); // number -> number -> number
const cmp = bin(tNumber, tNumber, tBool); // number -> number -> bool

// Polymorphic prelude type vars. Any ids < the inference fresh-supply start
// (1000) are safe: builtins are generalized, then instantiated fresh per use, so
// these ids never surface during a program's inference.
const a = tVar(0);
const b = tVar(1);
const c = tVar(2);
const arr = (t: Type): Type => tCon("Array", [t]); // [t] — eager JS array
const list = (t: Type): Type => tCon("List", [t]); // List t — lazy pull-sequence (@{...})
const set = (t: Type): Type => tCon("Set", [t]); // Set t — native JS Set (${...})
const mapT = (k: Type, v: Type): Type => tCon("Map", [k, v]); // Map k v — native JS Map (#{...})
const opt = (t: Type): Type => tCon("Option", [t]); // Option t — builtin variant

// Builtin variant types — seeded into the registry / env / codegen ONLY when a
// program doesn't declare a type of the same name (so user redeclarations win).
// Runtime shape matches @onrails/result + @onrails/maybe (`{ _tag, value/error }`),
// so alang Option/Result values flow straight through their combinators.
export const builtinTypeDecls: { name: string; params: string[]; ctors: Ctor[] }[] = [
  {
    name: "Option",
    params: ["a"],
    ctors: [
      { name: "Some", fields: [{ name: "value", type: "a" }] },
      { name: "None", fields: [] },
    ],
  },
  {
    name: "Result",
    params: ["a", "e"],
    ctors: [
      { name: "Ok", fields: [{ name: "value", type: "a" }] },
      { name: "Err", fields: [{ name: "error", type: "e" }] },
    ],
  },
];

// name → type. Monomorphic entries (arithmetic) carry no vars; the collection /
// function utilities are polymorphic and generalize at bind time. Curried
// (data-last) so they compose with `|>`: `xs |> map(f) |> filter(p)`.
export const preludeEnv: Record<string, Type> = {
  add: num2,
  sub: num2,
  mul: num2,
  div: num2,
  square: tArrow(tNumber, tNumber),
  sqrt: tArrow(tNumber, tNumber),
  hypot: num2,
  pi: tNumber,
  eq: cmp,
  lt: cmp,
  gt: cmp,
  // --- Array ops (ported from prelude-js List; a lazy `List` is future work) ---
  length: tArrow(arr(a), tNumber), // [a] -> number
  map: tArrow(tArrow(a, b), tArrow(arr(a), arr(b))), // (a -> b) -> [a] -> [b]
  filter: tArrow(tArrow(a, tBool), tArrow(arr(a), arr(a))), // (a -> bool) -> [a] -> [a]
  reduce: tArrow(tArrow(b, tArrow(a, b)), tArrow(b, tArrow(arr(a), b))), // (b -> a -> b) -> b -> [a] -> b
  // --- Func ---
  identity: tArrow(a, a), // a -> a
  always: tArrow(a, tArrow(b, a)), // a -> b -> a  (prelude-js `const`)
  compose: tArrow(tArrow(b, c), tArrow(tArrow(a, b), tArrow(a, c))), // (b -> c) -> (a -> b) -> a -> c
  // --- Str ---
  capitalize: tArrow(tString, tString),
  // --- List (lazy sequence, `@{...}`) — generator-backed, supports infinite ---
  range: tArrow(tNumber, tArrow(tNumber, list(tNumber))), // number -> number -> List number
  iterate: tArrow(tArrow(a, a), tArrow(a, list(a))), // (a -> a) -> a -> List a  (infinite)
  repeat: tArrow(a, list(a)), // a -> List a  (infinite)
  take: tArrow(tNumber, tArrow(list(a), list(a))), // number -> List a -> List a
  takeWhile: tArrow(tArrow(a, tBool), tArrow(list(a), list(a))), // (a -> bool) -> List a -> List a
  drop: tArrow(tNumber, tArrow(list(a), list(a))), // number -> List a -> List a
  fromArray: tArrow(arr(a), list(a)), // [a] -> List a
  toArray: tArrow(list(a), arr(a)), // List a -> [a]  (materializes — infinite hangs)
};

// Matching JS definitions, keyed by name so codegen can inline just the ones a
// program actually references (and doesn't shadow) — a standalone module carries
// only the runtime it uses.
export const preludeJsDefs: Record<string, string> = {
  // List core: a List is an iterable factory `{ [Symbol.iterator]: () => Iterator }`.
  // Force-included by codegen whenever a `@{...}` literal or List producer is used.
  _list: "const _list = (g) => ({ [Symbol.iterator]: g });",
  // Builtin variant constructors (inlined only when a program uses them and does
  // not declare its own type of that name). Shape matches the @onrails ecosystem.
  Some: 'const Some = (value) => ({ _tag: "Some", value });',
  None: 'const None = { _tag: "None" };',
  Ok: 'const Ok = (value) => ({ _tag: "Ok", value });',
  Err: 'const Err = (error) => ({ _tag: "Err", error });',
  add: "const add = (a, b) => a + b;",
  sub: "const sub = (a, b) => a - b;",
  mul: "const mul = (a, b) => a * b;",
  div: "const div = (a, b) => a / b;",
  square: "const square = (x) => x * x;",
  sqrt: "const sqrt = (x) => Math.sqrt(x);",
  hypot: "const hypot = (a, b) => Math.hypot(a, b);",
  pi: "const pi = Math.PI;",
  eq: "const eq = (a, b) => a === b;",
  lt: "const lt = (a, b) => a < b;",
  gt: "const gt = (a, b) => a > b;",
  // Curried (data-last) to compose with `|>`; each takes the collection last.
  length: "const length = (xs) => xs.length;",
  map: "const map = (f) => (xs) => xs.map((x) => f(x));",
  filter: "const filter = (f) => (xs) => xs.filter((x) => f(x));",
  reduce: "const reduce = (f) => (init) => (xs) => xs.reduce((acc, x) => f(acc)(x), init);",
  identity: "const identity = (x) => x;",
  always: "const always = (x) => (_y) => x;",
  compose: "const compose = (f) => (g) => (x) => f(g(x));",
  capitalize: "const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);",
  // --- List (lazy sequence) — generator-backed; producers/slicers stay lazy ---
  range:
    "const range = (lo) => (hi) => _list(function* () { for (let i = lo; i < hi; i++) yield i; });",
  iterate:
    "const iterate = (f) => (x) => _list(function* () { let v = x; for (;;) { yield v; v = f(v); } });",
  repeat: "const repeat = (x) => _list(function* () { for (;;) yield x; });",
  take: "const take = (n) => (xs) => _list(function* () { let i = 0; for (const x of xs) { if (i >= n) break; yield x; i++; } });",
  takeWhile:
    "const takeWhile = (p) => (xs) => _list(function* () { for (const x of xs) { if (!p(x)) break; yield x; } });",
  drop: "const drop = (n) => (xs) => _list(function* () { let i = 0; for (const x of xs) { if (i < n) { i++; continue; } yield x; } });",
  fromArray: "const fromArray = (xs) => _list(function* () { yield* xs; });",
  toArray: "const toArray = (xs) => [...xs];",
  // Lazy List transformers — accessed qualified (`List.map`), never shadow the
  // eager Array `map`/`filter`. Each stays lazy (fuses, no intermediate arrays).
  _List_map:
    "const _List_map = (f) => (xs) => _list(function* () { for (const x of xs) yield f(x); });",
  _List_filter:
    "const _List_filter = (p) => (xs) => _list(function* () { for (const x of xs) if (p(x)) yield x; });",
  _List_concat:
    "const _List_concat = (xs) => (ys) => _list(function* () { yield* xs; yield* ys; });",
  _List_flatMap:
    "const _List_flatMap = (f) => (xs) => _list(function* () { for (const x of xs) yield* f(x); });",
  // --- Set ops (native JS Set; immutable — each returns a fresh Set) ---
  _Set_has: "const _Set_has = (x) => (s) => s.has(x);",
  _Set_add: "const _Set_add = (x) => (s) => new Set(s).add(x);",
  _Set_delete:
    "const _Set_delete = (x) => (s) => { const n = new Set(s); n.delete(x); return n; };",
  _Set_size: "const _Set_size = (s) => s.size;",
  _Set_toArray: "const _Set_toArray = (s) => [...s];",
  _Set_fromArray: "const _Set_fromArray = (xs) => new Set(xs);",
  _Set_union: "const _Set_union = (a) => (b) => new Set([...a, ...b]);",
  _Set_intersect: "const _Set_intersect = (a) => (b) => new Set([...a].filter((x) => b.has(x)));",
  _Set_diff: "const _Set_diff = (a) => (b) => new Set([...a].filter((x) => !b.has(x)));",
  // --- Map ops (native JS Map; immutable — each returns a fresh Map) ---
  _Map_has: "const _Map_has = (k) => (m) => m.has(k);",
  _Map_getOr: "const _Map_getOr = (d) => (k) => (m) => (m.has(k) ? m.get(k) : d);",
  _Map_set:
    "const _Map_set = (k) => (v) => (m) => { const n = new Map(m); n.set(k, v); return n; };",
  _Map_delete:
    "const _Map_delete = (k) => (m) => { const n = new Map(m); n.delete(k); return n; };",
  _Map_size: "const _Map_size = (m) => m.size;",
  _Map_keys: "const _Map_keys = (m) => [...m.keys()];",
  _Map_values: "const _Map_values = (m) => [...m.values()];",
  _Map_get: "const _Map_get = (k) => (m) => (m.has(k) ? Some(m.get(k)) : None);",
  // --- Option-returning safe accessors (depend on Some/None) ---
  _List_head: "const _List_head = (xs) => { for (const x of xs) return Some(x); return None; };",
  _Array_head: "const _Array_head = (xs) => (xs.length > 0 ? Some(xs[0]) : None);",
  _Array_find:
    "const _Array_find = (p) => (xs) => { for (const x of xs) if (p(x)) return Some(x); return None; };",
};

// Runtime-dependency graph: a def name → the other def names its body references.
// `preludePreamble` takes the transitive closure over this before inlining, so a
// referenced op drags in the helpers/constructors it needs (`_Map_get` → Some/None,
// `range` → `_list`, …). Entries with no deps may be omitted.
export const runtimeDeps: Record<string, string[]> = {
  range: ["_list"],
  iterate: ["_list"],
  repeat: ["_list"],
  take: ["_list"],
  takeWhile: ["_list"],
  drop: ["_list"],
  fromArray: ["_list"],
  _List_map: ["_list"],
  _List_filter: ["_list"],
  _List_concat: ["_list"],
  _List_flatMap: ["_list"],
  _Map_get: ["Some", "None"],
  _List_head: ["Some", "None"],
  _Array_head: ["Some", "None"],
  _Array_find: ["Some", "None"],
};

// Qualified collection namespaces. alang has no overloading, so each collection
// carries its own `Ns.op`; the unqualified `map`/`filter`/… above stay as eager
// Array aliases for the common case. `Array.map` mirrors them; `List.*` is lazy.
export const preludeNamespaces: Record<string, Record<string, Type>> = {
  Array: {
    map: tArrow(tArrow(a, b), tArrow(arr(a), arr(b))),
    filter: tArrow(tArrow(a, tBool), tArrow(arr(a), arr(a))),
    reduce: tArrow(tArrow(b, tArrow(a, b)), tArrow(b, tArrow(arr(a), b))),
    length: tArrow(arr(a), tNumber),
    head: tArrow(arr(a), opt(a)), // [a] -> Option a
    find: tArrow(tArrow(a, tBool), tArrow(arr(a), opt(a))), // (a -> bool) -> [a] -> Option a
  },
  List: {
    map: tArrow(tArrow(a, b), tArrow(list(a), list(b))), // (a -> b) -> List a -> List b
    filter: tArrow(tArrow(a, tBool), tArrow(list(a), list(a))), // (a -> bool) -> List a -> List a
    concat: tArrow(list(a), tArrow(list(a), list(a))), // List a -> List a -> List a
    flatMap: tArrow(tArrow(a, list(b)), tArrow(list(a), list(b))), // (a -> List b) -> List a -> List b
    head: tArrow(list(a), opt(a)), // List a -> Option a  (forces one element)
  },
  // Set ops — immutable (return a fresh Set). Keys/elements are primitives.
  Set: {
    has: tArrow(a, tArrow(set(a), tBool)), // a -> Set a -> bool
    add: tArrow(a, tArrow(set(a), set(a))), // a -> Set a -> Set a
    delete: tArrow(a, tArrow(set(a), set(a))), // a -> Set a -> Set a
    size: tArrow(set(a), tNumber), // Set a -> number
    toArray: tArrow(set(a), arr(a)), // Set a -> [a]
    fromArray: tArrow(arr(a), set(a)), // [a] -> Set a
    union: tArrow(set(a), tArrow(set(a), set(a))), // Set a -> Set a -> Set a
    intersect: tArrow(set(a), tArrow(set(a), set(a))), // Set a -> Set a -> Set a
    diff: tArrow(set(a), tArrow(set(a), set(a))), // Set a -> Set a -> Set a
  },
  // Map ops — immutable (return a fresh Map). `getOr` supplies a fallback since
  // an `Option`-returning `get` waits on a builtin Option (prelude slice).
  Map: {
    has: tArrow(a, tArrow(mapT(a, b), tBool)), // k -> Map k v -> bool
    getOr: tArrow(b, tArrow(a, tArrow(mapT(a, b), b))), // v -> k -> Map k v -> v
    set: tArrow(a, tArrow(b, tArrow(mapT(a, b), mapT(a, b)))), // k -> v -> Map k v -> Map k v
    delete: tArrow(a, tArrow(mapT(a, b), mapT(a, b))), // k -> Map k v -> Map k v
    size: tArrow(mapT(a, b), tNumber), // Map k v -> number
    keys: tArrow(mapT(a, b), arr(a)), // Map k v -> [k]
    values: tArrow(mapT(a, b), arr(b)), // Map k v -> [v]
    get: tArrow(a, tArrow(mapT(a, b), opt(b))), // k -> Map k v -> Option v
  },
};

// `Ns.member` → the JS identifier codegen emits. Array reuses the existing eager
// defs; List points at the lazy `_List_*` generators above.
export const namespaceRuntime: Record<string, Record<string, string>> = {
  Array: {
    map: "map",
    filter: "filter",
    reduce: "reduce",
    length: "length",
    head: "_Array_head",
    find: "_Array_find",
  },
  List: {
    map: "_List_map",
    filter: "_List_filter",
    concat: "_List_concat",
    flatMap: "_List_flatMap",
    head: "_List_head",
  },
  Set: {
    has: "_Set_has",
    add: "_Set_add",
    delete: "_Set_delete",
    size: "_Set_size",
    toArray: "_Set_toArray",
    fromArray: "_Set_fromArray",
    union: "_Set_union",
    intersect: "_Set_intersect",
    diff: "_Set_diff",
  },
  Map: {
    has: "_Map_has",
    getOr: "_Map_getOr",
    set: "_Map_set",
    delete: "_Map_delete",
    size: "_Map_size",
    keys: "_Map_keys",
    values: "_Map_values",
    get: "_Map_get",
  },
};

// The whole runtime as one blob — for tests / tooling that want every builtin in
// scope regardless of what a snippet references.
export const preludeJs = Object.values(preludeJsDefs).join("\n");
