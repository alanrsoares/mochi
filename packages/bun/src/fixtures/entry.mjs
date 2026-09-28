import { doubled } from "./user.mochi";

// Not `console.log`: under FORCE_COLOR it colours numbers, and the specs compare stdout.
process.stdout.write(`${doubled}\n`);
