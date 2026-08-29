// The typechecking DX query surfaces (hover, completion, go-to-type) each
// resolve the edited file's whole import graph. Sharing one `ModuleCache`
// across them is what keeps an editor session interactive — a hover in
// `bootstrap/cli.mochi` costs ~1.8s cold and ~14ms warm (ADR 0095). These
// guard that sharing it never changes an ANSWER.
//
// Every assertion also pins a non-empty result: comparing two `null`s would
// pass while measuring nothing.
import { expect, test } from "bun:test";
import { createModuleCache } from "@mochi/compiler/module";
import { moduleCompleteAt } from "@mochi/dx/complete";
import { documentDiagnostics } from "@mochi/dx/diagnostics";
import { moduleHoverAt } from "@mochi/dx/hover";
import { moduleTypeDefinitionAt } from "@mochi/dx/nav";
import { memRead } from "@mochi/test-support";

/**
 * The type's NAME is the knob: it shows up in the hovered type, and changing it
 * leaves the entry typechecking. Changing the payload instead would break
 * `Circle(1)`, and a hover over broken code is `null` — which would make the
 * invalidation assertion below pass for the wrong reason.
 */
const shapes = (name: string) => ({
  "/shapes.mochi": `export type ${name} =\n  | Circle(number)\n  | Square(number)\n`,
  // Value-only import: a named import binds values, not types.
  "/app.mochi": 'import { Circle } from "/shapes.mochi"\nexport let shape = Circle(1)\n',
});

const files = shapes("Shape");
const src = files["/app.mochi"];
const atCtor = src.lastIndexOf("Circle") + 2;
const atBinding = src.indexOf("let shape") + 5;

test("a shared cache does not change hover, completion, or go-to-type", async () => {
  // Warm the way a session does: diagnostics on open, then the user interacts.
  const cache = createModuleCache();
  const read = memRead(files);
  expect(await documentDiagnostics("/app.mochi", src, read, { cache })).toEqual([]);

  const hover = await moduleHoverAt("/app.mochi", src, atCtor, read, { cache });
  expect(hover?.code).toBe("number -> Shape");
  expect(hover).toEqual(await moduleHoverAt("/app.mochi", src, atCtor, read));

  const items = await moduleCompleteAt("/app.mochi", src, atCtor, read, { cache });
  expect(items.length).toBeGreaterThan(0);
  expect(items).toEqual(await moduleCompleteAt("/app.mochi", src, atCtor, read));

  const target = await moduleTypeDefinitionAt("/app.mochi", src, atBinding, read, { cache });
  expect(target?.path).toBe("/shapes.mochi");
  expect(target).toEqual(await moduleTypeDefinitionAt("/app.mochi", src, atBinding, read));
});

test("a warm query sees a dependency edit", async () => {
  const cache = createModuleCache();
  const before = await moduleHoverAt("/app.mochi", src, atCtor, memRead(files), { cache });
  expect(before?.code).toBe("number -> Shape");

  // Same entry bytes, different dependency — the hovered type must follow.
  const editedRead = memRead(shapes("Figure"));
  const after = await moduleHoverAt("/app.mochi", src, atCtor, editedRead, { cache });
  expect(after?.code).toBe("number -> Figure");
  expect(after).toEqual(await moduleHoverAt("/app.mochi", src, atCtor, editedRead));
});
