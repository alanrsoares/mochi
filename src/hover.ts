/**
 * LSP-shaped hover, computed from the compiler pipeline but free of any
 * editor/protocol dependency so it stays unit-testable under Bun. Given a byte
 * offset into the source, it reports the inferred type of the smallest
 * expression whose span contains that offset. The language server is a thin
 * adapter that maps a cursor Position onto an offset and this string onto a
 * hover popup.
 */
import { resolve } from "node:path";
import { map, match as matchMaybe } from "@onrails/maybe";
import { isErr, isOk } from "@onrails/result";
import { toTypedProgram, toTypedProgramWith } from "./compile";
import type { InferResult, SymbolInfo, TypeAt } from "./infer";
import { lex } from "./lexer";
import { moduleContext } from "./module";
import { parse } from "./parser";
import { preludeNamespaces } from "./prelude";
import { preludeDocForBinding } from "./prelude-virtual";
import { spanContainsClosed, tightestHit } from "./span";
import { indexProgram } from "./symbols";
import { foldAliases, showType } from "./types";

/** Tightest inferred type span containing `offset` (closed ends; ties → first). */
const tightestType = (types: TypeAt[], offset: number) =>
  tightestHit(types, offset, spanContainsClosed);

/**
 * Hover payload: `code` is the mochi-fenced lead line (bare type, or TS-style
 * `let x: T` / `(parameter) x: T` / `(property) x: T`); `doc` is optional
 * prose from a leading `///` comment.
 */
export type HoverInfo = { code: string; doc?: string };

/** TS-style lead: `kind name: type` for a named symbol, bare type otherwise. */
const lead = (type: string, symbol: SymbolInfo | undefined): string => {
  if (!symbol) return type;
  if (symbol.kind === "let") return `let ${symbol.name}: ${type}`;
  if (symbol.kind === "parameter") return `(parameter) ${symbol.name}: ${type}`;
  return `(property) ${symbol.name}: ${type}`;
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
  const parsed = parse(lexed.value);
  if (isErr(parsed)) return undefined;
  const hit = indexProgram(resolve(path), parsed.value).at(offset);
  return hit ? preludeDocForBinding(hit.binding) : undefined;
};

/** Render the tightest-span type at `offset` as a hover payload. */
const hoverFrom = (res: InferResult, offset: number, src: string, path: string): HoverInfo | null =>
  matchMaybe(
    map(tightestType(res.types, offset), (hit) => {
      const type = showType(foldAliases(hit.type, res.aliases));
      return { code: lead(type, hit.symbol), doc: docAt(src, path, offset, hit.symbol) };
    }),
    (info) => info,
    () => null,
  );

/**
 * Hover at `offset`, or null when the source doesn't typecheck or nothing sits
 * under the cursor. Open-world so host globals infer. Single-file: a file with
 * imports won't typecheck (imported constructors are unknown), so prefer
 * `moduleHoverAt` when a path is available.
 */
export const hoverAt = (src: string, offset: number, path = "<buffer>"): HoverInfo | null => {
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces });
  return isOk(r) ? hoverFrom(r.value.res, offset, src, path) : null;
};

/**
 * Module-aware hover: resolve `path`'s dependency graph (deps from disk via
 * `readFile`, the edited file from the live `src` buffer) and check + infer the
 * live program WITH the imported registry/schemes. Without this, any file that
 * imports a variant fails to typecheck and yields no hover. Degrades to
 * single-file `hoverAt` if the dep graph can't be resolved.
 */
export const moduleHoverAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: (p: string) => Promise<string>,
): Promise<HoverInfo | null> => {
  const lexed = lex(src);
  if (isErr(lexed)) return null;
  const parsed = parse(lexed.value);
  if (isErr(parsed)) return null;

  const entry = resolve(path);
  const read = (p: string): Promise<string> =>
    resolve(p) === entry ? Promise.resolve(src) : readFile(p);
  const ctx = await moduleContext(entry, read);
  if (isErr(ctx)) return hoverAt(src, offset, entry);

  const typed = toTypedProgramWith(parsed.value, ctx.value);
  return isOk(typed) ? hoverFrom(typed.value.res, offset, src, entry) : null;
};
