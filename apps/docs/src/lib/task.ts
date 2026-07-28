/**
 * Prelude-shaped Task (ADR 0006) — a lazy thunk yielding `@onrails/result`'s
 * `Result` (`{ _tag: "Ok" | "Err" }`, same shape the compiler emits for the
 * prelude's `Ok` / `Err` ctors). Building a Task runs no effect; calling it
 * (or `Task.run` on the mochi side) fires it.
 *
 * This is the one sanctioned `Promise`-of-`Result` in the repo: it mirrors the
 * mochi prelude's `Task a e` runtime shape, which `ResultAsync` does not. The
 * aliased import keeps that intent explicit.
 */
import type { Result as PreludeResult } from "@onrails/result";

export type Task<A, E> = () => Promise<PreludeResult<A, E>>;

export { err, ok, type Result } from "@onrails/result";
