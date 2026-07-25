# `@mochi/plugin-re-reduced`

Vendor plugin (not language core) that teaches the Mochi compiler about
[`@re-reduced/preact`](https://www.npmjs.com/package/@re-reduced/preact)
`defineContainer` factories (ADR 0010 Gap A / Wave 6). A `HostExtension` —
`inferCall` + `dtsBinding` only.

**Status:** Wave 6 **bridge**, not the long-term architecture
([ADR 0012](../../docs/adr/0012-host-interop-end-state.md)). Preference order:
typed `extern` when honest → core literal/union formers → thin sugar that
*assigns* those formers → heavy host types only in outbound `.d.mochi.ts`.
This package’s AST→`ContainerDef<…>` string template proved “no cast file”;
shrink toward structural HM + thin outbound dts — do not clone the pattern
for every npm kit.

What it teaches today:

- **infer:** `defineContainer(name, { state, actions })` → a record with at least
  `name: string` (enough for hover; honesty lives in dts).
- **dts:** `import("@re-reduced/preact").ContainerDef<S, R, …> & { name: string }`
  recovered from the config AST so TSX can `import { counter } from "./counter.mochi"`
  and call `useContainer(counter)` with **no hand cast bridge**.

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
