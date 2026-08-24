/** Runtime adapter for the typed Mochi-facing Bun modules. */

import { Err, Ok, type Result, type Task } from "@mochi/compiler/runtime";

let failNextWrite = process.env.MOCHI_BUN_FAIL_ONCE === "1";
let active = false;

/** Test hook for the terminal error path; not exported from a Mochi module. */
export const __forceFailNextWrite = (): void => {
  failNextWrite = true;
};

const write = (chunk: string): Result<void, string> => {
  try {
    if (failNextWrite) {
      failNextWrite = false;
      return Err("forced write failure");
    }
    process.stdout.write(chunk);
    return Ok(undefined);
  } catch (cause) {
    return Err(cause instanceof Error ? cause.message : String(cause));
  }
};

const asTask =
  (effect: () => Result<void, string>): Task<void, string> =>
  () =>
    Promise.resolve(effect());

export const args = (): string[] => Bun.argv.slice(2);
export const log = (message: string): void => {
  process.stdout.write(`${message}\n`);
};
export const error = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

/** Enter the alternate screen buffer once and hide the cursor. */
export const enter = (): Task<void, string> =>
  asTask(() => {
    if (active) return Ok(undefined);
    const result = write("\x1b[?1049h\x1b[?25l");
    if (result._tag === "Ok") active = true;
    return result;
  });

/** Repaint a labelled frame from the home cursor position. */
export const draw = (label: string, frame: string): Task<void, string> =>
  asTask(() => write(`\x1b[H${label}\n${frame}\n`));

/** Restore the normal screen buffer and cursor. Safe to call repeatedly. */
export const leave = (): Task<void, string> =>
  asTask(() => {
    if (!active) return Ok(undefined);
    const result = write("\x1b[?25h\x1b[?1049l");
    if (result._tag === "Ok") active = false;
    return result;
  });
