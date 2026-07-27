import { join } from "node:path";
import { compile } from "@mochi/compiler/compile";

const PORT = Number(process.env.PORT || 3000);
const DIR = import.meta.dir;
const LEADERBOARD_FILE = join(DIR, "leaderboard.json");

export type ScoreEntry = { name: string; score: number; date: string };

const DEFAULT_LEADERBOARD: ScoreEntry[] = [];

async function loadLeaderboard(): Promise<ScoreEntry[]> {
  try {
    const file = Bun.file(LEADERBOARD_FILE);
    if (await file.exists()) {
      return await file.json();
    }
  } catch {}
  await Bun.write(LEADERBOARD_FILE, JSON.stringify(DEFAULT_LEADERBOARD, null, 2));
  return DEFAULT_LEADERBOARD;
}

async function saveLeaderboard(entries: ScoreEntry[]): Promise<ScoreEntry[]> {
  const sorted = entries.sort((a, b) => b.score - a.score).slice(0, 10);
  await Bun.write(LEADERBOARD_FILE, JSON.stringify(sorted, null, 2));
  return sorted;
}

async function ensureBuilt() {
  const distIndex = Bun.file(join(DIR, "dist", "index.html"));
  if (!(await distIndex.exists())) {
    console.log("Building snake app dist...");
    const proc = Bun.spawnSync(["bun", "run", "build"], { cwd: DIR });
    if (!proc.success) {
      console.error("Failed to build snake app:", proc.stderr.toString());
    }
  }
}

await ensureBuilt();
let leaderboard = await loadLeaderboard();

const server = Bun.serve({
  port: PORT,
  websocket: {
    open(ws) {
      ws.subscribe("leaderboard");
      ws.send(JSON.stringify({ type: "LEADERBOARD_UPDATE", leaderboard }));
    },
    message() {},
    close(ws) {
      ws.unsubscribe("leaderboard");
    },
  },
  async fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req);
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // REST API Endpoints
    if (url.pathname === "/api/leaderboard" && req.method === "GET") {
      return Response.json(leaderboard);
    }

    if (url.pathname === "/api/score" && req.method === "POST") {
      try {
        const body = (await req.json()) as { name?: string; score?: number };
        const name = (body.name || "Anonymous").trim().slice(0, 12) || "Anonymous";
        const score = Number(body.score) || 0;

        if (score > 0) {
          const newEntry: ScoreEntry = {
            name,
            score,
            date: new Date().toISOString().split("T")[0]!,
          };
          leaderboard = await saveLeaderboard([...leaderboard, newEntry]);
          server.publish("leaderboard", JSON.stringify({ type: "LEADERBOARD_UPDATE", leaderboard }));
        }
        return Response.json({ success: true, leaderboard });
      } catch {
        return Response.json({ error: "Invalid payload" }, { status: 400 });
      }
    }

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        uptime: process.uptime(),
        subscribers: server.subscriberCount("leaderboard"),
      });
    }

    // Static asset serving: prefer dist/ (built Vite bundle), fallback to DIR
    const relPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const distFile = Bun.file(join(DIR, "dist", relPath));
    if (await distFile.exists()) {
      return new Response(distFile);
    }

    if (url.pathname.startsWith("/node_modules/")) {
      const nodeFile = Bun.file("." + url.pathname);
      if (await nodeFile.exists()) return new Response(nodeFile);
    }

    const staticFile = Bun.file(join(DIR, relPath));
    if (await staticFile.exists()) {
      return new Response(staticFile);
    }

    return new Response("404 Not Found", { status: 404 });
  },
});

console.log(`🐍 Mochi Canvas Snake Server running at http://localhost:${server.port}`);
