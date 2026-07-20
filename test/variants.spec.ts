// Parametric (generic) variant types + railway-oriented combinators over them.
import { expect, test } from "bun:test";
import { isErr, unwrapOk } from "@onrails/result";
import { match } from "ts-pattern";
import { check } from "../src/check";
import { compile } from "../src/compile";
import { inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeEnv, preludeJs } from "../src/prelude";

const RESULT = "type Result a e = | Ok(a) | Err(e)\n";

const schemeOf = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  const env = unwrapOk(inferProgram(prog, preludeEnv, { open: true }));
  return showScheme(env.get(name)!);
};

// Compile and run, injecting ts-pattern's `match` (the codegen import is stripped).
const run = (src: string, ret: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function("match", `${preludeJs}\n${js}\nreturn ${ret};`)(match);
};

test("a type parameter makes constructors polymorphic", () => {
  expect(schemeOf(RESULT, "Ok")).toMatch(/^'t\d+ -> Result<'t\d+, 't\d+>$/);
  expect(schemeOf(RESULT, "Err")).toMatch(/^'t\d+ -> Result<'t\d+, 't\d+>$/);
});

test("combinators over a generic variant infer their full railway type", () => {
  const src = `${RESULT}let flatMapOk = f => r => switch r { | Ok(v) => f(v) | Err(e) => Err(e) }`;
  // (a -> Result<b, e>) -> Result<a, e> -> Result<b, e>, same vars reused
  const s = schemeOf(src, "flatMapOk");
  const m = s.match(
    /^\('t(\d+) -> Result<'t(\d+), 't(\d+)>\) -> Result<'t\1, 't(\d+)> -> Result<'t\2, 't\3>$/,
  );
  expect(m).not.toBeNull();
});

test("nullary and unary constructors of one generic type unify", () => {
  const src = "type Option a = | Some(a) | None\nlet x = Some(1)\nlet y = None";
  expect(isErr(compile(src))).toBe(false);
});

test("exhaustiveness is enforced on a generic variant", () => {
  const src = `${RESULT}let bad = r => switch r { | Ok(v) => v }`; // missing Err
  const r = compile(src);
  expect(isErr(r)).toBe(true);
});

test("a Result railway stays on the happy track", () => {
  const src = `${RESULT}
let flatMapOk = f => r => switch r { | Ok(v) => f(v) | Err(e) => Err(e) }
let unwrapOr = fb => r => switch r { | Ok(v) => v | Err(e) => fb }
let step = n => Ok(add(n, 1))
let out = Ok(41) |> flatMapOk(step) |> unwrapOr(0)`;
  expect(run(src, "out")).toBe(42);
});

test("an Err short-circuits the rest of the railway", () => {
  const src = `${RESULT}
let flatMapOk = f => r => switch r { | Ok(v) => f(v) | Err(e) => Err(e) }
let unwrapOr = fb => r => switch r { | Ok(v) => v | Err(e) => fb }
let step = n => Ok(add(n, 1))
let out = Err(404) |> flatMapOk(step) |> unwrapOr(0)`;
  expect(run(src, "out")).toBe(0);
});
