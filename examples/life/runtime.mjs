// Domain terminal effects for the animated Life. Sequencing / delay / kick-off
// live in the prelude (`Task.*`, ADR 0005). This host only writes to the
// terminal — each export returns a lazy Task `() => Promise<Result<a, e>>`
// (ADR 0006); the `{ _tag: "Ok" | "Err" }` shape matches mochi's runtime ctors
// so `let!` chains bind straight through. Write failures (and an optional
// one-shot force via `__forceFailNextWrite`) settle as `Err(string)`.
// Multi-arg exports are FLAT `(a, b) => …`; mochi wraps them in `_curry` so both
// `f(a, b)` and `f(a)(b)` work.

const Ok = (value) => ({ _tag: "Ok", value });
const Err = (error) => ({ _tag: "Err", error });

let failNextWrite = process.env.MOCHI_LIFE_FAIL_ONCE === "1";

/** Test / demo hook: next `stdout.write` settles as Err, then clears. */
export const __forceFailNextWrite = () => {
  failNextWrite = true;
};

const write = (chunk) => {
  try {
    if (failNextWrite) {
      failNextWrite = false;
      return Err("forced write failure");
    }
    process.stdout.write(chunk);
    return Ok(0);
  } catch (e) {
    return Err(e instanceof Error ? e.message : String(e));
  }
};

// One-time setup: switch to the alternate screen buffer and hide the cursor, so
// the animation owns the screen and restores the scrollback on exit.
export const setup = () => () => {
  const r = write("\x1b[?1049h\x1b[?25l");
  if (r._tag === "Err") return Promise.resolve(r);
  process.on("exit", () => {
    try {
      process.stdout.write("\x1b[?25h\x1b[?1049l");
    } catch {
      /* best-effort restore */
    }
  });
  return Promise.resolve(Ok(0));
};

// Redraw a frame in place: home the cursor (no scroll) and repaint. `label`
// rides along so the caller can show a generation counter.
export const draw = (label, frame) => () => Promise.resolve(write(`\x1b[H${label}\n${frame}\n`));

// Leave the alternate buffer / restore the cursor once the run finishes.
export const teardown = () => () => Promise.resolve(write("\x1b[?25h\x1b[?1049l"));
