import { useContainer, useSelect } from "@re-reduced/preact";
import { counter } from "../state/counter.mochi";
import CounterView from "./CounterView.mochi";

/** Hooks shell over a Mochi-defined container + Mochi presentational view. */
export function Counter() {
  // Container is authored in .mochi with a loose extern; cast at the host seam.
  const store = useContainer(counter as never);
  const count = useSelect(store, (s) => (s as unknown as { count: { value: number } }).count.value);
  return (
    <CounterView
      count={count}
      onInc={() => (store.actions as { increment: () => void }).increment()}
      onDec={() => (store.actions as { decrement: () => void }).decrement()}
    />
  );
}
