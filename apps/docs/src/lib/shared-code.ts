/** Share-link payload encode/decode — ReScript-style `b:` / `z:` prefixes. */

export const MAX_ENCODED_CODE_LENGTH = 300 * 1024;
export const MAX_DECODED_SOURCE_LENGTH = 200 * 1024;

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
export const encodeSharedCode = async (source: string): Promise<string> => {
  const bytes = new Uint8Array(new TextEncoder().encode(source));
  if (typeof CompressionStream !== "undefined") {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
    const buf = await new Response(stream).arrayBuffer();
    return `z:${bytesToBase64Url(new Uint8Array(buf))}`;
  }
  return `b:${bytesToBase64Url(bytes)}`;
};

/** Decode `z:` / `b:` payloads, or legacy bare `encodeURIComponent` strings. */
export const decodeSharedCode = async (encoded: string): Promise<string> => {
  if (encoded.startsWith("z:")) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("Compressed shared links require browser DecompressionStream support");
    }
    const compressed = new Uint8Array(base64UrlToBytes(encoded.slice(2)));
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
    const buf = await new Response(stream).arrayBuffer();
    return new TextDecoder().decode(buf);
  }
  if (encoded.startsWith("b:")) {
    return new TextDecoder().decode(base64UrlToBytes(encoded.slice(2)));
  }
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
};

export const isSharedCodeWithinLimits = (encoded: string, decoded: string): boolean =>
  encoded.length <= MAX_ENCODED_CODE_LENGTH && decoded.length <= MAX_DECODED_SOURCE_LENGTH;
