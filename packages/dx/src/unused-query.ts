/**
 * Unused-binding warnings from the bootstrap symbol index (`packages/compiler/src/check/symbols.mochi`).
 * A binding is its declaration span, so a shadowed name is its own binding.
 */
import { type CompilerOccurrence, symbolOccurrences } from "@mochi/compiler/graph";
import type { Stmt } from "@mochi/compiler/infer/types";

type Span = { readonly start: number; readonly end: number };

/** Where an unused binding sits, and whether it is a local or a module-scope `let`. */
export type UnusedBinding = {
  readonly name: string;
  readonly span: Span;
  readonly kind: "local" | "top-level";
};

const parked = (name: string): boolean => name.startsWith("_") || name.startsWith("$");

const within = (inner: Span, outer: Span): boolean =>
  outer.start <= inner.start && inner.end <= outer.end;

/**
 * - A local is unused when nothing refers to its declaration.
 * - A module-scope `let` that is not exported is unused when nothing refers
 *   to it from outside its own statement, so a self-recursive function does
 *   not keep itself alive. A mutually recursive dead pair still reads as used;
 *   closing that needs reachability, not liveness.
 * - `_`- and `$`-prefixed names are skipped: parked on purpose, or synthetic.
 */
export const unusedBindings = (stmts: readonly Stmt[]): UnusedBinding[] => {
  const occurrences = symbolOccurrences(stmts) as CompilerOccurrence[];
  const topLevel = new Map<number, { readonly exported: boolean; readonly span: Span }>();
  for (const s of stmts) {
    if (s._tag === "SLet") topLevel.set(s.nameSpan.start, { exported: s.exported, span: s.span });
    else if (s._tag === "SExtern") topLevel.set(s.nameSpan.start, { exported: true, span: s.span });
  }
  const usesOf = new Map<number, Span[]>();
  for (const o of occurrences) {
    if (o.role !== "use") continue;
    const uses = usesOf.get(o.defStart) ?? [];
    uses.push({ start: o.start, end: o.end });
    usesOf.set(o.defStart, uses);
  }
  const out: UnusedBinding[] = [];
  for (const o of occurrences) {
    if (o.role !== "def" || parked(o.name)) continue;
    const span = { start: o.defStart, end: o.defEnd };
    const uses = usesOf.get(o.defStart) ?? [];
    const top = topLevel.get(o.defStart);
    if (top === undefined) {
      if (uses.length === 0) out.push({ name: o.name, span, kind: "local" });
    } else if (!top.exported && !uses.some((u) => !within(u, top.span))) {
      out.push({ name: o.name, span, kind: "top-level" });
    }
  }
  return out;
};
