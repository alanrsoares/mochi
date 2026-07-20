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
