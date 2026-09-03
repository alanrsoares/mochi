/**
 * Prelude-shaped Task (ADR 0006) — a lazy thunk yielding the compiler
 * runtime's canonical `Result`. Building a Task runs no effect; calling it
 * (or `Task.run` on the mochi side) fires it.
 *
 * This is the one sanctioned `Promise`-of-`Result` in the repo: it mirrors the
 * mochi prelude's `Task<A, E>` runtime shape, which `ResultAsync` does not. The
 * aliased import keeps that intent explicit.
 */
import type { Result, Task } from "@mochi/compiler/runtime";

export { err, ok } from "@onrails/result";
export type { Result, Task };
