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
  `${js}\nreturn { initGame, startGame, step, freeCells, Right };`,
)(match) as {
  initGame: (cols: number, rows: number, highScore: number) => State;
  startGame: (state: State) => State;
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

test("snake animation loop passes the Mochi renderer through the extern boundary", () => {
  const boardJs = unwrapOk(compile(boardSource));
  expect(boardJs).toContain("const startParticleLoop = _curry(5, $startParticleLoop);");
  expect(boardJs).toContain("const drawBoard = _curry(5");
});
