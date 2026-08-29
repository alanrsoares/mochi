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

4. **The entry is not inferred as part of the graph, but it may *reuse* an
   inference of itself.** The entry is normally a live buffer, so it is never
   written to the cache by `moduleContext`. It is, however, read from it: if
   something else already inferred this same file as a dependency of its own
   graph — same bytes, same dependency revisions, same open-mode — that answer
   *is* this answer, and `moduleContext` hands it back as `entryDiagnostics`.

   The open-mode condition is not incidental. Dependencies infer with
   `openMode(src, open)`, which honors a file's `"use open"`; the editor infers
   an entry strictly so it can flag typos. A `"use open"` file is therefore
   lenient as a dependency and strict as an entry, and must keep recomputing.
   Callers opt in by declaring the mode they will use (`entryOpen`); omitting it
   disables the reuse entirely.

5. **Plugin lists key by array identity.** A vendor plugin's `inferCall` changes
   what a call site means, so two different plugin lists must not share an
   entry. Identity (a `WeakMap` over the array) is enough because every caller
   already reuses one list — `pluginsForDocument` caches per manifest, and Vite
   / `gen-mochi-dts` share the project's exported array. Passing a fresh `[]`
   per call is correct but defeats the cache.

`loadGraph` gets the same treatment for parsed programs. It is only ~1s of the
20.5s, but it is free once the plumbing exists.

## Consequences

`bun run lint:mochi` over the repo: **22s → 3.2s**. `bootstrap/` alone:
20.5s → 2.2s.

The editor gains more than the sweep does, because a keystroke changes only the
entry. Every typechecking DX surface resolves the whole graph behind the edited
file, so they all share the session's cache — hover and completion have no
debounce in front of them, and were paying full price per request:

| query, in `bootstrap/cli.mochi` | before | after |
|---|---|---|
| `moduleHoverAt` | 1771ms | **14ms** |
| `moduleCompleteAt` | 1655ms | **2ms** |
| `moduleTypeDefinitionAt` | 1806ms | **33ms** |

`moduleDefinitionAt` / `moduleHighlightsAt` / `moduleReferencesAt` are 17–25ms
and take no cache: they run off the symbol index and never infer.

Second-validation latency, `bootstrap/`:

| edited file | before | after |
|---|---|---|
| `cli.mochi` (small file, whole compiler graph behind it) | 1945ms | **14ms** |
| `compile.mochi` | 1861ms | **16ms** |
| `infer.mochi` (64.5K — its own inference is the cost) | 1127ms | 812ms |

The last row is the shape of the remaining limit, not a miss: the entry is never
cached, so a file whose own inference dominates cannot be helped by reuse.

Entry reuse is what takes the sweep from 5.2s to 3.2s. Without it every module
was inferred twice — once as a dependency inside someone else's graph, once as
an entry — and a per-file sweep had a floor of roughly twice one graph compile.
What remains is close to the real floor: one inference per module, plus the
DAG roots, which are nobody's dependency and so always recompute.

The residue is single files that are simply expensive to infer:
`bootstrap/infer.mochi` is 64.5K and costs ~720ms on its own. No caching
strategy touches that; making inference itself faster is a different project.

This is not multicore work and does not become multicore work. The sweep uses
1.22 of 16 cores, and after the cache the per-file tail is ~17ms — there is
nothing left worth spreading. Parallelising across graph components is bounded
by how uneven they are (`bootstrap/` alone dominates), and parallelising
*within* a component is bounded by the dependency chain and would need schemes
serialised across worker heaps. The redundancy was the win, and it is taken.

Guards in `test/module.spec.ts`: a cached run answers exactly what an uncached
run answers; editing a dependency invalidates the modules downstream of it; a
dependency that reverts is answered as it was, not as it briefly became; plugin
lists are part of the key; an entry seen earlier as a dependency reuses that
inference, keeps the diagnostics it had, and — the one that fails loudly if the
open-mode condition is dropped — a `"use open"` entry does not reuse its lenient
dependency inference.
