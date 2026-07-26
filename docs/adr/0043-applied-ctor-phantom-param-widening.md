# 0043 — Applied-constructor phantom type param widens to `unknown`

- **Status:** Accepted
- **Source:** `src/codegen.ts:111`, `src/codegen-ts.ts:257`, `src/dts.ts:213,220` (commit a43721c), `test/ts-emit-tsc.spec.ts:196`

## Context

An applied parametric constructor call (`Ok(x)`, `Err(e)`) has one phantom
type parameter it doesn't carry a runtime value for (`Ok`'s error type,
`Err`'s ok type) — the applied-call analogue of ADR-0039's nullary-ctor case
and ADR-0035's empty-seed case. Left unannotated, `tsc` can't infer that
phantom parameter and either errors or infers something narrower than the
call site actually needs, e.g. rejecting `Ok("") as Result<string, string>`
against a recursive branch's differently-inferred `Result<string, string>`.

## Decision

Annotate an applied constructor call's phantom type parameter explicitly at
codegen — using the concrete type from the inference table's per-node type
table when the node is fully concrete, and widening to `unknown` otherwise
(rather than leaving it to `tsc`'s own, less-informed inference). This is
the applied-ctor analogue of ADR-0039's nullary-ctor rule.

## Consequences

- `Ok(x)`/`Err(e)` calls type-check under `tsc --strict` in both concrete
  and generic contexts without a separate explicit cast at the call site.
- Reduced the strict-`tsc` self-host error count from 2 to 1 — the
  second-to-last step of the ADR-0026 TS-dialect track.

## Alternatives rejected

- **Require the user to write an explicit type argument or cast at every
  applied ctor call** — pushes an annotation burden onto the source language
  for a fact HM already solved.
