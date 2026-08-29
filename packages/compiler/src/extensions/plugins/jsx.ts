/**
 * Builtin JSX plugin (ADR 0011 decision 2, #27–#28) — the language's own most
 * complex piece of sugar, expressed as a `LanguagePlugin` instead of seams in
 * four core passes. All of JSX lives here:
 *
 * - `parse`: `<tag …>…</tag>` / `<>…</>` → `h(tag, props, children)`, tagged
 *   `origin: "jsx"` (ADR 0011 §5) — the provenance every hook below keys off, so
 *   a hand-written `h(...)` is never mistaken for sugar.
 * - `inferCall`: a component tag (record → …) has its prop row checked against
 *   the attrs; anything else is an intrinsic tag and yields `VNode`.
 * - `format`: re-fold that call back to `<tag …>…</tag>` / `<>…</>`.
 * - `bindingType`: a component binding declares as `(props: P) => any` for both
 *   the `.d.ts` writer and the TS backend (ADR 0010 #17).
 *
 * `VNode` is this plugin's vocabulary, not the prelude's: no declaration
 * anywhere, just a bare `tCon("VNode")` invented here and rendered nominally by
 * `showType` / `tsOf` like any other unknown constructor.
 *
 * The lexer stays generic: `<`, `>`, `/`, strings and identifiers are plain
 * tokens, and the grammar that gives them JSX meaning is entirely below.
 */
import { err, isErr, ok, type Result } from "@onrails/result";
import { type Expr, type Field, isCtorName, type RecordExpr, type SeqElem } from "../../ast/ast";
import { type Span, spanning } from "../../ast/span";
import {
  type ArrowType,
  type RecordType,
  type Row,
  rExtend,
  type Type,
  tArrow,
  tBool,
  tCon,
  tLit,
  tNumber,
  tRecord,
  tString,
  tUnion,
} from "../../ast/types";
import { cat, type Doc, group, indent, line, seq, softline, txt } from "../../doc/doc";
import type { Diagnostic } from "../../errors/errors";
import { closestName } from "../../infer/suggest";
import type {
  BindingTypeApi,
  BindingTypeHook,
  FormatApi,
  FormatHook,
  InferCallApi,
  InferCallHook,
  LanguagePlugin,
  ParseHook,
  ParserApi,
} from "../extensions";
import { type CallExpr, rowField } from "../plugin-kit";

/** The JSX pragma name the parser desugars to, and the fragment tag it uses for `<>…</>`. */
const PRAGMA = "h";
const FRAGMENT = "Fragment";

/** Intrinsic attribute type representation (ADR 0096). */
export type IntrinsicAttrType =
  | "string"
  | "number"
  | "bool"
  | "string|number"
  | "string|bool"
  | "event"
  | "any"
  | readonly string[];

export type ElementSchema = Readonly<Record<string, IntrinsicAttrType>>;

/** Common global HTML attributes allowed on all HTML elements. */
export const GLOBAL_HTML_ATTRS: ElementSchema = {
  id: "string",
  className: "string",
  style: "any",
  title: "string",
  hidden: "bool",
  tabIndex: "number",
  role: "string",
  dir: ["ltr", "rtl", "auto"],
  lang: "string",
  ref: "any",
  key: "string|number",
  slot: "string",
  draggable: "bool",
  spellCheck: "bool",
  contentEditable: "string|bool",
  inputMode: "string",
  accessKey: "string",
  autoCapitalize: "string",
  autoCorrect: "string",
  translate: ["yes", "no"],
  popover: "string|bool",
  popoverTarget: "string",
  popoverTargetAction: ["toggle", "show", "hide"],
  ariaLabel: "string",
  ariaHidden: "string|bool",
  ariaExpanded: "string|bool",
  ariaDisabled: "string|bool",
  ariaChecked: "string|bool",
  ariaSelected: "string|bool",
  ariaInvalid: "string|bool",
  ariaRequired: "string|bool",
  ariaReadOnly: "string|bool",
  ariaValueNow: "number",
  ariaValueMin: "number",
  ariaValueMax: "number",
  ariaValueText: "string",
  ariaLive: ["off", "polite", "assertive"],
  ariaAtomic: "string|bool",
  ariaRelevant: "string",
  ariaBusy: "string|bool",
  ariaControls: "string",
  ariaDescribedBy: "string",
  ariaDetails: "string",
  ariaErrorMessage: "string",
  ariaFlowTo: "string",
  ariaHasPopup: "string|bool",
  ariaKeyShortcuts: "string",
  ariaLabelledBy: "string",
  ariaModal: "string|bool",
  ariaMultiline: "string|bool",
  ariaMultiSelectable: "string|bool",
  ariaOrientation: ["horizontal", "vertical"],
  ariaPlaceholder: "string",
  ariaPressed: "string|bool",
  ariaRoleDescription: "string",
  ariaRowCount: "number",
  ariaRowIndex: "number",
  ariaRowSpan: "number",
  ariaColCount: "number",
  ariaColIndex: "number",
  ariaColSpan: "number",
  ariaSort: ["none", "ascending", "descending", "other"],
  ariaCurrent: "string|bool",
  onClick: "event",
  onDoubleClick: "event",
  onMouseDown: "event",
  onMouseUp: "event",
  onMouseEnter: "event",
  onMouseLeave: "event",
  onMouseMove: "event",
  onMouseOver: "event",
  onMouseOut: "event",
  onContextMenu: "event",
  onAuxClick: "event",
  onKeyDown: "event",
  onKeyUp: "event",
  onKeyPress: "event",
  onInput: "event",
  onChange: "event",
  onFocus: "event",
  onBlur: "event",
  onSubmit: "event",
  onReset: "event",
  onInvalid: "event",
  onScroll: "event",
  onScrollEnd: "event",
  onWheel: "event",
  onTouchStart: "event",
  onTouchMove: "event",
  onTouchEnd: "event",
  onTouchCancel: "event",
  onPointerDown: "event",
  onPointerMove: "event",
  onPointerUp: "event",
  onPointerCancel: "event",
  onPointerEnter: "event",
  onPointerLeave: "event",
  onPointerOver: "event",
  onPointerOut: "event",
  onGotPointerCapture: "event",
  onLostPointerCapture: "event",
  onDrag: "event",
  onDragEnd: "event",
  onDragEnter: "event",
  onDragLeave: "event",
  onDragOver: "event",
  onDragStart: "event",
  onDrop: "event",
  onLoad: "event",
  onError: "event",
  onToggle: "event",
  onClose: "event",
  onCancel: "event",
  onAnimationStart: "event",
  onAnimationEnd: "event",
  onAnimationIteration: "event",
  onTransitionEnd: "event",
  onTransitionRun: "event",
  onTransitionStart: "event",
  onTransitionCancel: "event",
  onSelect: "event",
  onCopy: "event",
  onCut: "event",
  onPaste: "event",
};

/** Common SVG element attributes. */
export const GLOBAL_SVG_ATTRS: ElementSchema = {
  ...GLOBAL_HTML_ATTRS,
  viewBox: "string",
  xmlns: "string",
  fill: "string",
  stroke: "string",
  strokeWidth: "string|number",
  strokeLinecap: ["butt", "round", "square", "inherit"],
  strokeLinejoin: ["miter", "round", "bevel", "inherit"],
  strokeDasharray: "string|number",
  strokeDashoffset: "string|number",
  strokeOpacity: "string|number",
  fillOpacity: "string|number",
  fillRule: ["nonzero", "evenodd", "inherit"],
  opacity: "string|number",
  d: "string",
  x: "string|number",
  y: "string|number",
  cx: "string|number",
  cy: "string|number",
  r: "string|number",
  rx: "string|number",
  ry: "string|number",
  x1: "string|number",
  y1: "string|number",
  x2: "string|number",
  y2: "string|number",
  points: "string",
  width: "string|number",
  height: "string|number",
  transform: "string",
  textAnchor: ["start", "middle", "end", "inherit"],
  dominantBaseline: "string",
  fontSize: "string|number",
  fontFamily: "string",
  fontWeight: "string|number",
  offset: "string|number",
  stopColor: "string",
  stopOpacity: "string|number",
  clipPath: "string",
  mask: "string",
  href: "string",
  xlinkHref: "string",
  preserveAspectRatio: "string",
  gradientUnits: ["userSpaceOnUse", "objectBoundingBox"],
  gradientTransform: "string",
  spreadMethod: ["pad", "reflect", "repeat"],
  patternUnits: ["userSpaceOnUse", "objectBoundingBox"],
  patternContentUnits: ["userSpaceOnUse", "objectBoundingBox"],
  markerWidth: "string|number",
  markerHeight: "string|number",
  refX: "string|number",
  refY: "string|number",
  orient: "string",
};

const makeSchema = (
  base: ElementSchema,
  extra: Readonly<Record<string, IntrinsicAttrType>> = {},
): ElementSchema => ({ ...base, ...extra });

/** Complete dictionary of standard intrinsic HTML and SVG elements. */
export const INTRINSIC_ELEMENTS: Readonly<Record<string, ElementSchema>> = {
  // Container / structural HTML elements
  div: GLOBAL_HTML_ATTRS,
  span: GLOBAL_HTML_ATTRS,
  p: GLOBAL_HTML_ATTRS,
  h1: GLOBAL_HTML_ATTRS,
  h2: GLOBAL_HTML_ATTRS,
  h3: GLOBAL_HTML_ATTRS,
  h4: GLOBAL_HTML_ATTRS,
  h5: GLOBAL_HTML_ATTRS,
  h6: GLOBAL_HTML_ATTRS,
  header: GLOBAL_HTML_ATTRS,
  footer: GLOBAL_HTML_ATTRS,
  nav: GLOBAL_HTML_ATTRS,
  main: GLOBAL_HTML_ATTRS,
  aside: GLOBAL_HTML_ATTRS,
  section: GLOBAL_HTML_ATTRS,
  article: GLOBAL_HTML_ATTRS,
  figure: GLOBAL_HTML_ATTRS,
  figcaption: GLOBAL_HTML_ATTRS,
  mark: GLOBAL_HTML_ATTRS,
  small: GLOBAL_HTML_ATTRS,
  strong: GLOBAL_HTML_ATTRS,
  em: GLOBAL_HTML_ATTRS,
  b: GLOBAL_HTML_ATTRS,
  i: GLOBAL_HTML_ATTRS,
  u: GLOBAL_HTML_ATTRS,
  s: GLOBAL_HTML_ATTRS,
  code: GLOBAL_HTML_ATTRS,
  pre: GLOBAL_HTML_ATTRS,
  kbd: GLOBAL_HTML_ATTRS,
  samp: GLOBAL_HTML_ATTRS,
  var: GLOBAL_HTML_ATTRS,
  sub: GLOBAL_HTML_ATTRS,
  sup: GLOBAL_HTML_ATTRS,
  abbr: GLOBAL_HTML_ATTRS,
  address: GLOBAL_HTML_ATTRS,
  bdi: GLOBAL_HTML_ATTRS,
  bdo: GLOBAL_HTML_ATTRS,
  cite: GLOBAL_HTML_ATTRS,
  dfn: GLOBAL_HTML_ATTRS,
  hr: GLOBAL_HTML_ATTRS,
  br: GLOBAL_HTML_ATTRS,
  wbr: GLOBAL_HTML_ATTRS,
  noscript: GLOBAL_HTML_ATTRS,
  picture: GLOBAL_HTML_ATTRS,
  template: GLOBAL_HTML_ATTRS,
  tbody: GLOBAL_HTML_ATTRS,
  thead: GLOBAL_HTML_ATTRS,
  tfoot: GLOBAL_HTML_ATTRS,
  tr: GLOBAL_HTML_ATTRS,
  caption: GLOBAL_HTML_ATTRS,
  summary: GLOBAL_HTML_ATTRS,
  ul: GLOBAL_HTML_ATTRS,

  // Interactive / specific HTML elements
  button: makeSchema(GLOBAL_HTML_ATTRS, {
    type: ["button", "submit", "reset"],
    disabled: "bool",
    form: "string",
    formAction: "string",
    formMethod: "string",
    formNoValidate: "bool",
    formTarget: "string",
    name: "string",
    value: "string",
    autoFocus: "bool",
  }),
  input: makeSchema(GLOBAL_HTML_ATTRS, {
    type: [
      "text",
      "password",
      "checkbox",
      "radio",
      "number",
      "email",
      "file",
      "hidden",
      "image",
      "range",
      "reset",
      "search",
      "submit",
      "tel",
      "url",
      "date",
      "datetime-local",
      "month",
      "time",
      "week",
      "color",
    ],
    value: "string|number",
    defaultValue: "string|number",
    checked: "bool",
    defaultChecked: "bool",
    placeholder: "string",
    disabled: "bool",
    readOnly: "bool",
    required: "bool",
    name: "string",
    min: "string|number",
    max: "string|number",
    step: "string|number",
    maxLength: "number",
    minLength: "number",
    pattern: "string",
    accept: "string",
    multiple: "bool",
    autoComplete: "string",
    autoFocus: "bool",
    alt: "string",
    src: "string",
    width: "string|number",
    height: "string|number",
    list: "string",
    capture: "string|bool",
    form: "string",
    formAction: "string",
    formMethod: "string",
    formNoValidate: "bool",
    formTarget: "string",
  }),
  a: makeSchema(GLOBAL_HTML_ATTRS, {
    href: "string",
    target: ["_blank", "_self", "_parent", "_top"],
    rel: "string",
    download: "string|bool",
    hrefLang: "string",
    ping: "string",
    referrerPolicy: "string",
    type: "string",
  }),
  img: makeSchema(GLOBAL_HTML_ATTRS, {
    src: "string",
    alt: "string",
    width: "string|number",
    height: "string|number",
    loading: ["lazy", "eager"],
    decoding: ["async", "sync", "auto"],
    crossOrigin: ["anonymous", "use-credentials", ""],
    sizes: "string",
    srcSet: "string",
    useMap: "string",
    isMap: "bool",
    referrerPolicy: "string",
  }),
  form: makeSchema(GLOBAL_HTML_ATTRS, {
    action: "string",
    method: ["get", "post", "dialog"],
    target: "string",
    encType: "string",
    noValidate: "bool",
    autoComplete: "string",
    name: "string",
  }),
  textarea: makeSchema(GLOBAL_HTML_ATTRS, {
    value: "string",
    defaultValue: "string",
    placeholder: "string",
    rows: "number",
    cols: "number",
    disabled: "bool",
    readOnly: "bool",
    required: "bool",
    name: "string",
    maxLength: "number",
    minLength: "number",
    autoFocus: "bool",
    wrap: "string",
    autoComplete: "string",
    form: "string",
  }),
  select: makeSchema(GLOBAL_HTML_ATTRS, {
    value: "string|number",
    defaultValue: "string|number",
    multiple: "bool",
    disabled: "bool",
    required: "bool",
    name: "string",
    size: "number",
    autoFocus: "bool",
    autoComplete: "string",
    form: "string",
  }),
  option: makeSchema(GLOBAL_HTML_ATTRS, {
    value: "string|number",
    disabled: "bool",
    selected: "bool",
    label: "string",
  }),
  optgroup: makeSchema(GLOBAL_HTML_ATTRS, {
    disabled: "bool",
    label: "string",
  }),
  label: makeSchema(GLOBAL_HTML_ATTRS, {
    htmlFor: "string",
    form: "string",
  }),
  canvas: makeSchema(GLOBAL_HTML_ATTRS, {
    width: "string|number",
    height: "string|number",
  }),
  dialog: makeSchema(GLOBAL_HTML_ATTRS, {
    open: "bool",
  }),
  details: makeSchema(GLOBAL_HTML_ATTRS, {
    open: "bool",
  }),
  audio: makeSchema(GLOBAL_HTML_ATTRS, {
    src: "string",
    autoPlay: "bool",
    controls: "bool",
    loop: "bool",
    muted: "bool",
    preload: ["none", "metadata", "auto", ""],
    crossOrigin: "string",
  }),
  video: makeSchema(GLOBAL_HTML_ATTRS, {
    src: "string",
    autoPlay: "bool",
    controls: "bool",
    loop: "bool",
    muted: "bool",
    preload: ["none", "metadata", "auto", ""],
    width: "string|number",
    height: "string|number",
    poster: "string",
    playsInline: "bool",
    crossOrigin: "string",
    disablePictureInPicture: "bool",
    disableRemotePlayback: "bool",
  }),
  source: makeSchema(GLOBAL_HTML_ATTRS, {
    src: "string",
    type: "string",
    srcSet: "string",
    sizes: "string",
    media: "string",
    width: "string|number",
    height: "string|number",
  }),
  track: makeSchema(GLOBAL_HTML_ATTRS, {
    kind: ["subtitles", "captions", "descriptions", "chapters", "metadata"],
    src: "string",
    srclang: "string",
    label: "string",
    default: "bool",
  }),
  iframe: makeSchema(GLOBAL_HTML_ATTRS, {
    src: "string",
    srcDoc: "string",
    name: "string",
    width: "string|number",
    height: "string|number",
    loading: ["lazy", "eager"],
    sandbox: "string",
    allow: "string",
    allowFullScreen: "bool",
    referrerPolicy: "string",
  }),
  table: makeSchema(GLOBAL_HTML_ATTRS, {
    cellPadding: "string|number",
    cellSpacing: "string|number",
  }),
  th: makeSchema(GLOBAL_HTML_ATTRS, {
    colSpan: "number",
    rowSpan: "number",
    scope: "string",
    headers: "string",
  }),
  td: makeSchema(GLOBAL_HTML_ATTRS, {
    colSpan: "number",
    rowSpan: "number",
    headers: "string",
  }),
  col: makeSchema(GLOBAL_HTML_ATTRS, {
    span: "number",
  }),
  colgroup: makeSchema(GLOBAL_HTML_ATTRS, {
    span: "number",
  }),
  ol: makeSchema(GLOBAL_HTML_ATTRS, {
    start: "number",
    reversed: "bool",
    type: "string",
  }),
  li: makeSchema(GLOBAL_HTML_ATTRS, {
    value: "number",
  }),
  meta: makeSchema(GLOBAL_HTML_ATTRS, {
    name: "string",
    content: "string",
    httpEquiv: "string",
    charSet: "string",
    property: "string",
  }),
  link: makeSchema(GLOBAL_HTML_ATTRS, {
    href: "string",
    rel: "string",
    as: "string",
    type: "string",
    crossOrigin: "string",
    media: "string",
    sizes: "string",
    hrefLang: "string",
    referrerPolicy: "string",
    integrity: "string",
  }),
  script: makeSchema(GLOBAL_HTML_ATTRS, {
    src: "string",
    type: "string",
    async: "bool",
    defer: "bool",
    crossOrigin: "string",
    integrity: "string",
    noModule: "bool",
    referrerPolicy: "string",
  }),
  style: makeSchema(GLOBAL_HTML_ATTRS, {
    media: "string",
    nonce: "string",
  }),
  progress: makeSchema(GLOBAL_HTML_ATTRS, {
    value: "string|number",
    max: "string|number",
  }),
  meter: makeSchema(GLOBAL_HTML_ATTRS, {
    value: "string|number",
    min: "string|number",
    max: "string|number",
    low: "string|number",
    high: "string|number",
    optimum: "string|number",
    form: "string",
  }),
  time: makeSchema(GLOBAL_HTML_ATTRS, {
    dateTime: "string",
  }),
  blockquote: makeSchema(GLOBAL_HTML_ATTRS, {
    cite: "string",
  }),
  q: makeSchema(GLOBAL_HTML_ATTRS, {
    cite: "string",
  }),
  del: makeSchema(GLOBAL_HTML_ATTRS, {
    cite: "string",
    dateTime: "string",
  }),
  ins: makeSchema(GLOBAL_HTML_ATTRS, {
    cite: "string",
    dateTime: "string",
  }),

  // SVG elements
  svg: GLOBAL_SVG_ATTRS,
  g: GLOBAL_SVG_ATTRS,
  path: GLOBAL_SVG_ATTRS,
  circle: GLOBAL_SVG_ATTRS,
  rect: GLOBAL_SVG_ATTRS,
  line: GLOBAL_SVG_ATTRS,
  polyline: GLOBAL_SVG_ATTRS,
  polygon: GLOBAL_SVG_ATTRS,
  text: GLOBAL_SVG_ATTRS,
  tspan: GLOBAL_SVG_ATTRS,
  use: GLOBAL_SVG_ATTRS,
  symbol: GLOBAL_SVG_ATTRS,
  defs: GLOBAL_SVG_ATTRS,
  clipPath: GLOBAL_SVG_ATTRS,
  mask: GLOBAL_SVG_ATTRS,
  pattern: GLOBAL_SVG_ATTRS,
  linearGradient: GLOBAL_SVG_ATTRS,
  radialGradient: GLOBAL_SVG_ATTRS,
  stop: GLOBAL_SVG_ATTRS,
  image: GLOBAL_SVG_ATTRS,
  foreignObject: GLOBAL_SVG_ATTRS,
  marker: GLOBAL_SVG_ATTRS,
};

/** Common JSX migration and spelling mistake hints. */
export const JSX_MISMATCH_HINTS: Readonly<Record<string, string>> = {
  class: "In JSX, use 'className' instead of 'class'.",
  for: "In JSX, use 'htmlFor' instead of 'for'.",
  tabindex: "In JSX, use 'tabIndex' instead of 'tabindex'.",
  autofocus: "In JSX, use 'autoFocus' instead of 'autofocus'.",
  autocomplete: "In JSX, use 'autoComplete' instead of 'autocomplete'.",
  readonly: "In JSX, use 'readOnly' instead of 'readonly'.",
  maxlength: "In JSX, use 'maxLength' instead of 'maxlength'.",
  minlength: "In JSX, use 'minLength' instead of 'minlength'.",
  spellcheck: "In JSX, use 'spellCheck' instead of 'spellcheck'.",
  contenteditable: "In JSX, use 'contentEditable' instead of 'contenteditable'.",
  viewbox: "In JSX, use 'viewBox' instead of 'viewbox'.",
  strokewidth: "In JSX, use 'strokeWidth' instead of 'strokewidth'.",
  strokelinecap: "In JSX, use 'strokeLinecap' instead of 'strokelinecap'.",
  strokelinejoin: "In JSX, use 'strokeLinejoin' instead of 'strokelinejoin'.",
  onclick: "In JSX, event handlers are camelCase: use 'onClick' instead of 'onclick'.",
  onchange: "In JSX, event handlers are camelCase: use 'onChange' instead of 'onchange'.",
  oninput: "In JSX, event handlers are camelCase: use 'onInput' instead of 'oninput'.",
  onkeydown: "In JSX, event handlers are camelCase: use 'onKeyDown' instead of 'onkeydown'.",
  onkeyup: "In JSX, event handlers are camelCase: use 'onKeyUp' instead of 'onkeyup'.",
  onsubmit: "In JSX, event handlers are camelCase: use 'onSubmit' instead of 'onsubmit'.",
  onfocus: "In JSX, event handlers are camelCase: use 'onFocus' instead of 'onfocus'.",
  onblur: "In JSX, event handlers are camelCase: use 'onBlur' instead of 'onblur'.",
};

export const intrinsicAttrTypeToType = (attr: IntrinsicAttrType): Type => {
  if (Array.isArray(attr)) {
    return tUnion(attr.map((v) => tLit(v, "string")));
  }
  switch (attr) {
    case "string":
      return tString;
    case "number":
      return tNumber;
    case "bool":
      return tBool;
    case "string|number":
      return tUnion([tString, tNumber]);
    case "string|bool":
      return tUnion([tString, tBool]);
    default:
      return tCon("any");
  }
};

/** Parser-synthesized `h(tag, props, …children)` (ADR 0011 §5 sugar provenance). */
const isJsxCall = (e: CallExpr): boolean => e.origin === "jsx" && e.args.length >= 2;

// ---------------------------------------------------------------- parse

/**
 * `h(tag, props, children)` with sugar provenance — the one place `origin:
 * "jsx"` is written, and the shape `formatJsx` / `inferJsxCall` below expect.
 */
const makeJsxCall = (
  api: ParserApi,
  tagExpr: Expr,
  fields: Field[],
  spreadExpr: Expr | undefined,
  children: SeqElem[],
  startSpan: Span,
): Expr => {
  const fullSpan = api.spanFrom(startSpan);
  return {
    kind: "call",
    fn: { kind: "ref", name: PRAGMA, span: startSpan },
    args: [
      tagExpr,
      { kind: "record", fields, spread: spreadExpr, span: fullSpan },
      { kind: "arr", elements: children, span: fullSpan },
    ],
    origin: "jsx",
    span: fullSpan,
  };
};

/**
 * Children up to the closing tag. `expectedTag` is the open tag's name (null for
 * a fragment), so a mismatch names both sides. Bare text/number/bool/identifier
 * children become literals; `{…}` re-enters the core expression parser.
 */
const parseJsxChildren = (api: ParserApi, expectedTag: string | null): SeqElem[] => {
  const elems: SeqElem[] = [];

  for (;;) {
    const tk = api.peek();
    if (tk.t === "eof") {
      api.fail(expectedTag ? `unclosed JSX tag '<${expectedTag}>'` : "unclosed JSX fragment");
    }

    if (tk.t === "lt" && api.peek(1).t === "slash") {
      api.next(); // consume '<'
      api.next(); // consume '/'

      if (expectedTag === null) {
        api.expect("gt");
        break;
      }

      const closingId = api.expectId();
      if (closingId.name !== expectedTag && !expectedTag.endsWith(`.${closingId.name}`)) {
        api.fail(
          `mismatched JSX closing tag: expected '</${expectedTag}>', got '</${closingId.name}>'`,
        );
      }
      api.expect("gt");
      break;
    }

    if (tk.t === "lt") {
      elems.push({ kind: "expr", expr: parseJsxElement(api) });
      continue;
    }

    if (tk.t === "lbrace") {
      api.next(); // consume '{'
      if (api.peek().t === "spread") {
        api.next(); // consume '...'
        const spreadChild = api.parseExpr();
        api.expect("rbrace");
        elems.push({ kind: "spread", expr: spreadChild });
      } else {
        const childExpr = api.parseExpr();
        api.expect("rbrace");
        elems.push({ kind: "expr", expr: childExpr });
      }
      continue;
    }

    const childTk = api.next();
    if (childTk.t === "str") {
      elems.push({ kind: "expr", expr: { kind: "str", value: childTk.v, span: childTk.span } });
    } else if (childTk.t === "num") {
      elems.push({
        kind: "expr",
        expr: { kind: "num", value: childTk.v, raw: childTk.raw, span: childTk.span },
      });
    } else if (childTk.t === "bool") {
      elems.push({ kind: "expr", expr: { kind: "bool", value: childTk.v, span: childTk.span } });
    } else if (childTk.t === "id") {
      elems.push({ kind: "expr", expr: { kind: "str", value: childTk.v, span: childTk.span } });
    } else {
      api.fail(`unexpected token in JSX children: ${childTk.t}`);
    }
  }

  return elems;
};

/**
 * One element, from its `<` through its close: fragment `<>…</>`, self-closing
 * `<tag />`, or `<tag …>children</tag>`. A lowercase tag is an intrinsic (string)
 * tag; a capitalized or dotted one (`<Foo.Bar />`) stays a reference expression.
 */
const parseJsxElement = (api: ParserApi): Expr => {
  const startTok = api.expect("lt");

  // Fragment `<> … </>`
  if (api.peek().t === "gt") {
    api.next(); // consume '>'
    const children = parseJsxChildren(api, null);
    return makeJsxCall(
      api,
      { kind: "str", value: FRAGMENT, span: startTok.span },
      [],
      undefined,
      children,
      startTok.span,
    );
  }

  const firstId = api.expectId();
  let tagRef: Expr = { kind: "ref", name: firstId.name, span: firstId.span };
  while (api.peek().t === "dot") {
    api.next(); // consume '.'
    const fieldId = api.expectId();
    tagRef = {
      kind: "field",
      target: tagRef,
      name: fieldId.name,
      span: spanning(tagRef.span, fieldId.span),
    };
  }

  // Lowercase → intrinsic string tag; capitalized or dotted → the reference itself.
  const tagNameStr = tagRef.kind === "ref" ? tagRef.name : null;
  const tagExpr: Expr =
    tagRef.kind === "ref" && !isCtorName(tagRef.name)
      ? { kind: "str", value: tagRef.name, span: tagRef.span }
      : tagRef;

  const fields: Field[] = [];
  let spreadExpr: Expr | undefined;
  while (api.peek().t !== "gt" && !(api.peek().t === "slash" && api.peek(1).t === "gt")) {
    if (api.peek().t === "lbrace") {
      api.next(); // consume '{'
      api.expect("spread");
      spreadExpr = api.parseExpr();
      api.expect("rbrace");
      continue;
    }
    let attrId = api.expectLabel();
    // `data-testid` / `aria-label` lex as label/minus/label. Glue them back —
    // but only while the tokens ABUT, or `<div id - x="1">` would silently
    // become `id-x`.
    while (
      api.peek().t === "minus" &&
      api.peek().span.start === attrId.span.end &&
      api.peek(1).span.start === api.peek().span.end
    ) {
      api.next();
      const part = api.expectLabel();
      attrId = {
        name: `${attrId.name}-${part.name}`,
        span: spanning(attrId.span, part.span),
      };
    }
    let valExpr: Expr = { kind: "bool", value: true, span: attrId.span };
    if (api.peek().t === "eq") {
      api.next(); // consume '='
      if (api.peek().t === "str") {
        const strTk = api.expect("str");
        valExpr = { kind: "str", value: strTk.v, span: strTk.span };
      } else if (api.peek().t === "lbrace") {
        api.next(); // consume '{'
        valExpr = api.parseExpr();
        api.expect("rbrace");
      } else {
        api.fail(`expected string or '{expr}' for attribute '${attrId.name}'`);
      }
    }
    fields.push({ name: attrId.name, nameSpan: attrId.span, value: valExpr });
  }

  if (api.peek().t === "slash") {
    api.next(); // consume '/'
    api.expect("gt");
    return makeJsxCall(api, tagExpr, fields, spreadExpr, [], startTok.span);
  }

  api.expect("gt"); // close the opening tag
  const children = parseJsxChildren(api, tagNameStr);
  return makeJsxCall(api, tagExpr, fields, spreadExpr, children, startTok.span);
};

/** Claim atom position only for a leading `<`; anything else falls through untouched. */
const parseJsxAtom: ParseHook = (api: ParserApi): Expr | null =>
  api.peek().t === "lt" ? parseJsxElement(api) : null;

// ---------------------------------------------------------------- infer

/**
 * If the component expects `props.children` and attrs omitted it (normal JSX),
 * but the body supplied children, add `children` to the attrs type so unify
 * matches the runtime fold. Empty body + required children → still missing.
 */
const jsxPropsWithSynthesizedChildren = (
  propsType: Type,
  propsExpr: Expr,
  expectedRow: Row,
  childElems: readonly SeqElem[],
): Type => {
  const expectedChildren = rowField(expectedRow, "children");
  if (!expectedChildren || propsType.kind !== "record") return propsType;
  const attrsHaveChildren =
    propsExpr.kind === "record" && propsExpr.fields.some((f) => f.name === "children");
  return attrsHaveChildren || childElems.length === 0
    ? propsType
    : tRecord(rExtend("children", expectedChildren, propsType.row));
};

const validateIntrinsicProp = (
  tagName: string,
  tagSchema: ElementSchema | undefined,
  isCustomElement: boolean,
  f: Field,
  api: InferCallApi,
): Result<void, Diagnostic> => {
  const hint = JSX_MISMATCH_HINTS[f.name];
  if (hint) {
    return err({
      kind: "type",
      message: hint,
      span: f.nameSpan,
    });
  }

  if (f.name.startsWith("data-") || f.name.startsWith("aria-")) {
    const valT = api.infer(f.value);
    if (isErr(valT)) return valT;
    api.noteType(f.nameSpan, valT.value, { kind: "property", name: f.name });
    return ok(undefined);
  }

  if (isCustomElement && !tagSchema) {
    const valT = api.infer(f.value);
    if (isErr(valT)) return valT;
    api.noteType(f.nameSpan, valT.value, { kind: "property", name: f.name });
    return ok(undefined);
  }

  let expectedAttr = tagSchema?.[f.name];
  if (
    !expectedAttr &&
    f.name.startsWith("on") &&
    f.name.length > 2 &&
    f.name[2] === f.name[2]?.toUpperCase()
  ) {
    expectedAttr = "event";
  }
  if (!expectedAttr) {
    const suggestion = tagSchema ? closestName(f.name, Object.keys(tagSchema)) : null;
    const didYouMean = suggestion ? ` Did you mean '${suggestion}'?` : "";
    return err({
      kind: "type",
      message: `Property '${f.name}' does not exist on '<${tagName}>'.${didYouMean}`,
      span: f.nameSpan,
    });
  }

  const valT = api.infer(f.value);
  if (isErr(valT)) return valT;

  if (expectedAttr === "event") {
    const zonkedVal = api.zonk(valT.value);
    if (
      zonkedVal.kind !== "arrow" &&
      zonkedVal.kind !== "var" &&
      !(zonkedVal.kind === "con" && zonkedVal.name === "any")
    ) {
      return err({
        kind: "type",
        message: `Expected function for event handler '${f.name}'`,
        span: f.value.span,
      });
    }
    api.noteType(f.nameSpan, tArrow(tCon("Event"), tCon("unit")), {
      kind: "property",
      name: f.name,
    });
    return ok(undefined);
  }

  if (expectedAttr === "any") {
    api.noteType(f.nameSpan, tCon("any"), { kind: "property", name: f.name });
    return ok(undefined);
  }

  const expectedType = intrinsicAttrTypeToType(expectedAttr);
  const uni = api.unify(valT.value, expectedType, f.value.span);
  if (isErr(uni)) return uni;
  api.noteType(f.nameSpan, expectedType, { kind: "property", name: f.name });
  return ok(undefined);
};

const inferIntrinsicJsxElement = (
  tagName: string,
  tagSpan: Span,
  propsExpr: Expr,
  api: InferCallApi,
): Result<Type, Diagnostic> => {
  if (tagName === FRAGMENT) {
    if (propsExpr.kind === "record") {
      for (const f of propsExpr.fields) {
        if (f.name !== "key") {
          return err({
            kind: "type",
            message: `JSX fragments only accept the 'key' prop, got '${f.name}'`,
            span: f.nameSpan,
          });
        }
      }
    }
    return ok(tCon("VNode"));
  }

  const isCustomElement = tagName.includes("-");
  const tagSchema = INTRINSIC_ELEMENTS[tagName];

  if (!tagSchema && !isCustomElement) {
    const suggestion = closestName(tagName, Object.keys(INTRINSIC_ELEMENTS));
    const didYouMean = suggestion ? ` Did you mean '<${suggestion}>'?` : "";
    return err({
      kind: "type",
      message: `Unknown JSX element '<${tagName}>'.${didYouMean}`,
      span: tagSpan,
    });
  }

  if (propsExpr.kind === "record") {
    for (const f of propsExpr.fields) {
      const res = validateIntrinsicProp(tagName, tagSchema, isCustomElement, f, api);
      if (isErr(res)) return res;
    }
  }

  return ok(tCon("VNode"));
};

type ComponentTagType = ArrowType & { from: RecordType };

const inferComponentJsxElement = (
  zonkedTag: ComponentTagType,
  propsType: Type,
  propsExpr: Expr,
  childElems: readonly SeqElem[],
  api: InferCallApi,
): Result<Type, Diagnostic> => {
  const propsForCheck = jsxPropsWithSynthesizedChildren(
    propsType,
    propsExpr,
    zonkedTag.from.row,
    childElems,
  );
  const uni = api.unify(propsForCheck, zonkedTag.from, propsExpr.span);
  if (isErr(uni)) return uni;
  if (propsExpr.kind === "record") {
    for (const f of propsExpr.fields) {
      const expected = rowField(zonkedTag.from.row, f.name);
      if (expected)
        api.noteType(f.nameSpan, api.zonk(expected), { kind: "property", name: f.name });
    }
  }
  return ok(api.zonk(zonkedTag.to));
};

/**
 * Infer a JSX call desugared to `h(tag, props, [children…])`.
 *
 * User components (`<Badge />`) unify `props` against their signature and hover
 * shows their prop types; intrinsic tags (`<button />`) typecheck against HTML
 * attrs; string tags stay open-world on props.
 *
 * Children are a heterogeneous array (text + elements). Do **not** run normal
 * Array inference (that forces one element type) — infer each child for errors
 * only, then type the slot as `[VNode]` for the call.
 *
 * Runtime hosts fold the 3rd arg into `props.children`. Attrs never carry that
 * field, so when the component's prop row requires `children` and the JSX body
 * supplied kids, synthesize the field onto the attrs record before unify —
 * otherwise `<Panel>…</Panel>` false-fails with `missing field 'children'`.
 */
const inferJsxCall: InferCallHook = (
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  if (!isJsxCall(e)) return null;
  const tagExpr = e.args[0]!;
  const propsExpr = e.args[1]!;
  const tagT = api.infer(tagExpr);
  if (isErr(tagT)) return tagT;
  const propsT = api.infer(propsExpr);
  if (isErr(propsT)) return propsT;

  const childrenExpr = e.args[2];
  const childElems = childrenExpr?.kind === "arr" ? childrenExpr.elements : ([] as SeqElem[]);
  for (const el of childElems) {
    const childT = api.infer(el.expr);
    if (isErr(childT)) return childT;
  }
  if (childrenExpr && childrenExpr.kind !== "arr") {
    const childT = api.infer(childrenExpr);
    if (isErr(childT)) return childT;
  }

  const zonkedTag = api.zonk(tagT.value);
  if (zonkedTag.kind === "arrow" && zonkedTag.from.kind === "record") {
    return inferComponentJsxElement(
      zonkedTag as ArrowType & { from: RecordType },
      propsT.value,
      propsExpr,
      childElems,
      api,
    );
  }

  if (tagExpr.kind === "str") {
    return inferIntrinsicJsxElement(tagExpr.value, tagExpr.span, propsExpr, api);
  }

  return ok(tCon("VNode"));
};

// --------------------------------------------------------------- format

type JsxShape = { tag: Expr; props: RecordExpr; children: SeqElem[] };

/** The exact call shape the parser emits — anything else prints as a plain call. */
const jsxShape = (e: Expr): JsxShape | null =>
  e.kind !== "call" ||
  e.origin !== "jsx" ||
  e.fn.kind !== "ref" ||
  e.fn.name !== PRAGMA ||
  e.args.length !== 3 ||
  e.args[1]!.kind !== "record" ||
  e.args[2]!.kind !== "arr"
    ? null
    : { tag: e.args[0]!, props: e.args[1]!, children: e.args[2]!.elements };

const jsxTag = (tag: Expr, api: FormatApi): string =>
  tag.kind === "str" ? tag.value : api.flat(api.memberD(tag));

const jsxAttrD = (name: string, value: Expr, nameStart: number, api: FormatApi): Doc => {
  if (value.kind === "bool" && value.value && value.span.start === nameStart) return txt(name);
  if (value.kind === "str") return txt(`${name}=${api.strLit(value.value)}`);
  return seq(txt(`${name}={`), api.exprD(value), txt("}"));
};

const jsxOpenD = (tag: string, attrs: Doc[], selfClosing: boolean): Doc => {
  if (attrs.length === 0) return txt(selfClosing ? `<${tag} />` : `<${tag}>`);
  return group(
    seq(
      txt(`<${tag}`),
      indent(cat(attrs.map((attr) => seq(line, attr)))),
      selfClosing ? line : softline,
      txt(selfClosing ? "/>" : ">"),
    ),
  );
};

const jsxChildD = (child: SeqElem, api: FormatApi): Doc => {
  if (child.kind === "expr" && jsxShape(child.expr)) return api.exprD(child.expr);
  return seq(txt(child.kind === "spread" ? "{..." : "{"), api.exprD(child.expr), txt("}"));
};

/** Re-fold a parser-produced `h(tag, props, children)` while retaining normal call formatting for source-written `h(...)`. */
const formatJsx: FormatHook = (e: Expr, api: FormatApi): Doc | null => {
  const shape = jsxShape(e);
  if (!shape) return null;
  const fragment = shape.tag.kind === "str" && shape.tag.value === FRAGMENT;
  const tag = fragment ? "" : jsxTag(shape.tag, api);
  const attrs = [
    ...(shape.props.spread ? [seq(txt("{..."), api.exprD(shape.props.spread), txt("}"))] : []),
    ...shape.props.fields.map((field) =>
      jsxAttrD(field.name, field.value, field.nameSpan.start, api),
    ),
  ];

  if (shape.children.length === 0 && !fragment) return jsxOpenD(tag, attrs, true);

  const open = fragment ? txt("<>") : jsxOpenD(tag, attrs, false);
  const close = txt(fragment ? "</>" : `</${tag}>`);
  return group(
    seq(
      open,
      indent(cat(shape.children.map((child) => seq(softline, jsxChildD(child, api))))),
      softline,
      close,
    ),
  );
};

// ------------------------------------------------------------ binding type

/** True when the (folded) type is an arrow whose final return is `VNode` —
 * covers bare records, folded aliases (`Props -> VNode`), and free-var params. */
const isComponentType = (t: Type): boolean => {
  if (t.kind !== "arrow") return false;
  let ret: Type = t.to;
  while (ret.kind === "arrow") ret = ret.to;
  return ret.kind === "con" && ret.name === "VNode";
};

/** Lambda whose body is parser-synthesized JSX (ADR 0011 §5 provenance) — used when the return type hasn't pinned to `VNode` yet. */
const isJsxComponentLambda = (value: Expr): boolean => {
  if (value.kind !== "lambda") return false;
  let body = value.body;
  while (body.kind === "lambda") body = body.body;
  return body.kind === "call" && body.origin === "jsx";
};

const componentPropFieldTs = (label: string, t: Type, api: BindingTypeApi): string => {
  if (t.kind === "var") {
    return /^on[A-Z]/.test(label) ? "() => void" : "unknown";
  }
  if (t.kind === "con" && t.name === "Fn0") return "() => void";
  if (t.kind === "con" && t.name === "VNode") return "unknown";
  return api.tsType(t);
};

const componentPropsTs = (row: Row, api: BindingTypeApi): string => {
  const fields: string[] = [];
  let cur = row;
  let open = false;
  while (cur.kind === "extend") {
    fields.push(`${cur.label}: ${componentPropFieldTs(cur.label, cur.type, api)}`);
    cur = cur.rest;
  }
  if (cur.kind === "rvar") open = true;
  // Open prop rows (typical JSX lambdas): add conventional host extras rather than
  // an index signature (which fights `onX: () => void` under `--strict`).
  if (open) {
    if (!fields.some((f) => f.startsWith("children:"))) fields.push("children?: any");
    if (!fields.some((f) => f.startsWith("className:"))) fields.push("className?: string");
  }
  return fields.length === 0 ? "{}" : `{ ${fields.join("; ")} }`;
};

/**
 * Host-agnostic component signature, for the `.d.ts` writer AND the TS backend
 * (they share `bindingTsType`). Free prop fields → `unknown`, except `onX` event
 * handlers → `() => void`. Return is always `any` (not a host `FC`), and the
 * binding's escaped JSX vars are never quantified (ADR 0010 #17).
 */
const componentBindingTs: BindingTypeHook = (value: Expr, api: BindingTypeApi): string | null => {
  const t = api.folded;
  // A bare `VNode` binding (e.g. `extern none : VNode`) would otherwise leak a
  // dangling `VNode` name into TS output.
  if (t.kind === "con" && t.name === "VNode") return "any";
  if (!isComponentType(t) && !isJsxComponentLambda(value)) return null;
  if (t.kind !== "arrow" || t.from.kind === "var") {
    return "(props: Record<string, unknown>) => any";
  }
  if (t.from.kind === "record") {
    return `(props: ${componentPropsTs(t.from.row, api)}) => any`;
  }
  // Folded alias param (`Props -> VNode`): name the alias — its `export type
  // Props = {…};` decl is co-emitted, and the TS backend's lambda param is
  // typed `Props` too, so anything wider here is a strictFunctionTypes error.
  return `(props: ${api.tsType(t.from)}) => any`;
};

export const jsxPlugin: LanguagePlugin = {
  name: "jsx",
  // Claim: JSX atoms start at `<` (the lexer's generic `lt` token).
  parse: { tokens: ["lt"], hook: parseJsxAtom },
  // No ref/memberTarget claims: the hook keys off `origin: "jsx"` provenance,
  // not a callee name — a hand-written `h(...)` is deliberately not claimed.
  inferCall: { hook: inferJsxCall },
  format: formatJsx,
  bindingType: componentBindingTs,
};
