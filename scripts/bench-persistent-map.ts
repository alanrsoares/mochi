// Sizing only (ADR 0159): an unordered, insert/get-only persistent trie against the
// copy-on-write `Map.set` of the runtime. The real design must also keep insertion
// order, delete, and use `eq` keys; this measures the asymptotic floor.
import { _Map_set } from "../packages/compiler/src/prelude/runtime.ts";

type Leaf = { readonly k: string; readonly v: number };
type Node = { readonly bm: number; readonly kids: readonly (Leaf | Node)[] };

const isLeaf = (x: Leaf | Node): x is Leaf => "k" in x;

const hash = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h | 0;
};

const pop = (n: number): number => {
  const a = n - ((n >>> 1) & 0x55555555);
  const b = (a & 0x33333333) + ((a >>> 2) & 0x33333333);
  return Math.imul((b + (b >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
};

const empty: Node = { bm: 0, kids: [] };

const insert = (n: Node, k: string, v: number, h: number, sh: number): Node => {
  const bit = 1 << ((h >>> sh) & 31);
  const i = pop(n.bm & (bit - 1));
  if (!(n.bm & bit)) {
    const grown = [...n.kids.slice(0, i), { k, v }, ...n.kids.slice(i)];
    return { bm: n.bm | bit, kids: grown };
  }
  const kids = n.kids.slice();
  const c = n.kids[i] as Leaf | Node;
  if (!isLeaf(c)) kids[i] = insert(c, k, v, h, sh + 5);
  else if (c.k === k || sh >= 30) kids[i] = { k, v };
  else kids[i] = insert(insert(empty, c.k, c.v, hash(c.k), sh + 5), k, v, h, sh + 5);
  return { bm: n.bm, kids };
};

const set = (n: Node, k: string, v: number): Node => insert(n, k, v, hash(k), 0);

const get = (n: Node, k: string): number | undefined => {
  const h = hash(k);
  let cur: Node = n;
  for (let sh = 0; ; sh += 5) {
    const bit = 1 << ((h >>> sh) & 31);
    if (!(cur.bm & bit)) return undefined;
    const c = cur.kids[pop(cur.bm & (bit - 1))] as Leaf | Node;
    if (isLeaf(c)) return c.k === k ? c.v : undefined;
    cur = c;
  }
};

const best = (f: () => void, runs = 3): number => {
  let b = Number.POSITIVE_INFINITY;
  for (let i = 0; i < runs; i++) {
    const s = performance.now();
    f();
    b = Math.min(b, performance.now() - s);
  }
  return b;
};

const mapSet = _Map_set as (k: string, v: number, m: Map<string, number>) => Map<string, number>;

for (const n of [1000, 5000, 20000]) {
  const keys = Array.from({ length: n }, (_, i) => `k${i}`);
  const fold = best(() => {
    let m = new Map<string, number>();
    for (const k of keys) m = mapSet(k, 1, m);
  });
  const mutable = best(() => {
    const m = new Map<string, number>();
    for (const k of keys) m.set(k, 1);
  });
  const trie = best(() => {
    let m = empty;
    for (const k of keys) m = set(m, k, 1);
  });
  const nm = new Map<string, number>();
  let tm = empty;
  for (const k of keys) {
    nm.set(k, 1);
    tm = set(tm, k, 1);
  }
  const getN = best(() => {
    for (const k of keys) nm.get(k);
  }, 5);
  const getT = best(() => {
    for (const k of keys) get(tm, k);
  }, 5);
  const updC = best(() => {
    for (let i = 0; i < 200; i++) mapSet(`x${i}`, 1, nm);
  });
  const updT = best(() => {
    for (let i = 0; i < 200; i++) set(tm, `x${i}`, 1);
  });
  console.log(
    `n=${n} build: fold-copy ${fold.toFixed(1)}ms | native-mutable ${mutable.toFixed(2)}ms | trie ${trie.toFixed(1)}ms || get-all: native ${getN.toFixed(2)} trie ${getT.toFixed(2)} || 200 single updates: copy ${updC.toFixed(1)} trie ${updT.toFixed(2)}`,
  );
}
