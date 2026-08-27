/**
 * Runs the repo's quality gates concurrently — the same task set the sequential
 * `&&` chains in `check` / `check:full` held, minus the waiting.
 *
 * The set is DERIVED, never duplicated: root gates are `bun run <script>` against
 * this package.json (so editing `lint`/`typecheck`/`test` there moves the gate),
 * and every workspace package declaring the target script contributes one task.
 *
 * Usage: bun scripts/tui-runner.ts [check | check:full | <script>]
 *          [--filter <glob>] [--bail] [--timeout <ms>]
 *          [--compact] [--tail <n>]
 *
 * `--compact` is the machine-readable mode: no colour, no cursor tricks, no
 * per-line prefixes, and output only from the tasks that actually failed —
 * capped to the last `--tail` lines each. A green run prints one line total.
 */
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { match } from "@onrails/pattern";
import { match as matchResult, tryAsync, trySync } from "@onrails/result";

type TaskSpec = {
  readonly name: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly color: string;
};

/**
 * `cancelled` = killed by `--bail` after a sibling failed, so it is not a finding
 * of its own. `timeout` = the task blew `--timeout` and was SIGKILLed, which is a
 * finding: a wedged `tsc` used to hang the whole gate forever.
 */
type Outcome = "passed" | "failed" | "cancelled" | "timeout";

type TaskResult = {
  readonly name: string;
  readonly outcome: Outcome;
  readonly ms: number;
};

type Options = {
  readonly target: string;
  readonly filter: string | null;
  readonly bail: boolean;
  readonly timeout: number;
  readonly compact: boolean;
  readonly tail: number;
};

const ROOT = dirname(import.meta.dir);

/** Generous by design — this is a wedge detector, not a performance budget. */
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

/** Failing tools put the verdict last, so the tail is the part worth spending tokens on. */
const DEFAULT_TAIL_LINES = 40;

const USAGE =
  "usage: bun scripts/tui-runner.ts [check | check:full | <script>] " +
  "[--filter <glob>] [--bail] [--timeout <ms>] [--compact] [--tail <n>]";

/** `never` return, so the `Err` branch below needs no value of its own. */
const usageExit = (message: string): never => {
  process.stderr.write(`${message}\n${USAGE}\n`);
  process.exit(2);
};

const readOptions = (argv: readonly string[]): Options => {
  // `parseArgs` is strict, so a typo'd flag is a usage error rather than a
  // silently ignored one — but it reports it as a stack trace, which is not.
  // Unannotated, so the literal `options` shape still narrows `values` — an
  // explicit `ReturnType<typeof parseArgs>` would widen every field to unknown.
  const parse = trySync(
    () =>
      parseArgs({
        args: [...argv],
        allowPositionals: true,
        options: {
          filter: { type: "string" },
          bail: { type: "boolean", default: false },
          timeout: { type: "string" },
          compact: { type: "boolean", default: false },
          tail: { type: "string" },
        },
      }),
    (error) => (error instanceof Error ? error.message : String(error)),
  );

  const { values, positionals } = matchResult(parse(), (parsed) => parsed, usageExit);
  const timeout = Number(values.timeout ?? DEFAULT_TIMEOUT_MS);
  const tail = Number(values.tail ?? DEFAULT_TAIL_LINES);
  return {
    target: positionals[0] ?? "check",
    filter: values.filter ?? null,
    bail: values.bail,
    timeout: Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_TIMEOUT_MS,
    // `--tail 0` means "no cap"; anything unparseable falls back to the default.
    compact: values.compact,
    tail: Number.isFinite(tail) && tail >= 0 ? tail : DEFAULT_TAIL_LINES,
  };
};

// Parsed at module scope because the colour and cursor decisions below depend on it.
const OPTS = readOptions(process.argv.slice(2));

/**
 * Two decisions, not one. `COLOR` says whether SGR codes are legible — Bun folds
 * isatty, NO_COLOR, FORCE_COLOR, TERM=dumb and CI into it. `INTERACTIVE` says
 * whether the cursor can be moved, which is what live streaming and the pinned
 * status block actually need. Conflating them made `NO_COLOR=1` on a terminal
 * silently switch to buffered CI output.
 */
const COLOR = !OPTS.compact && Bun.enableANSIColors;
const INTERACTIVE = !OPTS.compact && Boolean(process.stdout.isTTY);

const sgr = (code: string): string => (COLOR ? code : "");
const RESET = sgr("\x1b[0m");
const BOLD = sgr("\x1b[1m");
const DIM = sgr("\x1b[2m");
const GRAY = sgr("\x1b[90m");
const RED = sgr("\x1b[31m");
const GREEN = sgr("\x1b[32m");
const YELLOW = sgr("\x1b[33m");
const CYAN = sgr("\x1b[96m");

/** Hex, not raw SGR: `Bun.color(_, "ansi")` downsamples to whatever depth the terminal has. */
const ansi = (hex: string): string => sgr(Bun.color(hex, "ansi") ?? "");

const PALETTE = [
  "#22d3ee",
  "#f472b6",
  "#60a5fa",
  "#facc15",
  "#4ade80",
  "#2dd4bf",
  "#c084fc",
] as const;

/** `PALETTE` is non-empty, but index access is checked — fall back to no colour. */
const taskColor = (index: number): string => ansi(PALETTE[index % PALETTE.length] ?? "");

const columns = (): number => process.stdout.columns ?? 80;
const rule = (): string => `${GRAY}${"─".repeat(Math.max(0, columns() - 3))}${RESET}`;

const duration = (ms: number): string =>
  ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;

/**
 * A partial cell for the leading edge, so the bar advances smoothly at 80ms
 * ticks instead of jumping a whole column every ~14% of a seven-task run.
 */
const EIGHTHS = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉"] as const;

const meter = (ratio: number, width: number, color: string): string => {
  const cells = Math.max(0, Math.min(1, ratio)) * width;
  const full = Math.floor(cells);
  const edge = EIGHTHS[Math.floor((cells - full) * 8)] ?? "";
  const body = `${"█".repeat(full)}${edge}`;
  return `${color}${body}${RESET}${GRAY}${"░".repeat(Math.max(0, width - Bun.stringWidth(body)))}${RESET}`;
};

/** One buffered sink for every producer — seven tasks logging a line each is otherwise seven syscalls. */
const out = Bun.stdout.writer({ highWaterMark: 64 * 1024 });

// Widest task name, so every prefix lands in the same column. Set once in `main`.
let gutter = 0;
let allTasks: readonly TaskSpec[] = [];

const label = (spec: TaskSpec): string => `${spec.color}${BOLD}${spec.name.padEnd(gutter)}${RESET}`;

// ── pinned status block ──────────────────────────────────────────────────────

type Phase = "pending" | "running" | Outcome;

/**
 * One record per task instead of a map per field: `began` is the live clock a
 * running row counts up from, `ms` the wall time a settled row keeps showing.
 */
type TaskState = {
  readonly phase: Phase;
  readonly began?: number;
  readonly ms?: number;
};

const states = new Map<string, TaskState>();
const stateOf = (name: string): TaskState => states.get(name) ?? { phase: "pending" };

const PHASE_ICON: Record<Phase, string> = {
  pending: `${GRAY}◌${RESET}`,
  running: "",
  passed: `${GREEN}✔${RESET}`,
  failed: `${RED}✖${RESET}`,
  cancelled: `${GRAY}⊘${RESET}`,
  timeout: `${RED}⏱${RESET}`,
};

const PHASE_COLOR: Record<Phase, string> = {
  pending: GRAY,
  running: CYAN,
  passed: GREEN,
  failed: RED,
  cancelled: GRAY,
  timeout: YELLOW,
};

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;

/** Settled = no longer occupying a slot, whatever the verdict. */
const isSettled = (phase: Phase): boolean => phase !== "pending" && phase !== "running";

let frame = 0;
let runStarted = performance.now();
let painted = 0;
let done = false;

/**
 * Clip to the terminal width. A status line that wraps occupies two physical
 * rows, which desynchronises the `\x1b[{n}F` line count and makes the block
 * eat its own scrollback. Colour is dropped on the clipped path so a truncated
 * escape can never leak into the next line.
 */
const fit = (text: string): string => {
  const max = columns() - 1;
  if (Bun.stringWidth(text) <= max) return text;
  return `${Bun.stripANSI(text).slice(0, Math.max(0, max - 1))}…`;
};

/**
 * A running task counts up from its start; a settled one keeps its final cost.
 * Right-aligned so the column does not jitter as digits are gained.
 */
const timing = ({ phase, began, ms }: TaskState): string =>
  phase === "running" && began !== undefined
    ? duration(performance.now() - began)
    : ms === undefined
      ? ""
      : duration(ms);

const statusLine = (spec: TaskSpec): string => {
  const state = stateOf(spec.name);
  const { phase } = state;
  const icon =
    phase === "running" ? `${CYAN}${SPINNER[frame % SPINNER.length]}${RESET}` : PHASE_ICON[phase];
  const name = phase === "pending" ? `${DIM}${spec.name.padEnd(gutter)}${RESET}` : label(spec);
  const time = timing(state);
  return `  ${icon} ${name} ${PHASE_COLOR[phase]}${phase.padEnd(9)}${RESET}${GRAY}${time.padStart(8)}${RESET}`;
};

/**
 * The one line worth reading at a glance: how far through the set the run is,
 * and how long it has been going. Sits above the per-task rows and is redrawn
 * with them, so its cost is a repaint, not a scroll.
 */
const headerLine = (): string => {
  const settled = allTasks.map((t) => stateOf(t.name).phase).filter(isSettled);
  const bad = settled.filter((p) => p === "failed" || p === "timeout").length;
  const ratio = allTasks.length === 0 ? 0 : settled.length / allTasks.length;
  const width = Math.max(10, Math.min(24, columns() - gutter - 34));
  const tally = `${settled.length}/${allTasks.length}`;
  const failures = bad > 0 ? ` ${RED}✖${bad}${RESET}` : "";
  return (
    `  ${meter(ratio, width, bad > 0 ? RED : GREEN)} ` +
    `${BOLD}${tally}${RESET}${failures} ${GRAY}${duration(performance.now() - runStarted)}${RESET}`
  );
};

const clear = (): void => {
  if (painted === 0) return;
  out.write(`\x1b[${painted}F\x1b[0J`);
  painted = 0;
};

const paint = (): void => {
  if (!INTERACTIVE || done || allTasks.length === 0) return;
  // Leading blank line: the block is pinned directly under the scrolling log,
  // and without it the newest log line and the progress meter read as one row.
  const lines = ["", headerLine(), ...allTasks.map(statusLine)].map(fit);
  out.write(`${lines.join("\n")}\n`);
  painted = lines.length;
};

/**
 * Every scrolling write goes through here: erase the pinned block, append the
 * text to the log region, redraw the block underneath. Off a TTY it degrades to
 * a plain buffered write.
 */
const write = (text: string): void => {
  clear();
  out.write(text);
  paint();
  out.flush();
};

/** The only writer of `states` — a repaint follows, so every caller stays a one-liner. */
const setPhase = (name: string, phase: Phase, patch: Omit<TaskState, "phase"> = {}): void => {
  states.set(name, { ...stateOf(name), ...patch, phase });
  if (INTERACTIVE) write("");
};

const showCursor = (): void => {
  if (!INTERACTIVE) return;
  out.write("\x1b[?25h");
  out.flush();
};

// ── task execution ───────────────────────────────────────────────────────────

/**
 * Where a task's output goes. On a TTY it streams live, prefixed by task name;
 * off a TTY it is buffered and printed as one block when the task ends, so a CI
 * log stays readable instead of interleaving seven producers line by line.
 */
type Sink = {
  readonly line: (text: string, stderr: boolean) => void;
  readonly flush: (outcome: Outcome) => void;
};

/** Compact mode drops the per-line `name │` prefix for a single header — same information, once. */
const compactSink = (spec: TaskSpec, opts: Options): Sink => {
  const buffered: string[] = [];
  return {
    line: (text) => {
      if (text.trim() !== "") buffered.push(text);
    },
    flush: (outcome) => {
      if (outcome === "passed" || outcome === "cancelled" || buffered.length === 0) return;
      const capped = opts.tail === 0 ? buffered : buffered.slice(-opts.tail);
      const dropped = buffered.length - capped.length;
      const head =
        dropped > 0
          ? `--- ${spec.name} (${dropped} earlier lines omitted)\n`
          : `--- ${spec.name}\n`;
      write(`${head}${capped.join("\n")}\n`);
    },
  };
};

const makeSink = (spec: TaskSpec, opts: Options): Sink => {
  if (opts.compact) return compactSink(spec, opts);

  const buffered: string[] = [];
  const render = (text: string, stderr: boolean): string =>
    `${label(spec)} ${GRAY}${stderr ? "┃" : "│"}${RESET} ${text}\n`;

  return INTERACTIVE
    ? {
        line: (text, stderr) => {
          if (text.trim() !== "") write(render(text, stderr));
        },
        flush: () => {},
      }
    : {
        line: (text, stderr) => {
          if (text.trim() !== "") buffered.push(render(text, stderr));
        },
        flush: () => {
          if (buffered.length > 0) write(buffered.join(""));
        },
      };
};

/**
 * `--bail` and SIGINT both fire this once, and every task both stops waiting on
 * its own subprocess and refuses to start another: a `bun run` grandchild keeps
 * the pipe open after SIGTERM, so waiting for the drain would defeat the point.
 */
const bail = new AbortController();
const bailed = new Promise<"cancelled">((resolve) => {
  bail.signal.addEventListener("abort", () => resolve("cancelled"), { once: true });
});

/**
 * Decode a piped stream line by line, flushing the decoder so a multi-byte char
 * split at EOF survives. `signal` cancels the reader rather than waiting for EOF:
 * an orphaned grandchild holds the write end open, and a pending read would keep
 * the event loop alive long after the summary printed. Both `--bail` and an
 * expired `--timeout` fire it, since either can leave that grandchild behind.
 */
const pump = async (
  stream: ReadableStream<Uint8Array>,
  onLine: (line: string) => void,
  signal: AbortSignal,
): Promise<void> => {
  const reader = stream.getReader();
  const cancel = (): void => {
    void reader.cancel();
  };
  signal.addEventListener("abort", cancel, { once: true });
  const decoder = new TextDecoder("utf-8");
  let rest = "";
  try {
    for (;;) {
      const { done: eof, value } = await reader.read();
      if (eof) break;
      const chunks = (rest + decoder.decode(value, { stream: true })).split("\n");
      rest = chunks.at(-1) ?? "";
      for (const line of chunks.slice(0, -1)) onLine(line);
    }
    const tail = rest + decoder.decode();
    if (tail.trim() !== "") onLine(tail);
  } finally {
    signal.removeEventListener("abort", cancel);
    if (!signal.aborted) reader.releaseLock();
  }
};

/** How long a killed task gets to drain before its readers are cancelled outright. */
const DRAIN_GRACE_MS = 250;

/**
 * The scrollback line a task leaves behind once it settles — exhaustive over
 * `Outcome`, so a new outcome is a compile error here rather than a silent
 * fall-through into the failure wording.
 */
const verdict = (
  spec: TaskSpec,
  outcome: Outcome,
  ms: number,
  exit: number,
  opts: Options,
): string => {
  const head = `${PHASE_ICON[outcome]} ${label(spec)}`;
  return match(outcome)
    .with("passed", () => `${head} ${GREEN}passed${RESET} ${GRAY}in ${duration(ms)}${RESET}\n`)
    .with(
      "timeout",
      () => `${head} ${YELLOW}timed out${RESET} ${GRAY}after ${duration(opts.timeout)}${RESET}\n`,
    )
    .with("cancelled", () => `${head} ${GRAY}cancelled${RESET}\n`)
    .with(
      "failed",
      () => `${head} ${RED}failed${RESET} ${GRAY}in ${duration(ms)} (exit ${exit})${RESET}\n`,
    )
    .exhaustive();
};

const runTask = async (spec: TaskSpec, opts: Options): Promise<TaskResult> => {
  if (bail.signal.aborted) {
    setPhase(spec.name, "cancelled");
    return { name: spec.name, outcome: "cancelled", ms: 0 };
  }

  const started = performance.now();
  const sink = makeSink(spec, opts);
  setPhase(spec.name, "running", { began: started });
  // On a TTY the pinned block already shows this; off one it is the only trace.
  // Compact mode reports nothing until a task has an outcome worth a line.
  if (!INTERACTIVE && !opts.compact) {
    write(`${CYAN}•${RESET} ${label(spec)} ${GRAY}started${RESET}\n`);
  }

  const proc = Bun.spawn(["bun", ...spec.args], {
    cwd: spec.cwd,
    env: { ...process.env, ...(COLOR ? { FORCE_COLOR: "1" } : {}) },
    stdout: "pipe",
    stderr: "pipe",
    timeout: opts.timeout,
    killSignal: "SIGKILL",
  });

  // Per-task drain control, wired to the global bail: a timeout kill has to be
  // able to abandon its own pipes without cancelling every sibling's.
  const drain = new AbortController();
  const stopDrain = (): void => {
    drain.abort();
  };
  bail.signal.addEventListener("abort", stopDrain, { once: true });

  const streams = Promise.all([
    pump(proc.stdout, (line) => sink.line(line, false), drain.signal),
    pump(proc.stderr, (line) => sink.line(line, true), drain.signal),
  ]).catch(() => undefined);
  const exit = await Promise.race([proc.exited, bailed]);

  if (exit === "cancelled") {
    proc.kill();
    bail.signal.removeEventListener("abort", stopDrain);
    const ms = performance.now() - started;
    setPhase(spec.name, "cancelled", { ms });
    if (!opts.compact) write(verdict(spec, "cancelled", ms, 0, opts));
    return { name: spec.name, outcome: "cancelled", ms };
  }
  /**
   * `proc.killed` is NOT "we killed it" — Bun sets it on any exited process, so
   * it labelled every ordinary non-zero exit a timeout. `signalCode` is the real
   * signal, and SIGKILL can only come from the spawn timeout: the `--bail` path
   * sends SIGTERM and has already returned above.
   */
  const timedOut = proc.signalCode === "SIGKILL";

  // A SIGKILLed `bun run` can leave a grandchild holding the pipe, so a killed
  // task drains on a clock; a task that exited on its own closes it promptly.
  if (timedOut) {
    await Promise.race([streams, Bun.sleep(DRAIN_GRACE_MS)]);
    drain.abort();
  } else {
    await streams;
  }
  bail.signal.removeEventListener("abort", stopDrain);

  const ms = performance.now() - started;
  // The only kill left is the spawn timeout — the bail path returned above.
  const outcome: Outcome = exit === 0 ? "passed" : timedOut ? "timeout" : "failed";
  setPhase(spec.name, outcome, { ms });
  if (opts.compact) {
    if (outcome !== "passed") write(`${outcome.toUpperCase()} ${spec.name} (${duration(ms)})\n`);
    sink.flush(outcome);
  } else {
    sink.flush(outcome);
    write(verdict(spec, outcome, ms, exit, opts));
  }

  if (outcome !== "passed" && opts.bail) bail.abort();
  return { name: spec.name, outcome, ms };
};

// ── task discovery ───────────────────────────────────────────────────────────

type WorkspacePkg = { readonly name: string; readonly dir: string; readonly scripts: string[] };

/**
 * Workspace members, read from the root `workspaces` globs rather than by
 * scanning the tree — a bare `package.json` walk descends into `node_modules/.bun`
 * and every `dist`. Handles both the array and the `{ packages, catalog }` form.
 */
const workspacePackages = async (): Promise<WorkspacePkg[]> => {
  const root = await Bun.file(join(ROOT, "package.json")).json();
  const workspaces: unknown = root.workspaces;
  const globs: string[] = Array.isArray(workspaces)
    ? workspaces
    : ((workspaces as { packages?: string[] } | undefined)?.packages ?? []);

  const paths: string[] = [];
  for (const glob of globs) {
    for await (const rel of new Bun.Glob(`${glob}/package.json`).scan({ cwd: ROOT })) {
      paths.push(rel);
    }
  }

  // Read in parallel and drop the unreadable: an unparseable manifest in some
  // unrelated package should cost that package its task, not the whole run.
  const read = await Promise.all(
    paths.map((rel) =>
      tryAsync(Bun.file(join(ROOT, rel)).json())
        .map((manifest): WorkspacePkg | null =>
          typeof manifest?.name === "string"
            ? {
                name: manifest.name,
                dir: join(ROOT, dirname(rel)),
                scripts: Object.keys(manifest.scripts ?? {}),
              }
            : null,
        )
        .unwrapOr(null),
    ),
  );
  return read.filter((pkg): pkg is WorkspacePkg => pkg !== null);
};

/** Root gates, named by script so this file never restates what they run. */
const ROOT_GATES = ["lint", "typecheck", "fmt:check"] as const;

const buildTasks = async (opts: Options): Promise<TaskSpec[]> => {
  const isCheck = opts.target === "check" || opts.target === "check:full";
  const script = isCheck ? "check" : opts.target;

  // `--filter` scopes to workspace packages, so the root gates step aside.
  const rootScripts =
    isCheck && opts.filter === null
      ? [
          ...ROOT_GATES,
          ...(opts.target === "check:full" ? ["test:full", "test:mochi:coverage"] : ["test"]),
        ]
      : [];

  const scope = opts.filter === null ? null : new Bun.Glob(opts.filter);
  const members = (await workspacePackages())
    .filter((pkg) => pkg.scripts.includes(script))
    .filter((pkg) => scope === null || scope.match(pkg.name));

  const specs = [
    ...rootScripts.map((s) => ({ name: s, args: ["run", s], cwd: ROOT })),
    ...members.map((pkg) => ({
      name: `${pkg.name}:${script}`,
      args: ["run", script],
      cwd: pkg.dir,
    })),
  ];
  return specs.map((spec, i) => ({ ...spec, color: taskColor(i) }));
};

// ── summary ──────────────────────────────────────────────────────────────────

/**
 * Slowest task first, each with a bar scaled to it — the gate runs concurrently,
 * so the top row is the critical path and the only one worth optimising.
 * Hand-drawn rather than `Bun.inspect.table`, which cannot colour per cell and
 * measures SGR codes as if they were printable.
 */
const summaryTable = (results: readonly TaskResult[]): string => {
  const ranked = [...results].sort((a, b) => b.ms - a.ms);
  const slowest = Math.max(1, ...ranked.map((r) => r.ms));
  const times = ranked.map((r) => duration(r.ms));
  const timeCol = Math.max(...times.map((t) => t.length));
  const width = Math.max(8, Math.min(28, columns() - gutter - timeCol - 12));
  return ranked
    .map((r, i) => {
      const spec = allTasks.find((t) => t.name === r.name);
      const name = spec === undefined ? r.name.padEnd(gutter) : label(spec);
      const bar =
        r.outcome === "cancelled" ? "" : meter(r.ms / slowest, width, PHASE_COLOR[r.outcome]);
      return `  ${PHASE_ICON[r.outcome]} ${name} ${GRAY}${(times[i] ?? "").padStart(timeCol)}${RESET} ${bar}`;
    })
    .join("\n");
};

const main = async (): Promise<void> => {
  const opts = OPTS;
  const tasks = await buildTasks(opts);
  const scope = opts.filter === null ? "" : ` --filter ${opts.filter}`;
  if (tasks.length === 0) {
    write(`no task matches '${opts.target}'${scope}\n`);
    out.flush();
    return;
  }

  allTasks = tasks;
  gutter = Math.max(...tasks.map((t) => Bun.stringWidth(t.name)));
  for (const t of tasks) states.set(t.name, { phase: "pending" });

  let interrupted = false;
  const onSigint = (): void => {
    interrupted = true;
    bail.abort();
  };
  process.on("SIGINT", onSigint);
  // Hidden cursor is process-global state — every exit path below restores it.
  if (INTERACTIVE) out.write("\x1b[?25l");

  const started = performance.now();
  runStarted = started;
  if (!opts.compact) {
    const plan = `${tasks.length} task${tasks.length === 1 ? "" : "s"}, concurrent`;
    write(
      `\n ${BOLD}${CYAN}◆ mochi${RESET} ${BOLD}${opts.target}${scope}${RESET} ${GRAY}${plan}${RESET}\n`,
    );
    write(` ${tasks.map((t) => `${t.color}▪${RESET}${GRAY} ${t.name}${RESET}`).join("  ")}\n`);
    // The pinned block supplies its own leading blank line; off a TTY nothing
    // is pinned, so the gap has to come from here instead.
    write(INTERACTIVE ? `${rule()}\n` : `${rule()}\n\n`);
  }

  const ticker = INTERACTIVE
    ? setInterval(() => {
        frame += 1;
        clear();
        paint();
        out.flush();
      }, 80)
    : null;

  try {
    const results = await Promise.all(tasks.map((task) => runTask(task, opts)));
    const failed = results.filter((r) => r.outcome === "failed" || r.outcome === "timeout");
    const passed = results.filter((r) => r.outcome === "passed");
    const cancelled = results.length - failed.length - passed.length;

    // Retire the pinned block before the summary so it is not redrawn under it.
    if (ticker !== null) clearInterval(ticker);
    clear();
    done = true;

    const elapsed = duration(performance.now() - started);
    if (opts.compact) {
      // One line, and it is the only line a fully green run produces.
      const tally = [
        `${passed.length} passed`,
        failed.length > 0 ? `${failed.length} failed` : "",
        cancelled > 0 ? `${cancelled} cancelled` : "",
      ].filter((part) => part !== "");
      const names = failed.length > 0 ? ` — ${failed.map((r) => r.name).join(", ")}` : "";
      write(`${results.length} tasks: ${tally.join(", ")} (${elapsed})${names}\n`);
    } else {
      const green = failed.length === 0 && cancelled === 0;
      const banner = green
        ? `${GREEN}${BOLD} ✔ ${results.length}/${results.length} passed${RESET}`
        : `${RED}${BOLD} ✖ ${failed.length} failed${RESET}${GRAY}, ${passed.length} passed${
            cancelled > 0 ? `, ${cancelled} cancelled${RESET}` : ""
          }${RESET}`;
      write(`\n${rule()}\n`);
      write(`${summaryTable(results)}\n\n`);
      write(`${banner} ${GRAY}in ${elapsed}${RESET}\n`);
      if (failed.length > 0) {
        write(`${RED}   ↳${RESET} ${GRAY}${failed.map((r) => r.name).join(", ")}${RESET}\n`);
      }
      write("\n");
    }

    // `exitCode` over `process.exit`: let the runtime drain stdout first.
    process.exitCode = interrupted ? 130 : failed.length > 0 ? 1 : 0;
  } finally {
    if (ticker !== null) clearInterval(ticker);
    process.off("SIGINT", onSigint);
    showCursor();
    out.flush();
  }
};

await main();
