import { expect, test } from "bun:test";
import { readRepo } from "@mochi/test-support";
import { defaultBootstrapOptions } from "./options.ts";
import {
  compileBootstrapSyncWith,
  compileTargetsBootstrapSyncWith,
  compileTsBootstrapSyncWith,
  emitDtsBootstrapSyncWith,
} from "./sync.ts";

const RUNTIME = "@mochi/runtime";

// One inference prints every target, so each must match its own entrypoint.
test.each(["examples/example.mochi", "examples/jsx.mochi", "examples/pipelines.mochi"])(
  "compileTargets agrees with each single-target entrypoint on %s",
  (path) => {
    const src = readRepo(import.meta.url, path);
    const opts = { ...defaultBootstrapOptions, docs: true };
    const targets = compileTargetsBootstrapSyncWith(src, RUNTIME, opts);
    expect(targets).toEqual({
      _tag: "Ok",
      value: {
        js: (compileBootstrapSyncWith(src, opts) as { value: string }).value,
        ts: (compileTsBootstrapSyncWith(src, RUNTIME, opts) as { value: string }).value,
        dts: (emitDtsBootstrapSyncWith(src, RUNTIME, opts) as { value: string }).value,
      },
    });
  },
);

test("compileTargets honours a plugin opt-out", () => {
  const src = "let view = <div>hi</div>";
  const on = compileTargetsBootstrapSyncWith(src, RUNTIME, defaultBootstrapOptions);
  const off = compileTargetsBootstrapSyncWith(src, RUNTIME, {
    ...defaultBootstrapOptions,
    plugins: [],
  });
  expect(on._tag).toBe("Ok");
  expect(off._tag).toBe("Err");
});

test("compileTargets reports a type error once for every target", () => {
  const r = compileTargetsBootstrapSyncWith('let x = 1 + "a"', RUNTIME, defaultBootstrapOptions);
  expect(r).toMatchObject({ _tag: "Err", error: [{ kind: "type" }] });
});
