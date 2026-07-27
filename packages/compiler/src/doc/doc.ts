/**
 * Wadler/Prettier-style document IR and layout engine (ADR 0025) — the
 * formatter's output language, split out of `format.ts` so it is a shared
 * vocabulary rather than a private one.
 *
 * `format.ts` lowers the AST to a `Doc` and renders it at 80 columns; a
 * `LanguagePlugin`'s `format` hook (ADR 0011, #27) builds `Doc`s too, which is
 * why the combinators live here: a hook that returned a raw string would lose
 * line-breaking and indentation the moment its output landed inside a group.
 */

/**
 * `line` is a space when its group prints flat, a newline+indent when it
 * breaks; `softline` is nothing when flat; `hardline` always breaks. `group`
 * asks "does the flat rendering fit the rest of this line?" and picks a mode.
 * `breakparent` is zero-width but forces every enclosing group to break — used
 * after a trailing `//` comment so whatever follows lands on a fresh line
 * (else it would be commented out) without emitting a newline of its own.
 */
export type Doc =
  | { k: "text"; s: string }
  | { k: "verbatim"; s: string }
  | { k: "line"; hard: boolean; soft: boolean }
  | { k: "cat"; parts: Doc[] }
  | { k: "indent"; doc: Doc }
  | { k: "group"; doc: Doc }
  | { k: "breakparent" };

const INDENT = 2;

export const txt = (s: string): Doc => ({ k: "text", s });
/**
 * An opaque raw-bytes passthrough (C9 slice d, ADR 0045 decision 3): `s` is
 * printed exactly as given — no re-indentation, no re-wrapping, and any
 * newlines inside it are never reflowed. Unlike `text`, a document containing
 * `verbatim` always forces its enclosing groups to break (`forcesBreak`,
 * mirroring `hardline`) — a group cannot claim to have printed "flat" across
 * bytes it never actually laid out. Used for parser error-recovery spans:
 * unparsable source the formatter could not understand and must not touch.
 */
export const verbatim = (s: string): Doc => ({ k: "verbatim", s });
export const cat = (parts: Doc[]): Doc => ({ k: "cat", parts });
export const seq = (...parts: Doc[]): Doc => ({ k: "cat", parts });
export const line: Doc = { k: "line", hard: false, soft: false };
export const softline: Doc = { k: "line", hard: false, soft: true };
export const hardline: Doc = { k: "line", hard: true, soft: false };
export const breakParent: Doc = { k: "breakparent" };
export const indent = (doc: Doc): Doc => ({ k: "indent", doc });
export const group = (doc: Doc): Doc => ({ k: "group", doc });

export const join = (sep: Doc, parts: Doc[]): Doc =>
  cat(parts.flatMap((p, i) => (i === 0 ? [p] : [sep, p])));

type Mode = "flat" | "break";
type Item = { i: number; m: Mode; d: Doc };
/** The layout worklist is an immutable cons-list (the head is the next document to process), so pushing work never mutates an array. */
type Cell = { head: Item; tail: Work };
type Work = Cell | null;

const cons = (head: Item, tail: Work): Work => ({ head, tail });

/** Prepend a cat's parts so part[0] ends up at the head (processed first). */
const consParts = (parts: Doc[], i: number, m: Mode, tail: Work): Work => {
  let w = tail;
  for (let k = parts.length - 1; k >= 0; k--) w = cons({ i, m, d: parts[k]! }, w);
  return w;
};

/**
 * Would the documents on `work` (processed head-first, groups forced flat) stay
 * within `width` columns before the line ends? A break-mode line or a hardline
 * ends the line, so we stop and report success there.
 */
const fits = (width: number, start: Work): boolean => {
  let rem = width;
  let work = start;
  while (rem >= 0) {
    if (!work) return true;
    const { i, m, d } = work.head;
    work = work.tail;
    switch (d.k) {
      case "text":
        rem -= d.s.length;
        break;
      case "verbatim":
        // Opaque and may itself contain newlines — treat it like a hardline
        // for fitting purposes: whatever comes after is a fresh line, so a
        // group ending here doesn't need to "fit" past it.
        return true;
      case "cat":
        work = consParts(d.parts, i, m, work);
        break;
      case "indent":
        work = cons({ i: i + INDENT, m, d: d.doc }, work);
        break;
      case "group":
        work = cons({ i, m: "flat", d: d.doc }, work);
        break;
      case "line":
        if (d.hard || m === "break") return true;
        rem -= d.soft ? 0 : 1;
        break;
      case "breakparent":
        break; // zero-width here; it only forces the group that *contains* it
    }
  }
  return false;
};

/**
 * Does this document contain a hardline anywhere in its subtree? If so, every
 * enclosing group must break (a group can never print "flat" across a forced
 * newline). Comments introduce hardlines, so a commented node breaks its
 * parents. Memoized — documents are immutable and shared during layout.
 */
const breakCache = new WeakMap<Doc, boolean>();
const forcesBreak = (d: Doc): boolean => {
  const cached = breakCache.get(d);
  if (cached !== undefined) return cached;
  const r =
    d.k === "breakparent" || d.k === "verbatim"
      ? true
      : d.k === "line"
        ? d.hard
        : d.k === "cat"
          ? d.parts.some(forcesBreak)
          : d.k === "indent" || d.k === "group"
            ? forcesBreak(d.doc)
            : false;
  breakCache.set(d, r);
  return r;
};

export const render = (root: Doc, width: number): string => {
  const out: string[] = [];
  let pos = 0;
  let work: Work = cons({ i: 0, m: "break", d: root }, null);
  while (work) {
    const { i, m, d } = work.head;
    work = work.tail;
    switch (d.k) {
      case "text":
        out.push(d.s);
        pos += d.s.length;
        break;
      case "verbatim": {
        // Pushed byte-for-byte; no indentation, wrapping, or reflow applied.
        // `pos` is recomputed from the last line of `s` (it may itself end
        // mid-line) so column tracking for whatever follows stays accurate.
        out.push(d.s);
        const nl = d.s.lastIndexOf("\n");
        pos = nl === -1 ? pos + d.s.length : d.s.length - nl - 1;
        break;
      }
      case "cat":
        work = consParts(d.parts, i, m, work);
        break;
      case "indent":
        work = cons({ i: i + INDENT, m, d: d.doc }, work);
        break;
      case "line":
        if (m === "flat" && !d.hard) {
          const s = d.soft ? "" : " ";
          out.push(s);
          pos += s.length;
        } else {
          out.push(`\n${" ".repeat(i)}`);
          pos = i;
        }
        break;
      case "group": {
        if (forcesBreak(d.doc)) {
          work = cons({ i, m: "break", d: d.doc }, work);
          break;
        }
        const cand = cons({ i, m: "flat", d: d.doc }, work);
        work = fits(width - pos, cand) ? cand : cons({ i, m: "break", d: d.doc }, work);
        break;
      }
      case "breakparent":
        break; // zero-width; its only effect is via forcesBreak
    }
  }
  return out.join("");
};

/** Render a document on a single line (every group flat) — for contexts that never wrap: interpolation holes, `switch` scrutinees, and `when` guards. */
export const flat = (d: Doc): string => render(d, Number.POSITIVE_INFINITY);
