import type { Expr, Stmt } from "@mochi/compiler/bootstrap/types";
import type { Option } from "@mochi/compiler/runtime";
import type { Program } from "./transform.ts";

type LamParam = Extract<Expr, { _tag: "ELambda" }>["params"][number];
type SeqElem = Extract<Expr, { _tag: "EArr" }>["elements"][number];

const mapOption = <A>(o: Option<A>, fn: (a: A) => A): Option<A> =>
  o._tag === "Some" ? { _tag: "Some", value: fn(o.value) } : o;

/** Map every top-level statement. */
export const mapStmts = (prog: Program, fn: (stmt: Stmt) => Stmt): Program => prog.map(fn);

/** Map every expression subtree (statements are not entered). */
export const mapExpr = (expr: Expr, fn: (e: Expr) => Expr): Expr => {
  const param = (p: LamParam): LamParam => {
    switch (p._tag) {
      case "LPLabeled":
        return { ...p, defaultValue: mapOption(p.defaultValue, walk) };
      case "LPSpanned":
        return { ...p, param: param(p.param) };
      case "LPName":
      case "LPRecord":
      case "LPTuple":
        return p;
    }
  };
  const elem = (el: SeqElem): SeqElem => ({ ...el, expr: walk(el.expr) });
  const walk = (e: Expr): Expr => {
    const next = fn(e);
    switch (next._tag) {
      case "ENum":
      case "EBool":
      case "EStr":
      case "ERef":
      case "EUnit":
        return next;
      case "EInterp":
        return {
          ...next,
          parts: next.parts.map((p) => (p._tag === "IPExpr" ? { ...p, expr: walk(p.expr) } : p)),
        };
      case "ECall":
        return { ...next, fn: walk(next.fn), args: next.args.map(walk) };
      case "ELambda":
        return { ...next, params: next.params.map(param), body: walk(next.body) };
      case "ELoop":
        return {
          ...next,
          params: next.params.map((lp) => ({ ...lp, init: walk(lp.init) })),
          body: walk(next.body),
        };
      case "ERecur":
        return { ...next, args: next.args.map(walk) };
      case "ELetIn":
        return { ...next, value: walk(next.value), body: walk(next.body) };
      case "ELetBind":
        return {
          ...next,
          param: param(next.param),
          value: walk(next.value),
          body: walk(next.body),
        };
      case "EPipe":
        return { ...next, left: walk(next.left), right: walk(next.right) };
      case "EDo":
        return { ...next, exprs: next.exprs.map(walk) };
      case "ETernary":
        return {
          ...next,
          cond: walk(next.cond),
          thenE: walk(next.thenE),
          elseE: walk(next.elseE),
        };
      case "EMatch":
        return {
          ...next,
          scrutinee: walk(next.scrutinee),
          arms: next.arms.map((a) => ({
            ...a,
            guard: mapOption(a.guard, walk),
            body: walk(a.body),
          })),
        };
      case "ERecord":
        return {
          ...next,
          fields: next.fields.map((f) => ({ ...f, value: walk(f.value) })),
          spread: mapOption(next.spread, walk),
        };
      case "EField":
        return { ...next, target: walk(next.target) };
      case "ETuple":
        return { ...next, elements: next.elements.map(walk) };
      case "EArr":
      case "EList":
      case "ESet":
        return { ...next, elements: next.elements.map(elem) };
      case "EMap":
        return {
          ...next,
          entries: next.entries.map((en) => ({ key: walk(en.key), value: walk(en.value) })),
        };
    }
  };
  return walk(expr);
};

/** Map expressions inside every statement. */
export const mapProgramExprs = (prog: Program, fn: (e: Expr) => Expr): Program =>
  mapStmts(prog, (stmt) => {
    switch (stmt._tag) {
      case "SLet":
      case "SExpr":
        return { ...stmt, value: mapExpr(stmt.value, fn) };
      case "SType":
      case "SExtern":
      case "SImport":
      case "SImportNs":
      case "SError":
        return stmt;
    }
  });
