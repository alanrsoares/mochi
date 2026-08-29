/**
 * LSP-shaped hover, computed from the compiler pipeline but free of any
 * editor/protocol dependency so it stays unit-testable under Bun. Given a byte
 * offset into the source, it reports the inferred type of the smallest
 * expression whose span contains that offset. The language server is a thin
 * adapter that maps a cursor Position onto an offset and this string onto a
 * hover popup.
 */
import { resolve } from "node:path";
import type { Program, TypeExpr } from "@mochi/compiler/ast";
import { openMode, toTypedProgramRecovering, toTypedProgramWith } from "@mochi/compiler/compile";
import type { LanguagePlugin } from "@mochi/compiler/extensions";
import { type InferResult, type SymbolInfo, showScheme, type TypeAt } from "@mochi/compiler/infer";
import { type Located, lex, type Tok } from "@mochi/compiler/lexer";
import { type ModuleCache, type ModuleContext, moduleContext } from "@mochi/compiler/module";
import { parseRecovering } from "@mochi/compiler/parser";
import { preludeNamespaces } from "@mochi/compiler/prelude";
import { preludeDocForBinding } from "@mochi/compiler/prelude-virtual";
import { widenLits } from "@mochi/compiler/schemes";
import { spanContains, spanContainsClosed, tightestHit } from "@mochi/compiler/span";
import { indexProgram } from "@mochi/compiler/symbols";
import { foldAliases, qualifierMap, qualifyTypeNames, showType } from "@mochi/compiler/types";
import { type Maybe, map, match as matchMaybe, none, some } from "@onrails/maybe";
import { isErr, isOk } from "@onrails/result";
import {
  renderHoverCtorScheme,
  renderHoverType,
  renderHoverTypeDecl,
  renderHoverTypeExpr,
} from "./hover-type";

/** Tightest inferred type span containing `offset` (closed ends; ties → first). */
const tightestType = (types: TypeAt[], offset: number) =>
  tightestHit(types, offset, spanContainsClosed);

/**
 * Hover payload: `code` is the mochi-fenced lead line (bare type, or TS-style
 * `let x: T` / `(parameter) x: T` / `(property) x: T`); `doc` is optional
 * prose from a leading `///` comment.
 */
export type HoverInfo = { code: string; doc?: string };

/** A parse-level hover candidate — useful even when value inference fails. */
type SyntaxHover = { span: { start: number; end: number }; info: HoverInfo };

type TokenHint = { token: Tok["t"]; info: HoverInfo };

/** Static hints only fill gaps left by declaration and inferred-type hovers. */
const TOKEN_HINTS: readonly TokenHint[] = [
  { token: "let", info: { code: "let binding", doc: "Declares a value binding." } },
  { token: "extern", info: { code: "extern binding", doc: "Declares a typed host binding." } },
  {
    token: "import",
    info: { code: "import", doc: "Brings exports from another Mochi module into scope." },
  },
  {
    token: "export",
    info: { code: "export", doc: "Makes a declaration available to importing modules." },
  },
  { token: "loop", info: { code: "loop", doc: "Starts a tail-recursive loop expression." } },
  {
    token: "recur",
    info: { code: "recur", doc: "Continues the nearest loop with replacement values." },
  },
  { token: "do", info: { code: "do", doc: "Sequences expressions and returns the last result." } },
  {
    token: "pipe",
    info: { code: "|>", doc: "Pipes the left value into the function on the right." },
  },
  { token: "compose", info: { code: ">>", doc: "Composes two functions right-to-left." } },
  { token: "concat", info: { code: "++", doc: "Concatenates strings." } },
  {
    token: "spread",
    info: { code: "...", doc: "Splices a collection into a collection literal or pattern." },
  },
  { token: "at", info: { code: "@{…}", doc: "A lazy List literal or pattern." } },
  {
    token: "hash",
    info: { code: "#{…}", doc: "A Set literal, or a Map literal when entries use `:`." },
  },
];

const tokenHoverAt = (tokens: Located[], offset: number): HoverInfo | null => {
  const token = tokens.find((current) => spanContains(current.span, offset));
  if (!token) return null;
  if (token.t === "str" && token.v === "use open")
    return { code: '"use open"', doc: "Permits unresolved names as host globals in this module." };
  return TOKEN_HINTS.find((hint) => hint.token === token.t)?.info ?? null;
};

const collectTypeSyntax = (type: TypeExpr, out: SyntaxHover[]): void => {
  out.push({ span: type.span, info: { code: renderHoverTypeExpr(type, "type ") } });
  switch (type.kind) {
    case "tarrow":
      collectTypeSyntax(type.from, out);
      collectTypeSyntax(type.to, out);
      return;
    case "tapp":
      for (const arg of type.args) collectTypeSyntax(arg, out);
      return;
    case "ttuple":
      for (const elem of type.elems) collectTypeSyntax(elem, out);
      return;
    case "tlist":
      collectTypeSyntax(type.elem, out);
      return;
    case "tqual":
      for (const arg of type.args) collectTypeSyntax(arg, out);
      return;
    case "tlit":
      return;
    case "tunion":
      for (const member of type.members) collectTypeSyntax(member, out);
      return;
    case "tname":
      return;
  }
};

/**
 * Declaration/type-syntax hovers intentionally come from the recovered parse
 * tree, not Algorithm W. They remain readable while an unrelated value expr
 * is incomplete or has a type error.
 */
const syntaxHoverAt = (program: Program, offset: number): HoverInfo | null => {
  const candidates: SyntaxHover[] = [];
  for (const stmt of program.stmts) {
    if (stmt.kind === "let" && stmt.annot) collectTypeSyntax(stmt.annot, candidates);
    if (stmt.kind === "extern") {
      collectTypeSyntax(stmt.typeExpr, candidates);
      candidates.push({
        span: stmt.nameSpan,
        info: {
          code: `${renderHoverTypeExpr(stmt.typeExpr, `extern ${stmt.name}: `)}\n= ${JSON.stringify(stmt.module)} ${JSON.stringify(stmt.imported)}`,
          doc: stmt.doc,
        },
      });
    }
    if (stmt.kind !== "type") continue;
    const decl = renderHoverTypeDecl(stmt);
    candidates.push({ span: stmt.span, info: { code: decl, doc: stmt.doc } });
    candidates.push({ span: stmt.nameSpan, info: { code: decl, doc: stmt.doc } });
    for (const ctor of stmt.ctors) {
      candidates.push({
        span: ctor.span,
        info: { code: renderHoverCtorScheme(stmt, ctor) },
      });
      for (const field of ctor.fields) collectTypeSyntax(field.type, candidates);
    }
    for (const field of stmt.alias ?? []) {
      candidates.push({
        span: field.nameSpan,
        info: { code: renderHoverTypeExpr(field.type, `(property) ${field.name}: `) },
      });
      collectTypeSyntax(field.type, candidates);
    }
    if (stmt.aliasType) collectTypeSyntax(stmt.aliasType, candidates);
  }
  const hit = tightestHit(candidates, offset, spanContainsClosed);
  return hit._tag === "Some" ? hit.value.info : null;
};

/** Module imports need their already-compiled dependency schemes to be useful. */
const importHoverAt = (program: Program, offset: number, ctx: ModuleContext): HoverInfo | null => {
  const candidates: SyntaxHover[] = [];
  for (const stmt of program.stmts) {
    if (stmt.kind !== "import") continue;
    if (stmt.alias) {
      candidates.push({
        span: stmt.alias.span,
        info: { code: `namespace ${stmt.alias.name}\nfrom ${JSON.stringify(stmt.from)}` },
      });
      continue;
    }
    for (const name of stmt.names) {
      const scheme = ctx.imports.get(name.name);
      if (!scheme) continue;
      candidates.push({
        span: name.span,
        info: {
          code: `import { ${name.name} }: ${showScheme(scheme)}\nfrom ${JSON.stringify(stmt.from)}`,
        },
      });
    }
  }
  const hit = tightestHit(candidates, offset, spanContainsClosed);
  return hit._tag === "Some" ? hit.value.info : null;
};

/** TS-style lead: `kind name: type` for a named symbol, bare type otherwise. */
const lead = (type: string, symbol: SymbolInfo | undefined): string => {
  if (!symbol) return type;
  switch (symbol.kind) {
    case "let":
      return `let ${symbol.name}: ${type}`;
    case "parameter":
      return `(parameter) ${symbol.name}: ${type}`;
    case "extern": {
      const shown = symbol.surface ?? type;
      const host =
        symbol.module !== undefined && symbol.imported !== undefined
          ? `\n= ${JSON.stringify(symbol.module)} ${JSON.stringify(symbol.imported)}`
          : "";
      return `extern ${symbol.name}: ${shown}${host}`;
    }
  }
  return `(property) ${symbol.name}: ${type}`;
};

/** Prefix that participates in the hover layout; externs retain their source signature. */
const inferredPrefix = (symbol: SymbolInfo | undefined): string | null => {
  if (!symbol) return "";
  switch (symbol.kind) {
    case "let":
      return `let ${symbol.name}: `;
    case "parameter":
      return `(parameter) ${symbol.name}: `;
    case "property":
      return `(property) ${symbol.name}: `;
    case "extern":
      return null;
  }
};

/** Doc from a user `///` on the binding, else the virtual-prelude docstring. */
const docAt = (
  src: string,
  path: string,
  offset: number,
  symbol: SymbolInfo | undefined,
): string | undefined => {
  if (symbol?.doc) return symbol.doc;
  const lexed = lex(src);
  if (isErr(lexed)) return undefined;
  // Recovering: a `///` doc on an intact binding is readable even when another
  // region of the file doesn't parse (C9 slice e).
  const { program } = parseRecovering(lexed.value);
  // Virtual buffers (`<buffer>`) skip path.resolve — node:path needs `process`,
  // which browsers don't have (docs site imports hoverAt for twoslash).
  const key = path.startsWith("<") ? path : resolve(path);
  const hit = indexProgram(key, program).at(offset);
  return hit ? preludeDocForBinding(hit.binding) : undefined;
};

/** Render the tightest-span type at `offset` as a hover payload. */
const hoverFrom = (
  res: InferResult,
  offset: number,
  src: string,
  path: string,
  qualify: ReadonlyMap<string, string> = new Map(),
): HoverInfo | null =>
  matchMaybe(
    map(tightestType(res.types, offset), (hit) => {
      const type = qualifyTypeNames(widenLits(foldAliases(hit.type, res.aliases)), qualify);
      const prefix = inferredPrefix(hit.symbol);
      const code =
        prefix === null ? lead(showType(type), hit.symbol) : renderHoverType(type, prefix);
      return { code, doc: docAt(src, path, offset, hit.symbol) };
    }),
    (info) => info,
    () => null,
  );

/**
 * Hover at `offset`, or null when the source doesn't typecheck or nothing sits
 * under the cursor. Strict by default; `"use open"` permits host globals. Single-file: a file with
 * imports won't typecheck (imported constructors are unknown), so prefer
 * `moduleHoverAt` when a path is available.
 */
export const hoverAt = (src: string, offset: number, path = "<buffer>"): HoverInfo | null => {
  const lexed = lex(src);
  const fallback = isOk(lexed) ? tokenHoverAt(lexed.value, offset) : null;
  if (isOk(lexed)) {
    const syntax = syntaxHoverAt(parseRecovering(lexed.value).program, offset);
    if (syntax) return syntax;
  }
  const r = toTypedProgramRecovering(src, { namespaces: preludeNamespaces });
  return isOk(r) ? (hoverFrom(r.value.res, offset, src, path) ?? fallback) : fallback;
};

/** Mochi-facing hover seam: absence uses the language's `Option`, not a JS null sentinel. */
export const hoverAtOption = (src: string, offset: number, path = "<buffer>"): Maybe<HoverInfo> => {
  const info = hoverAt(src, offset, path);
  return info === null ? none() : some(info);
};

/** Options threaded into module-aware nav/hover/diagnostics — `plugins` (styled-cva, …), same list Vite / `gen-mochi-dts` use. Omitted = default/builtin resolution (`resolvePlugins`, ADR 0011). */
export type ModuleHoverOptions = { plugins?: LanguagePlugin[]; cache?: ModuleCache };

/**
 * Module-aware hover: resolve `path`'s dependency graph (deps from disk via
 * `readFile`, the edited file from the live `src` buffer) and check + infer the
 * live program WITH the imported registry/schemes. Without this, any file that
 * imports a variant fails to typecheck and yields no hover. Degrades to
 * single-file `hoverAt` if the dep graph can't be resolved. `opts.plugins`
 * (styled-cva, …) reaches both the dependency graph and the live buffer, so
 * `tw.*` factories hover with a real component scheme instead of `unknown`.
 */
export const moduleHoverAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: (p: string) => Promise<string>,
  opts: ModuleHoverOptions = {},
): Promise<HoverInfo | null> => {
  const lexed = lex(src);
  if (isErr(lexed)) return null;
  // Recovering, so a hole elsewhere in the file doesn't blank out hover on the
  // parts that are intact (C9 slice e).
  const { program } = parseRecovering(lexed.value, { plugins: opts.plugins });
  const syntax = syntaxHoverAt(program, offset);
  if (syntax) return syntax;

  const entry = resolve(path);
  const read = (p: string): Promise<string> =>
    resolve(p) === entry ? Promise.resolve(src) : readFile(p);
  const ctx = await moduleContext(entry, read, { plugins: opts.plugins, cache: opts.cache });
  if (isErr(ctx)) return hoverAt(src, offset, entry);
  const imported = importHoverAt(program, offset, ctx.value);
  if (imported) return imported;

  const typed = toTypedProgramWith(program, ctx.value, {
    plugins: opts.plugins,
    open: openMode(src),
  });
  if (isErr(typed)) return tokenHoverAt(lexed.value, offset);
  const localTypes = new Set(program.stmts.flatMap((s) => (s.kind === "type" ? [s.name] : [])));
  const qualify = qualifierMap(ctx.value.qualTypes, localTypes);
  return (
    hoverFrom(typed.value.res, offset, src, entry, qualify) ?? tokenHoverAt(lexed.value, offset)
  );
};
