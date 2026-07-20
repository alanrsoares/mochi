// Semantic pass — the Reason superpower: exhaustiveness + constructor checks.
// Builds a variant registry from `type` decls, then verifies every `switch`.
import { err, isErr, ok, type Result } from "@onrails/result";
import type { Expr, Pattern, Program } from "./ast";
import { type AlangError, checkErr } from "./errors";

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
    reg.type.set(
      s.name,
      s.ctors.map((c) => c.name),
    );
    for (const c of s.ctors) {
      if (reg.ctor.has(c.name)) return err(checkErr(`duplicate constructor '${c.name}'`, s.span));
      reg.ctor.set(c.name, { type: s.name, arity: c.fields.length });
    }
  }
  return ok(reg);
};

// Walk an expression tree, invoking `visit` on every `match` node.
function forEachMatch(e: Expr, visit: (m: Extract<Expr, { kind: "match" }>) => void): void {
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
    case "pipe":
      forEachMatch(e.left, visit);
      forEachMatch(e.right, visit);
      return;
    case "match":
      forEachMatch(e.scrutinee, visit);
      for (const a of e.arms) forEachMatch(a.body, visit);
      visit(e);
      return;
    case "record":
      for (const f of e.fields) forEachMatch(f.value, visit);
      return;
    case "field":
      forEachMatch(e.target, visit);
      return;
  }
}

// A pattern is a catch-all when it always matches. A record pattern does so
// only when every field just binds (no literal field narrows the match).
const isCatchAll = (p: Pattern): boolean =>
  p.kind === "pwild" ||
  p.kind === "pbind" ||
  (p.kind === "precord" && p.fields.every((f) => isCatchAll(f.pat))) ||
  // `[...all]` — a bare rest with no fixed head matches any list.
  (p.kind === "plist" && p.elems.length === 0 && p.rest !== null);

// List switches can't be proven total in general, but the canonical ML form —
// an empty `[]` arm plus a single-head cons `[x, ...xs]` — covers length 0 and
// length ≥ 1, so it's total. Returns null (exhaustive), an error (a list switch
// that isn't), or undefined (not a list switch → let the caller decide).
const checkListExhaustive = (
  m: Extract<Expr, { kind: "match" }>,
): AlangError | null | undefined => {
  const lists = m.arms.flatMap((a) => (a.pattern.kind === "plist" ? [a.pattern] : []));
  if (lists.length === 0) return undefined;
  const hasEmpty = lists.some((p) => p.elems.length === 0 && p.rest === null);
  const hasCons = lists.some((p) => p.elems.length === 1 && p.rest !== null);
  if (hasEmpty && hasCons) return null;
  return checkErr("non-exhaustive list switch: cover `[]` and `[x, ...xs]` (or add `_`)", m.span);
};

function checkMatch(m: Extract<Expr, { kind: "match" }>, reg: Registry): AlangError | null {
  const hasCatchAll = m.arms.some((a) => isCatchAll(a.pattern));
  const ctorArms = m.arms.filter((a) => a.pattern.kind === "pctor");

  // No constructor arms → literal/wildcard/bool switch. A catch-all makes it
  // total; so does covering both boolean cases (bool is a closed two-case type).
  if (ctorArms.length === 0) {
    if (hasCatchAll) return null;
    const bools = new Set(
      m.arms.flatMap((a) => (a.pattern.kind === "pbool" ? [a.pattern.value] : [])),
    );
    if (bools.has(true) && bools.has(false)) return null;
    const listErr = checkListExhaustive(m);
    if (listErr !== undefined) return listErr;
    return checkErr("non-exhaustive switch: add a `_` catch-all arm", m.span);
  }

  // Validate each constructor pattern: known + right arity.
  let owningType: string | null = null;
  const covered = new Set<string>();
  for (const arm of ctorArms) {
    const p = arm.pattern as Extract<Pattern, { kind: "pctor" }>;
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
    covered.add(p.ctor);
  }

  if (hasCatchAll) return null; // catch-all covers the rest
  const required = reg.type.get(owningType!)!;
  const missing = required.filter((c) => !covered.has(c));
  return missing.length === 0
    ? null
    : checkErr(`non-exhaustive switch on '${owningType}': missing ${missing.join(", ")}`, m.span);
}

// `imported` carries the ctor/type registries of the modules this program
// imports from; merged UNDER the local registry (local declarations win) so
// exhaustiveness works across the module boundary.
export function check(prog: Program, imported?: Registry): Result<Program, AlangError> {
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
