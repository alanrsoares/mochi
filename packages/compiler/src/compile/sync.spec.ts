import { expect, test } from "bun:test";
import { readRepo } from "@mochi/test-support";
import { defaultOptions } from "../extensions/options.ts";
import {
  compileSyncWith,
  compileTargetsSyncWith,
  compileTsSyncWith,
  emitDtsSyncWith,
} from "./sync.ts";

const RUNTIME = "@mochi/runtime";

// One inference prints every target, so each must match its own entrypoint.
test.each(["examples/example.mochi", "examples/jsx.mochi", "examples/pipelines.mochi"])(
  "compileTargets agrees with each single-target entrypoint on %s",
  (path) => {
    const src = readRepo(import.meta.url, path);
    const opts = { ...defaultOptions, docs: true };
    const targets = compileTargetsSyncWith(src, RUNTIME, opts);
    expect(targets).toEqual({
      _tag: "Ok",
      value: {
        js: (compileSyncWith(src, opts) as { value: string }).value,
        ts: (compileTsSyncWith(src, RUNTIME, opts) as { value: string }).value,
        dts: (emitDtsSyncWith(src, RUNTIME, opts) as { value: string }).value,
      },
    });
  },
);

test("compileTargets honours a plugin opt-out", () => {
  const src = "let view = <div>hi</div>";
  const on = compileTargetsSyncWith(src, RUNTIME, defaultOptions);
  const off = compileTargetsSyncWith(src, RUNTIME, {
    ...defaultOptions,
    plugins: [],
  });
  expect(on._tag).toBe("Ok");
  expect(off._tag).toBe("Err");
});

test("compileTargets reports a type error once for every target", () => {
  const r = compileTargetsSyncWith('let x = 1 + "a"', RUNTIME, defaultOptions);
  expect(r).toMatchObject({ _tag: "Err", error: [{ kind: "type" }] });
});
