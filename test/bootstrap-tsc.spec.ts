// North-star guard for the TS-emit track (ADR 0026): the self-hosted `bootstrap/`
// graph must emit TypeScript that `tsc --strict` accepts. It isn't strict-clean
// yet, so this is a RATCHET — the error count may only go down. When a lever
// lands and lowers it, drop CEILING to the new number so a future regression that
// re-introduces errors fails here. Reproduce/inspect with `bun run bootstrap:tsc`.
import { expect, test } from "bun:test";
import { bootstrapTsc } from "../scripts/bootstrap-tsc";

// Lower this as levers land; never raise it to make a regression pass.
const CEILING = 8; // ADR 0040 (generalize under the substitution): 14 → 8.

test("bootstrap emits within the tsc-error ceiling (ratchet)", async () => {
  const { total, byCode } = await bootstrapTsc();
  // Surface the breakdown on failure so the diff is legible in CI output.
  expect({ total, byCode }).toMatchObject({ total: expect.any(Number) });
  expect(total).toBeLessThanOrEqual(CEILING);
}, 30_000);
