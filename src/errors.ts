// alang error union — errors as values, one app-level type
export type AlangError =
  | { kind: "lex"; message: string; pos: number }
  | { kind: "parse"; message: string }
  | { kind: "check"; message: string };

export const lexErr = (message: string, pos: number): AlangError => ({ kind: "lex", message, pos });
export const parseErr = (message: string): AlangError => ({ kind: "parse", message });
export const checkErr = (message: string): AlangError => ({ kind: "check", message });

export const formatError = (e: AlangError): string => {
  switch (e.kind) {
    case "lex":
      return `LexError@${e.pos}: ${e.message}`;
    case "parse":
      return `ParseError: ${e.message}`;
    case "check":
      return `CheckError: ${e.message}`;
  }
};
