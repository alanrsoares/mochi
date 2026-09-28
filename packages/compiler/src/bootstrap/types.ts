/**
 * Typed façade over the self-hosted core's AST and type values (ADR 0101, 0109).
 * The types are copied out of the seed's emit into `host-types.d.ts` at freeze
 * time; the constructors come from the syntax bundle, typed by the signatures
 * the same freeze copies (`SeedTypeCtors`), so nothing here is hand-typed. Host
 * plugins build and inspect bootstrap values through this module only.
 */
import * as seedModule from "../../../../bootstrap/seed/syntax.bundle.mjs";

export type {
  Expr,
  Field,
  HostPlugin,
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

import type { SeedTypeCtors, Ty } from "../../../../bootstrap/seed/host-types";

// Typed by the freeze, from the seed's own emitted signatures (ADR 0109).
const seed = seedModule as unknown as SeedTypeCtors;

export const tCon = seed.tCon;
export const tArrow = seed.tArrow;
export const tRecord = seed.tRecord;
export const tTuple = seed.tTuple;
export const tLit = seed.tLit;
export const tUnion = seed.tUnion;
/** The core's primitive types; build one by name only through these. */
export const tNumber = seed.tNumber;
export const tString = seed.tString;
export const tBool = seed.tBool;
export const tUnit: Ty = seed.tPrim(seed.UNIT);
export const rExtend = seed.rExtend;
export const freshVar = seed.freshVar;
export const freshRowVar = seed.freshRowVar;
/** A type with every solved variable in `st` substituted through. */
export const zonk = seed.zonk;
/** Literal types widened to their base (`"js"` → `string`); literal unions stay. */
export const widenLits = seed.widenLits;
