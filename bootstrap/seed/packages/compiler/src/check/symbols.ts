import type {
  AliasField,
  Ctor,
  CtorField,
  Expr,
  Field,
  InterpPart,
  LamParam,
  LoopParam,
  MapEntry,
  MatchArm,
  Name,
  PatField,
  Pattern,
  SeqElem,
  Stmt,
  TypeExpr,
} from "../ast/ast";
import type { SpanAt } from "../infer/types";

/**
 * A declaration site: the file it lives in and its name span.
 */
export type Loc = { path: string; start: number; end: number };
/**
 * One def or use of a binding. `space` is "value", "type", "ctor" or "field".
 */
export type SymOccurrence = {
  name: string;
  space: string;
  defPath: string;
  defStart: number;
  defEnd: number;
  start: number;
  end: number;
  role: string;
};
/**
 * Export sites of a module, keyed by name in each space. A variant's ctors
 * are also values: an import list names them like any value.
 */
export type Origins = {
  values: Map<string, Loc>;
  types: Map<string, Loc>;
  ctors: Map<string, Loc>;
};
/**
 * The host's virtual prelude: builtin defs, plus namespace members keyed
 * `Ns.member` (`Array.map`).
 */
export type SymPrelude = { origins: Origins; members: Map<string, Loc> };
/**
 * One lexical scope below module scope: the value binders it introduces,
 * live across `start..end` (a lambda, a `let … in` body, an arm, …).
 * Completion overlays these on module scope, widest first (ADR 0120).
 */
export type ScopeFrame = { start: number; end: number; binds: Map<string, Loc> };
/**
 * A file's index. `top` holds its module-scope bindings, imports included;
 * `fields` the record field names it declares or first mentions; `frames`
 * every local scope, inner scopes before the scopes that enclose them.
 */
export type SymIndex = {
  occurrences: SymOccurrence[];
  top: Origins;
  fields: Map<string, Loc>;
  frames: ScopeFrame[];
};
/**
 * Single-file value occurrence, as `index` reports it.
 */
export type Occurrence = {
  name: string;
  defStart: number;
  defEnd: number;
  start: number;
  end: number;
  role: string;
};
export type SymEnv = { path: string; top: Origins; prelude: SymPrelude; locals: Map<string, Loc> };
/**
 * A walk's occurrences, the field table after it, and the scopes it met.
 * Field names are one file-wide table: the first site is the def, every
 * later site a use.
 */
export type Walked = { occs: SymOccurrence[]; fields: Map<string, Loc>; frames: ScopeFrame[] };
/**
 * A pattern or parameter walk also yields the scope its binders extend.
 */
export type BoundScope = {
  env: SymEnv;
  occs: SymOccurrence[];
  fields: Map<string, Loc>;
  frames: ScopeFrame[];
};
/**
 * An adjacent run of lambda `let … in`s: one recursive scope (ADR 0067).
 */
export type LetRun = { binders: [string, SpanAt, Option<TypeExpr>, Expr][]; tail: Expr };
/**
 * Module-scope bindings as the top-level walk leaves them.
 */
export type TopScope = { top: Origins; occs: SymOccurrence[]; fields: Map<string, Loc> };

import type { Option, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Array_concat,
  _Array_contains,
  _Array_flatMap,
  _Array_get,
  _Map_get,
  _Map_keys,
  _Map_set,
  _Map_size,
  _Option_match,
  _Str_codeAt,
  _Str_length,
  _Str_startsWith,
  _curry,
  _keyOf,
  _tuple,
  add,
  and,
  eq,
  filter,
  lte,
  map,
  not,
  or,
  reduce,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "../ast/ast";
import { exprSpan, patSpan } from "../infer/infer";

const emptyOrigins: Origins = {
  values: new Map<string, Loc>(),
  types: new Map<string, Loc>(),
  ctors: new Map<string, Loc>(),
};
const occ$ = (
  name: string,
  space: string,
  def: Loc,
  span: SpanAt,
  role: string,
): SymOccurrence => ({
  name: name,
  space: space,
  defPath: def.path,
  defStart: def.start,
  defEnd: def.end,
  start: span.start,
  end: span.end,
  role: role,
});
const locOf$ = (env: SymEnv, span: SpanAt): Loc => ({
  path: env.path,
  start: span.start,
  end: span.end,
});
const upperStart: (s: string) => boolean = (s: string) =>
  _Option_match(
    _Str_codeAt(0, s),
    () => false,
    (c) => and(c >= 65, c <= 90),
  );
const parked: (a: string) => boolean = _Str_startsWith("$");
const orElse$ = (first: Option<Loc>, second: () => Option<Loc>): Option<Loc> =>
  _Option_match(
    first,
    () => second(),
    (loc) => Some(loc) as Option<Loc>,
  );
const lookup$ = (env: SymEnv, space: string, name: string): Option<Loc> =>
  ((_v) =>
    _v === "value"
      ? orElse$(_Map_get(name, env.locals), () =>
          orElse$(_Map_get(name, env.top.values), () => _Map_get(name, env.prelude.origins.values)),
        )
      : _v === "type"
        ? orElse$(_Map_get(name, env.top.types), () => _Map_get(name, env.prelude.origins.types))
        : orElse$(_Map_get(name, env.top.ctors), () => _Map_get(name, env.prelude.origins.ctors)))(
    space,
  );
const use$ = (env: SymEnv, space: string, name: string, span: SpanAt): SymOccurrence[] =>
  _Option_match(
    lookup$(env, space, name),
    () => [] as SymOccurrence[],
    (def) => [occ$(name, space, def, span, "use")],
  );
const walked$ = (occs: SymOccurrence[], fields: Map<string, Loc>): Walked => ({
  occs: occs,
  fields: fields,
  frames: [] as ScopeFrame[],
});
const none: (fields: Map<string, Loc>) => Walked = (fields: Map<string, Loc>) =>
  walked$([] as SymOccurrence[], fields);
/**
 * Run `rest` on the field table `first` leaves, and join their occurrences.
 */
const andThen$ = (first: Walked, rest: (a: Map<string, Loc>) => Walked): Walked => {
  const second: Walked = rest(first.fields);
  return {
    occs: _Array_concat(first.occs, second.occs),
    fields: second.fields,
    frames: _Array_concat(first.frames, second.frames),
  };
};
const prefixed$ = (occs: SymOccurrence[], w: Walked): Walked => ({
  occs: _Array_concat(occs, w.occs),
  fields: w.fields,
  frames: w.frames,
});
const sameLoc$ = (a: Option<Loc>, b: Option<Loc>): boolean =>
  ((_v) =>
    _v[0]._tag === "Some" && _v[1]._tag === "Some"
      ? (([{ value: x }, { value: y }]) =>
          and(and(eq(x.start, y.start), eq(x.end, y.end)), eq(x.path, y.path)))(
          _v as [
            Extract<[Option<Loc>, Option<Loc>][0], { _tag: "Some" }>,
            Extract<[Option<Loc>, Option<Loc>][1], { _tag: "Some" }>,
          ],
        )
      : _v[0]._tag === "None" && _v[1]._tag === "None"
        ? true
        : false)(_tuple(a, b));
/**
 * The value binders `inner` holds that `outer` does not (or rebinds).
 */
const newBinds$ = (outer: SymEnv, inner: SymEnv): Map<string, Loc> =>
  reduce(
    _curry(2, (acc: Map<string, Loc>, name: string) =>
      or(sameLoc$(_Map_get(name, outer.locals), _Map_get(name, inner.locals)), parked(name))
        ? acc
        : _Option_match(
            _Map_get(name, inner.locals),
            () => acc,
            (def) => _Map_set(name, def, acc),
          ),
    ),
    new Map<string, Loc>(),
    _Map_keys(inner.locals),
  );
/**
 * Close a scope: record the binders `inner` added over `outer` as a frame
 * live across `sp`, after the frames nested inside it.
 */
const framed$ = (outer: SymEnv, inner: SymEnv, sp: SpanAt, w: Walked): Walked => {
  const binds: Map<string, Loc> = newBinds$(outer, inner);
  return _Map_size(binds) === 0
    ? w
    : {
        occs: w.occs,
        fields: w.fields,
        frames: _Array_append({ start: sp.start, end: sp.end, binds: binds }, w.frames),
      };
};
const touchField$ = (env: SymEnv, name: string, span: SpanAt, fields: Map<string, Loc>): Walked =>
  _Option_match(
    _Map_get(name, fields),
    () => {
      const def: Loc = locOf$(env, span);
      return walked$([occ$(name, "field", def, span, "def")], _Map_set(name, def, fields));
    },
    (def) => walked$([occ$(name, "field", def, span, "use")], fields),
  );
/**
 * Bind a local value in `env`'s innermost scope.
 */
const bindLocal$ = (
  env: SymEnv,
  name: string,
  span: SpanAt,
): { env: SymEnv; occ: SymOccurrence } => {
  const def: Loc = locOf$(env, span);
  return {
    env: {
      path: env.path,
      top: env.top,
      prelude: env.prelude,
      locals: _Map_set(name, def, env.locals),
    },
    occ: occ$(name, "value", def, span, "def"),
  };
};
const bound$ = (env: SymEnv, occs: SymOccurrence[], fields: Map<string, Loc>): BoundScope => ({
  env: env,
  occs: occs,
  fields: fields,
  frames: [] as ScopeFrame[],
});
/**
 * `bound`, keeping the frames of an expression walked on the way (a default).
 */
const boundWith$ = (env: SymEnv, occs: SymOccurrence[], w: Walked): BoundScope => ({
  env: env,
  occs: occs,
  fields: w.fields,
  frames: w.frames,
});
const bindName$ = (
  env: SymEnv,
  name: string,
  span: SpanAt,
  fields: Map<string, Loc>,
): BoundScope => {
  const b: { env: SymEnv; occ: SymOccurrence } = bindLocal$(env, name, span);
  return bound$(b.env, [b.occ], fields);
};
/**
 * Continue a binder walk: `rest` sees the scope and field table `first` left.
 */
const boundThen$ = (
  first: BoundScope,
  rest: (a: SymEnv, b: Map<string, Loc>) => BoundScope,
): BoundScope => {
  const second: BoundScope = rest(first.env, first.fields);
  return {
    env: second.env,
    occs: _Array_concat(first.occs, second.occs),
    fields: second.fields,
    frames: _Array_concat(first.frames, second.frames),
  };
};
const bindNames$ = (
  env: SymEnv,
  names: string[],
  spans: SpanAt[],
  i: number,
  fields: Map<string, Loc>,
): BoundScope =>
  ((_v) =>
    _v[0]._tag === "Some" && _v[1]._tag === "Some"
      ? (([{ value: name }, { value: span }]) =>
          boundThen$(
            bindName$(env, name, span, fields),
            _curry(2, (e: SymEnv, fs: Map<string, Loc>) => bindNames$(e, names, spans, i + 1, fs)),
          ))(
          _v as [
            Extract<[Option<string>, Option<SpanAt>][0], { _tag: "Some" }>,
            Extract<[Option<string>, Option<SpanAt>][1], { _tag: "Some" }>,
          ],
        )
      : bound$(env, [] as SymOccurrence[], fields))(
    _tuple(_Array_get(i, names), _Array_get(i, spans)),
  );
const walkTypes$ = (env: SymEnv, types: TypeExpr[], i: number): SymOccurrence[] =>
  _Option_match(
    _Array_get(i, types),
    () => [] as SymOccurrence[],
    (t) => _Array_concat(walkType$(env, t), walkTypes$(env, types, i + 1)),
  );
const walkType$ = (env: SymEnv, t: TypeExpr): SymOccurrence[] => {
  const $match = t;
  switch ($match._tag) {
    case "TyName": {
      const { name, span } = $match;
      return upperStart(name) ? use$(env, "type", name, span) : ([] as SymOccurrence[]);
    }
    case "TyArrow": {
      const { from, to } = $match;
      return _Array_concat(walkType$(env, from), walkType$(env, to));
    }
    case "TyApp": {
      const { ctor, args, span } = $match;
      return _Array_concat(use$(env, "type", ctor, span), walkTypes$(env, args, 0));
    }
    case "TyTuple": {
      const { elems } = $match;
      return walkTypes$(env, elems, 0);
    }
    case "TyList": {
      const { elem } = $match;
      return walkType$(env, elem);
    }
    case "TyQual": {
      const { alias, name, nameSpan, args } = $match;
      return _Array_concat(
        use$(env, "type", `${alias}.${name}`, nameSpan),
        walkTypes$(env, args, 0),
      );
    }
    case "TyLit": {
      return [] as SymOccurrence[];
    }
    case "TyUnion": {
      const { members } = $match;
      return walkTypes$(env, members, 0);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const walkAnnot$ = (env: SymEnv, annot: Option<TypeExpr>): SymOccurrence[] =>
  _Option_match(
    annot,
    () => [] as SymOccurrence[],
    (t) => walkType$(env, t),
  );
const bindParam$ = (env: SymEnv, param: LamParam, fields: Map<string, Loc>): BoundScope =>
  ((_v) =>
    _v._tag === "LPSpanned" && _v.param._tag === "LPName" && _v.nameSpans.length === 1
      ? (({ param: { name, annot }, nameSpans: [span] }) =>
          ((annotOccs: SymOccurrence[]) =>
            parked(name)
              ? bound$(env, annotOccs, fields)
              : ((b: { env: SymEnv; occ: SymOccurrence }) =>
                  bound$(b.env, _Array_append(b.occ, annotOccs), fields))(
                  bindLocal$(env, name, span),
                ))(walkAnnot$(env, annot)))(
          _v as Extract<LamParam, { _tag: "LPSpanned" }> & {
            param: Extract<Extract<LamParam, { _tag: "LPSpanned" }>["param"], { _tag: "LPName" }>;
          },
        )
      : _v._tag === "LPSpanned" && _v.param._tag === "LPLabeled" && _v.nameSpans.length === 1
        ? (({ param: { name, annot, defaultValue }, nameSpans: [span] }) =>
            ((annotOccs: SymOccurrence[]) =>
              ((dflt: Walked) =>
                ((before: SymOccurrence[]) =>
                  parked(name)
                    ? boundWith$(env, before, dflt)
                    : ((b: { env: SymEnv; occ: SymOccurrence }) =>
                        boundWith$(b.env, _Array_append(b.occ, before), dflt))(
                        bindLocal$(env, name, span),
                      ))(_Array_concat(annotOccs, dflt.occs)))(
                _Option_match(
                  defaultValue,
                  () => none(fields),
                  (e) => walkExpr$(env, e, fields),
                ),
              ))(walkAnnot$(env, annot)))(
            _v as Extract<LamParam, { _tag: "LPSpanned" }> & {
              param: Extract<
                Extract<LamParam, { _tag: "LPSpanned" }>["param"],
                { _tag: "LPLabeled" }
              >;
            },
          )
        : _v._tag === "LPSpanned" && _v.param._tag === "LPTuple"
          ? (({ param: { names }, nameSpans: spans }) => bindNames$(env, names, spans, 0, fields))(
              _v as Extract<LamParam, { _tag: "LPSpanned" }> & {
                param: Extract<
                  Extract<LamParam, { _tag: "LPSpanned" }>["param"],
                  { _tag: "LPTuple" }
                >;
              },
            )
          : _v._tag === "LPSpanned" && _v.param._tag === "LPRecord"
            ? (({ param: { fields: names }, nameSpans: spans }) =>
                bindNames$(env, names, spans, 0, fields))(
                _v as Extract<LamParam, { _tag: "LPSpanned" }> & {
                  param: Extract<
                    Extract<LamParam, { _tag: "LPSpanned" }>["param"],
                    { _tag: "LPRecord" }
                  >;
                },
              )
            : _v._tag === "LPName"
              ? (({ annot }) => bound$(env, walkAnnot$(env, annot), fields))(_v)
              : _v._tag === "LPLabeled"
                ? (({ annot, defaultValue }) =>
                    ((dflt: Walked) =>
                      boundWith$(env, _Array_concat(walkAnnot$(env, annot), dflt.occs), dflt))(
                      _Option_match(
                        defaultValue,
                        () => none(fields),
                        (e) => walkExpr$(env, e, fields),
                      ),
                    ))(_v)
                : bound$(env, [] as SymOccurrence[], fields))(param);
const bindParams$ = (
  env: SymEnv,
  params: LamParam[],
  i: number,
  fields: Map<string, Loc>,
): BoundScope =>
  _Option_match(
    _Array_get(i, params),
    () => bound$(env, [] as SymOccurrence[], fields),
    (param) =>
      boundThen$(
        bindParam$(env, param, fields),
        _curry(2, (e: SymEnv, fs: Map<string, Loc>) => bindParams$(e, params, i + 1, fs)),
      ),
  );
const walkPatOpt$ = (env: SymEnv, pat: Option<Pattern>, fields: Map<string, Loc>): BoundScope =>
  _Option_match(
    pat,
    () => bound$(env, [] as SymOccurrence[], fields),
    (p) => walkPat$(env, p, fields),
  );
const walkPats$ = (env: SymEnv, pats: Pattern[], i: number, fields: Map<string, Loc>): BoundScope =>
  _Option_match(
    _Array_get(i, pats),
    () => bound$(env, [] as SymOccurrence[], fields),
    (p) =>
      boundThen$(
        walkPat$(env, p, fields),
        _curry(2, (e: SymEnv, fs: Map<string, Loc>) => walkPats$(e, pats, i + 1, fs)),
      ),
  );
const walkPatFields$ = (
  env: SymEnv,
  pfs: PatField[],
  i: number,
  fields: Map<string, Loc>,
): BoundScope =>
  _Option_match(
    _Array_get(i, pfs),
    () => bound$(env, [] as SymOccurrence[], fields),
    (pf) => {
      const label: Walked = touchField$(env, pf.label, pf.labelSpan, fields);
      return boundThen$(
        boundThen$(
          bound$(env, label.occs, label.fields),
          _curry(2, (e: SymEnv, fs: Map<string, Loc>) => walkPat$(e, pf.pat, fs)),
        ),
        _curry(2, (e: SymEnv, fs: Map<string, Loc>) => walkPatFields$(e, pfs, i + 1, fs)),
      );
    },
  );
const walkPat$ = (env: SymEnv, pat: Pattern, fields: Map<string, Loc>): BoundScope => {
  const $match = pat;
  switch ($match._tag) {
    case "PAs": {
      const { pat: inner, name, nameSpan } = $match;
      return boundThen$(
        walkPat$(env, inner, fields),
        _curry(2, (e: SymEnv, fs: Map<string, Loc>) => bindName$(e, name, nameSpan, fs)),
      );
    }
    case "PBind": {
      const { name, span } = $match;
      return name === "_"
        ? bound$(env, [] as SymOccurrence[], fields)
        : bindName$(env, name, span, fields);
    }
    case "PCtor": {
      const { ctor, args, span } = $match;
      return boundThen$(
        bound$(env, use$(env, "ctor", ctor, span), fields),
        _curry(2, (e: SymEnv, fs: Map<string, Loc>) => walkPats$(e, args, 0, fs)),
      );
    }
    case "PRecord": {
      const { fields: pfs } = $match;
      return walkPatFields$(env, pfs, 0, fields);
    }
    case "PTuple": {
      const { elems } = $match;
      return walkPats$(env, elems, 0, fields);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return boundThen$(
        walkPats$(env, elems, 0, fields),
        _curry(2, (e: SymEnv, fs: Map<string, Loc>) => walkPatOpt$(e, rest, fs)),
      );
    }
    case "PList": {
      const { elems, rest } = $match;
      return boundThen$(
        walkPats$(env, elems, 0, fields),
        _curry(2, (e: SymEnv, fs: Map<string, Loc>) => walkPatOpt$(e, rest, fs)),
      );
    }
    case "POr": {
      const { alts } = $match;
      return ((_v) =>
        _v.length >= 1
          ? (([first, ...rest]) =>
              boundThen$(
                walkPat$(env, first, fields),
                _curry(2, (e: SymEnv, fs: Map<string, Loc>) => {
                  const uses: Walked = walkPatUsesList$(e, rest, 0, fs);
                  return bound$(e, uses.occs, uses.fields);
                }),
              ))(_v)
          : _v.length === 0
            ? bound$(env, [] as SymOccurrence[], fields)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(alts);
    }
    default: {
      return bound$(env, [] as SymOccurrence[], fields);
    }
  }
};
const walkPatUsesList$ = (
  env: SymEnv,
  pats: Pattern[],
  i: number,
  fields: Map<string, Loc>,
): Walked =>
  _Option_match(
    _Array_get(i, pats),
    () => none(fields),
    (p) =>
      andThen$(walkPatUses$(env, p, fields), (fs: Map<string, Loc>) =>
        walkPatUsesList$(env, pats, i + 1, fs),
      ),
  );
const walkPatUsesOpt$ = (env: SymEnv, pat: Option<Pattern>, fields: Map<string, Loc>): Walked =>
  _Option_match(
    pat,
    () => none(fields),
    (p) => walkPatUses$(env, p, fields),
  );
const walkPatFieldUses$ = (
  env: SymEnv,
  pfs: PatField[],
  i: number,
  fields: Map<string, Loc>,
): Walked =>
  _Option_match(
    _Array_get(i, pfs),
    () => none(fields),
    (pf) =>
      andThen$(
        andThen$(touchField$(env, pf.label, pf.labelSpan, fields), (fs: Map<string, Loc>) =>
          walkPatUses$(env, pf.pat, fs),
        ),
        (fs: Map<string, Loc>) => walkPatFieldUses$(env, pfs, i + 1, fs),
      ),
  );
/**
 * A pattern walk that records uses (ctors, fields) but binds nothing.
 */
const walkPatUses$ = (env: SymEnv, pat: Pattern, fields: Map<string, Loc>): Walked => {
  const $match = pat;
  switch ($match._tag) {
    case "PAs": {
      const { pat: inner } = $match;
      return walkPatUses$(env, inner, fields);
    }
    case "PCtor": {
      const { ctor, args, span } = $match;
      return prefixed$(use$(env, "ctor", ctor, span), walkPatUsesList$(env, args, 0, fields));
    }
    case "PRecord": {
      const { fields: pfs } = $match;
      return walkPatFieldUses$(env, pfs, 0, fields);
    }
    case "PTuple": {
      const { elems } = $match;
      return walkPatUsesList$(env, elems, 0, fields);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return andThen$(walkPatUsesList$(env, elems, 0, fields), (fs: Map<string, Loc>) =>
        walkPatUsesOpt$(env, rest, fs),
      );
    }
    case "PList": {
      const { elems, rest } = $match;
      return andThen$(walkPatUsesList$(env, elems, 0, fields), (fs: Map<string, Loc>) =>
        walkPatUsesOpt$(env, rest, fs),
      );
    }
    case "POr": {
      const { alts } = $match;
      return walkPatUsesList$(env, alts, 0, fields);
    }
    default: {
      return none(fields);
    }
  }
};
const walkExprs$ = (env: SymEnv, exprs: Expr[], i: number, fields: Map<string, Loc>): Walked =>
  _Option_match(
    _Array_get(i, exprs),
    () => none(fields),
    (e) =>
      andThen$(walkExpr$(env, e, fields), (fs: Map<string, Loc>) =>
        walkExprs$(env, exprs, i + 1, fs),
      ),
  );
const walkSeqs$ = (env: SymEnv, elems: SeqElem[], i: number, fields: Map<string, Loc>): Walked =>
  ((_v) =>
    _v._tag === "None"
      ? none(fields)
      : _v._tag === "Some" && _v.value._tag === "SEExpr"
        ? (({ value: { expr: e } }) =>
            andThen$(walkExpr$(env, e, fields), (fs: Map<string, Loc>) =>
              walkSeqs$(env, elems, i + 1, fs),
            ))(
            _v as Extract<Option<SeqElem>, { _tag: "Some" }> & {
              value: Extract<
                Extract<Option<SeqElem>, { _tag: "Some" }>["value"],
                { _tag: "SEExpr" }
              >;
            },
          )
        : _v._tag === "Some" && _v.value._tag === "SESpread"
          ? (({ value: { expr: e } }) =>
              andThen$(walkExpr$(env, e, fields), (fs: Map<string, Loc>) =>
                walkSeqs$(env, elems, i + 1, fs),
              ))(
              _v as Extract<Option<SeqElem>, { _tag: "Some" }> & {
                value: Extract<
                  Extract<Option<SeqElem>, { _tag: "Some" }>["value"],
                  { _tag: "SESpread" }
                >;
              },
            )
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, elems));
const walkInterp$ = (
  env: SymEnv,
  parts: InterpPart[],
  i: number,
  fields: Map<string, Loc>,
): Walked =>
  ((_v) =>
    _v._tag === "None"
      ? none(fields)
      : _v._tag === "Some" && _v.value._tag === "IPLit"
        ? walkInterp$(env, parts, i + 1, fields)
        : _v._tag === "Some" && _v.value._tag === "IPExpr"
          ? (({ value: { expr: e } }) =>
              andThen$(walkExpr$(env, e, fields), (fs: Map<string, Loc>) =>
                walkInterp$(env, parts, i + 1, fs),
              ))(
              _v as Extract<Option<InterpPart>, { _tag: "Some" }> & {
                value: Extract<
                  Extract<Option<InterpPart>, { _tag: "Some" }>["value"],
                  { _tag: "IPExpr" }
                >;
              },
            )
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, parts));
const walkRecordFields$ = (
  env: SymEnv,
  rfs: Field[],
  i: number,
  fields: Map<string, Loc>,
): Walked =>
  _Option_match(
    _Array_get(i, rfs),
    () => none(fields),
    (f) =>
      andThen$(
        andThen$(touchField$(env, f.name, f.nameSpan, fields), (fs: Map<string, Loc>) =>
          walkExpr$(env, f.value, fs),
        ),
        (fs: Map<string, Loc>) => walkRecordFields$(env, rfs, i + 1, fs),
      ),
  );
const walkEntries$ = (
  env: SymEnv,
  entries: MapEntry[],
  i: number,
  fields: Map<string, Loc>,
): Walked =>
  _Option_match(
    _Array_get(i, entries),
    () => none(fields),
    (entry) =>
      andThen$(
        andThen$(walkExpr$(env, entry.key, fields), (fs: Map<string, Loc>) =>
          walkExpr$(env, entry.value, fs),
        ),
        (fs: Map<string, Loc>) => walkEntries$(env, entries, i + 1, fs),
      ),
  );
const walkArms$ = (env: SymEnv, arms: MatchArm[], i: number, fields: Map<string, Loc>): Walked =>
  _Option_match(
    _Array_get(i, arms),
    () => none(fields),
    (arm) => {
      const pat: BoundScope = walkPat$(env, arm.pattern, fields);
      const guard: Walked = _Option_match(
        arm.guard,
        () => none(pat.fields),
        (g) => walkExpr$(pat.env, g, pat.fields),
      );
      const body: Walked = andThen$(prefixed$(pat.occs, guard), (fs: Map<string, Loc>) =>
        walkExpr$(pat.env, arm.body, fs),
      );
      const armSpan: SpanAt = { start: patSpan(arm.pattern).start, end: exprSpan(arm.body).end };
      return andThen$(framed$(env, pat.env, armSpan, body), (fs: Map<string, Loc>) =>
        walkArms$(env, arms, i + 1, fs),
      );
    },
  );
const walkLoopInits$ = (
  env: SymEnv,
  params: LoopParam[],
  i: number,
  fields: Map<string, Loc>,
): Walked =>
  _Option_match(
    _Array_get(i, params),
    () => none(fields),
    (param) =>
      andThen$(walkExpr$(env, param.init, fields), (fs: Map<string, Loc>) =>
        walkLoopInits$(env, params, i + 1, fs),
      ),
  );
const bindLoopParams: <A>(
  env: SymEnv,
  params: ({ name: string; nameSpan: SpanAt } & A)[],
  i: number,
  fields: Map<string, Loc>,
) => BoundScope = _curry(
  4,
  <A>(
    env: SymEnv,
    params: ({ name: string; nameSpan: SpanAt } & A)[],
    i: number,
    fields: Map<string, Loc>,
  ) =>
    _Option_match(
      _Array_get(i, params),
      () => bound$(env, [] as SymOccurrence[], fields),
      (param) =>
        boundThen$(
          bindName$(env, param.name, param.nameSpan, fields),
          _curry(2, (e: SymEnv, fs: Map<string, Loc>) => bindLoopParams(e, params, i + 1, fs)),
        ),
    ),
);

const letRun$ = (e: Expr, acc: [string, SpanAt, Option<TypeExpr>, Expr][]): LetRun => {
  const $match = e;
  switch ($match._tag) {
    case "ELetIn": {
      const { name, nameSpan, annot, value, body } = $match;
      const $match$ = value;
      switch ($match$._tag) {
        case "ELambda": {
          return letRun$(body, _Array_append(_tuple(name, nameSpan, annot, value), acc));
        }
        default: {
          return { binders: acc, tail: e };
        }
      }
    }
    default: {
      return { binders: acc, tail: e };
    }
  }
};
const bindRun: <A, B>(
  env: SymEnv,
  binders: [string, SpanAt, A, B][],
  i: number,
  fields: Map<string, Loc>,
) => BoundScope = _curry(
  4,
  <A, B>(env: SymEnv, binders: [string, SpanAt, A, B][], i: number, fields: Map<string, Loc>) =>
    match(_Array_get(i, binders))
      .with({ _tag: "None" }, () => bound$(env, [] as SymOccurrence[], fields))
      .with(
        (_v) => _v._tag === "Some",
        ({ value: [name, nameSpan, ,] }) =>
          boundThen$(
            bindName$(env, name, nameSpan, fields),
            _curry(2, (e: SymEnv, fs: Map<string, Loc>) => bindRun(e, binders, i + 1, fs)),
          ),
      )
      .exhaustive(),
);
const walkRunValues$ = (
  env: SymEnv,
  binders: [string, SpanAt, Option<TypeExpr>, Expr][],
  i: number,
  fields: Map<string, Loc>,
): Walked =>
  ((_v) =>
    _v._tag === "None"
      ? none(fields)
      : _v._tag === "Some"
        ? (({ value: [, , annot, value] }) =>
            andThen$(
              prefixed$(walkAnnot$(env, annot), walkExpr$(env, value, fields)),
              (fs: Map<string, Loc>) => walkRunValues$(env, binders, i + 1, fs),
            ))(_v as Extract<Option<[string, SpanAt, Option<TypeExpr>, Expr]>, { _tag: "Some" }>)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, binders));
const walkLetRun$ = (env: SymEnv, run: LetRun, fields: Map<string, Loc>): Walked => {
  const scope: BoundScope = bindRun(env, run.binders, 0, fields);
  return framed$(
    env,
    scope.env,
    exprSpan(run.tail),
    prefixed$(
      scope.occs,
      andThen$(walkRunValues$(scope.env, run.binders, 0, scope.fields), (fs: Map<string, Loc>) =>
        walkExpr$(scope.env, run.tail, fs),
      ),
    ),
  );
};
const fieldNameSpan$ = (span: SpanAt, name: string): SpanAt => ({
  start: span.end - _Str_length(name),
  end: span.end,
});
const walkFieldAccess$ = (
  env: SymEnv,
  target: Expr,
  name: string,
  span: SpanAt,
  fields: Map<string, Loc>,
): Walked => {
  const nameSpan: SpanAt = fieldNameSpan$(span, name);
  const member: Option<Loc> = ((_v) =>
    _v._tag === "ERef"
      ? (({ name: ns }) => _Map_get(`${ns}.${name}`, env.prelude.members))(_v)
      : (None as Option<Loc>))(target);
  return andThen$(walkExpr$(env, target, fields), (fs: Map<string, Loc>) =>
    _Option_match(
      member,
      () => touchField$(env, name, nameSpan, fs),
      (def) => walked$([occ$(name, "value", def, nameSpan, "use")], fs),
    ),
  );
};
const walkExpr$ = (env: SymEnv, expr: Expr, fields: Map<string, Loc>): Walked => {
  const $match = expr;
  switch ($match._tag) {
    case "ERef": {
      const { name, span } = $match;
      return parked(name)
        ? none(fields)
        : and(upperStart(name), lookup$(env, "ctor", name)._tag !== "None")
          ? walked$(use$(env, "ctor", name, span), fields)
          : walked$(use$(env, "value", name, span), fields);
    }
    case "EInterp": {
      const { parts } = $match;
      return walkInterp$(env, parts, 0, fields);
    }
    case "ECall": {
      const { fn, args } = $match;
      return andThen$(walkExpr$(env, fn, fields), (fs: Map<string, Loc>) =>
        walkExprs$(env, args, 0, fs),
      );
    }
    case "ELambda": {
      const { params, body, span: sp } = $match;
      const scope: BoundScope = bindParams$(env, params, 0, fields);
      const inner: Walked = walkExpr$(scope.env, body, scope.fields);
      return framed$(env, scope.env, sp, {
        occs: _Array_concat(scope.occs, inner.occs),
        fields: inner.fields,
        frames: _Array_concat(scope.frames, inner.frames),
      });
    }
    case "ELetIn": {
      const { name, nameSpan, annot, value, body } = $match;
      const $match$ = value;
      switch ($match$._tag) {
        case "ELambda": {
          return walkLetRun$(
            env,
            letRun$(expr, [] as [string, SpanAt, Option<TypeExpr>, Expr][]),
            fields,
          );
        }
        default: {
          const v: Walked = walkExpr$(env, value, fields);
          const scope: BoundScope = bindName$(env, name, nameSpan, v.fields);
          const inner: Walked = framed$(
            env,
            scope.env,
            exprSpan(body),
            walkExpr$(scope.env, body, scope.fields),
          );
          return {
            occs: _Array_concat(
              _Array_concat(v.occs, _Array_concat(walkAnnot$(env, annot), scope.occs)),
              inner.occs,
            ),
            fields: inner.fields,
            frames: _Array_concat(v.frames, inner.frames),
          };
        }
      }
    }
    case "ELetBind": {
      const { param, value, body } = $match;
      const v: Walked = walkExpr$(env, value, fields);
      const scope: BoundScope = bindParam$(env, param, v.fields);
      const inner: Walked = framed$(
        env,
        scope.env,
        exprSpan(body),
        walkExpr$(scope.env, body, scope.fields),
      );
      return {
        occs: _Array_concat(_Array_concat(v.occs, scope.occs), inner.occs),
        fields: inner.fields,
        frames: _Array_concat(_Array_concat(v.frames, scope.frames), inner.frames),
      };
    }
    case "ELoop": {
      const { params, body } = $match;
      const inits: Walked = walkLoopInits$(env, params, 0, fields);
      const scope: BoundScope = bindLoopParams(env, params, 0, inits.fields);
      const inner: Walked = framed$(
        env,
        scope.env,
        exprSpan(body),
        walkExpr$(scope.env, body, scope.fields),
      );
      return {
        occs: _Array_concat(_Array_concat(inits.occs, scope.occs), inner.occs),
        fields: inner.fields,
        frames: _Array_concat(inits.frames, inner.frames),
      };
    }
    case "ERecur": {
      const { args } = $match;
      return walkExprs$(env, args, 0, fields);
    }
    case "EPipe": {
      const { left, right } = $match;
      return andThen$(walkExpr$(env, left, fields), (fs: Map<string, Loc>) =>
        walkExpr$(env, right, fs),
      );
    }
    case "EDo": {
      const { exprs } = $match;
      return walkExprs$(env, exprs, 0, fields);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return walkExprs$(env, [cond, thenE, elseE], 0, fields);
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return andThen$(walkExpr$(env, scrutinee, fields), (fs: Map<string, Loc>) =>
        walkArms$(env, arms, 0, fs),
      );
    }
    case "ERecord": {
      const { fields: rfs, spread } = $match;
      return _Option_match(
        spread,
        () => walkRecordFields$(env, rfs, 0, fields),
        (base) =>
          andThen$(walkExpr$(env, base, fields), (fs: Map<string, Loc>) =>
            walkRecordFields$(env, rfs, 0, fs),
          ),
      );
    }
    case "EField": {
      const { target, name, span } = $match;
      return walkFieldAccess$(env, target, name, span, fields);
    }
    case "ETuple": {
      const { elements } = $match;
      return walkExprs$(env, elements, 0, fields);
    }
    case "EArr": {
      const { elements } = $match;
      return walkSeqs$(env, elements, 0, fields);
    }
    case "EList": {
      const { elements } = $match;
      return walkSeqs$(env, elements, 0, fields);
    }
    case "ESet": {
      const { elements } = $match;
      return walkSeqs$(env, elements, 0, fields);
    }
    case "EMap": {
      const { entries } = $match;
      return walkEntries$(env, entries, 0, fields);
    }
    default: {
      return none(fields);
    }
  }
};

const withValue$ = (o: Origins, name: string, def: Loc): Origins => ({
  values: _Map_set(name, def, o.values),
  types: o.types,
  ctors: o.ctors,
});
const withType$ = (o: Origins, name: string, def: Loc): Origins => ({
  values: o.values,
  types: _Map_set(name, def, o.types),
  ctors: o.ctors,
});
const withCtor$ = (o: Origins, name: string, def: Loc): Origins => ({
  values: o.values,
  types: o.types,
  ctors: _Map_set(name, def, o.ctors),
});
const topThen$ = (
  first: TopScope,
  occs: SymOccurrence[],
  top: Origins,
  fields: Map<string, Loc>,
): TopScope => ({ top: top, occs: _Array_concat(first.occs, occs), fields: fields });
/**
 * An imported name resolves to its export site when `origins` has it: a ctor
 * (also seeded as a value, for non-call uses), then a value, then a type.
 * Unresolved, the import itself is the def.
 */
const bindImport$ = (
  env: SymEnv,
  origins: Origins,
  acc: TopScope,
  name: string,
  span: SpanAt,
): TopScope =>
  ((_v) =>
    _v[0]._tag === "Some"
      ? (([{ value: def }, ,]) =>
          topThen$(
            acc,
            [occ$(name, "ctor", def, span, "use")],
            withValue$(withCtor$(acc.top, name, def), name, def),
            acc.fields,
          ))(
          _v as [
            Extract<[Option<Loc>, Option<Loc>, Option<Loc>][0], { _tag: "Some" }>,
            [Option<Loc>, Option<Loc>, Option<Loc>][1],
            [Option<Loc>, Option<Loc>, Option<Loc>][2],
          ],
        )
      : _v[0]._tag === "None" && _v[1]._tag === "Some"
        ? (([, { value: def }]) =>
            topThen$(
              acc,
              [occ$(name, "value", def, span, "use")],
              withValue$(acc.top, name, def),
              acc.fields,
            ))(
            _v as [
              Extract<[Option<Loc>, Option<Loc>, Option<Loc>][0], { _tag: "None" }>,
              Extract<[Option<Loc>, Option<Loc>, Option<Loc>][1], { _tag: "Some" }>,
              [Option<Loc>, Option<Loc>, Option<Loc>][2],
            ],
          )
        : _v[0]._tag === "None" && _v[1]._tag === "None" && _v[2]._tag === "Some"
          ? (([, , { value: def }]) =>
              topThen$(
                acc,
                [occ$(name, "type", def, span, "use")],
                withType$(acc.top, name, def),
                acc.fields,
              ))(
              _v as [
                Extract<[Option<Loc>, Option<Loc>, Option<Loc>][0], { _tag: "None" }>,
                Extract<[Option<Loc>, Option<Loc>, Option<Loc>][1], { _tag: "None" }>,
                Extract<[Option<Loc>, Option<Loc>, Option<Loc>][2], { _tag: "Some" }>,
              ],
            )
          : ((def: Loc) =>
              topThen$(
                acc,
                [occ$(name, "value", def, span, "def")],
                withValue$(acc.top, name, def),
                acc.fields,
              ))(locOf$(env, span)))(
    _tuple(
      _Map_get(name, origins.ctors),
      _Map_get(name, origins.values),
      _Map_get(name, origins.types),
    ),
  );
const bindImports: <A>(
  env: SymEnv,
  origins: Origins,
  acc: TopScope,
  names: ({ name: string; span: SpanAt } & A)[],
  i: number,
) => TopScope = _curry(
  5,
  <A>(
    env: SymEnv,
    origins: Origins,
    acc: TopScope,
    names: ({ name: string; span: SpanAt } & A)[],
    i: number,
  ) =>
    _Option_match(
      _Array_get(i, names),
      () => acc,
      (n) =>
        bindImports(env, origins, bindImport$(env, origins, acc, n.name, n.span), names, i + 1),
    ),
);
const bindCtors$ = (env: SymEnv, acc: TopScope, ctors: Ctor[], i: number): TopScope =>
  _Option_match(
    _Array_get(i, ctors),
    () => acc,
    (c) => {
      const def: Loc = locOf$(env, c.span);
      return bindCtors$(
        env,
        topThen$(
          acc,
          [occ$(c.name, "ctor", def, c.span, "def")],
          withCtor$(acc.top, c.name, def),
          acc.fields,
        ),
        ctors,
        i + 1,
      );
    },
  );
const touchAliasFields$ = (env: SymEnv, acc: TopScope, afs: AliasField[], i: number): TopScope =>
  _Option_match(
    _Array_get(i, afs),
    () => acc,
    (f) => {
      const w: Walked = touchField$(env, f.name, f.nameSpan, acc.fields);
      return touchAliasFields$(env, topThen$(acc, w.occs, acc.top, w.fields), afs, i + 1);
    },
  );
const bindTopValue$ = (env: SymEnv, acc: TopScope, name: string, span: SpanAt): TopScope => {
  const def: Loc = locOf$(env, span);
  return topThen$(
    acc,
    [occ$(name, "value", def, span, "def")],
    withValue$(acc.top, name, def),
    acc.fields,
  );
};
const bindTopLevels$ = (
  env: SymEnv,
  origins: Origins,
  stmts: Stmt[],
  i: number,
  acc: TopScope,
): TopScope =>
  _Option_match(
    _Array_get(i, stmts),
    () => acc,
    (stmt) =>
      bindTopLevels$(
        env,
        origins,
        stmts,
        i + 1,
        ((_v) =>
          _v._tag === "SImportNs"
            ? (({ alias }) => bindTopValue$(env, acc, alias.name, alias.span))(_v)
            : _v._tag === "SImport"
              ? (({ names }) => bindImports(env, origins, acc, names, 0))(_v)
              : _v._tag === "SType"
                ? (({ name, nameSpan, ctors, alias }) =>
                    ((def: Loc) =>
                      ((withCtors: TopScope) =>
                        _Option_match(
                          alias,
                          () => withCtors,
                          (afs) => touchAliasFields$(env, withCtors, afs, 0),
                        ))(
                        bindCtors$(
                          env,
                          topThen$(
                            acc,
                            [occ$(name, "type", def, nameSpan, "def")],
                            withType$(acc.top, name, def),
                            acc.fields,
                          ),
                          ctors,
                          0,
                        ),
                      ))(locOf$(env, nameSpan)))(_v)
                : _v._tag === "SLet"
                  ? (({ name, nameSpan }) =>
                      parked(name) ? acc : bindTopValue$(env, acc, name, nameSpan))(_v)
                  : _v._tag === "SExtern"
                    ? (({ name, nameSpan }) => bindTopValue$(env, acc, name, nameSpan))(_v)
                    : acc)(stmt),
      ),
  );
const ctorFieldTypes: (ctors: Ctor[]) => TypeExpr[] = (ctors: Ctor[]) =>
  _Array_flatMap((c: Ctor) => map((f: CtorField) => f.fieldType, c.fields), ctors);
const walkStmt$ = (env: SymEnv, stmt: Stmt, fields: Map<string, Loc>): Walked => {
  const $match = stmt;
  switch ($match._tag) {
    case "SLet": {
      const { annot, value } = $match;
      return prefixed$(walkAnnot$(env, annot), walkExpr$(env, value, fields));
    }
    case "SExpr": {
      const { value } = $match;
      return walkExpr$(env, value, fields);
    }
    case "SExtern": {
      const { typeExpr } = $match;
      return walked$(walkType$(env, typeExpr), fields);
    }
    case "SType": {
      const { ctors, alias, aliasType } = $match;
      const aliasTypes: TypeExpr[] = _Option_match(
        alias,
        () => [] as TypeExpr[],
        (afs) => map((f: AliasField) => f.fieldType, afs),
      );
      return walked$(
        _Array_concat(
          walkTypes$(env, _Array_concat(ctorFieldTypes(ctors), aliasTypes), 0),
          walkAnnot$(env, aliasType),
        ),
        fields,
      );
    }
    default: {
      return none(fields);
    }
  }
};
const walkStmts$ = (env: SymEnv, stmts: Stmt[], i: number, fields: Map<string, Loc>): Walked =>
  _Option_match(
    _Array_get(i, stmts),
    () => none(fields),
    (stmt) =>
      andThen$(walkStmt$(env, stmt, fields), (fs: Map<string, Loc>) =>
        walkStmts$(env, stmts, i + 1, fs),
      ),
  );
const indexWith$ = (
  path: string,
  origins: Origins,
  prelude: SymPrelude,
  stmts: Stmt[],
): SymIndex => {
  const env0: SymEnv = { path: path, top: emptyOrigins, prelude: prelude, locals: new Map([]) };
  const tops: TopScope = bindTopLevels$(env0, origins, stmts, 0, {
    top: emptyOrigins,
    occs: [] as SymOccurrence[],
    fields: new Map<string, Loc>(),
  });
  const body: Walked = walkStmts$(
    { path: path, top: tops.top, prelude: prelude, locals: new Map<string, Loc>() },
    stmts,
    0,
    tops.fields,
  );
  return {
    occurrences: _Array_concat(tops.occs, body.occs),
    top: tops.top,
    fields: body.fields,
    frames: body.frames,
  };
};
/**
 * indexWith : string -> Origins -> SymPrelude -> [Stmt] -> SymIndex
 * Occurrences come in walk order: module-scope binders first, then bodies.
 */
export const indexWith: _Curry<
  [path: string, origins: Origins, prelude: SymPrelude, stmts: Stmt[]],
  SymIndex
> = _curry(4, indexWith$);
const originsFrom$ = (path: string, stmts: Stmt[], i: number, acc: Origins): Origins =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some" && _v.value._tag === "SLet" && _v.value.exported === true
        ? (({ value: { name, nameSpan } }) =>
            originsFrom$(
              path,
              stmts,
              i + 1,
              withValue$(acc, name, { path: path, start: nameSpan.start, end: nameSpan.end }),
            ))(
            _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
              value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
            },
          )
        : _v._tag === "Some" && _v.value._tag === "SExtern" && _v.value.exported === true
          ? (({ value: { name, nameSpan } }) =>
              originsFrom$(
                path,
                stmts,
                i + 1,
                withValue$(acc, name, { path: path, start: nameSpan.start, end: nameSpan.end }),
              ))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<
                  Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                  { _tag: "SExtern" }
                >;
              },
            )
          : _v._tag === "Some" && _v.value._tag === "SType" && _v.value.exported === true
            ? (({ value: { name, nameSpan, ctors } }) =>
                originsFrom$(
                  path,
                  stmts,
                  i + 1,
                  reduce(
                    _curry(2, (o: Origins, c: Ctor) => {
                      const at: Loc = { path: path, start: c.span.start, end: c.span.end };
                      return withValue$(withCtor$(o, c.name, at), c.name, at);
                    }),
                    withType$(acc, name, { path: path, start: nameSpan.start, end: nameSpan.end }),
                    ctors,
                  ),
                ))(
                _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                  value: Extract<
                    Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                    { _tag: "SType" }
                  >;
                },
              )
            : _v._tag === "Some"
              ? originsFrom$(path, stmts, i + 1, acc)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(_Array_get(i, stmts));
const originsOf$ = (path: string, stmts: Stmt[]): Origins =>
  originsFrom$(path, stmts, 0, emptyOrigins);
/**
 * originsOf : string -> [Stmt] -> Origins
 * The export sites an importer's `indexWith` resolves its imports to.
 */
export const originsOf: _Curry<[path: string, stmts: Stmt[]], Origins> = _curry(2, originsOf$);
const importSpans: (stmts: Stmt[]) => number[] = (stmts: Stmt[]) =>
  _Array_flatMap((s: Stmt) => {
    const $match = s;
    switch ($match._tag) {
      case "SImport": {
        const { names } = $match;
        return map((n: Name) => n.span.start, names);
      }
      case "SImportNs": {
        const { alias } = $match;
        return [alias.span.start];
      }
      default: {
        return [] as number[];
      }
    }
  }, stmts);
/**
 * index : [Stmt] -> [Occurrence]
 * This file's value bindings only: no imports, prelude, types, ctors or
 * fields. Declaration spans are the identity.
 */
export const index: (stmts: Stmt[]) => Occurrence[] = (stmts: Stmt[]) => {
  const imports: number[] = importSpans(stmts);
  const noPrelude: SymPrelude = { origins: emptyOrigins, members: new Map([]) };
  return map(
    (o: SymOccurrence) => ({
      name: o.name,
      defStart: o.defStart,
      defEnd: o.defEnd,
      start: o.start,
      end: o.end,
      role: o.role,
    }),
    filter(
      (o: SymOccurrence) => and(o.space === "value", !_Array_contains(o.defStart, imports)),
      indexWith$("", emptyOrigins, noPrelude, stmts).occurrences,
    ),
  );
};
