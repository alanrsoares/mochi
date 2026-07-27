/**
 * Preact host adapter (ADR 0015).
 *
 * Kit-owned seam: honest hook schemes in `hooks.mochi`; `inferCall` pins
 * call-site shapes (state/setter, ref.current, effect cleanup, memo thunk).
 */
import type { HostExtension } from "../../../src/extensions";
import { inferPreactCall } from "./infer.ts";

export const preactExtension: HostExtension = {
  name: "preact",
  inferCall: inferPreactCall,
};
