/** Byte offset of the `occurrence`th `needle` in `src` (0-based). */
export const byteOffset = (src: string, needle: string, occurrence = 0): number => {
  let from = 0;
  for (let i = 0; i <= occurrence; i++) {
    const idx = src.indexOf(needle, from);
    if (idx < 0) throw new Error(`'${needle}' #${i} not found`);
    if (i === occurrence) return idx;
    from = idx + needle.length;
  }
  throw new Error("unreachable");
};

/** Alias used in nav/hover specs. */
export const pos = byteOffset;
