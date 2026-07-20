// alang — showcase of every feature built so far.

// --- variants (sum types) ---
type Shape =
  | Circle(float)
  | Rect(float, float)
  | Triangle(float, float)

type Color =
  | Red
  | Green
  | Blue

// --- lambdas + pipelines ---
let double = x => mul(x, 2)
let inc = x => add(x, 1)
let pipeline = 5 |> double |> inc |> double

// --- multi-arg lambda ---
let hypot = (a, b) => sqrt(add(square(a), square(b)))

// --- pattern matching: exhaustive over a variant ---
let area = shape => switch shape {
  | Circle(r) => mul(pi, square(r))
  | Rect(w, h) => mul(w, h)
  | Triangle(b, h) => mul(0.5, mul(b, h))
}

// --- wildcard catch-all ---
let isRound = shape => switch shape {
  | Circle(r) => true
  | _ => false
}

// --- literal patterns + catch-all ---
let describe = n => switch n {
  | 0 => zero
  | 1 => one
  | _ => many
}

// --- bind catch-all (names the scrutinee) ---
let label = color => switch color {
  | Red => hot
  | other => cool
}

// --- match feeding a pipeline ---
let report = shape => shape |> area |> format

// --- mutual recursion: isEven calls isOdd, defined AFTER it ---
// Top-level bindings are grouped into recursive components and inferred
// together, so forward and mutual references type-check (both : number -> bool).
let isEven = n => switch n {
  | 0 => true
  | _ => isOdd(sub(n, 1))
}
let isOdd = n => switch n {
  | 0 => false
  | _ => isEven(sub(n, 1))
}

// --- list literals: homogeneous, inferred as [elem] ---
// `[1, 2, 3]` is a JS array at runtime; the inferencer requires every element
// to share one type, so `nums : [number]` and `grid : [[number]]`.
let nums = [1, 2, 3]
let grid = [[1, 2], [3, 4]]
let empty = []

// --- prelude list utilities (ported from prelude-js), data-last + curried ---
// map/filter/reduce/length take the list LAST, so they slot into a `|>` chain.
// [1,2,3,4] -> double -> [2,4,6,8] -> keep >4 -> [6,8] -> sum -> 14
let dbl = x => mul(x, 2)
let over4 = x => gt(x, 4)
let plus = a => b => add(a, b)
let total = [1, 2, 3, 4] |> map(dbl) |> filter(over4) |> reduce(plus)(0)
let count = nums |> length
let shout = capitalize("hello")

// --- list destructuring in switch: [], [x], [head, ...tail] ---
// The ML idiom: an empty-list arm plus a single-head cons arm is exhaustive
// (covers length 0 and length >= 1). `sum` recurses down the tail.
let sum = xs => switch xs {
  | [] => 0
  | [head, ...tail] => add(head, sum(tail))
}
let listTotal = sum([1, 2, 3, 4]) // 10

// fixed-length arms narrow by exact length; `_` catches the rest
let describeList = xs => switch xs {
  | [] => empty2
  | [x] => single
  | [a, b] => pair
  | _ => many2
}

// --- lazy List: `@{...}` (distinct from the eager Array `[...]`) ---
// A List is a generator-backed pull-sequence: producers/slicers stay lazy, so
// infinite streams work as long as you only ever pull a finite prefix. `@` is
// the List sigil. Map has its own literal `#{...}`; Set has no literal sigil.
let ns = @{1, 2, 3}                       // List number  (lazy)
let firstThree = range(0)(100) |> take(3) // 0..99 built lazily, only 3 forced
let evens = iterate(x => add(x, 2))(0)    // INFINITE: 0, 2, 4, 6, ...
let evens5 = evens |> take(5) |> toArray  // [0, 2, 4, 6, 8] — take makes it safe
let small = range(0)(100) |> takeWhile(x => lt(x, 4)) |> toArray // [0, 1, 2, 3]

// destructuring a List: the same ML idiom as Array, but pull-based. The empty
// `@{}` arm plus a single-head cons `@{head, ...tail}` is total; `tail` is the
// lazy remainder, so recursion consumes the sequence one element at a time.
let sumList = xs => switch xs {
  | @{} => 0
  | @{head, ...tail} => add(head, sumList(tail))
}
let listSum = sumList(@{1, 2, 3, 4}) // 10

// --- qualified collection namespaces: `List.map`, `Array.map` ---
// No overloading, so each collection carries its own ops. `List.*` transformers
// stay lazy and FUSE — `map |> filter` builds no intermediate array; nothing is
// computed until `toArray` (or a `take`) pulls. `Array.*` mirror the eager
// unqualified `map`/`filter`. `List`/`Array`/`Set`/`Map` are reserved names.
let triple = x => mul(x, 3)
let over6 = x => gt(x, 6)
let fused = @{1, 2, 3, 4} |> List.map(triple) |> List.filter(over6) |> toArray // [9, 12]
let joined = List.concat(@{1, 2})(@{3, 4}) |> toArray                          // [1,2,3,4]
let spread = List.flatMap(x => @{x, x})(@{1, 2}) |> toArray                    // [1,1,2,2]

// lazy all the way: map over an INFINITE sequence, force only the first 3
let inf3 = iterate(inc)(0) |> List.map(triple) |> take(3) |> toArray // [0, 3, 6]

// --- Set: `Set.fromArray([...])` — native JS Set, deduped, unordered ---
// No literal sigil (dropped `${…}` — it collides with JS template literals).
// Elements must share a type. Ops are qualified + immutable (return a fresh Set).
let tags = Set.fromArray([1, 2, 2, 3])                                  // Set number — dedups to {1,2,3}
let hasTwo = Set.has(2)(tags)                             // true
let merged = Set.union(Set.fromArray([1, 2]))(Set.fromArray([2, 3])) |> Set.toArray  // [1, 2, 3]
let shared = Set.intersect(Set.fromArray([1, 2, 3]))(Set.fromArray([2, 3, 4])) |> Set.toArray // [2, 3]

// --- Map: `#{ key: value }` (native JS Map) ---
// Keys share a type, values share a type → Map k v. `getOr` reads with a
// fallback (an Option-returning `get` waits on the prelude slice). Immutable.
let ages = #{ "alice": 30, "bob": 25 }
let alice = Map.getOr(0)("alice")(ages)   // 30
let nobody = Map.getOr(0)("carol")(ages)  // 0 — fallback
let withCarol = Map.set("carol")(41)(ages) // fresh Map; `ages` unchanged
let names = Map.keys(ages)                 // ["alice", "bob"]

// --- prelude: Math, String (`Str.*`), grown Array, builtin Option ---
// Math ops are unqualified (like add/sub); String is the `Str.*` namespace.
let clamped = max(0, min(100, 137))        // 100
let modulo = mod(negate(1), 3)             // 2 — true modulo (sign of divisor)
let slug = "  Hello World  " |> Str.trim |> Str.toLower |> Str.split(" ") // ["hello","world"]
let shout2 = Str.join(" ")(["alang", "rocks"]) |> Str.toUpper            // "ALANG ROCKS"
let flipped = Array.reverse([1, 2, 3]) |> Array.append(0)               // [3, 2, 1, 0]

// builtin Option — `Map.get`/`Array.head` return Option, no `type` decl needed.
// (This file declares its own Option/Result below; the builtin is used when a
// program doesn't. Either way Some/None share one runtime shape.)
let lookedUp = Map.get("alice")(ages)      // Option number
let firstName = Array.head(names)          // Option string

// --- structural eq/compare (polymorphic, no typeclasses) ---
// eq/compare work at ANY type by deep structural walk — the pragmatic bridge
// instead of typeclasses (keeps the emitted JS free of hidden dictionaries).
// The -By family takes an explicit projection = dictionary-passing by hand.
let sameRec = eq({ x: 1, y: 2 }, { x: 1, y: 2 })  // true — structural, not by ref
let sorted = Array.sort([3, 1, 2])                // [1, 2, 3]
let byMod = Array.sortBy(x => mod(x, 3))([5, 3, 7]) // sort by x % 3
let unique = Array.dedupe([1, 1, 2, 3, 3])        // [1, 2, 3]
let member = Array.contains({ id: 2 })([{ id: 1 }, { id: 2 }]) // true

// --- named record types (transparent aliases) ---
// `type Point = { x, y }` names a structural row. NO nominal identity, NO
// runtime: inference expands it, and hover / .d.ts FOLD a matching closed
// record back to the name. So `origin` below reads as `Point` (not `{ x:
// number, y: number }`) and the emitted .d.ts exports a real `Point` type.
// Aliases are generic too — `Boxed a` applied shows as `Boxed<number>`.
type Point = { x: number, y: number }
type Boxed a = { value: a }
let boxedNum = { value: 42 } // hovers as Boxed<number>

// --- records + field access (structural / "duck" data) ---
let origin = { x: 0.0, y: 0.0 }
let getX = p => p.x
// destructuring lambda param: pulls x, y straight out of the argument record
let dist2 = ({ x, y }) => hypot(x, y)
let translate = (p, dx, dy) => { x: add(p.x, dx), y: add(p.y, dy) }
let dist = (a, b) => hypot(sub(b.x, a.x), sub(b.y, a.y))

// duck typing: distTo works on ANY record with x and y — regardless of
// what else it carries. (Enforced by the HM inferencer, next slice.)
let distToOrigin = p => hypot(p.x, p.y)

// --- record patterns in switch: bind fields, narrow on literals ---
// `{ x, y }` puns both fields into scope; a literal field (`x: 0`) narrows the
// match. Patterns are shallow — a field binds or matches a literal, never nests.
let quadrant = p => switch p {
  | { x: 0, y: 0 } => atOrigin
  | { x, y } => elsewhere
}

// string + record narrowing: match a tagged record on its string discriminant,
// binding the rest of the fields on the matched arm.
let handle = event => switch event {
  | { kind: "click", x, y } => hypot(x, y)
  | { kind: "scroll", by } => by
  | _ => zero
}

// --- record destructuring in let ---
// `let { x, y } = r` binds x and y from r's fields. r is evaluated once and
// field access is structural, so extra fields on the source are fine.
let corner = { x: 3.0, y: 4.0 }
let { x, y } = corner
let cornerDist = hypot(x, y)

// --- parametric variants: generic sum types ---
// Type parameters follow the name, ML-style. Constructors are inferred
// polymorphic: Ok : a -> Result<a, e>, Err : e -> Result<a, e>.
// Named fields (`value`/`error`) make the runtime shape identical to
// @onrails/result + @onrails/maybe, so alang values flow straight through
// their combinators (map/flatMap/unwrapOr) at the JS boundary.
type Result a e =
  | Ok(value: a)
  | Err(error: e)

type Option a =
  | Some(value: a)
  | None

// --- railway-oriented programming: combinators over Result ---
// Curried on purpose (f => r => ...), so partial application composes with the
// `|>` pipe — the essence of ROP. Inferred types:
// mapOk    : (a -> b) -> Result<a, e> -> Result<b, e>
// flatMapOk: (a -> Result<b, e>) -> Result<a, e> -> Result<b, e>
// mapErr   : (e -> f) -> Result<a, e> -> Result<a, f>
let mapOk = f => r => switch r {
  | Ok(v) => Ok(f(v))
  | Err(e) => Err(e)
}

let flatMapOk = f => r => switch r {
  | Ok(v) => f(v)
  | Err(e) => Err(e)
}

let mapErr = f => r => switch r {
  | Ok(v) => Ok(v)
  | Err(e) => Err(f(e))
}

let unwrapOr = fallback => r => switch r {
  | Ok(v) => v
  | Err(e) => fallback
}

// --- a railway: chain steps that each may fail, short-circuit on Err ---
// Each step returns a Result; flatMapOk stays on the happy track and skips the
// rest the moment a step yields Err. (No boolean-literal patterns yet, so steps
// build Ok/Err directly rather than branching on a predicate.)
let addOne = n => Ok(add(n, 1))
let halve = n => Ok(div(n, 2))

// happy track: Ok(41) -> Ok(42) -> Ok(21) -> 21
let happy = Ok(41) |> flatMapOk(addOne) |> flatMapOk(halve)
let value = happy |> unwrapOr(0)

// sad track: the Err (error code 404) short-circuits both steps; unwrapOr
// supplies the fallback
let sad = Err(404) |> flatMapOk(addOne) |> flatMapOk(halve)
let recovered = sad |> unwrapOr(0)
