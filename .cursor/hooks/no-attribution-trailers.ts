#!/usr/bin/env bun
/**
 * preToolUse (Shell): strip Cursor/tool attribution from git commit / gh pr commands
 * before they run (`--trailer …`, Co-Authored-By in -m bodies, Made with Cursor).
 */
import { stdin } from "bun";

type ToolInput = { command?: string };
type HookIn = {
  tool_name?: string;
  tool_input?: ToolInput;
  // older / alt shapes
  command?: string;
};

const strip = (cmd: string): string =>
  cmd
    // git --trailer 'Co-authored-by: …' / --trailer "Made-with: Cursor"
    .replace(/\s+--trailer(?:=|\s+)(?:'[^']*'|"[^"]*"|\S+)/g, "")
    // HEREDOC / -m bodies carrying attribution lines
    .replace(/^\s*Co-[Aa]uthored-[Bb]y:.*$/gm, "")
    .replace(/^\s*Made-with:\s*Cursor\s*$/gim, "")
    .replace(/^\s*Made with Cursor.*$/gim, "")
    .replace(/^\s*Generated (by|with)\b.*$/gim, "");

const raw = (await stdin.text()) || "{}";
let data: HookIn = {};
try {
  data = JSON.parse(raw) as HookIn;
} catch {
  console.log(JSON.stringify({ permission: "allow" }));
  process.exit(0);
}

const command = data.tool_input?.command ?? data.command ?? "";
const isCommitOrPr =
  /\bgit\s+commit\b/.test(command) ||
  /\bgh\s+pr\s+create\b/.test(command) ||
  /\bgh\s+pr\s+edit\b/.test(command);

if (!isCommitOrPr) {
  console.log(JSON.stringify({ permission: "allow" }));
  process.exit(0);
}

const cleaned = strip(command);
if (cleaned === command) {
  console.log(JSON.stringify({ permission: "allow" }));
  process.exit(0);
}

console.log(
  JSON.stringify({
    permission: "allow",
    updated_input: { ...(data.tool_input ?? {}), command: cleaned },
    agent_message:
      "Stripped tool attribution trailers from the commit/PR command (.cursor/rules/no-attribution-trailers.mdc).",
  }),
);
