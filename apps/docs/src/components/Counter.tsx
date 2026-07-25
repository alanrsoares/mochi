import { useContainer, useSelect } from "@re-reduced/preact";
import { counter } from "../state/counter";
import CounterView from "./CounterView.mochi";

export function Counter() {
  const store = useContainer(counter);
  const count = useSelect(store, (s) => s.count.value);
  return (
    <CounterView
      count={count}
      onInc={() => store.actions.increment()}
      onDec={() => store.actions.decrement()}
    />
  );
}
