// Semantic pass — the Reason superpower: exhaustiveness + constructor checks.
// Builds a variant registry from `type` decls, then verifies every `switch`.
import { err, isErr, ok, type Result } from "@onrails/result";
import type { CtorPat, Expr, MatchExpr, Pattern, Program, TypeExpr } from "./ast";
import { type AlangError, checkErr } from "./errors";
import { builtinTypeDecls, preludeNamespaces } from "./prelude";

type CtorInfo = { type: string; arity: number };
export type Registry = {
  ctor: Map<string, CtorInfo>; // ctor name → owning type + arity
  type: Map<string, string[]>; // type name → its ctor names
};

// The registry a module publishes: only its EXPORTED variant types (and their
// full ctor sets). Threaded into an importer's `check` so a `switch` on an
// imported variant is exhaustiveness-checked against every constructor — even
// ones the importer never imported (those force a catch-all, since it can't
// name them).
export const exportedRegistry = (prog: Program): Registry => {
  const reg: Registry = { ctor: new Map(), type: new Map() };
  for (const s of prog.stmts) {
    if (s.kind !== "type" || !s.exported) continue;
    reg.type.set(
      s.name,
      s.ctors.map((c) => c.name),
    );
    for (const c of s.ctors) reg.ctor.set(c.name, { type: s.name, arity: c.fields.length });
  }
  return reg;
};

const buildRegistry = (prog: Program): Result<Registry, AlangError> => {
  const reg: Registry = { ctor: new Map(), type: new Map() };
  for (const s of prog.stmts) {
    if (s.kind !== "type") continue;
    if (reg.type.has(s.name)) return err(checkErr(`duplicate type '${s.name}'`, s.span));
    // A transparent record alias reserves its name (so a later variant can't
    // reuse it) but registers no constructors — it's structural, never a
    // `switch` target. An empty ctor list is inert for exhaustiveness.
    reg.type.set(
      s.name,
      s.ctors.map((c) => c.name),
    );
    for (const c of s.ctors) {
      if (reg.ctor.has(c.name)) return err(checkErr(`duplicate constructor '${c.name}'`, s.span));
      reg.ctor.set(c.name, { type: s.name, arity: c.fields.length });
    }
  }
  // Seed builtin variant types (Option/Result) unless the program declares its
  // own type of that name — so user redeclarations win with no duplicate error.
  for (const bt of builtinTypeDecls) {
    if (reg.type.has(bt.name)) continue;
    reg.type.set(
      bt.name,
      bt.ctors.map((c) => c.name),
    );
    for (const c of bt.ctors)
      if (!reg.ctor.has(c.name)) reg.ctor.set(c.name, { type: bt.name, arity: c.fields.length });
  }
  return ok(reg);
};

// Walk an expression tree, invoking `visit` on every `match` node.
function forEachMatch(e: Expr, visit: (m: MatchExpr) => void): void {
  switch (e.kind) {
    case "num":
    case "bool":
    case "str":
    case "ref":
      return;
    case "call":
      forEachMatch(e.fn, visit);
      for (const a of e.args) forEachMatch(a, visit);
      return;
    case "lambda":
      forEachMatch(e.body, visit);
      return;
    case "letin":
      forEachMatch(e.value, visit);
      forEachMatch(e.body, visit);
      return;
    case "pipe":
      forEachMatch(e.left, visit);
      forEachMatch(e.right, visit);
      return;
    case "ternary":
      forEachMatch(e.cond, visit);
      forEachMatch(e.then, visit);
      forEachMatch(e.else, visit);
      return;
    case "match":
      forEachMatch(e.scrutinee, visit);
      for (const a of e.arms) {
        if (a.guard) forEachMatch(a.guard, visit);
        forEachMatch(a.body, visit);
      }
      visit(e);
      return;
    case "record":
      for (const f of e.fields) forEachMatch(f.value, visit);
      return;
    case "field":
      forEachMatch(e.target, visit);
      return;
    case "tuple":
    case "arr":
    case "list":
      for (const el of e.elements) forEachMatch(el, visit);
      return;
    case "map":
      for (const ent of e.entries) {
        forEachMatch(ent.key, visit);
        forEachMatch(ent.value, visit);
      }
      return;
  }
}

// A pattern is a catch-all when it always matches. A record pattern does so
// only when every field just binds (no literal field narrows the match).
const isCatchAll = (p: Pattern): boolean =>
  p.kind === "pwild" ||
  p.kind === "pbind" ||
  (p.kind === "precord" && p.fields.every((f) => isCatchAll(f.pat))) ||
  // A tuple always matches when every position does (irrefutable product).
  (p.kind === "ptuple" && p.elems.every(isCatchAll)) ||
  // `[...all]` / `@{...all}` — a bare rest with no fixed head matches any list.
  ((p.kind === "parr" || p.kind === "plist") && p.elems.length === 0 && p.rest !== null);

// Eager Array (`parr`) and lazy List (`plist`) patterns share one exhaustiveness
// rule: a switch can't be proven total in general, but the canonical ML form —
// an empty `[]`/`@{}` arm plus a single-head cons `[x, ...xs]`/`@{x, ...xs}` —
// covers length 0 and length ≥ 1, so it's total. Fixed-length arms (`@{a, b}`)
// and extra arms are allowed but don't themselves prove totality (need the pair
// above or a `_`). Returns null (exhaustive), an error (a list switch that
// isn't), or undefined (not a list switch → let the caller decide).
const checkSeqExhaustive = (m: MatchExpr): AlangError | null | undefined => {
  const seqs = m.arms.flatMap((a) =>
    // Guarded arms don't prove totality (the guard can be false).
    (a.pattern.kind === "parr" || a.pattern.kind === "plist") && !a.guard ? [a.pattern] : [],
  );
  if (seqs.length === 0) return undefined;
  const hasEmpty = seqs.some((p) => p.elems.length === 0 && p.rest === null);
  const hasCons = seqs.some((p) => p.elems.length === 1 && p.rest !== null);
  if (hasEmpty && hasCons) return null;
  return checkErr("non-exhaustive list switch: cover `[]` and `[x, ...xs]` (or add `_`)", m.span);
};

// Validate a pattern tree: nested constructors must exist with the right
// arity (top-level ctor arms are re-validated by checkMatch, which also needs
// the registry info for exhaustiveness), and a lazy-List pattern cannot nest
// inside another pattern — matching it pulls from the generator, an effect the
// emitted guard form must not hide mid-predicate. Top-level `plist` arms are
// fine (genListMatch owns the pulling discipline).
const checkPattern = (p: Pattern, reg: Registry, top: boolean): AlangError | null => {
  switch (p.kind) {
    case "pctor": {
      const info = reg.ctor.get(p.ctor);
      if (!info) return checkErr(`unknown constructor '${p.ctor}'`, p.span);
      if (p.args.length !== info.arity)
        return checkErr(
          `constructor '${p.ctor}' expects ${info.arity} arg(s), got ${p.args.length}`,
          p.span,
        );
      for (const a of p.args) {
        const e = checkPattern(a, reg, false);
        if (e) return e;
      }
      return null;
    }
    case "precord": {
      for (const f of p.fields) {
        const e = checkPattern(f.pat, reg, false);
        if (e) return e;
      }
      return null;
    }
    case "ptuple": {
      for (const el of p.elems) {
        const e = checkPattern(el, reg, false);
        if (e) return e;
      }
      return null;
    }
    case "parr":
    case "plist": {
      if (p.kind === "plist" && !top)
        return checkErr(
          "lazy-List pattern cannot nest inside another pattern (matching pulls from the sequence)",
          p.span,
        );
      for (const el of p.elems) {
        const e = checkPattern(el, reg, false);
        if (e) return e;
      }
      return p.rest ? checkPattern(p.rest, reg, false) : null;
    }
    default:
      return null;
  }
};

// A constructor arm covers its constructor only when every argument is
// irrefutable (a bind/wildcard or an all-binding record/tuple). A narrowing
// arm — `Sm(Sm(n))`, `Sm(0)` — matches a strict subset, so it must not count
// toward exhaustiveness.
const coversCtor = (p: CtorPat): boolean => p.args.every(isCatchAll);

function checkMatch(m: MatchExpr, reg: Registry): AlangError | null {
  for (const arm of m.arms) {
    const e = checkPattern(arm.pattern, reg, true);
    if (e) return e;
  }
  // Guards vs lazy Lists: a guarded arm still pulls from the sequence to test
  // its pattern, and `genListMatch`'s buffering discipline has no guard slot —
  // reject rather than miscompile. (Guards on eager `[...]` arms are fine.)
  const isListSwitch = m.arms.some((a) => a.pattern.kind === "plist" && !isCatchAll(a.pattern));
  for (const arm of m.arms) {
    if (!arm.guard) continue;
    if (arm.pattern.kind === "plist" || isListSwitch)
      return checkErr(
        "`when` guards are unsupported in a lazy-List switch (matching pulls from the sequence)",
        arm.guard.span,
      );
  }
  // An arm after an unguarded catch-all can never match; with guards in the
  // mix, silently reordering it at codegen would change semantics — reject.
  const catchIdx = m.arms.findIndex((a) => isCatchAll(a.pattern) && !a.guard);
  const afterCatch = catchIdx === -1 ? undefined : m.arms[catchIdx + 1];
  if (afterCatch)
    return checkErr(
      "unreachable arm: a catch-all arm above it matches first",
      afterCatch.pattern.span,
    );
  // A guarded arm never counts toward exhaustiveness — the guard can be false.
  const hasCatchAll = m.arms.some((a) => isCatchAll(a.pattern) && !a.guard);
  const ctorArms = m.arms.filter((a) => a.pattern.kind === "pctor");

  // No constructor arms → literal/wildcard/bool switch. A catch-all makes it
  // total; so does covering both boolean cases (bool is a closed two-case type).
  if (ctorArms.length === 0) {
    if (hasCatchAll) return null;
    const bools = new Set(
      m.arms.flatMap((a) => (a.pattern.kind === "pbool" && !a.guard ? [a.pattern.value] : [])),
    );
    if (bools.has(true) && bools.has(false)) return null;
    const listErr = checkSeqExhaustive(m);
    if (listErr !== undefined) return listErr;
    return checkErr("non-exhaustive switch: add a `_` catch-all arm", m.span);
  }

  // Validate each constructor pattern: known + right arity.
  let owningType: string | null = null;
  const covered = new Set<string>();
  for (const arm of ctorArms) {
    const p = arm.pattern as CtorPat;
    const info = reg.ctor.get(p.ctor);
    if (!info) return checkErr(`unknown constructor '${p.ctor}'`, p.span);
    if (p.args.length !== info.arity)
      return checkErr(
        `constructor '${p.ctor}' expects ${info.arity} arg(s), got ${p.args.length}`,
        p.span,
      );
    if (owningType === null) owningType = info.type;
    else if (owningType !== info.type)
      return checkErr(`switch mixes variants of '${owningType}' and '${info.type}'`, p.span);
    if (coversCtor(p) && !arm.guard) covered.add(p.ctor);
  }

  if (hasCatchAll) return null; // catch-all covers the rest
  const required = reg.type.get(owningType!)!;
  const missing = required.filter((c) => !covered.has(c));
  if (missing.length === 0) return null;
  // A narrowing arm on a missing ctor means the user matched it partially —
  // point at the fix rather than just naming the gap.
  const seen = new Set(ctorArms.map((a) => (a.pattern as CtorPat).ctor));
  const narrowed = missing.filter((c) => seen.has(c));
  const hint = narrowed.length
    ? ` (arm(s) on ${narrowed.join(", ")} narrow — add ${narrowed[0]}(_) or a '_' catch-all)`
    : "";
  return checkErr(
    `non-exhaustive switch on '${owningType}': missing ${missing.join(", ")}${hint}`,
    m.span,
  );
}

// Collection namespaces are built-in; binding one as a value/type/import would
// shadow `List.map` and desync codegen (which resolves them by name), so forbid it.
// Exception: `Option`/`Result` are ALSO builtin variant types whose contract is
// "user redeclarations win" — a `type` statement of those names stays legal
// (the combinators assume the builtin runtime shape; a same-shape redecl is
// the only sensible one and predates the namespaces).
const RESERVED_NAMES = new Set(Object.keys(preludeNamespaces));
const REDECLARABLE_TYPES = new Set(builtinTypeDecls.map((d) => d.name));

const checkReservedNames = (prog: Program): AlangError | null => {
  for (const s of prog.stmts) {
    if (s.kind === "type" && REDECLARABLE_TYPES.has(s.name)) continue;
    if (
      (s.kind === "let" || s.kind === "type" || s.kind === "extern") &&
      RESERVED_NAMES.has(s.name)
    )
      return checkErr(`'${s.name}' is a reserved collection namespace and cannot be bound`, s.span);
    if (s.kind === "import")
      for (const n of s.names)
        if (RESERVED_NAMES.has(n.name))
          return checkErr(
            `'${n.name}' is a reserved collection namespace and cannot be imported`,
            n.span,
          );
  }
  return null;
};

// Ctor field types are full type expressions (ADR 0015). A lowercase leaf name
// is a type variable and must be one of the declaration's parameters — a stray
// var would be existential (matching couldn't recover its type). Prim names
// (number/string/bool/...) are fine.
const CTOR_PRIMS = new Set(["number", "int", "float", "string", "bool"]);

const strayTypeVar = (te: TypeExpr, params: ReadonlySet<string>): TypeExpr | null => {
  switch (te.kind) {
    case "tname":
      return /^[A-Z]/.test(te.name) || CTOR_PRIMS.has(te.name) || params.has(te.name) ? null : te;
    case "tarrow":
      return strayTypeVar(te.from, params) ?? strayTypeVar(te.to, params);
    case "tapp":
      return te.args.reduce<TypeExpr | null>((f, a) => f ?? strayTypeVar(a, params), null);
    case "ttuple":
      return te.elems.reduce<TypeExpr | null>((f, e) => f ?? strayTypeVar(e, params), null);
    case "tlist":
      return strayTypeVar(te.elem, params);
  }
};

const checkCtorFieldVars = (prog: Program): AlangError | null => {
  for (const s of prog.stmts) {
    if (s.kind !== "type") continue;
    const params = new Set(s.params);
    for (const c of s.ctors)
      for (const f of c.fields) {
        const stray = strayTypeVar(f.type, params);
        if (stray && stray.kind === "tname")
          return checkErr(
            `unknown type parameter '${stray.name}' in constructor '${c.name}' — declare it: type ${s.name} ${[...s.params, stray.name].join(" ")} = ...`,
            stray.span,
          );
      }
  }
  return null;
};

// `imported` carries the ctor/type registries of the modules this program
// imports from; merged UNDER the local registry (local declarations win) so
// exhaustiveness works across the module boundary.
export function check(prog: Program, imported?: Registry): Result<Program, AlangError> {
  const reserved = checkReservedNames(prog);
  if (reserved) return err(reserved);
  const strays = checkCtorFieldVars(prog);
  if (strays) return err(strays);
  const built = buildRegistry(prog);
  if (isErr(built)) return built;
  const reg = built.value;
  if (imported) {
    for (const [k, v] of imported.type) if (!reg.type.has(k)) reg.type.set(k, v);
    for (const [k, v] of imported.ctor) if (!reg.ctor.has(k)) reg.ctor.set(k, v);
  }

  for (const s of prog.stmts) {
    if (s.kind !== "let") continue;
    let found: AlangError | null = null;
    forEachMatch(s.value, (m) => {
      found ??= checkMatch(m, reg);
    });
    if (found) return err(found);
  }
  return ok(prog);
}
