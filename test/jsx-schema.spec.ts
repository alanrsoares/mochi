// ADR 0097 — `packages/compiler/src/extensions/plugins/jsx-schema.ts` is the one
// source of truth for the intrinsic JSX element schema, and
// `bootstrap/plugins/jsx-schema.gen.mjs` is its projection across the self-host's
// host seam.
//
// Two guards:
//  1. PARITY — regenerating must reproduce the checked-in file byte for byte.
//     Add an attribute without running `bun run gen:jsx-schema` and this fails,
//     which is what stops the two implementations from forking. `fixpoint`
//     cannot cover it: the schema is data behind an `extern`, so both stages
//     read the same stale file and agree with each other.
//  2. COVERAGE — every kind the schema can produce is one the self-hosted plugin
//     knows how to read, so a new kind cannot land as a silently-ignored
//     attribute on the mirror side.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { INTRINSIC_ELEMENTS } from "@mochi/compiler/plugins/jsx-schema";
import { repoRoot } from "@mochi/test-support";
import { buildSchemaSource, GEN_PATH } from "../scripts/gen-jsx-schema";

const root = repoRoot(import.meta.url);

/** The kinds `attrKindType` / `validateIntrinsicProp` both branch on. */
const KNOWN_KINDS = new Set([
  "string",
  "number",
  "bool",
  "string|number",
  "string|bool",
  "event",
  "any",
]);

test("jsx-schema.gen.mjs is up to date (regenerate matches checked-in file)", () => {
  expect(buildSchemaSource()).toEqual(readFileSync(join(root, GEN_PATH), "utf8"));
});

test("every attribute kind in the schema is one both implementations read", () => {
  const unknown = new Set<string>();
  for (const schema of Object.values(INTRINSIC_ELEMENTS))
    for (const attr of Object.values(schema))
      if (typeof attr === "string" && !KNOWN_KINDS.has(attr)) unknown.add(attr);
  expect([...unknown]).toEqual([]);
});

test("the generated seam carries every tag the schema declares", () => {
  const gen = readFileSync(join(root, GEN_PATH), "utf8");
  for (const tag of Object.keys(INTRINSIC_ELEMENTS))
    expect(gen).toContain(`[${JSON.stringify(tag)}, _t`);
});
