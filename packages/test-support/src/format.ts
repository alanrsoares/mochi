import { format } from "@mochi/dx/format";
import { unwrapOk } from "@onrails/result";

/** Format source, unwrapping the railway. */
export const formatSrc = (src: string) => unwrapOk(format(src));
