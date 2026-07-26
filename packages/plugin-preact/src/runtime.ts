/** Runtime helpers for `@mochi/plugin-preact` hooks.mochi. */
export const hookDeps = (a: unknown, b: unknown, c: unknown): unknown[] => [a, b, c];

export const hookDeps2 = (a: unknown, b: unknown): unknown[] => [a, b];

export const hookDeps1 = (a: unknown): unknown[] => [a];

export const hookDeps0 = (): unknown[] => [];
