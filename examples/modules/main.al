// The entry module. It imports the constructors and `area` from ./geometry —
// their inferred types cross the module boundary, so `area(circle)` is checked
// against Shape here even though `area` lives in another file.
import { area, hypot, Circle, Rect } from "./geometry"

extern log : string -> number -> number = "./runtime.js" "log"

let circle = Circle(2.0)
let rect = Rect(3.0, 4.0)

// area : Shape -> number, imported and applied to locally-built shapes.
let circleArea = area(circle)
let rectArea = area(rect)
let diagonal = hypot(3.0, 4.0)

// Build the program with `alang build examples/modules/main.al`, then run
// `bun examples/modules/main.js` — it prints these three values.
let a = log("circle area:", circleArea)
let b = log("rect area:", rectArea)
let c = log("diagonal:", diagonal)
