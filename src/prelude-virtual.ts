/**
 * Virtual prelude buffer — readable go-to-definition targets for builtins.
 * Not a real module; Location.path is PRELUDE_PATH. URI ends with `.mochi`
 * so editors pick up the language / syntax grammar.
 */
import { builtinTypeDecls, preludeEnv, preludeNamespaces } from "./prelude";
import type { Location, Span } from "./span";
import { emptyOrigins, type Origins } from "./symbols";
import { showType, type Type } from "./types";

/** Virtual document URI / Location.path for every builtin def. */
export const PRELUDE_PATH = "mochi:/prelude.mochi";

export const isPreludePath = (path: string): boolean =>
  path === PRELUDE_PATH || path === "mochi:prelude" || path.startsWith("mochi:/prelude");

const VAR_NAMES = ["a", "b", "c", "d", "e", "f"];

/** One-line `///` docs shown in the virtual prelude (and useful for reading F12 targets). */
const TYPE_DOCS: Record<string, string> = {
  Option: "Optional value — `Some(a)` or `None`. Runtime `{ _tag, value }` (@onrails/maybe).",
  Result:
    "Success or failure — `Ok(a)` or `Err(e)`. Runtime `{ _tag, value/error }` (@onrails/result).",
};

const CTOR_DOCS: Record<string, string> = {
  Some: "Present `Option` value.",
  None: "Absent `Option`.",
  Ok: "Successful `Result` value.",
  Err: "Failed `Result` error.",
};

const NS_DOCS: Record<string, string> = {
  Array:
    "Eager array combinators (`Array.map`, …). Unqualified `map`/`filter`/`reduce` alias these.",
  List: "Lazy `List` combinators (`@{…}` sequences).",
  Set: "Immutable Set ops (return a fresh Set).",
  Map: "Immutable Map ops (return a fresh Map).",
  Option: "Option combinators — data-last for `|>` chains. Ctors stay unqualified (`Some`/`None`).",
  Result:
    "Result railway combinators — data-last for `|>` chains. Ctors stay unqualified (`Ok`/`Err`).",
  Str: "String ops (`Str.split`, `Str.get`, …). Data-last where a subject is involved.",
};

const VALUE_DOCS: Record<string, string> = {
  add: "Number addition. Curried: `add(a)(b)`.",
  sub: "Number subtraction. Curried: `sub(a)(b)`.",
  mul: "Number multiplication. Curried: `mul(a)(b)`.",
  div: "Number division. Curried: `div(a)(b)`.",
  square: "Square a number.",
  sqrt: "Square root.",
  hypot: "Euclidean hypot: `sqrt(a² + b²)`.",
  pi: "π constant.",
  concat: "Polymorphic concat (arrays, lists, strings, …). Curried; also `++`.",
  eq: "Structural equality at any type.",
  compare: "Structural order: returns `-1 | 0 | 1`.",
  show: "Structural display as a string.",
  lt: "Numeric `<`.",
  gt: "Numeric `>`.",
  gte: "Numeric `>=`.",
  lte: "Numeric `<=`.",
  not: "Boolean negation.",
  and: "Boolean and (eager — both args are values).",
  or: "Boolean or (eager — both args are values).",
  min: "Numeric minimum.",
  max: "Numeric maximum.",
  pow: "Exponentiation: `pow(base)(exp)`.",
  mod: "True modulo (sign of divisor).",
  abs: "Absolute value.",
  floor: "Round toward −∞.",
  ceil: "Round toward +∞.",
  round: "Round to nearest integer.",
  sign: "Sign as `-1 | 0 | 1`.",
  negate: "Numeric negation. Also unary `-`.",
  length: "Array length.",
  map: "Map over an Array. Data-last: `xs |> map(f)`.",
  filter: "Filter an Array. Data-last: `xs |> filter(p)`.",
  reduce: "Left fold over an Array. Data-last.",
  identity: "The identity function.",
  always: "Constant function: `always(a)(b) = a`.",
  compose: "Function composition: `compose(g)(f)(x) = g(f(x))`.",
  capitalize: "Uppercase the first character of a string.",
  range: "Lazy `List` of numbers from `lo` (inclusive) to `hi` (exclusive).",
  iterate: "Infinite lazy `List`: `x, f(x), f(f(x)), …`.",
  repeat: "Infinite lazy `List` of a single value.",
  take: "Take the first `n` elements of a lazy `List`.",
  takeWhile: "Take from a lazy `List` while the predicate holds.",
  drop: "Drop the first `n` elements of a lazy `List`.",
  fromArray: "Eager Array → lazy `List`.",
  toArray: "Materialize a lazy `List` to an Array (hangs on infinite lists).",
};

/** Surface-ish type printer: prelude vars 0.. → a.., else showType. */
const showSurface = (t: Type): string => {
  switch (t.kind) {
    case "var":
      return VAR_NAMES[t.id] ?? showType(t);
    case "con":
      if (t.name === "Array" && t.args.length === 1) return `[${showSurface(t.args[0]!)}]`;
      if (t.name === "tuple") return `(${t.args.map(showSurface).join(", ")})`;
      return t.args.length === 0 ? t.name : `${t.name} ${t.args.map(showSurface).join(" ")}`;
    case "arrow": {
      const from = t.from.kind === "arrow" ? `(${showSurface(t.from)})` : showSurface(t.from);
      return `${from} -> ${showSurface(t.to)}`;
    }
    case "record":
      return showType(t);
  }
};

export type PreludeVirtual = {
  source: string;
  origins: Origins;
  /** `Ns.member` → def Location in the virtual buffer. */
  nsMembers: Map<string, Location>;
};

const nsKey = (ns: string, member: string): string => `${ns}.${member}`;

const build = (): PreludeVirtual => {
  let source = "";
  const origins = emptyOrigins();
  const nsMembers = new Map<string, Location>();

  /** Append a line; return the absolute offset where `line` begins. */
  const push = (line: string): number => {
    if (source.length > 0) source += "\n";
    const start = source.length;
    source += line;
    return start;
  };

  const doc = (text: string | undefined): void => {
    if (!text) return;
    for (const line of text.split("\n")) push(`/// ${line}`);
  };

  const note = (space: keyof Origins, name: string, start: number, end: number): void => {
    origins[space].set(name, { path: PRELUDE_PATH, span: { start, end } });
  };

  push("/// Built-in prelude (virtual). Read-only go-to-definition targets.");
  push("/// Not a real module — these names are always in scope.");
  push("");

  for (const decl of builtinTypeDecls) {
    doc(TYPE_DOCS[decl.name]);
    const params = decl.params.length > 0 ? ` ${decl.params.join(" ")}` : "";
    const header = `type ${decl.name}${params} =`;
    const lineStart = push(header);
    const nameStart = lineStart + "type ".length;
    note("type", decl.name, nameStart, nameStart + decl.name.length);
    for (const c of decl.ctors) {
      doc(CTOR_DOCS[c.name]);
      const args =
        c.fields.length === 0
          ? ""
          : `(${c.fields.map((f) => (f.type.kind === "tname" ? f.type.name : "_")).join(", ")})`;
      const line = `  | ${c.name}${args}`;
      const ctorLine = push(line);
      const ctorStart = ctorLine + "  | ".length;
      const at: Location = {
        path: PRELUDE_PATH,
        span: { start: ctorStart, end: ctorStart + c.name.length },
      };
      origins.ctor.set(c.name, at);
      origins.value.set(c.name, at);
    }
    push("");
  }

  push("/// Unqualified values / functions");
  push("");
  for (const [name, ty] of Object.entries(preludeEnv)) {
    doc(VALUE_DOCS[name] ?? `${name} builtin.`);
    const line = `extern ${name} : ${showSurface(ty)} = "mochi:prelude" "${name}"`;
    const lineStart = push(line);
    const nameStart = lineStart + "extern ".length;
    note("value", name, nameStart, nameStart + name.length);
    push("");
  }

  push("/// Prelude namespaces (`Result.map`, `Array.filter`, …)");
  push("");
  for (const [ns, members] of Object.entries(preludeNamespaces)) {
    doc(NS_DOCS[ns] ?? `${ns} namespace.`);
    // Namespace qualifier binding — F12 on `Result` in `Result.map`.
    const nsLine = `let ${ns} = ${ns}`;
    const nsLineStart = push(nsLine);
    const nsNameStart = nsLineStart + "let ".length;
    note("value", ns, nsNameStart, nsNameStart + ns.length);
    push("");
    for (const [member, ty] of Object.entries(members)) {
      doc(`\`${ns}.${member}\``);
      // Keep the surface name as `member` so the def span is the bare identifier;
      // the /// line above carries the qualified name.
      const line = `extern ${member} : ${showSurface(ty)} = "mochi:prelude" "${ns}.${member}"`;
      const lineStart = push(line);
      const nameStart = lineStart + "extern ".length;
      const at: Location = {
        path: PRELUDE_PATH,
        span: { start: nameStart, end: nameStart + member.length },
      };
      nsMembers.set(nsKey(ns, member), at);
      push("");
    }
  }

  return { source, origins, nsMembers };
};

let cached: PreludeVirtual | undefined;

/** Memoized virtual prelude source + export Locations. */
export const preludeVirtual = (): PreludeVirtual => {
  cached ??= build();
  return cached;
};

export const preludeVirtualSource = (): string => preludeVirtual().source;

export const preludeOrigins = (): Origins => preludeVirtual().origins;

/** Def Location for a prelude `Ns.member`, or null. */
export const preludeNsMember = (ns: string, member: string): Location | null =>
  preludeVirtual().nsMembers.get(nsKey(ns, member)) ?? null;

/** Span of the field name in `target.name` (parser span covers the whole access). */
export const fieldNameSpan = (fieldSpan: Span, name: string): Span => ({
  start: fieldSpan.end - name.length,
  end: fieldSpan.end,
});

/** Lookup a builtin docstring (for tests / future hover enrichment). */
export const preludeDoc = (name: string): string | undefined =>
  VALUE_DOCS[name] ?? CTOR_DOCS[name] ?? TYPE_DOCS[name] ?? NS_DOCS[name];

const sameLoc = (a: Location, b: Location): boolean =>
  a.path === b.path && a.span.start === b.span.start && a.span.end === b.span.end;

/** Binding-shaped input for prelude docstring lookup (avoids a symbols cycle). */
export type PreludeDocBinding = {
  name: string;
  space: "value" | "type" | "ctor" | "field";
  def: Location;
};

/** Doc for a symbol-index binding whose def is in the virtual prelude. */
export const preludeDocForBinding = (b: PreludeDocBinding): string | undefined => {
  if (!isPreludePath(b.def.path)) return undefined;
  const v = preludeVirtual();
  for (const [key, loc] of v.nsMembers) {
    if (sameLoc(loc, b.def)) return `\`${key}\``;
  }
  if (b.space === "type") return TYPE_DOCS[b.name];
  if (b.space === "ctor") return CTOR_DOCS[b.name];
  return VALUE_DOCS[b.name] ?? CTOR_DOCS[b.name] ?? NS_DOCS[b.name];
};
