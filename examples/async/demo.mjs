// Runs the compiled async pipeline. Build first: `alang build main.al` (writes
// main.js beside this file), then `node demo.mjs`. `result` is the Promise the
// alang program handed back via `run`; awaiting it here is where the effect runs.
import { result } from "./main.js";

console.log("async result:", await result);
