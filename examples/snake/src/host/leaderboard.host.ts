/** Host seam for the leaderboard REST + WebSocket client (`server.mts`). */

export type ScoreEntry = { name: string; score: number; date?: string };

const Ok = <T>(value: T) => ({ _tag: "Ok" as const, value });
const Err = <E>(error: E) => ({ _tag: "Err" as const, error });

/** `fetchLeaderboardTask` returns a Mochi `Task ScoreEntry[] string` (a lazy thunk `() => Promise<Result>`). */
export const fetchLeaderboardTask = () => () =>
  fetch("/api/leaderboard")
    .then((res) => res.json())
    .then((data) => Ok(data as ScoreEntry[]))
    .catch((err) => Err(String(err?.message || err)));

/**
 * `postScoreTask` returns a Mochi `Task ScoreEntry[] string`. `name` is posted
 * as given — blank-name defaulting is a product rule, so `App.mochi`'s
 * `displayName` owns it.
 */
export const postScoreTask = (name: string, score: number) => () =>
  fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, score }),
  })
    .then((res) => res.json())
    .then((data) => Ok((data.leaderboard || []) as ScoreEntry[]))
    .catch((err) => Err(String(err?.message || err)));

/**
 * Subscribes to live leaderboard updates over `/ws`, auto-reconnecting.
 * `onRows` fires on every `LEADERBOARD_UPDATE`; `onStatus` fires with the
 * connected/disconnected flag. Returns a `useEffect` cleanup.
 */
export const connectWs = (
  onRows: (rows: ScoreEntry[]) => void,
  onStatus: (connected: boolean) => void,
): (() => void) => {
  let closed = false;
  let ws: WebSocket | null = null;
  let retryId: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (closed) return;
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    try {
      ws = new WebSocket(`${protocol}//${location.host}/ws`);
    } catch {
      onStatus(false);
      retryId = setTimeout(connect, 3000);
      return;
    }

    ws.onopen = () => onStatus(true);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "LEADERBOARD_UPDATE") onRows(data.leaderboard);
      } catch {}
    };
    ws.onclose = () => {
      onStatus(false);
      if (!closed) retryId = setTimeout(connect, 3000);
    };
    ws.onerror = () => onStatus(false);
  };

  connect();

  return () => {
    closed = true;
    if (retryId) clearTimeout(retryId);
    ws?.close();
  };
};
