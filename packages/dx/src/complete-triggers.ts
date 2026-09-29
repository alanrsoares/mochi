/**
 * The lexical half of completion: what the cursor is completing, read off the
 * raw buffer so an incomplete edit (`Task.`, `<Badge $tone="`) still triggers.
 * Shared by the bootstrap path and the TS-plugin path in `complete.ts`.
 */
import type { CompletionItem } from "@mochi/compiler/bootstrap/options";

/** Lexical `receiver.prefix` ending at `offset` — incomplete buffers included. */
export type MemberTrigger = {
  receiver: string;
  prefix: string;
  /** Index of `.` in `src`. */
  dotStart: number;
  /** Start of the receiver identifier. */
  recvStart: number;
};

/** JSX open-tag attr name or string-value completion trigger. */
export type JsxAttrTrigger =
  | { kind: "name"; tag: string; prefix: string; tagStart: number }
  | { kind: "value"; tag: string; attr: string; prefix: string; tagStart: number };

export const memberTriggerAt = (src: string, offset: number): MemberTrigger | null => {
  const before = src.slice(0, offset);
  const m = before.match(/([A-Za-z_][\w]*)\.([\w]*)$/);
  if (!m || m.index === undefined) return null;
  const receiver = m[1]!;
  const prefix = m[2]!;
  return {
    receiver,
    prefix,
    recvStart: m.index,
    dotStart: m.index + receiver.length,
  };
};

/**
 * Cursor inside an unclosed JSX open tag: attr name (`<Tag $to` / `<button dis`) or string
 * value (`<Tag $tone="ro` / `<button type="sub`).
 */
export const jsxAttrTriggerAt = (src: string, offset: number): JsxAttrTrigger | null => {
  const before = src.slice(0, offset);
  const tagM = before.match(/<([A-Za-z_][\w]*)\b([^<]*)$/);
  if (!tagM || tagM.index === undefined) return null;
  const tag = tagM[1]!;
  // Trailing newline after `$tone="` is still value position (cursor at EOL).
  const afterTag = tagM[2]!.replace(/[\t ]+$/, "");
  const afterTrim = afterTag.replace(/\n$/, "");
  if (afterTrim.includes(">")) return null;

  const valDq = afterTrim.match(/(\$?[A-Za-z_][\w]*)\s*=\s*"([^"]*)$/);
  const valSq = afterTrim.match(/(\$?[A-Za-z_][\w]*)\s*=\s*'([^']*)$/);
  const val = valDq ?? valSq;
  if (val) {
    return {
      kind: "value",
      tag,
      attr: val[1]!,
      prefix: val[2]!,
      tagStart: tagM.index,
    };
  }

  // After `=` without a quote yet — not a name or string value.
  if (/=\s*$/.test(afterTrim)) return null;

  const nameM = afterTrim.match(/(?:^|[\s/])(\$?[A-Za-z_][\w]*)$/);
  if (nameM) {
    return { kind: "name", tag, prefix: nameM[1]!, tagStart: tagM.index };
  }
  if (afterTrim === "" || /[\s/]$/.test(afterTrim)) {
    return { kind: "name", tag, prefix: "", tagStart: tagM.index };
  }
  return null;
};

/** Identifier (or empty) being typed at `offset` when not in a member trigger. */
export const identPrefixAt = (src: string, offset: number): string => {
  const before = src.slice(0, offset);
  const m = before.match(/([A-Za-z_][\w]*)$/);
  return m?.[1] ?? "";
};

/** `… = r.` / `… = Task.m` without its `.prefix`, so the receiver typechecks alone. */
export const withoutMemberSuffix = (src: string, trigger: MemberTrigger): string =>
  src.slice(0, trigger.dotStart) + src.slice(trigger.dotStart + 1 + trigger.prefix.length);

/**
 * Incomplete JSX open tag → replace from `<Tag` through EOF with the bare tag
 * name so typecheck can resolve the component scheme (drops the broken tail;
 * imports / prior lets remain).
 */
export const rewriteJsxTagToRef = (src: string, tagStart: number, tag: string): string =>
  `${src.slice(0, tagStart)}${tag}`;

export const filterPrefix = (items: CompletionItem[], prefix: string): CompletionItem[] =>
  !prefix ? items : items.filter((i) => i.label.startsWith(prefix));

export const dedupeSort = (items: CompletionItem[]): CompletionItem[] => {
  const seen = new Set<string>();
  const out: CompletionItem[] = [];
  for (const i of items) {
    if (seen.has(i.label)) continue;
    seen.add(i.label);
    out.push(i);
  }
  return out.toSorted((a, b) => a.label.localeCompare(b.label));
};
