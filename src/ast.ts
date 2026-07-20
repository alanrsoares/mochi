// alang AST
export type Expr =
  | { kind: "num"; value: number }
  | { kind: "ref"; name: string }
  | { kind: "call"; fn: Expr; args: Expr[] }
  | { kind: "lambda"; params: string[]; body: Expr } // (x, y) => body
  | { kind: "pipe"; left: Expr; right: Expr } // a |> f
  | { kind: "match"; scrutinee: Expr; arms: MatchArm[] } // switch x { | p => e }
  | { kind: "record"; fields: Field[] } // { x: 1, y: 2 }
  | { kind: "field"; target: Expr; name: string }; // p.x

export type Field = { name: string; value: Expr };

export type MatchArm = { pattern: Pattern; body: Expr };

export type Pattern =
  | { kind: "pwild" } // _
  | { kind: "pbind"; name: string } // x
  | { kind: "plit"; value: number } // 0
  | { kind: "pctor"; ctor: string; args: Pattern[] }; // Circle(r)

// A variant constructor: name + typed positional fields (types are names for now).
export type Ctor = { name: string; argTypes: string[] };

export type Stmt =
  | { kind: "let"; name: string; value: Expr }
  | { kind: "type"; name: string; ctors: Ctor[] }; // type Shape = | Circle(float) | ...

export type Program = { stmts: Stmt[] };

export const isCtorName = (name: string): boolean => /^[A-Z]/.test(name);
