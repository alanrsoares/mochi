# Tooling

All tooling is driven from the compiler itself — the LSP, formatter, and `.d.ts`
generator are surfaces over the same passes, not separate reimplementations.

Package boundary ([ADR 0048](adr/0048-core-dx-package-boundary.md)): **`@mochi/compiler`**
is the bootstrap mirror + foundation (`packages/compiler`); **`@mochi/dx`** owns format + IDE
queries; **`@mochi/cli`** composes compiler + DX for the `mochi` binary; **`@mochi/codemod`**
runs parse → transform → format over `.mochi` globs; **`@mochi/lsp`** is the protocol adapter;
**`@mochi/vite-plugin`** is the Vite transform. Core must not import DX.

## CLI

`bun run mochi` is `bun packages/cli/src/cli.ts`. With no subcommand it compiles one file to JS on
stdout; the subcommands select another output:

```bash
bun run mochi <file.mochi>          # compile to JavaScript (stdout)
bun run mochi --open <file.mochi>   # allow intentional host globals
bun run mochi ts [--open] <file.mochi> # emit typed, strict-clean TypeScript
bun run mochi fmt  <file.mochi>     # pretty-print (add --write to edit in place)
bun run mochi codemod <transform.ts> [--write|--check] [--strict] <globs…>
                                    #   AST codemod: bootstrap parse → user transform → bootstrap format
bun run mochi dts [--open] <file.mochi> # emit a .d.ts
bun run mochi dts --write <file|dir>  # write X.d.mochi.ts beside each module (host TS types)
bun run mochi build [--open] <entry.mochi> # compile a module graph, writing a .js beside each source
                                    #   build --emit=ts writes .ts for the whole graph
```

`extern` bindings name a host module by path (`extern log : … = "./host.mjs" "log"`);
codegen emits that specifier verbatim, so host runtimes are plain `.mjs` files Bun
resolves at runtime, and the TS backend emits a matching `.d.mts` for them.

A codemod transform module exports `(prog, ctx) => prog`, where `prog` is the bootstrap
parser's `readonly Stmt[]` ([ADR 0109](adr/0109-bootstrap-ast-is-the-public-ast.md)).
`mapProgramExprs` from `@mochi/codemod` maps every expression. Output goes through the
bootstrap formatter, so comments, JSX, and unparsable regions come back as written.

## Mochi in a Bun TypeScript codebase

Three pieces, one per phase ([ADR 0108](adr/0108-bun-mochi-loader.md)):

- **Run** — bunfig `preload = ["@mochi/bun/preload"]` (or `bun --preload
  @mochi/bun/preload`) compiles every `.mochi` import, direct or via a package export.
  Each entry's compiled graph is cached in `node_modules/.cache/mochi-bun`, keyed by
  the frozen seed and checked against every module's source hash, so isolated
  processes (`bun test --parallel`) stop recompiling shared imports.
  `MOCHI_BUN_CACHE_DIR` moves it; `MOCHI_BUN_CACHE=0` turns it off.
- **Type-check** — `mochi dts --write src` writes an `X.d.mochi.ts` sidecar beside each
  module; with `allowArbitraryExtensions: true`, `tsc` checks `import … from "./X.mochi"`
  against Mochi's inferred types. Rerun it after editing a `.mochi` export.
- **Bundle** — pass the loader to Bun's bundler:
  `Bun.build({ entrypoints, plugins: [mochiPlugin] })` with `mochiPlugin` from
  `@mochi/bun/plugin`. The bundle runs with no preload.

Compiled JavaScript has no match-library import. Typed TypeScript output can import `@onrails/pattern` for a nested `switch` arm on a generic scrutinee ([ADR 0113](adr/0113-switch-lowers-to-ternaries.md)), so a host that type-checks emitted `.ts` keeps it as a dependency.

## Strict inference

Mochi rejects unbound names by default on every compile and editor surface. This
catches typos and enables did-you-mean quick fixes. Bind JavaScript values through
a typed `extern` whenever possible. For a narrow host-global seam, begin the file with
`"use open"`; `--open` is the project-wide migration escape hatch.

## QA gate

```bash
bun run check          # biome + tsc + workspace + fmt + tests (skips north-stars)
bun run check:full     # pre-push — check, check:north-star, test:mochi:coverage
bun run check:north-star # north-star specs + seed:check (own CI job)
bun run fixpoint       # self-host reproduces itself (stage2 ≡ stage3)
bun run bootstrap:tsc  # count tsc --strict errors on the self-host (north-star: 0)
```

`check` / `test` omit the four graph-sized north-star specs
(`test/bootstrap-{fixpoint-binary,seed-alias,self-tsc,tsc}.spec.ts`);
`test:north-star` runs only those, and `test:full` runs both. CI runs `check` and
`check:north-star` and `test:mochi:coverage` as parallel jobs, so none shares
cores with another.

## Benchmarks

```bash
bun run bench                     # every suite: fmt, fmt:repo, compile (best of 8)
bun run bench compile --runs 3    # one suite, fewer runs
bun run bench --save main         # write .cache/bench/main.json
bun run bench --compare main      # Δ of each case's best against that baseline
bun run bench compile --profile   # rerun under --cpu-prof; rank functions by inclusive time
```

`scripts/bench.ts` is the one harness for perf numbers quoted in PRs and ADRs. A
case reports best and median wall time over `--runs` runs in one warm process;
best is the headline, being the least noisy. Case names stay fixed across commits
(sizes go in a note) so history lines up. `--profile` names the anonymous arrows
of the esbuild seed bundles after their `var` binding, so the ranking reads as
compiler passes (`generalize`, `inferMatch`) rather than `_curry` wrappers.

CI (`.github/workflows/bench.yml`) feeds `--json` to
[github-action-benchmark](https://github.com/benchmark-action/github-action-benchmark):
`main` pushes append to a history kept in the Actions cache, and a pull request is
compared against it in the job summary. An alert (150% of the last `main` run) is
advisory and never fails the job — shared runners are too noisy for a hard gate.

**CodSpeed** (`.github/workflows/codspeed.yml`) counts instructions under Valgrind
(simulation mode), so a result does not move with the runner's load, and it
comments on pull requests. Two jobs feed one report:

- **Bun** — the cases in `codspeed.yml`, one `scripts/bench-case.ts` process each,
  on the runtime Mochi ships on. A number includes start-up and seed loading;
  compare against the `startup` case. Run locally with `codspeed run -m simulation`,
  or one case uninstrumented with `bun scripts/bench-case.ts <case>`.
- **Node** — small versions of the `bun run bench` cases (`CODSPEED_SUITES` in
  `scripts/lib/bench-suites.ts`, since Valgrind makes the full-size ones take over
  25 minutes) through tinybench: the operation alone. `scripts/build-codspeed.ts`
  bundles `bench/codspeed.ts` for Node; `bun run bench:codspeed` runs it
  uninstrumented. It runs in a worker with a 512 MB stack, because the self-hosted
  compiler relies on the proper tail calls JavaScriptCore implements and V8 does not.

## Mochi specs (`*.spec.mochi`)

`@mochi/test` binds `bun:test` as typed `extern`s (`test`, `describe`,
`assertEq` / `ok` / `throws` — ReScript's mocha helpers, with `assertEq` instead
of `eq` so prelude `eq` / `==` stay intact). `assertEq` is expected-first,
actual last, so `got |> assertEq(want)`.
Table tests are `testEach(title, rows, fn)` — one test per row, row passed as a
single argument (not bun `test.each`, which spreads; Mochi tuples are arrays).
Property tests are `check(title, arb, fn)` over `fast-check` combinators
(`int` / `pair` / `mapArb` / …) ([ADR 0088](adr/0088-table-and-pbt.md)).
Async Task tests are `testTask(title, task)` — bun waits on the Task thunk;
`Err` fails. Table form is `testEachTask`. Property form is `checkTask`.
Timeouts take milliseconds first: `testTimeout` / `testTaskTimeout` / …
([ADR 0089](adr/0089-task-tests.md)). Specs do not call `Task.run`.
`bunfig.toml` maps `.mochi` to the JS loader so `bun test` discovers
`*.spec.mochi` the same way it discovers `*.spec.ts`; `@mochi/test/preload`
compiles them through the module graph ([ADR 0086](adr/0086-bun-test-bindings.md)).
It re-exports `@mochi/bun/preload`, the same loader any Bun process that imports
`.mochi` runs with: `bun --preload @mochi/bun/preload app.ts` ([ADR 0108](adr/0108-bun-mochi-loader.md)).

A spec file is top-level `test(...)` / `describe(...)` / `testEach(...)` /
`check(...)` / `testTask(...)` / `testEachTask(...)` / `checkTask(...)`
statements ([ADR 0087](adr/0087-expr-statements.md)).
Bootstrap unit specs live next to the source (`bootstrap/*.spec.mochi`);
black-box compiler behavior lives in the ADR 0105 conformance corpus, with
host-facing façade and north-star tests under `test/`.

Run `bun run test:mochi:coverage` for a coverage report scoped to the colocated
bootstrap Mochi specs, including builtin-plugin specs. It prints function and line
coverage, including uncovered Mochi line ranges, and writes LCOV data to
`coverage/mochi/lcov.info` for CI or editor integrations. It enforces a 65% function
and line coverage floor for `bootstrap/**/*.mochi`; façade suites and non-bootstrap
Mochi specs intentionally sit outside this scoped gate. `bun run check:full` runs
the gate in CI.

`bun install` runs `prepare` → `scripts/setup-hooks.ts` →
`lefthook install --reset-hooks-path` (see `lefthook.yml`):

| Hook | When | What |
|---|---|---|
| `prepare-commit-msg` | every commit | strip tool/agent attribution trailers |
| `commit-msg` | every commit | refuse if any attribution trailer remains |
| `pre-commit` | every commit | `bun run check` (skip north-stars) |
| `pre-push` | every push | `bun run check:full` (same as CI) |

Escape hatch (rare): `LEFTHOOK=0` / `git commit --no-verify` / `git push --no-verify`.
Full north-stars stay on push (+ CI), not every commit.

Individual pieces: `test`, `typecheck`, `lint` / `lint:fix`, `format`, `loc`,
`gen:prelude` / `gen:prelude-defs` (regenerate the parity-guarded shims), `gen:mochi-dts`
(per-module `*.d.mochi.ts` sidecars — TS 5 `{name}.d.{ext}.ts` for `name.mochi`;
gitignored, regenerated by docs `check`/`dev`/`build`), `fmt:mochi`
(dogfood the formatter on every `.mochi` source in the repository), `build:ext` (VS Code
extension).

## Editor surfaces

- **Hover** — inferred types on demand, folded back to named record aliases where they
  match, with `///` doc comments attached (user docs on lets, externs, and type declarations;
  prelude builtins use the virtual prelude docstrings). Type declarations, constructors, record-alias fields, and
  type syntax also have parse-level hovers, so they remain readable when value inference fails.
  Otherwise-unhoverable syntax such as `let`, `extern`, `loop`, and collection sigils has a
  concise fallback hint rather than competing with a more-specific semantic hover.
  Hover runs on the self-hosted core: `hoverAt` (browser-safe, the docs site uses it) and the
  graph-aware `moduleHoverAt` in `@mochi/dx/bootstrap-hover`
  ([ADR 0122](adr/0122-bootstrap-hover.md)).
- **Go to definition / document highlight** — lexical symbol index (values, types, ctors,
  same-file record fields); works when typecheck fails. Prelude / builtins (including
  `Result.map`-style namespaces) resolve to a virtual `mochi:/prelude.mochi` buffer
  (read-only). Cross-module F12 follows import origins to the exporting module;
  on a relative `import` or `extern` path string it opens that target file directly;
  an `extern`'s imported-member string jumps to its host export when it can be found
  ([tracer bullets](dx-tracer-bullets.md)).
- **Go to type** — from an expression / value binding, jump to the nominal type decl
  (variant, record alias, or prelude `Option`/`Result`) via the infer table. Degrades to
  nothing when typecheck failed or the type is structural / primitive / unbound
  (`Array`/`List` have no type-space decl yet).
- **Find references / rename** — same-file and across the import graph; skips `$`/`_`
  synthetics, prelude, and record fields (field nav is name-heuristic only). F2 rewrites
  every occurrence of a user value/type/ctor binding.
- **Document / workspace symbols** — outline of top-level lets/types/ctors; workspace
  search over the open module graph.
- **Code actions** — `Diagnostic.suggestions` become quick fixes (e.g. did-you-mean on
unbound names), filtered to the diagnostics overlapping the requested range. A file
  using `"use open"` deliberately treats unknown names as
  host globals, so typo suggestions are not guessed there.
- **Diagnostics** — the same `Diagnostic` values the compiler produces, with spans; a
  `--json` structured form is available for machine consumers. Check/infer may emit
  **several** diagnostics in one run (ADR 0004); lex/parse still stop at the first.
  The LSP maps each to a `PublishDiagnostic` (range + message + `related` from labels;
  help is appended to the message). Suggestions ride along for code actions
  ([ADR 0003](adr/0003-rich-diagnostics.md), [ADR 0004](adr/0004-multi-error-diagnostics.md),
  [tracer bullets](dx-tracer-bullets.md)).
  The LSP also reports unused named local bindings, and unexported top-level bindings
  with no use, as warnings; prefix an intentionally unused binding with `_` to suppress
  the warning ([ADR 0070](adr/0070-lsp-unused-locals.md),
  [ADR 0094](adr/0094-lsp-unused-top-level.md)).
  Publishing is debounced (a burst of keystrokes compiles the graph once), each batch
  carries the buffer `version` it describes and is dropped if the buffer moved while it
  compiled, and closing a document retracts its diagnostics.
- **Formatter** — width-based pretty-printing that runs on lex + parse only (no type
  information needed), which is why it can format even code that doesn't yet type-check.
  It is the self-hosted `bootstrap/format.mochi`, run from the seed by `mochi fmt`, the
  LSP and `bun run fmt:mochi` ([ADR 0114](adr/0114-bootstrap-formatter-ships.md)). Vendor
  `format` hooks come from the manifest's self-hosted-core `plugins`.
- **`bun run lint:mochi [globs…]`** — the same `moduleDiagnostics` the LSP publishes, run
  over the repo's `.mochi` sources from the command line. Each file resolves its own
  `mochi.plugins.ts` by the upward walk `pluginsForDocument` does for the editor: sweeping
  without a tree's manifest reports its vendor call sites (`on(…)`, `tw.*`) as type errors.
  `fixtures/` and `test/conformance/` are skipped: they are broken on purpose, and the
  conformance runner checks their expected diagnostics (ADR 0105). A clean repo exits 0.
  Dependency inference is shared across files through a bootstrap graph cache, one per
  manifest, holding one slice per module ([ADR 0111](adr/0111-bootstrap-graph-per-module-slices.md)),
  so each module is inferred about once per sweep (~45s for `bootstrap/`, most of it the
  first cold graph). It is still seconds, not sub-second, so this is not wired into
  `lint` (biome) or the `check` gate — it is the standalone sweep, and the shape a
  `mochi check` command would take.
- **`.d.ts`** — HM types lowered to TypeScript declarations, including declarations for
  `extern` host modules.

Spans travel on every token, node, and type through the whole pipeline — hover,
diagnostics, completion, and formatting all depend on that. Synthetic identifiers are marked by
convention: `_`-prefixed names are emitted runtime helpers, `$`-prefixed names are
synthetic destructure temporaries (both excluded from hover and exports).
Completion (`completeAt` / `moduleCompleteAt`, [ADR 0013](adr/0013-lsp-completion.md))
lists prelude/`import * as` members, record fields, plugin-backed `tw.*` tags, JSX
props, and the values visible at the cursor; the LSP is a thin adapter with
`triggerCharacters: ["."]`. It runs on the self-hosted core
([ADR 0120](adr/0120-bootstrap-completion.md)); a `BootstrapPlugin`'s host-only
`completeMembers` hook lists members of an opaque receiver such as `tw`
([ADR 0121](adr/0121-bootstrap-complete-members.md)).

## Plugins

The Vite plugin (`MochiPluginOptions.plugins`), `gen-mochi-dts`, and the editor
extension all accept the same vendor-plugin list `compile`/`emitDts`/`format` do.
Apps keep one typed manifest — `mochi.plugins.ts` — read by Vite, `gen-mochi-dts`,
and the LSP (the extension walks upward from each open `.mochi` file; loads only
in a **trusted** workspace and only when the manifest resolves inside a workspace
folder). Export `default` or named `plugins` as the self-hosted-core list
(`BootstrapPlugin[]`, from each vendor's `/bootstrap` entry); the build and every
editor query read it ([ADR 0110](adr/0110-plugin-manifest-bootstrap-first.md),
[ADR 0123](adr/0123-manifest-drops-dx-plugins.md)). Vite may
also import a project-specific alias (`docsVendorPlugins`, …). A legacy `mochi.plugins.mjs`
beside it still works as a fallback. JSX needs no entry —
`jsxPlugin` is a builtin, registered by default; passing `plugins: []` is the non-UI
opt-out ([ADR 0011](adr/0011-language-plugins.md), [tracer bullets](dx-tracer-bullets.md)).
A plugin named like a builtin **replaces** it in place: list your own `"jsx"` plugin to
swap the builtin, or a hook-less stub (`{ name: "jsx" }`) to disable JSX while keeping
vendor plugins ([ADR 0049](adr/0049-plugin-name-shadowing.md)).
Hooks run in list order and the first to claim a node wins; a hook declines
anything it does not handle. Plugins declare no ownership up front, so there are no
claim clashes to report ([ADR 0128](adr/0128-bootstrap-plugin-shadowing.md) retires
ADR 0050's claims table). A manifest that lists two plugins under one name is still
an `onError` load failure.
