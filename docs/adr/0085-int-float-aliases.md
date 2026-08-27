# 0085 — `int` and `float` are documentation aliases of `number`

- **Status:** Accepted
- **Date:** 2026-08-27
- **Source:** tracker C10 / C11; `packages/compiler/src/infer/schemes.ts` (`primType`);
  `packages/compiler/src/ast/ctors.ts` (`PRIM_TYPE_NAMES`)
- **Amends:** none

## Context

JS has one numeric type. A surface split into `int` and `float` would need
coercion rules, literal defaulting, and an overloaded `+`. The names were
already accepted in type position so a later split would not break existing
signatures. `let z : int = 2.5` typechecks; the annotation erases to `number`
in `.d.ts`.

## Decision

**One runtime numeric type: `number`.** `int` and `float` are transparent
aliases — they unify with `number` and with each other, and they erase.
They document intent, not a checked restriction. A real int/float split
(integer ops vs IEEE double) stays deferred; it would reopen overloading
of `+`.

## Consequences

- `let z : int = 2.5` is legal. Do not cite `int` as a range check.
- Docs must say "aliases, zero semantics" next to the names, or readers
  assume OCaml/ReScript ints.

## Alternatives rejected

**Reject `int`/`float` until a real split lands.** Breaks existing
annotations that already use the names as intent labels.

**Check `int` now (no fractional part).** A silent second numeric lattice
without operator overloading; `2.0` vs `2` becomes a trap, and `+` still
has to pick a rule.
