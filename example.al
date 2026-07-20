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
