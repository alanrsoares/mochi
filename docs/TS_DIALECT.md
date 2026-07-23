# TS-flavored mochi — a dialect that emits TypeScript

- **Status:** Design note (exploratory — no go-ahead, not an ADR)
- **Source:** conversation 2026-07-22; `src/codegen.ts` (JS backend), `src/dts.ts`
  (HM type → TS type emitter, already exists), `src/parser.ts` (surface syntax),
  `docs/adr/0003` (curried surface, uncurried codegen), `docs/adr/0024`
  (backend-as-sibling shape). Related: `docs/V1.md` (self-host scope — this is a
  separate track, no priority claim).

## The reframe: drop the word "superset"

The opening ask was "make mochi a superset of TypeScript." A true superset — every
valid TS program typechecks and compiles under mochi — is not feasible and not
desirable here. It would force mochi to *adopt TS's type system*: structural
subtyping, bidirectional (not principal) inference, deliberate unsoundness,
Turing-complete type-level computation (conditional/mapped/template-literal types),
declaration merging, overloads, decorators. Those are irreconcilable with
Hindley–Milner: unification assumes *no* subtyping and computes principal types;
the moment `any` or width subtyping appears, unification either lies or diverges.
Being a superset means deleting the HM core — deleting what makes mochi mochi — and
reimplementing the ~50k-LOC `tsc` checker in a 3.4k-LOC project.

So this note explores the *achievable* target that the "superset" wish was really
reaching for:

> **mochi keeps its HM engine and its FP semantics, adopts a TS-shaped surface
> syntax, and emits typed `.ts` instead of `.js`.**

This is a **dialect**, not a superset. Valid mochi would *look* like a disciplined
subset of TS and interoperate with TS at the value and type level — but mochi still
*rejects* the TS features HM can't model. That rejection is the honest promise:
"mochi is the TS you can't shoot your foot with," not "mochi runs your TS."

## What already exists (the head start)

Two assets make this much cheaper than it sounds:

1. **`src/dts.ts` is already an HM-type → TS-type emitter.** It maps `Type`/`Row` to
   TS syntax (`tsOf`), renders variants as tagged unions matching the `{ _tag, _0 }`
   runtime, peels arrows by lambda arity so `(a, b) => …` declares as
   `(a: A, b: B) => R` (ADR 0003's curried-surface/uncurried-codegen split, already
   reconciled for declarations). A TS *backend* is largely "run codegen for the
   values, run dts for the types, interleave them" instead of emitting a separate
   `.d.ts` sidecar.
2. **Codegen already emits readable JS.** `codegen.ts` produces flat arrows,
   `_curry(n, f)` wrappers, `{ _tag, ... }` variant objects, native template
   literals for interpolation (ADR 0023). Retargeting to `.ts` is *additive* — the
   value-level output barely changes; types get woven in.

## Two independent axes

"Option 1" is really two changes that can ship separately:

| Axis | Module(s) | What changes | Independent? |
|---|---|---|---|
| **A. Output target** | `codegen.ts` (+ `dts.ts`) | emit typed `.ts` instead of `.js` | yes — pure backend work, front end untouched |
| **B. Surface syntax** | `lexer.ts`, `parser.ts` | accept TS-looking syntax (`: T` annotations, `<T>` generics, `function`/`const`) | yes — but see the annotation fork below |

Axis A alone gives you "mochi that ships `.ts`" with today's syntax — cheap, and it
follows the ADR 0024 sibling-backend shape (`codegen-ts.ts`, pure
`Program → string`, non-failing). Axis B is where the real design tension lives.

## Axis A — emitting typed `.ts`

Add `codegen-ts.ts` as a sibling backend (ADR 0024 precedent). Per-node inferred
types must be threaded to the backend — the same plumbing ADR 0024 flagged: today
`inferProgram` (the compile path) drops per-node types; only `inferProgramTypes`
(the LSP path) keeps the span → zonked-type table. A typed backend consumes that
table, exactly like a hypothetical LLVM backend would.

What emitted `.ts` looks like — this mochi:

```mochi
type Shape =
  | Circle(float)
  | Rect(float, float)

let area = shape => switch shape {
  | Circle(r) => mul(pi, square(r))
  | Rect(w, h) => mul(w, h)
}
```

lowers to (types from `dts.ts`, values from `codegen.ts`):

```ts
export type Shape =
  | { _tag: "Circle"; _0: number }
  | { _tag: "Rect"; _0: number; _1: number };

export const area = (shape: Shape): number =>
  match(shape)
    .with({ _tag: "Circle" }, ({ _0: r }) => mul(pi, square(r)))
    .with({ _tag: "Rect" }, ({ _0: w, _1: h }) => mul(w, h))
    .exhaustive();
```

Gains over the `.js` + `.d.ts` split: one file, types inline at the value (better
for humans reading output), and `tsc` becomes a *second* checker over emitted code —
a free differential oracle (if mochi's HM accepts a program but the emitted TS fails
`tsc`, that's a codegen bug). Costs: emitted code now has a `tsc`-visible surface, so
runtime helper shapes (`_curry`, `match`) need honest `.d.ts` for the runtime, and
the differential test corpus grows a "emitted `.ts` must `tsc --noEmit` clean" tier.

## Axis B — TS-shaped surface syntax (the hard fork)

The defining question: **what do type annotations mean when the language already
infers everything?**

mochi today needs almost no annotations — Algorithm W infers principal types
globally. TS is the opposite: annotations are load-bearing because inference is
local. If mochi adopts `x: number` syntax, three coherent stances exist:

1. **Annotations are checked, not trusted.** Parse `let area = (shape: Shape): number
   => …`, infer independently, then *unify* the annotation against the inferred type
   — annotation as assertion, error if they disagree. This keeps HM sound and
   principal; the annotation is documentation the compiler verifies. Closest to
   PureScript/Elm. **Recommended.**
2. **Annotations are trusted (checking-mode).** Use the annotation to *drive*
   inference bidirectionally where present. This is the first step onto the TS
   slope — it invites "then why not infer *less* and annotate *more*," and every
   step erodes principal-typedness. Reject unless there's a concrete forcing case.
3. **Annotations are syntax-only sugar, ignored semantically.** Parse and discard.
   Dishonest — users will write annotations that "typecheck" but mean nothing.
   Reject.

Stance 1 is the sweet spot: TS *looks* right, HM *stays* right, and the annotation
is a real (verified) claim. It's a bounded parser+unify change, not a checker
rewrite.

Beyond annotations, the surface menu (each independently opt-in):

- **`const`/`function` keywords** aliasing `let`/lambda — pure lexer/parser, cheap,
  high familiarity payoff.
- **`<T>` generic syntax** for explicit type params on `type` decls and `let`s —
  cosmetic over mochi's implicit quantification; maps to existing `Scheme`.
- **`interface`/`type X = {…}` object types** — mochi records are row-polymorphic
  and already structural; TS object-type syntax is a near-direct surface swap for
  the existing record type-expression grammar (`TyApp`/record rows).
- **`.` method-ish chaining** — stays pipelines under the hood; do *not* adopt
  `this`/method dispatch (no subtyping, no `this`-typing).

## The boundary — where "TS-flavored" stops (and must say so)

Being explicit about rejection is the whole honesty of the dialect. These TS
features stay **out**, and the checker must produce a *good error* pointing at the
mochi way, not a parse failure:

| TS feature | Why out | mochi alternative the error should name |
|---|---|---|
| `any` / `unknown` escape hatches | breaks soundness + unification | make the type real, or a variant |
| conditional / mapped / template-literal types | Turing-complete, no HM analog | parametric variants + row polymorphism |
| structural subtyping / variance | unification assumes none | row polymorphism (width) is the sanctioned slice |
| classes / `this` / inheritance | no subtyping, no method dispatch | records + functions |
| overloads | HM has principal types, one per binding | one function, variant argument |
| decorators, namespaces, enums, declaration merging | no semantic home | modules / variants |
| `null`/`undefined` as types | ADR-level design choice | `Option` (`Some`/`None`) |

The rule: **every rejected construct gets a targeted diagnostic**, because "looks
like TS" raises the expectation that it *is* TS. Silent parse errors would make the
dialect feel broken instead of opinionated.

## Interop (why emit `.ts` pays off beyond ergonomics)

Emitting `.ts` (Axis A) plus consuming TS types (a `.d.ts` *reader*, distinct from
today's `.d.ts` *writer*) is the real interop story: mochi calls TS libraries with
types, TS calls mochi output with types. That reader is a separate, larger effort —
it must map the *subset* of TS types that HM can represent and reject the rest — and
is out of scope for this note, but Axis A is its prerequisite.

## Suggested staging

1. **Axis A, today's syntax** — `codegen-ts.ts` sibling backend + type-table
   plumbing (ADR 0024's threading). Ships "mochi emits typed `.ts`." Differential
   tier: emitted `.ts` must `tsc --noEmit` clean over the corpus. Lowest risk,
   immediate payoff, front end untouched.
2. **Axis B surface sugar (no semantics)** — `const`/`function`/`<T>`/object-type
   syntax as alternative spellings. Pure parser/formatter/parity work; per V1's
   parity gate, lands in `src/` and `bootstrap/` together.
3. **Checked annotations (stance 1)** — parse `: T`, unify against inferred type at
   the `infer.ts` `u()` seam. The one change that touches the type engine; needs an
   ADR of its own (it's a decision, not just an impl) and PBT coverage
   (annotation-agrees ⇒ accept; annotation-disagrees ⇒ typed error with both spans).
4. **Rejection diagnostics** — the "boundary" table as real error messages. Ongoing.

## Non-goals

- Superset of TS (the whole point — see the reframe).
- Adopting TS's type system, subtyping, or `any`.
- A TS *type reader* for interop (separate, larger track; Axis A unblocks it).
- Displacing the `.js` backend — `.ts` is an *additional* target (ADR 0024 shape),
  not a replacement.
- Rebrand / naming (REBRAND.md track).

## Open questions

- Does the emitted `.ts` target `tsc` classic or the v7 native compiler
  (`tsgo`)? Only matters for the differential-test toolchain, not semantics — v7 is
  the same *language*, a faster compiler.
- Runtime `.d.ts`: `_curry`/`match`/prelude helpers appearing in emitted `.ts` need
  honest declarations. Reuse `dts.ts` machinery, or hand-write a stable runtime
  `.d.ts`?
- Do checked annotations (stance 1) ever *aid* inference (e.g. break an ambiguous
  generalization), or strictly *assert*? Strictly-assert keeps it simplest; revisit
  only with a forcing case.
- Formatter: TS-shaped surface means the width-based formatter (ADR 0025) needs
  rules for the new spellings — cost scales with how much of Axis B ships.
