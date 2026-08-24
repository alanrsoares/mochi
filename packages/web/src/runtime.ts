/** Runtime adapter for the typed Mochi-facing browser modules. */

type Option<A> = { _tag: "Some"; value: A } | { _tag: "None" };
type Cleanup = () => void;
type KeyEvent = { key: string };

export type Element = { tagName: string };
export type Document = {
  getElementById: (id: string) => Element | null;
  addEventListener: (name: "keydown", listener: (event: KeyEvent) => void) => void;
  removeEventListener: (name: "keydown", listener: (event: KeyEvent) => void) => void;
};
export type InputElement = Element & { value: string };
export type Storage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};
export type Frame = number;
export type CanvasElement = Element & { getContext: (kind: "2d") => Context2D | null };
export type Context2D = {
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  clearRect: (x: number, y: number, width: number, height: number) => void;
  fillRect: (x: number, y: number, width: number, height: number) => void;
  beginPath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  arc: (x: number, y: number, radius: number, startAngle: number, endAngle: number) => void;
  fill: () => void;
  stroke: () => void;
};

type Browser = {
  document: Document;
  localStorage: Storage;
  requestAnimationFrame: (callback: (time: number) => void) => Frame;
  cancelAnimationFrame: (frame: Frame) => void;
};

const browser = globalThis as unknown as Browser;

const none: Option<never> = { _tag: "None" };

export const option = <A>(value: A | null | undefined): Option<A> =>
  value == null ? none : { _tag: "Some", value };

export const document = (): Document => browser.document;

export const getElementById = (doc: Document, id: string): Option<Element> =>
  option(doc.getElementById(id));

export const inputValue = (input: InputElement): string => input.value;
export const localStorage = (): Storage => browser.localStorage;
export const storageGet = (storage: Storage, key: string): Option<string> =>
  option(storage.getItem(key));

export const storageSet = (storage: Storage, key: string, value: string): void => {
  storage.setItem(key, value);
};

export const onKeyDown = (doc: Document, callback: (key: string) => void): Cleanup => {
  const listener = (event: KeyEvent): void => callback(event.key.toLowerCase());
  doc.addEventListener("keydown", listener);
  return () => doc.removeEventListener("keydown", listener);
};

export const every = (ms: number, callback: () => void): Cleanup => {
  const id = globalThis.setInterval(callback, ms);
  return () => globalThis.clearInterval(id);
};

export const pickRandom = <A>(fallback: A, values: readonly A[]): A => {
  const index = Math.floor(Math.random() * values.length);
  return values[index] ?? fallback;
};

export const requestFrame = (callback: (time: number) => void): Frame =>
  browser.requestAnimationFrame(callback);
export const cancelFrame = (frame: Frame): void => browser.cancelAnimationFrame(frame);

export const canvasById = (id: string): Option<CanvasElement> => {
  const element = browser.document.getElementById(id);
  return element?.tagName === "CANVAS" ? option(element as CanvasElement) : none;
};

export const context2d = (canvas: CanvasElement): Option<Context2D> =>
  option(canvas.getContext("2d"));

export const clearRect = (
  ctx: Context2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void => {
  ctx.clearRect(x, y, width, height);
};

export const fillRect = (
  ctx: Context2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void => {
  ctx.fillRect(x, y, width, height);
};

export const beginPath = (ctx: Context2D): void => ctx.beginPath();
export const moveTo = (ctx: Context2D, x: number, y: number): void => ctx.moveTo(x, y);
export const lineTo = (ctx: Context2D, x: number, y: number): void => ctx.lineTo(x, y);
export const arc = (
  ctx: Context2D,
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): void => ctx.arc(x, y, radius, startAngle, endAngle);
export const fill = (ctx: Context2D): void => ctx.fill();
export const stroke = (ctx: Context2D): void => ctx.stroke();

export const setFillStyle = (ctx: Context2D, color: string): void => {
  ctx.fillStyle = color;
};

export const setStrokeStyle = (ctx: Context2D, color: string): void => {
  ctx.strokeStyle = color;
};

export const setLineWidth = (ctx: Context2D, width: number): void => {
  ctx.lineWidth = width;
};
