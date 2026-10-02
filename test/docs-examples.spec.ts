import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler";
import { compileAndEval, readRepo } from "@mochi/test-support";
import { unwrapOk } from "@onrails/result";

const read = (path: string): string => readRepo(import.meta.url, path);

type PreviewNode = { tag: string; children: readonly PreviewValue[] };
type PreviewValue = PreviewNode | readonly PreviewValue[] | string | number | null;
type PreviewProps = Record<string, unknown>;
type PreviewComponent = (props: PreviewProps) => PreviewValue;
const h = (
  tag: string | PreviewComponent,
  props: PreviewProps,
  ...children: PreviewValue[]
): PreviewValue => (typeof tag === "function" ? tag({ ...props, children }) : { tag, children });
const textOf = (value: PreviewValue): string => {
  if (value === null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if ("children" in value) return value.children.map(textOf).join("\n");
  return value.map(textOf).join("\n");
};

const appOf = (name: string): unknown => {
  const js = unwrapOk(compile(read(`apps/docs/src/examples/presets/${name}.mochi`)));
  return new Function("h", `${js}\nreturn app;`)(h);
};

test("product search filters case-insensitively, sorts prices, and preserves ids", () => {
  const source = read("apps/docs/src/examples/products.mochi").replace("export let", "let");
  const products =
    'let products = [{ name: "Tea bowl", price: 24, id: 1 }, { name: "Matcha tea", price: 12, id: 2 }, { name: "Whisk", price: 18, id: 3 }]';
  expect(compileAndEval(`${source}\n${products}`, 'searchProducts("TEA", products)')).toEqual([
    { name: "Matcha tea", price: 12, id: 2 },
    { name: "Tea bowl", price: 24, id: 1 },
  ]);
  expect(compileAndEval(`${source}\n${products}`, 'searchProducts("missing", products)')).toEqual(
    [],
  );
});

test("data presets display the results they teach", () => {
  expect(textOf(appOf("result") as PreviewValue)).toBe("Quarter: 10\nStopped: odd number");
  expect(textOf(appOf("pipelines") as PreviewValue)).toContain("130");
  const records = textOf(appOf("row-poly") as PreviewValue);
  expect(records).toContain("36");
  expect(records).toContain("37");
  expect(records).toContain("Ada");
  expect(records).toContain("42");
  expect(textOf(appOf("jsx") as PreviewValue)).toBe("Save changes\nAlready saved");
});

test("Task preset really settles to visible success and failure outcomes", async () => {
  const task = appOf("task") as () => Promise<{ _tag: string; value: PreviewValue }>;
  const result = await task();
  expect(result._tag).toBe("Ok");
  expect(textOf(result.value)).toBe("Loaded: Ada\nFailed: user not found");
});
