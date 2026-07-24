// Lexical symbol index — def/use map over a Program without typechecking
// (ADR 0003). Binding identity is the def Location (path + span), not the
// name string, so shadowing stays precise. Powers go-to-definition, find-refs,
// rename, highlight, and diagnostic labels in later DX slices.
import type { Expr, LamParam, Pattern, Program, Stmt, TypeExpr } from "./ast";
import { isCtorName } from "./ast";
import type { Location, Span } from "./span";

export type SymbolSpace = "value" | "type" | "ctor";

export type Binding = {
  name: string;
  space: SymbolSpace;
  def: Location;
};

export type Occurrence = {
  binding: Binding;
  span: Span;
  role: "def" | "use";
};

export type SymbolIndex = {
  /** Tightest occurrence containing `offset`, or null. */
  at: (offset: number) => Occurrence | null;
  /** All occurrences of a binding (def + uses), def first. */
  occurrences: (b: Binding) => Occurrence[];
};

type Scope = Map<string, Binding>;

type Builder = {
  path: string;
  scopes: { value: Scope[]; type: Scope[]; ctor: Scope[] };
  occurrences: Occurrence[];
};

const loc = (path: string, span: Span): Location => ({ path, span });

const pushScope = (b: Builder, space: SymbolSpace): void => {
  b.scopes[space].push(new Map());
};

const popScope = (b: Builder, space: SymbolSpace): void => {
  b.scopes[space] = b.scopes[space].slice(0, -1);
};

const lookup = (b: Builder, space: SymbolSpace, name: string): Binding | undefined => {
  const stack = b.scopes[space];
  for (let i = stack.length - 1; i >= 0; i--) {
    const hit = stack[i]!.get(name);
    if (hit) return hit;
  }
  return undefined;
};

const PLACEHOLDER: Span = { start: -1, end: -1 };
const isPlaceholder = (binding: Binding): boolean => binding.def.span.start < 0;

const bind = (b: Builder, space: SymbolSpace, name: string, span: Span): Binding => {
  const binding: Binding = { name, space, def: loc(b.path, span) };
  b.scopes[space][b.scopes[space].length - 1]!.set(name, binding);
  if (!isPlaceholder(binding)) b.occurrences.push({ binding, span, role: "def" });
  return binding;
};

/** Enter a name in scope without a navigable def (destructure params lacking spans). */
const bindOpaque = (b: Builder, name: string): void => {
  const binding: Binding = { name, space: "value", def: loc(b.path, PLACEHOLDER) };
  b.scopes.value[b.scopes.value.length - 1]!.set(name, binding);
};

const use = (b: Builder, space: SymbolSpace, name: string, span: Span): void => {
  const binding = lookup(b, space, name);
  if (binding && !isPlaceholder(binding)) b.occurrences.push({ binding, span, role: "use" });
};

const bindParam = (b: Builder, p: LamParam): void => {
  if (p.kind === "name") {
    if (!p.name.startsWith("$")) bind(b, "value", p.name, p.span);
    return;
  }
  if (p.kind === "ptuple") {
    for (const n of p.names) bindOpaque(b, n);
    return;
  }
  for (const f of p.fields) bindOpaque(b, f);
};

const walkPat = (b: Builder, p: Pattern): void => {
  switch (p.kind) {
    case "pbind":
      if (p.name !== "_") bind(b, "value", p.name, p.span);
      return;
    case "pctor":
      use(b, "ctor", p.ctor, p.span);
      for (const a of p.args) walkPat(b, a);
      return;
    case "precord":
      for (const f of p.fields) walkPat(b, f.pat);
      return;
    case "ptuple":
      for (const e of p.elems) walkPat(b, e);
      return;
    case "parr":
    case "plist":
      for (const e of p.elems) walkPat(b, e);
      if (p.rest) walkPat(b, p.rest);
      return;
    case "por":
      // Same binders in each alt — walk the first for binds; still note ctor uses
      // in every alt.
      if (p.alts[0]) walkPat(b, p.alts[0]);
      for (let i = 1; i < p.alts.length; i++) walkPatUses(b, p.alts[i]!);
      return;
    default:
      return;
  }
};

// Pattern walk that only records uses (ctors), not new binds — for or-pattern alts
// after the first (binders already recorded).
const walkPatUses = (b: Builder, p: Pattern): void => {
  switch (p.kind) {
    case "pctor":
      use(b, "ctor", p.ctor, p.span);
      for (const a of p.args) walkPatUses(b, a);
      return;
    case "precord":
      for (const f of p.fields) walkPatUses(b, f.pat);
      return;
    case "ptuple":
      for (const e of p.elems) walkPatUses(b, e);
      return;
    case "parr":
    case "plist":
      for (const e of p.elems) walkPatUses(b, e);
      if (p.rest) walkPatUses(b, p.rest);
      return;
    case "por":
      for (const a of p.alts) walkPatUses(b, a);
      return;
    default:
      return;
  }
};

const walkTypeExpr = (b: Builder, t: TypeExpr): void => {
  switch (t.kind) {
    case "tname":
      // Lowercase = type variable; skip. Named types (Uppercase) are indexed.
      if (/^[A-Z]/.test(t.name)) use(b, "type", t.name, t.span);
      return;
    case "tarrow":
      walkTypeExpr(b, t.from);
      walkTypeExpr(b, t.to);
      return;
    case "tapp":
      use(b, "type", t.ctor, t.span);
      for (const a of t.args) walkTypeExpr(b, a);
      return;
    case "ttuple":
      for (const e of t.elems) walkTypeExpr(b, e);
      return;
    case "tlist":
      walkTypeExpr(b, t.elem);
      return;
  }
};

const walkExpr = (b: Builder, e: Expr): void => {
  switch (e.kind) {
    case "num":
    case "bool":
    case "str":
      return;
    case "interp":
      for (const p of e.parts) if (typeof p !== "string") walkExpr(b, p);
      return;
    case "ref":
      if (e.name.startsWith("$")) return;
      if (isCtorName(e.name)) {
        // Prefer ctor, then value (a shadowed let Ok = …).
        if (lookup(b, "ctor", e.name)) use(b, "ctor", e.name, e.span);
        else use(b, "value", e.name, e.span);
      } else {
        use(b, "value", e.name, e.span);
      }
      return;
    case "call":
      walkExpr(b, e.fn);
      for (const a of e.args) walkExpr(b, a);
      return;
    case "lambda": {
      pushScope(b, "value");
      for (const p of e.params) bindParam(b, p);
      walkExpr(b, e.body);
      popScope(b, "value");
      return;
    }
    case "letin":
      walkExpr(b, e.value);
      if (e.annot) walkTypeExpr(b, e.annot);
      pushScope(b, "value");
      bind(b, "value", e.name, e.nameSpan);
      walkExpr(b, e.body);
      popScope(b, "value");
      return;
    case "letbind":
      walkExpr(b, e.value);
      pushScope(b, "value");
      bindParam(b, e.param);
      walkExpr(b, e.body);
      popScope(b, "value");
      return;
    case "pipe":
      walkExpr(b, e.left);
      walkExpr(b, e.right);
      return;
    case "ternary":
      walkExpr(b, e.cond);
      walkExpr(b, e.then);
      walkExpr(b, e.else);
      return;
    case "match":
      walkExpr(b, e.scrutinee);
      for (const arm of e.arms) {
        pushScope(b, "value");
        walkPat(b, arm.pattern);
        if (arm.guard) walkExpr(b, arm.guard);
        walkExpr(b, arm.body);
        popScope(b, "value");
      }
      return;
    case "record":
      if (e.spread) walkExpr(b, e.spread);
      for (const f of e.fields) walkExpr(b, f.value);
      return;
    case "field":
      walkExpr(b, e.target);
      // Property names are not bindings in the value/type/ctor index.
      return;
    case "tuple":
      for (const el of e.elements) walkExpr(b, el);
      return;
    case "arr":
    case "list":
    case "set":
      for (const el of e.elements) {
        if (el.kind === "expr" || el.kind === "spread") walkExpr(b, el.expr);
      }
      return;
    case "map":
      for (const en of e.entries) {
        walkExpr(b, en.key);
        walkExpr(b, en.value);
      }
      return;
  }
};

const bindTopLevels = (b: Builder, stmts: Stmt[], origins?: Origins): void => {
  for (const s of stmts) {
    if (s.kind === "import") {
      if (s.alias) bind(b, "value", s.alias.name, s.alias.span);
      else for (const n of s.names) bindImport(b, n.name, n.span, origins);
    } else if (s.kind === "type") {
      bind(b, "type", s.name, s.nameSpan);
      for (const c of s.ctors) bind(b, "ctor", c.name, c.span);
    } else if (s.kind === "let") {
      if (!s.name.startsWith("$")) bind(b, "value", s.name, s.nameSpan);
    } else if (s.kind === "extern") {
      bind(b, "value", s.name, s.nameSpan);
    }
  }
};

const walkStmts = (b: Builder, stmts: Stmt[]): void => {
  for (const s of stmts) {
    if (s.kind === "let") {
      if (s.annot) walkTypeExpr(b, s.annot);
      walkExpr(b, s.value);
    } else if (s.kind === "extern") {
      walkTypeExpr(b, s.typeExpr);
    } else if (s.kind === "type") {
      for (const c of s.ctors) for (const f of c.fields) walkTypeExpr(b, f.type);
      if (s.alias) for (const f of s.alias) walkTypeExpr(b, f.type);
    }
  }
};

const sameBinding = (a: Binding, b: Binding): boolean =>
  a.space === b.space &&
  a.name === b.name &&
  a.def.path === b.def.path &&
  a.def.span.start === b.def.span.start &&
  a.def.span.end === b.def.span.end;

export { sameBinding };

/** Export sites in `prog` at `path`, keyed by symbol space. */
export type Origins = {
  value: Map<string, Location>;
  type: Map<string, Location>;
  ctor: Map<string, Location>;
};

export const emptyOrigins = (): Origins => ({
  value: new Map(),
  type: new Map(),
  ctor: new Map(),
});

export const originsOf = (path: string, prog: Program): Origins => {
  const out = emptyOrigins();
  for (const s of prog.stmts) {
    if (s.kind === "import" || !("exported" in s) || !s.exported) continue;
    if (s.kind === "let" || s.kind === "extern") out.value.set(s.name, loc(path, s.nameSpan));
    else if (s.kind === "type") {
      out.type.set(s.name, loc(path, s.nameSpan));
      for (const c of s.ctors) {
        const at = loc(path, c.span);
        out.ctor.set(c.name, at);
        // Ctors are also values in the env / import list.
        out.value.set(c.name, at);
      }
    }
  }
  return out;
};

export const mergeOrigins = (into: Origins, from: Origins): void => {
  for (const [k, v] of from.value) into.value.set(k, v);
  for (const [k, v] of from.type) into.type.set(k, v);
  for (const [k, v] of from.ctor) into.ctor.set(k, v);
};

/** Bind an imported name; def points at the export when `origins` has it. */
const bindImport = (b: Builder, name: string, span: Span, origins?: Origins): void => {
  const ctorDef = origins?.ctor.get(name);
  const valueDef = origins?.value.get(name);
  const typeDef = origins?.type.get(name);
  if (ctorDef) {
    const binding: Binding = { name, space: "ctor", def: ctorDef };
    b.scopes.ctor[b.scopes.ctor.length - 1]!.set(name, binding);
    // Constructor refs resolve via ctor space; also seed value for non-call uses.
    b.scopes.value[b.scopes.value.length - 1]!.set(name, { name, space: "value", def: ctorDef });
    b.occurrences.push({ binding, span, role: "use" });
    return;
  }
  if (valueDef) {
    const binding: Binding = { name, space: "value", def: valueDef };
    b.scopes.value[b.scopes.value.length - 1]!.set(name, binding);
    b.occurrences.push({ binding, span, role: "use" });
    return;
  }
  if (typeDef) {
    const binding: Binding = { name, space: "type", def: typeDef };
    b.scopes.type[b.scopes.type.length - 1]!.set(name, binding);
    b.occurrences.push({ binding, span, role: "use" });
    return;
  }
  bind(b, "value", name, span);
};

/** Build a symbol index. `origins` rewrites imported names to their export Locations. */
export const indexProgram = (path: string, prog: Program, origins?: Origins): SymbolIndex => {
  const b: Builder = {
    path,
    scopes: { value: [new Map()], type: [new Map()], ctor: [new Map()] },
    occurrences: [],
  };
  bindTopLevels(b, prog.stmts, origins);
  walkStmts(b, prog.stmts);

  const at = (offset: number): Occurrence | null => {
    let best: Occurrence | null = null;
    for (const o of b.occurrences) {
      if (offset < o.span.start || offset >= o.span.end) continue;
      const width = o.span.end - o.span.start;
      if (!best || width < best.span.end - best.span.start) best = o;
    }
    return best;
  };

  const occurrences = (binding: Binding): Occurrence[] => {
    const all = b.occurrences.filter((o) => sameBinding(o.binding, binding));
    return [...all].sort((a, c) => {
      if (a.role !== c.role) return a.role === "def" ? -1 : 1;
      return a.span.start - c.span.start;
    });
  };

  return { at, occurrences };
};
