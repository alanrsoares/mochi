/** Share-link payload encode/decode — ReScript-style `b:` / `z:` prefixes.
 *
 * Async work is a mochi `Task a e` (ADR 0006): `() => Promise<Result<a, e>>`
 * with `{ _tag: "Ok" | "Err" }`. Callers kick off with `encodeSharedCode(s)()`
 * (same as `Task.run`).
 */

export const MAX_ENCODED_CODE_LENGTH = 300 * 1024;
export const MAX_DECODED_SOURCE_LENGTH = 200 * 1024;

/** Prelude-shaped Result — matches emitted `Ok` / `Err` ctors. */
export type SharedResult<A, E> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: E };

/** Prelude-shaped Task — lazy thunk; calling it fires the effect. */
export type SharedTask<A, E> = () => Promise<SharedResult<A, E>>;

const Ok = <A, E = never>(value: A): SharedResult<A, E> => ({ _tag: "Ok", value });
const Err = <A = never, E = never>(error: E): SharedResult<A, E> => ({ _tag: "Err", error });

const bytesToBinary = (bytes: Uint8Array): string => {
  const chunkSize = 0x8000;
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)));
  }
  return chunks.join("");
};

const bytesToBase64Url = (bytes: Uint8Array): string =>
  btoa(bytesToBinary(bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const base64UrlToBytes = (value: string): Uint8Array => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = base64.length % 4;
  const padded = remainder === 0 ? base64 : base64.padEnd(base64.length + 4 - remainder, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

/** Prefer gzip (`z:`) when CompressionStream exists; else raw bytes (`b:`). */
export const encodeSharedCode =
  (source: string): SharedTask<string, string> =>
  async () => {
    try {
      const bytes = new Uint8Array(new TextEncoder().encode(source));
      if (typeof CompressionStream !== "undefined") {
        const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
        const buf = await new Response(stream).arrayBuffer();
        return Ok(`z:${bytesToBase64Url(new Uint8Array(buf))}`);
      }
      return Ok(`b:${bytesToBase64Url(bytes)}`);
    } catch (e: unknown) {
      return Err(e instanceof Error ? e.message : String(e));
    }
  };

/** Decode `z:` / `b:` payloads, or legacy bare `encodeURIComponent` strings. */
export const decodeSharedCode =
  (encoded: string): SharedTask<string, string> =>
  async () => {
    try {
      if (encoded.startsWith("z:")) {
        if (typeof DecompressionStream === "undefined") {
          return Err("Compressed shared links require browser DecompressionStream support");
        }
        const compressed = new Uint8Array(base64UrlToBytes(encoded.slice(2)));
        const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
        const buf = await new Response(stream).arrayBuffer();
        return Ok(new TextDecoder().decode(buf));
      }
      if (encoded.startsWith("b:")) {
        return Ok(new TextDecoder().decode(base64UrlToBytes(encoded.slice(2))));
      }
      try {
        return Ok(decodeURIComponent(encoded));
      } catch {
        return Ok(encoded);
      }
    } catch (e: unknown) {
      return Err(e instanceof Error ? e.message : String(e));
    }
  };

export const isSharedCodeWithinLimits = (encoded: string, decoded: string): boolean =>
  encoded.length <= MAX_ENCODED_CODE_LENGTH && decoded.length <= MAX_DECODED_SOURCE_LENGTH;
