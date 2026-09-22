import { dirname, join } from "node:path";
import { tryAsync } from "@onrails/result";
import { REPO_ROOT } from "./repo";

export type WorkspacePkg = {
  readonly name: string;
  readonly dir: string;
  readonly scripts: readonly string[];
};

export const findWorkspacePackages = async (root = REPO_ROOT): Promise<readonly WorkspacePkg[]> => {
  const rootManifest = (await Bun.file(join(root, "package.json")).json()) as {
    workspaces?: unknown;
  };
  const workspaces: unknown = rootManifest.workspaces;
  const globs: readonly string[] = Array.isArray(workspaces)
    ? workspaces
    : ((workspaces as { packages?: readonly string[] } | undefined)?.packages ?? []);

  const paths: string[] = [];
  for (const glob of globs) {
    for await (const rel of new Bun.Glob(`${glob}/package.json`).scan({ cwd: root })) {
      paths.push(rel);
    }
  }

  const read = await Promise.all(
    paths.map((rel) =>
      tryAsync(Bun.file(join(root, rel)).json())
        .map((manifest): WorkspacePkg | null =>
          typeof manifest?.name === "string"
            ? {
                name: manifest.name,
                dir: join(root, dirname(rel)),
                scripts: Object.keys(manifest.scripts ?? {}),
              }
            : null,
        )
        .unwrapOr(null),
    ),
  );
  return read.filter((pkg): pkg is WorkspacePkg => pkg !== null);
};
