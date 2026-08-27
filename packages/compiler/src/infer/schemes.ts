/**
 * Scheme construction and generalization — everything Scheme-shaped that is NOT
 * part of infer.ts's mutually-recursive inference core: the `Scheme`/`Env`
 * types, free-variable collection, `generalize`/`instantiate`, and the
 * surface-type lowering (`typeExprToType`/`ctorScheme`) that builds types and
 * schemes from written TypeExprs. `infer.ts` is the main consumer; `dts.ts`
 * lowers ctor-field TypeExprs through `typeExprToType` so the TS output grammar
 * has exactly one encoder.
 */
import { match } from "@onrails/pattern";
import type { AliasField, Ctor, TypeExpr } from "../ast/ast";
import { PRIM_TYPE_NAMES } from "../ast/ctors";
import {
  type Fresh,
  freshRowVar,
  freshVar,
  type Row,
  rEmpty,
  rExtend,
  type Type,
  tArrow,
  tBool,
  tCon,
  tLit,
  tNumber,
  tRecord,
  tString,
  tTuple,
  tUnion,
} from "../ast/types";
import { type Subst, zonk } from "./unify";

/** A polymorphic type scheme: `∀ vars rvars. type`. */
export type Scheme = { vars: number[]; rvars: number[]; type: Type };
export type Env = Map<string, Scheme>;
export const mono = (t: Type): Scheme => ({ vars: [], rvars: [], type: t });

/**
 * mochi surface type name → HM type. Unknown names become nullary cons (a reference to a declared variant).
 * `int`/`float` are aliases of `number` (ADR 0085).
 */
export const primType = (name: string): Type =>
  ({ float: tNumber, int: tNumber, string: tString, bool: tBool })[name] ?? tCon(name);

export type VarSets = { tv: Set<number>; rv: Set<number> };

const collect = (t: Type, acc: VarSets): void => {
  match(t)
    .with({ kind: "var" }, (v) => {
      acc.tv.add(v.id);
    })
    .with({ kind: "con" }, (con) => {
      for (const a of con.args) collect(a, acc);
    })
    .with({ kind: "arrow" }, (arrow) => {
      collect(arrow.from, acc);
      collect(arrow.to, acc);
    })
    .with({ kind: "record" }, (rec) => {
      collectRow(rec.row, acc);
    })
    .with({ kind: "lit" }, () => {})
    .with({ kind: "union" }, (u) => {
      for (const m of u.members) collect(m, acc);
    })
    .exhaustive();
};

const collectRow = (row: Row, acc: VarSets): void => {
  match(row)
    .with({ kind: "empty" }, () => {})
    .with({ kind: "rvar" }, (rvar) => {
      acc.rv.add(rvar.id);
    })
    .with({ kind: "extend" }, (ext) => {
      collect(ext.type, acc);
      collectRow(ext.rest, acc);
    })
    .exhaustive();
};

export const freeInType = (t: Type): VarSets => {
  const acc: VarSets = { tv: new Set(), rv: new Set() };
  collect(t, acc);
  return acc;
};

/**
 * Free vars of a scheme UNDER the current substitution, treating the scheme's own quantified vars as OPAQUE (resolution stops at them). Two hazards to thread between:
 *
 * 1. A `mono('t)` binding whose var was later unified to `{ … | 'r }` reads as the bare `'t` in its scheme, hiding `'r`. Resolving through the subst is essential — else `generalize` treats `'r` as free (not env-bound) and QUANTIFIES a row var the environment already constrains: an unsound over-generalization that makes a monomorphic local spuriously polymorphic and leaks a `& A` in the TS backend (ADR 0040). Mono schemes bind nothing, so nothing is opaque and the walk resolves fully — the ADR 0040 fix.
 *
 * 2. A *generalized* scheme's bound var may itself be a subst key (an unsound over-generalization elsewhere left it bound). Zonking would expand it and leak the binding's inner vars as false-free, suppressing a sibling's legitimate generalization (ADR 0041). A scheme's bound vars have no identity outside the scheme, so stopping at them is exactly correct: the scheme's declared interface says the caller picks them, so they impose no constraint the sibling must respect.
 */
const freeInScheme = (sc: Scheme, s: Subst): VarSets => {
  const bt = new Set(sc.vars);
  const br = new Set(sc.rvars);
  const acc: VarSets = { tv: new Set(), rv: new Set() };
  const walk = (t: Type): void => {
    let cur = t;
    while (cur.kind === "var") {
      if (bt.has(cur.id)) return; // opaque bound var
      const next = s.tvars.get(cur.id);
      if (!next) {
        acc.tv.add(cur.id);
        return;
      }
      cur = next;
    }
    match(cur)
      .with({ kind: "con" }, (con) => {
        con.args.forEach(walk);
      })
      .with({ kind: "arrow" }, (arrow) => {
        walk(arrow.from);
        walk(arrow.to);
      })
      .with({ kind: "record" }, (rec) => {
        walkRow(rec.row);
      })
      .with({ kind: "lit" }, () => {})
      .with({ kind: "union" }, (u) => {
        u.members.forEach(walk);
      })
      .exhaustive();
  };
  const walkRow = (row: Row): void => {
    let cur = row;
    while (cur.kind === "rvar") {
      if (br.has(cur.id)) return; // opaque bound row var
      const next = s.rvars.get(cur.id);
      if (!next) {
        acc.rv.add(cur.id);
        return;
      }
      cur = next;
    }
    match(cur)
      .with({ kind: "empty" }, () => {})
      .with({ kind: "extend" }, (ext) => {
        walk(ext.type);
        walkRow(ext.rest);
      })
      .exhaustive();
  };
  walk(sc.type);
  return acc;
};

const freeInEnv = (env: Env, s: Subst): VarSets => {
  const acc: VarSets = { tv: new Set(), rv: new Set() };
  for (const sc of env.values()) {
    const f = freeInScheme(sc, s);
    for (const v of f.tv) acc.tv.add(v);
    for (const v of f.rv) acc.rv.add(v);
  }
  return acc;
};

export const generalize = (env: Env, t: Type, s: Subst, widen = true): Scheme => {
  const zt = widen ? widenLits(zonk(t, s)) : zonk(t, s);
  const free = freeInType(zt);
  const bound = freeInEnv(env, s);
  const vars = [...free.tv].filter((v) => !bound.tv.has(v));
  const rvars = [...free.rv].filter((v) => !bound.rv.has(v));
  return { vars, rvars, type: zt };
};

/**
 * Defaulting: bare string/number singletons widen to their base prim at
 * generalization of an *unannotated* binding (TypeScript `let`). Written
 * types (annotations, externs) skip this pass so `"hi"` stays `"hi"`
 * (ADR 0081). Finite unions of lits stay precise either way.
 */
export const widenLits = (t: Type): Type =>
  match(t)
    .with({ kind: "lit" }, (lit) => (lit.base === "string" ? tString : tNumber))
    // Keep literal-union members precise (`$tone: "rose" | "amber"`).
    .with({ kind: "union" }, (u) =>
      tUnion(u.members.map((m) => (m.kind === "lit" ? m : widenLits(m)))),
    )
    .with({ kind: "con" }, (con) => tCon(con.name, con.args.map(widenLits)))
    .with({ kind: "arrow" }, (arrow) => tArrow(widenLits(arrow.from), widenLits(arrow.to)))
    .with({ kind: "record" }, (rec) => tRecord(widenRow(rec.row)))
    .with({ kind: "var" }, (v) => v)
    .exhaustive();

const widenRow = (row: Row): Row =>
  match(row)
    .with({ kind: "empty" }, (empty) => empty)
    .with({ kind: "rvar" }, (rvar) => rvar)
    .with({ kind: "extend" }, (ext) => rExtend(ext.label, widenLits(ext.type), widenRow(ext.rest)))
    .exhaustive();

export const instantiate = (sc: Scheme, f: Fresh): Type => {
  const tmap = new Map(sc.vars.map((v) => [v, freshVar(f)]));
  const rmap = new Map(sc.rvars.map((v) => [v, freshRowVar(f)]));
  const sub = (t: Type): Type =>
    match(t)
      .with({ kind: "var" }, (v) => tmap.get(v.id) ?? v)
      .with({ kind: "con" }, (con) =>
        tCon(
          con.name,
          con.args.map((a) => sub(a)),
        ),
      )
      .with({ kind: "arrow" }, (arrow) => tArrow(sub(arrow.from), sub(arrow.to)))
      .with({ kind: "record" }, (rec) => tRecord(subRow(rec.row)))
      .with({ kind: "lit" }, (lit) => lit)
      .with({ kind: "union" }, (u) => tUnion(u.members.map(sub)))
      .exhaustive();
  const subRow = (row: Row): Row =>
    match(row)
      .with({ kind: "empty" }, (empty) => empty)
      .with({ kind: "rvar" }, (rvar) => rmap.get(rvar.id) ?? rvar)
      .with({ kind: "extend" }, (ext) => rExtend(ext.label, sub(ext.type), subRow(ext.rest)))
      .exhaustive();
  return sub(sc.type);
};

/** A transparent alias, keyed by name, resolved during type-expr → type. */
export type AliasInfo = { params: string[]; fields: AliasField[]; expr?: TypeExpr };
export type AliasMap = Map<string, AliasInfo>;

/**
 * Everything name resolution needs while lowering a written TypeExpr: the
 * module's own transparent record aliases, plus the namespace-import aliases it
 * may qualify through (`import * as D` → `D.Shape`, ADR 0046 / C5 slice b).
 */
export type TypeScope = { aliases: AliasMap; quals: QualMap };

/**
 * The type-name scope a module exposes to its importers: every exported type
 * name (variants AND record aliases — `types` is the existence check `check.ts`
 * reports against) and, in `scope`, the aliases that must EXPAND plus the
 * declaring module's own qual map. Expansion runs in the DECLARING module's
 * scope so an alias field naming `Other.T` resolves where it was written rather
 * than where it was imported.
 */
export type QualScope = { types: ReadonlySet<string>; scope: TypeScope };

/** Namespace-import alias (`import * as D`) → the dep's exported type scope. */
export type QualMap = ReadonlyMap<string, QualScope>;

export const emptyTypeScope = (): TypeScope => ({ aliases: new Map(), quals: new Map() });

/**
 * Expand a record alias to its structural row. `args` binds its type parameters positionally; params past `args.length` become fresh generic vars. `expanding` breaks reference cycles (`type T = { self: T }`) by falling back to the bare nominal `con(name, args)` — finite, though that field then unifies nominally.
 */
export const aliasRow = (
  name: string,
  info: AliasInfo,
  args: Type[],
  f: Fresh,
  scope: TypeScope,
  expanding: Set<string>,
): Type => {
  if (expanding.has(name)) return tCon(name, args);
  const local = new Map<string, Type>();
  info.params.forEach((p, i) => {
    local.set(p, args[i] ?? freshVar(f));
  });
  const next = new Set(expanding).add(name);
  if (info.expr) return typeExprToType(info.expr, local, f, scope, next);
  const row = info.fields.reduceRight<Row>(
    (rest, fld) => rExtend(fld.name, typeExprToType(fld.type, local, f, scope, next), rest),
    rEmpty,
  );
  return tRecord(row);
};

export const typeExprToType = (
  te: TypeExpr,
  vars: Map<string, Type>,
  f: Fresh,
  scope: TypeScope = emptyTypeScope(),
  expanding: Set<string> = new Set(),
): Type =>
  match(te)
    .with({ kind: "tarrow" }, (tarrow) =>
      tArrow(
        typeExprToType(tarrow.from, vars, f, scope, expanding),
        typeExprToType(tarrow.to, vars, f, scope, expanding),
      ),
    )
    .with({ kind: "tapp" }, (tapp) => {
      const args = tapp.args.map((a) => typeExprToType(a, vars, f, scope, expanding));
      const info = scope.aliases.get(tapp.ctor);
      return info ? aliasRow(tapp.ctor, info, args, f, scope, expanding) : tCon(tapp.ctor, args);
    })
    .with({ kind: "ttuple" }, (ttuple) =>
      tTuple(ttuple.elems.map((el) => typeExprToType(el, vars, f, scope, expanding))),
    )
    .with({ kind: "tlist" }, (tlist) =>
      tCon("Array", [typeExprToType(tlist.elem, vars, f, scope, expanding)]),
    )
    .with({ kind: "tname" }, (tname) => {
      // `unit` is an ordinary primitive name (ADR 0054), so `()` in TypeExpr — which
      // the parser lowers to `tname "unit"` — needs no special case here.
      if (PRIM_TYPE_NAMES.has(tname.name)) return primType(tname.name);
      // Explicit generic binders on an extern (`extern f<T> : T -> T`) use
      // conventional upper-case names. Resolve them before nominal types.
      const bound = vars.get(tname.name);
      if (bound) return bound;
      const info = scope.aliases.get(tname.name);
      if (info) return aliasRow(tname.name, info, [], f, scope, expanding);
      if (/^[A-Z]/.test(tname.name)) return tCon(tname.name);
      let v = vars.get(tname.name);
      if (!v) {
        v = freshVar(f);
        vars.set(tname.name, v);
      }
      return v;
    })
    .with({ kind: "tqual" }, (tqual) => {
      const args = tqual.args.map((a) => typeExprToType(a, vars, f, scope, expanding));
      const dep = scope.quals.get(tqual.alias);
      const info = dep?.scope.aliases.get(tqual.name);
      // A transparent record alias EXPANDS across the edge exactly as a local one
      // does — but in the declaring module's scope, so its own field types resolve
      // where they were written (C5 slice b).
      return dep && info
        ? aliasRow(tqual.name, info, args, f, dep.scope, expanding)
        : tCon(tqual.name, args);
    })
    .with({ kind: "tlit" }, (tlit) => tLit(tlit.value))
    .with({ kind: "tunion" }, (tunion) =>
      tUnion(tunion.members.map((m) => typeExprToType(m, vars, f, scope, expanding))),
    )
    .exhaustive();

/**
 * A variant's constructors become curried functions into that variant type, polymorphic over the type's parameters. `type Result a e = | Ok(a) | Err(e)` gives `Ok : ∀a e. a -> Result<a, e>` — each type param maps to a fresh var quantified in the scheme; a constructor arg naming a param uses that var, and the result type applies the params so matching connects them.
 */
export const ctorScheme = (
  typeName: string,
  params: string[],
  c: Ctor,
  f: Fresh,
  scope: TypeScope,
): Scheme => {
  const pvars = new Map<string, Type>(params.map((p) => [p, freshVar(f)]));
  const result = tCon(
    typeName,
    params.map((p) => pvars.get(p)!),
  );
  // Field types are full type expressions (ADR 0015); params resolve through
  // `pvars`, aliases expand, and `[t]`/`Option t`/arrows/tuples all work.
  const type = c.fields.reduceRight(
    (acc, fld) => tArrow(typeExprToType(fld.type, pvars, f, scope), acc),
    result,
  );
  // Quantify every var the fields introduced (params, plus any the conversion
  // minted); a ctor scheme is closed by construction, nothing leaks from env.
  const sets: VarSets = { tv: new Set(), rv: new Set() };
  collect(type, sets);
  return { vars: [...sets.tv], rvars: [...sets.rv], type };
};
