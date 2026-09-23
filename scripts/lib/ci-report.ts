import type { Outcome } from "./terminal";
import { duration } from "./terminal";

export type CiFailureReport = {
  readonly name: string;
  readonly outcome: "failed" | "timeout";
  readonly ms: number;
  readonly exit: number;
  readonly timeoutMs: number;
  readonly lines: readonly string[];
  readonly tail: number;
};

export type CiSummary = {
  readonly total: number;
  readonly passed: number;
  readonly failed: readonly string[];
  readonly timedOut: readonly string[];
  readonly cancelled: number;
  readonly elapsed: string;
};

/** Property values inside a GitHub Actions workflow command. */
const ghProp = (value: string): string =>
  value
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A")
    .replaceAll(":", "%3A")
    .replaceAll(",", "%2C");

const ghMessage = (value: string): string =>
  value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");

const isChildGroup = (line: string): boolean =>
  line.startsWith("::group::") || line.startsWith("::endgroup::");

/**
 * One settled task, off a TTY. `failed` / `timeout` lines are the agent parse
 * target; `::error::` is the GitHub annotation and must stay at column 0.
 */
export const formatCiTaskLine = (
  name: string,
  outcome: Exclude<Outcome, "failed" | "timeout"> | "running",
  ms = 0,
): string => {
  switch (outcome) {
    case "running":
      return `running ${name}\n`;
    case "passed":
      return `passed ${name} duration=${duration(ms)}\n`;
    case "cancelled":
      return `cancelled ${name}\n`;
    default: {
      const neverOutcome: never = outcome;
      return neverOutcome;
    }
  }
};

export const formatCiFailure = (input: CiFailureReport): string => {
  const capped = input.tail === 0 ? input.lines : input.lines.slice(-input.tail);
  const dropped = input.lines.length - capped.length;
  const kept = capped.filter((line) => !isChildGroup(line));
  const detail =
    input.outcome === "timeout"
      ? `timeout ${input.name} after=${duration(input.timeoutMs)}`
      : `failed ${input.name} exit=${input.exit} duration=${duration(input.ms)}`;
  const annotation =
    input.outcome === "timeout"
      ? `::error title=${ghProp(input.name)}::timed out after ${duration(input.timeoutMs)}`
      : `::error title=${ghProp(input.name)}::failed in ${duration(input.ms)} (exit ${input.exit})`;
  const omit = dropped > 0 ? `${dropped} earlier lines omitted\n` : "";
  const body = kept.length > 0 ? `${kept.join("\n")}\n` : "";
  return `${detail}\n::group::${input.name}\n${omit}${body}::endgroup::\n${annotation}\n`;
};

export const formatCiSummary = (input: CiSummary): string => {
  const bad = [...input.failed, ...input.timedOut];
  const parts = [
    `${input.passed} passed`,
    input.failed.length > 0 ? `${input.failed.length} failed` : "",
    input.timedOut.length > 0 ? `${input.timedOut.length} timed out` : "",
    input.cancelled > 0 ? `${input.cancelled} cancelled` : "",
  ].filter((part) => part !== "");
  const names = bad.length > 0 ? ` — ${bad.join(", ")}` : "";
  const line = `${input.total} tasks: ${parts.join(", ")} (${input.elapsed})${names}`;
  return bad.length === 0 ? `${line}\n` : `${line}\n::error::${ghMessage(line)}\n`;
};
