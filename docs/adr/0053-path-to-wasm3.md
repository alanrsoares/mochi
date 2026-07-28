# 0053 — Path to Wasm 3.0 (WasmGC third backend; no Rust rewrite)

- **Status:** Proposed (draft)
- **Date:** 2026-07-28
- **Source:** conversation (owner direction); formerly `docs/PATH_TO_WASM3.md`;
  [`compiler.md`](../compiler.md); [ADR 0026](0026-codegen-ts-strict-clean-backend.md);
  [ADR 0052](0052-js-bundles-via-host-not-compiler.md)
- **Note:** No implementation work is scheduled. This pins the decision space so later
  ADRs (semantics, core IR, emit) start from shared ground.

## Context

mochi's two backends today — JS and strict-clean TS — share one codegen and run on JS
hosts ([compiler.md](../compiler.md)). That is the right primary target and stays the
primary target. But a language that only lives inside a JS runtime caps out in two ways:

1. **Perceived seriousness.** Modern language tooling competes on system-level speed
   (Go/Rust/Zig/OCaml toolchains). A native-class execution story answers that without
   abandoning the JS-adjacent world mochi lives in.
2. **Deployment reach.** Edge runtimes, plugins-in-hosts, browser-heavy compute — places
   where "ship a `.wasm`" is the native currency.

Wasm 3.0 (standardized 2025-09) folds in the two proposals that matter for an HM
functional language: host GC (`struct` / `array` / `ref`) and `return_call` tail calls.
Prior art that de-risks the shape: OCaml (`wasm_of_ocaml`), Scheme (Guile Hoot), Kotlin,
Scala, Dart all target WasmGC; MoonBit is a new HM-family language designed for it.
Google Sheets shipped its calc engine on WasmGC (2× over JS).

## Decision

1. **JS/TS stay primary.** A third backend does not demote or replace them.

2. **No Rust (or other native-language) rewrite of the toolchain — ever.** The compiler
   is ~3.4k LOC and self-hosted; the pitch is *"the compiler is written in mochi and its
   TS output typechecks under `tsc --strict` with 0 errors."* Rewriting in Rust concedes
   that mochi isn't good enough for its own tooling. Throughput pain in tools like
   ruff/uv/oxc comes from chewing millions of LOC of other people's code; mochi's
   bottleneck is features and adoption, not compile throughput. A rewrite means two
   compilers forever, or a feature freeze during the port. The self-host **is** the
   speed path: once mochi has a native-class backend, that backend compiles the
   self-hosted compiler — the same move Go made (C → Go via self-host). Cheap
   distribution hedge, orthogonal: `bun build --compile` of the current toolchain.

3. **Third backend target = WasmGC (Wasm 3.0), not LLVM first.**

   | Need | LLVM | Wasm 3.0 |
   |---|---|---|
   | Garbage collection | write/port a GC (the single biggest cost) | **host GC, free** |
   | Tail calls | fought for, target-dependent | `return_call` in the spec |
   | Variants | manual tagged unions | near-direct mapping to tagged structs |
   | Interop with JS world | abandoned | first-class (Bun/browsers/workerd) |
   | Runtimes | per-OS binaries | browsers (Baseline), Bun/Node/Deno, wasmtime (GC RFC accepted) |

   LLVM is not ruled out forever — revisit only if standalone native binaries are
   demanded and wasmtime AOT doesn't cover it. Strictly *after* WasmGC.

4. **Prerequisites, in order** (phases 0–1 are wins even if wasm never ships):

   **0. Semantics spec — divorce from JS.** Today dynamic semantics are "whatever JS
   does" (IEEE doubles, UTF-16 strings, `Map`/`Set` equality, eval order, overflow). A
   third backend forces these to be **specified**. Deliverable: `docs/semantics.md` plus
   conformance tests in `test/examples.spec.ts` style.

   **1. Typed core IR.** Codegen currently walks the surface AST. Introduce a small typed
   core (ANF or similar) between `infer` and `codegen`:

   ```
   Program ─typecheck→ Program ─lower→ Core ─emit→ {js, ts, wasm}
   ```

   JS/TS backends must remain byte-identical through the migration (`fixpoint` and
   `bootstrap:tsc` are the guard). Shared with deferred native-bundler opts if those
   ever return ([ADR 0052](0052-js-bundles-via-host-not-compiler.md)).

   **2. Spike: core IR subset → WasmGC.** Weekend-scale, throwaway. Ints, variants,
   closures, `switch`, recursion → WasmGC in Bun. Success = factorial / list-fold from a
   `.wasm`. Goal is representation problems, not kept code.

   **3. Backend proper (demand-gated).** Only with real user pull. Third emitter next to
   `codegen.ts` / `codegen-ts.ts`, sharing the core IR. Long-game milestone: self-hosted
   compiler compiled to wasm.

5. **Gates — do not start phase 2+ until:**
   1. Language surface has stopped moving month-to-month (ADR cadence cools).
   2. `docs/semantics.md` exists and is test-backed.
   3. Core IR (phase 1) has landed with byte-identical JS/TS output.

   Phases 0 and 1 can start whenever roadmap allows.

## Consequences

- Roadmap clarity: no shadow "rewrite in Rust" track; no premature LLVM backend.
- Phase 0–1 are independently valuable (semantics + simpler/opt-ready JS/TS codegen).
- Known hard problems stay explicit research/engineering risk for the spike:
  - **Row-polymorphic records** vs nominal fixed-shape WasmGC structs (monomorphize,
    accessor dicts/vtables, or hashmap-backed poly cases) — main spike target.
  - **Strings** — UTF-16 vs wasm memory; JS ↔ wasm traffic; js-string-builtins helps JS
    hosts, not wasmtime.
  - **Prelude/runtime** — today's JS runtime strings need real List/Map/Set/eq/compare/
    print for wasm, ideally written in mochi once the backend can compile them.
  - **Threads** — not a problem: mochi inherits single-threaded JS semantics.

## Alternatives rejected

- **Rust (or Zig/Go) rewrite of the compiler** — concedes the self-host pitch; dual
  compilers or freeze; wrong bottleneck.
- **LLVM / native codegen before WasmGC** — GC + tail calls + JS interop are paid twice;
  WasmGC already covers the deployment story that matters now.
- **Wasm backend without a semantics spec or core IR** — third emit of "whatever JS does"
  from the surface AST duplicates pain and blocks parity across backends.
- **Scheduling phase 2+ before gates** — representation and product pull are unproven;
  keep the spike demand-gated.

## References

- Wasm 3.0 announcement — <https://webassembly.org/news/2025-09-17-wasm-3.0/>
- WasmGC + tail calls Baseline — <https://web.dev/blog/wasmgc-wasm-tail-call-optimizations-baseline>
- V8 on porting GC'd languages — <https://v8.dev/blog/wasm-gc-porting>
- Chrome WasmGC (Google Sheets case) — <https://developer.chrome.com/blog/wasmgc>
- Wasmtime GC RFC — <https://github.com/bytecodealliance/rfcs/blob/main/accepted/wasm-gc.md>
- FOSDEM 2026, "Beyond JavaScript: Wasm GC present & future" — <https://fosdem.org/2026/schedule/event/G3FRDA-beyond_javascript_wasm_gc_present_and_future/>
