// The runtime's public annotations, rendered from the HM signatures.
//
// `packages/compiler/src/prelude/runtime.ts` is hand-written source (ADR 0075),
// so nothing forces its annotations to agree with `preludeEnv` /
// `preludeNamespaces` any more — this module is that force. It renders what each
// `export const` annotation SHOULD say, and `test/runtime-types.spec.ts` compares
// it against what the file does say. A builtin whose HM type moves fails there
// with the exact replacement text.
//
// Recipe per builtin: `export const NAME: <flat HM type> = <body>`. The public
// annotation gives importers real types; the body's own params are `any` (the
// annotation is the contract, and the JS-backend differential tests are what
// prove the body correct).
import { flatFnType } from "@mochi/compiler/dts";
import {
  namespaceRuntime,
  preludeEnv,
  preludeNamespaces,
  runtimeArity,
} from "@mochi/compiler/prelude";
import type { Type } from "@mochi/compiler/types";

// jsId → HM type: top-level builtins by name, plus every namespace member keyed
// by its runtime identifier (`Map.get` → `_Map_get`).
const jsIdType = (): Map<string, Type> => {
  const out = new Map<string, Type>(Object.entries(preludeEnv));
  for (const [ns, members] of Object.entries(namespaceRuntime))
    for (const [member, jsId] of Object.entries(members)) {
      const sig = (preludeNamespaces[ns] as Record<string, Type> | undefined)?.[member];
      if (sig && !out.has(jsId)) out.set(jsId, sig);
    }
  return out;
};

// Builtin ctor factory types — stable (4 entries), hardcoded like infer.mochi's
// `builtinTypeDecls` precedent rather than derived.
const CTOR_TYPES: Record<string, string> = {
  Some: "<A>(value: A) => Option<A>",
  None: "Option<never>",
  Ok: "<A, B>(value: A) => Result<A, B>",
  Err: "<A, B>(error: B) => Result<A, B>",
};

/**
 * Structural helpers with no HM signature — they are runtime plumbing (currying,
 * tuples, the loop/recur step protocol), not builtins a program can name, so
 * their types are hand-written and simply exempt from the drift check.
 */
export const UNTYPED_BY_HM: readonly string[] = ["_list", "_tuple", "_recur", "_done", "_curry"];

/** The annotation `runtime.ts` should carry for `jsId`, or `null` when exempt. */
export const expectedAnnotation = (jsId: string): string | null => {
  if (UNTYPED_BY_HM.includes(jsId)) return null;
  if (CTOR_TYPES[jsId]) return CTOR_TYPES[jsId] as string;
  const sig = jsIdType().get(jsId);
  return sig ? flatFnType(sig, runtimeArity[jsId] ?? 0) : null;
};
