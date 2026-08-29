# 0095 — A caller-owned memo for `moduleContext`

- **Status:** accepted
- **Date:** 2026-08-29
- **Source:** `bun run lint:mochi` taking 22s on 104 files; the same cost shows up as ~1.8s per keystroke in the LSP
- **Deepens:** ADR 0002 (module graph + export schemes), ADR 0048 (`@mochi/dx` query surfaces)

## Context

`moduleContext(entry, …)` loads the entry's import graph and infers **every
dependency** in dependency order, so the entry can be checked against real
export schemes. It keeps nothing between calls.

That is correct and was cheap while every caller asked about one file. It stops
being cheap the moment something asks about many files that share a graph.
Measured on `bootstrap/` (34 modules, 12,660 lines):

| stage | time |
|---|---|
| lex all 34 | 19ms |
| lex + parse all 34 | 30ms |
| resolve + infer the whole graph once | 1809ms |
| ⇒ inference | **~1779ms (98%)** |

Checking the 34 modules one at a time cost **20.5s** — the same graph inferred
34 times. Parsing is noise; inference is the whole bill, so *reuse* is the only
lever that matters. Making inference itself faster is a separate question and
does not change this ratio.

The language server has the identical problem from the other direction: every
debounced validation re-infers the whole graph behind the edited buffer, so
typing in `bootstrap/cli.mochi` cost ~1.9s per validation.

## Decision

Add an **optional, caller-owned** `ModuleCache` to `ModuleGraphOptions`.

1. **Caller-owned, not module-global.** A CLI sweep wants one per process; a
   language server wants one per session; `mochi build` wants none. A global
   cache would make an unrelated compile's lifetime someone else's problem, and
   would need invalidation hooks nobody asked for. Omitting `cache` keeps the
   historical behavior exactly.

2. **Validity by source identity plus dependency revision, never by hash.** An
   entry stores the exact `src` it was inferred from and the revisions of its
   direct dependencies at that moment. A hit requires the source to be
   byte-identical **and** every direct dependency to still carry the revision it
   was inferred against. Revisions come from a monotonic counter bumped whenever
   a module is (re)inferred, so a change anywhere invalidates exactly the
   modules downstream of it and nothing else.

   Content hashing was rejected: a collision is a silently wrong diagnostic, and
   the strings are already in memory, so comparing them costs less than the
   consequence of getting it wrong.

3. **Failures are cached too.** A dependency that does not typecheck is a stable
   answer for as long as its inputs are stable. Caching only successes would
   leave the broken-graph case — the case an editor sits in most — paying full
   price on every keystroke.

4. **The entry is never cached.** It is the live buffer; in the LSP it is
   usually the only thing that changed.

5. **Plugin lists key by array identity.** A vendor plugin's `inferCall` changes
   what a call site means, so two different plugin lists must not share an
   entry. Identity (a `WeakMap` over the array) is enough because every caller
   already reuses one list — `pluginsForDocument` caches per manifest, and Vite
   / `gen-mochi-dts` share the project's exported array. Passing a fresh `[]`
   per call is correct but defeats the cache.

`loadGraph` gets the same treatment for parsed programs. It is only ~1s of the
20.5s, but it is free once the plumbing exists.

## Consequences

`bun run lint:mochi` over the repo: **22s → 5.2s**. `bootstrap/` alone:
20.5s → 4.0s.

The editor gains more than the sweep does, because a keystroke changes only the
entry. Second-validation latency, `bootstrap/`:

| edited file | before | after |
|---|---|---|
| `cli.mochi` (small file, whole compiler graph behind it) | 1945ms | **14ms** |
| `compile.mochi` | 1861ms | **16ms** |
| `infer.mochi` (64.5K — its own inference is the cost) | 1127ms | 812ms |

The last row is the shape of the remaining limit, not a miss: the entry is never
cached, so a file whose own inference dominates cannot be helped by reuse.

The remaining 4.0s is architectural, not incidental: each module is inferred
once as a *dependency* (cached) and once as an *entry* (not cached, by design),
so a per-file sweep has a floor of roughly twice one graph compile. Removing
that means not checking file-by-file — compiling whole graphs from their DAG
roots and reporting every module's diagnostics — which is a different API, not a
cache. Left for later.

This is not multicore work and does not become multicore work. The sweep uses
1.22 of 16 cores. Parallelising across graph components saves ~1.2s (components
are wildly uneven — `bootstrap/` alone is 4.0s of the 5.2s), and parallelising
*within* a component is bounded by the dependency chain and would need schemes
serialised across worker heaps. The cheap win was the redundancy, and it is now
taken.

Guards in `test/module.spec.ts`: a cached run answers exactly what an uncached
run answers; editing a dependency invalidates the modules downstream of it; a
dependency that reverts is answered as it was, not as it briefly became; plugin
lists are part of the key.
