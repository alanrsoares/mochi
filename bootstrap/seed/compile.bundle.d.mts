export type BootstrapDiagnostic = { message: string; start: number; end: number };
export type BootstrapResult<A> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: BootstrapDiagnostic };
export const compile: (src: string) => BootstrapResult<string>;
export const compileTs: (src: string, runtimeImport: string) => BootstrapResult<string>;
