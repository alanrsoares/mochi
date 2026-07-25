# 0010 — Host type interop (Mochi → TS/TSX)

- **Status:** Accepted
- **Source:** `src/dts.ts`, `scripts/gen-mochi-dts.ts`, docs app
  `apps/docs/src/host/*.host.mochi`, Wave 3 in `docs/dx-tracer-bullets.md`

## Context

Generated `*.d.mochi.ts` sidecars already type pure HM values for TypeScript hosts.
Two dogfood gaps remain in the docs app:

- **Gap A — host factories.** `extern defineContainer : a` makes
  `counter: unknown`, so `Counter.tsx` needs `as never` / `as unknown` casts at
  `useContainer` / `useSelect`.
- **Gap B — styled components.** `extern tw : a` makes every `tw.*` factory
  `unknown` in dts — no `$tone` autocomplete for TSX. Open-world JSX `h` also
  leaves component lambdas over-polymorphic (`<A,B,C…>(props) => D`).

ADR 0009 correctly kept seam bindings opaque when precise HM signatures would
*lie* (overloaded `tw.div`). That does not mean hosts must live with `unknown`
forever — emit and language need an honest bridge.

## Decision

1. **Split Gap A and Gap B.** Fixing component/CVA dts does not type
   `defineContainer`; typing factories does not emit `$tone` unions.
2. **Host-agnostic component emit.** Components in `.d.mochi.ts` are
   `(props: P) => any` (optional `children` / `className` when present). Do
   **not** emit Preact `FunctionComponent` or React `FC` from the compiler.
   Return is `any` (not `unknown`) so hosts can use the binding as a JSX tag
   without a wrapper; props stay structural.
3. **Gap A (near term):** a typed host bridge (or typed extern once rows work in
   signatures) so TSX sees `ContainerDef<S, R, …>` from `@re-reduced/core`.
   Prefer one cast at the seam file over casts at every hook call site.
4. **Gap B:** (a) `@mochi/plugin-styled-cva` **vendor plugin** for `tw` factory
   typing (Wave 3 #15) — not core infer; (b) JSX-attr check against prop rows in
   **core** (#14 / `inferJsxCall`); (c) dts component mode (#17), including CVA
   variant key extraction via the plugin's `dtsBinding` hook.
5. **Boundary:** Universal JSX (parse desugar + `h` prop checking) stays in
   **language core** ([ADR 0007](0007-jsx-desugar.md)). Kit-specific knowledge
   (`tw`, CVA variant AST, re-reduced factories) lives in **vendor plugins**
   (`HostExtension` via the project plugin list — `InferOptions.extensions` /
   `emitDts` / Vite / LSP) — see
   [`packages/plugin-styled-cva`](../../packages/plugin-styled-cva/README.md),
   [`apps/docs/mochi.plugins.ts`](../../apps/docs/mochi.plugins.ts), and
   [`src/extensions.ts`](../../src/extensions.ts). styled-cva and re-reduced are
   vendor plugins, not language core. Do **not** fold kit AST walks into core
   `infer.ts`.
6. **Non-goals:** full `VariantProps` in HM; React-specific dts; fake fixed-arity
   `tw` arrows that type 1-arg sites as partial application; a new LanguagePlugin
   ADR or moving styled-cva back into core `infer.ts`.

## Consequences

- Wave 3 gains #16 (typed host factories) and #17 (component dts).
- Docs may keep a thin `*.ts` bridge beside `.mochi` until #16 is complete in HM.
- After #14+#15+#17, `ui/chrome.ts` can hoist into `ui/primitives.mochi` for
  shared chrome.

## Alternatives rejected

- **Hand-maintained `declare const BadgeShell: FC<…>` beside generated sidecars** —
  drifts from `gen:mochi-dts`.
- **Giant `tw` record of every HTML tag in HM** — lies about arity; brittle.
- **Emitting Preact/React `FC` from the compiler** — couples language to one host.
