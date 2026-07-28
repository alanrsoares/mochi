/**
 * Source-of-truth for the playground's code text: initial value (localStorage
 * or default preset), one-shot `?code=` bootstrap, and debounced persistence +
 * share-URL sync. Persistence always runs; the URL update is skipped when the
 * encoded payload exceeds share limits.
 */
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import {
  encodeShareParam,
  loadSharedCode,
  persistSource,
  readInitialCode,
} from "../lib/playground/session";

const URL_SYNC_DEBOUNCE_MS = 360;

export type PlaygroundSource = {
  code: string;
  setCode: (code: string) => void;
  /** False until the `?code=` bootstrap settles — gate compiles/persistence on it. */
  bootstrapped: boolean;
  /** Encode `source` into the address bar (replaceState); resolves when done. */
  syncShareUrl: (source: string) => Promise<void>;
};

export function usePlaygroundSource(): PlaygroundSource {
  const [code, setCode] = useState(readInitialCode);
  const [bootstrapped, setBootstrapped] = useState(false);
  const urlSeq = useRef(0);

  // Restore share payload from `?code=` once (async gzip decode).
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const shared = await loadSharedCode(window.location.search);
      if (!cancelled && shared !== null) setCode(shared);
      if (!cancelled) setBootstrapped(true);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const syncShareUrl = useCallback(async (source: string) => {
    urlSeq.current += 1;
    const seq = urlSeq.current;
    const encoded = await encodeShareParam(source);
    if (seq !== urlSeq.current || encoded === null) return;
    const params = new URLSearchParams(window.location.search);
    params.set("code", encoded);
    const next = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState(null, "", next);
  }, []);

  // Debounced persistence + URL sync. Persist unconditionally — the share URL
  // is best-effort.
  useEffect(() => {
    if (!bootstrapped) return;
    const id = window.setTimeout(() => {
      persistSource(code);
      void syncShareUrl(code);
    }, URL_SYNC_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [bootstrapped, code, syncShareUrl]);

  return { code, setCode, bootstrapped, syncShareUrl };
}
