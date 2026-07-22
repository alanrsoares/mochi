// Generate src/runtime.ts — the typed runtime module the TypeScript backend
// (ADR 0026) imports instead of inlining an untyped preamble. Single source of
// truth stays src/prelude.ts: bodies come verbatim from `preludeJsDefs`, public
// types are rendered from the HM signatures (`preludeEnv` + `preludeNamespaces`)
// via `dts.ts`'s `flatFnType`. Regenerate with `bun run gen:runtime`.
//
// Recipe per builtin: `export const NAME: <flat HM type> = <body>`. The public
// annotation gives importers real types; the body's own params/locals are made
// explicitly `any` (see `tsBody`) so the trusted body just runs and nothing trips
// `--strict`. The body's internal types are irrelevant — the annotation is the
// contract, the JS-backend differential tests are what prove the body correct.
import { flatFnType } from "../src/dts";
import {
  builtinTypeDecls,
  namespaceRuntime,
  preludeEnv,
  preludeJsDefs,
  preludeNamespaces,
} from "../src/prelude";
import type { Type } from "../src/types";
import { typeDecl } from "../src/dts";

// jsId → HM type: top-level builtins by name, plus every namespace member keyed
// by its runtime identifier (`Map.get` → `_Map_get`).
const jsIdType = new Map<string, Type>(Object.entries(preludeEnv));
for (const [ns, members] of Object.entries(namespaceRuntime))
  for (const [member, jsId] of Object.entries(members)) {
    const sig = (preludeNamespaces[ns] as Record<string, Type> | undefined)?.[member];
    if (sig && !jsIdType.has(jsId)) jsIdType.set(jsId, sig);
  }

// Runtime arity: `_curry(N, …)` states it; a bare `(a, b) => …` counts its outer
// params; anything else (a value like `pi`, a nullary ctor) is arity 0.
const arityOf = (def: string): number => {
  const curried = def.match(/=\s*_curry\((\d+),/);
  if (curried) return Number(curried[1]);
  const arrow = def.match(/^const \w+ = \(([^)]*)\) =>/);
  if (!arrow) return 0;
  const ps = arrow[1]!.trim();
  return ps === "" ? 0 : ps.split(",").length;
};

// Body with the const head stripped: `const add = <rhs>` → `<rhs>` (keeps `;`).
const rhsOf = (def: string): string => def.replace(/^const \w+ = /, "");

// Force explicit `any` onto EVERY arrow parameter in a body. The body is trusted
// (byte-identical logic to preludeJsDefs, proven by the JS-backend differential
// tests); its only job here is to run, not to re-typecheck. The public const
// annotation is what gives importers real types. Doing this uniformly avoids two
// traps: a generic annotation over-constraining an introspecting body (`show`
// pokes `x._tag`), and `_curry`'s `any` params leaving inner callbacks
// (`xs.map((x) => …)`) implicitly typed. Params never carry types in the raw JS,
// so injecting `: any` is unambiguous.
const anyParams = (body: string): string =>
  body.replace(/\(([^()]*)\)\s*=>/g, (_m, ps: string) => {
    const typed = ps
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p !== "")
      .map((p) => (p.startsWith("...") ? `${p}: any[]` : `${p}: any`))
      .join(", ");
    return `(${typed}) =>`;
  });

// A bare empty-array local (`const seen = []`) infers an evolving `any[]` that
// trips `--strict`. Pin it to `any[]` — same trusted-body rationale as anyParams.
const typeBareArrays = (body: string): string =>
  body.replace(/\b(const|let)\s+(\w+)\s*=\s*\[\]/g, "$1 $2: any[] = []");

// Body ready for the typed module: params and bare-array locals made explicit.
const tsBody = (def: string): string => typeBareArrays(anyParams(rhsOf(def)));

// Builtin ctor factory types — stable (4 entries), hardcoded like infer.al's
// `builtinTypeDecls` precedent rather than derived.
const CTOR_TYPES: Record<string, string> = {
  Some: "<A>(value: A) => Option<A>",
  None: "Option<never>",
  Ok: "<A, B>(value: A) => Result<A, B>",
  Err: "<A, B>(error: B) => Result<A, B>",
};

// Structural helpers with no HM signature — hand-typed.
const OVERRIDES: Record<string, string> = {
  _list: "export const _list = <T>(g: () => Iterator<T>): Iterable<T> => ({ [Symbol.iterator]: g });",
  _curry:
    "export const _curry = (n: number, f: (...args: any[]) => any): ((...args: any[]) => any) =>\n" +
    "  function c(...a: any[]): any {\n" +
    "    if (a.length < n) return (...b: any[]) => c(...a, ...b);\n" +
    "    if (a.length === n) return f(...a);\n" +
    "    return a.slice(n).reduce((g: any, x: any) => g(x), f(...a.slice(0, n)));\n" +
    "  };",
};

const lines: string[] = [];
const missing: string[] = [];

for (const [name, def] of Object.entries(preludeJsDefs)) {
  if (OVERRIDES[name]) {
    lines.push(OVERRIDES[name]!);
    continue;
  }
  if (CTOR_TYPES[name]) {
    lines.push(`export const ${name}: ${CTOR_TYPES[name]} = ${tsBody(def)}`);
    continue;
  }
  const sig = jsIdType.get(name);
  if (!sig) {
    missing.push(name);
    lines.push(`export ${def}`); // untyped fallback (inferred any) — flagged below
    continue;
  }
  const type = flatFnType(sig, arityOf(def));
  lines.push(`export const ${name}: ${type} = ${tsBody(def)}`);
}

// Builtin variant types the ctor annotations reference (Option, Result).
const typeDecls = builtinTypeDecls.map((b) => typeDecl(b.name, b.params, b.ctors));

const header = [
  "// GENERATED by scripts/gen-runtime.ts — do not edit. Run `bun run gen:runtime`.",
  "// Typed runtime for the TypeScript backend (ADR 0026). Bodies mirror",
  "// src/prelude.ts's preludeJsDefs; public types come from the HM signatures.",
  "",
];

const out = `${header.join("\n")}${typeDecls.join("\n")}\n\n${lines.join("\n")}\n`;
await Bun.write(`${import.meta.dir}/../src/runtime.ts`, out);
console.error(`wrote src/runtime.ts (${Object.keys(preludeJsDefs).length} defs)`);
if (missing.length) console.error(`  no HM sig (untyped fallback): ${missing.join(", ")}`);
