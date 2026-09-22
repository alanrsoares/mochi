export type Outcome = "passed" | "failed" | "cancelled" | "timeout";

export type Phase = "pending" | "running" | Outcome;

export type TerminalStyles = {
  readonly sgr: (code: string) => string;
  readonly ansi: (hex: string) => string;
  readonly RESET: string;
  readonly BOLD: string;
  readonly DIM: string;
  readonly GRAY: string;
  readonly RED: string;
  readonly GREEN: string;
  readonly YELLOW: string;
  readonly CYAN: string;
  readonly PHASE_ICON: Record<Phase, string>;
  readonly PHASE_COLOR: Record<Phase, string>;
};

export const createTerminalStyles = (color: boolean): TerminalStyles => {
  const sgr = (code: string): string => (color ? code : "");
  const ansi = (hex: string): string => sgr(Bun.color(hex, "ansi") ?? "");
  const RESET = sgr("\x1b[0m");
  const BOLD = sgr("\x1b[1m");
  const DIM = sgr("\x1b[2m");
  const GRAY = sgr("\x1b[90m");
  const RED = sgr("\x1b[31m");
  const GREEN = sgr("\x1b[32m");
  const YELLOW = sgr("\x1b[33m");
  const CYAN = sgr("\x1b[96m");

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

  return {
    sgr,
    ansi,
    RESET,
    BOLD,
    DIM,
    GRAY,
    RED,
    GREEN,
    YELLOW,
    CYAN,
    PHASE_ICON,
    PHASE_COLOR,
  };
};

export const PALETTE = [
  "#22d3ee",
  "#f472b6",
  "#60a5fa",
  "#facc15",
  "#4ade80",
  "#2dd4bf",
  "#c084fc",
] as const;

export const taskColor = (index: number, color: boolean): string => {
  if (!color) return "";
  const hex = PALETTE[index % PALETTE.length] ?? "";
  return Bun.color(hex, "ansi") ?? "";
};

export const columns = (): number => process.stdout.columns ?? 80;

export const duration = (ms: number): string =>
  ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;

const EIGHTHS = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉"] as const;

export const meter = (
  ratio: number,
  width: number,
  color: string,
  reset: string,
  gray: string,
): string => {
  const cells = Math.max(0, Math.min(1, ratio)) * width;
  const full = Math.floor(cells);
  const edge = EIGHTHS[Math.floor((cells - full) * 8)] ?? "";
  const body = `${"█".repeat(full)}${edge}`;
  return `${color}${body}${reset}${gray}${"░".repeat(Math.max(0, width - Bun.stringWidth(body)))}${reset}`;
};

export const fit = (text: string, cols: number = columns()): string => {
  const max = cols - 1;
  return Bun.stringWidth(text) <= max
    ? text
    : `${Bun.stripANSI(text).slice(0, Math.max(0, max - 1))}…`;
};

export const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;
