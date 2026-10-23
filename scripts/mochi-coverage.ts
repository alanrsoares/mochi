import { join } from "node:path";
import { REPO_ROOT } from "./lib";

type Coverage = {
  readonly functionsFound: number;
  readonly functionsHit: number;
  readonly linesFound: number;
  readonly linesHit: number;
};

const ROOT = REPO_ROOT;
const COVERAGE_DIR = "coverage/mochi";
const MINIMUM_FUNCTION_PERCENT = 65;
// Bun 1.4.4 maps line hits onto comments, imports, and lines past EOF.
// Function totals match Bun 1.4.2. On 492b8c9, lines were 65.99% under 1.4.2
// and 63.24% under 1.4.4, both at 79.16% functions. 62 keeps that commit's
// headroom under the 1.4.4 reading.
const MINIMUM_LINE_PERCENT = 62;

export const bootstrapMochiCoverage = (lcov: string): Coverage => {
  let inMochi = false;
  let functionsFound = 0;
  let functionsHit = 0;
  let linesFound = 0;
  let linesHit = 0;

  for (const line of lcov.split("\n")) {
    if (line.startsWith("SF:")) {
      const path = line.slice(3);
      inMochi =
        (path.startsWith("packages/compiler/src/") || path.startsWith("packages/cli/src/")) &&
        path.endsWith(".mochi");
      continue;
    }
    if (!inMochi) continue;
    if (line.startsWith("FNF:")) functionsFound += Number(line.slice(4));
    if (line.startsWith("FNH:")) functionsHit += Number(line.slice(4));
    if (line.startsWith("LF:")) linesFound += Number(line.slice(3));
    if (line.startsWith("LH:")) linesHit += Number(line.slice(3));
  }

  return { functionsFound, functionsHit, linesFound, linesHit };
};

const percent = (hit: number, found: number): number => (found === 0 ? 0 : (hit / found) * 100);

const main = async (): Promise<void> => {
  const specs: string[] = [];
  for await (const path of new Bun.Glob("packages/{compiler,cli}/src/**/*.spec.mochi").scan({
    cwd: ROOT,
  })) {
    specs.push(path);
  }
  const test = Bun.spawn(
    [
      process.execPath,
      "test",
      ...specs,
      // One spec per worker. A worker that runs a second spec file reloads the
      // modules it shares with the first, and Bun's merged lcov then drops hits:
      // a 4-core CI runner reported ~6 points less line coverage than serial.
      // With one file each, the merge matches the serial totals on any machine.
      `--parallel=${specs.length}`,
      "--coverage",
      "--coverage-reporter=text",
      "--coverage-reporter=lcov",
      `--coverage-dir=${COVERAGE_DIR}`,
    ],
    { cwd: ROOT, stdout: "inherit", stderr: "inherit" },
  );
  const exitCode = await test.exited;
  if (exitCode !== 0) process.exit(exitCode);

  const lcov = await Bun.file(join(ROOT, COVERAGE_DIR, "lcov.info")).text();
  const coverage = bootstrapMochiCoverage(lcov);
  const functions = percent(coverage.functionsHit, coverage.functionsFound);
  const lines = percent(coverage.linesHit, coverage.linesFound);
  console.log(
    `bootstrap Mochi coverage: functions ${functions.toFixed(2)}% ` +
      `(minimum ${MINIMUM_FUNCTION_PERCENT}%), lines ${lines.toFixed(2)}% ` +
      `(minimum ${MINIMUM_LINE_PERCENT}%)`,
  );

  if (functions < MINIMUM_FUNCTION_PERCENT || lines < MINIMUM_LINE_PERCENT) {
    process.stderr.write(
      "bootstrap Mochi coverage is below the shipping floor " +
        `(functions ${MINIMUM_FUNCTION_PERCENT}%, lines ${MINIMUM_LINE_PERCENT}%)\n`,
    );
    process.exit(1);
  }
};

await main();
