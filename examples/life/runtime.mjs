// Domain terminal effects for the animated Life. Sequencing / delay / kick-off
// live in the prelude (`Task.*`, ADR 0005). This host only writes to the
// terminal — each export returns a lazy Task `() => Promise<a>`.

// One-time setup: switch to the alternate screen buffer and hide the cursor, so
// the animation owns the screen and restores the scrollback on exit.
export const setup = () => () => {
  process.stdout.write("\x1b[?1049h\x1b[?25l");
  process.on("exit", () => process.stdout.write("\x1b[?25h\x1b[?1049l"));
  return Promise.resolve(0);
};

// Redraw a frame in place: home the cursor (no scroll) and repaint. `label`
// rides along so the caller can show a generation counter. Nested-curried so
// `draw(label)(frame)` matches the mochi call sites.
export const draw = (label) => (frame) => () => {
  process.stdout.write(`\x1b[H${label}\n${frame}\n`);
  return Promise.resolve(0);
};

// Leave the alternate buffer / restore the cursor once the run finishes.
export const teardown = () => () => {
  process.stdout.write("\x1b[?25h\x1b[?1049l");
  return Promise.resolve(0);
};
