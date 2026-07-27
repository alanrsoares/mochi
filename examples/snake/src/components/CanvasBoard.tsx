import { useEffect, useRef } from "preact/hooks";

export type CanvasBoardProps = {
  snake: [number, number][];
  food: [number, number];
  cols: number;
  rows: number;
  playing: boolean;
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const SIZE = 600;

function spawnParticles(particles: Particle[], cell: number, x: number, y: number) {
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
}

function drawGrid(ctx: CanvasRenderingContext2D, cols: number, rows: number, cell: number) {
  ctx.strokeStyle = "rgba(74, 58, 54, 0.12)";
  ctx.lineWidth = 1;
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cell, 0);
    ctx.lineTo(c * cell, rows * cell);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * cell);
    ctx.lineTo(cols * cell, r * cell);
    ctx.stroke();
  }
}

function drawFood(ctx: CanvasRenderingContext2D, cell: number, x: number, y: number) {
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
}

type Dir = "up" | "down" | "left" | "right";

const dirBetween = ([ax, ay]: [number, number], [bx, by]: [number, number]): Dir =>
  ax < bx ? "right" : ax > bx ? "left" : ay < by ? "down" : "up";

function headRadii(dir: Dir, r: number): [number, number, number, number] {
  if (dir === "up") return [r, r, 0, 0];
  if (dir === "down") return [0, 0, r, r];
  if (dir === "left") return [r, 0, 0, r];
  return [0, r, r, 0];
}

function tailRadii(dir: Dir, r: number): [number, number, number, number] {
  if (dir === "up") return [0, 0, r, r];
  if (dir === "down") return [r, r, 0, 0];
  if (dir === "left") return [0, r, r, 0];
  return [r, 0, 0, r];
}

function cornerRadii(dirIn: Dir, dirOut: Dir, r: number): [number, number, number, number] {
  const tl =
    (dirOut === "right" && dirIn === "up") || (dirOut === "down" && dirIn === "left") ? r : 0;
  const tr =
    (dirOut === "down" && dirIn === "right") || (dirOut === "left" && dirIn === "up") ? r : 0;
  const br =
    (dirOut === "left" && dirIn === "down") || (dirOut === "up" && dirIn === "right") ? r : 0;
  const bl =
    (dirOut === "up" && dirIn === "left") || (dirOut === "right" && dirIn === "down") ? r : 0;
  return [tl, tr, br, bl];
}

/** Head eye placement, offset toward the direction of travel. */
function headEyes(
  px: number,
  py: number,
  size: number,
  head: [number, number],
  neck: [number, number],
): [[number, number], [number, number]] {
  const dir = dirBetween(neck, head);
  if (dir === "right")
    return [
      [px + size * 0.7, py + size * 0.3],
      [px + size * 0.7, py + size * 0.7],
    ];
  if (dir === "left")
    return [
      [px + size * 0.3, py + size * 0.3],
      [px + size * 0.3, py + size * 0.7],
    ];
  if (dir === "down")
    return [
      [px + size * 0.3, py + size * 0.7],
      [px + size * 0.7, py + size * 0.7],
    ];
  return [
    [px + size * 0.3, py + size * 0.3],
    [px + size * 0.7, py + size * 0.3],
  ];
}

function drawSnakeHead(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  snake: [number, number][],
) {
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
}

function drawSnake(ctx: CanvasRenderingContext2D, cell: number, snake: [number, number][]) {
  ctx.shadowColor = "rgba(217, 141, 62, 0.25)";
  ctx.shadowBlur = 6;

  const radiusSize = cell / 2;

  snake.forEach(([x, y], idx) => {
    const px = x * cell;
    const py = y * cell;
    const isHead = idx === 0;
    const isTail = idx === snake.length - 1;

    ctx.fillStyle = isHead ? "#D98D3E" : "rgba(235, 167, 92, 0.9)";

    let radii: [number, number, number, number] = [0, 0, 0, 0];
    if (isHead) {
      const neck = snake.length > 1 ? snake[1]! : ([x - 1, y] as [number, number]);
      const dir = dirBetween(neck, [x, y]);
      radii = headRadii(dir, radiusSize);
    } else if (isTail) {
      const prevTail = snake.length > 1 ? snake[idx - 1]! : ([x + 1, y] as [number, number]);
      const dir = dirBetween([x, y], prevTail);
      radii = tailRadii(dir, radiusSize);
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
}

/**
 * The one host widget (precedent: docs keeps Playground in TSX). Redraws
 * from props each animation frame; particle FX + the RAF loop are local,
 * host-only render state — game state itself lives in `App.mochi`.
 */
export function CanvasBoard({ snake, food, cols, rows }: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const prevLenRef = useRef(snake.length);
  const prevFoodRef = useRef(food);

  snakeRef.current = snake;
  foodRef.current = food;

  // Detect "ate" transitions (snake grew) to spawn a particle burst at the
  // just-eaten food cell, without duplicating snake.mochi's game logic here.
  useEffect(() => {
    const cell = SIZE / cols;
    if (snake.length > prevLenRef.current) {
      const [fx, fy] = prevFoodRef.current;
      spawnParticles(particlesRef.current, cell, fx, fy);
    }
    prevLenRef.current = snake.length;
    prevFoodRef.current = food;
  }, [snake.length, food, cols]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const render = () => {
      const cell = SIZE / cols;
      const boardRadius = cell / 2;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(0, 0, canvas.width, canvas.height, boardRadius);
      ctx.fillStyle = "#F2E6D8";
      ctx.fill();
      ctx.clip();

      drawGrid(ctx, cols, rows, cell);
      drawFood(ctx, cell, foodRef.current[0], foodRef.current[1]);
      drawSnake(ctx, cell, snakeRef.current);

      const alive = particlesRef.current
        .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.05 }))
        .filter((p) => p.life > 0);
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

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [cols, rows]);

  return (
    <canvas
      ref={canvasRef}
      id="game-canvas"
      width={SIZE}
      height={SIZE}
      className="block h-auto max-h-full w-auto max-w-full rounded-[15px] border-2 border-line-strong shadow-lg"
    />
  );
}
