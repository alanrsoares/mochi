/** Runtime adapter: JSON text <-> the `Json` variant of `@mochi/json` (ADR 0151). */

import type { Result } from "@mochi/compiler/runtime";

/** Mirrors `json.mochi`'s `Json`; objects are null-prototype `Dict`s (ADR 0150). */
export type Json =
  | { readonly _tag: "JNull" }
  | { readonly _tag: "JBool"; readonly value: boolean }
  | { readonly _tag: "JNum"; readonly value: number }
  | { readonly _tag: "JStr"; readonly value: string }
  | { readonly _tag: "JArr"; readonly items: readonly Json[] }
  | { readonly _tag: "JObj"; readonly fields: Readonly<Record<string, Json>> };

const JNull: Json = { _tag: "JNull" };

const finite = (n: number): number => {
  if (!Number.isFinite(n)) throw new RangeError(`non-finite number: ${n}`);
  return n;
};

const fromHost = (v: unknown): Json => {
  if (v === null) return JNull;
  if (typeof v === "boolean") return { _tag: "JBool", value: v };
  if (typeof v === "number") return { _tag: "JNum", value: finite(v) };
  if (typeof v === "string") return { _tag: "JStr", value: v };
  if (Array.isArray(v)) return { _tag: "JArr", items: v.map(fromHost) };
  const fields: Record<string, Json> = Object.create(null);
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) fields[k] = fromHost(x);
  return { _tag: "JObj", fields };
};

const toHost = (j: Json): unknown => {
  switch (j._tag) {
    case "JNull":
      return null;
    case "JNum":
      return finite(j.value);
    case "JBool":
    case "JStr":
      return j.value;
    case "JArr":
      return j.items.map(toHost);
    case "JObj": {
      const o: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(j.fields))
        Object.defineProperty(o, k, {
          value: toHost(x),
          enumerable: true,
          writable: true,
          configurable: true,
        });
      return o;
    }
  }
};

export const parse = (text: string): Result<Json, string> => {
  try {
    return { _tag: "Ok", value: fromHost(JSON.parse(text)) };
  } catch (e) {
    return { _tag: "Err", error: e instanceof Error ? e.message : String(e) };
  }
};

export const stringify = (j: Json): Result<string, string> => {
  try {
    return { _tag: "Ok", value: JSON.stringify(toHost(j)) };
  } catch (e) {
    return { _tag: "Err", error: e instanceof Error ? e.message : String(e) };
  }
};
