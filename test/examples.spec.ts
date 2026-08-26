// The checked-in example files must always compile, and the pipelines example
// must produce its documented results — a guard against language regressions.

import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { compile } from "@mochi/compiler/compile";
import { compileTargets } from "@mochi/compiler/compile-targets";
import { emitDts } from "@mochi/compiler/dts";
import { buildModules } from "@mochi/compiler/module";
import { readRepo, repoPath } from "@mochi/test-support";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";

const read = (p: string): string => readRepo(import.meta.url, p);
const path = (p: string): string => repoPath(import.meta.url, p);

test("example.mochi compiles", () => {
  expect(isErr(compile(read("examples/example.mochi")))).toBe(false);
});

test("examples/life/main.mochi builds with the Bun terminal bindings", async () => {
  const result = await buildModules(path("examples/life/main.mochi"), (p) => Bun.file(p).text());
  expect(isErr(result)).toBe(false);
});

test("Bun terminal binding settles Err on a forced write failure", async () => {
  const host = await import("@mochi/bun/runtime");
  const writes: string[] = [];
  const orig = process.stdout.write;
  process.stdout.write = ((chunk: string | Uint8Array) => {
    writes.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString());
    return true;
  }) as typeof process.stdout.write;
  try {
    host.__forceFailNextWrite();
    expect(await host.draw("label", "frame")()).toEqual({
      _tag: "Err",
      error: "forced write failure",
    });
    expect(writes).toEqual([]);
    // Cleared after one shot — next draw is Ok again.
    expect(await host.draw("label", "frame")()).toEqual({ _tag: "Ok", value: undefined });
    expect(writes.some((w) => w.includes("label"))).toBe(true);
  } finally {
    process.stdout.write = orig;
  }
});

test("examples/pipelines.mochi compiles and produces its documented values", () => {
  // Output is standalone (prelude inlined) — only the @onrails/pattern import is
  // stripped, and `match` injected in its place.
  const js = unwrapOk(compile(read("examples/pipelines.mochi"))).replace(/^import .*$/m, "");
  const out = new Function("match", `${js}\nreturn { composed, piped, happy, sad };`)(
    match,
  ) as Record<string, number>;
  expect(out).toEqual({ composed: 22, piped: 81, happy: 20, sad: -1 });
});

test("examples/interop exercises typed JS extern conventions at runtime", () => {
  const js = unwrapOk(compile(read("examples/interop/main.mochi"))).replace(
    'import { Vector3 as $vector3 } from "three";',
    "const $vector3 = class { constructor(x, y, z) { this.x = x; this.y = y; this.z = z; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } };",
  );
  const out = new Function(`${js}\nreturn { displayName, renamed, sampled, epoch, pointX };`)() as {
    displayName: string;
    renamed: string;
    sampled: number;
    epoch: Date;
    pointX: number;
  };
  expect(out.displayName).toBe("Mochi");
  expect(out.renamed).toBe("Mochi");
  expect(out.sampled).toBeGreaterThanOrEqual(0);
  expect(out.sampled).toBeLessThan(1);
  expect(out.epoch.getTime()).toBe(0);
  expect(out.pointX).toBe(4);
});

/**
 * Compile examples/async and hand its exports back. Prelude `Task.*` is inlined,
 * but the two domain effects are `extern`s — stripping the imports leaves them
 * free, so the real host module is injected in their place.
 */
const runAsyncExample = async (): Promise<Record<string, Promise<unknown>>> => {
  const js = unwrapOk(compile(read("examples/async/main.mochi")))
    .replace(/^import .*$/gm, "")
    .replace(/^export /gm, "");
  const host = await import(path("examples/async/runtime.mjs"));
  return new Function(
    "match",
    "fetchUser",
    "fetchPlan",
    `${js}\nreturn { result, found, recovered, offline, everyone, partial, fastest };`,
  )(match, host.fetchUser, host.fetchPlan) as Record<string, Promise<unknown>>;
};

test("examples/async composes a typed Task pipeline that runs to its value", async () => {
  // Pipeline: of(20) -> +1 -> delay -> *2.
  expect(await (await runAsyncExample()).result).toEqual({ _tag: "Ok", value: 42 });
});

test("examples/async carries failures on Task's error channel (ADR 0006)", async () => {
  const out = await runAsyncExample();
  expect(await out.found).toEqual({ _tag: "Ok", value: "Ada is on the pro plan" });
  // A 404 is recovered on the error track; an unreachable host stays an Err.
  expect(await out.recovered).toEqual({
    _tag: "Ok",
    value: "user 7 has no plan — showing the demo one",
  });
  expect(await out.offline).toEqual({
    _tag: "Err",
    error: { _tag: "Offline", _0: "network down" },
  });
});

test("examples/async fans out with Task.all/traverse/race (ADR 0074)", async () => {
  const out = await runAsyncExample();
  // traverse keeps INPUT order and collects into one Ok.
  expect(await out.everyone).toEqual({ _tag: "Ok", value: ["Ada", "Ada"] });
  // Fail-fast: the 404 settles the whole fan-out on the error track.
  expect(await out.partial).toEqual({ _tag: "Err", error: { _tag: "NotFound", _0: 7 } });
  // race settles on the first task to settle, not the first in the array.
  expect(await out.fastest).toEqual({ _tag: "Ok", value: "quick" });
});

test("examples/modules builds the whole graph and wires imports", async () => {
  const outs = unwrapOk(
    await buildModules(path("examples/modules/main.mochi"), (p) =>
      Promise.resolve(readFileSync(p, "utf8")),
    ),
  );
  const main = outs.find((o) => o.path.endsWith("main.mochi"))!.js;
  const geometry = outs.find((o) => o.path.endsWith("geometry.mochi"))!.js;
  expect(main).toContain('import { area, hypot, Circle, Rect } from "./geometry.js";');
  expect(geometry).toContain("export const area");
});

// A worked multi-module example for C5: with `import * as D`, every type ./shapes
// exports is writable as `D.T` in any type position — nullary and applied variants
// cross nominally, and a transparent record alias EXPANDS across the edge (aliases
// are structural, ADR 0005). Checked in as `examples/qualified-types/`, so the
// bootstrap differential corpus (which globs every `.mochi` in the repo) also
// exercises the self-hosted graph's qualified-type path (C5 slice d).
test("a graph naming imported TYPES through a namespace alias builds (C5 slice b)", async () => {
  const outs = unwrapOk(
    await buildModules(path("examples/qualified-types/main.mochi"), (p) =>
      Promise.resolve(readFileSync(p, "utf8")),
    ),
  );
  const main = outs.find((o) => o.path.endsWith("main.mochi"))!.js;
  // `import * as D` is type-only, so it contributes no value import of its own;
  // the ctors and `area` arrive through the ordinary named import.
  expect(main).toContain('import { area, Circle, Rect, Box } from "./shapes.js";');
  expect(main).not.toContain("D.");
});

// ADR 0055 — the blessed prop-contract exemplar: the annotated docs component
// keeps its alias name in the sidecar (not an open props bag), so the TSX
// consumer (Playground.tsx) is checked against the mochi contract.
test("annotated docs component sidecar names its Props alias (ADR 0055)", () => {
  const src = read("apps/docs/src/components/PlaygroundView.mochi");
  const dts = unwrapOk(emitDts(src));
  expect(dts).toContain("export type Props = {");
  expect(dts).toContain("(props: Props) => any");
  expect(dts).not.toContain("Record<string, unknown>");
});

test("docs tour snippets compile (source of HighlightCode panels)", () => {
  for (const name of ["variants", "records", "jsx"] as const) {
    const src = read(`apps/docs/src/examples/${name}.mochi`);
    const r = compile(src);
    expect(isErr(r), `${name}.mochi: ${isErr(r) ? JSON.stringify(r.error) : ""}`).toBe(false);
  }
});

test("docs playground presets emit every displayed target", () => {
  for (const name of ["jsx", "result", "task", "row-poly", "fib"] as const) {
    const src = read(`apps/docs/src/examples/presets/${name}.mochi`);
    const result = compileTargets(src, { runtime: true });
    expect(
      isErr(result),
      `presets/${name}.mochi: ${isErr(result) ? JSON.stringify(result.error) : ""}`,
    ).toBe(false);
    if (isErr(result)) continue;
    expect(result.value.js.trim().length, `${name} JavaScript is empty`).toBeGreaterThan(0);
    expect(result.value.ts.trim().length, `${name} TypeScript is empty`).toBeGreaterThan(0);
    expect(result.value.dts.trim().length, `${name} .d.ts is empty`).toBeGreaterThan(0);
  }
});
