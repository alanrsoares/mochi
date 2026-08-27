# 0008 — Vite Plugin & GitHub Pages Documentation Architecture

- **Status:** Proposed
- **Source:** `docs/adr/0008-vite-mochi-docs-app.md`

## Context

With universal JSX desugaring landed in Mochi ([ADR 0007](0007-jsx-desugar.md)), Mochi components compile directly into calls to a host `h` pragma (`h(tag, props, children)`). We need a production-grade documentation website and live playground hosted on GitHub Pages to showcase Mochi's language features, Hindley–Milner type inference, row-polymorphic records, and frontend interop.

Rather than building a isolated static documentation viewer, this is an opportunity to battle-test Mochi's interop with the modern frontend ecosystem (Vite, Tailwind CSS, Preact, `shadcn/ui` visual design, and alternative UI runtimes like SolidJS and Ripple).

## Decision

1. **`vite-plugin-mochi` Plugin**: Create a Vite plugin that resolves and transforms `.mochi` files on the fly. In dev mode and build time, it invokes Mochi's compiler (`compile()`), attaches hot module replacement (HMR), and prepends a configurable JSX pragma header (`import { h } from 'preact'`).
2. **Docs Site Architecture**: Build a Vite app using **Tailwind CSS** for visual design, **Preact** for ultra-lightweight UI runtime (~3kB), and **shadcn/ui** design patterns for components (Tabs, Code Blocks, Dialogs, Cards).
3. **Official Artwork & Brand Integration**: Incorporate official logo assets ([`logo.png`](../../apps/docs/public/logo.png)) and illustrations ([`illustrations/`](../../apps/docs/public/illustrations/README.md)) across the hero banner, feature sections, and type system documentation.
4. **In-Browser Playground**: Expose Mochi's pure TypeScript compiler core to the browser so code snippets can be edited and compiled to JS/TS in real time with live component previews.

## Consequences

- **Ecosystem Interop**: Validates that `.mochi` files can be imported directly into standard Vite/TS/JS applications (`import Card from './Card.mochi'`).
- **Client-Side Playground**: Users can test Mochi in their browser on GitHub Pages without requiring a backend server.
- **Maintainability**: Leverages standard web tools (Vite, Tailwind) without reinventing static site build infrastructure.

## Alternatives rejected

- **Custom SSG from scratch**: Unnecessary overhead; misses the opportunity to build a Vite plugin for the wider JS/TS ecosystem.
- **React as primary runtime**: React's `createElement` overhead and bundle size (~45kB) are unnecessary when Preact (~3kB) natively matches Mochi's `h(tag, props, children)` call structure.
- **Server-side compiler API**: Hosting a backend service for REPL compilation introduces operational cost and latency, whereas Mochi's compiler is small enough (~3.4k LOC) to run client-side in a Web Worker or main thread.
