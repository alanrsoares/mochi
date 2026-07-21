# alang — VSCode syntax highlighting + language server

TextMate grammar for `.al` files: comments, `let`/`type`/`switch`, pipeline
`|>`, arrow `=>`, match bars `|`, variant constructors (Uppercase idents),
primitive types (`float`/`int`/`string`/`bool`), and numbers. Plus a language
server — diagnostics, hover, and inlay type hints — built with `bun run
build:ext` from the repo root.

## Commands

- `alang: Restart Language Server` (`alang.restartLsp`): Restarts the background language server process.

## Operator ligatures

`|>` and `=>` render as combined glyphs with a ligature-capable font. The
repo's `.vscode/settings.json` turns on `editor.fontLigatures` scoped to
`[alang]` and lists common ligature fonts (Fira Code, JetBrains Mono, Cascadia
Code, Victor Mono) — install one and reload. Ligatures are font-shaping, so no
extension setting can force them without a supporting font.

## Install locally

Symlink (or copy) this folder into your VSCode extensions dir, then reload:

```sh
# macOS / Linux
ln -s "$(pwd)" ~/.vscode/extensions/alang-0.0.1
# then: Cmd/Ctrl+Shift+P → "Developer: Reload Window"
```

Cursor uses `~/.cursor/extensions/` instead.

## Develop / iterate

Open this folder in VSCode and press `F5` to launch an Extension Development
Host with the grammar loaded. Edit `syntaxes/alang.tmLanguage.json`, then run
`Developer: Reload Window` in the dev host to see changes.

Inspect scopes under the cursor with `Developer: Inspect Editor Tokens and
Scopes` — useful when tuning which theme colors a token gets.
