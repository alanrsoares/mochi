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

// --- records + field access (structural / "duck" data) ---
let origin = { x: 0.0, y: 0.0 }
let getX = p => p.x
let translate = (p, dx, dy) => { x: add(p.x, dx), y: add(p.y, dy) }
let dist = (a, b) => hypot(sub(b.x, a.x), sub(b.y, a.y))

// duck typing: distTo works on ANY record with x and y — regardless of
// what else it carries. (Enforced by the HM inferencer, next slice.)
let distToOrigin = p => hypot(p.x, p.y)

// --- record destructuring in let ---
// `let { x, y } = r` binds x and y from r's fields. r is evaluated once and
// field access is structural, so extra fields on the source are fine.
let corner = { x: 3.0, y: 4.0 }
let { x, y } = corner
let cornerDist = hypot(x, y)

// --- parametric variants: generic sum types ---
// Type parameters follow the name, ML-style. Constructors are inferred
// polymorphic: Ok : a -> Result<a, e>, Err : e -> Result<a, e>.
type Result a e =
  | Ok(a)
  | Err(e)

type Option a =
  | Some(a)
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
