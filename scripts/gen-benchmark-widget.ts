// Recorded measurements, never a live benchmark during a docs build.
import snapshots from "../docs/benchmarks/runtime-snapshots.json";
import { repoPath, syncGeneratedFile } from "./lib";

type Timing = { readonly before: number; readonly after: number };

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
  <rect x="32" y="${y}" width="576" height="136" rx="16" fill="#ffffff" stroke="#e4ddd2"/>
  <text x="48" y="${y + 29}" class="name">${xmlEscape(workload.name)}</text>
  <text x="48" y="${y + 51}" class="size">${xmlEscape(workload.size)}</text>
  ${engine("BUN", workload.bun, workload.precision, 48, y + 85)}
  ${engine("NODE", workload.node, workload.precision, 344, y + 85)}`;
  })
  .join("\n");
const description = snapshots.workloads
  .map(
    (workload) =>
      `${workload.name}, ${workload.size}: Bun ${speedup(workload.bun)}, Node ${speedup(workload.node)}.`,
  )
  .join(" ");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="604" viewBox="0 0 640 604" role="img" aria-labelledby="title description">
  <title id="title">Mochi runtime benchmark snapshots</title>
  <desc id="description">${xmlEscape(description)} Historical median speedups against previous Mochi implementations; microbenchmarks, not application throughput.</desc>
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #302e28; }
    .name { font-size: 20px; font-weight: 650; }
    .size { font-size: 14px; fill: #65645c; }
    .engine { font-size: 14px; font-weight: 650; fill: #65645c; }
    .gain { font-size: 30px; font-weight: 750; fill: #236444; }
    .timing { font-size: 17px; }
  </style>
  <rect width="640" height="604" rx="24" fill="#f6f3eb"/>
  <text x="32" y="45" font-size="27" font-weight="750">Less work. Faster runtime.</text>
  <text x="32" y="70" font-size="16" fill="#65645c">Historical medians · previous → optimized Mochi</text>
  ${cards}
  <text x="32" y="555" font-size="14">${xmlEscape(snapshots.environment)}</text>
  <text x="32" y="577" font-size="13">Measured ${xmlEscape(snapshots.measured)} · Microbenchmarks, not app throughput.</text>
</svg>
`;
syncGeneratedFile(repoPath("apps/docs/public/benchmarks.svg"), svg, {
  regenCommand: "bun run --cwd apps/docs gen:benchmarks",
});
