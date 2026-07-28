# mochi — VSCode syntax highlighting + language server

TextMate grammar for `.mochi` files: comments, `let`/`type`/`switch`, pipeline
`|>`, lambda `=>`, type `->`, match bars `|`, variant constructors (Uppercase idents),
primitive types (`float`/`int`/`string`/`bool`), numbers, and JSX (tags,
components, attributes, `{…}` holes, fragments). Plus a language server —
diagnostics, hover, and inlay type hints — built with `bun run build:ext` from
the repo root.

## Commands

- `mochi: Restart Language Server` (`mochi.restartLsp`): Restarts the background language server process.

## Operator ligatures

`|>` and `=>` render as combined glyphs with a ligature-capable font. The
repo's `.vscode/settings.json` turns on `editor.fontLigatures` scoped to
`[mochi]` and lists common ligature fonts (Fira Code, JetBrains Mono, Cascadia
Code, Victor Mono) — install one and reload. Ligatures are font-shaping, so no
extension setting can force them without a supporting font.

## Vendor plugins

The language server discovers `mochi.plugins.ts` by walking upward from each open
`.mochi` file (same vendor list Vite / `gen-mochi-dts` import).
The manifest must be plain ESM JavaScript (`.mjs`) — the server runs under the
editor's Node runtime, so a `.mts` manifest would depend on Node's type-stripping
support, which isn't a guaranteed contract. Export `default` or named `plugins`:

```js
import { styledCvaExtension } from "@mochi/plugin-styled-cva";

export default [styledCvaExtension];
```

Restart the language server after editing the manifest.

**Security:** manifests are arbitrary Node modules — only loaded when the workspace is
**trusted** (VS Code Restricted Mode keeps them off), the manifest must live under a
workspace folder (symlinks outside the workspace are ignored), and
`mochi.loadProjectPlugins` can disable loading entirely.

## Install locally

Symlink (or copy) this folder into your VSCode extensions dir, then reload:

```sh
# macOS / Linux
ln -s "$(pwd)" ~/.vscode/extensions/mochi-0.0.1
# then: Cmd/Ctrl+Shift+P → "Developer: Reload Window"
```

Cursor uses `~/.cursor/extensions/` instead.

## Develop / iterate

Open this folder in VSCode and press `F5` to launch an Extension Development
Host with the grammar loaded. Edit `syntaxes/mochi.tmLanguage.json`, then run
`Developer: Reload Window` in the dev host to see changes.

Inspect scopes under the cursor with `Developer: Inspect Editor Tokens and
Scopes` — useful when tuning which theme colors a token gets.
