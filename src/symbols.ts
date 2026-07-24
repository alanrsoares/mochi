/**
 * Lexical symbol index — def/use map over a Program without typechecking
 * (ADR 0003). Binding identity is the def Location (path + span), not the
 * name string, so shadowing stays precise. Powers go-to-definition, find-refs,
 * rename, highlight, and diagnostic labels.
 */

import { fromNullable, match as matchMaybe } from "@onrails/maybe";
import { match } from "@onrails/pattern";
import type { Expr, LamParam, Pattern, Program, Stmt, TypeExpr } from "./ast";
import { isCtorName } from "./ast";
import { fieldNameSpan, preludeNsMember, preludeOrigins } from "./prelude-virtual";
import type { Location, Span } from "./span";
import { tightestHit } from "./span";

export type SymbolSpace = "value" | "type" | "ctor" | "field";

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
  /** Innermost binding of `name` in `space`, or null. */
  binding: (space: SymbolSpace, name: string) => Binding | null;
};

type Scope = Map<string, Binding>;

type Builder = {
  path: string;
  scopes: { value: Scope[]; type: Scope[]; ctor: Scope[]; field: Scope[] };
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

/**
 * File-level record field name. First site is the def (alias preferred via
 * bindTopLevels order); later alias/literal/pattern/access sites are uses of
 * that same binding. Row polymorphism → name heuristic only.
 */
const touchField = (b: Builder, name: string, span: Span): void => {
  if (lookup(b, "field", name)) use(b, "field", name, span);
  else bind(b, "field", name, span);
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
  match(p)
    .with({ kind: "pbind" }, (pbind) => {
      if (pbind.name !== "_") bind(b, "value", pbind.name, pbind.span);
    })
    .with({ kind: "pctor" }, (pctor) => {
      use(b, "ctor", pctor.ctor, pctor.span);
      for (const a of pctor.args) walkPat(b, a);
    })
    .with({ kind: "precord" }, (precord) => {
      for (const f of precord.fields) {
        touchField(b, f.label, f.labelSpan);
        walkPat(b, f.pat);
      }
    })
    .with({ kind: "ptuple" }, (ptuple) => {
      for (const e of ptuple.elems) walkPat(b, e);
    })
    .with({ kind: "parr" }, (parr) => {
      for (const e of parr.elems) walkPat(b, e);
      if (parr.rest) walkPat(b, parr.rest);
    })
    .with({ kind: "plist" }, (plist) => {
      for (const e of plist.elems) walkPat(b, e);
      if (plist.rest) walkPat(b, plist.rest);
    })
    .with({ kind: "por" }, (por) => {
      // Same binders in each alt — walk the first for binds; still note ctor uses
      // in every alt.
      if (por.alts[0]) walkPat(b, por.alts[0]);
      for (let i = 1; i < por.alts.length; i++) walkPatUses(b, por.alts[i]!);
    })
    .withOneOf([{ kind: "pwild" }, { kind: "plit" }, { kind: "pbool" }, { kind: "pstr" }], () => {})
    .exhaustive();
};

/** Pattern walk that only records uses (ctors), not new binds — for or-pattern alts after the first. */
const walkPatUses = (b: Builder, p: Pattern): void => {
  match(p)
    .with({ kind: "pctor" }, (pctor) => {
      use(b, "ctor", pctor.ctor, pctor.span);
      for (const a of pctor.args) walkPatUses(b, a);
    })
    .with({ kind: "precord" }, (precord) => {
      for (const f of precord.fields) {
        touchField(b, f.label, f.labelSpan);
        walkPatUses(b, f.pat);
      }
    })
    .with({ kind: "ptuple" }, (ptuple) => {
      for (const e of ptuple.elems) walkPatUses(b, e);
    })
    .with({ kind: "parr" }, (parr) => {
      for (const e of parr.elems) walkPatUses(b, e);
      if (parr.rest) walkPatUses(b, parr.rest);
    })
    .with({ kind: "plist" }, (plist) => {
      for (const e of plist.elems) walkPatUses(b, e);
      if (plist.rest) walkPatUses(b, plist.rest);
    })
    .with({ kind: "por" }, (por) => {
      for (const a of por.alts) walkPatUses(b, a);
    })
    .withOneOf(
      [{ kind: "pbind" }, { kind: "pwild" }, { kind: "plit" }, { kind: "pbool" }, { kind: "pstr" }],
      () => {},
    )
    .exhaustive();
};

const walkTypeExpr = (b: Builder, t: TypeExpr): void => {
  match(t)
    .with({ kind: "tname" }, (tname) => {
      // Lowercase = type variable; skip. Named types (Uppercase) are indexed.
      if (/^[A-Z]/.test(tname.name)) use(b, "type", tname.name, tname.span);
    })
    .with({ kind: "tarrow" }, (tarrow) => {
      walkTypeExpr(b, tarrow.from);
      walkTypeExpr(b, tarrow.to);
    })
    .with({ kind: "tapp" }, (tapp) => {
      use(b, "type", tapp.ctor, tapp.span);
      for (const a of tapp.args) walkTypeExpr(b, a);
    })
    .with({ kind: "ttuple" }, (ttuple) => {
      for (const e of ttuple.elems) walkTypeExpr(b, e);
    })
    .with({ kind: "tlist" }, (tlist) => {
      walkTypeExpr(b, tlist.elem);
    })
    .exhaustive();
};

const walkExpr = (b: Builder, e: Expr): void => {
  match(e)
    .withOneOf([{ kind: "num" }, { kind: "bool" }, { kind: "str" }], () => {})
    .with({ kind: "interp" }, (interp) => {
      for (const p of interp.parts) if (typeof p !== "string") walkExpr(b, p);
    })
    .with({ kind: "ref" }, (ref) => {
      if (ref.name.startsWith("$")) return;
      if (isCtorName(ref.name)) {
        // Prefer ctor, then value (a shadowed let Ok = …).
        if (lookup(b, "ctor", ref.name)) use(b, "ctor", ref.name, ref.span);
        else use(b, "value", ref.name, ref.span);
      } else {
        use(b, "value", ref.name, ref.span);
      }
    })
    .with({ kind: "call" }, (call) => {
      walkExpr(b, call.fn);
      for (const a of call.args) walkExpr(b, a);
    })
    .with({ kind: "lambda" }, (lambda) => {
      pushScope(b, "value");
      for (const p of lambda.params) bindParam(b, p);
      walkExpr(b, lambda.body);
      popScope(b, "value");
    })
    .with({ kind: "letin" }, (letin) => {
      walkExpr(b, letin.value);
      if (letin.annot) walkTypeExpr(b, letin.annot);
      pushScope(b, "value");
      bind(b, "value", letin.name, letin.nameSpan);
      walkExpr(b, letin.body);
      popScope(b, "value");
    })
    .with({ kind: "letbind" }, (letbind) => {
      walkExpr(b, letbind.value);
      pushScope(b, "value");
      bindParam(b, letbind.param);
      walkExpr(b, letbind.body);
      popScope(b, "value");
    })
    .with({ kind: "pipe" }, (pipe) => {
      walkExpr(b, pipe.left);
      walkExpr(b, pipe.right);
    })
    .with({ kind: "ternary" }, (ternary) => {
      walkExpr(b, ternary.cond);
      walkExpr(b, ternary.then);
      walkExpr(b, ternary.else);
    })
    .with({ kind: "match" }, (matchExpr) => {
      walkExpr(b, matchExpr.scrutinee);
      for (const arm of matchExpr.arms) {
        pushScope(b, "value");
        walkPat(b, arm.pattern);
        if (arm.guard) walkExpr(b, arm.guard);
        walkExpr(b, arm.body);
        popScope(b, "value");
      }
    })
    .with({ kind: "record" }, (record) => {
      if (record.spread) walkExpr(b, record.spread);
      for (const f of record.fields) {
        touchField(b, f.name, f.nameSpan);
        walkExpr(b, f.value);
      }
    })
    .with({ kind: "field" }, (field) => {
      walkExpr(b, field.target);
      // Prelude `Ns.member` (e.g. Result.map) — virtual prelude def; else record field.
      if (field.target.kind === "ref") {
        const def = preludeNsMember(field.target.name, field.name);
        if (def) {
          const binding: Binding = { name: field.name, space: "value", def };
          b.occurrences.push({
            binding,
            span: fieldNameSpan(field.span, field.name),
            role: "use",
          });
          return;
        }
      }
      touchField(b, field.name, fieldNameSpan(field.span, field.name));
    })
    .with({ kind: "tuple" }, (tuple) => {
      for (const el of tuple.elements) walkExpr(b, el);
    })
    .withOneOf([{ kind: "arr" }, { kind: "list" }, { kind: "set" }], (seq) => {
      for (const el of seq.elements) {
        if (el.kind === "expr" || el.kind === "spread") walkExpr(b, el.expr);
      }
    })
    .with({ kind: "map" }, (mapExpr) => {
      for (const en of mapExpr.entries) {
        walkExpr(b, en.key);
        walkExpr(b, en.value);
      }
    })
    .exhaustive();
};

const bindTopLevels = (b: Builder, stmts: Stmt[], origins?: Origins): void => {
  for (const s of stmts) {
    if (s.kind === "import") {
      if (s.alias) bind(b, "value", s.alias.name, s.alias.span);
      else for (const n of s.names) bindImport(b, n.name, n.span, origins);
    } else if (s.kind === "type") {
      bind(b, "type", s.name, s.nameSpan);
      for (const c of s.ctors) bind(b, "ctor", c.name, c.span);
      // Alias fields first so `p.x` resolves to the type's `x` when present.
      if (s.alias) for (const f of s.alias) touchField(b, f.name, f.nameSpan);
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

/** Seed builtins so uses resolve to the virtual prelude Location. */
const seedPrelude = (b: Builder): void => {
  const origins = preludeOrigins();
  for (const [name, def] of origins.type) {
    b.scopes.type[0]!.set(name, { name, space: "type", def });
  }
  for (const [name, def] of origins.ctor) {
    b.scopes.ctor[0]!.set(name, { name, space: "ctor", def });
  }
  for (const [name, def] of origins.value) {
    b.scopes.value[0]!.set(name, { name, space: "value", def });
  }
};

/** Build a symbol index. `origins` rewrites imported names to their export Locations. */
export const indexProgram = (path: string, prog: Program, origins?: Origins): SymbolIndex => {
  const b: Builder = {
    path,
    scopes: { value: [new Map()], type: [new Map()], ctor: [new Map()], field: [new Map()] },
    occurrences: [],
  };
  seedPrelude(b);
  bindTopLevels(b, prog.stmts, origins);
  walkStmts(b, prog.stmts);

  const at = (offset: number): Occurrence | null =>
    matchMaybe(
      tightestHit(b.occurrences, offset),
      (o) => o,
      () => null,
    );

  const occurrences = (binding: Binding): Occurrence[] => {
    const all = b.occurrences.filter((o) => sameBinding(o.binding, binding));
    return [...all].sort((a, c) => {
      if (a.role !== c.role) return a.role === "def" ? -1 : 1;
      return a.span.start - c.span.start;
    });
  };

  const binding = (space: SymbolSpace, name: string): Binding | null =>
    matchMaybe(
      fromNullable(lookup(b, space, name)),
      (x) => x,
      () => null,
    );

  return { at, occurrences, binding };
};
