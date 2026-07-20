// alang AST. Every node carries its source `span` for diagnostics + tooling.
import type { Span } from "./span";

export type Expr =
  | { kind: "num"; value: number; raw: string; span: Span }
  | { kind: "bool"; value: boolean; span: Span }
  | { kind: "str"; value: string; span: Span }
  | { kind: "ref"; name: string; span: Span }
  | { kind: "call"; fn: Expr; args: Expr[]; span: Span }
  | { kind: "lambda"; params: LamParam[]; body: Expr; span: Span } // (x, y) => body, ({a, b}) => body
  | { kind: "pipe"; left: Expr; right: Expr; span: Span } // a |> f
  | { kind: "match"; scrutinee: Expr; arms: MatchArm[]; span: Span } // switch x { | p => e }
  | { kind: "record"; fields: Field[]; span: Span } // { x: 1, y: 2 }
  | { kind: "field"; target: Expr; name: string; span: Span } // p.x
  | { kind: "arr"; elements: Expr[]; span: Span } // [1, 2, 3] — eager Array
  | { kind: "list"; elements: Expr[]; span: Span } // @{1, 2, 3} — lazy List
  | { kind: "map"; entries: MapEntry[]; span: Span }; // #{ "a": 1 } — Map

// A lambda parameter: a plain name, or a record-destructuring pattern that
// binds each named field. `({ x, y }) => ...` pulls x and y out of the argument.
export type LamParam = { kind: "name"; name: string } | { kind: "precord"; fields: string[] };

export type Field = { name: string; value: Expr };

// One `key: value` pair in a `#{…}` map literal. The key is a full expression
// (usually a string/number literal), not an identifier like a record field.
export type MapEntry = { key: Expr; value: Expr };

export type MatchArm = { pattern: Pattern; body: Expr };

export type Pattern =
  | { kind: "pwild"; span: Span } // _
  | { kind: "pbind"; name: string; span: Span } // x
  | { kind: "plit"; value: number; raw: string; span: Span } // 0
  | { kind: "pbool"; value: boolean; span: Span } // true / false
  | { kind: "pstr"; value: string; span: Span } // "foo"
  | { kind: "precord"; fields: PatField[]; span: Span } // { x, status: "err" }
  | { kind: "pctor"; ctor: string; args: Pattern[]; span: Span } // Circle(r)
  // [], [x], [x, y], [head, ...tail] — `rest` (a bind/wild) captures the tail
  // after a `...`; null means the pattern matches a list of exactly `elems.length`.
  | { kind: "parr"; elems: Pattern[]; rest: Pattern | null; span: Span }
  // @{}, @{head, ...tail} — lazy-List destructuring. Slice 1 supports only the
  // empty and single-head-cons forms (see check.ts); `rest` is a bind/wild.
  | { kind: "plist"; elems: Pattern[]; rest: Pattern | null; span: Span };

// A field inside a record pattern: `{ x }` puns to `pbind x`; `{ x: p }` matches
// field `x` against sub-pattern `p` (a literal narrows, a name binds).
export type PatField = { label: string; pat: Pattern };

// A variant constructor: name + ordered fields. Each field has a type (a name
// for now) and an OPTIONAL label. A labelled field lowers to that runtime key
// (`Ok(value: a)` → `{ _tag: "Ok", value }`), matching the @onrails ecosystem;
// an unlabelled field falls back to its positional key `_0`, `_1`, …
export type Ctor = { name: string; fields: CtorField[] };
export type CtorField = { name: string | null; type: string };

// A surface type expression, used in `extern` signatures. Lowercase names are
// type variables (generalized); prim names (number/string/bool/...) map to
// their HM type; others become nullary constructors.
export type TypeExpr =
  | { kind: "tname"; name: string; span: Span }
  | { kind: "tarrow"; from: TypeExpr; to: TypeExpr; span: Span }
  | { kind: "tapp"; ctor: string; args: TypeExpr[]; span: Span } // Task a, Result a e
  | { kind: "tlist"; elem: TypeExpr; span: Span }; // [a]

export type Stmt =
  | { kind: "let"; name: string; nameSpan: Span; value: Expr; exported?: boolean; span: Span }
  | { kind: "type"; name: string; params: string[]; ctors: Ctor[]; exported?: boolean; span: Span } // type Result a e = | Ok(a) | ...
  // extern name : type = "module" "export"  — bind an external JS/TS function
  | {
      kind: "extern";
      name: string;
      nameSpan: Span;
      typeExpr: TypeExpr;
      module: string;
      imported: string;
      exported?: boolean;
      span: Span;
    }
  // import { a, b } from "./mod"  — bind exports of another alang module
  | { kind: "import"; names: ImportName[]; from: string; span: Span };

// A name pulled in by an `import`. `span` anchors it for diagnostics.
export type ImportName = { name: string; span: Span };

export type Program = { stmts: Stmt[] };

export const isCtorName = (name: string): boolean => /^[A-Z]/.test(name);
