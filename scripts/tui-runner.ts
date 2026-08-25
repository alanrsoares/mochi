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

const readOptions = (argv: readonly string[]): Options => {
  // `parseArgs` is strict, so a typo'd flag is a usage error rather than a
  // silently ignored one — but it reports it as a stack trace, which is not.
  // Unannotated, so the literal `options` shape still narrows `values` — an
  // explicit `ReturnType<typeof parseArgs>` would widen every field to unknown.
  const parse = () =>
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
    });

  let parsed: ReturnType<typeof parse>;
  try {
    parsed = parse();
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n${USAGE}\n`);
    process.exit(2);
  }
  const { values, positionals } = parsed;
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
const GRAY = sgr("\x1b[90m");
const RED = sgr("\x1b[31m");
const GREEN = sgr("\x1b[32m");
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

/** One buffered sink for every producer — seven tasks logging a line each is otherwise seven syscalls. */
const out = Bun.stdout.writer({ highWaterMark: 64 * 1024 });

// Widest task name, so every prefix lands in the same column. Set once in `main`.
let gutter = 0;
let allTasks: readonly TaskSpec[] = [];

const label = (spec: TaskSpec): string => `${spec.color}${BOLD}${spec.name.padEnd(gutter)}${RESET}`;

// ── pinned status block ──────────────────────────────────────────────────────

type Phase = "pending" | "running" | Outcome;

const phases = new Map<string, Phase>();
const startedAt = new Map<string, number>();

const PHASE_ICON: Record<Phase, string> = {
  pending: `${GRAY}◌${RESET}`,
  running: "",
  passed: `${GREEN}✔${RESET}`,
  failed: `${RED}✖${RESET}`,
  cancelled: `${GRAY}⊘${RESET}`,
  timeout: `${RED}⏱${RESET}`,
};

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;

let frame = 0;
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

const statusLine = (spec: TaskSpec): string => {
  const phase = phases.get(spec.name) ?? "pending";
  const icon =
    phase === "running" ? `${CYAN}${SPINNER[frame % SPINNER.length]}${RESET}` : PHASE_ICON[phase];
  const began = startedAt.get(spec.name);
  const elapsed =
    phase === "running" && began !== undefined ? ` ${duration(performance.now() - began)}` : "";
  return `  ${icon} ${label(spec)} ${GRAY}${phase}${elapsed}${RESET}`;
};

const clear = (): void => {
  if (painted === 0) return;
  out.write(`\x1b[${painted}F\x1b[0J`);
  painted = 0;
};

const paint = (): void => {
  if (!INTERACTIVE || done || allTasks.length === 0) return;
  const lines = allTasks.map((spec) => fit(statusLine(spec)));
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

const setPhase = (name: string, phase: Phase): void => {
  phases.set(name, phase);
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

const runTask = async (spec: TaskSpec, opts: Options): Promise<TaskResult> => {
  if (bail.signal.aborted) {
    setPhase(spec.name, "cancelled");
    return { name: spec.name, outcome: "cancelled", ms: 0 };
  }

  const started = performance.now();
  startedAt.set(spec.name, started);
  const sink = makeSink(spec, opts);
  setPhase(spec.name, "running");
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
    setPhase(spec.name, "cancelled");
    if (!opts.compact) write(`${GRAY}⊘ ${spec.name} cancelled${RESET}\n`);
    return { name: spec.name, outcome: "cancelled", ms: performance.now() - started };
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
  setPhase(spec.name, outcome);
  if (opts.compact) {
    if (outcome !== "passed") write(`${outcome.toUpperCase()} ${spec.name} (${duration(ms)})\n`);
    sink.flush(outcome);
  } else {
    sink.flush(outcome);
    write(
      outcome === "passed"
        ? `${GREEN}✔${RESET} ${label(spec)} ${GREEN}passed${RESET} ${GRAY}in ${duration(ms)}${RESET}\n`
        : outcome === "timeout"
          ? `${RED}⏱${RESET} ${label(spec)} ${RED}timed out${RESET} ${GRAY}after ${duration(opts.timeout)}${RESET}\n`
          : `${RED}✖${RESET} ${label(spec)} ${RED}failed${RESET} ${GRAY}in ${duration(ms)} (exit ${exit})${RESET}\n`,
    );
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

  const found: WorkspacePkg[] = [];
  for (const glob of globs) {
    for await (const rel of new Bun.Glob(`${glob}/package.json`).scan({ cwd: ROOT })) {
      const manifest = await Bun.file(join(ROOT, rel)).json();
      if (typeof manifest?.name !== "string") continue;
      found.push({
        name: manifest.name,
        dir: join(ROOT, dirname(rel)),
        scripts: Object.keys(manifest.scripts ?? {}),
      });
    }
  }
  return found;
};

/** Root gates, named by script so this file never restates what they run. */
const ROOT_GATES = ["lint", "typecheck", "fmt:check"] as const;

const buildTasks = async (opts: Options): Promise<TaskSpec[]> => {
  const isCheck = opts.target === "check" || opts.target === "check:full";
  const script = isCheck ? "check" : opts.target;

  // `--filter` scopes to workspace packages, so the root gates step aside.
  const rootScripts =
    isCheck && opts.filter === null
      ? [...ROOT_GATES, opts.target === "check:full" ? "test:full" : "test"]
      : [];

  const match = opts.filter === null ? null : new Bun.Glob(opts.filter);
  const members = (await workspacePackages())
    .filter((pkg) => pkg.scripts.includes(script))
    .filter((pkg) => match === null || match.match(pkg.name));

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

/** Plain text, no SGR: `inspect.table` measures the strings it is handed. */
const summaryTable = (results: readonly TaskResult[]): string => {
  const rows: Record<string, { status: Outcome; time: string }> = {};
  for (const r of results) rows[r.name] = { status: r.outcome, time: duration(r.ms) };
  return Bun.inspect.table(rows, { colors: COLOR });
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
  for (const t of tasks) phases.set(t.name, "pending");

  let interrupted = false;
  const onSigint = (): void => {
    interrupted = true;
    bail.abort();
  };
  process.on("SIGINT", onSigint);
  // Hidden cursor is process-global state — every exit path below restores it.
  if (INTERACTIVE) out.write("\x1b[?25l");

  const started = performance.now();
  if (!opts.compact) {
    write(`\n${BOLD}${CYAN}• mochi ${opts.target}${scope}${RESET}\n`);
    write(`${GRAY}• ${tasks.map((t) => t.name).join(", ")}${RESET}\n`);
    write(`${rule()}\n\n`);
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
      write(`\n${rule()}\n`);
      write(`${summaryTable(results)}\n`);
      write(
        `${BOLD}${CYAN} Tasks:${RESET}    ${GREEN}${passed.length} passed${RESET}${
          failed.length > 0 ? `, ${RED}${failed.length} failed${RESET}` : ""
        }${cancelled > 0 ? `, ${GRAY}${cancelled} cancelled${RESET}` : ""}, ${results.length} total\n`,
      );
      write(`${BOLD}${CYAN} Time:${RESET}     ${elapsed}\n`);
      if (failed.length > 0) {
        write(`${RED} Failed:${RESET}   ${failed.map((r) => r.name).join(", ")}\n`);
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
