// Summarize a V8/JSC `.cpuprofile` (as written by `bun --cpu-prof`) by
// INCLUSIVE time per function. Self time lands mostly in the runtime's `_curry`
// wrappers and says little about which compiler pass is slow; inclusive time
// names the pass.
//
// Seed bundles are esbuild output: most frames are anonymous arrows assigned to
// a top-level `var name = …`, so an unnamed frame is named after the nearest
// such declaration at or above its line.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type CallFrame = { functionName: string; url: string; lineNumber: number };
type ProfileNode = { id: number; callFrame: CallFrame; children?: number[] };
type CpuProfile = { nodes: ProfileNode[]; samples: number[]; timeDeltas: number[] };

export type ProfileRow = { readonly name: string; readonly ms: number; readonly pct: number };

const DECL = /^(?:export\s+)?(?:var|const|let|function)\s+([A-Za-z_$][\w$]*)/;

const sourceLines = new Map<string, readonly string[] | undefined>();
const linesOf = (url: string): readonly string[] | undefined => {
  if (!sourceLines.has(url)) {
    let lines: readonly string[] | undefined;
    try {
      lines = readFileSync(url.startsWith("file:") ? fileURLToPath(url) : url, "utf8").split("\n");
    } catch {
      lines = undefined;
    }
    sourceLines.set(url, lines);
  }
  return sourceLines.get(url);
};

const fileOf = (url: string): string => url.split("/").at(-1) ?? url;

const frameName = ({ functionName, url, lineNumber }: CallFrame): string | undefined => {
  if (url === "") return functionName === "" ? undefined : functionName;
  const lines = linesOf(url);
  if (lines !== undefined) {
    for (let i = lineNumber; i >= Math.max(0, lineNumber - 60); i--) {
      const m = DECL.exec(lines[i] ?? "");
      if (m?.[1] !== undefined) return `${m[1]} (${fileOf(url)})`;
    }
  }
  return `${functionName || "(anon)"} (${fileOf(url)}:${lineNumber + 1})`;
};

/**
 * The `top` functions by inclusive time; a recursive function counts once per
 * sample. Frames from a file in `hide` (the harness itself) and the synthetic
 * `(root)` are left out, since they wrap everything.
 */
export const inclusiveTop = (
  profilePath: string,
  top: number,
  hide: readonly string[] = [],
): ProfileRow[] => {
  const profile = JSON.parse(readFileSync(profilePath, "utf8")) as CpuProfile;
  const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
  const parent = new Map<number, number>();
  for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
  const names = new Map<number, string | undefined>();
  const nameOf = (id: number): string | undefined => {
    if (!names.has(id)) {
      const node = nodes.get(id);
      const hidden =
        node === undefined ||
        node.callFrame.functionName === "(root)" ||
        hide.includes(fileOf(node.callFrame.url));
      names.set(id, hidden ? undefined : frameName(node.callFrame));
    }
    return names.get(id);
  };

  const selfUs = new Map<number, number>();
  profile.samples.forEach((id, i) => {
    selfUs.set(id, (selfUs.get(id) ?? 0) + (profile.timeDeltas[i] ?? 0));
  });
  let totalUs = 0;
  const inclusive = new Map<string, number>();
  for (const [leaf, us] of selfUs) {
    totalUs += us;
    const seen = new Set<string>();
    for (let id: number | undefined = leaf; id !== undefined; id = parent.get(id)) {
      const name = nameOf(id);
      if (name === undefined || seen.has(name)) continue;
      seen.add(name);
      inclusive.set(name, (inclusive.get(name) ?? 0) + us);
    }
  }
  return [...inclusive]
    .toSorted((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([name, us]) => ({ name, ms: us / 1000, pct: (us / totalUs) * 100 }));
};
