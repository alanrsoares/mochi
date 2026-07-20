// alang AST. Every node carries its source `span` for diagnostics + tooling.
import type { Span } from "./span";

export type Expr =
  | { kind: "num"; value: number; span: Span }
  | { kind: "bool"; value: boolean; span: Span }
  | { kind: "str"; value: string; span: Span }
  | { kind: "ref"; name: string; span: Span }
  | { kind: "call"; fn: Expr; args: Expr[]; span: Span }
  | { kind: "lambda"; params: LamParam[]; body: Expr; span: Span } // (x, y) => body, ({a, b}) => body
  | { kind: "pipe"; left: Expr; right: Expr; span: Span } // a |> f
  | { kind: "match"; scrutinee: Expr; arms: MatchArm[]; span: Span } // switch x { | p => e }
  | { kind: "record"; fields: Field[]; span: Span } // { x: 1, y: 2 }
  | { kind: "field"; target: Expr; name: string; span: Span }; // p.x

// A lambda parameter: a plain name, or a record-destructuring pattern that
// binds each named field. `({ x, y }) => ...` pulls x and y out of the argument.
export type LamParam = { kind: "name"; name: string } | { kind: "precord"; fields: string[] };

export type Field = { name: string; value: Expr };

export type MatchArm = { pattern: Pattern; body: Expr };

export type Pattern =
  | { kind: "pwild"; span: Span } // _
  | { kind: "pbind"; name: string; span: Span } // x
  | { kind: "plit"; value: number; span: Span } // 0
  | { kind: "pbool"; value: boolean; span: Span } // true / false
  | { kind: "pstr"; value: string; span: Span } // "foo"
  | { kind: "precord"; fields: PatField[]; span: Span } // { x, status: "err" }
  | { kind: "pctor"; ctor: string; args: Pattern[]; span: Span }; // Circle(r)

// A field inside a record pattern: `{ x }` puns to `pbind x`; `{ x: p }` matches
// field `x` against sub-pattern `p` (a literal narrows, a name binds).
export type PatField = { label: string; pat: Pattern };

// A variant constructor: name + typed positional fields (types are names for now).
export type Ctor = { name: string; argTypes: string[] };

// A surface type expression, used in `extern` signatures. Lowercase names are
// type variables (generalized); prim names (number/string/bool/...) map to
// their HM type; others become nullary constructors.
export type TypeExpr =
  | { kind: "tname"; name: string; span: Span }
  | { kind: "tarrow"; from: TypeExpr; to: TypeExpr; span: Span };

export type Stmt =
  | { kind: "let"; name: string; nameSpan: Span; value: Expr; span: Span }
  | { kind: "type"; name: string; params: string[]; ctors: Ctor[]; span: Span } // type Result a e = | Ok(a) | ...
  // extern name : type = "module" "export"  — bind an external JS/TS function
  | {
      kind: "extern";
      name: string;
      nameSpan: Span;
      typeExpr: TypeExpr;
      module: string;
      imported: string;
      span: Span;
    };

export type Program = { stmts: Stmt[] };

export const isCtorName = (name: string): boolean => /^[A-Z]/.test(name);
