/** Width-aware Mochi type rendering for editor hovers. */
import type { Ctor, TypeExpr, TypeStmt } from "@mochi/compiler/ast";
import {
  type Doc,
  group,
  indent,
  join,
  line,
  render,
  seq,
  softline,
  txt,
} from "@mochi/compiler/doc";
import { type Row, TUPLE, type Type, UNIT } from "@mochi/compiler/types";

/** Keep hover signatures readable without changing the canonical diagnostic printer. */
const HOVER_WIDTH = 72;

const typeDoc = (type: Type): Doc => {
  switch (type.kind) {
    case "var":
      return txt(`'t${type.id}`);
    case "lit":
      return txt(type.base === "string" ? JSON.stringify(type.value) : type.value);
    case "con":
      if (type.name === "Array" && type.args.length === 1)
        return seq(txt("["), typeDoc(type.args[0]!), txt("]"));
      if (type.name === TUPLE) return delimited("(", ")", type.args.map(typeDoc));
      if (type.name === UNIT && type.args.length === 0) return txt("()");
      return type.args.length === 0
        ? txt(type.name)
        : group(
            seq(
              txt(`${type.name}<`),
              indent(seq(softline, join(seq(txt(","), line), type.args.map(typeDoc)))),
              softline,
              txt(">"),
            ),
          );
    case "arrow": {
      const from =
        type.from.kind === "arrow" ? delimited("(", ")", [typeDoc(type.from)]) : typeDoc(type.from);
      return group(seq(from, txt(" ->"), indent(seq(line, typeDoc(type.to)))));
    }
    case "record":
      return rowDoc(type.row);
    case "union": {
      return unionDoc(type.members.map(typeDoc));
    }
  }
};

const delimited = (open: string, close: string, parts: Doc[]): Doc =>
  parts.length === 0
    ? txt(`${open}${close}`)
    : group(
        seq(
          txt(open),
          indent(seq(softline, join(seq(txt(","), line), parts))),
          softline,
          txt(close),
        ),
      );

const rowDoc = (row: Row): Doc => {
  const fields: Doc[] = [];
  let tail = row;
  while (tail.kind === "extend") {
    fields.push(seq(txt(`${tail.label}: `), typeDoc(tail.type)));
    tail = tail.rest;
  }
  if (tail.kind === "rvar") fields.push(txt(`| 'r${tail.id}`));
  return fields.length === 0
    ? txt("{}")
    : group(seq(txt("{"), indent(seq(line, join(seq(txt(","), line), fields))), line, txt("}")));
};

/** Render a type as a hover signature, optionally after a declaration prefix. */
export const renderHoverType = (type: Type, prefix = ""): string =>
  render(seq(txt(prefix), typeDoc(type)), HOVER_WIDTH);

const typeExprDoc = (type: TypeExpr): Doc => {
  switch (type.kind) {
    case "tname":
      return txt(type.name === "unit" ? "()" : type.name);
    case "tapp":
      return appliedTypeDoc(type.ctor, type.args.map(typeExprDoc));
    case "ttuple":
      return delimited("(", ")", type.elems.map(typeExprDoc));
    case "tlist":
      return seq(txt("["), typeExprDoc(type.elem), txt("]"));
    case "tqual":
      return type.args.length === 0
        ? txt(`${type.alias}.${type.name}`)
        : appliedTypeDoc(`${type.alias}.${type.name}`, type.args.map(typeExprDoc));
    case "tlit":
      return txt(JSON.stringify(type.value));
    case "tunion": {
      return unionDoc(type.members.map(typeExprDoc));
    }
    case "tarrow":
      return arrowDoc(typeExprDoc(type.from), type.from.kind === "tarrow", typeExprDoc(type.to));
  }
};

const appliedTypeDoc = (name: string, args: Doc[]): Doc =>
  group(
    seq(
      txt(`${name}<`),
      indent(seq(softline, join(seq(txt(","), line), args))),
      softline,
      txt(">"),
    ),
  );

const arrowDoc = (from: Doc, parenFrom: boolean, to: Doc): Doc =>
  group(seq(parenFrom ? delimited("(", ")", [from]) : from, txt(" ->"), indent(seq(line, to))));

const unionDoc = (members: Doc[]): Doc => {
  const [first, ...rest] = members;
  if (!first) return txt("never");
  return rest.length === 0
    ? first
    : group(seq(first, indent(seq(line, txt("| "), join(seq(line, txt("| ")), rest)))));
};

/** Render parsed type syntax in the same layout as inferred type hovers. */
export const renderHoverTypeExpr = (type: TypeExpr, prefix = ""): string =>
  render(seq(txt(prefix), typeExprDoc(type)), HOVER_WIDTH);

const ctorDoc = (ctor: Ctor): Doc => {
  const fields = ctor.fields.map((field) => {
    const type = typeExprDoc(field.type);
    return field.name === null ? type : seq(txt(`${field.name}: `), type);
  });
  return fields.length === 0 ? txt(ctor.name) : seq(txt(ctor.name), delimited("(", ")", fields));
};

const aliasRecordDoc = (stmt: TypeStmt): Doc => {
  const fields = (stmt.alias ?? []).map((field) =>
    seq(txt(`${field.name}: `), typeExprDoc(field.type)),
  );
  return fields.length === 0
    ? txt("{}")
    : group(seq(txt("{"), indent(seq(line, join(seq(txt(","), line), fields))), line, txt("}")));
};

/** Render a parsed type declaration with structural layout when it is long. */
export const renderHoverTypeDecl = (stmt: TypeStmt): string => {
  const head = `type ${stmt.name}${stmt.params.length === 0 ? "" : `<${stmt.params.join(", ")}>`} =`;
  if (!stmt.alias && !stmt.aliasType) {
    const [first, ...rest] = stmt.ctors.map(ctorDoc);
    const variants = first
      ? seq(first, ...rest.flatMap((ctor) => [line, txt("| "), ctor]))
      : txt("never");
    return render(group(seq(txt(head), indent(seq(line, variants)))), HOVER_WIDTH);
  }
  const body = stmt.alias ? aliasRecordDoc(stmt) : typeExprDoc(stmt.aliasType!);
  return render(group(seq(txt(head), indent(seq(line, body)))), HOVER_WIDTH);
};

/** Render a constructor's curried function type from its parsed fields. */
export const renderHoverCtorScheme = (owner: TypeStmt, ctor: Ctor): string => {
  const result = typeExprDoc({
    kind: "tapp",
    ctor: owner.name,
    args: owner.params.map((name) => ({ kind: "tname", name, span: owner.span })),
    span: owner.span,
  });
  const fields = ctor.fields.map((field) => typeExprDoc(field.type));
  const type = fields.reduceRight<Doc>((to, from) => arrowDoc(from, false, to), result);
  return render(seq(txt(`constructor ${ctor.name}: `), type), HOVER_WIDTH);
};
