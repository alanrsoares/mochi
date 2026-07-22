# 0039 — Parametric nullary constructors annotate concretely in place (TS backend)

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-23; `src/infer.ts` (`ref` case → `ctx.record`); `src/codegen.ts` (`genExpr` `ref` case → `annotateEmpty`); `src/dts.ts` (`emptyCollTs`, unchanged — type-agnostic); `docs/adr/0035` (empty-collection seeds); `docs/adr/0038` (throwing `.otherwise` for array partitions); `docs/adr/0002` (ts-pattern internal / @onrails/pattern emitted); `docs/adr/0026` (TS backend)

## Context

After ADR 0038 the self-hosted `bootstrap/` emitted **15 `tsc --strict` errors**.
One was **TS2322** in `lexer.ts` at `mkTok`:

```al
let mkTok = (tok, start, stop, doc) => switch doc {
  | [] => { tok, start, end: stop, doc: None }
  | lines => { tok, start, end: stop, doc: Some(Str.join("\n", lines)) }
}
```

The `[]` arm is a `parr` pattern and `lines` is a catch-all var, so codegen lowers
the match to `.with([], …).otherwise((lines) => …)`. ts-pattern fixes the chain's
return type from the **first** arm. That arm's record has `doc: None`, and a bare
`None` infers `Option<never>` (its type argument is unconstrained at the
reference). The `.otherwise` arm returns `doc: Some(string)` = `Option<string>`,
which is **not** assignable to `Option<never>` (`string` ⊄ `never`) — TS2322.

A parametric nullary constructor is the **variant analogue of an empty
collection** (ADR 0035): `None` is to `Option<C>` what `[]` is to `C[]`. HM infers
the correct concrete argument for it (here `Option<string>`, from the sibling arm)
— the value is only rendered too wide because nothing annotates the reference.

## Decision

**In the TS backend, a parametric nullary constructor reference annotates in
place with its resolved concrete type** — `(None as Option<string>)` — exactly as
ADR 0035 annotates an empty literal (`[] as E[]`, `new Map<K, V>()`).

Two coordinated changes, both behind the TS-backend option (JS backend untouched):

**1. `infer.ts` records the reference's type.** The `ref` case already
instantiates the scheme; it now also calls `ctx.record?.(e.span, inst)` when the
reference is a **parametric nullary ctor** — an uppercase name whose instantiated
type is a `con` *with* type arguments. `Some`/`Ok` are arrows (excluded); a
monomorphic ctor like `Red : Color` is a `con` with **no** args (excluded — it
never leaks a `never`, so annotating it would be noise). The type is unzonked
here and resolved by the end-of-inference zonk, like every recorded type.

**2. `codegen.ts` annotates the emitted reference.** The `ref` case checks
`ctorKeys.get(name)?.length === 0` (a 0-field ctor — so plain value refs are
untouched) and, if so, calls `annotateEmpty?.(r)`. That helper (ADR 0035) reads
the recorded span→type and returns a rendering **only when fully concrete**
(`hasFreeVar` false) — so a `None` in a generic position (`Option<A>`) stays bare.
`emptyCollTs` needed no change: it folds aliases and renders any concrete `con`,
so `Option<string>` renders for free.

## Consequences

- **Bootstrap: 15 → 14 `tsc --strict` errors (−1).** The `lexer.ts` `mkTok`
  TS2322 clears; every concrete `None` in the graph now emits annotated
  (`Option<Tok>`, `Option<number>`, …). No new errors — the parametric-ctor and
  0-field gates keep monomorphic ctors (`Red`) and value refs bare.
- **JS byte-identical.** `annotateEmpty` is null off-TS; the JS `ref` case still
  emits the bare name. The fixpoint (`build ok` ×2) confirms every `.js` unchanged.
- **Runtime semantics preserved.** `as` is erased — the annotation only steers
  tsc's inference of the first ts-pattern arm.
- **Hover:** `None` references now carry a recorded type (`ctx.record` is the
  hover table). This is correct — hovering `None` shows its inferred `Option<C>` —
  and consistent with ADR 0035, which records empty literals the same way.
- **Guarded** by `test/ts-emit-tsc.spec.ts` (`noneAnnot` corpus: the `mkTok`
  shape — a `None`-field arm a later `Some`-field arm widens, tsc-clean) and the
  `test/bootstrap-tsc.spec.ts` ratchet lowered to ≤ 14.

## Alternatives rejected

- **Reorder the match arms** (put the `Some` arm first so it fixes the wide type)
  — order is source-driven and check.ts-significant; codegen must not permute it.
- **Annotate every nullary ctor, monomorphic included** (`Red as Color`) — pure
  noise; a monomorphic ctor never infers `<never>`, so it never needs it.
- **Widen `None` at the runtime level** (`const None: Option<unknown>`) — poisons
  every `Option` in the program with `unknown` and defeats the point of the pass.

## What remains (next lever)

Of the 14, by root cause: the **open-row `& A` cluster** (6 — `infer.ts:429`
`.sccs` off an over-opened Tarjan state, `infer.ts:545/557`, `module.ts:83/91`
`emptyReg` seeds, `cli.ts:21` `writeAll`'s recursive `Result` union); the
**generic-leak HOF** (`B[]` vs `string[]` at `check.ts:217`, `Set<A>`/`Map<A,…>`
at `codegen.ts:382`, `A[]` vs `Stmt[]` at `infer.ts:545`); and scattered
`unknown` leaks (`check.ts:192`, `infer.ts:156`) plus the `parser.ts` span/`Option`
leaks (`294`, `314`) that ride the generic chain. The open-row cluster is the
biggest single prize and the polymorphic-HOF tail proper. Each its own ADR.
