/**
 * Semantic pass — exhaustiveness + constructor checks.
 * Builds a variant registry from `type` decls, then verifies every `switch`.
 */
import { match } from "@onrails/pattern";
import { err, isErr, ok, type Result } from "@onrails/result";
import type { CtorPat, Expr, LamParam, MatchExpr, OrPat, Pattern, Program, TypeExpr } from "./ast";
import { buildCtorTable, type CtorTable, PRIM_TYPE_NAMES } from "./ctors";
import { checkErr, concatDiags, type Diagnostic } from "./errors";
import { builtinTypeDecls, preludeNamespaces } from "./prelude";
import type { Span } from "./span";

/** Variant registry shared with infer and codegen — arity cannot drift between passes. */
export type Registry = CtorTable;

/** Walk an expression tree, invoking `visit` on every `match` node. */
function forEachMatch(e: Expr, visit: (m: MatchExpr) => void): void {
  match(e)
    .withOneOf([{ kind: "num" }, { kind: "bool" }, { kind: "str" }, { kind: "ref" }], () => {})
    .with({ kind: "interp" }, (interp) => {
      for (const p of interp.parts) if (typeof p !== "string") forEachMatch(p, visit);
    })
    .with({ kind: "call" }, (call) => {
      forEachMatch(call.fn, visit);
      for (const a of call.args) forEachMatch(a, visit);
    })
    .with({ kind: "lambda" }, (lambda) => {
      forEachMatch(lambda.body, visit);
    })
    .withOneOf([{ kind: "letin" }, { kind: "letbind" }], (bind) => {
      forEachMatch(bind.value, visit);
      forEachMatch(bind.body, visit);
    })
    .with({ kind: "pipe" }, (pipe) => {
      forEachMatch(pipe.left, visit);
      forEachMatch(pipe.right, visit);
    })
    .with({ kind: "ternary" }, (ternary) => {
      forEachMatch(ternary.cond, visit);
      forEachMatch(ternary.then, visit);
      forEachMatch(ternary.else, visit);
    })
    .with({ kind: "match" }, (matchExpr) => {
      forEachMatch(matchExpr.scrutinee, visit);
      for (const a of matchExpr.arms) {
        if (a.guard) forEachMatch(a.guard, visit);
        forEachMatch(a.body, visit);
      }
      visit(matchExpr);
    })
    .with({ kind: "record" }, (record) => {
      if (record.spread) forEachMatch(record.spread, visit);
      for (const f of record.fields) forEachMatch(f.value, visit);
    })
    .with({ kind: "field" }, (field) => {
      forEachMatch(field.target, visit);
    })
    .with({ kind: "tuple" }, (tuple) => {
      for (const el of tuple.elements) forEachMatch(el, visit);
    })
    .withOneOf([{ kind: "arr" }, { kind: "list" }, { kind: "set" }], (seq) => {
      for (const el of seq.elements) forEachMatch(el.expr, visit);
    })
    .with({ kind: "map" }, (mapExpr) => {
      for (const ent of mapExpr.entries) {
        forEachMatch(ent.key, visit);
        forEachMatch(ent.value, visit);
      }
    })
    .exhaustive();
}

/**
 * A pattern is a catch-all when it always matches. A record pattern does so
 * only when every field just binds (no literal field narrows the match).
 */
const isCatchAll = (p: Pattern): boolean =>
  p.kind === "pwild" ||
  p.kind === "pbind" ||
  (p.kind === "precord" && p.fields.every((f) => isCatchAll(f.pat))) ||
  // A tuple always matches when every position does (irrefutable product).
  (p.kind === "ptuple" && p.elems.every(isCatchAll)) ||
  // `[...all]` / `@{...all}` — a bare rest with no fixed head matches any list.
  ((p.kind === "parr" || p.kind === "plist") && p.elems.length === 0 && p.rest !== null);

/**
 * Eager Array (`parr`) and lazy List (`plist`) patterns share one exhaustiveness
 * rule: a switch can't be proven total in general, but the canonical ML form —
 * an empty `[]`/`@{}` arm plus a single-head cons `[x, ...xs]`/`@{x, ...xs}` —
 * covers length 0 and length ≥ 1, so it's total. Fixed-length arms (`@{a, b}`)
 * and extra arms are allowed but don't themselves prove totality (need the pair
 * above or a `_`). Returns null (exhaustive), an error (a list switch that
 * isn't), or undefined (not a list switch → let the caller decide).
 */
function checkSeqExhaustive(m: MatchExpr): Diagnostic | null | undefined {
  const seqs = m.arms.flatMap((a) =>
    // Guarded arms don't prove totality (the guard can be false).
    (a.pattern.kind === "parr" || a.pattern.kind === "plist") && !a.guard ? [a.pattern] : [],
  );
  if (seqs.length === 0) return undefined;
  const hasEmpty = seqs.some((p) => p.elems.length === 0 && p.rest === null);
  const hasCons = seqs.some((p) => p.elems.length === 1 && p.rest !== null);
  return hasEmpty && hasCons
    ? null
    : checkErr("non-exhaustive list switch: cover `[]` and `[x, ...xs]` (or add `_`)", m.span);
}

/**
 * Validate a pattern tree: nested constructors must exist with the right
 * arity (top-level ctor arms are re-validated by checkMatch, which also needs
 * the registry info for exhaustiveness), and a lazy-List pattern cannot nest
 * inside another pattern — matching it pulls from the generator, an effect the
 * emitted guard form must not hide mid-predicate. Top-level `plist` arms are
 * fine (genListMatch owns the pulling discipline).
 */
const checkPattern = (p: Pattern, reg: Registry, top: boolean): Diagnostic | null =>
  match(p)
    .with({ kind: "pctor" }, (pctor) => {
      const info = reg.ctor.get(pctor.ctor);
      if (!info) return checkErr(`unknown constructor '${pctor.ctor}'`, pctor.span);
      if (pctor.args.length !== info.arity)
        return checkErr(
          `constructor '${pctor.ctor}' expects ${info.arity} arg(s), got ${pctor.args.length}`,
          pctor.span,
        );
      for (const a of pctor.args) {
        const e = checkPattern(a, reg, false);
        if (e) return e;
      }
      return null;
    })
    .with({ kind: "precord" }, (precord) => {
      for (const f of precord.fields) {
        const e = checkPattern(f.pat, reg, false);
        if (e) return e;
      }
      return null;
    })
    .with({ kind: "ptuple" }, (ptuple) => {
      for (const el of ptuple.elems) {
        const e = checkPattern(el, reg, false);
        if (e) return e;
      }
      return null;
    })
    .with({ kind: "parr" }, (parr) => {
      for (const el of parr.elems) {
        const e = checkPattern(el, reg, false);
        if (e) return e;
      }
      return parr.rest ? checkPattern(parr.rest, reg, false) : null;
    })
    .with({ kind: "plist" }, (plist) => {
      if (!top)
        return checkErr(
          "lazy-List pattern cannot nest inside another pattern (matching pulls from the sequence)",
          plist.span,
        );
      for (const el of plist.elems) {
        const e = checkPattern(el, reg, false);
        if (e) return e;
      }
      return plist.rest ? checkPattern(plist.rest, reg, false) : null;
    })
    .with({ kind: "por" }, (por) => checkOrPattern(por, reg))
    .withOneOf(
      [{ kind: "pwild" }, { kind: "plit" }, { kind: "pbool" }, { kind: "pstr" }, { kind: "pbind" }],
      () => null,
    )
    .exhaustive();

const firstErr = (es: readonly (Diagnostic | null)[]): Diagnostic | null =>
  es.reduce<Diagnostic | null>((f, e) => f ?? e, null);

/**
 * Map each name a pattern binds to a private structural path. The scheme need
 * only be internally consistent — it exists to compare or-pattern alternatives.
 * A name bound twice in one pattern is an error.
 */
const binderPaths = (p: Pattern, at: string, acc: Map<string, string>): Diagnostic | null =>
  match(p)
    .with({ kind: "pbind" }, (pbind) => {
      if (acc.has(pbind.name))
        return checkErr(`pattern binds '${pbind.name}' more than once`, pbind.span);
      acc.set(pbind.name, at);
      return null;
    })
    .with({ kind: "pctor" }, (pctor) =>
      firstErr(pctor.args.map((a, i) => binderPaths(a, `${at}.a${i}`, acc))),
    )
    .with({ kind: "precord" }, (precord) =>
      firstErr(precord.fields.map((f) => binderPaths(f.pat, `${at}.${f.label}`, acc))),
    )
    .with({ kind: "ptuple" }, (ptuple) =>
      firstErr(ptuple.elems.map((e, i) => binderPaths(e, `${at}.t${i}`, acc))),
    )
    .withOneOf(
      [
        { kind: "pwild" },
        { kind: "plit" },
        { kind: "pbool" },
        { kind: "pstr" },
        { kind: "parr" },
        { kind: "plist" },
        { kind: "por" },
      ],
      () => null, // pwild/plit/pbool/pstr bind nothing; parr/plist/por barred as alts
    )
    .exhaustive();

/**
 * An or-pattern (`A | B | …`): each alternative must narrow (not a catch-all),
 * must not be an eager/lazy sequence (those need genListMatch/length logic the
 * guard form can't host as an alt), and all alts must bind the same names at the
 * same structural position — so the arm's single destructure serves every alt.
 */
function checkOrPattern(p: OrPat, reg: Registry): Diagnostic | null {
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
}

/**
 * A constructor arm covers its constructor only when every argument is
 * irrefutable (a bind/wildcard or an all-binding record/tuple). A narrowing
 * arm — `Sm(Sm(n))`, `Sm(0)` — matches a strict subset, so it must not count
 * toward exhaustiveness.
 */
const coversCtor = (p: CtorPat): boolean => p.args.every(isCatchAll);

function checkMatch(m: MatchExpr, reg: Registry): Diagnostic | null {
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
    return listErr !== undefined
      ? listErr
      : checkErr("non-exhaustive switch: add a `_` catch-all arm", m.span);
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

/**
 * Collection namespaces are built-in; binding one as a value/type/import would
 * shadow `List.map` and desync codegen (which resolves them by name), so forbid it.
 * Exception: `Option`/`Result` are ALSO builtin variant types whose contract is
 * "user redeclarations win" — a `type` statement of those names stays legal
 * (the combinators assume the builtin runtime shape; a same-shape redecl is
 * the only sensible one and predates the namespaces).
 */
const RESERVED_NAMES = new Set(Object.keys(preludeNamespaces));
const REDECLARABLE_TYPES = new Set(builtinTypeDecls.map((d) => d.name));

function checkReservedNames(prog: Program): Diagnostic[] {
  const diags: Diagnostic[] = [];
  for (const s of prog.stmts) {
    if (s.kind === "type" && REDECLARABLE_TYPES.has(s.name)) continue;
    if (
      (s.kind === "let" || s.kind === "type" || s.kind === "extern") &&
      RESERVED_NAMES.has(s.name)
    )
      diags.push(
        checkErr(`'${s.name}' is a reserved collection namespace and cannot be bound`, s.span),
      );
    if (s.kind === "import") {
      if (s.alias && RESERVED_NAMES.has(s.alias.name))
        diags.push(
          checkErr(
            `'${s.alias.name}' is a reserved collection namespace and cannot be imported`,
            s.alias.span,
          ),
        );
      for (const n of s.names)
        if (RESERVED_NAMES.has(n.name))
          diags.push(
            checkErr(
              `'${n.name}' is a reserved collection namespace and cannot be imported`,
              n.span,
            ),
          );
    }
  }
  return diags;
}

/**
 * Ctor field types are full type expressions (ADR 0015). A lowercase leaf name
 * is a type variable and must be one of the declaration's parameters — a stray
 * var would be existential (matching couldn't recover its type). Prim names
 * (number/string/bool/..., `PRIM_TYPE_NAMES` from ctors.ts) are fine.
 */
const strayTypeVar = (te: TypeExpr, params: ReadonlySet<string>): TypeExpr | null =>
  match(te)
    .with({ kind: "tname" }, (tname) =>
      /^[A-Z]/.test(tname.name) || PRIM_TYPE_NAMES.has(tname.name) || params.has(tname.name)
        ? null
        : tname,
    )
    .with(
      { kind: "tarrow" },
      (tarrow) => strayTypeVar(tarrow.from, params) ?? strayTypeVar(tarrow.to, params),
    )
    .with({ kind: "tapp" }, (tapp) =>
      tapp.args.reduce<TypeExpr | null>((f, a) => f ?? strayTypeVar(a, params), null),
    )
    .with({ kind: "ttuple" }, (ttuple) =>
      ttuple.elems.reduce<TypeExpr | null>((f, e) => f ?? strayTypeVar(e, params), null),
    )
    .with({ kind: "tlist" }, (tlist) => strayTypeVar(tlist.elem, params))
    .exhaustive();

function checkCtorFieldVars(prog: Program): Diagnostic[] {
  const diags: Diagnostic[] = [];
  for (const s of prog.stmts) {
    if (s.kind !== "type") continue;
    const params = new Set(s.params);
    for (const c of s.ctors)
      for (const f of c.fields) {
        const stray = strayTypeVar(f.type, params);
        if (stray && stray.kind === "tname")
          diags.push(
            checkErr(
              `unknown type parameter '${stray.name}' in constructor '${c.name}' — declare it: type ${s.name} ${[...s.params, stray.name].join(" ")} = ...`,
              stray.span,
            ),
          );
      }
  }
  return diags;
}

/**
 * JavaScript reserved words. An mochi lowercase identifier in a BINDING
 * position (let/extern name, lambda/letin/letbind param, pattern bind, labelled
 * ctor field) lowers to a JS binding of that same name — `const else = …`,
 * `(else) => …`, `{ _tag, else }` — which is a SyntaxError. mochi keeps its
 * emitted JS pristine (no mangling — ADR 0020), so reject at check time with a
 * rename hint. Object KEYS and member names (`{ default: 1 }`, `r.default`) are
 * legal JS and are NOT binding positions, so they stay allowed.
 */
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

const reservedBind = (name: string, span: Span): Diagnostic | null =>
  JS_RESERVED.has(name)
    ? checkErr(
        `'${name}' is a JavaScript reserved word and can't be used as a binding name; rename it`,
        span,
      )
    : null;

const many = (...parts: readonly (Diagnostic | Diagnostic[] | null)[]): Diagnostic[] =>
  concatDiags(...parts);

/** A lambda/letbind parameter binds one or more names; anchor offences to the param span. */
const checkParamBinds = (p: LamParam, span: Span): Diagnostic[] =>
  match(p)
    .with({ kind: "name" }, (name) => many(reservedBind(name.name, span)))
    .with({ kind: "precord" }, (precord) =>
      many(...precord.fields.map((n) => reservedBind(n, span))),
    )
    .with({ kind: "ptuple" }, (ptuple) => many(...ptuple.names.map((n) => reservedBind(n, span))))
    .exhaustive();

const checkPatBinds = (p: Pattern): Diagnostic[] =>
  match(p)
    .with({ kind: "pbind" }, (pbind) => many(reservedBind(pbind.name, pbind.span)))
    .with({ kind: "ptuple" }, (ptuple) => many(...ptuple.elems.map(checkPatBinds)))
    .with({ kind: "precord" }, (precord) =>
      many(...precord.fields.map((f) => checkPatBinds(f.pat))),
    )
    .with({ kind: "pctor" }, (pctor) => many(...pctor.args.map(checkPatBinds)))
    .with({ kind: "parr" }, (parr) =>
      many(...[...parr.elems, ...(parr.rest ? [parr.rest] : [])].map(checkPatBinds)),
    )
    .with({ kind: "plist" }, (plist) =>
      many(...[...plist.elems, ...(plist.rest ? [plist.rest] : [])].map(checkPatBinds)),
    )
    .with({ kind: "por" }, (por) => many(...por.alts.map(checkPatBinds)))
    .withOneOf([{ kind: "pwild" }, { kind: "plit" }, { kind: "pbool" }, { kind: "pstr" }], () => [])
    .exhaustive();

const checkExprBinds = (e: Expr): Diagnostic[] =>
  match(e)
    .withOneOf([{ kind: "num" }, { kind: "bool" }, { kind: "str" }, { kind: "ref" }], () => [])
    .with({ kind: "interp" }, (interp) =>
      many(...interp.parts.filter((p): p is Expr => typeof p !== "string").map(checkExprBinds)),
    )
    .with({ kind: "call" }, (call) =>
      many(checkExprBinds(call.fn), ...call.args.map(checkExprBinds)),
    )
    .with({ kind: "lambda" }, (lambda) =>
      many(
        ...lambda.params.map((p) => checkParamBinds(p, lambda.span)),
        checkExprBinds(lambda.body),
      ),
    )
    .with({ kind: "letin" }, (letin) =>
      many(
        reservedBind(letin.name, letin.nameSpan),
        checkExprBinds(letin.value),
        checkExprBinds(letin.body),
      ),
    )
    .with({ kind: "letbind" }, (letbind) =>
      many(
        checkParamBinds(letbind.param, letbind.paramSpan),
        checkExprBinds(letbind.value),
        checkExprBinds(letbind.body),
      ),
    )
    .with({ kind: "pipe" }, (pipe) => many(checkExprBinds(pipe.left), checkExprBinds(pipe.right)))
    .with({ kind: "ternary" }, (ternary) =>
      many(
        checkExprBinds(ternary.cond),
        checkExprBinds(ternary.then),
        checkExprBinds(ternary.else),
      ),
    )
    .with({ kind: "match" }, (matchExpr) =>
      many(
        checkExprBinds(matchExpr.scrutinee),
        ...matchExpr.arms.map((a) =>
          many(
            checkPatBinds(a.pattern),
            a.guard ? checkExprBinds(a.guard) : null,
            checkExprBinds(a.body),
          ),
        ),
      ),
    )
    .with({ kind: "record" }, (record) =>
      many(
        record.spread ? checkExprBinds(record.spread) : null,
        ...record.fields.map((f) => checkExprBinds(f.value)),
      ),
    )
    .with({ kind: "field" }, (field) => checkExprBinds(field.target))
    .with({ kind: "tuple" }, (tuple) => many(...tuple.elements.map(checkExprBinds)))
    .withOneOf([{ kind: "arr" }, { kind: "list" }, { kind: "set" }], (seq) =>
      many(...seq.elements.map((el) => checkExprBinds(el.expr))),
    )
    .with({ kind: "map" }, (mapExpr) =>
      many(...mapExpr.entries.map((en) => many(checkExprBinds(en.key), checkExprBinds(en.value)))),
    )
    .exhaustive();

function checkReservedWords(prog: Program): Diagnostic[] {
  const diags: Diagnostic[] = [];
  for (const s of prog.stmts) {
    if (s.kind === "let") {
      diags.push(...many(reservedBind(s.name, s.nameSpan), checkExprBinds(s.value)));
    } else if (s.kind === "extern") {
      diags.push(...many(reservedBind(s.name, s.nameSpan)));
    } else if (s.kind === "type") {
      // Type/ctor names are Uppercase (never reserved); a labelled ctor field,
      // however, lowers to a binding in the factory and destructure.
      for (const c of s.ctors)
        for (const f of c.fields)
          if (f.name) diags.push(...many(reservedBind(f.name, f.type.span)));
    }
  }
  return diags;
}

/**
 * `imported` carries the ctor/type registries of the modules this program
 * imports from; merged UNDER the local registry (local declarations win) so
 * exhaustiveness works across the module boundary.
 */
export function check(prog: Program, imported?: Registry): Result<Program, Diagnostic[]> {
  const diags: Diagnostic[] = [
    ...checkReservedNames(prog),
    ...checkReservedWords(prog),
    ...checkCtorFieldVars(prog),
  ];
  const built = buildCtorTable(prog);
  if (isErr(built)) return err([...diags, ...built.error]);
  const reg = built.value;
  if (imported) {
    for (const [k, v] of imported.type) if (!reg.type.has(k)) reg.type.set(k, v);
    for (const [k, v] of imported.ctor) if (!reg.ctor.has(k)) reg.ctor.set(k, v);
  }

  for (const s of prog.stmts) {
    if (s.kind !== "let") continue;
    forEachMatch(s.value, (m) => {
      const e = checkMatch(m, reg);
      if (e) diags.push(e);
    });
  }
  return diags.length > 0 ? err(diags) : ok(prog);
}
