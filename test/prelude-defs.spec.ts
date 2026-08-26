// ADR 0075 — `packages/compiler/src/prelude/runtime.ts` is the runtime's source
// of truth and `js-defs.gen.ts` is that module with its types stripped.
//
// Three guards:
//  1. PARITY — regenerating must reproduce the checked-in generated file byte for
//     byte. Edit the runtime without running `bun run gen:prelude-defs` and this
//     fails, which is what stops the two backends from forking.
//  2. TYPES — every public annotation still says what the HM signature says.
//  3. SHAPE — the derived dependency graph is closed: nothing a def references
//     is missing from the table codegen inlines from.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { preludeJsDefs, runtimeDeps } from "@mochi/compiler/prelude";
import { repoRoot } from "@mochi/test-support";
import { buildDefsSource, DEFS_PATH, RUNTIME_PATH } from "../scripts/gen-prelude-defs";
import { expectedAnnotation } from "../scripts/runtime-types";

const root = repoRoot(import.meta.url);

test("js-defs.gen.ts is up to date (regenerate matches checked-in file)", () => {
  expect(buildDefsSource()).toEqual(readFileSync(join(root, DEFS_PATH), "utf8"));
});

test("runtime annotations match the HM signatures they are rendered from", () => {
  const src = readFileSync(join(root, RUNTIME_PATH), "utf8");
  // `export const NAME: TYPE = ` — the annotation runs to the top-level `=`, so
  // an annotation containing `=` (arrow types) needs the depth walk below. It may
  // also be wrapped across lines by the formatter, hence the whitespace-blind
  // comparison: this guards the TYPE, not how biome chose to print it.
  const drift: string[] = [];
  for (const head of src.matchAll(/^export const (\w+): /gm)) {
    const name = head[1] as string;
    const expected = expectedAnnotation(name);
    if (expected === null) continue;
    const actual = annotationOf(src.slice((head.index as number) + head[0].length));
    if (compact(actual) !== compact(expected))
      drift.push(`${name}\n  is:        ${actual}\n  should be: ${expected}`);
  }
  expect(drift).toEqual([]);
});

/**
 * Layout-blind form: wrapping, and the trailing separators the formatter adds or
 * drops with it (`; }` vs `}`), are not drift.
 */
const compact = (type: string): string => type.replace(/\s+/g, "").replace(/[,;](?=[)}\]>])/g, "");

/** Text up to the assignment `=`, ignoring the `=` inside `=>` and nested brackets. */
const annotationOf = (rest: string): string => {
  let depth = 0;
  for (let i = 0; i < rest.length; i++) {
    const ch = rest[i] as string;
    // `=>` is an arrow, not a closing angle bracket — skip its `>`.
    if (ch === ">" && rest[i - 1] === "=") continue;
    if ("<({[".includes(ch)) depth += 1;
    else if (">)}]".includes(ch)) depth -= 1;
    else if (ch === "=" && depth === 0 && rest[i + 1] !== ">") return rest.slice(0, i).trim();
  }
  return rest.trim();
};

test("every dependency a def declares is itself a def codegen can inline", () => {
  const names = new Set(Object.keys(preludeJsDefs));
  for (const [name, deps] of Object.entries(runtimeDeps)) {
    expect(names.has(name)).toBe(true);
    for (const dep of deps) expect(names.has(dep)).toBe(true);
  }
});
