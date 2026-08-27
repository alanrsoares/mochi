# 0079 — `let?` dispatches between `Option` and `Result`

- **Status:** Accepted
- **Date:** 2026-08-27
- **Source:** tracker ticket C3; `bootstrap/{parser,infer,codegen}.mochi`; `packages/compiler/src/{ast,infer,codegen}/`

## Context

`let?` was specified as Result-only while `let!` was Task-only. Adding Option
with a third sigil would create an unbounded syntax family for the same bind
operation. The typechecker already learns the source value's instantiated type
before it checks the bind body, and codegen has the inferred-node information
needed to select the matching runtime helper.

## Decision

`let? pattern = value in body` dispatches from the resolved head constructor of
`value`:

- `Option a` binds `Some(a)`, short-circuits `None`, and requires an `Option b`
  body.
- `Result a e` binds `Ok(a)`, short-circuits `Err(e)`, and requires a
  `Result b e` body.

The head constructor of `value` selects the monad. `Option a` binds `Some(a)`.
`Result a e` binds `Ok(a)`. An unresolved type variable defaults to Result —
the parser tags `let?` as Result, and Option dispatch requires a resolved
`Option` head. Every other head reports that `let?` requires `Option` or
`Result`. A chain cannot implicitly mix the two: its inner bind body must have
the same monad as its outer bind. Use an explicit conversion such as
`Result.fromOption` when crossing the boundary.

`let!` remains Task-only. The bind sigil set is permanently capped at `let?`
and `let!`.

## Consequences

- `let?` has one familiar spelling for the two synchronous short-circuiting
  data types without a magical error conversion.
- Inference records the selected helper for code generation, so JS and typed TS
  lower deterministically to `_Option_flatMap` or `_Result_flatMap`.
- The self-hosted compiler carries the same inference-to-codegen selection,
  preserving fixpoint parity.

## Alternatives rejected

**A third Option sigil.** It extends a syntax family without adding semantics.

**Implicit Option-to-Result lifting.** It invents an error value and hides a
meaningful boundary.

**Runtime tag dispatch.** It defers an inference error to runtime and prevents
the strict TS backend from selecting a concrete helper.
