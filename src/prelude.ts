// The prelude: builtin signatures the inferencer starts with, plus the JS
// runtime that backs them. Kept tiny for now — arithmetic and comparison.
import type { Ctor, TypeExpr } from "./ast";
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
const res = (t: Type, e: Type): Type => tCon("Result", [t, e]); // Result t e — builtin variant

// Builtin variant types — seeded into the registry / env / codegen ONLY when a
// program doesn't declare a type of the same name (so user redeclarations win).
// Runtime shape matches @onrails/result + @onrails/maybe (`{ _tag, value/error }`),
// so mochi Option/Result values flow straight through their combinators.
// Ctor field types are TypeExprs (ADR 0015); builtins only need bare names.
const tn = (name: string): TypeExpr => ({ kind: "tname", name, span: { start: 0, end: 0 } });

export const builtinTypeDecls: { name: string; params: string[]; ctors: Ctor[] }[] = [
  {
    name: "Option",
    params: ["a"],
    ctors: [
      { name: "Some", fields: [{ name: "value", type: tn("a") }], span: { start: 0, end: 0 } },
      { name: "None", fields: [], span: { start: 0, end: 0 } },
    ],
  },
  {
    name: "Result",
    params: ["a", "e"],
    ctors: [
      { name: "Ok", fields: [{ name: "value", type: tn("a") }], span: { start: 0, end: 0 } },
      { name: "Err", fields: [{ name: "error", type: tn("e") }], span: { start: 0, end: 0 } },
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
  concat: tArrow(a, tArrow(a, a)), // a -> a -> a (polymorphic sequence/string concat)
  // eq/compare/show are STRUCTURAL and polymorphic (deep-equal / deep-order /
  // display at any type) — the pragmatic bridge instead of typeclasses.
  // lt/gt/gte/lte stay numeric.
  eq: tArrow(a, tArrow(a, tBool)), // a -> a -> bool  (structural)
  compare: tArrow(a, tArrow(a, tNumber)), // a -> a -> number  (-1 | 0 | 1)
  show: tArrow(a, tString), // a -> string  (structural display)
  lt: cmp,
  gt: cmp,
  gte: cmp,
  lte: cmp,
  // --- bool combinators (mochi has no operators; these are eager, not
  // short-circuit — operands are values, so that only matters for cost) ---
  not: tArrow(tBool, tBool),
  and: bin(tBool, tBool, tBool),
  or: bin(tBool, tBool, tBool),
  // --- Math (unqualified, like the arithmetic ops) ---
  min: num2, // number -> number -> number
  max: num2,
  pow: num2, // base -> exp -> number
  mod: num2, // a -> b -> number  (true modulo, sign of b)
  abs: tArrow(tNumber, tNumber),
  floor: tArrow(tNumber, tNumber),
  ceil: tArrow(tNumber, tNumber),
  round: tArrow(tNumber, tNumber),
  sign: tArrow(tNumber, tNumber),
  negate: tArrow(tNumber, tNumber),
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
  // Currying bridge (CRITIQUE §4.4): every mochi function has a curried type
  // (`a -> b -> c`), but its runtime impl is a FLAT n-ary JS function. `_curry`
  // reconciles the two — the result accepts args grouped any way the caller
  // likes: `f(a, b)` hits the fast path (one flat call, no intermediate
  // closure), `f(a)(b)` collects one arg at a time, and over-application
  // (`f(a, b, c)` on a binary that returns a function) is applied by folding
  // the surplus. Definitions of arity ≥ 2 are wrapped in this; arity-1
  // functions need no wrapper (a single arg always saturates).
  // The saturated case MUST be `return f(...a)` — a proper tail call. Emitted
  // modules are strict (ESM), and JSC eliminates tail frames; recursive mochi
  // functions (the bootstrap lexer's per-token loop) rely on it for depth.
  _curry:
    "const _curry = (n, f) => function c(...a) { if (a.length < n) return (...b) => c(...a, ...b); if (a.length === n) return f(...a); return a.slice(n).reduce((g, x) => g(x), f(...a.slice(0, n))); };",
  // Tuple constructor. A tuple erases to a plain JS array `[a, b]`, so JS emit
  // never references this — it stays tree-shaken out. It exists only so the
  // typed runtime (gen-runtime OVERRIDES) can carry a `_tuple` whose rest-param
  // is inferred as a TUPLE (`<T extends unknown[]>(...xs: T): T`). TS emit wraps
  // tuple literals in it (ADR 0036) so tsc keeps `[A, B]` instead of widening a
  // bare `[a, b]` to `(A | B)[]` where no contextual tuple type is in scope.
  _tuple: "const _tuple = (...xs) => xs;",
  // Builtin variant constructors (inlined only when a program uses them and does
  // not declare its own type of that name). Shape matches the @onrails ecosystem.
  Some: 'const Some = (value) => ({ _tag: "Some", value });',
  None: 'const None = { _tag: "None" };',
  Ok: 'const Ok = (value) => ({ _tag: "Ok", value });',
  Err: 'const Err = (error) => ({ _tag: "Err", error });',
  add: "const add = _curry(2, (a, b) => a + b);",
  sub: "const sub = _curry(2, (a, b) => a - b);",
  mul: "const mul = _curry(2, (a, b) => a * b);",
  div: "const div = _curry(2, (a, b) => a / b);",
  square: "const square = (x) => x * x;",
  sqrt: "const sqrt = (x) => Math.sqrt(x);",
  hypot: "const hypot = _curry(2, (a, b) => Math.hypot(a, b));",
  pi: "const pi = Math.PI;",
  concat:
    'const concat = _curry(2, (a, b) => (typeof a === "string" ? a + b : Array.isArray(a) ? a.concat(b) : _List_concat(a, b)));',
  // Structural deep equality: primitives by ===, arrays/records/variants by
  // recursion. Functions/Set/Map fall back to reference identity.
  eq: 'const eq = _curry(2, (x, y) => { if (x === y) return true; if (typeof x !== "object" || x === null || typeof y !== "object" || y === null) return false; const ax = Array.isArray(x); if (ax !== Array.isArray(y)) return false; if (ax) { if (x.length !== y.length) return false; for (let i = 0; i < x.length; i++) if (!eq(x[i], y[i])) return false; return true; } const kx = Object.keys(x), ky = Object.keys(y); if (kx.length !== ky.length) return false; for (const k of kx) if (!eq(x[k], y[k])) return false; return true; });',
  // Structural total order → -1 | 0 | 1. Numbers/strings/bools compare directly,
  // arrays lexicographically, everything else by a stable JSON fallback.
  compare:
    'const compare = _curry(2, (x, y) => { if (x === y) return 0; const t = typeof x; if (t === "number" || t === "string" || t === "boolean") return x < y ? -1 : x > y ? 1 : 0; if (Array.isArray(x) && Array.isArray(y)) { const n = Math.min(x.length, y.length); for (let i = 0; i < n; i++) { const c = compare(x[i], y[i]); if (c !== 0) return c; } return compare(x.length, y.length); } const sx = JSON.stringify(x), sy = JSON.stringify(y); return sx < sy ? -1 : sx > sy ? 1 : 0; });',
  // Structural display: primitives via String (strings quoted), arrays
  // bracketed, variants as `Ctor(args)`, records as `{ k: v }`. Tuples are JS
  // arrays at runtime, so they show as `[a, b]`. Set/Map/functions fall back
  // to String(x).
  show: 'const show = (x) => { const t = typeof x; if (t === "string") return JSON.stringify(x); if (t !== "object" || x === null) return String(x); if (Array.isArray(x)) return "[" + x.map(show).join(", ") + "]"; if (typeof x._tag === "string") { const ks = Object.keys(x).filter((k) => k !== "_tag"); return ks.length === 0 ? x._tag : x._tag + "(" + ks.map((k) => show(x[k])).join(", ") + ")"; } const ks = Object.keys(x); if (ks.length === 0) return String(x); return "{ " + ks.map((k) => k + ": " + show(x[k])).join(", ") + " }"; };',
  lt: "const lt = _curry(2, (a, b) => a < b);",
  gt: "const gt = _curry(2, (a, b) => a > b);",
  gte: "const gte = _curry(2, (a, b) => a >= b);",
  lte: "const lte = _curry(2, (a, b) => a <= b);",
  not: "const not = (b) => !b;",
  and: "const and = _curry(2, (a, b) => a && b);",
  or: "const or = _curry(2, (a, b) => a || b);",
  // --- Math ---
  min: "const min = _curry(2, (a, b) => Math.min(a, b));",
  max: "const max = _curry(2, (a, b) => Math.max(a, b));",
  pow: "const pow = _curry(2, (a, b) => a ** b);",
  mod: "const mod = _curry(2, (a, b) => ((a % b) + b) % b);",
  abs: "const abs = (x) => Math.abs(x);",
  floor: "const floor = (x) => Math.floor(x);",
  ceil: "const ceil = (x) => Math.ceil(x);",
  round: "const round = (x) => Math.round(x);",
  sign: "const sign = (x) => Math.sign(x);",
  negate: "const negate = (x) => -x;",
  // Curried (data-last) to compose with `|>`; each takes the collection last.
  length: "const length = (xs) => xs.length;",
  map: "const map = _curry(2, (f, xs) => xs.map((x) => f(x)));",
  filter: "const filter = _curry(2, (f, xs) => xs.filter((x) => f(x)));",
  reduce: "const reduce = _curry(3, (f, init, xs) => xs.reduce((acc, x) => f(acc)(x), init));",
  identity: "const identity = (x) => x;",
  always: "const always = _curry(2, (x, _y) => x);",
  compose: "const compose = _curry(3, (f, g, x) => f(g(x)));",
  capitalize: "const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);",
  // --- List (lazy sequence) — generator-backed; producers/slicers stay lazy ---
  range:
    "const range = _curry(2, (lo, hi) => _list(function* () { for (let i = lo; i < hi; i++) yield i; }));",
  iterate:
    "const iterate = _curry(2, (f, x) => _list(function* () { let v = x; for (;;) { yield v; v = f(v); } }));",
  repeat: "const repeat = (x) => _list(function* () { for (;;) yield x; });",
  take: "const take = _curry(2, (n, xs) => _list(function* () { let i = 0; for (const x of xs) { if (i >= n) break; yield x; i++; } }));",
  takeWhile:
    "const takeWhile = _curry(2, (p, xs) => _list(function* () { for (const x of xs) { if (!p(x)) break; yield x; } }));",
  drop: "const drop = _curry(2, (n, xs) => _list(function* () { let i = 0; for (const x of xs) { if (i < n) { i++; continue; } yield x; } }));",
  fromArray: "const fromArray = (xs) => _list(function* () { yield* xs; });",
  toArray: "const toArray = (xs) => [...xs];",
  // Lazy List transformers — accessed qualified (`List.map`), never shadow the
  // eager Array `map`/`filter`. Each stays lazy (fuses, no intermediate arrays).
  _List_map:
    "const _List_map = _curry(2, (f, xs) => _list(function* () { for (const x of xs) yield f(x); }));",
  _List_filter:
    "const _List_filter = _curry(2, (p, xs) => _list(function* () { for (const x of xs) if (p(x)) yield x; }));",
  _List_concat:
    "const _List_concat = _curry(2, (xs, ys) => _list(function* () { yield* xs; yield* ys; }));",
  _List_flatMap:
    "const _List_flatMap = _curry(2, (f, xs) => _list(function* () { for (const x of xs) yield* f(x); }));",
  // --- Set ops (native JS Set; immutable — each returns a fresh Set) ---
  _Set_has: "const _Set_has = _curry(2, (x, s) => s.has(x));",
  _Set_add: "const _Set_add = _curry(2, (x, s) => new Set(s).add(x));",
  _Set_delete:
    "const _Set_delete = _curry(2, (x, s) => { const n = new Set(s); n.delete(x); return n; });",
  _Set_size: "const _Set_size = (s) => s.size;",
  _Set_toArray: "const _Set_toArray = (s) => [...s];",
  _Set_fromArray: "const _Set_fromArray = (xs) => new Set(xs);",
  _Set_union: "const _Set_union = _curry(2, (a, b) => new Set([...a, ...b]));",
  _Set_intersect:
    "const _Set_intersect = _curry(2, (a, b) => new Set([...a].filter((x) => b.has(x))));",
  _Set_diff: "const _Set_diff = _curry(2, (a, b) => new Set([...a].filter((x) => !b.has(x))));",
  // --- Map ops (native JS Map; immutable — each returns a fresh Map) ---
  _Map_has: "const _Map_has = _curry(2, (k, m) => m.has(k));",
  _Map_getOr: "const _Map_getOr = _curry(3, (d, k, m) => (m.has(k) ? m.get(k) : d));",
  _Map_set:
    "const _Map_set = _curry(3, (k, v, m) => { const n = new Map(m); n.set(k, v); return n; });",
  _Map_delete:
    "const _Map_delete = _curry(2, (k, m) => { const n = new Map(m); n.delete(k); return n; });",
  _Map_size: "const _Map_size = (m) => m.size;",
  _Map_keys: "const _Map_keys = (m) => [...m.keys()];",
  _Map_values: "const _Map_values = (m) => [...m.values()];",
  _Map_get: "const _Map_get = _curry(2, (k, m) => (m.has(k) ? Some(m.get(k)) : None));",
  // --- Option combinators (`Option.*`) — data-last, the Option comes final so
  // they slot into `|>` chains; runtime shape matches @onrails/maybe ---
  _Option_map:
    'const _Option_map = _curry(2, (f, o) => (o._tag === "Some" ? Some(f(o.value)) : None));',
  _Option_flatMap:
    'const _Option_flatMap = _curry(2, (f, o) => (o._tag === "Some" ? f(o.value) : None));',
  _Option_mapOr:
    'const _Option_mapOr = _curry(3, (d, f, o) => (o._tag === "Some" ? f(o.value) : d));',
  _Option_exists: 'const _Option_exists = _curry(2, (p, o) => o._tag === "Some" && p(o.value));',
  _Option_contains:
    'const _Option_contains = _curry(2, (x, o) => o._tag === "Some" && eq(x, o.value));',
  _Option_unwrapOr:
    'const _Option_unwrapOr = _curry(2, (d, o) => (o._tag === "Some" ? o.value : d));',
  _Option_orElse: 'const _Option_orElse = _curry(2, (fb, o) => (o._tag === "Some" ? o : fb));',
  _Option_isSome: 'const _Option_isSome = (o) => o._tag === "Some";',
  _Option_isNone: 'const _Option_isNone = (o) => o._tag === "None";',
  // --- Result combinators (`Result.*`) — railway ops; shape matches @onrails/result ---
  _Result_map: 'const _Result_map = _curry(2, (f, r) => (r._tag === "Ok" ? Ok(f(r.value)) : r));',
  _Result_mapErr:
    'const _Result_mapErr = _curry(2, (f, r) => (r._tag === "Err" ? Err(f(r.error)) : r));',
  _Result_flatMap:
    'const _Result_flatMap = _curry(2, (f, r) => (r._tag === "Ok" ? f(r.value) : r));',
  _Result_unwrapOr:
    'const _Result_unwrapOr = _curry(2, (d, r) => (r._tag === "Ok" ? r.value : d));',
  _Result_isOk: 'const _Result_isOk = (r) => r._tag === "Ok";',
  _Result_isErr: 'const _Result_isErr = (r) => r._tag === "Err";',
  // --- Option-returning safe accessors (depend on Some/None) ---
  _List_head: "const _List_head = (xs) => { for (const x of xs) return Some(x); return None; };",
  _Array_head: "const _Array_head = (xs) => (xs.length > 0 ? Some(xs[0]) : None);",
  _Array_get:
    "const _Array_get = _curry(2, (i, xs) => (i >= 0 && i < xs.length ? Some(xs[i]) : None));",
  _Array_find:
    "const _Array_find = _curry(2, (p, xs) => { for (const x of xs) if (p(x)) return Some(x); return None; });",
  // --- Array growth (eager, immutable) ---
  _Array_reverse: "const _Array_reverse = (xs) => [...xs].reverse();",
  _Array_concat: "const _Array_concat = _curry(2, (xs, ys) => xs.concat(ys));",
  _Array_append: "const _Array_append = _curry(2, (x, xs) => [...xs, x]);",
  _Array_prepend: "const _Array_prepend = _curry(2, (x, xs) => [x, ...xs]);",
  _Array_flatMap: "const _Array_flatMap = _curry(2, (f, xs) => xs.flatMap((x) => f(x)));",
  _Array_take: "const _Array_take = _curry(2, (n, xs) => xs.slice(0, n));",
  _Array_drop: "const _Array_drop = _curry(2, (n, xs) => xs.slice(n));",
  _Array_tail: "const _Array_tail = (xs) => xs.slice(1);",
  // structural eq/compare-driven ops
  _Array_contains: "const _Array_contains = _curry(2, (x, xs) => xs.some((y) => eq(x, y)));",
  _Array_sort: "const _Array_sort = (xs) => [...xs].sort(compare);",
  _Array_sortBy:
    "const _Array_sortBy = _curry(2, (f, xs) => [...xs].sort((a, b) => compare(f(a), f(b))));",
  _Array_dedupe:
    "const _Array_dedupe = (xs) => xs.filter((x, i) => xs.findIndex((y) => eq(x, y)) === i);",
  _Array_dedupeBy:
    "const _Array_dedupeBy = _curry(2, (f, xs) => { const seen = []; return xs.filter((x) => { const k = f(x); if (seen.some((s) => eq(s, k))) return false; seen.push(k); return true; }); });",
  _Array_max:
    "const _Array_max = (xs) => xs.length ? Some(xs.reduce((a, b) => compare(a, b) >= 0 ? a : b)) : None;",
  _Array_min:
    "const _Array_min = (xs) => xs.length ? Some(xs.reduce((a, b) => compare(a, b) <= 0 ? a : b)) : None;",
  _Array_maxBy:
    "const _Array_maxBy = _curry(2, (f, xs) => xs.length ? Some(xs.reduce((a, b) => compare(f(a), f(b)) >= 0 ? a : b)) : None);",
  _Array_minBy:
    "const _Array_minBy = _curry(2, (f, xs) => xs.length ? Some(xs.reduce((a, b) => compare(f(a), f(b)) <= 0 ? a : b)) : None);",
  // --- String ops ---
  _Str_length: "const _Str_length = (s) => s.length;",
  _Str_concat: "const _Str_concat = _curry(2, (a, b) => a + b);",
  _Str_toUpper: "const _Str_toUpper = (s) => s.toUpperCase();",
  _Str_toLower: "const _Str_toLower = (s) => s.toLowerCase();",
  _Str_trim: "const _Str_trim = (s) => s.trim();",
  _Str_split: "const _Str_split = _curry(2, (sep, s) => s.split(sep));",
  _Str_join: "const _Str_join = _curry(2, (sep, xs) => xs.join(sep));",
  _Str_contains: "const _Str_contains = _curry(2, (needle, s) => s.includes(needle));",
  _Str_startsWith: "const _Str_startsWith = _curry(2, (p, s) => s.startsWith(p));",
  _Str_endsWith: "const _Str_endsWith = _curry(2, (p, s) => s.endsWith(p));",
  _Str_slice: "const _Str_slice = _curry(3, (start, end, s) => s.slice(start, end));",
  _Str_replace: "const _Str_replace = _curry(3, (find, repl, s) => s.replaceAll(find, repl));",
  // --- char cursor: bounds-safe indexed access returns Option ---
  _Str_get: "const _Str_get = _curry(2, (i, s) => (i >= 0 && i < s.length ? Some(s[i]) : None));",
  _Str_codeAt:
    "const _Str_codeAt = _curry(2, (i, s) => (i >= 0 && i < s.length ? Some(s.charCodeAt(i)) : None));",
  _Str_fromCode: "const _Str_fromCode = (n) => String.fromCharCode(n);",
  _Str_chars: "const _Str_chars = (s) => [...s];",
  _Str_toNumber:
    "const _Str_toNumber = (s) => { const n = Number(s); return Number.isNaN(n) ? None : Some(n); };",
};

// Runtime-dependency graph: a def name → the other def names its body references.
// `preludePreamble` takes the transitive closure over this before inlining, so a
// referenced op drags in the helpers/constructors it needs (`_Map_get` → Some/None,
// `range` → `_list`, …). Entries with no deps may be omitted. Every arity-≥2 def
// depends on `_curry` (it is wrapped in it).
export const runtimeDeps: Record<string, string[]> = {
  add: ["_curry"],
  sub: ["_curry"],
  mul: ["_curry"],
  div: ["_curry"],
  concat: ["_curry", "_List_concat"],
  hypot: ["_curry"],
  eq: ["_curry"],
  compare: ["_curry"],
  lt: ["_curry"],
  gt: ["_curry"],
  min: ["_curry"],
  max: ["_curry"],
  pow: ["_curry"],
  mod: ["_curry"],
  map: ["_curry"],
  filter: ["_curry"],
  reduce: ["_curry"],
  always: ["_curry"],
  compose: ["_curry"],
  range: ["_list", "_curry"],
  iterate: ["_list", "_curry"],
  repeat: ["_list"],
  take: ["_list", "_curry"],
  takeWhile: ["_list", "_curry"],
  drop: ["_list", "_curry"],
  fromArray: ["_list"],
  _List_map: ["_list", "_curry"],
  _List_filter: ["_list", "_curry"],
  _List_concat: ["_list", "_curry"],
  _List_flatMap: ["_list", "_curry"],
  _Set_has: ["_curry"],
  _Set_add: ["_curry"],
  _Set_delete: ["_curry"],
  _Set_union: ["_curry"],
  _Set_intersect: ["_curry"],
  _Set_diff: ["_curry"],
  _Map_has: ["_curry"],
  _Map_getOr: ["_curry"],
  _Map_set: ["_curry"],
  _Map_delete: ["_curry"],
  _Map_get: ["Some", "None", "_curry"],
  gte: ["_curry"],
  lte: ["_curry"],
  and: ["_curry"],
  or: ["_curry"],
  _Option_map: ["Some", "None", "_curry"],
  _Option_flatMap: ["None", "_curry"],
  _Option_mapOr: ["_curry"],
  _Option_exists: ["_curry"],
  _Option_contains: ["eq", "_curry"],
  _Option_unwrapOr: ["_curry"],
  _Option_orElse: ["_curry"],
  _Result_map: ["Ok", "_curry"],
  _Result_mapErr: ["Err", "_curry"],
  _Result_flatMap: ["_curry"],
  _Result_unwrapOr: ["_curry"],
  _List_head: ["Some", "None"],
  _Array_head: ["Some", "None"],
  _Array_get: ["Some", "None", "_curry"],
  _Array_find: ["Some", "None", "_curry"],
  _Array_concat: ["_curry"],
  _Array_append: ["_curry"],
  _Array_prepend: ["_curry"],
  _Array_flatMap: ["_curry"],
  _Array_take: ["_curry"],
  _Array_drop: ["_curry"],
  _Array_contains: ["eq", "_curry"],
  _Array_dedupe: ["eq"],
  _Array_dedupeBy: ["eq", "_curry"],
  _Array_sort: ["compare"],
  _Array_sortBy: ["compare", "_curry"],
  _Array_max: ["compare", "Some", "None"],
  _Array_min: ["compare", "Some", "None"],
  _Array_maxBy: ["compare", "Some", "None", "_curry"],
  _Array_minBy: ["compare", "Some", "None", "_curry"],
  _Str_concat: ["_curry"],
  _Str_split: ["_curry"],
  _Str_join: ["_curry"],
  _Str_contains: ["_curry"],
  _Str_startsWith: ["_curry"],
  _Str_endsWith: ["_curry"],
  _Str_slice: ["_curry"],
  _Str_replace: ["_curry"],
  _Str_get: ["Some", "None", "_curry"],
  _Str_codeAt: ["Some", "None", "_curry"],
  _Str_toNumber: ["Some", "None"],
};

// Qualified collection namespaces. mochi has no overloading, so each collection
// carries its own `Ns.op`; the unqualified `map`/`filter`/… above stay as eager
// Array aliases for the common case. `Array.map` mirrors them; `List.*` is lazy.
export const preludeNamespaces: Record<string, Record<string, Type>> = {
  Array: {
    map: tArrow(tArrow(a, b), tArrow(arr(a), arr(b))),
    filter: tArrow(tArrow(a, tBool), tArrow(arr(a), arr(a))),
    reduce: tArrow(tArrow(b, tArrow(a, b)), tArrow(b, tArrow(arr(a), b))),
    length: tArrow(arr(a), tNumber),
    head: tArrow(arr(a), opt(a)), // [a] -> Option a
    get: tArrow(tNumber, tArrow(arr(a), opt(a))), // number -> [a] -> Option a (bounds-safe)
    find: tArrow(tArrow(a, tBool), tArrow(arr(a), opt(a))), // (a -> bool) -> [a] -> Option a
    reverse: tArrow(arr(a), arr(a)), // [a] -> [a]
    concat: tArrow(arr(a), tArrow(arr(a), arr(a))), // [a] -> [a] -> [a]
    append: tArrow(a, tArrow(arr(a), arr(a))), // a -> [a] -> [a]
    prepend: tArrow(a, tArrow(arr(a), arr(a))), // a -> [a] -> [a]  (cons)
    flatMap: tArrow(tArrow(a, arr(b)), tArrow(arr(a), arr(b))), // (a -> [b]) -> [a] -> [b]
    take: tArrow(tNumber, tArrow(arr(a), arr(a))), // number -> [a] -> [a]
    drop: tArrow(tNumber, tArrow(arr(a), arr(a))), // number -> [a] -> [a]
    tail: tArrow(arr(a), arr(a)), // [a] -> [a]  (drop first; [] stays [])
    // structural eq/compare-driven ops (the -By family takes a projection)
    contains: tArrow(a, tArrow(arr(a), tBool)), // a -> [a] -> bool  (structural eq)
    sort: tArrow(arr(a), arr(a)), // [a] -> [a]  (structural order)
    sortBy: tArrow(tArrow(a, b), tArrow(arr(a), arr(a))), // (a -> b) -> [a] -> [a]
    dedupe: tArrow(arr(a), arr(a)), // [a] -> [a]  (structural eq)
    dedupeBy: tArrow(tArrow(a, b), tArrow(arr(a), arr(a))), // (a -> b) -> [a] -> [a]
    max: tArrow(arr(a), opt(a)), // [a] -> Option a
    min: tArrow(arr(a), opt(a)), // [a] -> Option a
    maxBy: tArrow(tArrow(a, b), tArrow(arr(a), opt(a))), // (a -> b) -> [a] -> Option a
    minBy: tArrow(tArrow(a, b), tArrow(arr(a), opt(a))), // (a -> b) -> [a] -> Option a
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
  // Option combinators — data-last (Option comes final) for `|>` chains.
  // The ctors (Some/None) stay unqualified builtins; only the combinators are
  // namespaced. `contains` uses structural eq.
  Option: {
    map: tArrow(tArrow(a, b), tArrow(opt(a), opt(b))), // (a -> b) -> Option a -> Option b
    flatMap: tArrow(tArrow(a, opt(b)), tArrow(opt(a), opt(b))), // (a -> Option b) -> Option a -> Option b
    mapOr: tArrow(b, tArrow(tArrow(a, b), tArrow(opt(a), b))), // fallback -> (a -> b) -> Option a -> b
    exists: tArrow(tArrow(a, tBool), tArrow(opt(a), tBool)), // (a -> bool) -> Option a -> bool
    contains: tArrow(a, tArrow(opt(a), tBool)), // a -> Option a -> bool  (structural eq)
    unwrapOr: tArrow(a, tArrow(opt(a), a)), // fallback -> Option a -> a
    orElse: tArrow(opt(a), tArrow(opt(a), opt(a))), // fallback -> Option a -> Option a
    isSome: tArrow(opt(a), tBool), // Option a -> bool
    isNone: tArrow(opt(a), tBool), // Option a -> bool
  },
  // Result combinators — the railway ops the compiler itself lives on.
  Result: {
    map: tArrow(tArrow(a, b), tArrow(res(a, c), res(b, c))), // (a -> b) -> Result a e -> Result b e
    mapErr: tArrow(tArrow(c, b), tArrow(res(a, c), res(a, b))), // (e -> f) -> Result a e -> Result a f
    flatMap: tArrow(tArrow(a, res(b, c)), tArrow(res(a, c), res(b, c))), // (a -> Result b e) -> Result a e -> Result b e
    unwrapOr: tArrow(a, tArrow(res(a, c), a)), // fallback -> Result a e -> a
    isOk: tArrow(res(a, c), tBool), // Result a e -> bool
    isErr: tArrow(res(a, c), tBool), // Result a e -> bool
  },
  // String ops (`Str.*`). Data-last where a collection/subject is involved.
  Str: {
    length: tArrow(tString, tNumber), // string -> number
    concat: tArrow(tString, tArrow(tString, tString)), // a -> b -> a ++ b
    toUpper: tArrow(tString, tString),
    toLower: tArrow(tString, tString),
    trim: tArrow(tString, tString),
    split: tArrow(tString, tArrow(tString, arr(tString))), // sep -> s -> [string]
    join: tArrow(tString, tArrow(arr(tString), tString)), // sep -> [string] -> string
    contains: tArrow(tString, tArrow(tString, tBool)), // needle -> haystack -> bool
    startsWith: tArrow(tString, tArrow(tString, tBool)), // prefix -> s -> bool
    endsWith: tArrow(tString, tArrow(tString, tBool)), // suffix -> s -> bool
    slice: tArrow(tNumber, tArrow(tNumber, tArrow(tString, tString))), // start -> end -> s -> string
    replace: tArrow(tString, tArrow(tString, tArrow(tString, tString))), // find -> repl -> s -> string
    // --- char cursor (for hand-written scanners / the self-hosted lexer) ---
    get: tArrow(tNumber, tArrow(tString, opt(tString))), // i -> s -> Option string (1-char)
    codeAt: tArrow(tNumber, tArrow(tString, opt(tNumber))), // i -> s -> Option number (char code)
    fromCode: tArrow(tNumber, tString), // code -> string (a 1-char string; no char type)
    chars: tArrow(tString, arr(tString)), // s -> [string] (code-point split)
    toNumber: tArrow(tString, opt(tNumber)), // s -> Option number (None if NaN)
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
    get: "_Array_get",
    find: "_Array_find",
    reverse: "_Array_reverse",
    concat: "_Array_concat",
    append: "_Array_append",
    prepend: "_Array_prepend",
    flatMap: "_Array_flatMap",
    take: "_Array_take",
    drop: "_Array_drop",
    tail: "_Array_tail",
    contains: "_Array_contains",
    sort: "_Array_sort",
    sortBy: "_Array_sortBy",
    dedupe: "_Array_dedupe",
    dedupeBy: "_Array_dedupeBy",
    max: "_Array_max",
    min: "_Array_min",
    maxBy: "_Array_maxBy",
    minBy: "_Array_minBy",
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
  Option: {
    map: "_Option_map",
    flatMap: "_Option_flatMap",
    mapOr: "_Option_mapOr",
    exists: "_Option_exists",
    contains: "_Option_contains",
    unwrapOr: "_Option_unwrapOr",
    orElse: "_Option_orElse",
    isSome: "_Option_isSome",
    isNone: "_Option_isNone",
  },
  Result: {
    map: "_Result_map",
    mapErr: "_Result_mapErr",
    flatMap: "_Result_flatMap",
    unwrapOr: "_Result_unwrapOr",
    isOk: "_Result_isOk",
    isErr: "_Result_isErr",
  },
  Str: {
    length: "_Str_length",
    concat: "_Str_concat",
    toUpper: "_Str_toUpper",
    toLower: "_Str_toLower",
    trim: "_Str_trim",
    split: "_Str_split",
    join: "_Str_join",
    contains: "_Str_contains",
    startsWith: "_Str_startsWith",
    endsWith: "_Str_endsWith",
    slice: "_Str_slice",
    replace: "_Str_replace",
    get: "_Str_get",
    codeAt: "_Str_codeAt",
    fromCode: "_Str_fromCode",
    chars: "_Str_chars",
    toNumber: "_Str_toNumber",
  },
};

// The whole runtime as one blob — for tests / tooling that want every builtin in
// scope regardless of what a snippet references.
export const preludeJs = Object.values(preludeJsDefs).join("\n");
