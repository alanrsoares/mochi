// Constructor knowledge — ONE derivation from a program's `type` decls.
//
// Constructor facts (owning type, arity, field type exprs, runtime keys) used
// to be derived independently three times: `check.ts`'s registry (arity +
// exhaustiveness), `infer.ts`'s ctor loop (schemes), and `codegen.ts`'s
// ctorKeys (runtime destructure keys) — drift between them was caught by
// nobody's tests (ticket 0024). This module is the single source: `check`
// validates through it, `infer` builds ctor schemes from its entries, and
// `codegen` reads its keys.
import { err, ok, type Result } from "@onrails/result";
import type { Ctor, CtorField, Program } from "./ast";
import { type AlangError, checkErr } from "./errors";
import { builtinTypeDecls } from "./prelude";

// The primitive type names legal in a ctor field / type expression. Shared by
// `check` (field-name validation) and `infer` (prim lowering) — previously two
// identical Sets (`CTOR_PRIMS`, `PRIMS`) that could drift.
export const PRIM_TYPE_NAMES = new Set(["number", "int", "float", "string", "bool"]);

// One constructor's facts. `type` names the owning variant; `params` are the
// owning decl's type parameters (scheme construction applies them); `ctor`
// carries the declaration itself — its fields are full type expressions (ADR
// 0015); `keys` are the runtime object keys the emitted factory writes and
// patterns destructure — labelled field → its label, unlabelled → positional
// `_0`, `_1`. `builtin` marks a seeded Option/Result ctor, which consumers
// guard (a user or imported binding of the same name wins) where a user decl
// always applies.
export type CtorEntry = {
  type: string;
  params: string[];
  arity: number;
  ctor: Ctor;
  keys: string[];
  builtin: boolean;
};

export type CtorTable = {
  ctor: Map<string, CtorEntry>; // ctor name → its facts
  type: Map<string, string[]>; // type name → its ctor names
};

// A constructor's runtime field keys (factory and pattern destructure must agree).
export const keysOf = (fields: CtorField[]): string[] => fields.map((f, i) => f.name ?? `_${i}`);

const entryOf = (typeName: string, params: string[], c: Ctor, builtin: boolean): CtorEntry => ({
  type: typeName,
  params,
  arity: c.fields.length,
  ctor: c,
  keys: keysOf(c.fields),
  builtin,
});

// Seed builtin variant types (Option/Result) unless the program declares its
// own type of that name — user redeclarations win with no duplicate error.
const seedBuiltins = (table: CtorTable): void => {
  for (const bt of builtinTypeDecls) {
    if (table.type.has(bt.name)) continue;
    table.type.set(
      bt.name,
      bt.ctors.map((c) => c.name),
    );
    for (const c of bt.ctors)
      if (!table.ctor.has(c.name)) table.ctor.set(c.name, entryOf(bt.name, bt.params, c, true));
  }
};

// The failing builder — `check`'s entry point: duplicate-decl detection lives
// here, at the single derivation, so no later pass can see a table `check`
// didn't vouch for. A transparent record alias reserves its type name (a later
// variant can't reuse it) but registers no constructors — it's structural,
// never a `switch` target; an empty ctor list is inert for exhaustiveness.
export const buildCtorTable = (prog: Program): Result<CtorTable, AlangError> => {
  const table: CtorTable = { ctor: new Map(), type: new Map() };
  for (const s of prog.stmts) {
    if (s.kind !== "type") continue;
    if (table.type.has(s.name)) return err(checkErr(`duplicate type '${s.name}'`, s.span));
    table.type.set(
      s.name,
      s.ctors.map((c) => c.name),
    );
    for (const c of s.ctors) {
      if (table.ctor.has(c.name)) return err(checkErr(`duplicate constructor '${c.name}'`, s.span));
      table.ctor.set(c.name, entryOf(s.name, s.params, c, false));
    }
  }
  seedBuiltins(table);
  return ok(table);
};

// The non-failing builder for passes that run AFTER `check` has rejected
// duplicates (`infer`, `codegen`): same derivation, last decl wins.
export const ctorTableOf = (prog: Program): CtorTable => {
  const table: CtorTable = { ctor: new Map(), type: new Map() };
  for (const s of prog.stmts) {
    if (s.kind !== "type") continue;
    table.type.set(
      s.name,
      s.ctors.map((c) => c.name),
    );
    for (const c of s.ctors) table.ctor.set(c.name, entryOf(s.name, s.params, c, false));
  }
  seedBuiltins(table);
  return table;
};

// The table a module publishes: only its EXPORTED variant types (and their full
// ctor sets), no builtin seeding. Threaded into an importer's `check` so a
// `switch` on an imported variant is exhaustiveness-checked against every
// constructor — even ones the importer never imported (those force a
// catch-all, since it can't name them).
export const exportedCtorTable = (prog: Program): CtorTable => {
  const table: CtorTable = { ctor: new Map(), type: new Map() };
  for (const s of prog.stmts) {
    if (s.kind !== "type" || !s.exported) continue;
    table.type.set(
      s.name,
      s.ctors.map((c) => c.name),
    );
    for (const c of s.ctors) table.ctor.set(c.name, entryOf(s.name, s.params, c, false));
  }
  return table;
};

// The field keys of a module's EXPORTED ctors — threaded into an importer's
// `codegen` so a pattern on an imported variant destructures the right runtime
// keys (`Some(value: a)` → `{ value }`, not the positional `{ _0 }`).
export const exportedCtorKeys = (prog: Program): Map<string, string[]> => {
  const m = new Map<string, string[]>();
  for (const [name, e] of exportedCtorTable(prog).ctor) m.set(name, e.keys);
  return m;
};
