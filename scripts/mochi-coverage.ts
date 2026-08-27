import { dirname, join } from "node:path";

type Coverage = {
  readonly functionsFound: number;
  readonly functionsHit: number;
  readonly linesFound: number;
  readonly linesHit: number;
};

const ROOT = dirname(import.meta.dir);
const COVERAGE_DIR = "coverage/mochi";
const MINIMUM_PERCENT = 65;

export const bootstrapMochiCoverage = (lcov: string): Coverage => {
  let inBootstrapMochi = false;
  let functionsFound = 0;
  let functionsHit = 0;
  let linesFound = 0;
  let linesHit = 0;

  for (const line of lcov.split("\n")) {
    if (line.startsWith("SF:")) {
      const path = line.slice(3);
      inBootstrapMochi = path.startsWith("bootstrap/") && path.endsWith(".mochi");
      continue;
    }
    if (!inBootstrapMochi) continue;
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
  for await (const path of new Bun.Glob("bootstrap/**/*.spec.mochi").scan({ cwd: ROOT })) {
    specs.push(path);
  }
  const test = Bun.spawn(
    [
      process.execPath,
      "test",
      ...specs,
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
    `bootstrap Mochi coverage: functions ${functions.toFixed(2)}%, lines ${lines.toFixed(2)}% (minimum ${MINIMUM_PERCENT}%)`,
  );

  if (functions < MINIMUM_PERCENT || lines < MINIMUM_PERCENT) {
    process.stderr.write("bootstrap Mochi coverage is below the 65% shipping floor\n");
    process.exit(1);
  }
};

await main();
