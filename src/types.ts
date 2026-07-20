// Type representation for Hindley-Milner inference with row-polymorphic
// records and deeply-nested generics. Plain immutable data; unification lives
// in ./unify.ts.
//
// Type constructors are *applied*: `con(name, args)`. A primitive is a nullary
// constructor (`number` = con("number", [])); a generic is the same node with
// type arguments (`List<'a>` = con("List", ['a])), and they nest arbitrarily
// (`List<Option<'a>>`, `Map<'k, List<'v>>`). Unification recurses through
// `args`, so deep generics fall out for free.
//
// A record type is a `row`: zero or more labelled fields ending in either
// `empty` (closed — exactly these fields) or an `rvar` (open — "these fields
// and possibly more"). Open rows give structural / duck typing: `p.x` accepts
// any record that has an `x`.

export type Type =
  | { kind: "var"; id: number } // unification variable 'a
  | { kind: "con"; name: string; args: Type[] } // number; List<'a>; Map<'k,'v>; Shape
  | { kind: "arrow"; from: Type; to: Type } // t1 -> t2
  | { kind: "record"; row: Row }; // { x: t, ... | r }

export type Row =
  | { kind: "empty" } // closed tail: {}
  | { kind: "rvar"; id: number } // open tail: | 'r
  | { kind: "extend"; label: string; type: Type; rest: Row }; // { label: type | rest }

// ---- constructors ----------------------------------------------------------

export const tVar = (id: number): Type => ({ kind: "var", id });
export const tCon = (name: string, args: Type[] = []): Type => ({ kind: "con", name, args });
export const tArrow = (from: Type, to: Type): Type => ({ kind: "arrow", from, to });
export const tRecord = (row: Row): Type => ({ kind: "record", row });

// primitives (nullary constructors)
export const tNumber = tCon("number");
export const tString = tCon("string");
export const tBool = tCon("bool");

// generic sugar: applied constructors
export const tApp = (name: string, ...args: Type[]): Type => tCon(name, args);

export const rEmpty: Row = { kind: "empty" };
export const rVar = (id: number): Row => ({ kind: "rvar", id });
export const rExtend = (label: string, type: Type, rest: Row): Row => ({
  kind: "extend",
  label,
  type,
  rest,
});

// ---- fresh variable supply -------------------------------------------------

// Type vars and row vars draw from one counter so ids never collide across
// the two substitution maps.
export type Fresh = { next: number };
export const mkFresh = (start = 0): Fresh => ({ next: start });
export const freshVar = (f: Fresh): Type => tVar(f.next++);
export const freshRowVar = (f: Fresh): Row => rVar(f.next++);

// ---- pretty-printer (for errors + tests) -----------------------------------

export const showType = (t: Type): string => {
  switch (t.kind) {
    case "var":
      return `'t${t.id}`;
    case "con":
      if (t.name === "Array" && t.args.length === 1) return `[${showType(t.args[0]!)}]`;
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
  if (fields.length === 0 && tail === "") return "{}";
  return `{ ${fields.join(", ")}${tail} }`;
};
