// Source spans — half-open byte offsets [start, end) into the source text.
// Threaded from tokens → AST nodes → errors so every diagnostic can point at
// a location (and an LSP can map a cursor position back to a node).
export type Span = { start: number; end: number };

export const span = (start: number, end: number): Span => ({ start, end });

// The span covering two spans (and everything between): left edge of `a`,
// right edge of `b`. Callers pass them in source order.
export const spanning = (a: Span, b: Span): Span => ({ start: a.start, end: b.end });

// 1-based line/column for an offset — for human-readable "line:col" messages.
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
