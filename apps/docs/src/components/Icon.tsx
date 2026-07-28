import {
  AlignLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Code,
  Code2,
  ExternalLink,
  FileCode,
  Loader2,
  Monitor,
  Moon,
  PanelRight,
  Pause,
  Play,
  RefreshCw,
  Settings2,
  Share2,
  Sun,
} from "lucide-preact";
import type { JSX } from "preact";

type GithubMarkProps = {
  className?: string;
  strokeWidth?: number;
};

/** Lucide dropped brand marks — keep a tiny local GitHub glyph. */
function GithubMark({ className, strokeWidth: _strokeWidth }: GithubMarkProps): JSX.Element {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.28-.01-1.02-.02-2-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3.01.4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  );
}

const ICONS = {
  play: Play,
  "share-2": Share2,
  check: Check,
  "align-left": AlignLeft,
  "refresh-cw": RefreshCw,
  pause: Pause,
  github: GithubMark,
  "external-link": ExternalLink,
  "code-2": Code2,
  code: Code,
  "panel-right": PanelRight,
  "circle-alert": CircleAlert,
  "settings-2": Settings2,
  "file-code": FileCode,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "loader-2": Loader2,
  sun: Sun,
  moon: Moon,
  monitor: Monitor,
} as const;

export type IconName = keyof typeof ICONS;

export type IconProps = {
  name: IconName;
  className?: string;
  strokeWidth?: number;
};

/** Shared Lucide host widget for mochi + TSX chrome. */
export function Icon({ name, className = "size-3.5", strokeWidth = 2.25 }: IconProps): JSX.Element {
  const Cmp = ICONS[name];
  return <Cmp aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
}
