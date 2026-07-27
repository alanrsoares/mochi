/**
 * Preact host adapter (ADR 0015).
 *
 * Kit-owned seam: honest hook schemes in `hooks.mochi`; `inferCall` pins
 * call-site shapes (state/setter, ref.current, effect cleanup, memo thunk).
 */
import type { HostExtension } from "@mochi/compiler/extensions";
import { inferPreactCall, PREACT_HOOK_REFS } from "./infer.ts";

export const preactExtension: HostExtension = {
  name: "preact",
  // Claim: the hook callee names `hooks.mochi` externs expose.
  inferCall: { refs: PREACT_HOOK_REFS, hook: inferPreactCall },
};
