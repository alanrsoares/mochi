# 0038 — Array-partition matches close with a throwing `.otherwise` (TS backend)

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-23; `src/codegen.ts` (`genMatch`); `docs/adr/0012` (nested patterns: guard-form emission + conservative exhaustiveness); `docs/adr/0031` (guard-form arms as type predicates); `docs/adr/0002` (ts-pattern internal / @onrails/pattern emitted); `docs/adr/0026` (TS backend)

## Context

After ADR 0037 the self-hosted `bootstrap/` emitted **15–16 `tsc --strict`
errors**. Two of them were the same **TS2322 "not assignable … returns
`NonExhaustiveError<…>`"** class:

- `infer.ts` `letsOfFrom: (stmts: Stmt[]) => Stmt[]`
- `cli.ts` `writeAll: <A>(outs: (… & A)[]) => Result<string, string>`

Both bodies `switch` on an **eager array** with the `[] + [h, ...t]` length
partition and **no catch-all** arm — the shape `check.ts` accepts as total for
arrays. Codegen lowers each arm to guard form (ADR 0012): `.with((_v) => { …
_g.length === 0 … }, …)` and `.with((_v) => { … _g.length >= 1 … }, …)`. A
`.length` test is a plain boolean guard — it doesn't narrow `A[]` to anything
(there's no type predicate to emit; an array isn't a discriminated union the way
a variant is, so ADR 0031's `patTarget` returns `base` unchanged). ts-pattern's
`.exhaustive()` therefore still sees the full `A[]` as unmatched and types the
chain as `NonExhaustiveError<A[]>`, which isn't assignable to the binding's
declared return. Variant/record matches don't hit this — their ctor arms *do*
narrow, so `.exhaustive()` drains the union to `never`.

## Decision

**In the TS backend, an array match with no catch-all closes with a throwing
`.otherwise` instead of `.exhaustive()`:**

```ts
} else if (guardBaseType !== null && m.arms.some((a) => a.pattern.kind === "parr")) {
  parts.push(`  .otherwise(() => { throw new Error("non-exhaustive match"); })`);
} else {
  parts.push("  .exhaustive()");
}
```

`check.ts` has already proven the partition total, so the `.otherwise` branch is
dead. Its handler returns `never`, which is assignable to any declared return, so
the TS2322 clears without weakening any real check. The gate is
`guardBaseType !== null` — the module-level TS-mode signal (ADR 0031), *not* the
per-scrutinee `base` (which is `null` for a generic scrutinee like `outs`, so it
can't distinguish TS-generic from JS mode). **JS mode keeps `.exhaustive()`.**

`.exhaustive()` is retained for every non-array match, so a missing variant case
is still a tsc error there — the exhaustiveness guarantee that matters is intact.
An array match with no catch-all is *only ever* the empty+cons partition
(`check.ts` rejects any other no-catch-all array match), so narrowing the swap to
`parr` arms is safe.

## Consequences

- **Bootstrap: 16 → 15 `tsc --strict` errors.** `infer.ts` `letsOfFrom` clears
  outright. `cli.ts` `writeAll` no longer emits `NonExhaustiveError`; its
  residual TS2322 is a *different* root cause — the recursive handler's
  `Result<…>` union doesn't collapse under the `& A` open-row leak (ADR 0034
  territory), a separate lever.
- **JS byte-identical.** The swap is gated on TS mode (`guardBaseType`); JS
  output still emits `.exhaustive()`. The fixpoint (`build ok`) confirms every
  emitted `.js` is unchanged.
- **Runtime semantics preserved.** Both `.exhaustive()` and `.otherwise(throw)`
  throw on a (proven-unreachable) no-match; only the dead-path error object
  differs between backends.
- **Guarded** by `test/ts-emit-tsc.spec.ts` (`arrayMatch` corpus: a concrete and
  a generic empty+cons recursion, tsc-clean) and the `test/bootstrap-tsc.spec.ts`
  ratchet lowered to ≤ 15.

## Alternatives rejected

- **Emit type predicates for the length guards** (`_v is []` / `_v is [A,
  ...A[]]`) — TS doesn't reduce `A[]` to `[] | [A, ...A[]]` for `.exhaustive()`'s
  `DeepExclude`, so the leftover never empties. Fragile and library-internal.
- **Swap `.exhaustive()` → `.otherwise` for all matches in TS mode** — throws away
  tsc's exhaustiveness check for variant matches, the check we most want to keep.
- **Cast the `.exhaustive()` result** (`as T`) — needs the return type at the
  match site (codegen doesn't have it) and silences a broader class than intended.

## What remains (next lever)

Of the 15, by root cause: **generic-leak HOF** (`B[]`/`Set<A>`/`Map<A,…>` where a
concrete type is expected — `check.ts:217`, `codegen.ts:382`); **open-row state**
(the `& A` intersection leaking into `infer.ts` `.sccs`, the `module.ts`
`emptyReg` seeds, and `cli.ts` `writeAll`'s recursive `Result` union); and a
scattering of `unknown` / `Option<never>` leaks (`check.ts:192`, `infer.ts:156`,
`lexer.ts:185`, `parser.ts:314`). The generic-leak and open-row clusters are the
polymorphic-HOF tail proper — generics scoping over more value positions than
ADR 0032 reaches. Each its own ADR.
