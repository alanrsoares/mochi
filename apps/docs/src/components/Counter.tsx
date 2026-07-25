import { useContainer, useSelect } from "@re-reduced/preact";
import { counter } from "../state/counter.mochi";
import CounterView from "./CounterView.mochi";

export function Counter() {
  // Loose extern on the Mochi side; cast at the host seam.
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
