export type Result<A, B> =
  | { _tag: "Ok"; value: A }
  | { _tag: "Err"; error: B };
export declare const readFile: (a: string) => Result<string, string>;
export declare const resolveImport: { (a: string): (b: string) => string; (a: string, b: string): string; };
export declare const absPath: (a: string) => string;
export declare const relSpec: { (a: string): (b: string) => string; (a: string, b: string): string; };
export declare const externDtsPath: { (a: string): (b: string) => string; (a: string, b: string): string; };
export declare const writeFile: { (a: string): (b: string) => Result<string, string>; (a: string, b: string): Result<string, string>; };
export declare const argv: string[];
export declare const isCliEntry: (a: undefined) => boolean;
export declare const print: (a: string) => string;
export declare const emit: (a: string) => string;
export declare const die: <A>(a: string) => A;
export declare const formatError: { (a: string): (b: string) => (c: { message: string; start: number; end: number }) => string; (a: string): (b: string, c: { message: string; start: number; end: number }) => string; (a: string, b: string): (c: { message: string; start: number; end: number }) => string; (a: string, b: string, c: { message: string; start: number; end: number }): string; };
