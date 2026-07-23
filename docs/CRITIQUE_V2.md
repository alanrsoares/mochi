# mochi — design critique, second edition

*As of 2026-07-23: post-self-host (ticket 0013, fixpoint through the self-hosted
graph driver), post-TS-backend (ADRs 0026–0034, bootstrap `tsc` 537 → 33),
34 ADRs in tree. The first critique ([CRITIQUE.md](CRITIQUE.md)) stands as the
historical document; ADRs cite its section numbers, so it is not rewritten here.*

Verdict up front: **the first critique was about design; this one is about
focus. Nearly every v1 finding was answered with a recorded decision — an
exceptional response rate — and the two artifacts shipped since (a byte-stable
self-hosting compiler and a strict-`tsc`-clean TypeScript backend) are the
strongest work in the repo. The product thesis is now decided — typed `.ts`
emission is the primary target (confirmed by the author, 2026-07-23) — but the
repo's own documents and defaults don't say so yet, and the one deferred
design question (abstraction over types) is more expensive under a TS-primary
product than it was when first flagged.**

---

## 1. Scorecard: what happened to the first critique

| v1 finding | Outcome |
|---|---|
| §2.1 monomorphic `eq`/`lt`/`show` ceiling | **Tactically resolved** — structural runtime `eq`/`compare`/`show` (ADR 0007). General question open. |
| §2.2 `map` vs `Array.map` redundancy | **Unresolved** — both still live (`prelude.ts` bare `map` + `Array.map`); open question 0000 #2. |
| §2.3 `float`/`number` surface lie | **Resolved** — one numeric type, `int`/`float` as aliases (ADR 0006). |
| §2.4 decide the abstraction story | **Scoped, not run** — ADR 0018 narrowed to a bounded one-trait experiment; still Proposed, no data yet. |
| §3 sigil family | **Half-resolved** — `${…}` Set literal dropped (ADR 0008, `Set.fromArray` instead); `@{…}` List and `#{…}` Map literals kept. |
| §4.1 no named record types | **Resolved** — transparent structural aliases (ADR 0005), alias folding in unify errors shipped. |
| §4.2 lazy-pattern parity | **Resolved** — `parr`/`plist` patterns share one exhaustiveness engine (`check.ts`). |
| §4.3 effects by convention unnamed | **Resolved** — named as a decision (ADR 0004), effect-row contingency documented (`effects.md`). |
| §4.4 currying vs JS target | **Resolved** — curried surface, uncurried codegen via `_curry` (ADR 0003); closed a latent soundness bug in the process. |

And the language grew past the first critique's horizon: `let … in`
(ADR 0009 — the self-hosting "wall", broken), tuples + binding sugar
(0010/0011), nested patterns (0012), guards (0013), proper tail calls (0014),
ternary (0016), `let?` monadic bind (0017), or-patterns (0022), record update
(0021), string interpolation (0023), a width-based comment-preserving
formatter dogfooded on the bootstrap (0025/0027), and hover-only LSP (inlay
hints deliberately dropped — restraint worth naming as a win).

The meta-observation: a critique was answered with a decision record per
finding, not with silent patches. That discipline is rarer than any single
feature below and is the main reason this second edition exists at all.

---

## 2. What is genuinely strong now (new since v1)

### 2.1 The self-host is real, and the fixpoint is a serious QA artifact
`mochic build <entry>` compiles multi-module graphs self-hosted, with
cross-module inference and exhaustiveness byte-equivalent to the TS compiler,
and `stage2 ≡ stage3` byte-for-byte across a 10-module bootstrap. Differential
suites pin message *and* span parity. Very few hobby languages get to "the
compiler compiles itself and the output is byte-stable"; almost none get there
with the error surface pinned too.

### 2.2 The parity gate is a structural brake on surface growth
Every new construct must land in `src/` and `bootstrap/` in the same change.
This doubles the cost of syntax, which is exactly the right incentive: features
now pay an honest price at proposal time. The or-pattern/record-update/interp
dogfood sweeps show the gate being used as intended — features earn their place
by measured use (123 `cat([…])` sites justified interpolation), not vibes.

### 2.3 The TS backend is engineering taste, and an honesty audit
`codegen-ts.ts` orchestrates the two existing backends (`dts.ts` types,
`codegen.ts` values via one optional hook) instead of forking a third emitter —
the cheapest correct architecture available (ADR 0026). Better: strict-`tsc`
over the emitted bootstrap became an adversarial audit of the *inferencer*.
The 537 → 33 error burn-down (ADRs 0028–0034) surfaced and fixed real gaps
(per-node type table, guard-arm predicates, cross-module type emission,
open-row emission) that the JS backend silently absorbed.

### 2.4 The DRY bootstrap paid design dividends
Extracting shared `ast.al`/`types.al` (−270 lines) forced the bootstrap to be
a real multi-module program, which is how the two genuine language limits
(§4.4 below) were discovered. Dogfooding at this depth is the project's best
design-feedback loop.

---

## 3. The central weakness, second notice: the abstraction question is now overdue

v1 said: *decide the abstraction story before growing the prelude.* Since then
the prelude grew (namespaces, `String.*`, `Option.*`/`Result.*` maps), the
`map` vs `Array.map` redundancy survived, and — new — the TS backend raised
the price of deciding late:

- **Every backend multiplies the cost.** A trait system now needs a JS
  emission story *and* a typed-`.ts` emission story (dictionary passing
  clutters both; monomorphization bloats both), and ADR 0024 proposes a third
  target where the current tactical answer (ADR 0007's runtime structural
  walk) doesn't even port — structural `eq` as a JS deep-walk has no LLVM
  analogue without a runtime.
- **The v1 stdlib reference (V1.md scope) will freeze the redundancy into
  teaching material.** Once the docs say "use `map`" or "use `Array.map`",
  migrating becomes a breaking change with users, not a refactor.
- **ADR 0018 is already the right experiment and it costs nothing to run.**
  One toy trait, monomorphic call sites, measure principality and error
  legibility. It was scoped precisely to produce the missing data point. A
  year of open question #1 with the experiment sitting scoped-but-unrun is
  the project's single largest process gap.

The legitimate alternative remains what it was: choose the ReScript answer
(*no typeclasses, ever*) explicitly, close 0000 #1 as **Accepted:
monomorphic + `-By` combinators + structural builtins**, and let the
namespace matrix be the design rather than the workaround. Either answer
unblocks #2 (the `map` redundancy). No answer blocks both.

---

## 4. The thesis is decided — the repo doesn't say so yet

*(Amended same day: the author confirmed the ranking — **typed `.ts` emission
is the primary output target**. What follows is re-aimed at making the repo
consistent with that decision rather than at making the decision.)*

The tree still *reads* as four competing theses:

1. **TypeScript dialect** — `docs/TS_DIALECT.md` Axis A shipped; **now the
   product**.
2. **Self-hosting showcase** — `docs/V1.md` still says "the bootstrap compiler
   is the product." No longer true as stated.
3. **Native language** — ADR 0024 proposes an LLVM backend.
4. **Rebrand** — `docs/REBRAND.md` plus four logo candidates at repo root.

With TS-primary decided, the follow-through items become concrete:

- **Record the decision.** An ADR ("TS emission is the primary target; JS
  backend is a sibling, LLVM parked") plus a V1.md re-scope. Today the repo's
  most authoritative scope doc contradicts the actual product; every future
  contributor (and agent) will plan against the wrong pillar.
- **The CLI contradicts the product.** ADR 0026 kept `.js` as the default
  compile target and put `.ts` behind a subcommand. If typed `.ts` is the
  product, it should be the default path (`compile` emits `.ts`; `js` becomes
  the subcommand) — defaults are the strongest statement of intent a CLI makes.
- **Axis B (TS-shaped surface) is now a real question, not a someday.** A
  dialect whose *output* is idiomatic TS but whose *input* is ML-flavored has
  an honesty gap in its pitch; Axis B's accept/reject deserves its own ADR soon,
  even if the answer is "no — surface stays, dialect means output only."
- **Self-host and fixpoint reposition, not retire.** The bootstrap remains the
  best QA artifact in the repo (§2.1) — but as *evidence of correctness*, not
  as the product claim. The stale V1 checkboxes get refreshed under that
  framing. Note the fixpoint currently runs through the JS backend; a
  TS-primary product eventually wants the fixpoint (or a differential tier)
  witnessing the `.ts` path too.
- **LLVM (0024) is sequenced after TS-primary, not abandoned** (the author
  intends to build it later). That makes the sequencing itself worth recording
  in the ADR's status line ("Proposed — deferred until after TS-primary v1"),
  and it sharpens one design duty *now*: every TS-primary commit deepens
  JS-target commitments (`_curry`, structural-eq walk, `{ _tag }` shapes,
  `Set`/`Map` erasure) and TS-isms (open-row → generic intersection, ADR 0034)
  that the LLVM backend cannot inherit. The cheap insurance is architectural,
  not implementational: keep the front end target-agnostic (already true —
  ADR 0024's `Program → string` sibling-backend shape), and when a decision
  bakes in a JS/TS assumption, say so in its ADR's Consequences so the future
  LLVM track has an honest inventory instead of an archaeology project. The
  abstraction question (§3) is the biggest such item: its answer must work on
  a runtime-less target too, which argues for monomorphization-style answers
  over runtime-walk answers if LLVM is truly coming.

---

## 5. Sharper issues

### 5.1 One error per compile is a ceiling on the chosen showcase
V1.md names error quality "the showcase's face", but ADR 0001's short-circuit
means a user sees exactly one error per compile, ever. Rustc/Elm — the models
ADR 0030 cites — are multi-error compilers; the fix-one-recompile loop is the
single most dated-feeling part of mochi's UX and it undercuts the exact pitch
v1 makes. ADR 0030 (snippets + did-you-mean) is Proposed and worth shipping,
but even Phase B keeps 0-or-1. A cheap middle exists: `check.ts` is not
unification — its pass (names, arities, exhaustiveness) could collect a batch
without touching the Result railway's shape elsewhere. Parse-level recovery
can stay out of scope; check-level batching alone would transform the editing
loop.

### 5.2 The bootstrap-era language limits are user-facing holes, undocumented as such
Two limits shaped the closed-world self-host and are still surface truths:

- **No cross-module type-name imports.** `import { a, b } from "./mod"` carries
  values and constructors only (`parser.ts` `parseImport`); a type alias cannot
  be named across a module boundary. The TS backend papers over it at the
  *emission* layer (ADR 0029 emits `import type`), which makes the surface gap
  more visible, not less: the compiler's output does something its input can't
  say.
- **No open-world constructor matching** — exhaustiveness against variants
  whose module wasn't compiled in-graph forces catch-alls.

The bootstrap routed around both (shared `ast.al`/`types.al`); users can't
route around as cheaply. Both live in memory/notes today; each deserves an ADR
(even one whose Decision is "deferred, here's the workaround") so the limits
are load-bearing decisions rather than folklore.

### 5.3 The inference tail exposed by the TS backend is language work — and now product-blocking
Of the 33 residual `tsc` errors, the two named classes — **empty-collection
inference** (`Map.empty` → `Map<unknown, unknown>`) and the **polymorphic
higher-order tail** — are inferencer/design questions wearing emission
clothes. With TS emission as the primary output, these graduate from
"burn-down tail" to **product defects**: the typed `.ts` is the artifact users
read and build against, and `unknown`s in it are visible quality. Empty-
collection defaulting in particular needs a *decision* (annotation required?
bidirectional hint from the consuming position? default-and-warn?), not a
patch; it will recur identically in `.d.ts`, hover, and the future LLVM
backend. Worth an ADR before the next burn-down commit.

### 5.4 The surface budget is spending fast
Since the first critique the surface gained ten constructs (§1). Each was
individually justified — dogfood counts, parity paid — but the composite is
worth a look from altitude: branching can now be spelled `switch`, guards, or
ternary; binding can be spelled `let`, `let … in`, `let?`, tuple sugar, or
destructuring patterns. That's not yet incoherent, but it is exactly how small
languages stop being small. The unwritten language tour (V1 §5) is the
canary: if any section needs a "which of these should I use" paragraph, the
budget is overdrawn. The v1 surface freeze is the right call — hold it.

### 5.5 Record keeping is drifting (cheap to fix, expensive to ignore)
The ADR system is the project's memory, and it has its first cracks:
two ADRs share number **0025** (`0025-json-diagnostics.md`,
`0025-width-based-formatter.md`); the README index stops at 0034 but skips
some in-tree entries; open-questions #3 (local bindings) was resolved by
ADR 0009 and never struck; V1.md's checklist is stale against shipped commits.
Individually trivial. Collectively they erode the one discipline (§1) that
distinguishes this project's process.

---

## 6. Prioritized recommendations

1. **Write the decided thesis down** (§4): an ADR making TS emission the
   primary target (JS sibling, LLVM deferred-not-dead), a V1.md re-scope under
   that framing, and the CLI default flipped to match. Cheap, and it stops
   every doc/agent/contributor from planning against the wrong pillar.
2. **Decide empty-collection defaulting and close the polymorphic-HOF tail**
   (§5.3). Under TS-primary these are product defects, not polish — they
   outrank everything below.
3. **Run the ADR 0018 experiment** (§3) — with the added constraint that the
   answer must survive a runtime-less LLVM target (§4), which biases toward
   monomorphization or "monomorphic, deliberately" over runtime dispatch.
   Either way, close 0000 #1; it unblocks #2 (`map` vs `Array.map`) too —
   resolve that before the stdlib reference freezes idioms into docs.
4. **Decide Axis B** (§4): does TS-primary mean output only, or TS-shaped
   surface too? An ADR either way; the pitch is fuzzy until it exists.
5. **Batch check-pass errors** (§5.1) and ship ADR 0030 Phase A (pure-win
   snippet rendering). Error UX remains the face of whatever v1 ships.
6. **ADR the two closed-world limits** (§5.2) — under TS-primary the
   type-name-import gap is sharper: emitted `.ts` says `import type`, the
   surface can't.
7. **Fix the record-keeping drift** (§5.5): renumber the duplicate 0025,
   strike 0000 #3, refresh V1.md checkboxes. An hour, total.

---

## 7. Score

**8.5/10, up from 8** — with the risk profile inverted. The first critique
docked points for design debt; nearly all of it was paid, on the record, and
the two big artifacts since (self-host fixpoint, strict-clean TS emission)
are work a language team would be pleased with. The remaining deductions are
for *follow-through on focus*: the product thesis is decided (TS-primary,
LLVM later) but not yet recorded where it binds — V1.md, the CLI default,
ADR statuses — and one experiment keeps not running while the abstraction
question everything waits on stays open.

The highest compliment, updated: the first critique asked "what happens at
100× the standard library." This one asks only "does the repo say what its
author already knows" — the cheapest class of finding a critique can have,
and a question only projects that executed this well ever earn.
