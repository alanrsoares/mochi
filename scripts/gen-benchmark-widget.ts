// Recorded measurements, never a live benchmark during a docs build.
import snapshots from "../docs/benchmarks/runtime-snapshots.json";
import { repoPath, syncGeneratedFile } from "./lib";

type Timing = { readonly before: number; readonly after: number };
type Palette = {
  readonly background: string;
  readonly border: string;
  readonly text: string;
  readonly muted: string;
  readonly gain: string;
};

const light: Palette = {
  background: "#ffffff",
  border: "#d1d9e0",
  text: "#1f2328",
  muted: "#59636e",
  gain: "#1a7f37",
};
const dark: Palette = {
  background: "#0d1117",
  border: "#30363d",
  text: "#f0f6fc",
  muted: "#9198a1",
  gain: "#3fb950",
};

const xmlEscape = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const speedup = (timing: Timing): string => {
  const ratio = timing.before / timing.after;
  return `${ratio.toFixed(ratio >= 10 ? 0 : 1)}×`;
};
const engine = (name: string, timing: Timing, precision: number, x: number, y: number): string => `
  <text x="${x}" y="${y}" class="engine">${name}</text>
  <text x="${x + 65}" y="${y + 2}" class="gain">${speedup(timing)}</text>
  <text x="${x}" y="${y + 29}" class="timing">${timing.before.toFixed(precision)} → ${timing.after.toFixed(precision)} ms</text>`;

const cards = snapshots.workloads
  .map((workload, i) => {
    const y = 92 + i * 148;
    return `
  <path d="M24 ${y}H616" class="divider"/>
  <text x="48" y="${y + 29}" class="name">${xmlEscape(workload.name)}</text>
  <text x="48" y="${y + 51}" class="size">${xmlEscape(workload.size)}</text>
${engine("Bun", workload.bun, workload.precision, 48, y + 85)}
${engine("Node", workload.node, workload.precision, 344, y + 85)}`;
  })
  .join("\n");
const description = snapshots.workloads
  .map(
    (workload) =>
      `${workload.name}, ${workload.size}: Bun ${speedup(workload.bun)}, Node ${speedup(workload.node)}.`,
  )
  .join(" ");
const render = (
  palette: Palette,
): string => `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="604" viewBox="0 0 640 604" role="img" aria-labelledby="title description">
  <title id="title">Mochi runtime benchmark snapshots</title>
  <desc id="description">${xmlEscape(description)} Historical median speedups against previous Mochi implementations; microbenchmarks, not application throughput.</desc>
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: ${palette.text}; }
    .name { font-size: 20px; font-weight: 600; }
    .size, .muted { font-size: 14px; fill: ${palette.muted}; }
    .engine { font-size: 14px; font-weight: 600; fill: ${palette.muted}; }
    .gain { font-size: 28px; font-weight: 600; fill: ${palette.gain}; }
    .timing { font-size: 16px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
    .divider { stroke: ${palette.border}; }
  </style>
  <rect x="0.5" y="0.5" width="639" height="603" rx="6" fill="${palette.background}" stroke="${palette.border}"/>
  <text x="32" y="43" font-size="22" font-weight="600">Runtime benchmarks</text>
  <text x="32" y="68" class="muted">Historical medians · previous → optimized Mochi</text>
${cards}
  <path d="M24 536H616" class="divider"/>
  <text x="32" y="559" class="muted">${xmlEscape(snapshots.environment)}</text>
  <text x="32" y="581" class="muted">Measured ${xmlEscape(snapshots.measured)} · Microbenchmarks, not app throughput.</text>
</svg>
`;
syncGeneratedFile(repoPath("apps/docs/public/benchmarks.svg"), render(light), {
  regenCommand: "bun run --cwd apps/docs gen:benchmarks",
});
syncGeneratedFile(repoPath("apps/docs/public/benchmarks-dark.svg"), render(dark), {
  regenCommand: "bun run --cwd apps/docs gen:benchmarks",
});
