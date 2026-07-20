# alang — VSCode syntax highlighting

TextMate grammar for `.al` files: comments, `let`/`type`/`switch`, pipeline
`|>`, arrow `=>`, match bars `|`, variant constructors (Uppercase idents),
primitive types (`float`/`int`/`string`/`bool`), and numbers.

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
