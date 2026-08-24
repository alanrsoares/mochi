/**
 * Host seam for canvas lifecycle, rAF, interpolation snapshots, and particles.
 * `CanvasBoard.mochi` owns all grid, food, and snake drawing.
 */

export const BOARD_PX = 600;
const CELL_PX = 30;
const MOVE_MS = 120;

/** Seed for `useRef` — mochi has no `null` literal. */
export const nullEl: HTMLCanvasElement | null = null;

export type BoardView = {
  snake: [number, number][];
  food: [number, number];
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

export type EatWatch = { len: number; food: [number, number] };

export const emptyParticles = (): Particle[] => [];

export const eatWatchSeed = (snake: [number, number][], food: [number, number]): EatWatch => ({
  len: snake.length,
  food,
});

type MutableRef<T> = { current: T };
type InterpolatePoint = (
  from: [number, number],
  to: [number, number],
  progress: number,
) => [number, number];
type DrawBoard = (
  ctx: CanvasRenderingContext2D,
  snake: [number, number][],
  previousSnake: [number, number][],
  food: [number, number],
  head: [number, number],
) => void;

type Motion = { previous: BoardView; current: BoardView; changedAt: number };
const motionByBoardRef = new WeakMap<object, Motion>();

export const syncBoardRef = (boardRef: MutableRef<BoardView>, board: BoardView): void => {
  const previous = motionByBoardRef.get(boardRef)?.current ?? board;
  motionByBoardRef.set(boardRef, { previous, current: board, changedAt: performance.now() });
  boardRef.current = board;
};

const spawnParticles = (particles: Particle[], cell: number, x: number, y: number): void => {
  const px = x * cell + cell / 2;
  const py = y * cell + cell / 2;
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      color: Math.random() > 0.5 ? "#E88BA9" : "#EBA75C",
    });
  }
};

/** If the snake grew, burst at the previous food cell; always advance the watch. */
export const watchEat = (
  particlesRef: MutableRef<Particle[]>,
  watchRef: MutableRef<EatWatch>,
  board: BoardView,
): void => {
  if (board.snake.length > watchRef.current.len) {
    const [fx, fy] = watchRef.current.food;
    spawnParticles(particlesRef.current, CELL_PX, fx, fy);
  }
  watchRef.current = { len: board.snake.length, food: board.food };
};

const stepParticles = (particles: Particle[]): Particle[] =>
  particles
    .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.05 }))
    .filter((p) => p.life > 0);

const interpolateSnake = (
  motion: Motion,
  interpolatePoint: InterpolatePoint,
  progress: number,
): [number, number][] => {
  const fallback = motion.previous.snake.at(-1) ?? motion.current.snake[0] ?? [0, 0];
  return motion.current.snake.map((point, i) =>
    interpolatePoint(motion.previous.snake[i] ?? fallback, point, progress),
  );
};

/**
 * Prepare one interpolated world frame. The simulation only changes on its
 * discrete tick; the camera follows the interpolated head through the world,
 * then hands the world-space canvas context to the Mochi renderer.
 */
export const paintBoard = (
  canvasRef: MutableRef<HTMLCanvasElement | null>,
  boardRef: MutableRef<BoardView>,
  particlesRef: MutableRef<Particle[]>,
  interpolatePoint: InterpolatePoint,
  drawBoard: DrawBoard,
): void => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const motion = motionByBoardRef.get(boardRef) ?? {
    previous: boardRef.current,
    current: boardRef.current,
    changedAt: performance.now(),
  };
  const progress = Math.min(1, Math.max(0, (performance.now() - motion.changedAt) / MOVE_MS));
  const snake = interpolateSnake(motion, interpolatePoint, progress);
  const head = snake[0] ?? [0, 0];

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, CELL_PX / 2);
  ctx.fillStyle = "#F2E6D8";
  ctx.fill();
  ctx.clip();

  ctx.save();
  ctx.translate(BOARD_PX / 2 - (head[0] + 0.5) * CELL_PX, BOARD_PX / 2 - (head[1] + 0.5) * CELL_PX);
  drawBoard(ctx, snake, motion.previous.snake, motion.current.food, head);

  const alive = stepParticles(particlesRef.current);
  particlesRef.current = alive;
  for (const p of alive) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
  ctx.restore();

  ctx.restore();
};

/**
 * Keep rendering while mounted: even without particles, interpolation needs
 * rAF frames between the game's discrete movement ticks.
 */
export const startParticleLoop = (
  canvasRef: MutableRef<HTMLCanvasElement | null>,
  particlesRef: MutableRef<Particle[]>,
  boardRef: MutableRef<BoardView>,
  interpolatePoint: InterpolatePoint,
  drawBoard: DrawBoard,
): (() => void) => {
  let rafId: number | null = null;
  let active = true;
  const tick = () => {
    if (!active) return;
    paintBoard(canvasRef, boardRef, particlesRef, interpolatePoint, drawBoard);
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
  return () => {
    active = false;
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
};
