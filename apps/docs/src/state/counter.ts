/**
 * Typed host bridge for `counter.mochi` (ADR 0010 Gap A).
 *
 * `defineContainer` stays opaque in Mochi (`: a`) until Wave 3 #16 can express
 * the host factory signature honestly. One cast lives here at the seam so
 * TSX hook call sites stay cast-free.
 */
import type { ActionSpec, ContainerDef } from "@re-reduced/preact";
import { counter as counterRaw } from "./counter.mochi";

export type CounterState = { count: number };

export type CounterActions = {
  increment: ActionSpec<CounterState, void>;
  decrement: ActionSpec<CounterState, void>;
};

export type DocsCounter = ContainerDef<
  CounterState,
  CounterActions,
  Record<string, never>,
  never
> & { name: string };

export const counter: DocsCounter = counterRaw as DocsCounter;
