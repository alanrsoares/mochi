# 0043 — Applied parametric constructor calls cast to their concrete type (TS backend)

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-23; `src/dts.ts` (`ctorCallTs`); `src/codegen.ts` (`call` case → `annotateCall` hook); `src/codegen-ts.ts` (`annotateCall` wiring); `docs/adr/0039` (nullary-ctor concrete annotation), `docs/adr/0038` (throwing `.otherwise` for partitions), `docs/adr/0035` (empty-collection seeds), `docs/adr/0026` (TS backend)

## Context

After ADR 0042 the self-hosted `bootstrap/` emitted **2 `tsc --strict` errors**.
One was `cli.ts:21`, `writeAll`:

```al
let writeAll = outs => switch outs {
  | [] => Ok("")
  | [o, ...rest] => switch writeFile(outPath(o.path), o.js) {
      | Err(e) => Err(e)
      | Ok(w) => let logged = print(Str.concat("  wrote ", w)) in writeAll(rest)
    }
}
```

A constructor's argument pins only the type params it *mentions*. `Ok`'s runtime
type is `<A, B>(value: A) => Result<A, B>`: applying `Ok("")` fixes `A = string`
but leaves the error param `B` free, so tsc infers `Result<string, unknown>`.
Symmetrically `Err(e)` (`e : string` from `writeFile`) infers `Result<unknown,
string>`. ts-pattern types a match chain bottom-up from its arms, so the union of
the three arms — `Result<string, unknown> | Result<unknown, string> |
Result<string, string>` (the recursive call) — is **not** assignable to the
binding's declared `Result<string, string>` (`unknown ⊄ string`), and tsc rejects
it (TS2322).

This is the *applied*-constructor analogue of the class ADR 0039 closed for
*nullary* constructors: there `None` widened to `Option<never>` and was annotated
in place (`None as Option<string>`); here an applied ctor widens its **phantom**
param (the one its argument doesn't determine) to `unknown`.

## Decision

**In the TS backend, cast an applied parametric constructor call to its resolved
concrete type** — `Ok("") as Result<string, string>` — when that type is fully
known. Three coordinated changes, all behind TS-backend hooks (JS untouched):

- **`dts.ctorCallTs`** renders a call node's zonked type only when it is a `con`
  with type args and carries no free var (`hasFreeVar` false); otherwise null. A
  free var would render `unknown` — no better than tsc's own guess — so those
  calls stay bare (e.g. `Ok(x)` in a generic binding, whose Result is
  `Result<A, B>`).
- **`codegen.ts`'s `call` case** wraps the emitted call `(inner as T)` when
  `annotateCall` yields a type, gated on an uppercase-initial `ref` callee — the
  same "it's a constructor" heuristic ADR 0039 used (`/^[A-Z]/`). Ordinary
  Capitalized function calls never trip it because `ctorCallTs` still returns null
  unless the result is a fully-concrete parametric `con`.
- **`codegen-ts.ts`** supplies `annotateCall` from the per-node type table
  (`typeAt`) — the same table ADR 0028/0042 read for lambda params. No new
  inference plumbing: the `infer` wrapper already records every expression node's
  type, so a call span's type is present.

The recorded type is unzonked at record time (the phantom var is still unbound);
the end-of-inference zonk resolves it, so `writeAll`'s arms see the final
`Result<string, string>` the sibling arms unified them to.

## Consequences

- **Bootstrap: 2 → 1 `tsc --strict` error (−1).** `cli.ts:21` clears; the sole
  remaining error is `module.ts:91` (the top-level `emptyReg` seed threaded into
  the generic `resolveImportsFrom`).
- **JS byte-identical.** `annotateCall` is null off the TS backend and the `as`
  wrapper only renders when it returns a type; `bun run check` green (803 pass),
  self-host fixpoint (`build ok` ×2) confirms every emitted `.js` unchanged.
- **Minimally reproducible**, like ADR 0042: a `test/ts-emit-tsc.spec.ts` program
  (`phantomCtorArm` — a recursive Result fold whose error type is pinned concrete,
  tsc-clean only with the cast) plus two `test/codegen-ts.spec.ts` emit-shape
  assertions (a concrete ctor call is cast; a generic one stays bare). Stashing
  the fix regresses the corpus program from 0 → 1 tsc error. Ratchet drops to ≤ 1.
- **Casts also fire outside matches** — any concrete applied ctor (e.g. a ternary
  arm `x ? Ok(1) : Err("bad")`) is now cast. Sound and harmless: the cast target
  is the node's own inferred type, so it can only pin a phantom param, never
  narrow a genuinely-wider expected type.

## Alternatives rejected

- **Emit explicit type arguments** (`Ok<string, string>("")`) instead of a cast.
  Equivalent in effect, but it hard-codes the ctor's type-param *order* into
  codegen; the `as` cast reuses the existing type-rendering path and mirrors ADR
  0039's `(None as …)` form.
- **Record ctor-call types in a separate table** (as ADR 0035 did for
  `letParams`, to protect hover/inlay). Unnecessary: the `infer` wrapper already
  records every node into `types`; reading a call span from `typeAt` adds no new
  recording and hover already surfaces subexpression types.
- **Contextually type the match arms** (thread the binding's return type into each
  `.with` callback). ts-pattern infers arm types bottom-up; there is no seam to
  push an expected type down without rewriting the emitted match.

## What remains (next lever)

1 error: **`module.ts:91`** — the top-level `let emptyReg = { ctors: #{}, … }`
seed. It is *not* inside a generic binding, so ADR 0042's letter-scoping cannot
reach it, and annotating it concretely (ADR 0035's `letParams` path) is refused
because it also flows into the generic `resolveImportsFrom`, whose registry map
types HM generalizes (`Map<B, C>`) — pinning the seed alone contradicts that head
(ADR 0035 §3's entanglement). The hand-written `src/module.ts` pins it with an
explicit `importedReg: Registry` annotation; alang has no binding type-annotation
syntax and cannot name `Registry` cross-module, so closing this needs either that
language feature or a codegen pass that monomorphizes a binding instantiated at a
single concrete type. Its own lever, its own ADR.
