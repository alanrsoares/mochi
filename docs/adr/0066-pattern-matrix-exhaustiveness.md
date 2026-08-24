# 0066 — Exhaustiveness as a pattern matrix, not a constructor name set

- **Status:** proposed
- **Date:** 2026-08-25
- **Source:** owner request during a language-gap review ("what high value expressiveness are we lacking")

## Context

`checkMatch` decides exhaustiveness by building a **flat set of covered
constructor names** (`covered` in `check/check.ts:357`), gated by `coversCtor`:

```ts
/** A constructor arm covers its constructor only when every argument is
 *  irrefutable … a narrowing arm — `Sm(Sm(n))`, `Sm(0)` — matches a strict
 *  subset, so it must not count toward exhaustiveness. */
const coversCtor = (p: CtorPat): boolean => p.args.every(isCatchAll);
```

The rule is *sound* — it never calls a partial match total — but it is
**depth-1**. It has no way to observe that a group of narrowing arms is jointly
total, so any match that discriminates below the outermost constructor, or
across a product, is rejected:

```
type T = | A(Option<number>) | B
switch t { | A(Some(n)) => n | A(None) => 0 | B => 9 }
→ non-exhaustive switch on 'T': missing A (arm(s) on A narrow — add A(_) or a '_' catch-all)

switch p { | (Some(a), Some(b)) => … | (None, _) => … | (_, None) => … }
→ non-exhaustive switch: add a `_` catch-all arm
```

The workaround the diagnostic itself suggests is `_`. That is the problem. A `_`
arm sets `hasCatchAll` and **returns `null` before the missing-constructor
computation runs at all** (`check.ts:371`) — the match opts out of exhaustiveness
permanently. Every nested or product match in the corpus is therefore carrying a
`_` that silently disables the one guarantee the language advertises: add a
variant, get a compile error. The cost compounds with corpus size, so the
cheapest moment to fix it is the earliest one.

## Decision

Replace the name-set with **Maranget's usefulness algorithm** over a pattern
matrix (*Warnings for pattern matching*, JFP 2007) — the standard algorithm used
by OCaml and rustc, and the reason both can typecheck deep matches without
catch-alls.

**Prior art to read before implementing:** `~/dev/rescript/compiler/ml/parmatch.ml`
(~2600 LOC) is a mature production version of exactly this — `satisfiable`
(`:1196`) is the usefulness query, `exhaust` (`:1307`) the exhaustiveness entry
point, `full_match` (`:846`) the signature table, `discr_pat` (`:618`) the
specialization, `build_other` (`:1037`) the witness construction. The citations
below are to it. Two entry points exist there for backwards-compatibility
reasons only (`parmatch.ml:1391` notes `satisfiables` is "strictly more powerful
than `exhaust`"); mochi should have one.

- **Matrix.** Arms become rows; the scrutinee starts as a single column. `U(P, q)`
  is "does `q` match some value no row of `P` matches". A match is exhaustive iff
  `U(P, (_))` is false. Reduction is the usual pair: specialization `S(c, P)`
  (keep rows whose head is `c` or `_`, splice the constructor's arity into the
  columns) and the default matrix `D(P)` (rows with a wildcard head).
- **Normalize first.** Or-patterns split into separate rows and as-patterns
  (ADR 0068) are stripped to their inner pattern *before* any signature is
  computed. ReScript does both inside `discr_pat` itself
  (`parmatch.ml:621-624`) and asserts they never reach `full_match`
  (`parmatch.ml:881`) — a useful invariant to copy, since a `pas` mistaken for a
  binder would silently make its row a catch-all.
- **Column signatures.** A column is *complete* when its head constructors
  exhaust the type's signature. ReScript's `full_match` (`parmatch.ml:846`) is
  the reference table; mochi agrees with it except on arrays:
  - `pctor` — closed, from `reg.type` (already the source of `required`);
  - `pbool` — closed at two, subsuming the existing `bools` special case;
  - `ptuple` — single-constructor product, always complete (`Tpat_tuple -> true`);
  - `pnum` / `pstr` — **infinite**, never complete; only a wildcard row covers
    (`Tpat_constant -> false`);
  - `precord` — complete (`Tpat_record -> true`), because the *type* guarantees
    every mentioned label is present; row-openness concerns labels that are not
    columns at all. The columns are the **union of labels mentioned across the
    whole column**, with rows that omit a label padded by a wildcard — exactly
    what `discr_pat` accumulates at `parmatch.ml:627-639`. Note this is a
    per-column union, not a per-row shape. Discrimination then happens on the
    field *values*, so a literal field is a constant column and needs a wildcard
    row like any other constant.
  - `parr` — **complete** via `[]` plus a rest row, which is where mochi
    deliberately diverges: OCaml has `Tpat_array -> false` (fixed-length
    patterns only, so array length is an infinite signature), but mochi's
    `[x, ...xs]` covers all lengths ≥ 1 and `checkSeqExhaustive` already accepts
    `[] | [x, ...xs]` as total today. **A naive port of `full_match` would
    regress that**, so the array row is a mochi-specific case, not an oversight.
- **`plist` stays depth-1.** Lazy-List matching pulls from the sequence and
  cannot nest (`check.ts:140`); it keeps its current handling and enters the
  matrix as an opaque column.
- **Guards keep their current semantics** — a guarded row contributes nothing to
  coverage. It is dropped from `P` for the usefulness query, exactly as
  `!arm.guard` does today.
- **Witnesses replace name lists.** When `U(P, (_))` succeeds it returns the
  *value shape* that escapes, so the diagnostic becomes
  `non-exhaustive switch: 'A(Some(_))' is not matched` instead of
  `missing A (arm(s) on A narrow — add A(_) …)`. The narrowing hint at
  `check.ts:383` is then dead code and goes away. ReScript's `build_other`
  (`parmatch.ml:1037`) is the recipe: for a closed signature take the
  complement set and or-join it; for an **infinite** one, enumerate from a seed
  until you hit an unmatched value — ints walk `0, succ …`
  (`parmatch.ml:1082`), strings use `String.make i '*'`, i.e. `""`, `"*"`,
  `"**"` by length. That last trick is what lets a string switch report a
  concrete unmatched literal instead of a bare "add `_`".
- **Fuel, and bail toward the error.** Usefulness is exponential in the worst
  case, so a production implementation needs a limit: ReScript counts recursive
  calls and gives up at `exhaust_gadt_limit = 1000` (`parmatch.ml:1397`).
  **Mochi must bail in the opposite direction.** ReScript returns `Rnone` —
  "no matching value", i.e. *exhaustive* (`parmatch.ml:1284`, `1401`) — trading
  a missed warning for no false positives. That is right for a checker whose
  exhaustiveness is a warning and wrong for one whose exhaustiveness is the
  advertised guarantee: mochi should report non-exhaustive on exhaustion of
  fuel, so the failure mode is "add a `_` to this pathological match" rather
  than a silently unchecked one.
- **Redundancy stays a non-error.** The same primitive detects unreachable rows
  (`U(rows above, this row)` false), which is strictly stronger than the current
  `catchIdx` check at `check.ts:319` and would reject programs that compile
  today. Ship exhaustiveness first; keep the existing unreachable-arm error as
  is; a redundancy pass is a separate decision.

## Consequences

- Nested and product matches typecheck without `_`, so the exhaustiveness
  guarantee survives contact with `Option<Option<a>>`, `Result` inside a variant,
  and tuple discrimination — the shapes the prelude pushes users toward.
- The change is **monotonically accepting up to the fuel limit**: every program
  that compiles today still compiles (a catch-all row makes any matrix
  exhaustive), *except* a match pathological enough to exhaust the recursion
  budget, which newly errors by the bail-toward-error rule above. No such match
  is known in the corpus; the limit must be chosen with headroom and the
  diagnostic must name the limit rather than pretending the match is wrong.
  No corpus migration, no codegen change — `check/` is the only pass touched.
  Codegen already lowers nested patterns correctly; only the gate was
  conservative.
- Existing `_` arms written *only* to appease the checker become removable. They
  are not auto-removed — that is a codemod, and a `_` may be load-bearing.
- **Fixpoint cost is the real bill.** `bootstrap/` mirrors `check` and must gain
  the same algorithm before the self-host can rely on it, and per the ADR 0056
  precedent adopting the feature *inside* `bootstrap/` needs a released
  generation that already checks it. Land TS first, mirror second, adopt third.
- Guard: a `test/examples.spec.ts` case per column kind (nested ctor, tuple,
  record-in-ctor, array), plus a fast-check invariant that a matrix with a
  wildcard row is always exhaustive and that dropping any row from a
  minimally-exhaustive match makes it non-exhaustive.

## Alternatives rejected

- **Special-case one level deeper.** Extend `coversCtor` to recurse one step and
  intersect sub-coverage. Buys `A(Some(_))`/`A(None)` and nothing else; tuples
  still fail, and depth-3 reintroduces the same complaint. Same code volume as
  the general algorithm without the generality.
- **Leave it; document the `_`.** Makes the flagship guarantee conditional on
  match depth, which is not a property users can hold in their heads. The
  diagnostic actively teaches the unsafe workaround.
- **Exhaustiveness at the type level (refinement of the scrutinee per arm).**
  Would subsume this, but demands narrowing machinery HM does not have and
  couples `infer/` to `check/` across the ADR 0004 railway boundary.
- **Defer to the emitted `ts-pattern` `.exhaustive()`.** Only fires at TS
  compile time on the *output*, reports in the user's generated JS, and is
  absent from the JS backend entirely.
