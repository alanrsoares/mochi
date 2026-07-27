# `apps/docs` Reframe & Execution Plan

`apps/docs` is Mochi's documentation and landing site. Its initial content was AI-generated, resulting in a dense, fluffy, and academic tone (*"Hindley–Milner inference", "opaque factory + vendor plugin"*). 

This document outlines a directed execution plan to rewrite and re-structure `apps/docs`, drawing lessons from **ReScript**, **Gleam**, **Elm**, and **Civet**.

---

## 1. Positioning & Tone Guidelines

### Tone Rules
* **Pragmatic, not academic.** Developers care about what the language enables, how fast it runs, and how easily it integrates.
* **Show, don't tell.** Prefer live side-by-side code blocks over paragraphs explaining syntax.
* **No AI-slop or fluff.** Eliminate grandiose statements, thesis-style descriptions, and compiler-internal jargon.

### Jargon Translation Table

| Current `apps/docs` Copy | Reframed Human Copy |
|---|---|
| *"An ML-family language that compiles to readable JavaScript and strict TypeScript."* | *"Functional programming that plays nicely with TypeScript."* |
| *"Full Hindley–Milner inference, row-polymorphic records, parametric variants..."* | *"Smart type inference, pattern matching, and flexible structural records."* |
| *"self-host · 0 tsc --strict"* | *"Compiles to readable JS and 100% strict-clean TypeScript."* |
| *"Opaque factory + vendor plugin"* | *"Native JS & CSS-in-JS library bindings"* |
| *"Host factory seam"* | *"Calling React & Preact hooks inside Mochi"* |
| *"bridge: .d.mochi.ts sidecars"* | *"Automatic TypeScript declaration exports"* |

---

## 2. Target Site Architecture

```
apps/docs/src/
├── App.mochi                 # Main landing page layout
├── components/
│   ├── Hero.mochi            # Reframed Hero section with 3-column Transformer
│   ├── CodeTransformer.mochi # Live Mochi -> JS -> TS comparison
│   ├── TsCheatsheet.mochi    # Side-by-side comparison: TS vs Mochi
│   ├── LanguageTour.mochi    # Interactive feature walkthrough
│   └── InteropSection.mochi  # Plain-English JS & React integration
└── ui/
    └── primitives.mochi      # Clean UI primitives
```

---

## 3. Section-by-Section Execution Plan

### Section 1: Hero (`Hero.mochi` / `App.mochi`)
* **Headline**: `mochi`
* **Subhead**: `Functional programming that plays nicely with TypeScript.`
* **Body Copy**: 
  > Write clean, expressive code with pattern matching and smart type inference—compiled directly into human-readable JavaScript and strict, error-free TypeScript.
* **Primary CTAs**:
  * `[ Open Playground → ]`
  * `$ bun run mochi app.mochi`
* **Hero Status Badge**: `compiles to 0 tsc --strict errors`

---

### Section 2: Dual Codegen Transformer (`CodeTransformer.mochi`)
* **Heading**: *One language, two clean outputs.*
* **Subhead**: *Mochi emits human-readable JavaScript for runtime execution and strict TypeScript for team integration.*
* **Layout**: 3-column split view:
  1. **Source (`app.mochi`)**: Simple pattern matching + record update + JSX.
  2. **JavaScript (`bun run mochi`)**: Readable ES6 JS output (no runtime bloat).
  3. **TypeScript (`tsc --strict green`)**: Clean TypeScript with full type annotations.

---

### Section 3: "Mochi for TypeScript Developers" Cheatsheet
Add a dedicated comparative section for devs transitioning from TypeScript (inspired by Civet and Gleam):

| Concept | TypeScript | Mochi |
|---|---|---|
| **Type Inference** | `const add = (a: number, b: number) => a + b;` | `let add = (a, b) => a + b` *(types inferred)* |
| **Pattern Matching** | `switch (res.type) { case "ok": ... }` | `match res { Ok(v) -> v, Err(e) -> 0 }` |
| **Structural Records** | `type User = { id: string, name: string }` | `{ id: "123", name: "Alice" }` *(row-inferred)* |
| **JSX Output** | Requires tsconfig `jsx: react-jsx` | Built-in `jsxPlugin` $\rightarrow$ `h()` |

---

### Section 4: Language Tour (`LanguageTour.mochi`)
Group syntax features into 3 actionable pillars focused on developer benefits:

1. **Variants & Pattern Matching**: Eliminate runtime `null` / `undefined` checks with exhaustive `Result` and custom variants.
2. **Flexible Records**: Work with structural record types that infer fields automatically without boilerplate interfaces.
3. **First-Class JSX**: Express UI components naturally with native JSX compiling to any `h()` function (Preact, React, Hono).

---

### Section 5: Interop & Integration (`InteropSection.mochi`)
Replace internal compiler jargon with clear integration recipes:
* **Using npm packages**: Declare `extern` functions to call any JS package seamlessly.
* **React / Preact Hooks**: Call hooks directly inside Mochi component functions.
* **TypeScript Export**: How `.d.mochi.ts` sidecar files allow existing TS codebases to import Mochi modules with zero configuration.

---

## 4. Phased Rollout Plan

- [ ] **Phase 1: Text & Copy Audit**: Update string constants in `App.mochi`, `HeroCarousel.mochi`, and `primitives.mochi` to remove fluff and jargon.
- [ ] **Phase 2: Hero & Transformer Refactor**: Simplify `Hero.mochi` and ensure the 3-column Mochi $\rightarrow$ JS $\rightarrow$ TS preview is prominently featured.
- [ ] **Phase 3: Add TS Developer Cheatsheet**: Build a clean table component rendering side-by-side TS vs. Mochi code snippets.
- [ ] **Phase 4: QA & Verification**: Run `bun run check` to verify formatting, type-checking, and site build integrity.
