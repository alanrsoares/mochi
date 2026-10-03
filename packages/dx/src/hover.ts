/**
 * LSP-shaped hover, computed from the self-hosted core but free of any
 * editor/protocol dependency so it stays unit-testable under Bun. Given a byte
 * offset into the source, it reports the inferred type of the smallest
 * expression whose span contains that offset. The language server is a thin
 * adapter that maps a cursor Position onto an offset and this string onto a
 * hover popup.
 *
 * Browser-safe: the docs site calls `hoverAt`. The graph-aware
 * `moduleHoverAt` is Node-only and lives in `bootstrap-hover.ts`.
 */
import { resolve } from "node:path";
import { inferTypesRecoveringSync } from "@mochi/compiler/compile/sync";
import type { CompilerPlugin } from "@mochi/compiler/extensions";
import type { CompilerHelp, CompilerScheme, CompilerTypeAt } from "@mochi/compiler/graph";
import {
  type AliasInfo,
  foldAliases,
  type LocTok,
  type Row,
  type Stmt,
  type Tok,
  type Ty,
  type TypeExpr,
  widenLits,
} from "@mochi/compiler/infer/types";
import { preludeDocForBinding } from "@mochi/compiler/prelude-virtual";
import { spanContains, spanContainsClosed, tightestHit } from "@mochi/compiler/span";
import { lex, parseProgram } from "@mochi/compiler/syntax";
import { type Maybe, none, some } from "@onrails/maybe";
import { indexSource } from "./file-index";
import {
  renderHoverCtorScheme,
  renderHoverType,
  renderHoverTypeDecl,
  renderHoverTypeExpr,
  showHoverType,
} from "./hover-type";

/**
 * Hover payload: `code` is the mochi-fenced lead line (bare type, or TS-style
 * `let x: T` / `(parameter) x: T` / `(property) x: T`); `doc` is optional
 * prose from a leading `///` comment.
 */
export type HoverInfo = { code: string; doc?: string };

type Located = LocTok<Tok>;

type Span = { start: number; end: number };

/** A parse-level hover candidate — useful even when value inference fails. */
type SyntaxHover = { span: Span; info: HoverInfo };

type TokenHint = { token: Tok["_tag"]; info: HoverInfo };

/** Static hints only fill gaps left by declaration and inferred-type hovers. */
const TOKEN_HINTS: readonly TokenHint[] = [
  { token: "TLet", info: { code: "let binding", doc: "Declares a value binding." } },
  { token: "TExtern", info: { code: "extern binding", doc: "Declares a typed host binding." } },
  {
    token: "TImport",
    info: { code: "import", doc: "Brings exports from another Mochi module into scope." },
  },
  {
    token: "TExport",
    info: { code: "export", doc: "Makes a declaration available to importing modules." },
  },
  { token: "TLoop", info: { code: "loop", doc: "Starts a tail-recursive loop expression." } },
  {
    token: "TRecur",
    info: { code: "recur", doc: "Continues the nearest loop with replacement values." },
  },
  { token: "TDo", info: { code: "do", doc: "Sequences expressions and returns the last result." } },
  {
    token: "TPipe",
    info: { code: "|>", doc: "Pipes the left value into the function on the right." },
  },
  { token: "TConcat", info: { code: "++", doc: "Concatenates strings." } },
  {
    token: "TSpread",
    info: { code: "...", doc: "Splices a collection into a collection literal or pattern." },
  },
  { token: "TAt", info: { code: "@{…}", doc: "A lazy List literal or pattern." } },
  {
    token: "THash",
    info: { code: "#{…}", doc: "A Set literal, or a Map literal when entries use `:`." },
  },
];

const COMPOSE_HINT: HoverInfo = { code: ">>", doc: "Composes two functions right-to-left." };

/** The bootstrap lexer's tokens, or null when `src` does not lex. */
export const lexTokens = (src: string): readonly Located[] | null => {
  const lexed = lex(src) as { _tag: "Ok"; value: Located[] } | { _tag: "Err" };
  return lexed._tag === "Ok" ? lexed.value : null;
};

/** The recovering parse's statements, or null when `src` does not lex. */
export const hoverStmts = (
  src: string,
  plugins?: readonly CompilerPlugin[],
): readonly Stmt[] | null => {
  const parsed = parseProgram(src, plugins);
  return parsed._tag === "Ok" ? parsed.value.stmts : null;
};

/** `>>` lexes as two touching `>` (the parser glues them in expressions). */
const touchingGt = (tokens: readonly Located[], token: Located): boolean => {
  const i = tokens.indexOf(token);
  const prev = tokens[i - 1];
  const next = tokens[i + 1];
  return (
    (next?.tok._tag === "TGt" && token.end === next.start) ||
    (prev?.tok._tag === "TGt" && prev.end === token.start)
  );
};

export const tokenHoverAt = (tokens: readonly Located[], offset: number): HoverInfo | null => {
  const token = tokens.find((current) => spanContains(current, offset));
  if (!token) return null;
  if (token.tok._tag === "TStr" && token.tok.value === "use open")
    return { code: '"use open"', doc: "Permits unresolved names as host globals in this module." };
  if (token.tok._tag === "TGt" && touchingGt(tokens, token)) return COMPOSE_HINT;
  return TOKEN_HINTS.find((hint) => hint.token === token.tok._tag)?.info ?? null;
};

const collectTypeSyntax = (type: TypeExpr, out: SyntaxHover[]): void => {
  out.push({ span: type.span, info: { code: renderHoverTypeExpr(type, "type ") } });
  switch (type._tag) {
    case "TyArrow":
      collectTypeSyntax(type.from, out);
      collectTypeSyntax(type.to, out);
      return;
    case "TyApp":
    case "TyQual":
      for (const arg of type.args) collectTypeSyntax(arg, out);
      return;
    case "TyTuple":
      for (const elem of type.elems) collectTypeSyntax(elem, out);
      return;
    case "TyList":
      collectTypeSyntax(type.elem, out);
      return;
    case "TyUnion":
      for (const member of type.members) collectTypeSyntax(member, out);
      return;
    case "TyLit":
    case "TyName":
      return;
  }
};

const docOf = (doc: CompilerHelp): string | undefined =>
  doc._tag === "Some" ? doc.value : undefined;

const tightestInfo = (candidates: SyntaxHover[], offset: number): HoverInfo | null => {
  const hit = tightestHit(candidates, offset, spanContainsClosed);
  return hit._tag === "Some" ? hit.value.info : null;
};

/**
 * Declaration/type-syntax hovers intentionally come from the recovered parse
 * tree, not inference. They remain readable while an unrelated value expr
 * is incomplete or has a type error.
 */
export const syntaxHoverAt = (stmts: readonly Stmt[], offset: number): HoverInfo | null => {
  const candidates: SyntaxHover[] = [];
  for (const stmt of stmts) {
    if (stmt._tag === "SLet" && stmt.annot._tag === "Some")
      collectTypeSyntax(stmt.annot.value, candidates);
    if (stmt._tag === "SExtern") {
      collectTypeSyntax(stmt.typeExpr, candidates);
      candidates.push({
        span: stmt.nameSpan,
        info: {
          code: `${renderHoverTypeExpr(stmt.typeExpr, `extern ${stmt.name}: `)}\n= ${JSON.stringify(stmt.module)} ${JSON.stringify(stmt.imported)}`,
          doc: docOf(stmt.doc),
        },
      });
    }
    if (stmt._tag !== "SType") continue;
    const decl = renderHoverTypeDecl(stmt);
    const doc = docOf(stmt.doc);
    candidates.push({ span: stmt.span, info: { code: decl, doc } });
    candidates.push({ span: stmt.nameSpan, info: { code: decl, doc } });
    for (const ctor of stmt.ctors) {
      candidates.push({ span: ctor.span, info: { code: renderHoverCtorScheme(stmt, ctor) } });
      for (const field of ctor.fields) collectTypeSyntax(field.fieldType, candidates);
    }
    for (const field of stmt.alias._tag === "Some" ? stmt.alias.value : []) {
      candidates.push({
        span: field.nameSpan,
        info: { code: renderHoverTypeExpr(field.fieldType, `(property) ${field.name}: `) },
      });
      collectTypeSyntax(field.fieldType, candidates);
    }
    if (stmt.aliasType._tag === "Some") collectTypeSyntax(stmt.aliasType.value, candidates);
  }
  return tightestInfo(candidates, offset);
};

/** Named imports hover with the scheme they bind; `import * as` with its source. */
export const importHoverAt = (
  stmts: readonly Stmt[],
  offset: number,
  imports: ReadonlyMap<string, CompilerScheme>,
): HoverInfo | null => {
  const candidates: SyntaxHover[] = [];
  for (const stmt of stmts) {
    if (stmt._tag === "SImportNs")
      candidates.push({
        span: stmt.alias.span,
        info: { code: `namespace ${stmt.alias.name}\nfrom ${JSON.stringify(stmt.from)}` },
      });
    if (stmt._tag !== "SImport") continue;
    for (const name of stmt.names) {
      const scheme = imports.get(name.name);
      if (!scheme) continue;
      candidates.push({
        span: name.span,
        info: {
          code: `import { ${name.name} }: ${showHoverType(scheme.ty as Ty)}\nfrom ${JSON.stringify(stmt.from)}`,
        },
      });
    }
  }
  return tightestInfo(candidates, offset);
};

type HoverSym = Extract<CompilerTypeAt["sym"], { _tag: "Some" }>["value"];

/** TS-style lead: `kind name: ` for a named binder, nothing for a bare type. */
const prefixOf = (symbol: HoverSym | undefined): string => {
  switch (symbol?.kind) {
    case undefined:
      return "";
    case "let":
      return `let ${symbol.name}: `;
    case "parameter":
      return `(parameter) ${symbol.name}: `;
    case "property":
      return `(property) ${symbol.name}: `;
    case "extern":
      return `extern ${symbol.name}: `;
    default:
      return "";
  }
};

/** Doc from a user `///` on the binding, else the virtual-prelude docstring. */
const docAt = (
  src: string,
  path: string,
  offset: number,
  symbol: HoverSym | undefined,
): string | undefined => {
  const own = symbol ? docOf(symbol.doc) : undefined;
  if (own) return own;
  // Virtual buffers (`<buffer>`) skip path.resolve — the browser's `node:path`
  // shim needs `process` for a relative path (docs site hover).
  const key = path.startsWith("<") ? path : resolve(path);
  const hit = indexSource(key, src)?.at(offset);
  return hit ? preludeDocForBinding(hit.binding) : undefined;
};

/** Type names renamed through `qualify` (`E` → `D.E`, C5c). */
const qualifyTy = (ty: Ty, qualify: ReadonlyMap<string, string>): Ty => {
  if (qualify.size === 0) return ty;
  const row = (r: Row): Row =>
    r._tag === "RowExtend"
      ? { ...r, fieldType: qualifyTy(r.fieldType, qualify), rest: row(r.rest) }
      : r;
  switch (ty._tag) {
    case "TyCon":
      return {
        _tag: "TyCon",
        name: qualify.get(ty.name) ?? ty.name,
        args: ty.args.map((arg) => qualifyTy(arg, qualify)),
      };
    case "TyFn":
      return { _tag: "TyFn", from: qualifyTy(ty.from, qualify), to: qualifyTy(ty.to, qualify) };
    case "TyRecord":
      return { _tag: "TyRecord", row: row(ty.row) };
    case "TyOneOf":
      return { _tag: "TyOneOf", members: ty.members.map((m) => qualifyTy(m, qualify)) };
    case "TyVar":
    case "TySingleton":
      return ty;
  }
};

/**
 * Render the tightest recorded type at `offset`: aliases folded back to their
 * names, literals widened, imported names qualified. A binder or field read
 * carries its symbol (ADR 0119), so it leads with `let x: T` /
 * `(parameter) x: T` / `(property) x: T`.
 */
export const hoverFrom = (
  types: readonly CompilerTypeAt[],
  aliases: ReadonlyMap<string, unknown>,
  offset: number,
  src: string,
  path: string,
  qualify: ReadonlyMap<string, string> = new Map(),
): HoverInfo | null => {
  const hit = tightestHit(types, offset, spanContainsClosed);
  if (hit._tag === "None") return null;
  const folded = foldAliases(hit.value.ty as Ty, aliases as Map<string, AliasInfo>);
  const ty = qualifyTy(widenLits(folded), qualify);
  const symbol = hit.value.sym._tag === "Some" ? hit.value.sym.value : undefined;
  return { code: renderHoverType(ty, prefixOf(symbol)), doc: docAt(src, path, offset, symbol) };
};

/**
 * Hover at `offset`, or null when nothing sits under the cursor. Strict by
 * default; `"use open"` permits host globals. Recovering, so a hole elsewhere
 * in the file does not blank out hover on the intact parts (C9 slice e).
 * Single-file: imports bind nothing, so prefer `moduleHoverAt` when a path is
 * available.
 */
export const hoverAt = (
  src: string,
  offset: number,
  path = "<buffer>",
  plugins?: readonly CompilerPlugin[],
): HoverInfo | null => {
  const tokens = lexTokens(src);
  if (!tokens) return null;
  const stmts = hoverStmts(src, plugins);
  const syntax = stmts && syntaxHoverAt(stmts, offset);
  if (syntax) return syntax;
  const fallback = tokenHoverAt(tokens, offset);
  const inferred = inferTypesRecoveringSync(src, plugins);
  return inferred._tag === "Ok"
    ? (hoverFrom(inferred.value.types, inferred.value.aliases, offset, src, path) ?? fallback)
    : fallback;
};

/** Mochi-facing hover seam: absence uses the language's `Option`, not a JS null sentinel. */
export const hoverAtOption = (src: string, offset: number, path = "<buffer>"): Maybe<HoverInfo> => {
  const info = hoverAt(src, offset, path);
  return info === null ? none() : some(info);
};
