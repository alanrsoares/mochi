# 0012 — Host interop end state (typed seam + thin sugar; ReScript-informed)

- **Status:** Accepted
- **Source:** owner decision (2026-07-25); dogfood Waves 3–6; ReScript reference
  (`~/dev/rescript`: `external_ffi_types.ml`, `ast_external_process.ml`,
  `docs/JSXV4.md`, `compiler/gentype/`); [ADR 0009](0009-styled-cva-host-interop.md);
  [ADR 0010](0010-host-type-interop.md); [ADR 0011](0011-language-plugins.md)

## Context

Waves 3–6 made host interop *work* for the docs app:

- Gap B: `@mochi/plugin-styled-cva` recovers `$tone` unions in `.d.mochi.ts` and
  a rough component scheme in infer (`$tone: string`, not `"rose" | …`).
- Gap A: `@mochi/plugin-re-reduced` kills the hand `counter.ts` cast by
  string-templating `import("@re-reduced/preact").ContainerDef<…>` from the
  `defineContainer` call AST.
- JSX is a builtin `LanguagePlugin` (ADR 0011); project `plugins` list is one
  place (ADR 0010 / Wave 4 #20).

That is **app convenience**, not a scalable architecture. Each new host kit
tempts another `@mochi/plugin-*` that reverse-engineers call shapes — a
per-kit typechecker that will rot with every host API change. ReScript’s
decades of JS FFI experience reject that pattern.

### What ReScript does (and does not)

| Layer | ReScript | Lesson for Mochi |
|---|---|---|
| FFI | `external` + `@module` / call / get / set — **user-declared type** is ground truth; calling-convention is a small closed sum, codegen-only payload (`external_ffi_types.ml`, `ast_external_process.ml`) | Typed `extern` first; never re-derive host types from call sites |
| Literals as types | Ordinary polymorphic variants + `@as` / `@string` / `@int` attrs that only affect **codegen** (`external_arg_spec.ml`) — not a separate “literal type” algebra | Prefer reuse of variants/rows; if we add `tLit` / unions, they are **core** formers, not kit magic |
| JSX | Desugar to record + normal call (`JSXV4.md`); prop check = ordinary record typing | Keep `jsxPlugin` as desugar + unify against whatever prop type the tag has |
| TS interop | **Outbound only** (`genType` → `.gen.tsx`); **zero** “read host `.d.ts` into ReScript” | Do not treat inbound dts-read as the ReScript-shaped default; Mochi’s `.d.mochi.ts` is already the outbound analog |
| Per-kit plugins | Absent — one FFI algebra for all JS libs; React is user-space externals + JSX sugar | AST walkers that re-typecheck CVA / `defineContainer` are **bridges**, not the end state |

## Decision

**Hybrid end state, ordered by preference:**

1. **Typed `extern` (primary, ReScript-shaped).** When HM can express the host
   shape honestly, write it on the seam (`*.host.mochi`). The declared type is
   checked by normal Algorithm W. Opaque `: a` remains **only** when a precise
   signature would lie (overloads such as `tw.div` arity — ADR 0009).

2. **Core type formers for literals and unions.** String (and later number)
   singleton types plus a finite union former live in `src/types.ts` /
   `unify.ts` / show / dts — **language core**, not a vendor plugin. This is
   what makes `$tone: "rose" | "amber" | "emerald"` real in Mochi infer and JSX
   attr checking, not only in generated `.d.mochi.ts`.

3. **Thin sugar plugins (secondary).** A `LanguagePlugin` may **derive** types
   the signature cannot name — e.g. read `variants.$tone` keys and build a
   core literal union. It must **assign** core types (`tLit` / `tUnion` /
   rows), not invent kit-only checking rules and not string-template a parallel
   type system. Kit-owned packages (`@styled-cva/mochi`, `@re-reduced/mochi`)
   are preferred over forever-in-tree `@mochi/plugin-*`.

4. **Heavy host generics in `.d.mochi.ts` (tertiary).** When HM cannot yet
   express a host type (`ContainerDef<S,R,D,I>`), the **outbound** sidecar may
   use `import("pkg").Type<…>` (Wave 6 pattern) or a structural approximation.
   Infer may stay a structural HM sketch for hover. Optional later: machine-read
   host `.d.ts` to **fill outbound forms** — a Mochi-specific convenience, not
   ReScript’s model, and never the primary path for everyday FFI.

5. **Layers stay separated** (ReScript’s hard lesson):
   - seam type → unifier
   - calling convention / sugar metadata → codegen or thin plugin
   - JSX → desugar then ordinary unify
   - never a bespoke per-kit typechecking engine

### Explicit non-goals / rejections

- **Per-kit AST reverse-typecheckers as the long-term architecture** — Wave 6
  `@mochi/plugin-re-reduced` is a **bridge** that proved “no cast file”; it is
  not the template for every npm host.
- **Inbound “TS is source of truth for Mochi infer”** as default — fights HM;
  ReScript does not do it; only consider as outbound-dts assist.
- **Putting kit walks in core `infer.ts`** — ADR 0010 / 0011 boundary stands.
- **Auto-generating `*.host.mochi` from `package.json` in this ADR** — possible
  later convenience; seams remain the intentional greppable FFI boundary
  (ADR 0009) until a separate decision.

### Relationship to prior ADRs

- **0009** — `$`-labels + opaque default extern for overloads: **stands**. Sugar
  plugins may refine what opaque factories *produce*.
- **0010** — Gap A/B split and host-agnostic component dts: **stands**. Gap A’s
  hand TS bridge already superseded by Wave 6 plugin; this ADR supersedes
  “AST plugin forever” as Gap A’s end state.
- **0011** — `LanguagePlugin` + builtin `jsxPlugin`: **stands**. Plugins narrow
  toward sugar derivation + optional outbound dts help.

## Consequences

- Wave 7 opens on **core literal/union types**, then restyles styled-cva infer
  to use them (`$tone` precise in Mochi, not only in dts).
- re-reduced plugin shrinks over time toward structural HM + thin outbound dts,
  or a kit-shipped adapter — not an ever-growing AST→`ContainerDef` string
  template.
- Authors get a clear rule: **write a typed extern when you can; use `: a` +
  sugar plugin only when the signature would lie; never expect core to learn
  your kit.**
- Docs keep framing Preact / styled-cva / re-reduced as **interop examples**.

## Alternatives rejected

- **Status quo AST plugins forever** — does not scale; duplicates host TS.
- **Read host `.d.ts` into HM as the default FFI** — ReScript’s absence of this
  path is evidence; couples Mochi infer to TypeScript’s type system and loses
  Algorithm W clarity.
- **Full ReScript polyvariant + `@as` stack before Mochi needs it** — overkill
  for `$tone`; start with string literals + finite unions; revisit attrs if
  codegen mapping demands it.
- **Honest fixed-arity `tw` arrows in HM** — still lies about dual arity
  (ADR 0009); keep opaque + sugar.
