import type { SVGProps } from 'react';

export type IconName =
  | 'plus'
  | 'minus'
  | 'trash'
  | 'search'
  | 'copy'
  | 'pencil'
  | 'close'
  | 'chevron-down'
  | 'chevron-right'
  | 'arrow-left'
  | 'crown'
  | 'library'
  | 'settings'
  | 'download'
  | 'upload'
  | 'menu'
  | 'check'
  | 'warning'
  | 'grid'
  | 'list'
  | 'rows'
  | 'sun'
  | 'moon'
  | 'filter'
  | 'cards'
  | 'more'
  | 'chart'
  | 'refresh'
  | 'info';

const PATHS: Record<IconName, JSX.Element> = {
  plus: <path d="M10 4v12M4 10h12" />,
  minus: <path d="M4 10h12" />,
  trash: (
    <>
      <path d="M3 5h14M8 5V3.5A1.5 1.5 0 019.5 2h1A1.5 1.5 0 0112 3.5V5" />
      <path d="M5 5l1 11a1 1 0 001 1h6a1 1 0 001-1l1-11M8.5 8.5v5M11.5 8.5v5" />
    </>
  ),
  search: (
    <>
      <circle cx="9" cy="9" r="5.5" />
      <path d="M13.5 13.5L17 17" />
    </>
  ),
  copy: (
    <>
      <rect x="7" y="7" width="9" height="9" rx="1.5" />
      <path d="M13 7V5.5A1.5 1.5 0 0011.5 4h-6A1.5 1.5 0 004 5.5v6A1.5 1.5 0 005.5 13H7" />
    </>
  ),
  pencil: (
    <>
      <path d="M13.5 4.5l2 2L7 15l-3 1 1-3 8.5-8.5z" />
      <path d="M12 6l2 2" />
    </>
  ),
  close: <path d="M5 5l10 10M15 5L5 15" />,
  'chevron-down': <path d="M5 8l5 5 5-5" />,
  'chevron-right': <path d="M8 5l5 5-5 5" />,
  'arrow-left': <path d="M16 10H4M9 5l-5 5 5 5" />,
  crown: (
    <>
      <path d="M3 7l3 4 4-6 4 6 3-4-1.5 9h-11L3 7z" />
      <path d="M4.5 16h11" />
    </>
  ),
  library: (
    <>
      <rect x="3" y="3" width="5" height="14" rx="1" />
      <rect x="10" y="3" width="3" height="14" rx="1" />
      <path d="M14.5 4l2.2 12.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4" />
    </>
  ),
  download: (
    <>
      <path d="M10 3v9M6 8.5l4 4 4-4" />
      <path d="M4 16h12" />
    </>
  ),
  upload: (
    <>
      <path d="M10 13V4M6 7.5l4-4 4 4" />
      <path d="M4 16h12" />
    </>
  ),
  menu: <path d="M3 5h14M3 10h14M3 15h14" />,
  check: <path d="M4 10.5l4 4 8-9" />,
  warning: (
    <>
      <path d="M10 3l8 14H2L10 3z" />
      <path d="M10 8v4M10 14.5v.5" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </>
  ),
  list: <path d="M6 5h11M6 10h11M6 15h11M3 5h.01M3 10h.01M3 15h.01" />,
  rows: (
    <>
      <rect x="3" y="4" width="14" height="5" rx="1" />
      <rect x="3" y="11" width="14" height="5" rx="1" />
    </>
  ),
  sun: (
    <>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4" />
    </>
  ),
  moon: <path d="M16 11.5A6.5 6.5 0 018.5 4a6.5 6.5 0 100 12 6.5 6.5 0 007.5-4.5z" />,
  filter: <path d="M3 5h14l-5 6v4l-4 2v-6L3 5z" />,
  cards: (
    <>
      <rect x="6" y="3.5" width="9" height="12" rx="1.5" transform="rotate(8 10 9)" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v14h14" />
      <path d="M6.5 14v-3M10 14V7M13.5 14v-5" />
    </>
  ),
  refresh: (
    <>
      <path d="M16 6.5A6.5 6.5 0 104 8" />
      <path d="M16 3v4h-4" />
    </>
  ),
  info: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9v4.5M10 6.5v.5" />
    </>
  ),
  more: (
    <>
      <circle cx="10" cy="4.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
