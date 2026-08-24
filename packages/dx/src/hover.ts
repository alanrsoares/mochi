/**
 * LSP-shaped hover, computed from the compiler pipeline but free of any
 * editor/protocol dependency so it stays unit-testable under Bun. Given a byte
 * offset into the source, it reports the inferred type of the smallest
 * expression whose span contains that offset. The language server is a thin
 * adapter that maps a cursor Position onto an offset and this string onto a
 * hover popup.
 */
import { resolve } from "node:path";
import type { Program } from "@mochi/compiler/ast";
import { openMode, toTypedProgramRecovering, toTypedProgramWith } from "@mochi/compiler/compile";
import type { LanguagePlugin } from "@mochi/compiler/extensions";
import type { InferResult, SymbolInfo, TypeAt } from "@mochi/compiler/infer";
import { lex } from "@mochi/compiler/lexer";
import { moduleContext } from "@mochi/compiler/module";
import { parseRecovering } from "@mochi/compiler/parser";
import { preludeNamespaces } from "@mochi/compiler/prelude";
import { preludeDocForBinding } from "@mochi/compiler/prelude-virtual";
import { type QualMap, widenLits } from "@mochi/compiler/schemes";
import { spanContainsClosed, tightestHit } from "@mochi/compiler/span";
import { indexProgram } from "@mochi/compiler/symbols";
import { foldAliases, qualifyTypeNames, showType } from "@mochi/compiler/types";
import { type Maybe, map, match as matchMaybe, none, some } from "@onrails/maybe";
import { isErr, isOk } from "@onrails/result";

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

/**
 * `Shape` → `D.Shape` for every type an `import * as D` brings into type
 * position (C5, ADR 0046), so hover names what this file can write. A name the
 * file declares itself wins — it is already writable bare, and it shadows.
 * First alias wins when two namespaces export the same type name.
 */
const qualifierMap = (quals: QualMap, prog: Program): ReadonlyMap<string, string> => {
  const local = new Set(prog.stmts.flatMap((s) => (s.kind === "type" ? [s.name] : [])));
  const out = new Map<string, string>();
  for (const [alias, qual] of quals)
    for (const name of qual.types)
      if (!local.has(name) && !out.has(name)) out.set(name, `${alias}.${name}`);
  return out;
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
      const type = showType(
        qualifyTypeNames(widenLits(foldAliases(hit.type, res.aliases)), qualify),
      );
      return { code: lead(type, hit.symbol), doc: docAt(src, path, offset, hit.symbol) };
    }),
    (info) => info,
    () => null,
  );

/**
 * Hover at `offset`, or null when the source doesn't typecheck or nothing sits
 * under the cursor. Strict by default; `// @mochi open` permits host globals. Single-file: a file with
 * imports won't typecheck (imported constructors are unknown), so prefer
 * `moduleHoverAt` when a path is available.
 */
export const hoverAt = (src: string, offset: number, path = "<buffer>"): HoverInfo | null => {
  const r = toTypedProgramRecovering(src, { namespaces: preludeNamespaces });
  return isOk(r) ? hoverFrom(r.value.res, offset, src, path) : null;
};

/** Mochi-facing hover seam: absence uses the language's `Option`, not a JS null sentinel. */
export const hoverAtOption = (src: string, offset: number, path = "<buffer>"): Maybe<HoverInfo> => {
  const info = hoverAt(src, offset, path);
  return info === null ? none() : some(info);
};

/** Options threaded into module-aware nav/hover/diagnostics — `plugins` (styled-cva, …), same list Vite / `gen-mochi-dts` use. Omitted = default/builtin resolution (`resolvePlugins`, ADR 0011). */
export type ModuleHoverOptions = { plugins?: LanguagePlugin[] };

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

  const entry = resolve(path);
  const read = (p: string): Promise<string> =>
    resolve(p) === entry ? Promise.resolve(src) : readFile(p);
  const ctx = await moduleContext(entry, read, { plugins: opts.plugins });
  if (isErr(ctx)) return hoverAt(src, offset, entry);

  const typed = toTypedProgramWith(program, ctx.value, {
    plugins: opts.plugins,
    open: openMode(src),
  });
  if (isErr(typed)) return null;
  const qualify = qualifierMap(ctx.value.qualTypes, program);
  return hoverFrom(typed.value.res, offset, src, entry, qualify);
};
