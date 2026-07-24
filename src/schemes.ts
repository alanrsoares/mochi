/**
 * Scheme construction and generalization — everything Scheme-shaped that is NOT part of infer.ts's mutually-recursive inference core: the `Scheme`/`Env` types, free-variable collection, `generalize`/`instantiate`, and the surface-type lowering (`typeExprToType`/`ctorScheme`) that builds types and schemes from written TypeExprs. `infer.ts` is the main consumer; `dts.ts` lowers ctor-field TypeExprs through `typeExprToType` so the TS output grammar has exactly one encoder (ADR 0015).
 */
import { match } from "@onrails/pattern";
import type { AliasField, Ctor, TypeExpr } from "./ast";
import { PRIM_TYPE_NAMES } from "./ctors";
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
  tNumber,
  tRecord,
  tString,
  tTuple,
} from "./types";
import { type Subst, zonk } from "./unify";

/** A polymorphic type scheme: `∀ vars rvars. type`. */
export type Scheme = { vars: number[]; rvars: number[]; type: Type };
export type Env = Map<string, Scheme>;
export const mono = (t: Type): Scheme => ({ vars: [], rvars: [], type: t });

/**
 * mochi surface type name → HM type. Unknown names become nullary cons (a reference to a declared variant).
 *
 * NUMERIC DECISION (CRITIQUE §2.3), recorded deliberately: mochi has ONE runtime numeric type — JS `number`. `float` and `int` are accepted in surface signatures TODAY as transparent aliases for `number` (they type-check identically, unify freely, and erase to `number` in .d.ts). This keeps the surface JS-faithful — no int/float coercion rules, no literal-defaulting, no overloaded `+` — while RESERVING the two names so a real int/float split (int erasing to integer ops, float to IEEE double, à la ReScript) can land later without breaking existing code. It is NOT a silent lie: the names mean "number, annotated with intent", and that intent is what a future split would harden. Any such split reopens the abstraction question (§2.4) because `+` would then need overloading — so it stays deferred, not accidental.
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

export const generalize = (env: Env, t: Type, s: Subst): Scheme => {
  const zt = zonk(t, s);
  const free = freeInType(zt);
  const bound = freeInEnv(env, s);
  const vars = [...free.tv].filter((v) => !bound.tv.has(v));
  const rvars = [...free.rv].filter((v) => !bound.rv.has(v));
  return { vars, rvars, type: zt };
};

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
      .exhaustive();
  const subRow = (row: Row): Row =>
    match(row)
      .with({ kind: "empty" }, (empty) => empty)
      .with({ kind: "rvar" }, (rvar) => rmap.get(rvar.id) ?? rvar)
      .with({ kind: "extend" }, (ext) => rExtend(ext.label, sub(ext.type), subRow(ext.rest)))
      .exhaustive();
  return sub(sc.type);
};

/** A transparent record alias, keyed by name, resolved during type-expr → type. */
export type AliasInfo = { params: string[]; fields: AliasField[] };
export type AliasMap = Map<string, AliasInfo>;

/**
 * Expand a record alias to its structural row. `args` binds its type parameters positionally; params past `args.length` become fresh generic vars. `expanding` breaks reference cycles (`type T = { self: T }`) by falling back to the bare nominal `con(name, args)` — finite, though that field then unifies nominally.
 */
export const aliasRow = (
  name: string,
  info: AliasInfo,
  args: Type[],
  f: Fresh,
  aliases: AliasMap,
  expanding: Set<string>,
): Type => {
  if (expanding.has(name)) return tCon(name, args);
  const local = new Map<string, Type>();
  info.params.forEach((p, i) => {
    local.set(p, args[i] ?? freshVar(f));
  });
  const next = new Set(expanding).add(name);
  const row = info.fields.reduceRight<Row>(
    (rest, fld) => rExtend(fld.name, typeExprToType(fld.type, local, f, aliases, next), rest),
    rEmpty,
  );
  return tRecord(row);
};

export const typeExprToType = (
  te: TypeExpr,
  vars: Map<string, Type>,
  f: Fresh,
  aliases: AliasMap = new Map(),
  expanding: Set<string> = new Set(),
): Type =>
  match(te)
    .with({ kind: "tarrow" }, (tarrow) =>
      tArrow(
        typeExprToType(tarrow.from, vars, f, aliases, expanding),
        typeExprToType(tarrow.to, vars, f, aliases, expanding),
      ),
    )
    .with({ kind: "tapp" }, (tapp) => {
      const args = tapp.args.map((a) => typeExprToType(a, vars, f, aliases, expanding));
      const info = aliases.get(tapp.ctor);
      return info ? aliasRow(tapp.ctor, info, args, f, aliases, expanding) : tCon(tapp.ctor, args);
    })
    .with({ kind: "ttuple" }, (ttuple) =>
      tTuple(ttuple.elems.map((el) => typeExprToType(el, vars, f, aliases, expanding))),
    )
    .with({ kind: "tlist" }, (tlist) =>
      tCon("Array", [typeExprToType(tlist.elem, vars, f, aliases, expanding)]),
    )
    .with({ kind: "tname" }, (tname) => {
      if (PRIM_TYPE_NAMES.has(tname.name)) return primType(tname.name);
      const info = aliases.get(tname.name);
      if (info) return aliasRow(tname.name, info, [], f, aliases, expanding);
      if (/^[A-Z]/.test(tname.name)) return tCon(tname.name);
      let v = vars.get(tname.name);
      if (!v) {
        v = freshVar(f);
        vars.set(tname.name, v);
      }
      return v;
    })
    .exhaustive();

/**
 * A variant's constructors become curried functions into that variant type, polymorphic over the type's parameters. `type Result a e = | Ok(a) | Err(e)` gives `Ok : ∀a e. a -> Result<a, e>` — each type param maps to a fresh var quantified in the scheme; a constructor arg naming a param uses that var, and the result type applies the params so matching connects them.
 */
export const ctorScheme = (
  typeName: string,
  params: string[],
  c: Ctor,
  f: Fresh,
  aliases: AliasMap,
): Scheme => {
  const pvars = new Map<string, Type>(params.map((p) => [p, freshVar(f)]));
  const result = tCon(
    typeName,
    params.map((p) => pvars.get(p)!),
  );
  // Field types are full type expressions (ADR 0015); params resolve through
  // `pvars`, aliases expand, and `[t]`/`Option t`/arrows/tuples all work.
  const type = c.fields.reduceRight(
    (acc, fld) => tArrow(typeExprToType(fld.type, pvars, f, aliases), acc),
    result,
  );
  // Quantify every var the fields introduced (params, plus any the conversion
  // minted); a ctor scheme is closed by construction, nothing leaks from env.
  const sets: VarSets = { tv: new Set(), rv: new Set() };
  collect(type, sets);
  return { vars: [...sets.tv], rvars: [...sets.rv], type };
};
