/**
 * Semantic pass — exhaustiveness + constructor checks.
 * Builds a variant registry from `type` decls, then verifies every `switch`.
 */
import { match } from "@onrails/pattern";
import { err, isErr, ok, type Result } from "@onrails/result";
import type {
  CtorPat,
  Expr,
  LamParam,
  MatchExpr,
  OrPat,
  Pattern,
  Program,
  QualTypeExpr,
  TypeExpr,
} from "../ast/ast";
import { buildCtorTable, type CtorTable, PRIM_TYPE_NAMES } from "../ast/ctors";
import type { Span } from "../ast/span";
import { checkErr, concatDiags, type Diagnostic } from "../errors/errors";
import type { QualMap } from "../infer/schemes";
import { builtinTypeDecls, preludeNamespaces } from "../prelude/prelude";
import { checkExhaustive, isWideWitness, showWitness } from "./usefulness";

/** Variant registry shared with infer and codegen — arity cannot drift between passes. */
export type Registry = CtorTable;

/** Named import → `Circle`; `import * as S` → `S.Circle` (ADR 0082). */
const patCtorKey = (p: CtorPat): string => (p.ns ? `${p.ns}.${p.ctor}` : p.ctor);

/** Walk an expression tree, invoking `visit` on every node, children before parent. */
function forEachSubExpr(e: Expr, visit: (x: Expr) => void): void {
  match(e)
    .withOneOf(
      [{ kind: "num" }, { kind: "bool" }, { kind: "str" }, { kind: "ref" }, { kind: "unit" }],
      () => {},
    )
    .with({ kind: "interp" }, (interp) => {
      for (const p of interp.parts) if (typeof p !== "string") forEachSubExpr(p, visit);
    })
    .with({ kind: "call" }, (call) => {
      forEachSubExpr(call.fn, visit);
      for (const a of call.args) forEachSubExpr(a, visit);
    })
    .with({ kind: "lambda" }, (lambda) => {
      forEachSubExpr(lambda.body, visit);
    })
    .withOneOf([{ kind: "letin" }, { kind: "letbind" }], (bind) => {
      forEachSubExpr(bind.value, visit);
      forEachSubExpr(bind.body, visit);
    })
    .with({ kind: "pipe" }, (pipe) => {
      forEachSubExpr(pipe.left, visit);
      forEachSubExpr(pipe.right, visit);
    })
    .with({ kind: "do" }, (block) => {
      for (const expr of block.exprs) forEachSubExpr(expr, visit);
    })
    .with({ kind: "ternary" }, (ternary) => {
      forEachSubExpr(ternary.cond, visit);
      forEachSubExpr(ternary.then, visit);
      forEachSubExpr(ternary.else, visit);
    })
    .with({ kind: "match" }, (matchExpr) => {
      forEachSubExpr(matchExpr.scrutinee, visit);
      for (const a of matchExpr.arms) {
        if (a.guard) forEachSubExpr(a.guard, visit);
        forEachSubExpr(a.body, visit);
      }
    })
    .with({ kind: "record" }, (record) => {
      if (record.spread) forEachSubExpr(record.spread, visit);
      for (const f of record.fields) forEachSubExpr(f.value, visit);
    })
    .with({ kind: "field" }, (field) => {
      forEachSubExpr(field.target, visit);
    })
    .with({ kind: "loop" }, (loop) => {
      for (const p of loop.params) forEachSubExpr(p.init, visit);
      forEachSubExpr(loop.body, visit);
    })
    .with({ kind: "recur" }, (recur) => {
      for (const a of recur.args) forEachSubExpr(a, visit);
    })
    .with({ kind: "tuple" }, (tuple) => {
      for (const el of tuple.elements) forEachSubExpr(el, visit);
    })
    .withOneOf([{ kind: "arr" }, { kind: "list" }, { kind: "set" }], (seq) => {
      for (const el of seq.elements) forEachSubExpr(el.expr, visit);
    })
    .with({ kind: "map" }, (mapExpr) => {
      for (const ent of mapExpr.entries) {
        forEachSubExpr(ent.key, visit);
        forEachSubExpr(ent.value, visit);
      }
    })
    .exhaustive();
  visit(e);
}

/** Walk an expression tree, invoking `visit` on every `match` node. */
const forEachMatch = (e: Expr, visit: (m: MatchExpr) => void): void =>
  forEachSubExpr(e, (x) => {
    if (x.kind === "match") visit(x);
  });

/**
 * A pattern is a catch-all when it always matches. A record pattern does so
 * only when every field just binds (no literal field narrows the match).
 */
const isCatchAll = (p: Pattern): boolean =>
  p.kind === "pwild" ||
  p.kind === "pbind" ||
  (p.kind === "pas" && isCatchAll(p.pat)) ||
  // `()` is irrefutable: `unit` has exactly one inhabitant, so the type decides (ADR 0054).
  p.kind === "punit" ||
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
    .with({ kind: "pas" }, (pas) => checkPattern(pas.pat, reg, top))
    .with({ kind: "pctor" }, (pctor) => {
      const key = patCtorKey(pctor);
      const info = reg.ctor.get(key);
      if (!info) return checkErr(`unknown constructor '${key}'`, pctor.span);
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
      [
        { kind: "pwild" },
        { kind: "punit" },
        { kind: "plit" },
        { kind: "pbool" },
        { kind: "pstr" },
        { kind: "pbind" },
      ],
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
    .with({ kind: "pas" }, (pas) => {
      const e = binderPaths(pas.pat, at, acc);
      if (e) return e;
      if (acc.has(pas.name))
        return checkErr(`pattern binds '${pas.name}' more than once`, pas.nameSpan);
      acc.set(pas.name, at);
      return null;
    })
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
        { kind: "punit" },
        { kind: "plit" },
        { kind: "pbool" },
        { kind: "pstr" },
        { kind: "parr" },
        { kind: "plist" },
        { kind: "por" },
      ],
      () => null, // pwild/punit/plit/pbool/pstr bind nothing; parr/plist/por barred as alts
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
  // Lazy Lists keep their own depth-1 rule: matching one pulls from its
  // generator, so it cannot be reasoned about positionally and the matrix
  // treats the column as opaque. Route those switches before the matrix runs.
  if (m.arms.some((a) => a.pattern.kind === "plist")) {
    // An unguarded catch-all settles it without consulting the list rule —
    // `@{...all}` binds the whole sequence and matches every value.
    if (m.arms.some((a) => isCatchAll(a.pattern) && !a.guard)) return null;
    const seqErr = checkSeqExhaustive(m);
    if (seqErr !== undefined) return seqErr;
  }
  // An or-pattern arm contributes each alternative to coverage, sharing the
  // arm's guard — `| Red | Green => …` covers both, `| true | false => …` is
  // total. Flatten to leaves so the ctor validation below sees each one.
  const leaves = m.arms.flatMap((a) => {
    const one = (pattern: Pattern): { pattern: Pattern; guard?: Expr } =>
      a.guard ? { pattern, guard: a.guard } : { pattern };
    return a.pattern.kind === "por" ? a.pattern.alts.map(one) : [one(a.pattern)];
  });
  const ctorArms = leaves.flatMap((a) => (a.pattern.kind === "pctor" ? [a.pattern] : []));
  // Only *unguarded* ctor arms name a constructor for reporting purposes: a
  // guarded arm proves nothing, so `Some(x) when …` must still read as
  // "missing Some" rather than falling through to a witness.
  const namedUnguarded = new Set(
    leaves.flatMap((a) => (a.pattern.kind === "pctor" && !a.guard ? [a.pattern.ctor] : [])),
  );

  // Validate each constructor pattern: known + right arity + one owning type.
  let owningType: string | null = null;
  for (const p of ctorArms) {
    const key = patCtorKey(p);
    const info = reg.ctor.get(key);
    if (!info) return checkErr(`unknown constructor '${key}'`, p.span);
    if (p.args.length !== info.arity)
      return checkErr(
        `constructor '${p.ctor}' expects ${info.arity} arg(s), got ${p.args.length}`,
        p.span,
      );
    if (owningType === null) owningType = info.type;
    else if (owningType !== info.type)
      return checkErr(`switch mixes variants of '${owningType}' and '${info.type}'`, p.span);
  }

  // Exhaustiveness proper (ADR 0066). A guarded arm proves nothing — the guard
  // can be false — so only unguarded patterns enter the matrix.
  const verdict = checkExhaustive(
    m.arms.flatMap((a) => (a.guard ? [] : [a.pattern])),
    reg,
  );
  if (verdict.ok) return null;
  if ("exhausted" in verdict)
    return checkErr("switch too complex to prove exhaustive — add a `_` catch-all arm", m.span);

  // A witness that is one constructor over nothing but wildcards is the shape
  // the pre-matrix checker reported as `missing X`. Keep that wording for it:
  // the everyday "you forgot a variant" case reads as it always has, and only a
  // genuinely nested gap pays for the longer witness form.
  const witness = verdict.witness;
  if (isWideWitness(witness) && owningType !== null) {
    const absent = (reg.type.get(owningType) ?? []).filter((c) => !namedUnguarded.has(c));
    if (absent.length > 0)
      return checkErr(
        `non-exhaustive switch on '${owningType}': missing ${absent.join(", ")}`,
        m.span,
      );
  }
  return checkErr(`non-exhaustive switch: '${showWitness(witness)}' is not matched`, m.span);
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
  // ADR 0045 decision 4 (no-cascade): the checks below narrow on specific `s.kind`s
  // (let/type/extern/import), so an `error` stmt is skipped intentionally — it never
  // matches any branch, contributes no diagnostic, and suppresses no other one.
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
    // `Alias.Name` is always a constructor reference, never a bare type variable
    // (that's what motivates the single `tqual` variant, ADR 0046) — only its
    // applied args can hide a stray var.
    .with({ kind: "tqual" }, (tqual) =>
      tqual.args.reduce<TypeExpr | null>((f, a) => f ?? strayTypeVar(a, params), null),
    )
    .with({ kind: "tlit" }, () => null)
    .with({ kind: "tunion" }, (tunion) =>
      tunion.members.reduce<TypeExpr | null>((f, m) => f ?? strayTypeVar(m, params), null),
    )
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

/** Every `tqual` node reachable from a written type expression, in source order. */
const qualRefs = (te: TypeExpr, out: QualTypeExpr[]): void =>
  match(te)
    .with({ kind: "tname" }, () => {})
    .with({ kind: "tarrow" }, (tarrow) => {
      qualRefs(tarrow.from, out);
      qualRefs(tarrow.to, out);
    })
    .with({ kind: "tapp" }, (tapp) => {
      for (const a of tapp.args) qualRefs(a, out);
    })
    .with({ kind: "ttuple" }, (ttuple) => {
      for (const el of ttuple.elems) qualRefs(el, out);
    })
    .with({ kind: "tlist" }, (tlist) => {
      qualRefs(tlist.elem, out);
    })
    .with({ kind: "tqual" }, (tqual) => {
      out.push(tqual);
      for (const a of tqual.args) qualRefs(a, out);
    })
    .with({ kind: "tlit" }, () => {})
    .with({ kind: "tunion" }, (tunion) => {
      for (const m of tunion.members) qualRefs(m, out);
    })
    .exhaustive();

/**
 * Every type expression a program WRITES — the positions `typeExprToType` lowers:
 * extern signatures, binding annotations (top-level and `let … in`, ADR 0044),
 * constructor field types, and transparent record-alias field types.
 */
const writtenTypeExprs = (prog: Program): TypeExpr[] => {
  const out: TypeExpr[] = [];
  for (const s of prog.stmts) {
    switch (s.kind) {
      case "extern":
        out.push(s.typeExpr);
        break;
      case "let":
        if (s.annot) out.push(s.annot);
        forEachSubExpr(s.value, (x) => {
          if (x.kind === "letin" && x.annot) out.push(x.annot);
        });
        break;
      case "type":
        for (const c of s.ctors) for (const fld of c.fields) out.push(fld.type);
        for (const fld of s.alias ?? []) out.push(fld.type);
        if (s.aliasType) out.push(s.aliasType);
        break;
    }
  }
  return out;
};

/**
 * `Alias.T` resolves through the import graph (C5 slice b): the alias must be a
 * namespace import of THIS module, and the dep must EXPORT a type of that name.
 * `quals` is the alias → dep-type-scope map the module driver threads in; when a
 * declared alias is absent from it the module wasn't compiled through a graph
 * (plain single-file `check`), so stay silent rather than accuse the user.
 */
const checkQualifiedTypeNames = (prog: Program, quals?: QualMap): Diagnostic[] => {
  const nsAliases = new Set(
    prog.stmts.flatMap((s) => (s.kind === "import" && s.alias ? [s.alias.name] : [])),
  );
  const refs: QualTypeExpr[] = [];
  for (const te of writtenTypeExprs(prog)) qualRefs(te, refs);
  return refs.flatMap((q) => {
    if (!nsAliases.has(q.alias))
      return [
        checkErr(
          `unknown module alias '${q.alias}' in type '${q.alias}.${q.name}' — a qualified type name needs a matching 'import * as ${q.alias} from "…"'`,
          q.span,
        ),
      ];
    const dep = quals?.get(q.alias);
    if (!dep) return [];
    return dep.types.has(q.name)
      ? []
      : [
          checkErr(
            `module alias '${q.alias}' has no exported type '${q.name}' — export it from the imported module ('export type ${q.name} = …')`,
            q.nameSpan,
          ),
        ];
  });
};

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
    .with({ kind: "pas" }, (pas) =>
      many(checkPatBinds(pas.pat), reservedBind(pas.name, pas.nameSpan)),
    )
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
    .withOneOf(
      [{ kind: "pwild" }, { kind: "punit" }, { kind: "plit" }, { kind: "pbool" }, { kind: "pstr" }],
      () => [],
    )
    .exhaustive();

const checkExprBinds = (e: Expr): Diagnostic[] =>
  match(e)
    .withOneOf(
      [{ kind: "num" }, { kind: "bool" }, { kind: "str" }, { kind: "ref" }, { kind: "unit" }],
      () => [],
    )
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
    .with({ kind: "do" }, (block) => many(...block.exprs.map(checkExprBinds)))
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
    .with({ kind: "loop" }, (loop) =>
      many(
        ...loop.params.map((p) => reservedBind(p.name, p.nameSpan)),
        ...loop.params.map((p) => checkExprBinds(p.init)),
        checkExprBinds(loop.body),
      ),
    )
    .with({ kind: "recur" }, (recur) => many(...recur.args.map(checkExprBinds)))
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
/**
 * `loop`/`recur` validity (ADR 0056):
 * - `recur` only in TAIL position of the NEAREST enclosing `loop` — tails are
 *   the loop body itself, ternary branches, switch arm bodies, and letin
 *   bodies. Lambda and letbind bodies are hard boundaries (new call frames).
 * - `recur` arity must match the loop's param count.
 * - duplicate loop param names are rejected.
 * - a letin under a loop body may not shadow a loop param — codegen rebinds
 *   params in place (`[p, …] = […]; continue`), and a nested `const p` would
 *   capture the name.
 */
function checkLoops(prog: Program): Diagnostic[] {
  const diags: Diagnostic[] = [];
  type Frame = { arity: number; names: Set<string> } | null;
  type LoopExpr = Extract<Expr, { kind: "loop" }>;
  type RecurExpr = Extract<Expr, { kind: "recur" }>;

  const checkLoopHead = (e: LoopExpr, frame: Frame): Set<string> => {
    const seen = new Set<string>();
    for (const p of e.params) {
      if (seen.has(p.name)) {
        diags.push(checkErr(`duplicate loop param '${p.name}'`, p.nameSpan));
      }
      seen.add(p.name);
      walk(p.init, frame, false); // inits evaluate in the OUTER context
    }
    return seen;
  };

  const checkRecurSite = (e: RecurExpr, frame: Frame, tail: boolean): void => {
    if (!frame) {
      diags.push(checkErr("'recur' is only legal inside a loop body", e.span));
      return;
    }
    if (!tail) {
      diags.push(checkErr("'recur' must be in tail position of its enclosing loop", e.span));
    }
    if (e.args.length !== frame.arity) {
      diags.push(
        checkErr(
          `'recur' takes ${frame.arity} argument${frame.arity === 1 ? "" : "s"} (one per loop param), got ${e.args.length}`,
          e.span,
        ),
      );
    }
  };

  const walk = (e: Expr, frame: Frame, tail: boolean): void => {
    switch (e.kind) {
      case "loop":
        walk(e.body, { arity: e.params.length, names: checkLoopHead(e, frame) }, true);
        return;
      case "recur":
        checkRecurSite(e, frame, tail);
        for (const a of e.args) walk(a, frame, false);
        return;
      case "ternary":
        walk(e.cond, frame, false);
        walk(e.then, frame, tail);
        walk(e.else, frame, tail);
        return;
      case "match":
        walk(e.scrutinee, frame, false);
        for (const a of e.arms) {
          if (a.guard) walk(a.guard, frame, false);
          walk(a.body, frame, tail);
        }
        return;
      case "letin":
        if (frame?.names.has(e.name)) {
          diags.push(
            checkErr(
              `'${e.name}' shadows a loop param inside the loop body; rename it`,
              e.nameSpan,
            ),
          );
        }
        walk(e.value, frame, false);
        walk(e.body, frame, tail);
        return;
      case "letbind":
        walk(e.value, frame, false);
        walk(e.body, null, false);
        return;
      case "lambda":
        walk(e.body, null, false);
        return;
      case "interp":
        for (const p of e.parts) if (typeof p !== "string") walk(p, frame, false);
        return;
      case "call":
        walk(e.fn, frame, false);
        for (const a of e.args) walk(a, frame, false);
        return;
      case "pipe":
        walk(e.left, frame, false);
        walk(e.right, frame, false);
        return;
      case "record":
        if (e.spread) walk(e.spread, frame, false);
        for (const f of e.fields) walk(f.value, frame, false);
        return;
      case "field":
        walk(e.target, frame, false);
        return;
      case "tuple":
        for (const el of e.elements) walk(el, frame, false);
        return;
      case "arr":
      case "list":
      case "set":
        for (const el of e.elements) walk(el.expr, frame, false);
        return;
      case "map":
        for (const ent of e.entries) {
          walk(ent.key, frame, false);
          walk(ent.value, frame, false);
        }
        return;
      default:
        return; // num / bool / str / ref / unit — no children
    }
  };

  for (const s of prog.stmts) if (s.kind === "let") walk(s.value, null, false);
  return diags;
}

export function check(
  prog: Program,
  imported?: Registry,
  quals?: QualMap,
): Result<Program, Diagnostic[]> {
  const diags: Diagnostic[] = [
    ...checkReservedNames(prog),
    ...checkReservedWords(prog),
    ...checkCtorFieldVars(prog),
    ...checkQualifiedTypeNames(prog, quals),
    ...checkLoops(prog),
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
