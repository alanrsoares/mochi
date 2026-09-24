/**
 * Runs the repo's quality gates concurrently — the same task set the sequential
 * `&&` chains in `check` / `check:north-star` held, minus the waiting.
 * `check:full` is those two in sequence, not one merged set: each phase runs a
 * core-count-wide test suite, and two at once starve short property tests.
 *
 * The set is DERIVED, never duplicated: root gates are `bun run <script>` against
 * this package.json (so editing `lint`/`typecheck`/`test` there moves the gate),
 * and every workspace package declaring the target script contributes one task.
 *
 * Usage: bun scripts/tui-runner.ts [check | check:north-star | <script>]
 *          [--filter <glob>] [--bail] [--timeout <ms>]
 *          [--jobs <n>] [--compact] [--tail <n>]
 *
 * Off a TTY — CI, a pipe, or `--compact` — failing tasks print an unprefixed
 * tail and a column-0 `::error::` annotation. `--compact` stays quiet on a
 * green run (one summary line). A TTY keeps the live view.
 */
import { availableParallelism } from "node:os";
import { parseArgs } from "node:util";
import { match } from "@onrails/pattern";
import { match as matchResult, trySync } from "@onrails/result";
import {
  columns,
  createTerminalStyles,
  duration,
  findWorkspacePackages,
  fit,
  formatCiFailure,
  formatCiSummary,
  formatCiTaskLine,
  meter,
  type Outcome,
  type Phase,
  pushTail,
  REPO_ROOT,
  SPINNER,
  type TailBuf,
  taskColor,
} from "./lib";

type TaskSpec = {
  readonly name: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly color: string;
};

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
  readonly jobs: number;
};

/** Generous by design — this is a wedge detector, not a performance budget. */
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * How many tasks may be in flight. On a dev box this exceeds the task count, so
 * the gate still starts everything at once; on a 4-vCPU CI runner it stops
 * several CPU-bound compilers sharing four cores, where a graph-sized test
 * starves and eventually trips `--timeout`.
 */
const DEFAULT_JOBS = availableParallelism();

/** Failing tools put the verdict last, so the tail is the part worth spending tokens on. */
const DEFAULT_TAIL_LINES = 40;

const USAGE =
  "usage: bun scripts/tui-runner.ts [check | check:north-star | <script>] " +
  "[--filter <glob>] [--bail] [--timeout <ms>] [--jobs <n>] [--compact] [--tail <n>]";

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
          jobs: { type: "string" },
        },
      }),
    (error) => (error instanceof Error ? error.message : String(error)),
  );

  const { values, positionals } = matchResult(parse(), (parsed) => parsed, usageExit);
  const timeout = Number(values.timeout ?? DEFAULT_TIMEOUT_MS);
  const tail = Number(values.tail ?? DEFAULT_TAIL_LINES);
  const jobs = Number(values.jobs ?? DEFAULT_JOBS);
  return {
    target: positionals[0] ?? "check",
    filter: values.filter ?? null,
    bail: values.bail,
    timeout: Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_TIMEOUT_MS,
    // `--tail 0` means "no cap"; anything unparseable falls back to the default.
    compact: values.compact,
    tail: Number.isFinite(tail) && tail >= 0 ? tail : DEFAULT_TAIL_LINES,
    jobs: Number.isFinite(jobs) && jobs >= 1 ? Math.floor(jobs) : DEFAULT_JOBS,
  };
};

// Parsed at module scope because the colour and cursor decisions below depend on it.
const OPTS = readOptions(process.argv.slice(2));

/**
 * Two decisions, not one. `COLOR` says whether SGR codes are legible — Bun folds
 * isatty, NO_COLOR, FORCE_COLOR, TERM=dumb and CI into it. `INTERACTIVE` says
 * whether the cursor can be moved, which is what live streaming and the pinned
 * status block actually need. Conflating them made `NO_COLOR=1` on a terminal
 * silently switch to buffered CI output. `CI=true` forces that buffered report
 * even when stdout is a TTY, so annotations stay at column 0.
 */
const COLOR = !OPTS.compact && Bun.enableANSIColors;
const IN_CI = process.env.CI === "true" || process.env.CI === "1";
const INTERACTIVE = !OPTS.compact && !IN_CI && Boolean(process.stdout.isTTY);

const { RESET, BOLD, DIM, GRAY, RED, GREEN, YELLOW, CYAN, PHASE_ICON, PHASE_COLOR } =
  createTerminalStyles(COLOR);

const colorForTask = (index: number): string => taskColor(index, COLOR);
const rule = (): string => `${GRAY}${"─".repeat(Math.max(0, columns() - 3))}${RESET}`;
const renderMeter = (ratio: number, width: number, color: string): string =>
  meter(ratio, width, color, RESET, GRAY);

/** One buffered sink for every producer — seven tasks logging a line each is otherwise seven syscalls. */
const out = Bun.stdout.writer({ highWaterMark: 64 * 1024 });

// Widest task name, so every prefix lands in the same column. Set once in `main`.
let gutter = 0;
let allTasks: readonly TaskSpec[] = [];

const label = (spec: TaskSpec): string => `${spec.color}${BOLD}${spec.name.padEnd(gutter)}${RESET}`;

// ── pinned status block ──────────────────────────────────────────────────────

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

/** Settled = no longer occupying a slot, whatever the verdict. */
const isSettled = (phase: Phase): boolean => phase !== "pending" && phase !== "running";

let frame = 0;
let runStarted = performance.now();
let painted = 0;
let done = false;

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
    `  ${renderMeter(ratio, width, bad > 0 ? RED : GREEN)} ` +
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
 * Where a task's output goes. On a TTY it streams live, prefixed by task name.
 * Off a TTY it is buffered and only a failing task's tail is printed, unprefixed,
 * so a child `::error::` stays at column 0. Successful Vite/Bun output stays out
 * of the CI log.
 */
type Sink = {
  readonly line: (text: string, stderr: boolean) => void;
  readonly flush: (outcome: Outcome, ms: number, exit: number) => void;
};

const machineSink = (spec: TaskSpec, opts: Options): Sink => {
  let buf: TailBuf = { lines: [], dropped: 0 };
  return {
    line: (text) => {
      if (text.trim() !== "") buf = pushTail(buf, text, opts.tail);
    },
    flush: (outcome, ms, exit) => {
      if (outcome !== "failed" && outcome !== "timeout") return;
      write(
        formatCiFailure({
          name: spec.name,
          outcome,
          ms,
          exit,
          timeoutMs: opts.timeout,
          lines: buf.lines,
          tail: 0,
          dropped: buf.dropped,
        }),
      );
    },
  };
};

const makeSink = (spec: TaskSpec, opts: Options): Sink => {
  if (!INTERACTIVE) return machineSink(spec, opts);

  const render = (text: string, stderr: boolean): string =>
    `${label(spec)} ${GRAY}${stderr ? "┃" : "│"}${RESET} ${text}\n`;

  return {
    line: (text, stderr) => {
      if (text.trim() !== "") write(render(text, stderr));
    },
    flush: () => {},
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
      () =>
        `${head} ${YELLOW}timed out${RESET} ${GRAY}after ${duration(opts.timeout)}${RESET}\n` +
        `${YELLOW}   ↳ ${spec.name} exceeded the task timeout and was killed; buffered output above is its final tail.${RESET}\n`,
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
  // On a TTY the pinned block already shows this. Off one, a single `running`
  // line is the heartbeat; `--compact` stays silent until something fails.
  if (!INTERACTIVE && !opts.compact) write(formatCiTaskLine(spec.name, "running"));

  const proc = Bun.spawn(["bun", ...spec.args], {
    cwd: spec.cwd,
    env: { ...process.env, ...(COLOR ? { FORCE_COLOR: "1" } : {}) },
    stdout: "pipe",
    stderr: "pipe",
  });

  // Track our own deadline instead of inferring it from `signalCode`. A parent
  // process (a cancelled CI job or an interrupted commit hook) can also send
  // SIGKILL; calling that a timeout turns the real interruption into a bogus
  // "after 900s" finding.
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    proc.kill("SIGKILL");
  }, opts.timeout);

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
    clearTimeout(timeoutId);
    proc.kill();
    bail.signal.removeEventListener("abort", stopDrain);
    const ms = performance.now() - started;
    setPhase(spec.name, "cancelled", { ms });
    if (!INTERACTIVE) {
      if (!opts.compact) write(formatCiTaskLine(spec.name, "cancelled", ms));
    } else {
      write(verdict(spec, "cancelled", ms, 0, opts));
    }
    return { name: spec.name, outcome: "cancelled", ms };
  }
  clearTimeout(timeoutId);

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
  // Only our deadline callback sets `timedOut`; external signals remain failures.
  const outcome: Outcome = exit === 0 ? "passed" : timedOut ? "timeout" : "failed";
  setPhase(spec.name, outcome, { ms });
  if (!INTERACTIVE) {
    if (outcome === "failed" || outcome === "timeout") sink.flush(outcome, ms, exit);
    else if (!opts.compact) write(formatCiTaskLine(spec.name, "passed", ms));
  } else {
    sink.flush(outcome, ms, exit);
    write(verdict(spec, outcome, ms, exit, opts));
  }

  if (outcome !== "passed" && opts.bail) bail.abort();
  return { name: spec.name, outcome, ms };
};

// ── task discovery ───────────────────────────────────────────────────────────

/** Root gates, named by script so this file never restates what they run. */
const ROOT_GATES = ["lint", "typecheck", "fmt:check", "test"] as const;

/**
 * The graph-sized gates `check:full` adds over `check`, grouped because they
 * share one cached typed-graph emit. CI runs them as their own job;
 * `test:mochi:coverage` gets a third runner so its workers do not starve the
 * single-threaded graph build. `bootstrap:self-tsc` and `bootstrap:conformance`
 * are not listed: `test:north-star` and `test` already run them as specs.
 */
const NORTH_STAR_GATES = ["test:north-star", "seed:check"] as const;

const buildTasks = async (opts: Options): Promise<TaskSpec[]> => {
  const isNorthStar = opts.target === "check:north-star";
  const isCheck = opts.target === "check";
  const script = opts.target;

  // `--filter` scopes to workspace packages, so the root gates step aside.
  const rootScripts =
    opts.filter !== null
      ? []
      : isNorthStar
        ? [...NORTH_STAR_GATES]
        : isCheck
          ? [...ROOT_GATES]
          : [];

  const scope = opts.filter === null ? null : new Bun.Glob(opts.filter);
  const members = (await findWorkspacePackages(REPO_ROOT))
    .filter((pkg) => !isNorthStar && pkg.scripts.includes(script))
    .filter((pkg) => scope === null || scope.match(pkg.name));

  const specs = [
    ...rootScripts.map((s) => ({ name: s, args: ["run", s], cwd: REPO_ROOT })),
    ...members.map((pkg) => ({
      name: `${pkg.name}:${script}`,
      args: ["run", script],
      cwd: pkg.dir,
    })),
  ];
  return specs.map((spec, i) => ({ ...spec, color: colorForTask(i) }));
};

// ── scheduling ───────────────────────────────────────────────────────────────

/**
 * Start order, not priority — a long pole queued behind the short ones sets the
 * wall time of the whole gate. The `test*` suites are the longest, then
 * `seed:check`; package `check`s outrank the root one-liners.
 */
const startWeight = (name: string): number =>
  name.startsWith("test")
    ? 3
    : name.startsWith("bootstrap:") || name.startsWith("seed:")
      ? 2
      : name.includes(":")
        ? 1
        : 0;

/**
 * Run every task, at most `opts.jobs` at a time, heaviest started first.
 * Results come back in TASK order regardless of completion order, so the summary
 * and the pinned block stay keyed to the plan the run announced.
 */
const runPooled = async (
  tasks: readonly TaskSpec[],
  opts: Options,
): Promise<readonly TaskResult[]> => {
  const queue = tasks
    .map((task, index) => ({ task, index }))
    .toSorted((a, b) => startWeight(b.task.name) - startWeight(a.task.name));

  const settled = new Map<number, TaskResult>();
  let next = 0;
  const worker = async (): Promise<void> => {
    // `next++` is atomic here: one thread, and no await between read and bump.
    while (next < queue.length) {
      const { task, index } = queue[next++] as { task: TaskSpec; index: number };
      settled.set(index, await runTask(task, opts));
    }
  };

  await Promise.all(Array.from({ length: Math.min(opts.jobs, queue.length) }, () => worker()));
  return tasks.map(
    (task, index) => settled.get(index) ?? { name: task.name, outcome: "cancelled", ms: 0 },
  );
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
        r.outcome === "cancelled" ? "" : renderMeter(r.ms / slowest, width, PHASE_COLOR[r.outcome]);
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
    const results = await runPooled(tasks, opts);
    const failed = results.filter((r) => r.outcome === "failed" || r.outcome === "timeout");
    const passed = results.filter((r) => r.outcome === "passed");
    const cancelled = results.length - failed.length - passed.length;

    // Retire the pinned block before the summary so it is not redrawn under it.
    if (ticker !== null) clearInterval(ticker);
    clear();
    done = true;

    const elapsed = duration(performance.now() - started);
    if (!INTERACTIVE) {
      write(
        formatCiSummary({
          total: results.length,
          passed: passed.length,
          failed: results.filter((r) => r.outcome === "failed").map((r) => r.name),
          timedOut: results.filter((r) => r.outcome === "timeout").map((r) => r.name),
          cancelled,
          elapsed,
        }),
      );
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
