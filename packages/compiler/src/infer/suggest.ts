/** Tiny edit-distance helper for did-you-mean suggestions on unbound names. Kept dependency-free and small — only used at diagnostic construction sites. */

const lev = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min((cur[j - 1] ?? 0) + 1, (prev[j] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    prev = cur;
  }
  return prev[n] ?? n;
};

const sameCaseClass = (a: string, b: string): boolean => {
  const upperA = /^[A-Z]/.test(a);
  const upperB = /^[A-Z]/.test(b);
  return upperA === upperB;
};

export type ClosestOpts = {
  /** Cap edit distance (open-world uses 1 to avoid eating host globals). */
  maxDist?: number;
};

/** Closest candidate within a lenient edit-distance budget, or null. */
export const closestName = (
  want: string,
  names: Iterable<string>,
  opts: ClosestOpts = {},
): string | null => {
  let best: string | null = null;
  let bestDist = Infinity;
  const budget = opts.maxDist ?? Math.max(1, Math.floor(want.length / 3));
  for (const n of names) {
    if (!n || n === want || n.startsWith("$") || n.startsWith("_")) continue;
    if (!sameCaseClass(want, n)) continue;
    const d = lev(want, n);
    if (d <= budget && d < bestDist) {
      best = n;
      bestDist = d;
    }
  }
  return best;
};
