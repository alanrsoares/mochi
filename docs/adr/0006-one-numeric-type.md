# 0006 — One numeric type; `int`/`float` are aliases

- **Status:** Accepted
- **Source:** `docs/CRITIQUE.md` §2.3; `src/infer.ts` (`primType`); commit `d996d06`

## Context

JS has a single `number`. alang could either mirror that or model a real `int`/`float`
split. A real split reopens the abstraction-over-types question (see
[0000](0000-open-questions.md)), because `+` would need overloading.

## Decision

One runtime numeric type: `number`. `int` and `float` are **transparent aliases** for
`number` today — identical type-checking, erased to `number` in `.d.ts`. The names are
reserved so a real split can land later without breaking existing source.

## Consequences

- No overloaded arithmetic, no numeric-tower complexity now.
- `int`/`float` annotations read as intent, not a lie — they check as `number`.
- A future split is a non-breaking evolution, not a rewrite.

## Alternatives rejected

A real `int`/`float` split now (ReScript-style) — deferred; it forces overloaded `+`,
which drags in the unresolved abstraction-over-types decision.
