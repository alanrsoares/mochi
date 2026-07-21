// Semantic pass — the Reason superpower: exhaustiveness + constructor checks.
// Builds a variant registry from `type` decls, then verifies every `switch`.
import { err, isErr, ok, type Result } from "@onrails/result";
import type { CtorPat, Expr, LamParam, MatchExpr, OrPat, Pattern, Program, TypeExpr } from "./ast";
import { type AlangError, checkErr } from "./errors";
import { builtinTypeDecls, preludeNamespaces } from "./prelude";
import type { Span } from "./span";

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
    case "letbind":
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
      if (e.spread) forEachMatch(e.spread, visit);
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
    case "por":
      return checkOrPattern(p, reg);
    default:
      return null;
  }
};

// Map each name a pattern binds to a private structural path. The scheme need
// only be internally consistent — it exists to compare or-pattern alternatives.
// A name bound twice in one pattern is an error.
const binderPaths = (p: Pattern, at: string, acc: Map<string, string>): AlangError | null => {
  switch (p.kind) {
    case "pbind":
      if (acc.has(p.name)) return checkErr(`pattern binds '${p.name}' more than once`, p.span);
      acc.set(p.name, at);
      return null;
    case "pctor":
      return firstErr(p.args.map((a, i) => binderPaths(a, `${at}.a${i}`, acc)));
    case "precord":
      return firstErr(p.fields.map((f) => binderPaths(f.pat, `${at}.${f.label}`, acc)));
    case "ptuple":
      return firstErr(p.elems.map((e, i) => binderPaths(e, `${at}.t${i}`, acc)));
    default:
      return null; // pwild/plit/pbool/pstr bind nothing; parr/plist/por barred as alts
  }
};

// An or-pattern (`A | B | …`): each alternative must narrow (not a catch-all),
// must not be an eager/lazy sequence (those need genListMatch/length logic the
// guard form can't host as an alt), and all alts must bind the same names at the
// same structural position — so the arm's single destructure serves every alt.
const checkOrPattern = (p: OrPat, reg: Registry): AlangError | null => {
  const maps: Map<string, string>[] = [];
  for (const alt of p.alts) {
    if (isCatchAll(alt))
      return checkErr(
        "an or-pattern alternative can't be a catch-all (`_` or a bare binding)",
        alt.span,
      );
    if (alt.kind === "parr" || alt.kind === "plist")
      return checkErr("array/list patterns can't appear as an or-pattern alternative", alt.span);
    const e = checkPattern(alt, reg, false);
    if (e) return e;
    const acc = new Map<string, string>();
    const be = binderPaths(alt, "", acc);
    if (be) return be;
    maps.push(acc);
  }
  const ref = maps[0]!;
  for (const m of maps.slice(1)) {
    for (const name of ref.keys())
      if (!m.has(name))
        return checkErr(
          `or-pattern alternatives must bind the same names ('${name}' is missing in an alternative)`,
          p.span,
        );
    for (const [name, at] of m) {
      if (!ref.has(name))
        return checkErr(
          `or-pattern alternatives must bind the same names ('${name}' is missing in an alternative)`,
          p.span,
        );
      if (ref.get(name) !== at)
        return checkErr(
          `or-pattern binds '${name}' at a differing position across alternatives`,
          p.span,
        );
    }
  }
  return null;
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
  // An or-pattern arm contributes each alternative to coverage, sharing the
  // arm's guard — `| Red | Green => …` covers both, `| true | false => …` is
  // total. Flatten to leaves so the ctor/bool logic below sees each one.
  const leaves = m.arms.flatMap((a) => {
    const one = (pattern: Pattern): { pattern: Pattern; guard?: Expr } =>
      a.guard ? { pattern, guard: a.guard } : { pattern };
    return a.pattern.kind === "por" ? a.pattern.alts.map(one) : [one(a.pattern)];
  });
  const ctorArms = leaves.filter((a) => a.pattern.kind === "pctor");

  // No constructor arms → literal/wildcard/bool switch. A catch-all makes it
  // total; so does covering both boolean cases (bool is a closed two-case type).
  if (ctorArms.length === 0) {
    if (hasCatchAll) return null;
    const bools = new Set(
      leaves.flatMap((a) => (a.pattern.kind === "pbool" && !a.guard ? [a.pattern.value] : [])),
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

// JavaScript reserved words. An alang lowercase identifier in a BINDING
// position (let/extern name, lambda/letin/letbind param, pattern bind, labelled
// ctor field) lowers to a JS binding of that same name — `const else = …`,
// `(else) => …`, `{ _tag, else }` — which is a SyntaxError. alang keeps its
// emitted JS pristine (no mangling — ADR 0020), so reject at check time with a
// rename hint. Object KEYS and member names (`{ default: 1 }`, `r.default`) are
// legal JS and are NOT binding positions, so they stay allowed.
const JS_RESERVED = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "null",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "let",
  "static",
  "implements",
  "interface",
  "package",
  "private",
  "protected",
  "public",
  "await",
]);

const reservedBind = (name: string, span: Span): AlangError | null =>
  JS_RESERVED.has(name)
    ? checkErr(
        `'${name}' is a JavaScript reserved word and can't be used as a binding name; rename it`,
        span,
      )
    : null;

const firstErr = (es: readonly (AlangError | null)[]): AlangError | null =>
  es.reduce<AlangError | null>((f, e) => f ?? e, null);

// A lambda/letbind parameter binds one or more names; none of its forms carry a
// per-name span, so offences anchor to the parameter's enclosing span.
const checkParamBinds = (p: LamParam, span: Span): AlangError | null => {
  switch (p.kind) {
    case "name":
      return reservedBind(p.name, span);
    case "precord":
      return firstErr(p.fields.map((n) => reservedBind(n, span)));
    case "ptuple":
      return firstErr(p.names.map((n) => reservedBind(n, span)));
  }
};

const checkPatBinds = (p: Pattern): AlangError | null => {
  switch (p.kind) {
    case "pbind":
      return reservedBind(p.name, p.span);
    case "ptuple":
      return firstErr(p.elems.map(checkPatBinds));
    case "precord":
      return firstErr(p.fields.map((f) => checkPatBinds(f.pat)));
    case "pctor":
      return firstErr(p.args.map(checkPatBinds));
    case "parr":
    case "plist":
      return firstErr([...p.elems, ...(p.rest ? [p.rest] : [])].map(checkPatBinds));
    case "por":
      return firstErr(p.alts.map(checkPatBinds));
    case "pwild":
    case "plit":
    case "pbool":
    case "pstr":
      return null;
  }
};

const checkExprBinds = (e: Expr): AlangError | null => {
  switch (e.kind) {
    case "num":
    case "bool":
    case "str":
    case "ref":
      return null;
    case "call":
      return checkExprBinds(e.fn) ?? firstErr(e.args.map(checkExprBinds));
    case "lambda":
      return firstErr(e.params.map((p) => checkParamBinds(p, e.span))) ?? checkExprBinds(e.body);
    case "letin":
      return reservedBind(e.name, e.nameSpan) ?? checkExprBinds(e.value) ?? checkExprBinds(e.body);
    case "letbind":
      return (
        checkParamBinds(e.param, e.paramSpan) ?? checkExprBinds(e.value) ?? checkExprBinds(e.body)
      );
    case "pipe":
      return checkExprBinds(e.left) ?? checkExprBinds(e.right);
    case "ternary":
      return checkExprBinds(e.cond) ?? checkExprBinds(e.then) ?? checkExprBinds(e.else);
    case "match":
      return (
        checkExprBinds(e.scrutinee) ??
        firstErr(
          e.arms.map(
            (a) =>
              checkPatBinds(a.pattern) ??
              (a.guard ? checkExprBinds(a.guard) : null) ??
              checkExprBinds(a.body),
          ),
        )
      );
    case "record":
      return (
        (e.spread ? checkExprBinds(e.spread) : null) ??
        firstErr(e.fields.map((f) => checkExprBinds(f.value)))
      );
    case "field":
      return checkExprBinds(e.target);
    case "tuple":
    case "arr":
    case "list":
      return firstErr(e.elements.map(checkExprBinds));
    case "map":
      return firstErr(e.entries.map((en) => checkExprBinds(en.key) ?? checkExprBinds(en.value)));
  }
};

const checkReservedWords = (prog: Program): AlangError | null => {
  for (const s of prog.stmts) {
    if (s.kind === "let") {
      const e = reservedBind(s.name, s.nameSpan) ?? checkExprBinds(s.value);
      if (e) return e;
    } else if (s.kind === "extern") {
      const e = reservedBind(s.name, s.nameSpan);
      if (e) return e;
    } else if (s.kind === "type") {
      // Type/ctor names are Uppercase (never reserved); a labelled ctor field,
      // however, lowers to a binding in the factory and destructure.
      for (const c of s.ctors)
        for (const f of c.fields)
          if (f.name) {
            const e = reservedBind(f.name, f.type.span);
            if (e) return e;
          }
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
  const reservedWord = checkReservedWords(prog);
  if (reservedWord) return err(reservedWord);
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
