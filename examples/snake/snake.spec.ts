import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { readRepo } from "@mochi/test-support";
import { match } from "@onrails/pattern";
import { unwrapOk } from "@onrails/result";

const source = readRepo(import.meta.url, "examples/snake/snake.mochi");
const boardSource = readRepo(import.meta.url, "examples/snake/src/components/CanvasBoard.mochi");
const js = unwrapOk(compile(source))
  .replace(/^import .*$/gm, "")
  .replace(/^export /gm, "");

type State = {
  snake: [number, number][];
  food: [number, number];
  dir: unknown;
  dirQueue: unknown[];
  score: number;
  highScore: number;
  status: unknown;
  cols: number;
  rows: number;
};

const game = new Function(
  "match",
  `${js}\nreturn { initGame, startGame, togglePause, isPausedStatus, step, freeCells, Right };`,
)(match) as {
  initGame: (cols: number, rows: number, highScore: number) => State;
  startGame: (state: State) => State;
  togglePause: (state: State) => State;
  isPausedStatus: (status: unknown) => boolean;
  step: (state: State, food: [number, number]) => State;
  freeCells: (origin: [number, number], snake: [number, number][]) => [number, number][];
  Right: unknown;
};

test("snake world has no wall collision and food follows the moving window", () => {
  const running = game.startGame({
    ...game.initGame(20, 20, 0),
    snake: [
      [19, 10],
      [18, 10],
      [17, 10],
    ],
    dir: game.Right,
  });
  const moved = game.step(running, [50, 50]);
  expect(moved.status).toBe(running.status);
  expect(moved.snake[0]).toEqual([20, 10]);
  expect(game.freeCells([40, -10], moved.snake)).toContainEqual([40, -10]);
});

test("pause state remains explicit and resume-safe", () => {
  const playing = game.startGame(game.initGame(20, 20, 0));
  const paused = game.togglePause(playing);
  expect(game.isPausedStatus(paused.status)).toBe(true);
  expect(game.togglePause(paused).status).toBe(playing.status);
});

test("snake animation loop keeps the frame renderer in Mochi", () => {
  const boardJs = unwrapOk(compile(boardSource));
  expect(boardJs).toContain('from "@mochi/web/canvas";');
  expect(boardJs).toContain("roundRect, canvasRefSeed, startCanvasLoop, setFillStyle");
  expect(boardJs).toContain("const drawFrame = _curry(4");
  expect(boardJs).toContain("const drawFoodEdgeGlow = _curry(3");
  expect(boardJs).toContain("const drawSnakePathGo = _curry(3");
  expect(boardJs).toContain('setLineCap(ctx, "round")');
  expect(boardJs).toContain('setLineJoin(ctx, "round")');
  expect(boardJs).not.toContain("startParticleLoop");
  expect(boardJs).not.toContain("canvas.host");
  expect(boardJs).toContain("while (true)");
});
