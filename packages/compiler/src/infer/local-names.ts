/**
 * Every name a program binds *locally* — lambda params, `let … in`, monadic
 * binds, `switch` pattern binders, `loop` params.
 *
 * Only `inferRef`'s open-world branch uses this. Open mode (`"use open"`) hands
 * an unknown ref a fresh type var, because it's assumed to be a host global
 * (`window`, `localStorage`, an ambient `h`). That assumption is right for a
 * name the module never binds and wrong for one it does: a ref that escaped its
 * binder's scope is a typo or a scoping mistake, not a global. Emitting it
 * unchecked produces JS that throws `ReferenceError` at runtime, which is
 * exactly what open mode is supposed to be trading away.
 *
 * Top-level `let`s are deliberately absent — they're in `env` everywhere, so a
 * ref to one never reaches the open-world branch.
 */

import { match } from "@onrails/pattern";
import type { Expr, LamParam, Pattern, Program } from "../ast/ast";

const paramNames = (p: LamParam, out: Set<string>): void => {
  match(p)
    .with({ kind: "name" }, (name) => void out.add(name.name))
    .with({ kind: "precord" }, (precord) => {
      for (const f of precord.fields) out.add(f);
    })
    .with({ kind: "ptuple" }, (ptuple) => {
      for (const n of ptuple.names) out.add(n);
    })
    .exhaustive();
};

const patternNames = (p: Pattern, out: Set<string>): void => {
  match(p)
    .with({ kind: "pas" }, (pas) => {
      out.add(pas.name);
      patternNames(pas.pat, out);
    })
    .with({ kind: "pbind" }, (pbind) => void out.add(pbind.name))
    .with({ kind: "ptuple" }, (ptuple) => {
      for (const e of ptuple.elems) patternNames(e, out);
    })
    .with({ kind: "precord" }, (precord) => {
      for (const f of precord.fields) patternNames(f.pat, out);
    })
    .with({ kind: "pctor" }, (pctor) => {
      for (const a of pctor.args) patternNames(a, out);
    })
    .with({ kind: "parr" }, (parr) => {
      for (const e of [...parr.elems, ...(parr.rest ? [parr.rest] : [])]) patternNames(e, out);
    })
    .with({ kind: "plist" }, (plist) => {
      for (const e of [...plist.elems, ...(plist.rest ? [plist.rest] : [])]) patternNames(e, out);
    })
    .with({ kind: "por" }, (por) => {
      for (const a of por.alts) patternNames(a, out);
    })
    .withOneOf(
      [{ kind: "pwild" }, { kind: "punit" }, { kind: "plit" }, { kind: "pbool" }, { kind: "pstr" }],
      () => {},
    )
    .exhaustive();
};

const exprNames = (e: Expr, out: Set<string>): void => {
  match(e)
    .withOneOf(
      [{ kind: "num" }, { kind: "bool" }, { kind: "str" }, { kind: "ref" }, { kind: "unit" }],
      () => {},
    )
    .with({ kind: "interp" }, (interp) => {
      for (const p of interp.parts) if (typeof p !== "string") exprNames(p, out);
    })
    .with({ kind: "call" }, (call) => {
      exprNames(call.fn, out);
      for (const a of call.args) exprNames(a, out);
    })
    .with({ kind: "lambda" }, (lambda) => {
      for (const p of lambda.params) paramNames(p, out);
      exprNames(lambda.body, out);
    })
    .with({ kind: "letin" }, (letin) => {
      out.add(letin.name);
      exprNames(letin.value, out);
      exprNames(letin.body, out);
    })
    .with({ kind: "letbind" }, (letbind) => {
      paramNames(letbind.param, out);
      exprNames(letbind.value, out);
      exprNames(letbind.body, out);
    })
    .with({ kind: "pipe" }, (pipe) => {
      exprNames(pipe.left, out);
      exprNames(pipe.right, out);
    })
    .with({ kind: "do" }, (block) => {
      for (const expr of block.exprs) exprNames(expr, out);
    })
    .with({ kind: "ternary" }, (ternary) => {
      exprNames(ternary.cond, out);
      exprNames(ternary.then, out);
      exprNames(ternary.else, out);
    })
    .with({ kind: "match" }, (matchExpr) => {
      exprNames(matchExpr.scrutinee, out);
      for (const a of matchExpr.arms) {
        patternNames(a.pattern, out);
        if (a.guard) exprNames(a.guard, out);
        exprNames(a.body, out);
      }
    })
    .with({ kind: "record" }, (record) => {
      if (record.spread) exprNames(record.spread, out);
      for (const f of record.fields) exprNames(f.value, out);
    })
    .with({ kind: "field" }, (field) => {
      exprNames(field.target, out);
    })
    .with({ kind: "loop" }, (loop) => {
      for (const p of loop.params) {
        out.add(p.name);
        exprNames(p.init, out);
      }
      exprNames(loop.body, out);
    })
    .with({ kind: "recur" }, (recur) => {
      for (const a of recur.args) exprNames(a, out);
    })
    .with({ kind: "tuple" }, (tuple) => {
      for (const el of tuple.elements) exprNames(el, out);
    })
    .withOneOf([{ kind: "arr" }, { kind: "list" }, { kind: "set" }], (seq) => {
      for (const el of seq.elements) exprNames(el.expr, out);
    })
    .with({ kind: "map" }, (mapExpr) => {
      for (const ent of mapExpr.entries) {
        exprNames(ent.key, out);
        exprNames(ent.value, out);
      }
    })
    .exhaustive();
};

/** Names bound by some local binder anywhere in `prog`. */
export const localBinderNames = (prog: Program): ReadonlySet<string> => {
  const out = new Set<string>();
  for (const s of prog.stmts) if (s.kind === "let" || s.kind === "expr") exprNames(s.value, out);
  return out;
};
