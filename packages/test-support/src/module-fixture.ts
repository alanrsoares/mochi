/** In-memory `read` for module-graph integration specs. */
export const memRead =
  (files: Record<string, string>) =>
  (path: string): Promise<string> => {
    const hit = files[path];
    return hit === undefined
      ? Promise.reject(new Error(`no such file ${path}`))
      : Promise.resolve(hit);
  };
