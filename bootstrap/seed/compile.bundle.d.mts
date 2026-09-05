export type BootstrapDiagnostic = { message: string; start: number; end: number };
export type BootstrapResult<A> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: BootstrapDiagnostic[] };
export type BootstrapInferResult = { env: Map<string, unknown>; types: Array<{ span: { start: number; end: number }; ty: unknown; display: string }>; aliases: Map<string, unknown>; letParams: unknown[] };
export const compile: (src: string) => BootstrapResult<string>;
export const compileTs: (src: string, runtimeImport: string) => BootstrapResult<string>;
export const inferTypes: (src: string) => BootstrapResult<BootstrapInferResult>;
