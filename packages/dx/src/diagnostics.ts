/**
 * LSP-shaped publish diagnostics, computed from `compile` but free of any
 * editor/protocol dependency so it stays unit-testable under Bun. The language
 * server is a thin adapter that maps these onto vscode-languageserver types.
 * The compiler error type is `Diagnostic` (`errors.ts`); this file's
 * `PublishDiagnostic` is the wire-shaped DTO only (ADR 0003).
 */
import { resolve } from "node:path";
import type { ImportStmt, Program } from "@mochi/compiler/ast";
import { checkGraphBootstrapRecovering } from "@mochi/compiler/bootstrap";
import { toTypedProgram, toTypedProgramWith } from "@mochi/compiler/compile";
import { checkErr, type Diagnostic } from "@mochi/compiler/errors";
import type { LanguagePlugin } from "@mochi/compiler/extensions";
import { lex } from "@mochi/compiler/lexer";
import { type ModuleCache, moduleContext, resolveImport } from "@mochi/compiler/module";
import { parse } from "@mochi/compiler/parser";
import { preludeNamespaces } from "@mochi/compiler/prelude";
import type { Env, Scheme } from "@mochi/compiler/schemes";
import { lineCol, type Span } from "@mochi/compiler/span";
import { indexProgram, type SymbolIndex } from "@mochi/compiler/symbols";
import { tVar } from "@mochi/compiler/types";
import { err, isErr, ok, type Result } from "@onrails/result";

/** 0-based line/character — matches the LSP `Position` shape. */
export type Position = { line: number; character: number };
export type Range = { start: Position; end: Position };

export type RelatedInformation = {
  message: string;
  path: string;
  range: Range;
};

export type PublishSuggestion = {
  title: string;
  path: string;
  range: Range;
  replaceWith: string;
};

export type PublishDiagnostic = {
  range: Range;
  message: string;
  severity?: "warning";
  code?: string;
  related?: RelatedInformation[];
  suggestions?: PublishSuggestion[];
};

const posAt = (src: string, offset: number): Position => {
  const lc = lineCol(src, offset);
  return { line: lc.line - 1, character: lc.col - 1 };
};

const spanRange = (src: string, start: number, end: number): Range => ({
  start: posAt(src, start),
  end: posAt(src, end),
});

/** Map a span to a range; spanless errors fall back to the first character. */
const rangeOf = (src: string, e: Diagnostic): Range =>
  e.span
    ? spanRange(src, e.span.start, e.span.end)
    : { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } };

/** Map a compiler Diagnostic onto the publish DTO (labels → related, etc.). */
export function toPublish(
  src: string,
  e: Diagnostic,
  path = "<buffer>",
  sources?: ReadonlyMap<string, string>,
): PublishDiagnostic {
  const related = (e.labels ?? []).map((label) => {
    const labelPath = label.location.path || path;
    const labelSrc = sources?.get(labelPath) ?? src;
    return {
      message: label.message,
      path: labelPath,
      range: spanRange(labelSrc, label.location.span.start, label.location.span.end),
    };
  });
  const suggestions = (e.suggestions ?? []).map((s) => {
    const sPath = s.location.path || path;
    const sSrc = sources?.get(sPath) ?? src;
    return {
      title: s.title ?? `Replace with ${JSON.stringify(s.replaceWith)}`,
      path: sPath,
      range: spanRange(sSrc, s.location.span.start, s.location.span.end),
      replaceWith: s.replaceWith,
    };
  });
  let message = `${e.kind}: ${e.message}`;
  if (e.help) message = `${message}\nhelp: ${e.help}`;
  return {
    range: rangeOf(src, e),
    message,
    ...(related.length > 0 ? { related } : {}),
    ...(suggestions.length > 0 ? { suggestions } : {}),
  };
}

/** Options threaded into `moduleDiagnostics` / single-file `diagnostics` — `plugins` (styled-cva, …), same list Vite / `gen-mochi-dts` use. Omitted = default/builtin resolution (`resolvePlugins`, ADR 0011). `cache` reuses dependency inference across calls (`createModuleCache`); omitted = no reuse. */
export type ModuleDiagnosticsOptions = { plugins?: LanguagePlugin[]; cache?: ModuleCache };

/**
 * Graph diagnostics through the frozen bootstrap compiler. Project plugins are
 * intentionally excluded: the seed can run builtin JSX, but not arbitrary
 * TypeScript plugin modules loaded by the editor.
 */
export async function bootstrapModuleDiagnostics(
  path: string,
  src: string,
  readFile: (p: string) => Promise<string>,
): Promise<PublishDiagnostic[]> {
  const errors = await checkGraphBootstrapRecovering(path, src, readFile);
  return errors.map((error) => {
    const tagged = /^module '([^']+)': (.*)$/.exec(error.message);
    const errorPath = error.path ?? tagged?.[1];
    const messageBody = tagged?.[2] ?? error.message;
    const dependency = errorPath && resolve(errorPath) !== resolve(path);
    const imports = [...src.matchAll(/from\s+["']([^"']+)["']/g)];
    const lineStart = src.lastIndexOf("\n", Math.max(0, error.start - 1)) + 1;
    const nextLine = src.indexOf("\n", error.end);
    const lineEnd = nextLine === -1 ? src.length : nextLine;
    const importAtError = /^\s*import\b.*\bfrom\s+["']([^"']+)["']/.exec(
      src.slice(lineStart, lineEnd),
    );
    let span = { start: error.start, end: error.end };
    let message = messageBody;
    if (dependency) {
      const match = imports.find(
        (candidate) => resolveImport(path, candidate[1]!) === resolve(errorPath!),
      );
      if (match) {
        const start = src.lastIndexOf("\n", Math.max(0, match.index! - 1)) + 1;
        const end = src.indexOf("\n", match.index!);
        span = { start, end: end === -1 ? src.length : end };
      }
      message = `module '${match?.[1] ?? errorPath}' failed to compile: ${messageBody}`;
    } else if (importAtError) {
      span = { start: lineStart, end: lineEnd };
      message = `module '${importAtError[1]}' failed to compile: ${messageBody}`;
    }
    const help =
      error.suggestions?.[0]?.title.toLowerCase() ??
      (/^unbound variable /.test(messageBody)
        ? "bind the name before using it, or check the spelling"
        : undefined);
    return toPublish(
      src,
      {
        kind: "type",
        message,
        span,
        help,
        suggestions: error.suggestions?.map((suggestion) => ({
          title: suggestion.title,
          replaceWith: suggestion.replaceWith,
          location: { path, span: { start: suggestion.start, end: suggestion.end } },
        })),
      },
      path,
    );
  });
}

/**
 * Check + infer may emit several diagnostics (ADR 0004); so may parse, since
 * recovery reports every unparsable region (ADR 0045). Only lex still yields a
 * single one. Single-file: imports resolve to nothing, so a `switch` on an imported
 * variant reads as an unknown constructor. Use `moduleDiagnostics` when a path
 * is available.
 *
 * **Strict unbound (`open: false`).** Emit/codegen stays open-world so bare host
 * globals still lower; the editor must flag typos (`useRefssss`, misspelled
 * locals). `opts.plugins` still reaches infer so vendor `inferCall` runs.
 */
export function diagnostics(src: string, opts: ModuleDiagnosticsOptions = {}): PublishDiagnostic[] {
  const r = toTypedProgram(src, {
    open: false,
    namespaces: preludeNamespaces,
    plugins: opts.plugins,
  });
  return isErr(r) ? r.error.map((e) => toPublish(src, e)) : [];
}

/**
 * Module-aware diagnostics: resolve `path`'s dependency graph (deps read from
 * disk via `readFile`, the edited file served from the live `src` buffer) and
 * check + infer the live program WITH the imported registry/schemes. This is
 * what stops a match on an imported constructor from being a false "unknown
 * constructor", and makes cross-module exhaustiveness real. `opts.plugins`
 * (styled-cva, …) reaches the same call, so a project's host kits don't
 * produce false type errors in the editor that Vite/`gen-mochi-dts` don't see.
 *
 * Degradation is deliberate: the entry's own lex/parse errors are always
 * reported (they never depend on deps). If the dep graph can't be resolved or a
 * dep fails to compile, the failure is surfaced at the entry's `import`
 * statement (`graphFailureDiagnostics`) and the entry itself degrades to
 * single-file checking with every imported name pre-bound (`fallbackDiagnostics`)
 * so the user sees the real cause, not an "unbound variable" cascade.
 */
export async function moduleDiagnostics(
  path: string,
  src: string,
  readFile: (p: string) => Promise<string>,
  opts: ModuleDiagnosticsOptions = {},
): Promise<PublishDiagnostic[]> {
  const parsed = parseForDiagnostics(src, path, opts);
  if (isErr(parsed)) return parsed.error;
  // The shipped seed handles the builtin language graph, including recovery.
  // Arbitrary project plugins still execute in the TypeScript host until their
  // plugin ABI is bootstrap-native. The cache is a TS graph object, so callers
  // that opt into it retain that host until bootstrap owns cache invalidation.
  if (opts.plugins === undefined && opts.cache === undefined)
    return bootstrapModuleDiagnostics(path, src, readFile);
  return moduleDiagnosticsFor(parsed.value, src, path, readFile, opts);
}

/**
 * The front of every diagnostic pass: lex + parse once, with failures already
 * mapped onto the publish DTO. Callers that need both the graph diagnostics and
 * the liveness warnings ({@link documentDiagnostics}) share this one parse
 * instead of paying for two.
 */
const parseForDiagnostics = (
  src: string,
  path: string,
  opts: ModuleDiagnosticsOptions,
): Result<Program, PublishDiagnostic[]> => {
  const lexed = lex(src);
  if (isErr(lexed)) return err([toPublish(src, lexed.error, path)]);
  const parsed = parse(lexed.value, { plugins: opts.plugins });
  // Every parse diagnostic, not just the first (ADR 0045).
  return isErr(parsed) ? err(parsed.error.map((d) => toPublish(src, d, path))) : ok(parsed.value);
};

/** {@link moduleDiagnostics} past its lex/parse front — see that doc comment. */
async function moduleDiagnosticsFor(
  prog: Program,
  src: string,
  path: string,
  readFile: (p: string) => Promise<string>,
  opts: ModuleDiagnosticsOptions,
): Promise<PublishDiagnostic[]> {
  const entry = resolve(path);
  const read = (p: string): Promise<string> =>
    resolve(p) === entry ? Promise.resolve(src) : readFile(p);
  // `entryOpen: false` mirrors the strict mode the entry is inferred with below,
  // and is what lets `moduleContext` hand back a cached answer for the entry
  // itself when the buffer matches what is already on disk (ADR 0095).
  const ctx = await moduleContext(entry, read, {
    plugins: opts.plugins,
    cache: opts.cache,
    entryOpen: false,
  });
  if (isErr(ctx))
    return [
      ...graphFailureDiagnostics(src, prog, entry, ctx.error),
      ...fallbackDiagnostics(src, prog, entry, opts),
    ];

  const cached = ctx.value.entryDiagnostics;
  if (cached) return cached.map((e) => toPublish(src, e, entry));
  const typed = toTypedProgramWith(prog, ctx.value, {
    plugins: opts.plugins,
    open: false,
  });
  return isErr(typed) ? typed.error.map((e) => toPublish(src, e, entry)) : [];
}

/**
 * Everything the editor publishes for one buffer: {@link moduleDiagnostics}
 * plus the liveness warnings, off a single lex/parse. A buffer that does not
 * lex or parse has no bindings to judge, so its parse errors are the whole
 * answer — the same degradation the two passes had separately.
 */
export async function documentDiagnostics(
  path: string,
  src: string,
  readFile: (p: string) => Promise<string>,
  opts: ModuleDiagnosticsOptions = {},
): Promise<PublishDiagnostic[]> {
  const parsed = parseForDiagnostics(src, path, opts);
  if (isErr(parsed)) return parsed.error;
  return [
    ...(opts.plugins === undefined && opts.cache === undefined
      ? await bootstrapModuleDiagnostics(path, src, readFile)
      : await moduleDiagnosticsFor(parsed.value, src, path, readFile, opts)),
    ...unusedBindingDiagnosticsFor(parsed.value, src, path),
  ];
}

/** Warning-only liveness diagnostics, derived from lexical binding identity. */
export function unusedBindingDiagnostics(
  src: string,
  path = "<buffer>",
  opts: ModuleDiagnosticsOptions = {},
): PublishDiagnostic[] {
  const parsed = parseForDiagnostics(src, path, opts);
  return isErr(parsed) ? [] : unusedBindingDiagnosticsFor(parsed.value, src, path);
}

const unusedBindingDiagnosticsFor = (
  prog: Program,
  src: string,
  path: string,
): PublishDiagnostic[] => {
  const idx = indexProgram(path, prog);
  return [
    ...unusedLocalDiagnosticsFromProgram(src, idx),
    ...unusedTopLevelDiagnosticsFromProgram(src, prog, idx),
  ];
};

const unusedLocalDiagnosticsFromProgram = (src: string, idx: SymbolIndex): PublishDiagnostic[] =>
  idx.localBindings().flatMap((binding) => {
    const used = idx.occurrences(binding).some((occurrence) => occurrence.role === "use");
    return used
      ? []
      : [
          {
            range: spanRange(src, binding.def.span.start, binding.def.span.end),
            message: `unused local binding '${binding.name}'`,
            severity: "warning" as const,
            code: "unused-local",
          },
        ];
  });

/**
 * A module-scope `let` that is not exported and never referenced is dead — only
 * this file can see it, so one file is the whole search. References from INSIDE
 * the binding's own statement do not count, or every self-recursive function
 * would keep itself alive. A mutually recursive dead pair still reads as used;
 * that blind spot is the same one `tsc` has, and closing it needs reachability,
 * not liveness.
 */
const unusedTopLevelDiagnosticsFromProgram = (
  src: string,
  prog: Program,
  idx: SymbolIndex,
): PublishDiagnostic[] =>
  prog.stmts.flatMap((s) => {
    // `_`/`$` mirror the local convention: deliberately parked, and synthetic.
    if (s.kind !== "let" || s.exported) return [];
    if (s.name.startsWith("_") || s.name.startsWith("$")) return [];
    const binding = idx.binding("value", s.name);
    if (!binding || binding.def.span.start !== s.nameSpan.start) return [];
    const usedElsewhere = idx
      .occurrences(binding)
      .some((o) => o.role === "use" && !spanWithin(o.span, s.span));
    return usedElsewhere
      ? []
      : [
          {
            range: spanRange(src, s.nameSpan.start, s.nameSpan.end),
            message: `unused binding '${s.name}'`,
            severity: "warning" as const,
            code: "unused-top-level",
          },
        ];
  });

const spanWithin = (inner: Span, outer: Span): boolean =>
  outer.start <= inner.start && inner.end <= outer.end;

const importsOf = (prog: Program): ImportStmt[] =>
  prog.stmts.filter((s): s is ImportStmt => s.kind === "import");

/**
 * Surface a module-graph failure IN the entry file: one diagnostic per failing
 * module, anchored at the entry's `import … from "<spec>"` statement that pulls
 * it in (matched by `resolveImport`; a transitive dep that no entry import
 * resolves to degrades to the first import statement, message prefixed with the
 * dep's absolute path). A failure the driver attributes to the entry itself —
 * `gatherImports` on the entry, e.g. a missing export — already spans an entry
 * import statement, so it anchors there; anything else publishes as-is.
 */
function graphFailureDiagnostics(
  src: string,
  prog: Program,
  entry: string,
  errors: Diagnostic[],
): PublishDiagnostic[] {
  const imports = importsOf(prog);
  const seen = new Set<string>();
  const out: PublishDiagnostic[] = [];
  for (const d of errors) {
    const isDep = d.path !== undefined && resolve(d.path) !== entry;
    const imp = isDep
      ? imports.find((i) => resolveImport(entry, i.from) === resolve(d.path!))
      : // Entry-attributed: the span (import name) sits inside an import stmt.
        imports.find((i) => d.span && i.span.start <= d.span.start && d.span.end <= i.span.end);
    if (!isDep && !imp) {
      // Entry-attributed with a span of its own (e.g. an import cycle) — real range, publish as-is.
      out.push(toPublish(src, d, entry));
      continue;
    }
    // One wrapped diagnostic per failing module / per import statement.
    const key = isDep ? resolve(d.path!) : `entry:${imp!.span.start}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const span = imp?.span ?? imports[0]?.span ?? { start: 0, end: 1 };
    const spec = imp?.from ?? d.path!;
    out.push(
      toPublish(src, checkErr(`module '${spec}' failed to compile: ${d.message}`, span), entry),
    );
  }
  return out;
}

/** `forall a. a` — what an import binds to when its module can't provide a real scheme. */
const anyScheme = (): Scheme => ({ vars: [0], rvars: [], type: tVar(0) });

/**
 * Single-file degradation for a broken module graph. Same strict (`open:
 * false`) check + infer as `diagnostics`, EXCEPT every name the entry imports
 * is pre-bound to `forall a. a`: those names are real — their module just
 * failed — so flagging each as an "unbound variable" would bury the one
 * diagnostic that matters (the graph failure) under cascade noise. Local typos
 * still surface. Plain `diagnostics()` keeps its strict behavior untouched.
 */
function fallbackDiagnostics(
  src: string,
  prog: Program,
  path: string,
  opts: ModuleDiagnosticsOptions,
): PublishDiagnostic[] {
  const imports: Env = new Map();
  for (const imp of importsOf(prog)) {
    if (imp.alias) imports.set(imp.alias.name, anyScheme());
    for (const n of imp.names) imports.set(n.name, anyScheme());
  }
  const typed = toTypedProgramWith(
    prog,
    { imports, importedReg: { ctor: new Map(), type: new Map() } },
    { plugins: opts.plugins, open: false },
  );
  return isErr(typed) ? typed.error.map((e) => toPublish(src, e, path)) : [];
}
