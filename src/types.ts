/**
 * Type representation for Hindley-Milner inference with row-polymorphic records and deeply-nested generics. Plain immutable data; unification lives in ./unify.ts.
 *
 * Type constructors are *applied*: `con(name, args)`. A primitive is a nullary constructor (`number` = con("number", [])); a generic is the same node with type arguments (`List<'a>` = con("List", ['a])), and they nest arbitrarily (`List<Option<'a>>`, `Map<'k, List<'v>>`). Unification recurses through `args`, so deep generics fall out for free.
 *
 * A record type is a `row`: zero or more labelled fields ending in either `empty` (closed — exactly these fields) or an `rvar` (open — "these fields and possibly more"). Open rows give structural / duck typing: `p.x` accepts any record that has an `x`.
 */

export type Type =
  | { kind: "var"; id: number } // unification variable 'a
  | { kind: "con"; name: string; args: Type[] } // number; List<'a>; Map<'k,'v>; Shape
  | { kind: "arrow"; from: Type; to: Type } // t1 -> t2
  | { kind: "record"; row: Row }; // { x: t, ... | r }

/** Applied constructor (`number`, `List<'a>`, …). */
export type ConType = Extract<Type, { kind: "con" }>;

export type Row =
  | { kind: "empty" } // closed tail: {}
  | { kind: "rvar"; id: number } // open tail: | 'r
  | { kind: "extend"; label: string; type: Type; rest: Row }; // { label: type | rest }

export const tVar = (id: number): Type => ({ kind: "var", id });
export const tCon = (name: string, args: Type[] = []): Type => ({ kind: "con", name, args });
export const tArrow = (from: Type, to: Type): Type => ({ kind: "arrow", from, to });
export const tRecord = (row: Row): Type => ({ kind: "record", row });

export const tNumber = tCon("number");
export const tString = tCon("string");
export const tBool = tCon("bool");

export const tApp = (name: string, ...args: Type[]): Type => tCon(name, args);

/**
 * A tuple is an applied constructor under the reserved, unspeakable name `"tuple"` (lowercase → never a user type, which are always Uppercase). Arity is encoded by the number of args, so `(a, b)` and `(a, b, c)` are distinct types that never unify — all for free via the existing con machinery.
 */
export const TUPLE = "tuple";
export const tTuple = (elems: Type[]): Type => tCon(TUPLE, elems);

export const rEmpty: Row = { kind: "empty" };
export const rVar = (id: number): Row => ({ kind: "rvar", id });
export const rExtend = (label: string, type: Type, rest: Row): Row => ({
  kind: "extend",
  label,
  type,
  rest,
});

/** Type vars and row vars draw from one counter so ids never collide across the two substitution maps. */
export type Fresh = { next: number };
export const mkFresh = (start = 0): Fresh => ({ next: start });
export const freshVar = (f: Fresh): Type => tVar(f.next++);
export const freshRowVar = (f: Fresh): Row => rVar(f.next++);

export const showType = (t: Type): string => {
  switch (t.kind) {
    case "var":
      return `'t${t.id}`;
    case "con":
      if (t.name === "Array" && t.args.length === 1) return `[${showType(t.args[0]!)}]`;
      if (t.name === TUPLE) return `(${t.args.map(showType).join(", ")})`;
      return t.args.length === 0 ? t.name : `${t.name}<${t.args.map(showType).join(", ")}>`;
    case "arrow": {
      // parenthesize a left-nested arrow: (a -> b) -> c
      const from = t.from.kind === "arrow" ? `(${showType(t.from)})` : showType(t.from);
      return `${from} -> ${showType(t.to)}`;
    }
    case "record":
      return showRow(t.row);
  }
};

const showRow = (row: Row): string => {
  const fields: string[] = [];
  let cur = row;
  while (cur.kind === "extend") {
    fields.push(`${cur.label}: ${showType(cur.type)}`);
    cur = cur.rest;
  }
  const tail = cur.kind === "rvar" ? `${fields.length ? " " : ""}| 'r${cur.id}` : "";
  return fields.length === 0 && tail === "" ? "{}" : `{ ${fields.join(", ")}${tail} }`;
};

/**
 * A `type Point a = { x: a, y: number }` decl names a structural record type. It carries NO nominal identity: inference expands it to its row, and display folds a matching CLOSED row back to the name. The `template` is that record type with each type parameter encoded as a marker var `tVar(-(i+1))` — a slot negative ids never collide with real fresh vars (which start at 0).
 */
export type AliasDef = { name: string; params: string[]; template: Type };

/** Marker id for the i-th type parameter of an alias template. */
export const aliasParamId = (i: number): number => -(i + 1);

const typeEq = (a: Type, b: Type): boolean => {
  if (a.kind !== b.kind) return false;
  if (a.kind === "var" && b.kind === "var") return a.id === b.id;
  if (a.kind === "con" && b.kind === "con")
    return (
      a.name === b.name &&
      a.args.length === b.args.length &&
      a.args.every((x, i) => typeEq(x, b.args[i]!))
    );
  if (a.kind === "arrow" && b.kind === "arrow") return typeEq(a.from, b.from) && typeEq(a.to, b.to);
  if (a.kind === "record" && b.kind === "record") return rowEq(a.row, b.row);
  return false;
};

const rowFields = (row: Row): { map: Map<string, Type>; closed: boolean } => {
  const map = new Map<string, Type>();
  let cur = row;
  while (cur.kind === "extend") {
    map.set(cur.label, cur.type);
    cur = cur.rest;
  }
  return { map, closed: cur.kind === "empty" };
};

const rowEq = (a: Row, b: Row): boolean => {
  const fa = rowFields(a);
  const fb = rowFields(b);
  if (fa.closed !== fb.closed || fa.map.size !== fb.map.size) return false;
  for (const [k, t] of fa.map) {
    const u = fb.map.get(k);
    if (!u || !typeEq(t, u)) return false;
  }
  return true;
};

/**
 * One-way match: does concrete type `actual` fit alias `template`? Marker vars in the template bind to concrete types; repeats must agree. Records match only when CLOSED with the exact same label set (so open/partial rows stay structural, never over-eagerly folded).
 */
const matchTemplate = (template: Type, actual: Type, binds: Map<number, Type>): boolean => {
  if (template.kind === "var" && template.id < 0) {
    const prev = binds.get(template.id);
    if (prev) return typeEq(prev, actual);
    binds.set(template.id, actual);
    return true;
  }
  if (template.kind !== actual.kind) return false;
  if (template.kind === "con" && actual.kind === "con")
    return (
      template.name === actual.name &&
      template.args.length === actual.args.length &&
      template.args.every((t, i) => matchTemplate(t, actual.args[i]!, binds))
    );
  if (template.kind === "arrow" && actual.kind === "arrow")
    return (
      matchTemplate(template.from, actual.from, binds) &&
      matchTemplate(template.to, actual.to, binds)
    );
  if (template.kind === "record" && actual.kind === "record") {
    const ft = rowFields(template.row);
    const fa = rowFields(actual.row);
    if (!ft.closed || !fa.closed || ft.map.size !== fa.map.size) return false;
    for (const [label, tt] of ft.map) {
      const at = fa.map.get(label);
      if (!at || !matchTemplate(tt, at, binds)) return false;
    }
    return true;
  }
  // primitives-as-con already handled; vars with non-negative ids compare by id
  if (template.kind === "var" && actual.kind === "var") return template.id === actual.id;
  return false;
};

/**
 * Rewrite a type so any closed record row matching an alias becomes `con(Name, args)`, which the existing pretty-printers render as the alias name. Top-down: try to match a node whole (against a raw, unfolded template), then recurse into the resulting node's children so nested/argument records fold too. First matching alias wins (declaration order).
 */
export const foldAliases = (t: Type, aliases: AliasDef[]): Type => {
  for (const def of aliases) {
    const binds = new Map<number, Type>();
    if (!matchTemplate(def.template, t, binds)) continue;
    const args = def.params.map((_, i) => binds.get(aliasParamId(i)));
    if (args.some((a) => a === undefined)) continue; // phantom param — can't name it
    return tCon(
      def.name,
      args.map((a) => foldAliases(a as Type, aliases)),
    );
  }
  switch (t.kind) {
    case "con":
      return tCon(
        t.name,
        t.args.map((a) => foldAliases(a, aliases)),
      );
    case "arrow":
      return tArrow(foldAliases(t.from, aliases), foldAliases(t.to, aliases));
    case "record": {
      const fields: { label: string; type: Type }[] = [];
      let cur: Row = t.row;
      while (cur.kind === "extend") {
        fields.push({ label: cur.label, type: foldAliases(cur.type, aliases) });
        cur = cur.rest;
      }
      const tail: Row = cur;
      return tRecord(fields.reduceRight<Row>((rest, f) => rExtend(f.label, f.type, rest), tail));
    }
    default:
      return t;
  }
};
