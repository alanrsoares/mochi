# 0025 — Width-based formatter (Wadler/Prettier doc engine)

Status: accepted

## Context

The formatter (`src/format.ts`) parses to the AST and pretty-prints a canonical
rendering. Its first design was *width-agnostic*: almost everything printed on a
single line, and only `switch` ever broke. A later pass taught pipe chains to
break structurally (3+ segments, or a segment that itself broke).

That is not enough to match how the language is actually written. The
hand-written self-hosted sources under `bootstrap/` show a consistent, richer
set of layout idioms:

- a `switch` that fits stays on one line (`switch t { | A => x | _ => y }`); a
  wide one breaks one arm per line;
- a long `x |> f |> g` breaks one stage per line, but a short pipe stays inline;
- a long ternary breaks to `cond` / `? then` / `: else`;
- a long `let x = v in body` breaks after `in`, body on the next line;
- a lambda whose body no longer fits breaks after `=>`.

The structural heuristics could approximate a few of these but never all at
once, and they had no notion of "does this fit on the line" — the actual signal
every one of these idioms keys on.

## Decision

Replace the string-concatenating printer with a **Wadler/Prettier-style document
engine**. The AST is lowered to a small `Doc` IR — `text`, `line` (space when
flat / newline when broken), `softline`, `indent`, `group`, `concat` — and a
layout pass renders it against a target width (**80 columns**): each `group`
prints flat if it fits the remaining width, otherwise it breaks and its child
`line`s become newlines.

Consequences of the model:

- **Width is the single break signal.** `switch`, pipe, ternary, `let … in`,
  record/map literals, and call-argument lists are all `group`s. The ad-hoc
  "pipe breaks at 3+ segments" rule is gone — a pipe breaks iff it doesn't fit.
- **Trailing-lambda hug.** A call whose last argument is a lambda keeps
  `f(… , p =>` on the line and lets the lambda body break beneath it, rather
  than exploding the argument list. This is what makes
  `xs |> List.map(x => …)` read naturally.
- **`let (a, b) = e in body` re-folds.** The parser desugars a destructuring
  `let … in` to an immediately-applied lambda (ADR 0011 shape); the printer now
  detects that shape and prints the surface `let`, instead of leaking the IIFE
  `(((a, b)) => body)(e)`.
- **Not a byte-for-byte match of `bootstrap/`.** Those files were laid out by
  hand and contain lines past 80 columns (inline switches ~95 cols, `extern`
  signatures ~100). The formatter is the source of truth: it reproduces the
  *idioms*, not every hand-made exception.

## Consequences

- Round-trip tests that pinned the old always-break `switch` now assert the
  width-based rendering (short switches inline). This is a deliberate,
  language-visible style change, guarded by `test/format.spec.ts`.
- Formatting stays **idempotent** — the layout is a pure function of the AST and
  the width, and re-parsing broken output yields the same AST (newlines are
  insignificant to the lexer).

## Comments

Comments are not in the AST, so the formatter re-scans the source and reattaches
them. The scan is **string-aware** (it reuses the lexer's `skipStringLiteral`, so
a `//` inside a `"…"` literal or a `${…}` hole is never mistaken for a comment).

- An **own-line** comment (a line that is whitespace-then-comment) attaches to
  the AST node that most tightly follows it and prints as a leading line above
  that node. A commented `switch`, lambda, ternary branch, or match arm drops
  its body to its own indented line so the comment stays own-line — which is
  also what keeps the layout idempotent. Comment `hardline`s propagate a break
  to every enclosing `group`.
- A **trailing** comment (code then `//` on the same line) attaches to the node
  it most tightly follows on that line and prints inline after it, followed by a
  `breakParent` — a zero-width doc that forces the *enclosing* `group` to break
  (so nothing lands after the comment and gets commented out) without emitting a
  newline of its own or expanding a short construct that merely precedes it.
- A trailing comment after a **bare marker** with no node on its line (e.g. a
  ternary's `:`) has nothing to trail, so it degrades to a leading comment of
  the following node.

Every comment across the `bootstrap/` tree (400+, including the one that used to
be dropped) now round-trips, and formatting stays idempotent.
