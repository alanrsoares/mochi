// LSP-shaped hover, computed from the compiler pipeline but free of any
// editor/protocol dependency so it stays unit-testable under Bun. Given a byte
// offset into the source, it reports the inferred type of the smallest
// expression whose span contains that offset. The language server is a thin
// adapter that maps a cursor Position onto an offset and this string onto a
// hover popup.
import { resolve } from "node:path";
import { isErr } from "@onrails/result";
import { toTypedProgram, toTypedProgramWith } from "./compile";
import type { InferResult, SymbolInfo, TypeAt } from "./infer";
import { lex } from "./lexer";
import { moduleContext } from "./module";
import { parse } from "./parser";
import { preludeNamespaces } from "./prelude";
import { foldAliases, showType } from "./types";

// The tightest span containing `offset`, or null if none. Ties (nested spans of
// equal width) are broken toward the first — they denote the same location.
const tightest = (types: TypeAt[], offset: number): TypeAt | null => {
  let best: TypeAt | null = null;
  for (const t of types) {
    if (offset < t.span.start || offset > t.span.end) continue;
    const width = t.span.end - t.span.start;
    if (!best || width < best.span.end - best.span.start) best = t;
  }
  return best;
};

// A hover payload: `code` is the mochi-fenced lead line (a bare type, or a
// TS-style `let x: T` / `(parameter) x: T` / `(property) x: T`), `doc` is an
// optional prose paragraph (a leading `///` comment) rendered below the fence.
export type HoverInfo = { code: string; doc?: string };

// TS-style lead: `kind name: type` for a named symbol, bare type otherwise.
const lead = (type: string, symbol: SymbolInfo | undefined): string => {
  if (!symbol) return type;
  if (symbol.kind === "let") return `let ${symbol.name}: ${type}`;
  if (symbol.kind === "parameter") return `(parameter) ${symbol.name}: ${type}`;
  return `(property) ${symbol.name}: ${type}`;
};

// The tightest-span type at `offset`, rendered as a hover payload.
const hoverFrom = (res: InferResult, offset: number): HoverInfo | null => {
  const hit = tightest(res.types, offset);
  if (!hit) return null;
  const type = showType(foldAliases(hit.type, res.aliases));
  return { code: lead(type, hit.symbol), doc: hit.symbol?.doc };
};

// The hover at `offset`, or null when the source doesn't typecheck or nothing
// sits under the cursor. Open-world so host globals infer. Single-file: a file
// with imports won't typecheck (the imported constructors are unknown), so
// prefer `moduleHoverAt` when a path is available.
export const hoverAt = (src: string, offset: number): HoverInfo | null => {
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces });
  return isErr(r) ? null : hoverFrom(r.value.res, offset);
};

// Module-aware hover: resolve `path`'s dependency graph (deps from disk via
// `readFile`, the edited file from the live `src` buffer) and check + infer the
// live program WITH the imported registry/schemes. Without this, any file that
// imports a variant fails to typecheck and yields no hover at all. Degrades to
// single-file `hoverAt` if the dep graph can't be resolved.
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
  const prog = parsed.value;

  const entry = resolve(path);
  const read = (p: string): Promise<string> =>
    resolve(p) === entry ? Promise.resolve(src) : readFile(p);
  const ctx = await moduleContext(entry, read);
  if (isErr(ctx)) return hoverAt(src, offset);

  const typed = toTypedProgramWith(prog, ctx.value);
  return isErr(typed) ? null : hoverFrom(typed.value.res, offset);
};
