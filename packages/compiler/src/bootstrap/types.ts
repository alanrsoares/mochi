/**
 * Typed façade over the self-hosted core's AST and type values (ADR 0101, 0109).
 * The types are copied out of the seed's emit into `host-types.d.ts` at freeze
 * time; the constructors come from the syntax bundle. Host
 * plugins build and inspect bootstrap values through this module only.
 */
import { loadSeed } from "./seed-path.ts";

export type {
  Expr,
  Field,
  IErr,
  InferApi,
  LocTok,
  Pattern,
  Row,
  Span,
  St,
  Stmt,
  Tok,
  TsApi,
  Ty,
  TypeExpr,
} from "../../../../bootstrap/seed/host-types";

import type { Row, St, Ty } from "../../../../bootstrap/seed/host-types";

type SeedTypes = {
  tCon: (name: string, args: Ty[]) => Ty;
  tArrow: (from: Ty, to: Ty) => Ty;
  tRecord: (row: Row) => Ty;
  tLit: (value: string) => Ty;
  tUnion: (members: Ty[]) => Ty;
  rExtend: (label: string, fieldType: Ty, rest: Row) => Row;
  freshVar: (st: St) => [Ty, St];
  freshRowVar: (st: St) => [Row, St];
  zonk: (t: Ty, st: St) => Ty;
};

const seed = loadSeed<SeedTypes>("syntax.bundle.cjs");

export const tCon = seed.tCon;
export const tArrow = seed.tArrow;
export const tRecord = seed.tRecord;
export const tLit = seed.tLit;
export const tUnion = seed.tUnion;
export const rExtend = seed.rExtend;
export const freshVar = seed.freshVar;
export const freshRowVar = seed.freshRowVar;
/** A type with every solved variable in `st` substituted through. */
export const zonk = seed.zonk;
