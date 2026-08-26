/**
 * The prelude: builtin signatures the inferencer starts with, plus the JS
 * runtime that backs them.
 */
import type { Ctor, TypeExpr } from "../ast/ast";
import { type Type, tArrow, tBool, tCon, tNumber, tString, tUnit, tVar } from "../ast/types";
// Imported as well as re-exported below: `preludeJs` and `runtimeArity` are
// derived from the same generated table.
import { preludeJsDefs } from "./js-defs.gen";

const bin = (a: Type, b: Type, r: Type): Type => tArrow(a, tArrow(b, r));
const num2 = bin(tNumber, tNumber, tNumber);
const cmp = bin(tNumber, tNumber, tBool);

/**
 * Polymorphic prelude type vars. Ids below the inference fresh-supply start
 * (1000) are safe: builtins generalize then instantiate fresh per use.
 */
const a = tVar(0);
const b = tVar(1);
const c = tVar(2);
const d = tVar(3);
const arr = (t: Type): Type => tCon("Array", [t]);
const list = (t: Type): Type => tCon("List", [t]);
const set = (t: Type): Type => tCon("Set", [t]);
const mapT = (k: Type, v: Type): Type => tCon("Map", [k, v]);
const opt = (t: Type): Type => tCon("Option", [t]);
const res = (t: Type, e: Type): Type => tCon("Result", [t, e]);
const task = (t: Type, e: Type): Type => tCon("Task", [t, e]);
const promise = (t: Type): Type => tCon("Promise", [t]);

/**
 * Builtin variant types — seeded when a program doesn't declare the same name.
 * Runtime shape matches @onrails/result + @onrails/maybe.
 */
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

/**
 * name → type. Curried (data-last) so builtins compose with `|>`.
 * Monomorphic entries carry no vars; polymorphic ones generalize at bind time.
 */
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

  // The sanctioned discard (ADR 0054): drop the value an effectful call happens
  // to return. `ignore(f())` is the honest spelling of `let _ = f() in ()`.
  ignore: tArrow(a, tUnit), // a -> ()

  lt: cmp,
  gt: cmp,
  gte: cmp,
  lte: cmp,
  // Bool combinators — eager, not short-circuit (operands are values).
  not: tArrow(tBool, tBool),
  and: bin(tBool, tBool, tBool),
  or: bin(tBool, tBool, tBool),
  min: num2,
  max: num2,
  pow: num2,
  mod: num2, // a -> b -> number  (true modulo, sign of b)
  abs: tArrow(tNumber, tNumber),
  floor: tArrow(tNumber, tNumber),
  ceil: tArrow(tNumber, tNumber),
  round: tArrow(tNumber, tNumber),
  sign: tArrow(tNumber, tNumber),
  negate: tArrow(tNumber, tNumber),
  length: tArrow(arr(a), tNumber), // [a] -> number
  map: tArrow(tArrow(a, b), tArrow(arr(a), arr(b))), // (a -> b) -> [a] -> [b]
  filter: tArrow(tArrow(a, tBool), tArrow(arr(a), arr(a))), // (a -> bool) -> [a] -> [a]
  reduce: tArrow(tArrow(b, tArrow(a, b)), tArrow(b, tArrow(arr(a), b))), // (b -> a -> b) -> b -> [a] -> b
  identity: tArrow(a, a), // a -> a
  always: tArrow(a, tArrow(b, a)), // a -> b -> a  (prelude-js `const`)
  compose: tArrow(tArrow(b, c), tArrow(tArrow(a, b), tArrow(a, c))), // (b -> c) -> (a -> b) -> a -> c
  capitalize: tArrow(tString, tString),
  range: tArrow(tNumber, tArrow(tNumber, list(tNumber))), // number -> number -> List number
  iterate: tArrow(tArrow(a, a), tArrow(a, list(a))), // (a -> a) -> a -> List a  (infinite)
  repeat: tArrow(a, list(a)), // a -> List a  (infinite)
  take: tArrow(tNumber, tArrow(list(a), list(a))), // number -> List a -> List a
  takeWhile: tArrow(tArrow(a, tBool), tArrow(list(a), list(a))), // (a -> bool) -> List a -> List a
  drop: tArrow(tNumber, tArrow(list(a), list(a))), // number -> List a -> List a
  fromArray: tArrow(arr(a), list(a)), // [a] -> List a
  toArray: tArrow(list(a), arr(a)), // List a -> [a]  (materializes — infinite hangs)
};

/**
 * The JS backend view of the runtime — def text keyed by name (so codegen inlines
 * only what a program references) and the reference graph that closes over those
 * picks. Both are DERIVED from the typed runtime `runtime.ts`, which is the source
 * of truth (ADR 0075); regenerate with `bun run gen:prelude-defs`.
 */
export { preludeJsDefs, runtimeDeps } from "./js-defs.gen";

/**
 * Qualified collection namespaces. Unqualified `map`/`filter`/… stay as eager Array aliases.
 */
export const preludeNamespaces: Record<string, Record<string, Type>> = {
  Array: {
    map: tArrow(tArrow(a, b), tArrow(arr(a), arr(b))),
    filter: tArrow(tArrow(a, tBool), tArrow(arr(a), arr(a))),
    reduce: tArrow(tArrow(b, tArrow(a, b)), tArrow(b, tArrow(arr(a), b))),
    length: tArrow(arr(a), tNumber),
    head: tArrow(arr(a), opt(a)), // [a] -> Option a
    get: tArrow(tNumber, tArrow(arr(a), opt(a))), // number -> [a] -> Option a (bounds-safe)
    forEach: tArrow(tArrow(a, tUnit), tArrow(arr(a), tUnit)), // (a -> unit) -> [a] -> unit — effect iteration (ADR 0056)
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
  // Task — opaque lazy async values (`() => Promise<Result<a, e>>`, ADR 0006).
  // Not a tagged variant. `andThen` (not `flatMap`) matches examples/async
  // vocabulary (ADR 0005).
  Task: {
    of: tArrow(a, task(a, c)), // a -> Task a e
    fail: tArrow(c, task(a, c)), // e -> Task a e
    map: tArrow(tArrow(a, b), tArrow(task(a, c), task(b, c))), // (a -> b) -> Task a e -> Task b e
    mapErr: tArrow(tArrow(c, b), tArrow(task(a, c), task(a, b))), // (e -> f) -> Task a e -> Task a f
    andThen: tArrow(tArrow(a, task(b, c)), tArrow(task(a, c), task(b, c))), // (a -> Task b e) -> Task a e -> Task b e
    recover: tArrow(tArrow(c, task(a, b)), tArrow(task(a, c), task(a, b))), // (e -> Task a f) -> Task a e -> Task a f
    fromResult: tArrow(res(a, c), task(a, c)), // Result a e -> Task a e
    match: tArrow(tArrow(a, b), tArrow(tArrow(c, b), tArrow(task(a, c), task(b, d)))), // (a -> f) -> (e -> f) -> Task a e -> Task f g  (terminal fold, stays a Task per ADR 0006)
    delay: tArrow(tNumber, tArrow(a, task(a, c))), // number -> a -> Task a e  (_curry; ADR 0005)
    run: tArrow(task(a, c), promise(res(a, c))), // Task a e -> Promise (Result a e)  (only kick-off)
    // Fan-out (ADR 0074): fail-fast, input-ordered, in-flight tasks abandoned.
    all: tArrow(arr(task(a, c)), task(arr(a), c)), // [Task a e] -> Task [a] e
    race: tArrow(arr(task(a, c)), task(a, c)), // [Task a e] -> Task a e  (first to SETTLE)
    traverse: tArrow(tArrow(a, task(b, c)), tArrow(arr(a), task(arr(b), c))), // (a -> Task b e) -> [a] -> Task [b] e  (_curry)
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
    // Char cursor (hand-written scanners / self-hosted lexer).
    get: tArrow(tNumber, tArrow(tString, opt(tString))), // i -> s -> Option string (1-char)
    codeAt: tArrow(tNumber, tArrow(tString, opt(tNumber))), // i -> s -> Option number (char code)
    fromCode: tArrow(tNumber, tString), // code -> string (a 1-char string; no char type)
    chars: tArrow(tString, arr(tString)), // s -> [string] (code-point split)
    toNumber: tArrow(tString, opt(tNumber)), // s -> Option number (None if NaN)
  },
};

/** `Ns.member` → JS identifier codegen emits. Array reuses eager defs; List → `_List_*`. */
export const namespaceRuntime: Record<string, Record<string, string>> = {
  Array: {
    map: "map",
    filter: "filter",
    reduce: "reduce",
    length: "length",
    head: "_Array_head",
    get: "_Array_get",
    forEach: "_Array_forEach",
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
  Task: {
    of: "_Task_of",
    fail: "_Task_fail",
    map: "_Task_map",
    mapErr: "_Task_mapErr",
    andThen: "_Task_andThen",
    recover: "_Task_recover",
    fromResult: "_Task_fromResult",
    match: "_Task_match",
    delay: "_Task_delay",
    run: "_Task_run",
    all: "_Task_all",
    race: "_Task_race",
    traverse: "_Task_traverse",
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

/** Whole runtime as one blob — for tests / tooling that need every builtin in scope. */
export const preludeJs = Object.values(preludeJsDefs).join("\n");

/**
 * Emitted arity of one runtime definition: `_curry(N, …)` states it; a bare
 * `(a, b) => …` counts its outer params; anything else (a value like `pi`, a
 * nullary ctor) is 0.
 */
const arityOfDef = (def: string): number => {
  const curried = def.match(/=\s*_curry\((\d+),/);
  if (curried) return Number(curried[1]);
  const arrow = def.match(/^const \w+ = \(([^)]*)\) =>/);
  if (!arrow) return 0;
  const ps = arrow[1]!.trim();
  return ps === "" ? 0 : ps.split(",").length;
};

/**
 * Runtime id → how many arguments the builtin takes in ONE flat call. Derived
 * from the emitted definitions, so it is what the runtime actually accepts
 * rather than what the HM type suggests (`unit` domains and callback results make
 * those differ). Consumed by the runtime-annotation check and by the formatter's call
 * canonicalization (ADR 0065).
 */
export const runtimeArity: Record<string, number> = Object.fromEntries(
  Object.entries(preludeJsDefs).map(([id, def]) => [id, arityOfDef(def)]),
);
