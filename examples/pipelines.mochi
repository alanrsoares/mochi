// Pipelines & composition in mochi.
// Everything here type-checks under HM inference and compiles to plain JS.

// ---- function composition (curried combinators) ----
// compose : (b -> c) -> (a -> b) -> (a -> c)   — right-to-left (f after g)
let compose = f => g => x => f(g(x))
// andThen : (a -> b) -> (b -> c) -> (a -> c)   — left-to-right
let andThen = f => g => x => g(f(x))

let inc = x => add(x, 1)
let double = x => mul(x, 2)

// point-free: build a new function without naming its argument
let incThenDouble = compose(double)(inc) // x -> (x + 1) * 2
let composed = incThenDouble(10)          // 22

// ---- long |> pipeline (left-to-right data flow) ----
let piped = 3
  |> inc
  |> double
  |> inc
  |> square // (((3 + 1) * 2) + 1) squared = 81

// ---- railway-oriented programming over Result ----
type Result a e =
  | Ok(a)
  | Err(e)

let mapOk = f => r => switch r {
  | Ok(v) => Ok(f(v))
  | Err(e) => Err(e)
}

let flatMapOk = f => r => switch r {
  | Ok(v) => f(v)
  | Err(e) => Err(e)
}

let unwrapOr = fallback => r => switch r {
  | Ok(v) => v
  | Err(e) => fallback
}

// a validation step: a bool predicate chooses the track, string carries the error
let positive = n => switch gt(n, 0) {
  | true => Ok(n)
  | false => Err("must be positive")
}

let halve = n => Ok(div(n, 2))

// full railway: validate, chain a fallible step, map on the happy track, recover
// 20 -> Ok(20) -> Ok(10) -> Ok(20) -> 20
let happy = 20
  |> positive
  |> flatMapOk(halve)
  |> mapOk(double)
  |> unwrapOr(0)

// the Err from `positive` short-circuits halve and mapOk; unwrapOr recovers
// 0 -> Err("must be positive") -> Err(...) -> Err(...) -> -1
let sad = 0
  |> positive
  |> flatMapOk(halve)
  |> mapOk(double)
  |> unwrapOr(-1)
