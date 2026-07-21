// alang AST. Every node carries its source `span` for diagnostics + tooling.
import type { Span } from "./span";

export type Expr =
  | { kind: "num"; value: number; raw: string; span: Span }
  | { kind: "bool"; value: boolean; span: Span }
  | { kind: "str"; value: string; span: Span }
  | { kind: "ref"; name: string; span: Span }
  | { kind: "call"; fn: Expr; args: Expr[]; span: Span }
  | { kind: "lambda"; params: LamParam[]; body: Expr; span: Span } // (x, y) => body, ({a, b}) => body
  // let x = value in body — a local binding scoped to `body`. Non-recursive:
  // `x` is NOT in scope in `value`. Generalized (let-polymorphism) like a
  // top-level `let`. `nameSpan` anchors the bound name for hover/inlay.
  | { kind: "letin"; name: string; nameSpan: Span; value: Expr; body: Expr; span: Span } // let x = v in b
  | { kind: "pipe"; left: Expr; right: Expr; span: Span } // a |> f
  | { kind: "match"; scrutinee: Expr; arms: MatchArm[]; span: Span } // switch x { | p => e }
  | { kind: "record"; fields: Field[]; span: Span } // { x: 1, y: 2 }
  | { kind: "field"; target: Expr; name: string; span: Span } // p.x
  | { kind: "tuple"; elements: Expr[]; span: Span } // (a, b) — heterogeneous product, arity ≥ 2
  | { kind: "arr"; elements: Expr[]; span: Span } // [1, 2, 3] — eager Array
  | { kind: "list"; elements: Expr[]; span: Span } // @{1, 2, 3} — lazy List
  | { kind: "map"; entries: MapEntry[]; span: Span }; // #{ "a": 1 } — Map

// A lambda parameter: a plain name, or a record-destructuring pattern that
// binds each named field. `({ x, y }) => ...` pulls x and y out of the argument.
export type LamParam =
  | { kind: "name"; name: string }
  | { kind: "precord"; fields: string[] } // ({ x, y }) => ...
  | { kind: "ptuple"; names: string[] }; // ((a, b)) => ... — tuple-destructuring param

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
  | { kind: "ptuple"; elems: Pattern[]; span: Span } // (x, y) — tuple destructure, arity ≥ 2
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

// One field of a transparent record-type alias: `type Point = { x: number, y: a }`.
// The field type is a full `TypeExpr` (unlike a `CtorField`, whose type is a bare
// name), so aliases can carry generics and applied/nested types.
export type AliasField = { name: string; type: TypeExpr };

// A surface type expression, used in `extern` signatures. Lowercase names are
// type variables (generalized); prim names (number/string/bool/...) map to
// their HM type; others become nullary constructors.
export type TypeExpr =
  | { kind: "tname"; name: string; span: Span }
  | { kind: "tarrow"; from: TypeExpr; to: TypeExpr; span: Span }
  | { kind: "tapp"; ctor: string; args: TypeExpr[]; span: Span } // Task a, Result a e
  | { kind: "ttuple"; elems: TypeExpr[]; span: Span } // (a, b) — tuple type, arity ≥ 2
  | { kind: "tlist"; elem: TypeExpr; span: Span }; // [a]

export type Stmt =
  // `doc` is a leading `///` comment block attached by the lexer, surfaced in
  // hover as a prose paragraph below the type (the JSDoc feel).
  | {
      kind: "let";
      name: string;
      nameSpan: Span;
      value: Expr;
      exported?: boolean;
      doc?: string;
      span: Span;
    }
  // A `type` decl is EITHER a variant (`ctors` non-empty, `alias` absent) or a
  // transparent record alias (`alias` present, `ctors` empty). An alias is pure
  // structural naming: inference expands it to its row, display folds the row
  // back to the name — no nominal identity, no runtime.
  | {
      kind: "type";
      name: string;
      params: string[];
      ctors: Ctor[];
      alias?: AliasField[];
      exported?: boolean;
      span: Span;
    } // type Result a e = | Ok(a) | ... ; or type Point = { x: number, y: number }
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

// Named narrowings of the union nodes. Signatures take these instead of an
// inline `Extract<Expr, { kind: "…" }>` so the discriminant shape stays out of
// call sites (and the `no-inline-struct-type` lint stays green).
export type LambdaExpr = Extract<Expr, { kind: "lambda" }>;
export type LetInExpr = Extract<Expr, { kind: "letin" }>;
export type MatchExpr = Extract<Expr, { kind: "match" }>;
export type FieldExpr = Extract<Expr, { kind: "field" }>;
export type ListExpr = Extract<Expr, { kind: "list" }>;

export type TuplePat = Extract<Pattern, { kind: "ptuple" }>;
export type ArrPat = Extract<Pattern, { kind: "parr" }>;
export type ListPat = Extract<Pattern, { kind: "plist" }>;
export type RecordPat = Extract<Pattern, { kind: "precord" }>;
export type CtorPat = Extract<Pattern, { kind: "pctor" }>;
export type LitPat = Extract<Pattern, { kind: "plit" | "pbool" | "pstr" }>;

export type LetStmt = Extract<Stmt, { kind: "let" }>;
export type TypeStmt = Extract<Stmt, { kind: "type" }>;
export type ExternStmt = Extract<Stmt, { kind: "extern" }>;
export type ImportStmt = Extract<Stmt, { kind: "import" }>;

// A name pulled in by an `import`. `span` anchors it for diagnostics.
export type ImportName = { name: string; span: Span };

export type Program = { stmts: Stmt[] };

export const isCtorName = (name: string): boolean => /^[A-Z]/.test(name);
