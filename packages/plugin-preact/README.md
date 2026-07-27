# `@mochi/plugin-preact`

Preact host adapter for Mochi (ADR 0015).

## Use

```mochi
import { useState, useEffect, hookDeps } from "@mochi/plugin-preact/hooks"
```

Register on the project plugin list (required for call-site hook shapes):

```ts
import { preactExtension } from "@mochi/plugin-preact";
```

Vite: alias `@mochi/plugin-preact/hooks` → the package `hooks.mochi` (or rely on
package `exports`).

## Honest types

| Binding | Seam (`hooks.mochi`) | With `preactExtension.inferCall` |
|---|---|---|
| `useState` | loose `a -> (a, a -> b)` | `(a, (a \| (a -> a)) -> unit)` |
| `useRef` | loose `a -> b` | `{ current: a }` |
| `useEffect` / `useLayoutEffect` | loose deps/return | `(() -> c) -> deps -> unit` |
| `useCallback` | loose deps | preserves callback type |
| `useMemo` | loose deps | thunk return type |
| `hookDeps*` | pack heterogeneous deps | `Array<'a>` (element opaque) |

Without the plugin on the project list, extern schemes alone are polymorphic —
anything goes. Register `preactExtension` in `mochi.plugins.ts`.
