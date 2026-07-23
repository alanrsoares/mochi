// Host effects for the animated Life. A `Task a` is a LAZY async computation
// `() => Promise<a>` — building one runs nothing; `run` starts it. The Mochi
// side stays pure; every side effect (writing to the terminal, sleeping) lives
// here behind an `extern`.

// --- Task combinators (curried, so they compose through Mochi's `|>`) ---
export const of = (x) => () => Promise.resolve(x);
export const mapT = (f) => (t) => () => t().then(f);
export const andThen = (f) => (t) => () => t().then((x) => f(x)());
export const delay = (ms) => (x) => () =>
  new Promise((res) => setTimeout(() => res(x), ms));
export const run = (t) => t(); // kick it off — hands the Promise to the JS host

// --- Terminal frame buffer ---
// One-time setup: switch to the alternate screen buffer and hide the cursor, so
// the animation owns the screen and restores the scrollback on exit.
export const setup = () => () => {
  process.stdout.write("\x1b[?1049h\x1b[?25l");
  process.on("exit", () => process.stdout.write("\x1b[?25h\x1b[?1049l"));
  return Promise.resolve(0);
};

// Redraw a frame in place: home the cursor (no scroll) and repaint. `label`
// rides along so the caller can show a generation counter.
export const draw = (label) => (frame) => () => {
  process.stdout.write(`\x1b[H${label}\n${frame}\n`);
  return Promise.resolve(0);
};

// Leave the alternate buffer / restore the cursor once the run finishes.
export const teardown = () => () => {
  process.stdout.write("\x1b[?25h\x1b[?1049l");
  return Promise.resolve(0);
};

