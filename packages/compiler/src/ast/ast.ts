/** mochi AST. Every node carries its source `span` for diagnostics + tooling. */
import type { Span } from "./span";

export type Expr =
  | { kind: "num"; value: number; raw: string; span: Span }
  /** `()` — the unit value, sole inhabitant of `unit` (ADR 0054). Emits `undefined`. */
  | { kind: "unit"; span: Span }
  | { kind: "bool"; value: boolean; span: Span }
  | { kind: "str"; value: string; span: Span }
  /**
   * `"…${x}…"` — string interpolation (ADR 0023). `parts` alternates literal
   * chunks and hole expressions, always starting and ending on a literal chunk
   * (free to be `""`). A hole-free `"…"` stays the plain `str` node above.
   */
  | { kind: "interp"; parts: (string | Expr)[]; span: Span }
  | { kind: "ref"; name: string; span: Span }
  /**
   * `origin` is *sugar provenance* (ADR 0011 §5): set once, by the parser
   * pass that desugared a surface form into this call, never inferred by
   * sniffing source text or callee name later. Absent on a call the user
   * wrote directly (incl. a hand-written `h(...)`). `"jsx"` marks calls
   * `jsxPlugin`'s parse hook synthesized from `<tag>…</tag>` / `<>…</>`.
   */
  | { kind: "call"; fn: Expr; args: Expr[]; origin?: "jsx"; span: Span }
  | { kind: "lambda"; params: LamParam[]; body: Expr; span: Span } // (x, y) => body, ({a, b}) => body
  /**
   * `let x = value in body` — a local binding scoped to `body`. Non-recursive:
   * `x` is NOT in scope in `value`. Generalized (let-polymorphism) like a
   * top-level `let`. `nameSpan` anchors the bound name for hover.
   */
  | {
      kind: "letin";
      name: string;
      nameSpan: Span;
      annot?: TypeExpr;
      value: Expr;
      body: Expr;
      span: Span;
    } // let x [: T] = v in b
  /**
   * `let?` / `let!` — monadic bind (ADR 0005, ADR 0006, ADR 0079). `monad`
   * selects the runtime helper:
   * - `"Option"` / `"Result"` (`let?`): infer dispatches from the value's
   *   head constructor. Option binds `Some(a)` and requires an `Option b`
   *   body; Result binds `Ok(a)` and requires a `Result b e` body. Parser
   *   tags `let?` as `"Result"`; infer rewrites `"Option"` when the head is
   *   Option. Lowers to `_Option_flatMap` / `_Result_flatMap`.
   * - `"Task"` (`let!`): value is `Task a e`; payload binds `param`; body is
   *   `Task b e`. Lowers to `_Task_andThen`.
   * Param is any lambda form (name / tuple / record). Infix bind for both is deferred.
   */
  | {
      kind: "letbind";
      monad: "Option" | "Result" | "Task";
      param: LamParam;
      paramSpan: Span;
      value: Expr;
      body: Expr;
      span: Span;
    }
  | { kind: "pipe"; left: Expr; right: Expr; fast?: boolean; span: Span } // a |> f / a->f(b)
  /** `do { effect(); result }` — ordered unit effects followed by a result. */
  | { kind: "do"; exprs: Expr[]; span: Span }
  /**
   * `cond ? then : else` — the boolean conditional as an expression (ADR 0016).
   * Right-associative, binds looser than `|>`; branches are full expressions.
   */
  | { kind: "ternary"; cond: Expr; then: Expr; else: Expr; span: Span }
  | { kind: "match"; scrutinee: Expr; arms: MatchArm[]; span: Span } // switch x { | p => e }
  /**
   * `{ x: 1, y: 2 }` — a record literal. With `spread` (`{ ...base, x: 1 }`,
   * ADR 0021) it's a functional UPDATE: `base` must already carry each listed
   * field at a unifiable type, and the result has `base`'s type (fields replaced
   * in-kind, never added).
   */
  | { kind: "record"; fields: Field[]; spread?: Expr; span: Span }
  | { kind: "field"; target: Expr; name: string; span: Span } // p.x
  | { kind: "tuple"; elements: Expr[]; span: Span } // (a, b) — heterogeneous product, arity ≥ 2
  /** `[1, 2]` / `[a, ...xs, b]` — eager Array. Slots are exprs or spreads (ADR 0001). */
  | { kind: "arr"; elements: SeqElem[]; span: Span }
  /** `@{1, 2}` / `@{a, ...xs}` — lazy List. Same slot model; spreads must be List. */
  | { kind: "list"; elements: SeqElem[]; span: Span }
  /**
   * `#{1, 2}` / `#{a, ...s}` — Set (native; dedupes). `#{}` alone stays Map (empty).
   * Disambiguated from Map by absence of `:` after the first key expr.
   */
  | { kind: "set"; elements: SeqElem[]; span: Span }
  | { kind: "map"; entries: MapEntry[]; span: Span } // #{ "a": 1 } — Map
  /**
   * `loop (acc = 0, i = 0) { body }` — tail-recursion loop expression
   * (ADR 0056). Params are rebound by `recur` in tail position; any non-recur
   * tail value is the loop's result. Emits an idiomatic JS `while` loop.
   */
  | { kind: "loop"; params: LoopParam[]; body: Expr; span: Span }
  /**
   * `recur(a, b)` — continue the NEAREST enclosing `loop` with new param
   * values (ADR 0056). Only legal in tail position; arity must match the
   * loop's params. Checked in `checkLoops`, not the parser.
   */
  | { kind: "recur"; args: Expr[]; span: Span };

/** One `name = init` binder in a `loop (…)` head (ADR 0056). */
export type LoopParam = { name: string; nameSpan: Span; init: Expr };

/** One slot in an Array / List / Set literal: a value, or `...xs` splicing another collection of the same kind. */
export type SeqElem = { kind: "expr"; expr: Expr } | { kind: "spread"; expr: Expr };

/** A lambda parameter: a plain name, or a record-destructuring pattern that binds each named field. `({ x, y }) => ...` pulls x and y out of the argument. */
export type LamParam =
  | { kind: "name"; name: string; span: Span; annot?: TypeExpr } // span anchors the bound name for nav
  | { kind: "precord"; fields: string[]; fieldSpans: Span[] } // ({ x, y }) => ...
  | { kind: "ptuple"; names: string[]; nameSpans: Span[] }; // ((a, b)) => ... — tuple-destructuring param

export type Field = { name: string; nameSpan: Span; value: Expr };

/** One `key: value` pair in a `#{…}` map literal. The key is a full expression (usually a string/number literal), not an identifier like a record field. */
export type MapEntry = { key: Expr; value: Expr };

/** `guard` is the optional `when <expr>` clause: the arm matches only when the pattern matches AND the guard (with the pattern's binds in scope) is true. */
export type MatchArm = { pattern: Pattern; guard?: Expr; body: Expr };

export type Pattern =
  | { kind: "pwild"; span: Span } // _
  /** `()` — matches the sole inhabitant of `unit`, like any nullary variant ctor (ADR 0054). */
  | { kind: "punit"; span: Span }
  | { kind: "pbind"; name: string; span: Span } // x
  | { kind: "pas"; pat: Pattern; name: string; nameSpan: Span; span: Span } // pat as name
  | { kind: "plit"; value: number; raw: string; span: Span } // 0
  | { kind: "pbool"; value: boolean; span: Span } // true / false
  | { kind: "pstr"; value: string; span: Span } // "foo"
  | { kind: "ptuple"; elems: Pattern[]; span: Span } // (x, y) — tuple destructure, arity ≥ 2
  | { kind: "precord"; fields: PatField[]; span: Span } // { x, status: "err" }
  /** `Circle(r)`, or `Alias.Circle(r)` after `import * as Alias` (ADR 0002). */
  | { kind: "pctor"; ctor: string; args: Pattern[]; span: Span; ns?: string }
  /**
   * `[]`, `[x]`, `[x, y]`, `[head, ...tail]` — `rest` (a bind/wild) captures the
   * tail after a `...`; null means the pattern matches a list of exactly
   * `elems.length`.
   */
  | { kind: "parr"; elems: Pattern[]; rest: Pattern | null; span: Span }
  /**
   * `@{}`, `@{head, ...tail}` — lazy-List destructuring. Slice 1 supports only
   * the empty and single-head-cons forms (see check.ts); `rest` is a bind/wild.
   */
  | { kind: "plist"; elems: Pattern[]; rest: Pattern | null; span: Span }
  /**
   * `A | B | …` — or-pattern (ADR 0022). Only at an arm's top level (never nested).
   * Every alt binds the same names at the same position, unified in `infer`.
   */
  | { kind: "por"; alts: Pattern[]; span: Span };

/** A field inside a record pattern: `{ x }` puns to `pbind x`; `{ x: p }` matches field `x` against sub-pattern `p` (a literal narrows, a name binds). */
export type PatField = { label: string; labelSpan: Span; pat: Pattern };

/**
 * A variant constructor: name + ordered fields. Each field has a full type expression and an OPTIONAL label. A labelled field lowers to that runtime key (`Ok(value: a)` → `{ _tag: "Ok", value }`), matching the @onrails ecosystem; an unlabelled field falls back to its positional key `_0`, `_1`, …
 *
 * The type is a `TypeExpr`, so payloads can be lists, applied types, arrows, and tuples (`ECall(fn: Expr, args: [Expr])`) — see ADR 0015.
 */
export type Ctor = { name: string; fields: CtorField[]; span: Span };
export type CtorField = { name: string | null; type: TypeExpr };

/** One field of a transparent record-type alias: `type Point = { x: number, y: a }`. The field type is a full `TypeExpr` (like a `CtorField`'s), so aliases can carry generics and applied/nested types. */
export type AliasField = { name: string; nameSpan: Span; type: TypeExpr };

/** A surface type expression, used in `extern` signatures. Lowercase names are type variables (generalized); prim names (number/string/bool/...) map to their HM type; others become nullary constructors. */
export type TypeExpr =
  | { kind: "tname"; name: string; span: Span }
  | { kind: "tarrow"; from: TypeExpr; to: TypeExpr; span: Span }
  | { kind: "tapp"; ctor: string; args: TypeExpr[]; span: Span } // Task a, Result a e
  | { kind: "ttuple"; elems: TypeExpr[]; span: Span } // (a, b) — tuple type, arity ≥ 2
  | { kind: "tlist"; elem: TypeExpr; span: Span } // [a]
  /**
   * alias-qualified type name: `Alias.Name` (nullary, `args: []`) or `Alias.Name a b`
   * (applied, `args` non-empty) — e.g. `D.Shape`, `D.Result e a`. One variant covers
   * both arities (unlike the unqualified `tname`/`tapp` split) because a qualified name
   * is always a constructor reference, never a type variable: the lowercase/uppercase
   * branch that motivates the unqualified split doesn't apply once a dot is involved.
   * Resolution through the import graph is a later C5 slice (ADR 0046) — for now this
   * node parses and round-trips but `check`/`schemes` report it as unresolved.
   */
  | {
      kind: "tqual";
      alias: string;
      name: string;
      nameSpan: Span;
      args: readonly TypeExpr[];
      span: Span;
    } // D.Shape, D.Result e a
  /** `"rose"` — string singleton in type position (ADR 0081). */
  | { kind: "tlit"; value: string; span: Span }
  /** `"rose" | "amber"` — finite union; parser never emits a singleton. */
  | { kind: "tunion"; members: TypeExpr[]; span: Span };

export type Stmt =
  /**
   * `doc` is a leading `///` comment block attached by the lexer, surfaced in
   * hover as a prose paragraph below the type (the JSDoc feel).
   */
  | {
      kind: "let";
      name: string;
      nameSpan: Span;
      annot?: TypeExpr; // `let x : T = v` — optional binding type annotation
      value: Expr;
      exported?: boolean;
      doc?: string;
      span: Span;
    }
  /**
   * A `type` decl is a variant (`ctors` non-empty), a transparent record alias
   * (`alias` present), or a TypeExpr synonym (`aliasType` present, e.g.
   * `type Tone = "rose" | "amber"` — ADR 0081). An alias is pure structural
   * naming: inference expands it, display folds matching types back to the name.
   */
  | {
      kind: "type";
      name: string;
      nameSpan: Span;
      params: string[];
      ctors: Ctor[];
      alias?: AliasField[];
      aliasType?: TypeExpr;
      exported?: boolean;
      span: Span;
    } // type Result a e = | Ok(a) | ... ; type Point = { x: number }; type Tone = "rose" | "amber"
  /** `extern name<T> : type = "module" "export"` — bind an external JS/TS function. */
  | {
      kind: "extern";
      name: string;
      nameSpan: Span;
      /** Explicit generic binders, written TypeScript-style as `<T, U>`. */
      params: string[];
      typeExpr: TypeExpr;
      module: string;
      imported: string;
      /**
       * `= curried "./m" "f"` — the HOST is written curried (`a => b => c`), not
       * flat (`(a, b) => c`). A calling convention like `send`/`new` (ADR 0059,
       * 0064), not a property of the type: the signature always describes
       * mochi-side usage, and codegen adapts the host to it.
       */
      curried?: boolean;
      exported?: boolean;
      /** Leading `///` — same attachment as `let` (tracer #52). */
      doc?: string;
      span: Span;
    }
  /**
   * `import { a, b } from "./mod"` — named exports into the local env.
   * `import * as Alias from "./mod"` — whole module as a user namespace (ADR 0002);
   * `alias` set, `names` empty.
   */
  | { kind: "import"; names: ImportName[]; alias: ImportName | null; from: string; span: Span }
  /**
   * An unparsable region the parser skipped to recover (ADR 0045). `span` covers
   * every byte skipped — from the token that failed through the last one consumed
   * before the sync point — so the formatter can pass the raw slice through
   * untouched. Carries no message: the diagnostics are the diagnostic channel.
   *
   * It contributes no bindings and no type vars, and codegen never sees one (the
   * railway stops on parse diagnostics).
   */
  | { kind: "error"; span: Span };

/** Named narrowings of the union nodes. Signatures take these instead of an inline `Extract<Expr, { kind: "…" }>` so the discriminant shape stays out of call sites (and the `no-inline-struct-type` lint stays green). */
export type LambdaExpr = Extract<Expr, { kind: "lambda" }>;
export type TernaryExpr = Extract<Expr, { kind: "ternary" }>;
export type LetInExpr = Extract<Expr, { kind: "letin" }>;
export type LoopExpr = Extract<Expr, { kind: "loop" }>;
export type RecurExpr = Extract<Expr, { kind: "recur" }>;
export type LetBindExpr = Extract<Expr, { kind: "letbind" }>;
export type MatchExpr = Extract<Expr, { kind: "match" }>;
export type FieldExpr = Extract<Expr, { kind: "field" }>;
export type ListExpr = Extract<Expr, { kind: "list" }>;
export type ArrExpr = Extract<Expr, { kind: "arr" }>;
export type SetExpr = Extract<Expr, { kind: "set" }>;
export type CallExpr = Extract<Expr, { kind: "call" }>;
export type RecordExpr = Extract<Expr, { kind: "record" }>;
export type MapExpr = Extract<Expr, { kind: "map" }>;
export type PipeExpr = Extract<Expr, { kind: "pipe" }>;
export type InterpExpr = Extract<Expr, { kind: "interp" }>;

export type TuplePat = Extract<Pattern, { kind: "ptuple" }>;
export type ArrPat = Extract<Pattern, { kind: "parr" }>;
export type ListPat = Extract<Pattern, { kind: "plist" }>;
export type RecordPat = Extract<Pattern, { kind: "precord" }>;
export type CtorPat = Extract<Pattern, { kind: "pctor" }>;
export type OrPat = Extract<Pattern, { kind: "por" }>;
export type LitPat = Extract<Pattern, { kind: "plit" | "pbool" | "pstr" }>;

export type QualTypeExpr = Extract<TypeExpr, { kind: "tqual" }>;

export type LetStmt = Extract<Stmt, { kind: "let" }>;
export type TypeStmt = Extract<Stmt, { kind: "type" }>;
export type ExternStmt = Extract<Stmt, { kind: "extern" }>;
export type ImportStmt = Extract<Stmt, { kind: "import" }>;
export type ErrorStmt = Extract<Stmt, { kind: "error" }>;

/** A name pulled in by an `import`. `span` anchors it for diagnostics. */
export type ImportName = { name: string; span: Span };

export type Program = { stmts: Stmt[] };

export const isCtorName = (name: string): boolean => /^[A-Z]/.test(name);
