# `@mochi/plugin-styled-cva`

Vendor plugin (not language core) that teaches the Mochi compiler about
[`@styled-cva/react`](https://www.npmjs.com/package/@styled-cva/react) `tw.*`
factories. It is a `HostExtension` — it only touches the compiler's plugin
interface (`inferCall` + `dtsBinding`), never the pipeline.

What it teaches:

- **infer:** `tw.tag(base)` / `tw.tag(base, { variants })` → `{ …variants } -> VNode`,
  so a `tw.div(...)` binding types as a component instead of `'t0`.
- **dts:** `$tone?: "rose" | "amber"` literal unions read off the `variants`
  record AST, so `.d.mochi.ts` consumers get prop hints without modeling
  `VariantProps` in HM.

## Register it

Plugins are registered through the project's **vendor-plugin list** (tracer
bullet #20) — one array that Vite, `.d.mochi.ts` generation and the LSP entry
all read. For the docs app that is `apps/docs/mochi.plugins.ts`:

```ts
import { styledCvaExtension } from "@mochi/plugin-styled-cva";
import type { HostExtension } from "../../src/extensions";

export const docsVendorPlugins: HostExtension[] = [styledCvaExtension];
```

Nothing else changes: `vite.config.ts`, `scripts/gen-mochi-dts.ts` and
`src/lsp/docs-server.ts` already consume that list.

Authoring the host binding on the Mochi side stays an `extern` (ADR 0009):

```mochi
export extern tw : a = "@styled-cva/react" "default"
```

Not to be confused with the rejected ADR 0009 alternative `@styled-cva/mochi`
*runtime* shim — this package is a compile-time plugin, not a JS interop layer.
