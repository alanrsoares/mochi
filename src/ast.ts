// alang AST. Every node carries its source `span` for diagnostics + tooling.
import type { Span } from "./span";

export type Expr =
  | { kind: "num"; value: number; span: Span }
  | { kind: "ref"; name: string; span: Span }
  | { kind: "call"; fn: Expr; args: Expr[]; span: Span }
  | { kind: "lambda"; params: string[]; body: Expr; span: Span } // (x, y) => body
  | { kind: "pipe"; left: Expr; right: Expr; span: Span } // a |> f
  | { kind: "match"; scrutinee: Expr; arms: MatchArm[]; span: Span } // switch x { | p => e }
  | { kind: "record"; fields: Field[]; span: Span } // { x: 1, y: 2 }
  | { kind: "field"; target: Expr; name: string; span: Span }; // p.x

export type Field = { name: string; value: Expr };

export type MatchArm = { pattern: Pattern; body: Expr };

export type Pattern =
  | { kind: "pwild"; span: Span } // _
  | { kind: "pbind"; name: string; span: Span } // x
  | { kind: "plit"; value: number; span: Span } // 0
  | { kind: "pctor"; ctor: string; args: Pattern[]; span: Span }; // Circle(r)

// A variant constructor: name + typed positional fields (types are names for now).
export type Ctor = { name: string; argTypes: string[] };

export type Stmt =
  | { kind: "let"; name: string; nameSpan: Span; value: Expr; span: Span }
  | { kind: "type"; name: string; params: string[]; ctors: Ctor[]; span: Span }; // type Result a e = | Ok(a) | ...

export type Program = { stmts: Stmt[] };

export const isCtorName = (name: string): boolean => /^[A-Z]/.test(name);
