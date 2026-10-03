/** Width-aware Mochi type rendering for editor hovers, over the bootstrap core's values. */

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
import type { Row, Stmt, Ty, TypeExpr } from "@mochi/compiler/infer/types";
import { TUPLE, UNIT } from "@mochi/compiler/types";

type TypeStmt = Extract<Stmt, { _tag: "SType" }>;
type Ctor = TypeStmt["ctors"][number];

/** Keep hover signatures readable without changing the canonical diagnostic printer. */
const HOVER_WIDTH = 72;

const typeDoc = (type: Ty): Doc => {
  switch (type._tag) {
    case "TyVar":
      return txt(`'t${type.id}`);
    case "TySingleton":
      return txt(type.base === "string" ? JSON.stringify(type.value) : type.value);
    case "TyCon":
      if (type.name === "Array" && type.args.length === 1)
        return seq(txt("["), typeDoc(type.args[0]!), txt("]"));
      if (type.name === TUPLE) return delimited("(", ")", type.args.map(typeDoc));
      if (type.name === UNIT && type.args.length === 0) return txt("()");
      return type.args.length === 0
        ? txt(type.name)
        : appliedTypeDoc(type.name, type.args.map(typeDoc));
    case "TyFn":
      return arrowDoc(typeDoc(type.from), type.from._tag === "TyFn", typeDoc(type.to));
    case "TyRecord":
      return rowDoc(type.row);
    case "TyOneOf":
      return unionDoc(type.members.map(typeDoc));
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

const recordDoc = (fields: Doc[]): Doc =>
  fields.length === 0
    ? txt("{}")
    : group(seq(txt("{"), indent(seq(line, join(seq(txt(","), line), fields))), line, txt("}")));

const rowDoc = (row: Row): Doc => {
  const fields: Doc[] = [];
  let tail = row;
  while (tail._tag === "RowExtend") {
    fields.push(seq(txt(`${tail.label}: `), typeDoc(tail.fieldType)));
    tail = tail.rest;
  }
  if (tail._tag === "RowVar") fields.push(txt(`| 'r${tail.id}`));
  return recordDoc(fields);
};

/** A type on one line, whatever its width (import schemes). */
export const showHoverType = (type: Ty): string => render(typeDoc(type), Number.MAX_SAFE_INTEGER);

/** Render a type as a hover signature, optionally after a declaration prefix. */
export const renderHoverType = (type: Ty, prefix = ""): string =>
  render(seq(txt(prefix), typeDoc(type)), HOVER_WIDTH);

const typeExprDoc = (type: TypeExpr): Doc => {
  switch (type._tag) {
    case "TyName":
      return txt(type.name === "unit" ? "()" : type.name);
    case "TyApp":
      return appliedTypeDoc(type.ctor, type.args.map(typeExprDoc));
    case "TyTuple":
      return delimited("(", ")", type.elems.map(typeExprDoc));
    case "TyList":
      return seq(txt("["), typeExprDoc(type.elem), txt("]"));
    case "TyQual":
      return type.args.length === 0
        ? txt(`${type.alias}.${type.name}`)
        : appliedTypeDoc(`${type.alias}.${type.name}`, type.args.map(typeExprDoc));
    case "TyLit":
      return txt(JSON.stringify(type.value));
    case "TyUnion":
      return unionDoc(type.members.map(typeExprDoc));
    case "TyArrow":
      return arrowDoc(typeExprDoc(type.from), type.from._tag === "TyArrow", typeExprDoc(type.to));
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
    const type = typeExprDoc(field.fieldType);
    return field.name._tag === "None" ? type : seq(txt(`${field.name.value}: `), type);
  });
  return fields.length === 0 ? txt(ctor.name) : seq(txt(ctor.name), delimited("(", ")", fields));
};

/** Render a parsed type declaration with structural layout when it is long. */
export const renderHoverTypeDecl = (stmt: TypeStmt): string => {
  const head = `type ${stmt.name}${stmt.params.length === 0 ? "" : `<${stmt.params.join(", ")}>`} =`;
  const body =
    stmt.alias._tag === "Some"
      ? recordDoc(
          stmt.alias.value.map((field) =>
            seq(txt(`${field.name}: `), typeExprDoc(field.fieldType)),
          ),
        )
      : stmt.aliasType._tag === "Some"
        ? typeExprDoc(stmt.aliasType.value)
        : null;
  if (body) return render(group(seq(txt(head), indent(seq(line, body)))), HOVER_WIDTH);
  const [first, ...rest] = stmt.ctors.map(ctorDoc);
  const variants = first
    ? seq(first, ...rest.flatMap((ctor) => [line, txt("| "), ctor]))
    : txt("never");
  return render(group(seq(txt(head), indent(seq(line, variants)))), HOVER_WIDTH);
};

/** Render a constructor's curried function type from its parsed fields. */
export const renderHoverCtorScheme = (owner: TypeStmt, ctor: Ctor): string => {
  const result =
    owner.params.length === 0
      ? txt(owner.name)
      : appliedTypeDoc(
          owner.name,
          owner.params.map((name) => txt(name)),
        );
  const fields = ctor.fields.map((field) => typeExprDoc(field.fieldType));
  const type = fields.reduceRight<Doc>((to, from) => arrowDoc(from, false, to), result);
  return render(seq(txt(`constructor ${ctor.name}: `), type), HOVER_WIDTH);
};
