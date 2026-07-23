// North-star guard for the TS-emit track (ADR 0026): the self-hosted `bootstrap/`
// graph must emit TypeScript that `tsc --strict` accepts. As of ADR 0044 it IS
// strict-clean (0 errors) — this now guards against regression: the count may
// never rise. Reproduce/inspect with `bun run bootstrap:tsc`.
import { expect, test } from "bun:test";
import { bootstrapTsc } from "../scripts/bootstrap-tsc";

// Lower this as levers land; never raise it to make a regression pass.
const CEILING = 0; // ADR 0044 (binding type annotations): 1 → 0 — bootstrap is strict-clean.

test("bootstrap emits within the tsc-error ceiling (ratchet)", async () => {
  const { total, byCode } = await bootstrapTsc();
  // Surface the breakdown on failure so the diff is legible in CI output.
  expect({ total, byCode }).toMatchObject({ total: expect.any(Number) });
  expect(total).toBeLessThanOrEqual(CEILING);
}, 30_000);
