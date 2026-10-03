// ADR 0120: completion answered by the self-hosted core. `completeAt` /
// `moduleCompleteAt` route here; these pin what that path adds beyond the
// shared complete.spec.ts cases.
import { expect, test } from "bun:test";
import type { CompletionItem } from "@mochi/dx/complete";
import { completeAt, moduleCompleteAt } from "@mochi/dx/completion-query";
import { styledCvaPlugin } from "@mochi/plugin-styled-cva";
import { memRead } from "@mochi/test-support";

const labels = (items: readonly CompletionItem[]) => items.map((i) => i.label);

test("record members complete past a hole elsewhere in the buffer", () => {
  const src = "let x = )\nlet r = { alpha: 1, beta: 2 }\nlet y = r.";
  expect(labels(completeAt(src, src.length))).toEqual(["alpha", "beta"]);
});

test("a match arm's binders complete in its body and not after it", () => {
  const src = "let f = o => switch o { | Some(inner) => inn | None => 0 }\nlet g = inn";
  const inArm = src.indexOf("inn |") + 3;
  expect(labels(completeAt(src, inArm))).toContain("inner");
  expect(labels(completeAt(src, src.length))).not.toContain("inner");
});

test("a loop param completes in the loop body", () => {
  const src = "let n = loop (count = 0) { cou }";
  expect(labels(completeAt(src, src.indexOf("cou }") + 3))).toContain("count");
});

const IMPORTS = {
  "/p/ui.mochi":
    'type BadgeProps = { tone: "rose" | "amber", label: string }\nexport let Badge = (props: BadgeProps) => <b />\n',
  "/p/point.mochi": "export let origin = { x: 0, y: 0 }\n",
};

test("an imported name is detailed as an import, a local as local", async () => {
  const src = 'import { origin } from "./point"\nlet own = 1\nlet z = o';
  const items = await moduleCompleteAt("/p/main.mochi", src, src.length, memRead(IMPORTS));
  expect(items.find((i) => i.label === "origin")?.detail).toBe("import");
  expect(items.find((i) => i.label === "own")?.detail).toBe("local");
});

test("an imported component's props complete through the graph", async () => {
  const src = 'import { Badge } from "./ui"\nlet el = <Badge ';
  const items = await moduleCompleteAt("/p/main.mochi", src, src.length, memRead(IMPORTS));
  expect(labels(items)).toEqual(["label", "tone"]);
});

test("an imported component's literal prop values complete through the graph", async () => {
  const src = 'import { Badge } from "./ui"\nlet el = <Badge tone="';
  const items = await moduleCompleteAt("/p/main.mochi", src, src.length, memRead(IMPORTS));
  expect(labels(items)).toEqual(["amber", "rose"]);
});

const TW = {
  "/p/ui.mochi": `export extern tw : a = "@styled-cva/react" "default"
export let Badge = tw.div("base", {
  variants: { $tone: { rose: "a", amber: "b" } },
  defaultVariants: { $tone: "rose" }
})
`,
};

test("a self-hosted-core plugin types JSX props with no TS plugin", async () => {
  const src = 'import { Badge } from "./ui"\nlet el = <Badge $tone="';
  const items = await moduleCompleteAt("/p/main.mochi", src, src.length, memRead(TW), {
    plugins: [styledCvaPlugin],
  });
  expect(labels(items)).toEqual(["amber", "rose"]);
});

test("a plugin's completeMembers lists an opaque receiver's members", async () => {
  const src = 'import { tw } from "./ui"\nlet B = tw.s';
  const items = await moduleCompleteAt("/p/main.mochi", src, src.length, memRead(TW), {
    plugins: [styledCvaPlugin],
  });
  expect(labels(items)).toEqual(["section", "span"]);
  expect(labels(completeAt(src, src.length))).toEqual([]);
});
