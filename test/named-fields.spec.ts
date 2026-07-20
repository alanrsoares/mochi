// Named constructor fields — `Ok(value: a)` lowers to `{ _tag, value }`,
// matching the @onrails/result + @onrails/maybe runtime shape for interop.
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isOk, map, unwrapOk, unwrapOr } from "@onrails/result";
import { compile } from "../src/compile";
import { emitDts } from "../src/dts";

const js = (src: string): string => unwrapOk(compile(src));
const RESULT = "type Result a e =\n  | Ok(value: a)\n  | Err(error: e)\n";

test("a labelled field lowers to that runtime key", () => {
  expect(js(RESULT)).toContain('const Ok = (value) => ({ _tag: "Ok", value });');
  expect(js(RESULT)).toContain('const Err = (error) => ({ _tag: "Err", error });');
});

test("a pattern destructures by the labelled key", () => {
  const out = js(`${RESULT}let f = r => switch r { | Ok(v) => v | Err(e) => e }`);
  expect(out).toContain('.with({ _tag: "Ok" }, ({ value: v }) => v)');
  expect(out).toContain('.with({ _tag: "Err" }, ({ error: e }) => e)');
});

test("a positional field keeps its `_0` key (back-compat)", () => {
  const out = js("type Box a = | Box(a)\nlet f = b => switch b { | Box(x) => x }");
  expect(out).toContain('const Box = (_0) => ({ _tag: "Box", _0 });');
  expect(out).toContain('.with({ _tag: "Box" }, ({ _0: x }) => x)');
});

test("the .d.ts declares the labelled field name", () => {
  expect(unwrapOk(emitDts(RESULT))).toContain('{ _tag: "Ok"; value: A }');
});

test("an alang-built value flows through @onrails/result combinators", () => {
  const body = js(`${RESULT}let safe = Ok(41)\nlet bad = Err("boom")`).replace(/^import .*$/m, "");
  const { safe, bad } = new Function("match", `${body}\nreturn { safe, bad };`)(match) as {
    safe: unknown;
    bad: unknown;
  };
  expect(isOk(safe as never)).toBe(true);
  expect(map(safe as never, (n: number) => n + 1)).toEqual({ _tag: "Ok", value: 42 } as never);
  expect(unwrapOr(bad as never, -1)).toBe(-1);
});
