/** Playground preset registry — example sources selectable from Settings. */
import presetFib from "../../examples/presets/fib.mochi?raw";
import presetJsx from "../../examples/presets/jsx.mochi?raw";
import presetResult from "../../examples/presets/result.mochi?raw";
import presetRowPoly from "../../examples/presets/row-poly.mochi?raw";
import presetTask from "../../examples/presets/task.mochi?raw";

export type Preset = { name: string; code: string };

export const PRESETS: Record<string, Preset> = {
  jsx: { name: "JSX → h()", code: presetJsx },
  result: { name: "Result + switch", code: presetResult },
  task: { name: "Async with typed errors", code: presetTask },
  rowPoly: { name: "Flexible records", code: presetRowPoly },
  fib: { name: "Fibonacci", code: presetFib },
};

export const DEFAULT_PRESET_CODE = presetJsx;
