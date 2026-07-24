import { fromNullable, type Maybe } from "@onrails/maybe";

/** Source spans — half-open byte offsets [start, end) into the source text. Threaded from tokens → AST nodes → errors so every diagnostic can point at a location (and an LSP can map a cursor position back to a node). */
export type Span = { start: number; end: number };

/** A span anchored to a source file (absolute path). Labels, suggestions, and symbol-index hits share this so cross-module "defined here" / go-to-definition stay one shape (ADR 0003). */
export type Location = { path: string; span: Span };

/** Anything with a source span — the input shape for {@link tightestHit}. */
export type Spanned = { span: Span };

export const span = (start: number, end: number): Span => ({ start, end });

/** The span covering two spans (and everything between): left edge of `a`, right edge of `b`. Callers pass them in source order. */
export const spanning = (a: Span, b: Span): Span => ({ start: a.start, end: b.end });

/** Half-open containment: `[start, end)` — matches the span invariant. */
export const spanContains = (s: Span, offset: number): boolean =>
  offset >= s.start && offset < s.end;

/**
 * Closed containment: `[start, end]`. Used by the infer type-table (hover /
 * go-to-type) so a cursor parked on the end offset still hits the node.
 */
export const spanContainsClosed = (s: Span, offset: number): boolean =>
  offset >= s.start && offset <= s.end;

/**
 * Tightest-span hit among `items` containing `offset`; ties keep the first.
 * Expected absence → `None`. Defaults to half-open containment.
 */
export const tightestHit = <T extends Spanned>(
  items: readonly T[],
  offset: number,
  contains: (s: Span, offset: number) => boolean = spanContains,
): Maybe<T> => {
  let best: T | undefined;
  for (const item of items) {
    if (!contains(item.span, offset)) continue;
    const width = item.span.end - item.span.start;
    if (!best || width < best.span.end - best.span.start) best = item;
  }
  return fromNullable(best);
};

/** 1-based line/column for an offset — for human-readable "line:col" messages. */
export type LineCol = { line: number; col: number };

export const lineCol = (src: string, offset: number): LineCol => {
  let line = 1;
  let col = 1;
  const n = Math.min(offset, src.length);
  for (let i = 0; i < n; i++) {
    if (src[i] === "\n") {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
  return { line, col };
};
