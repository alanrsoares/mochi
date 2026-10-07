// The runtime — SOURCE OF TRUTH for both backends (ADR 0075). The TypeScript
// backend imports this module directly (ADR 0026); the JS backend gets the same
// definitions with their types stripped, via the generated `js-defs.gen.ts`
// (`bun run gen:prelude-defs`, guarded by `test/prelude-defs.spec.ts`).
//
// Each public annotation is the HM signature in `prelude.ts` rendered as a flat
// TS type — `test/runtime-types.spec.ts` fails if the two drift apart, so adding
// a builtin means adding its HM entry and the annotation the spec prints for it.
// Bodies are trusted: their params are `any` because the annotation is the
// contract, and the JS-backend differential tests are what prove them correct.
export type Option<A> = { _tag: "Some"; value: A } | { _tag: "None" };
export type Result<A, B> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: B };
export type Task<A, E> = () => Promise<Result<A, E>>;

// Flat dispatch for compiler-generated, exhaustive builtin matches. Separate
// callback result types preserve mixed loop-step and generic return branches.
export const _Result_match: <A, E, L, R>(
  result: Result<A, E>,
  onErr: (error: E) => L,
  onOk: (value: A) => R,
) => L | R = (result, onErr, onOk) => {
  if (result._tag === "Err") return onErr(result.error);
  if (result._tag === "Ok") return onOk(result.value);
  throw new Error("non-exhaustive match");
};
export const _Option_match: <A, L, R>(
  option: Option<A>,
  onNone: () => L,
  onSome: (value: A) => R,
) => L | R = (option, onNone, onSome) => {
  if (option._tag === "None") return onNone();
  if (option._tag === "Some") return onSome(option.value);
  throw new Error("non-exhaustive match");
};

/**
 * The curry-compatible function type (ADR 0093). `_curry` makes an arity-n
 * binding callable in ANY partial-application grouping — `f(a, b)`, `f(a)(b)`,
 * `f(a, b)(c)` — which the TS backend used to type as one overload per
 * composition of the arity, 2^(n-1) of them. `_Curry` says the same thing once.
 *
 * A prefix is EXACT and NON-EMPTY: not `Partial<A>`, which would let a caller
 * skip a leading argument by passing `undefined` and have `_curry` bind it; and
 * not `[]`, which widens every partial-application result to a union tsc cannot
 * resolve. Both conditionals are wrapped in tuples so a `T` inferred as a union
 * of prefixes does not distribute and leave the result unresolved.
 */
export type _CurryPre<A extends unknown[]> = A extends [infer H, ...infer R]
  ? [H] | [H, ..._CurryPre<R>]
  : never;
export type _CurryTail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : [];
export type _CurryDrop<A extends unknown[], T extends unknown[]> = T extends [unknown, ...infer TR]
  ? _CurryDrop<_CurryTail<A>, TR>
  : A;
export type _Curry<A extends unknown[], R> = [A] extends [[]]
  ? R
  : <T extends _CurryPre<A>>(
      ...args: T
    ) => [_CurryDrop<A, T>] extends [[]] ? R : _Curry<_CurryDrop<A, T>, R>;

export const _list = <T>(g: () => Iterator<T>): Iterable<T> => ({ [Symbol.iterator]: g });
export const _curry = (n: number, f: (...args: any[]) => any): ((...args: any[]) => any) => {
  // `f` applied to `a`, spelled out for the common arities: a spread call is
  // several times slower.
  const apply = (a: any[]): any => {
    switch (a.length) {
      case 2:
        return f(a[0], a[1]);
      case 3:
        return f(a[0], a[1], a[2]);
      case 4:
        return f(a[0], a[1], a[2], a[3]);
      case 5:
        return f(a[0], a[1], a[2], a[3], a[4]);
      case 6:
        return f(a[0], a[1], a[2], a[3], a[4], a[5]);
      default:
        return f(...a);
    }
  };
  function c(...a: any[]): any {
    if (a.length === n) return apply(a);
    if (a.length < n) return (...b: any[]) => c(...a, ...b);
    return a.slice(n).reduce((g: any, x: any) => g(x), apply(a.slice(0, n)));
  }
  // Saturated calls and one-short partials are the common cases for the two
  // commonest arities, so they skip the generic path's spreads.
  if (n === 2)
    return (...a: any[]): any => {
      if (a.length === 2) return f(a[0], a[1]);
      if (a.length !== 1) return c(...a);
      const x = a[0];
      return (...b: any[]): any => (b.length === 1 ? f(x, b[0]) : c(x, ...b));
    };
  if (n === 3)
    return (...a: any[]): any => {
      if (a.length === 3) return f(a[0], a[1], a[2]);
      if (a.length === 2) {
        const [x, y] = a;
        return (...b: any[]): any => (b.length === 1 ? f(x, y, b[0]) : c(x, y, ...b));
      }
      if (a.length !== 1) return c(...a);
      const x = a[0];
      return _curry(2, (y: any, z: any) => f(x, y, z));
    };
  return c;
};
export const _tuple = <T extends unknown[]>(...xs: T): T => xs;
export const _recur = <A extends unknown[]>(...args: A): { _tag: "recur"; args: A } => ({
  _tag: "recur",
  args,
});
export const _done = <R>(value: R): { _tag: "done"; value: R } => ({ _tag: "done", value });
export const Some: <A>(value: A) => Option<A> = (value: any) => ({ _tag: "Some", value });
export const None: Option<never> = { _tag: "None" };
// An escaping optional read `u.f`: one member read, nullish -> None (ADR 0139).
export const _opt = <A>(v: A | null | undefined): Option<A> =>
  v != null ? { _tag: "Some", value: v } : { _tag: "None" };
export const Ok: <A, B>(value: A) => Result<A, B> = (value: any) => ({ _tag: "Ok", value });
export const Err: <A, B>(error: B) => Result<A, B> = (error: any) => ({ _tag: "Err", error });
export const add: { (a: number): (b: number) => number; (a: number, b: number): number } = _curry(
  2,
  (a: any, b: any) => a + b,
);
export const sub: { (a: number): (b: number) => number; (a: number, b: number): number } = _curry(
  2,
  (a: any, b: any) => a - b,
);
export const mul: { (a: number): (b: number) => number; (a: number, b: number): number } = _curry(
  2,
  (a: any, b: any) => a * b,
);
export const div: { (a: number): (b: number) => number; (a: number, b: number): number } = _curry(
  2,
  (a: any, b: any) => a / b,
);
export const square: (a: number) => number = (x: any) => x * x;
export const sqrt: (a: number) => number = (x: any) => Math.sqrt(x);
export const hypot: { (a: number): (b: number) => number; (a: number, b: number): number } = _curry(
  2,
  (a: any, b: any) => Math.hypot(a, b),
);
export const pi: number = Math.PI;
export const concat: { <A>(a: A): (b: A) => A; <A>(a: A, b: A): A } = _curry(2, (a: any, b: any) =>
  typeof a === "string" ? a + b : Array.isArray(a) ? a.concat(b) : _List_concat(a, b),
);
export const eq: { <A>(a: A): (b: A) => boolean; <A>(a: A, b: A): boolean } = _curry(
  2,
  (x: any, y: any) => {
    if (x === y) return true;
    if (typeof x !== "object" || x === null || typeof y !== "object" || y === null) return false;
    const ax = Array.isArray(x);
    if (ax !== Array.isArray(y)) return false;
    if (ax) {
      if (x.length !== y.length) return false;
      for (let i = 0; i < x.length; i++) if (!eq(x[i], y[i])) return false;
      return true;
    }
    if (x instanceof Map || y instanceof Map) {
      if (!(x instanceof Map) || !(y instanceof Map)) return false;
      if (x.size !== y.size) return false;
      for (const [k, v] of x) {
        const key = _keyOf(y, k);
        if (!y.has(key) || !eq(v, y.get(key))) return false;
      }
      return true;
    }
    if (x instanceof Set || y instanceof Set) {
      if (!(x instanceof Set) || !(y instanceof Set)) return false;
      if (x.size !== y.size) return false;
      for (const v of x) if (!y.has(_keyOf(y, v))) return false;
      return true;
    }
    if (typeof x[Symbol.iterator] === "function" || typeof y[Symbol.iterator] === "function")
      throw new TypeError("eq on List: force it first with List.toArray");
    // Single pass over own enumerable keys, no key arrays: fields are compared
    // before the key counts, so mismatched shapes may read a getter first.
    const own = Object.prototype.hasOwnProperty;
    let nx = 0,
      ny = 0;
    for (const k in x)
      if (own.call(x, k)) {
        nx++;
        if (!Object.prototype.propertyIsEnumerable.call(y, k) || !eq(x[k], y[k])) return false;
      }
    for (const k in y) if (own.call(y, k)) ny++;
    return nx === ny;
  },
);
// Variant positional fields follow their numeric index; named fields follow
// in lexical order. Length avoids rounding very large host-supplied indices.
export const _compareFieldNames: (a: string, b: string) => number = (a, b) => {
  const ax = /^_(0|[1-9]\d*)$/.test(a),
    bx = /^_(0|[1-9]\d*)$/.test(b);
  if (ax !== bx) return ax ? -1 : 1;
  if (ax && a.length !== b.length) return a.length < b.length ? -1 : 1;
  return a < b ? -1 : a > b ? 1 : 0;
};
// Records may already be constructed in key order. Scan first so
// deterministic ordering does not pay for sorting an already sorted key list.
export const _compareSortedKeys: (keys: readonly string[], tagged: boolean) => readonly string[] = (
  keys,
  tagged,
) => {
  for (let i = 1; i < keys.length; i++) {
    const order = tagged
      ? _compareFieldNames(keys[i - 1]!, keys[i]!)
      : keys[i - 1]! < keys[i]!
        ? -1
        : 1;
    if (order > 0) {
      // Native sort dominates small key lists on Bun. A private insertion-sort
      // buffer bounds that work; larger shapes retain O(k log k) native sorting.
      if (keys.length > 16) return keys.slice().sort(tagged ? _compareFieldNames : undefined);
      const sorted = keys.slice();
      for (let at = i; at < sorted.length; at++) {
        const key = sorted[at]!;
        let before = at - 1;
        while (
          before >= 0 &&
          (tagged ? _compareFieldNames(sorted[before]!, key) > 0 : sorted[before]! > key)
        ) {
          sorted[before + 1] = sorted[before]!;
          before -= 1;
        }
        sorted[before + 1] = key;
      }
      return sorted;
    }
  }
  return keys;
};
// An early field difference needs only the minimum key, not a full key sort.
export const _compareFirstKey: (keys: readonly string[], tagged: boolean) => string = (
  keys,
  tagged,
) => {
  let first = keys[0]!;
  for (let i = 1; i < keys.length; i++) {
    const key = keys[i]!;
    if (tagged ? _compareFieldNames(key, first) < 0 : key < first) first = key;
  }
  return first;
};
export const _compareRecords: (a: object, b: object) => number = (x: any, y: any) => {
  const keysX = Object.keys(x),
    keysY = Object.keys(y);
  // Null-prototype objects are `Dict`s (ADR 0150): a `_tag` key is plain data.
  const tx = Object.getPrototypeOf(x) !== null && keysX.includes("_tag") ? x._tag : undefined,
    ty = Object.getPrototypeOf(y) !== null && keysY.includes("_tag") ? y._tag : undefined;
  const tagged = typeof tx === "string",
    otherTagged = typeof ty === "string";
  if (tagged !== otherTagged) return tagged ? -1 : 1;
  if (tagged) {
    const tag = _compare(tx, ty);
    if (tag !== 0) return tag;
  }
  const fieldsX = tagged ? keysX.filter((k) => k !== "_tag") : keysX,
    fieldsY = tagged ? keysY.filter((k) => k !== "_tag") : keysY;
  if (fieldsX.length === 0 || fieldsY.length === 0) return _compare(fieldsX.length, fieldsY.length);
  let sameKeys = fieldsX.length === fieldsY.length;
  for (let i = 0; sameKeys && i < fieldsX.length; i++) {
    if (fieldsX[i] !== fieldsY[i]) sameKeys = false;
  }
  const firstX = _compareFirstKey(fieldsX, tagged),
    firstY = sameKeys ? firstX : _compareFirstKey(fieldsY, tagged);
  if (firstX !== firstY)
    return tagged ? _compareFieldNames(firstX, firstY) : _compare(firstX, firstY);
  const firstLeft = x[firstX],
    firstRight = y[firstY];
  if (firstLeft !== firstRight) {
    const firstValue = _compare(firstLeft, firstRight);
    if (firstValue !== 0) return firstValue;
  }
  const kx = _compareSortedKeys(fieldsX, tagged),
    ky = sameKeys ? kx : _compareSortedKeys(fieldsY, tagged);
  const n = Math.min(kx.length, ky.length);
  for (let i = 1; i < n; i++) {
    if (kx[i] !== ky[i])
      return tagged ? _compareFieldNames(kx[i]!, ky[i]!) : _compare(kx[i], ky[i]);
    const left = x[kx[i]!],
      right = y[ky[i]!];
    if (left !== right) {
      const value = _compare(left, right);
      if (value !== 0) return value;
    }
  }
  return _compare(kx.length, ky.length);
};
export const _compare: (a: unknown, b: unknown) => number = (x: any, y: any) => {
  if (x === y) return 0;
  // Optional host fields can be explicitly undefined or null. Keep these
  // distinct from each other and from populated values (ADR 0145).
  if (x === undefined || y === undefined) return x === undefined ? -1 : 1;
  if (x === null || y === null) return x === null ? -1 : 1;
  const t = typeof x;
  if (t === "number" || t === "string" || t === "boolean") return x < y ? -1 : x > y ? 1 : 0;
  if (Array.isArray(x) && Array.isArray(y)) {
    const n = Math.min(x.length, y.length);
    for (let i = 0; i < n; i++) {
      const c = _compare(x[i], y[i]);
      if (c !== 0) return c;
    }
    return _compare(x.length, y.length);
  }
  if (x instanceof Map && y instanceof Map) {
    const kx = [...x.keys()].sort(_compare),
      ky = [...y.keys()].sort(_compare);
    const n = Math.min(kx.length, ky.length);
    for (let i = 0; i < n; i++) {
      const kc = _compare(kx[i], ky[i]);
      if (kc !== 0) return kc;
      const vc = _compare(x.get(kx[i]), y.get(ky[i]));
      if (vc !== 0) return vc;
    }
    return _compare(kx.length, ky.length);
  }
  if (x instanceof Set && y instanceof Set) {
    const ex = [...x].sort(_compare),
      ey = [...y].sort(_compare);
    const n = Math.min(ex.length, ey.length);
    for (let i = 0; i < n; i++) {
      const c = _compare(ex[i], ey[i]);
      if (c !== 0) return c;
    }
    return _compare(ex.length, ey.length);
  }
  if (
    typeof x === "object" &&
    x !== null &&
    ((!Array.isArray(x) && typeof x[Symbol.iterator] === "function") ||
      (typeof y === "object" && !Array.isArray(y) && typeof y[Symbol.iterator] === "function"))
  )
    throw new TypeError("compare on List: force it first with List.toArray");
  if (typeof x !== "object" || typeof y !== "object") return 0;
  return _compareRecords(x, y);
};
export const compare: { <A>(a: A): (b: A) => number; <A>(a: A, b: A): number } = _curry(
  2,
  _compare,
);
export const show: <A>(a: A) => string = (x: any) => {
  const t = typeof x;
  if (t === "string") return JSON.stringify(x);
  if (t !== "object" || x === null) return String(x);
  if (Array.isArray(x)) return `[${x.map(show).join(", ")}]`;
  if (x instanceof Map)
    return `#{${[...x.entries()].map((e: any) => `${show(e[0])}: ${show(e[1])}`).join(", ")}}`;
  if (x instanceof Set) return `#{${[...x].map(show).join(", ")}}`;
  if (typeof x[Symbol.iterator] === "function") return "<List>";
  // Null-prototype objects are `Dict`s (ADR 0150): a `_tag` key is plain data.
  const dict = Object.getPrototypeOf(x) === null;
  if (!dict && typeof x._tag === "string") {
    const ks = Object.keys(x).filter((k: any) => k !== "_tag");
    return ks.length === 0 ? x._tag : `${x._tag}(${ks.map((k: any) => show(x[k])).join(", ")})`;
  }
  const ks = Object.keys(x);
  return ks.length === 0
    ? dict
      ? "{}"
      : String(x)
    : `{ ${ks.map((k: any) => `${k}: ${show(x[k])}`).join(", ")} }`;
};
export const ignore: <A>(a: A) => undefined = (_x: any) => undefined;
export const lt: { (a: number): (b: number) => boolean; (a: number, b: number): boolean } = _curry(
  2,
  (a: any, b: any) => a < b,
);
export const gt: { (a: number): (b: number) => boolean; (a: number, b: number): boolean } = _curry(
  2,
  (a: any, b: any) => a > b,
);
export const gte: { (a: number): (b: number) => boolean; (a: number, b: number): boolean } = _curry(
  2,
  (a: any, b: any) => a >= b,
);
export const lte: { (a: number): (b: number) => boolean; (a: number, b: number): boolean } = _curry(
  2,
  (a: any, b: any) => a <= b,
);
export const not: (a: boolean) => boolean = (b: any) => !b;
export const and: { (a: boolean): (b: boolean) => boolean; (a: boolean, b: boolean): boolean } =
  _curry(2, (a: any, b: any) => a && b);
export const or: { (a: boolean): (b: boolean) => boolean; (a: boolean, b: boolean): boolean } =
  _curry(2, (a: any, b: any) => a || b);
export const min: { (a: number): (b: number) => number; (a: number, b: number): number } = _curry(
  2,
  (a: any, b: any) => Math.min(a, b),
);
export const max: { (a: number): (b: number) => number; (a: number, b: number): number } = _curry(
  2,
  (a: any, b: any) => Math.max(a, b),
);
export const pow: { (a: number): (b: number) => number; (a: number, b: number): number } = _curry(
  2,
  (a: any, b: any) => a ** b,
);
export const mod: { (a: number): (b: number) => number; (a: number, b: number): number } = _curry(
  2,
  (a: any, b: any) => ((a % b) + b) % b,
);
export const abs: (a: number) => number = (x: any) => Math.abs(x);
export const floor: (a: number) => number = (x: any) => Math.floor(x);
export const ceil: (a: number) => number = (x: any) => Math.ceil(x);
export const round: (a: number) => number = (x: any) => Math.round(x);
export const sign: (a: number) => number = (x: any) => Math.sign(x);
export const negate: (a: number) => number = (x: any) => -x;
export const length: <A>(a: A[]) => number = (xs: any) => xs.length;
export const map: { <A, B>(a: (a: A) => B): (b: A[]) => B[]; <A, B>(a: (a: A) => B, b: A[]): B[] } =
  _curry(2, (f: any, xs: any) => xs.map((x: any) => f(x)));
export const filter: {
  <A>(a: (a: A) => boolean): (b: A[]) => A[];
  <A>(a: (a: A) => boolean, b: A[]): A[];
} = _curry(2, (f: any, xs: any) => xs.filter((x: any) => f(x)));
export const reduce: {
  <A, B>(a: (a: A, b: B) => A): (b: A) => (c: B[]) => A;
  <A, B>(a: (a: A, b: B) => A): (b: A, c: B[]) => A;
  <A, B>(a: (a: A, b: B) => A, b: A): (c: B[]) => A;
  <A, B>(a: (a: A, b: B) => A, b: A, c: B[]): A;
} = _curry(3, (f: any, init: any, xs: any) => xs.reduce((acc: any, x: any) => f(acc)(x), init));
export const identity: <A>(a: A) => A = (x: any) => x;
export const always: { <A, B>(a: A): (b: B) => A; <A, B>(a: A, b: B): A } = _curry(
  2,
  (x: any, _y: any) => x,
);
export const compose: {
  <A, B, C>(a: (a: A) => B): (b: (a: C) => A) => (c: C) => B;
  <A, B, C>(a: (a: A) => B): (b: (a: C) => A, c: C) => B;
  <A, B, C>(a: (a: A) => B, b: (a: C) => A): (c: C) => B;
  <A, B, C>(a: (a: A) => B, b: (a: C) => A, c: C): B;
} = _curry(3, (f: any, g: any, x: any) => f(g(x)));
export const capitalize: (a: string) => string = (s: any) => s.charAt(0).toUpperCase() + s.slice(1);
export const range: {
  (a: number): (b: number) => Iterable<number>;
  (a: number, b: number): Iterable<number>;
} = _curry(2, (lo: any, hi: any) =>
  _list(function* () {
    for (let i = lo; i < hi; i++) yield i;
  }),
);
export const iterate: {
  <A>(a: (a: A) => A): (b: A) => Iterable<A>;
  <A>(a: (a: A) => A, b: A): Iterable<A>;
} = _curry(2, (f: any, x: any) =>
  _list(function* () {
    let v = x;
    for (;;) {
      yield v;
      v = f(v);
    }
  }),
);
export const repeat: <A>(a: A) => Iterable<A> = (x: any) =>
  _list(function* () {
    for (;;) yield x;
  });
export const take: {
  <A>(a: number): (b: Iterable<A>) => Iterable<A>;
  <A>(a: number, b: Iterable<A>): Iterable<A>;
} = _curry(2, (n: any, xs: any) =>
  _list(function* () {
    let i = 0;
    for (const x of xs) {
      if (i >= n) break;
      yield x;
      i++;
    }
  }),
);
export const takeWhile: {
  <A>(a: (a: A) => boolean): (b: Iterable<A>) => Iterable<A>;
  <A>(a: (a: A) => boolean, b: Iterable<A>): Iterable<A>;
} = _curry(2, (p: any, xs: any) =>
  _list(function* () {
    for (const x of xs) {
      if (!p(x)) break;
      yield x;
    }
  }),
);
export const drop: {
  <A>(a: number): (b: Iterable<A>) => Iterable<A>;
  <A>(a: number, b: Iterable<A>): Iterable<A>;
} = _curry(2, (n: any, xs: any) =>
  _list(function* () {
    let i = 0;
    for (const x of xs) {
      if (i < n) {
        i++;
        continue;
      }
      yield x;
    }
  }),
);
export const fromArray: <A>(a: A[]) => Iterable<A> = (xs: any) =>
  _list(function* () {
    yield* xs;
  });
export const toArray: <A>(a: Iterable<A>) => A[] = (xs: any) => [...xs];
export const _List_map: {
  <A, B>(a: (a: A) => B): (b: Iterable<A>) => Iterable<B>;
  <A, B>(a: (a: A) => B, b: Iterable<A>): Iterable<B>;
} = _curry(2, (f: any, xs: any) =>
  _list(function* () {
    for (const x of xs) yield f(x);
  }),
);
export const _List_filter: {
  <A>(a: (a: A) => boolean): (b: Iterable<A>) => Iterable<A>;
  <A>(a: (a: A) => boolean, b: Iterable<A>): Iterable<A>;
} = _curry(2, (p: any, xs: any) =>
  _list(function* () {
    for (const x of xs) if (p(x)) yield x;
  }),
);
export const _List_concat: {
  <A>(a: Iterable<A>): (b: Iterable<A>) => Iterable<A>;
  <A>(a: Iterable<A>, b: Iterable<A>): Iterable<A>;
} = _curry(2, (xs: any, ys: any) =>
  _list(function* () {
    yield* xs;
    yield* ys;
  }),
);
export const _List_flatMap: {
  <A, B>(a: (a: A) => Iterable<B>): (b: Iterable<A>) => Iterable<B>;
  <A, B>(a: (a: A) => Iterable<B>, b: Iterable<A>): Iterable<B>;
} = _curry(2, (f: any, xs: any) =>
  _list(function* () {
    for (const x of xs) yield* f(x);
  }),
);
// Structural keys (ADR 0152): primitives keep native SameValueZero lookup; an
// object key resolves to the stored key it `eq`s (linear scan), else itself.
export const _keyOf = (c: any, k: any): any => {
  if (k === null || typeof k !== "object" || c.has(k)) return k;
  for (const x of c.keys()) if (eq(k, x)) return x;
  return k;
};
export const _setAdd = (s: Set<any>, x: any): Set<any> => s.add(_keyOf(s, x));
export const _Set_has: { <A>(a: A): (b: Set<A>) => boolean; <A>(a: A, b: Set<A>): boolean } =
  _curry(2, (x: any, s: any) => s.has(_keyOf(s, x)));
export const _Set_add: { <A>(a: A): (b: Set<A>) => Set<A>; <A>(a: A, b: Set<A>): Set<A> } = _curry(
  2,
  // Sets are persistent values, so an add that changes nothing can hand back
  // the same set instead of copying it (accumulators mostly re-add members).
  (x: any, s: any) => {
    const k = _keyOf(s, x);
    return s.has(k) ? s : new Set(s).add(k);
  },
);
export const _Set_delete: { <A>(a: A): (b: Set<A>) => Set<A>; <A>(a: A, b: Set<A>): Set<A> } =
  _curry(2, (x: any, s: any) => {
    const n = new Set(s);
    n.delete(_keyOf(s, x));
    return n;
  });
export const _Set_size: <A>(a: Set<A>) => number = (s: any) => s.size;
export const _Set_toArray: <A>(a: Set<A>) => A[] = (s: any) => [...s];
export const _Set_fromArray: <A>(a: A[]) => Set<A> = (xs: any) => {
  const n = new Set<any>();
  for (const x of xs) _setAdd(n, x);
  return n;
};
export const _Set_union: {
  <A>(a: Set<A>): (b: Set<A>) => Set<A>;
  <A>(a: Set<A>, b: Set<A>): Set<A>;
} = _curry(2, (a: any, b: any) => {
  const n = new Set<any>(a);
  for (const x of b) _setAdd(n, x);
  return n;
});
export const _Set_intersect: {
  <A>(a: Set<A>): (b: Set<A>) => Set<A>;
  <A>(a: Set<A>, b: Set<A>): Set<A>;
} = _curry(2, (a: any, b: any) => new Set([...a].filter((x: any) => b.has(_keyOf(b, x)))));
export const _Set_diff: {
  <A>(a: Set<A>): (b: Set<A>) => Set<A>;
  <A>(a: Set<A>, b: Set<A>): Set<A>;
} = _curry(2, (a: any, b: any) => new Set([...a].filter((x: any) => !b.has(_keyOf(b, x)))));
export const _Map_has: {
  <A, B>(a: A): (b: Map<A, B>) => boolean;
  <A, B>(a: A, b: Map<A, B>): boolean;
} = _curry(2, (k: any, m: any) => m.has(_keyOf(m, k)));
export const _Map_getOr: {
  <A, B>(a: A): (b: B) => (c: Map<B, A>) => A;
  <A, B>(a: A): (b: B, c: Map<B, A>) => A;
  <A, B>(a: A, b: B): (c: Map<B, A>) => A;
  <A, B>(a: A, b: B, c: Map<B, A>): A;
} = _curry(3, (d: any, k: any, m: any) => {
  const key = _keyOf(m, k);
  return m.has(key) ? m.get(key) : d;
});
export const _Map_set: {
  <A, B>(a: A): (b: B) => (c: Map<A, B>) => Map<A, B>;
  <A, B>(a: A): (b: B, c: Map<A, B>) => Map<A, B>;
  <A, B>(a: A, b: B): (c: Map<A, B>) => Map<A, B>;
  <A, B>(a: A, b: B, c: Map<A, B>): Map<A, B>;
} = _curry(3, (k: any, v: any, m: any) => {
  const key = _keyOf(m, k);
  if (m.has(key) && Object.is(m.get(key), v)) return m;
  return new Map(m).set(key, v);
});
export const _Map_delete: {
  <A, B>(a: A): (b: Map<A, B>) => Map<A, B>;
  <A, B>(a: A, b: Map<A, B>): Map<A, B>;
} = _curry(2, (k: any, m: any) => {
  const n = new Map(m);
  n.delete(_keyOf(m, k));
  return n;
});
export const _Map_size: <A, B>(a: Map<A, B>) => number = (m: any) => m.size;
export const _Map_keys: <A, B>(a: Map<A, B>) => A[] = (m: any) => [...m.keys()];
export const _Map_values: <A, B>(a: Map<A, B>) => B[] = (m: any) => [...m.values()];
export const _Map_get: {
  <A, B>(a: A): (b: Map<A, B>) => Option<B>;
  <A, B>(a: A, b: Map<A, B>): Option<B>;
} = _curry(2, (k: any, m: any) => {
  const key = _keyOf(m, k);
  return m.has(key) ? Some(m.get(key)) : None;
});
export const _dictFrom = <A>(entries: Iterable<readonly [string, A]>): Record<string, A> => {
  const d: Record<string, A> = Object.create(null);
  for (const [k, v] of entries) d[k] = v;
  return d;
};
export const _dictHas = (k: string, d: object): boolean =>
  Object.getOwnPropertyDescriptor(d, k) !== undefined;
export const _Dict_empty: Record<string, never> = Object.freeze(Object.create(null));
export const _Dict_has: {
  <A>(a: string): (b: Record<string, A>) => boolean;
  <A>(a: string, b: Record<string, A>): boolean;
} = _curry(2, (k: any, d: any) => _dictHas(k, d));
export const _Dict_get: {
  <A>(a: string): (b: Record<string, A>) => Option<A>;
  <A>(a: string, b: Record<string, A>): Option<A>;
} = _curry(2, (k: any, d: any) => (_dictHas(k, d) ? Some(d[k]) : None));
export const _Dict_getOr: {
  <A>(a: A): (b: string) => (c: Record<string, A>) => A;
  <A>(a: A): (b: string, c: Record<string, A>) => A;
  <A>(a: A, b: string): (c: Record<string, A>) => A;
  <A>(a: A, b: string, c: Record<string, A>): A;
} = _curry(3, (def: any, k: any, d: any) => (_dictHas(k, d) ? d[k] : def));
export const _Dict_set: {
  <A>(a: string): (b: A) => (c: Record<string, A>) => Record<string, A>;
  <A>(a: string): (b: A, c: Record<string, A>) => Record<string, A>;
  <A>(a: string, b: A): (c: Record<string, A>) => Record<string, A>;
  <A>(a: string, b: A, c: Record<string, A>): Record<string, A>;
} = _curry(3, (k: any, v: any, d: any) => {
  const n = _dictFrom(Object.entries(d));
  n[k] = v;
  return n;
});
export const _Dict_remove: {
  <A>(a: string): (b: Record<string, A>) => Record<string, A>;
  <A>(a: string, b: Record<string, A>): Record<string, A>;
} = _curry(2, (k: any, d: any) => {
  const n = _dictFrom(Object.entries(d));
  delete n[k];
  return n;
});
export const _Dict_size: <A>(a: Record<string, A>) => number = (d: any) => Object.keys(d).length;
export const _Dict_keys: <A>(a: Record<string, A>) => string[] = (d: any) => Object.keys(d);
export const _Dict_values: <A>(a: Record<string, A>) => A[] = (d: any) => Object.values(d);
export const _Dict_entries: <A>(a: Record<string, A>) => [string, A][] = (d: any) =>
  Object.entries(d);
export const _Dict_fromEntries: <A>(a: [string, A][]) => Record<string, A> = (es: any) =>
  _dictFrom(es);
export const _Dict_map: {
  <A, B>(a: (a: A) => B): (b: Record<string, A>) => Record<string, B>;
  <A, B>(a: (a: A) => B, b: Record<string, A>): Record<string, B>;
} = _curry(2, (f: any, d: any) => _dictFrom(Object.entries(d).map(([k, v]) => [k, f(v)] as const)));
export const _Option_map: {
  <A, B>(a: (a: A) => B): (b: Option<A>) => Option<B>;
  <A, B>(a: (a: A) => B, b: Option<A>): Option<B>;
} = _curry(2, (f: any, o: any) => (o._tag === "Some" ? Some(f(o.value)) : None));
export const _Option_flatMap: {
  <A, B>(a: (a: A) => Option<B>): (b: Option<A>) => Option<B>;
  <A, B>(a: (a: A) => Option<B>, b: Option<A>): Option<B>;
} = _curry(2, (f: any, o: any) => (o._tag === "Some" ? f(o.value) : None));
export const _Option_mapOr: {
  <A, B>(a: A): (b: (a: B) => A) => (c: Option<B>) => A;
  <A, B>(a: A): (b: (a: B) => A, c: Option<B>) => A;
  <A, B>(a: A, b: (a: B) => A): (c: Option<B>) => A;
  <A, B>(a: A, b: (a: B) => A, c: Option<B>): A;
} = _curry(3, (d: any, f: any, o: any) => (o._tag === "Some" ? f(o.value) : d));
export const _Option_exists: {
  <A>(a: (a: A) => boolean): (b: Option<A>) => boolean;
  <A>(a: (a: A) => boolean, b: Option<A>): boolean;
} = _curry(2, (p: any, o: any) => o._tag === "Some" && p(o.value));
export const _Option_contains: {
  <A>(a: A): (b: Option<A>) => boolean;
  <A>(a: A, b: Option<A>): boolean;
} = _curry(2, (x: any, o: any) => o._tag === "Some" && eq(x, o.value));
export const _Option_unwrapOr: { <A>(a: A): (b: Option<A>) => A; <A>(a: A, b: Option<A>): A } =
  _curry(2, (d: any, o: any) => (o._tag === "Some" ? o.value : d));
export const _Option_orElse: {
  <A>(a: Option<A>): (b: Option<A>) => Option<A>;
  <A>(a: Option<A>, b: Option<A>): Option<A>;
} = _curry(2, (fb: any, o: any) => (o._tag === "Some" ? o : fb));
export const _Option_isSome: <A>(a: Option<A>) => boolean = (o: any) => o._tag === "Some";
export const _Option_isNone: <A>(a: Option<A>) => boolean = (o: any) => o._tag === "None";
export const _Result_map: {
  <A, B, C>(a: (a: A) => B): (b: Result<A, C>) => Result<B, C>;
  <A, B, C>(a: (a: A) => B, b: Result<A, C>): Result<B, C>;
} = _curry(2, (f: any, r: any) => (r._tag === "Ok" ? Ok(f(r.value)) : r));
export const _Result_mapErr: {
  <A, B, C>(a: (a: A) => B): (b: Result<C, A>) => Result<C, B>;
  <A, B, C>(a: (a: A) => B, b: Result<C, A>): Result<C, B>;
} = _curry(2, (f: any, r: any) => (r._tag === "Err" ? Err(f(r.error)) : r));
export const _Result_flatMap: {
  <A, B, C>(a: (a: A) => Result<B, C>): (b: Result<A, C>) => Result<B, C>;
  <A, B, C>(a: (a: A) => Result<B, C>, b: Result<A, C>): Result<B, C>;
} = _curry(2, (f: any, r: any) => (r._tag === "Ok" ? f(r.value) : r));
export const _Result_unwrapOr: {
  <A, B>(a: A): (b: Result<A, B>) => A;
  <A, B>(a: A, b: Result<A, B>): A;
} = _curry(2, (d: any, r: any) => (r._tag === "Ok" ? r.value : d));
export const _Result_isOk: <A, B>(a: Result<A, B>) => boolean = (r: any) => r._tag === "Ok";
export const _Result_isErr: <A, B>(a: Result<A, B>) => boolean = (r: any) => r._tag === "Err";
export const _List_head: <A>(a: Iterable<A>) => Option<A> = (xs: any) => {
  for (const x of xs) return Some(x);
  return None;
};
export const _Array_head: <A>(a: A[]) => Option<A> = (xs: any) =>
  xs.length > 0 ? Some(xs[0]) : None;
export const _Array_forEach: {
  <A>(a: (a: A) => void): (b: A[]) => undefined;
  <A>(a: (a: A) => void, b: A[]): undefined;
} = _curry(2, (f: any, xs: any) => {
  for (const x of xs) f(x);
});
export const _Array_get: {
  <A>(a: number): (b: A[]) => Option<A>;
  <A>(a: number, b: A[]): Option<A>;
} = _curry(2, (i: any, xs: any) => (i >= 0 && i < xs.length ? Some(xs[i]) : None));
export const _Array_find: {
  <A>(a: (a: A) => boolean): (b: A[]) => Option<A>;
  <A>(a: (a: A) => boolean, b: A[]): Option<A>;
} = _curry(2, (p: any, xs: any) => {
  for (const x of xs) if (p(x)) return Some(x);
  return None;
});
export const _Array_reverse: <A>(a: A[]) => A[] = (xs: any) => [...xs].reverse();
export const _Array_concat: { <A>(a: A[]): (b: A[]) => A[]; <A>(a: A[], b: A[]): A[] } = _curry(
  2,
  (xs: any, ys: any) => xs.concat(ys),
);
export const _Array_append: { <A>(a: A): (b: A[]) => A[]; <A>(a: A, b: A[]): A[] } = _curry(
  2,
  (x: any, xs: any) => [...xs, x],
);
export const _Array_prepend: { <A>(a: A): (b: A[]) => A[]; <A>(a: A, b: A[]): A[] } = _curry(
  2,
  (x: any, xs: any) => [x, ...xs],
);
export const _Array_flatMap: {
  <A, B>(a: (a: A) => B[]): (b: A[]) => B[];
  <A, B>(a: (a: A) => B[], b: A[]): B[];
} = _curry(2, (f: any, xs: any) => xs.flatMap((x: any) => f(x)));
export const _Array_take: { <A>(a: number): (b: A[]) => A[]; <A>(a: number, b: A[]): A[] } = _curry(
  2,
  (n: any, xs: any) => xs.slice(0, n),
);
export const _Array_drop: { <A>(a: number): (b: A[]) => A[]; <A>(a: number, b: A[]): A[] } = _curry(
  2,
  (n: any, xs: any) => xs.slice(n),
);
export const _Array_tail: <A>(a: A[]) => A[] = (xs: any) => xs.slice(1);
export const _Array_contains: { <A>(a: A): (b: A[]) => boolean; <A>(a: A, b: A[]): boolean } =
  _curry(2, (x: any, xs: any) => xs.some((y: any) => eq(x, y)));
export const _Array_sort: <A>(a: A[]) => A[] = (xs: any) => [...xs].sort(compare);
export const _Array_sortBy: {
  <A, B>(a: (a: A) => B): (b: A[]) => A[];
  <A, B>(a: (a: A) => B, b: A[]): A[];
} = _curry(2, (f: any, xs: any) => [...xs].sort((a: any, b: any) => compare(f(a), f(b))));
export const _Array_dedupe: <A>(a: A[]) => A[] = (xs: any) =>
  xs.filter((x: any, i: any) => xs.findIndex((y: any) => eq(x, y)) === i);
export const _hashStr = (s: string): number => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = Math.imul(h, 33) ^ s.charCodeAt(i);
  return h | 0;
};
// A hash consistent with `eq`: eq-equal values hash alike (collisions only cost
// time). `undefined` marks a value whose inspection could be observable or whose
// `eq` throws (accessors, holes, iterables): dedupeBy compares those linearly.
export const _eqHash = (x: any, depth: number): number | undefined => {
  switch (typeof x) {
    case "number":
      return Number.isInteger(x) && x > -2147483648 && x < 2147483647 ? x | 0 : _hashStr(String(x));
    case "string":
      return _hashStr(x) ^ 0x5bd1;
    case "boolean":
      return x ? 10 : 11;
    case "undefined":
      return 12;
    case "bigint":
      return _hashStr(String(x)) + 13;
    case "symbol":
      return 14;
    case "function":
      return 15;
  }
  if (x === null) return 1;
  if (depth <= 0) return 2;
  if (Array.isArray(x)) {
    let h = 3 + x.length * 7;
    for (let i = 0; i < x.length; i++) {
      if (!(i in x)) return undefined;
      const d = Object.getOwnPropertyDescriptor(x, i)!;
      if (d.get || d.set) return undefined;
      const v = _eqHash(d.value, depth - 1);
      if (v === undefined) return undefined;
      h = (Math.imul(h, 31) + v) | 0;
    }
    return h;
  }
  if (x instanceof Map || x instanceof Set || typeof x[Symbol.iterator] === "function")
    return undefined;
  const keys = Object.keys(x);
  let sum = 0;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]!;
    const d = Object.getOwnPropertyDescriptor(x, k)!;
    if (d.get || d.set) return undefined;
    const v = _eqHash(d.value, depth - 1);
    if (v === undefined) return undefined;
    sum = (sum + (_hashStr(k) ^ Math.imul(v, 16777619))) | 0;
  }
  return (4 + keys.length + sum) | 0;
};
export const _Array_dedupeBy: {
  <A, B>(a: (a: A) => B): (b: A[]) => A[];
  <A, B>(a: (a: A) => B, b: A[]): A[];
} = _curry(2, (f: any, xs: any) => {
  const primitive = new Set();
  // Retained object keys in order, plus hash buckets over the inspectable ones.
  // Unhashable keys keep the ordered eq scan so getter reads happen as before.
  const structural: any[] = [];
  const buckets = new Map<number, { k: any; idx: number }[]>();
  const unhashable: { k: any; idx: number }[] = [];
  return xs.filter((x: any) => {
    const k = f(x);
    if (k !== null && typeof k === "object") {
      const h = _eqHash(k, 3);
      if (h === undefined) {
        if (structural.some((s: any) => eq(s, k))) return false;
        unhashable.push({ k, idx: structural.length });
        structural.push(k);
        return true;
      }
      const bucket = buckets.get(h);
      let first = Infinity;
      if (bucket)
        for (const e of bucket)
          if (eq(e.k, k)) {
            first = e.idx;
            break;
          }
      // Only unhashable keys retained before the first match can have been read.
      for (const u of unhashable) {
        if (u.idx >= first) break;
        if (eq(u.k, k)) return false;
      }
      if (first !== Infinity) return false;
      const entry = { k, idx: structural.length };
      structural.push(k);
      if (bucket) bucket.push(entry);
      else buckets.set(h, [entry]);
      return true;
    }
    // eq(NaN, NaN) is false; keep every projected NaN as before.
    if (Number.isNaN(k)) return true;
    if (primitive.has(k)) return false;
    primitive.add(k);
    return true;
  });
});
export const _Array_max: <A>(a: A[]) => Option<A> = (xs: any) =>
  xs.length ? Some(xs.reduce((a: any, b: any) => (compare(a, b) >= 0 ? a : b))) : None;
export const _Array_min: <A>(a: A[]) => Option<A> = (xs: any) =>
  xs.length ? Some(xs.reduce((a: any, b: any) => (compare(a, b) <= 0 ? a : b))) : None;
export const _Array_maxBy: {
  <A, B>(a: (a: A) => B): (b: A[]) => Option<A>;
  <A, B>(a: (a: A) => B, b: A[]): Option<A>;
} = _curry(2, (f: any, xs: any) =>
  xs.length ? Some(xs.reduce((a: any, b: any) => (compare(f(a), f(b)) >= 0 ? a : b))) : None,
);
export const _Array_minBy: {
  <A, B>(a: (a: A) => B): (b: A[]) => Option<A>;
  <A, B>(a: (a: A) => B, b: A[]): Option<A>;
} = _curry(2, (f: any, xs: any) =>
  xs.length ? Some(xs.reduce((a: any, b: any) => (compare(f(a), f(b)) <= 0 ? a : b))) : None,
);
export const _Str_length: (a: string) => number = (s: any) => s.length;
export const _Str_concat: { (a: string): (b: string) => string; (a: string, b: string): string } =
  _curry(2, (a: any, b: any) => a + b);
export const _Str_toUpper: (a: string) => string = (s: any) => s.toUpperCase();
export const _Str_toLower: (a: string) => string = (s: any) => s.toLowerCase();
export const _Str_trim: (a: string) => string = (s: any) => s.trim();
export const _Str_split: {
  (a: string): (b: string) => string[];
  (a: string, b: string): string[];
} = _curry(2, (sep: any, s: any) => s.split(sep));
export const _Str_join: { (a: string): (b: string[]) => string; (a: string, b: string[]): string } =
  _curry(2, (sep: any, xs: any) => xs.join(sep));
export const _Str_contains: {
  (a: string): (b: string) => boolean;
  (a: string, b: string): boolean;
} = _curry(2, (needle: any, s: any) => s.includes(needle));
export const _Str_startsWith: {
  (a: string): (b: string) => boolean;
  (a: string, b: string): boolean;
} = _curry(2, (p: any, s: any) => s.startsWith(p));
export const _Str_endsWith: {
  (a: string): (b: string) => boolean;
  (a: string, b: string): boolean;
} = _curry(2, (p: any, s: any) => s.endsWith(p));
export const _Str_slice: {
  (a: number): (b: number) => (c: string) => string;
  (a: number): (b: number, c: string) => string;
  (a: number, b: number): (c: string) => string;
  (a: number, b: number, c: string): string;
} = _curry(3, (start: any, end: any, s: any) => s.slice(start, end));
export const _Str_replace: {
  (a: string): (b: string) => (c: string) => string;
  (a: string): (b: string, c: string) => string;
  (a: string, b: string): (c: string) => string;
  (a: string, b: string, c: string): string;
} = _curry(3, (find: any, repl: any, s: any) => s.replaceAll(find, repl));
export const _Str_get: {
  (a: number): (b: string) => Option<string>;
  (a: number, b: string): Option<string>;
} = _curry(2, (i: any, s: any) => (i >= 0 && i < s.length ? Some(s[i]) : None));
export const _Str_codeAt: {
  (a: number): (b: string) => Option<number>;
  (a: number, b: string): Option<number>;
} = _curry(2, (i: any, s: any) => (i >= 0 && i < s.length ? Some(s.charCodeAt(i)) : None));
export const _Str_fromCode: (a: number) => string = (n: any) => String.fromCharCode(n);
export const _Str_chars: (a: string) => string[] = (s: any) => [...s];
export const _Str_toNumber: (a: string) => Option<number> = (s: any) => {
  const n = Number(s);
  return Number.isNaN(n) ? None : Some(n);
};
export const _Task_of: <A, B>(a: A) => () => Promise<Result<A, B>> = (x: any) => () =>
  Promise.resolve(Ok(x));
export const _Task_fail: <A, B>(a: A) => () => Promise<Result<B, A>> = (e: any) => () =>
  Promise.resolve(Err(e));
export const _Task_map: {
  <A, B, C>(a: (a: A) => B): (b: () => Promise<Result<A, C>>) => () => Promise<Result<B, C>>;
  <A, B, C>(a: (a: A) => B, b: () => Promise<Result<A, C>>): () => Promise<Result<B, C>>;
} = _curry(
  2,
  (f: any, t: any) => (signal?: any) =>
    t(signal).then((r: any) => (r._tag === "Ok" ? Ok(f(r.value)) : r)),
);
export const _Task_mapErr: {
  <A, B, C>(a: (a: A) => B): (b: () => Promise<Result<C, A>>) => () => Promise<Result<C, B>>;
  <A, B, C>(a: (a: A) => B, b: () => Promise<Result<C, A>>): () => Promise<Result<C, B>>;
} = _curry(
  2,
  (f: any, t: any) => (signal?: any) =>
    t(signal).then((r: any) => (r._tag === "Err" ? Err(f(r.error)) : r)),
);
export const _Task_andThen: {
  <A, B, C>(
    a: (a: A) => () => Promise<Result<B, C>>,
  ): (b: () => Promise<Result<A, C>>) => () => Promise<Result<B, C>>;
  <A, B, C>(
    a: (a: A) => () => Promise<Result<B, C>>,
    b: () => Promise<Result<A, C>>,
  ): () => Promise<Result<B, C>>;
} = _curry(
  2,
  (f: any, t: any) => (signal?: any) =>
    t(signal).then((r: any) => (r._tag === "Ok" ? f(r.value)(signal) : r)),
);
export const _Task_recover: {
  <A, B, C>(
    a: (a: A) => () => Promise<Result<B, C>>,
  ): (b: () => Promise<Result<B, A>>) => () => Promise<Result<B, C>>;
  <A, B, C>(
    a: (a: A) => () => Promise<Result<B, C>>,
    b: () => Promise<Result<B, A>>,
  ): () => Promise<Result<B, C>>;
} = _curry(
  2,
  (f: any, t: any) => (signal?: any) =>
    t(signal).then((r: any) => (r._tag === "Err" ? f(r.error)(signal) : r)),
);
export const _Task_fromResult: <A, B>(a: Result<A, B>) => () => Promise<Result<A, B>> =
  (r: any) => () =>
    Promise.resolve(r);
export const _Task_match: {
  <A, B, C, D>(
    a: (a: A) => B,
  ): (b: (a: C) => B) => (c: () => Promise<Result<A, C>>) => () => Promise<Result<B, D>>;
  <A, B, C, D>(
    a: (a: A) => B,
  ): (b: (a: C) => B, c: () => Promise<Result<A, C>>) => () => Promise<Result<B, D>>;
  <A, B, C, D>(
    a: (a: A) => B,
    b: (a: C) => B,
  ): (c: () => Promise<Result<A, C>>) => () => Promise<Result<B, D>>;
  <A, B, C, D>(
    a: (a: A) => B,
    b: (a: C) => B,
    c: () => Promise<Result<A, C>>,
  ): () => Promise<Result<B, D>>;
} = _curry(
  3,
  (onOk: any, onErr: any, t: any) => (signal?: any) =>
    t(signal).then((r: any) => Ok(r._tag === "Ok" ? onOk(r.value) : onErr(r.error))),
);
export const _Task_delay: {
  <A, B>(a: number): (b: A) => () => Promise<Result<A, B>>;
  <A, B>(a: number, b: A): () => Promise<Result<A, B>>;
} = _curry(
  2,
  (ms: any, x: any) => (signal?: any) =>
    // An aborted delay never settles, like the abandoned arms it serves.
    new Promise((res: any) => {
      if (signal?.aborted) return;
      const id = setTimeout(() => res(Ok(x)), ms);
      signal?.addEventListener("abort", () => clearTimeout(id), { once: true });
    }),
);
export const _Task_run: <A, B>(a: () => Promise<Result<A, B>>) => Promise<Result<A, B>> = (
  t: any,
) => t();
export const _Task_all: <A, B>(
  a: (() => Promise<Result<A, B>>)[],
) => () => Promise<Result<A[], B>> = (ts: any) => (signal?: any) =>
  new Promise((res: any) => {
    // Children run under a linked signal, aborted once the fan-out settles.
    const ctl = new AbortController();
    if (signal?.aborted) ctl.abort();
    signal?.addEventListener("abort", () => ctl.abort(), { once: true });
    const out = new Array(ts.length);
    let left = ts.length;
    let settled = false;
    if (left === 0) {
      res(Ok(out));
      return;
    }
    ts.forEach((t: any, i: any) => {
      void t(ctl.signal).then((r: any) => {
        if (settled) return;
        if (r._tag === "Err") {
          settled = true;
          ctl.abort();
          res(r);
          return;
        }
        out[i] = r.value;
        left -= 1;
        if (left === 0) {
          settled = true;
          res(Ok(out));
        }
      });
    });
  });
export const _Task_race: <A, B>(a: (() => Promise<Result<A, B>>)[]) => () => Promise<Result<A, B>> =
  (ts: any) => (signal?: any) =>
    new Promise((res: any) => {
      const ctl = new AbortController();
      if (signal?.aborted) ctl.abort();
      signal?.addEventListener("abort", () => ctl.abort(), { once: true });
      let settled = false;
      ts.forEach((t: any) => {
        void t(ctl.signal).then((r: any) => {
          if (settled) return;
          settled = true;
          ctl.abort();
          res(r);
        });
      });
    });
export const _Task_runWith: {
  <A, B>(a: AbortSignal): (b: () => Promise<Result<A, B>>) => Promise<Result<A, B>>;
  <A, B>(a: AbortSignal, b: () => Promise<Result<A, B>>): Promise<Result<A, B>>;
} = _curry(2, (signal: any, t: any) => t(signal));
export const _Task_traverse: {
  <A, B, C>(a: (a: A) => () => Promise<Result<B, C>>): (b: A[]) => () => Promise<Result<B[], C>>;
  <A, B, C>(a: (a: A) => () => Promise<Result<B, C>>, b: A[]): () => Promise<Result<B[], C>>;
} = _curry(2, (f: any, xs: any) => _Task_all(xs.map(f)));
