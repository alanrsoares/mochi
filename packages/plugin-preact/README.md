# `@mochi/plugin-preact`

Preact host adapter for Mochi (ADR 0015).

## Use

```mochi
import { useState, useEffect, hookDeps } from "@mochi/plugin-preact/hooks"
```

Register on the project plugin list (future inferCall / check):

```ts
import { preactExtension } from "@mochi/plugin-preact";
```

Vite: alias `@mochi/plugin-preact/hooks` → the package `hooks.mochi` (or rely on
package `exports`).

## Honest types (v0)

| Binding | Scheme |
|---|---|
| `useState` | `a -> (a, a -> b)` |
| `useEffect` / `useLayoutEffect` | `(() -> c) -> d -> e` |
| `useCallback` / `useMemo` | preserve / opaque deps |
| `hookDeps*` | pack heterogeneous dep lists |

Opaque `: a` only where HM would lie (updater overloads — later `inferCall`).
