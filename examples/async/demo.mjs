// Runs the compiled async pipelines. Build first: `mochi build main.mochi` (writes
// main.js beside this file), then `node demo.mjs`. Each export is the Promise a
// `Task.run` handed back; awaiting it here is where the effects actually run.
import { everyone, fastest, found, offline, partial, recovered, result } from "./main.js";

console.log("pure pipeline: ", await result);
console.log("happy path:    ", await found);
console.log("recovered 404: ", await recovered);
console.log("still failing: ", await offline);
console.log("fan-out all:   ", await everyone);
console.log("fan-out fails: ", await partial);
console.log("race winner:   ", await fastest);
