// Async in alang WITHOUT an async/await keyword. A `Task a` is an ordinary
// value — the applied-constructor type from an `extern` — so asynchrony
// composes through the same `|>` pipeline as everything else. The host runtime
// (./task.js) supplies the primitives; `run` hands the underlying Promise back
// to JS at the edge, which is the only place effects actually happen.
extern add : number -> number -> number = "./task.js" "add"
extern of : a -> Task a = "./task.js" "of"
extern mapT : (a -> b) -> Task a -> Task b = "./task.js" "mapT"
extern andThen : (a -> Task b) -> Task a -> Task b = "./task.js" "andThen"
extern delay : number -> a -> Task a = "./task.js" "delay"
extern run : Task a -> Promise a = "./task.js" "run"

// of(20) -> +1 -> (10ms later) same -> doubled = 42. Each stage is typed:
// `mapT` keeps it a Task; `andThen` sequences one Task after another.
let program =
  of(20)
  |> mapT(add(1))
  |> andThen(delay(10))
  |> mapT(x => add(x)(x))

// `alang build main.al`, then `node demo.mjs` — prints 42.
export let result = run(program)
