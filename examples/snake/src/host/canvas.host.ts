/**
 * Host seam for Canvas2D / rAF / particles — APIs mochi cannot express yet.
 * `CanvasBoard.mochi` owns the component + effects; this module paints pixels.
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

type Dir = "up" | "down" | "left" | "right";

const dirBetween = ([ax, ay]: [number, number], [bx, by]: [number, number]): Dir =>
  ax < bx ? "right" : ax > bx ? "left" : ay < by ? "down" : "up";

const headRadii = (dir: Dir, r: number): [number, number, number, number] => {
  switch (dir) {
    case "up":
      return [r, r, 0, 0];
    case "down":
      return [0, 0, r, r];
    case "left":
      return [r, 0, 0, r];
  }
  return [0, r, r, 0];
};

const tailRadii = (dir: Dir, r: number): [number, number, number, number] => {
  switch (dir) {
    case "up":
      return [0, 0, r, r];
    case "down":
      return [r, r, 0, 0];
    case "left":
      return [0, r, r, 0];
  }
  return [r, 0, 0, r];
};

const cornerRadii = (dirIn: Dir, dirOut: Dir, r: number): [number, number, number, number] => {
  const tl =
    (dirOut === "right" && dirIn === "up") || (dirOut === "down" && dirIn === "left") ? r : 0;
  const tr =
    (dirOut === "down" && dirIn === "right") || (dirOut === "left" && dirIn === "up") ? r : 0;
  const br =
    (dirOut === "left" && dirIn === "down") || (dirOut === "up" && dirIn === "right") ? r : 0;
  const bl =
    (dirOut === "up" && dirIn === "left") || (dirOut === "right" && dirIn === "down") ? r : 0;
  return [tl, tr, br, bl];
};

const headEyes = (
  px: number,
  py: number,
  size: number,
  head: [number, number],
  neck: [number, number],
): [[number, number], [number, number]] => {
  const dir = dirBetween(neck, head);
  switch (dir) {
    case "right":
      return [
        [px + size * 0.7, py + size * 0.3],
        [px + size * 0.7, py + size * 0.7],
      ];
    case "left":
      return [
        [px + size * 0.3, py + size * 0.3],
        [px + size * 0.3, py + size * 0.7],
      ];
    case "down":
      return [
        [px + size * 0.3, py + size * 0.7],
        [px + size * 0.7, py + size * 0.7],
      ];
  }
  return [
    [px + size * 0.3, py + size * 0.3],
    [px + size * 0.7, py + size * 0.3],
  ];
};

const drawGrid = (ctx: CanvasRenderingContext2D, cell: number, camera: [number, number]): void => {
  const [cameraX, cameraY] = camera;
  const half = BOARD_PX / cell / 2 + 1;
  const left = Math.floor(cameraX - half);
  const right = Math.ceil(cameraX + half);
  const top = Math.floor(cameraY - half);
  const bottom = Math.ceil(cameraY + half);
  ctx.strokeStyle = "rgba(74, 58, 54, 0.12)";
  ctx.lineWidth = 1;
  for (let x = left; x <= right; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cell, top * cell);
    ctx.lineTo(x * cell, bottom * cell);
    ctx.stroke();
  }
  for (let y = top; y <= bottom; y++) {
    ctx.beginPath();
    ctx.moveTo(left * cell, y * cell);
    ctx.lineTo(right * cell, y * cell);
    ctx.stroke();
  }
};

const drawFood = (ctx: CanvasRenderingContext2D, cell: number, x: number, y: number): void => {
  const px = x * cell + cell / 2;
  const py = y * cell + cell / 2;
  const radius = cell / 2 - 3;

  ctx.shadowColor = "rgba(232, 139, 169, 0.35)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#E88BA9";
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(px - radius * 0.3, py - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();
};

const drawSnakeHead = (
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  snake: [number, number][],
): void => {
  const head = snake[0]!;
  const neck = snake.length > 1 ? snake[1]! : ([head[0] - 1, head[1]] as [number, number]);
  const [eye1, eye2] = headEyes(px, py, size, head, neck);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#4A3A36";
  ctx.beginPath();
  ctx.arc(eye1[0], eye1[1], 3, 0, Math.PI * 2);
  ctx.arc(eye2[0], eye2[1], 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "rgba(217, 141, 62, 0.25)";
  ctx.shadowBlur = 6;
};

const drawSnake = (
  ctx: CanvasRenderingContext2D,
  cell: number,
  snake: [number, number][],
  previousSnake: [number, number][],
): void => {
  ctx.shadowColor = "rgba(217, 141, 62, 0.25)";
  ctx.shadowBlur = 6;
  const radiusSize = cell / 2;

  // At a turn, adjacent cells travel along perpendicular axes. Link them
  // through the preceding segment's old cell so the in-between frame stays a
  // continuous right-angle body rather than opening a diagonal seam.
  ctx.strokeStyle = "rgba(235, 167, 92, 0.9)";
  ctx.lineWidth = cell;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 1; i < snake.length; i++) {
    const [headX, headY] = snake[i - 1]!;
    const [neckX, neckY] = snake[i]!;
    const [cornerX, cornerY] = previousSnake[i - 1] ?? snake[i]!;
    ctx.beginPath();
    ctx.moveTo((headX + 0.5) * cell, (headY + 0.5) * cell);
    ctx.lineTo((cornerX + 0.5) * cell, (cornerY + 0.5) * cell);
    ctx.lineTo((neckX + 0.5) * cell, (neckY + 0.5) * cell);
    ctx.stroke();
  }

  snake.forEach(([x, y], idx) => {
    const px = x * cell;
    const py = y * cell;
    const isHead = idx === 0;
    const isTail = idx === snake.length - 1;

    ctx.fillStyle = isHead ? "#D98D3E" : "rgba(235, 167, 92, 0.9)";

    let radii: [number, number, number, number] = [0, 0, 0, 0];
    if (isHead) {
      const neck = snake.length > 1 ? snake[1]! : ([x - 1, y] as [number, number]);
      radii = headRadii(dirBetween(neck, [x, y]), radiusSize);
    } else if (isTail) {
      const prevTail = snake.length > 1 ? snake[idx - 1]! : ([x + 1, y] as [number, number]);
      radii = tailRadii(dirBetween([x, y], prevTail), radiusSize);
    } else {
      const prev = snake[idx + 1]!;
      const next = snake[idx - 1]!;
      const dirIn = dirBetween(prev, [x, y]);
      const dirOut = dirBetween([x, y], next);
      const horizontal = (d: Dir) => d === "left" || d === "right";
      const isCorner = dirIn !== dirOut && horizontal(dirIn) !== horizontal(dirOut);
      radii = isCorner ? cornerRadii(dirIn, dirOut, radiusSize) : [0, 0, 0, 0];
    }

    ctx.beginPath();
    ctx.roundRect(px, py, cell, cell, radii);
    ctx.fill();
    if (isHead) drawSnakeHead(ctx, px, py, cell, snake);
  });

  ctx.shadowBlur = 0;
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
 * Paint one interpolated world frame. The simulation only changes on its
 * discrete tick; the camera follows the interpolated head through the world.
 */
export const paintBoard = (
  canvasRef: MutableRef<HTMLCanvasElement | null>,
  boardRef: MutableRef<BoardView>,
  particlesRef: MutableRef<Particle[]>,
  interpolatePoint: InterpolatePoint,
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
  drawGrid(ctx, CELL_PX, head);
  drawFood(ctx, CELL_PX, motion.current.food[0], motion.current.food[1]);
  drawSnake(ctx, CELL_PX, snake, motion.previous.snake);

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
): (() => void) => {
  let rafId: number | null = null;
  let active = true;
  const tick = () => {
    if (!active) return;
    paintBoard(canvasRef, boardRef, particlesRef, interpolatePoint);
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
  return () => {
    active = false;
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
};
