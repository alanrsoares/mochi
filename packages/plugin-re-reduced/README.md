# `@mochi/plugin-re-reduced`

Vendor plugin (not language core) that teaches the Mochi compiler about
[`@re-reduced/preact`](https://www.npmjs.com/package/@re-reduced/preact)
`defineContainer` factories (ADR 0010 Gap A / Wave 6). A `HostExtension` —
`inferCall` + `dtsBinding` only.

**Status:** Wave 10 **thin adapter** following
[ADR 0012](../../docs/adr/0012-host-interop-end-state.md). Preference order:
typed `extern` when honest → core literal/union formers → thin sugar that
*assigns* those formers → heavy host types only in outbound `.d.mochi.ts`.
Wave 6’s AST→`ContainerDef<…>` bridge proved “no cast file.” The current
adapter infers the ordinary runtime record first and reads that inferred type
for outbound dts; it does not reverse-typecheck the config AST.

What it teaches today:

- **infer:** `defineContainer(name, config)` → the structural HM type
  `{ name: string, ...config }`, including nested state and action fields.
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
