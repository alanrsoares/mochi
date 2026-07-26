# `@mochi/plugin-re-reduced`

Vendor plugin (not language core) that teaches the Mochi compiler about
[`@re-reduced/preact`](https://www.npmjs.com/package/@re-reduced/preact)
`defineContainer` factories (ADR 0010 Gap A / Wave 6). A `HostExtension` —
`inferCall` + `dtsBinding` only.

**Status:** Wave 10–11 **thin adapter** following
[ADR 0012](../../docs/adr/0012-host-interop-end-state.md). Preference order:
typed `extern` when honest → core literal/union formers → thin sugar that
*assigns* those formers → heavy host types only in outbound `.d.mochi.ts`.
Wave 6’s AST→`ContainerDef<…>` bridge proved “no cast file.” The current
adapter infers the ordinary runtime record first, derives a Store sketch for
hooks, and reads that inferred type for outbound dts — no config-AST reverse
typechecker.

What it teaches today:

- **infer `defineContainer`:** structural HM `{ name: string, ...config }`,
  including nested state and action fields.
- **infer `useContainer` / `useSelect`:** Store sketch `{ actions, $state, $derived }`
  with signal `{ value: T }` fields and action labels — powers `store.` /
  `store.actions.` completion and `s.count.value` in selectors.
- **dts:** `import("@re-reduced/preact").ContainerDef<S, R, …> & { name: string }`
  wraps that inferred shape at the outbound seam so TSX can import
  `counter.mochi` and call `useContainer(counter)` with **no hand cast bridge**.

## Register it

```ts
import { reReducedExtension } from "@mochi/plugin-re-reduced";
import { styledCvaExtension } from "@mochi/plugin-styled-cva";
import type { HostExtension } from "../../src/extensions";

export const docsVendorPlugins: HostExtension[] = [
  styledCvaExtension,
  reReducedExtension,
];
```

Authoring stays an opaque seam `extern` (ADR 0009):

```mochi
export extern defineContainer : a = "@re-reduced/preact" "defineContainer"
```
