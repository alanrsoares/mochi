import { describe, expect, test } from "bun:test";
import { compile } from "@mochi/compiler";
import { readRepo } from "@mochi/test-support";
import { match } from "@onrails/pattern";
import { unwrapOk } from "@onrails/result";

type ProblemProps = { diagnosticsFormatted: string; hasProblems: boolean; hasRun: boolean };
type ProblemVNode = { tag: unknown; props: unknown; children: unknown };

const loadMochiApi = () => {
  const source = readRepo(import.meta.url, "apps/docs/src/components/PlaygroundProblems.mochi");
  const js = unwrapOk(compile(source))
    .replace(/^import .*$/gm, "")
    .replace(/^export /gm, "");
  const h = (tag: unknown, props: unknown, children: unknown) => ({ tag, props, children });
  const DiagBox = "DiagBox";
  return new Function("match", "h", "DiagBox", `${js}\nreturn { PlaygroundProblems };`)(
    match,
    h,
    DiagBox,
  ) as {
    PlaygroundProblems: (props: ProblemProps) => ProblemVNode;
  };
};

describe("PlaygroundProblems.mochi", () => {
  const api = loadMochiApi();

  test("renders diagnostics box when hasProblems is true", () => {
    const vnode = api.PlaygroundProblems({
      diagnosticsFormatted: "line 1: unbound x",
      hasProblems: true,
      hasRun: true,
    });
    expect(vnode.tag).toBe("DiagBox");
    expect(vnode.children).toEqual([
      { tag: "div", props: { className: "mb-1 font-bold" }, children: ["Compilation problems"] },
      "line 1: unbound x",
    ]);
  });

  test("renders no problems message when hasProblems is false", () => {
    const vnode = api.PlaygroundProblems({
      diagnosticsFormatted: "",
      hasProblems: false,
      hasRun: true,
    });
    expect(vnode.tag).toBe("p");
    expect(vnode.children).toEqual(["No compilation problems."]);
  });
  test("does not report a clean compile before running", () => {
    const vnode = api.PlaygroundProblems({
      diagnosticsFormatted: "",
      hasProblems: false,
      hasRun: false,
    });
    expect(vnode.children).toEqual(["Run your source to check for problems."]);
  });
});
