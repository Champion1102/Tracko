type Props = { size?: number; className?: string; strokeWidth?: number };

/**
 * Inline icons for app chrome. Emoji stay for habits — those are meaningful
 * and user-editable — but mixing emoji with unicode glyphs in the nav looked
 * like three different apps stitched together.
 */
const S = ({
  size = 20,
  className = "",
  strokeWidth = 2.2,
  children,
}: Props & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);

export const Icon = {
  home: (p: Props) => (
    <S {...p}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </S>
  ),
  gear: (p: Props) => (
    <S {...p}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
    </S>
  ),
  today: (p: Props) => (
    <S {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.2l2.4 2.4 4.6-5" />
    </S>
  ),
  chart: (p: Props) => (
    <S {...p}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </S>
  ),
  book: (p: Props) => (
    <S {...p}>
      <path d="M5 4.5h11.5a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2z" />
      <path d="M5 17.5a2 2 0 0 1 2-2h11.5" />
      <path d="M9 9h5.5" />
    </S>
  ),
  person: (p: Props) => (
    <S {...p}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20c0-3.4 3.2-5.6 7.2-5.6s7.2 2.2 7.2 5.6" />
    </S>
  ),
  flame: (p: Props) => (
    <S {...p}>
      <path d="M12 2.5c3.5 4 5.5 6.4 5.5 9.6a5.5 5.5 0 0 1-11 0c0-1.6.6-2.9 1.6-4.2.4 1.3 1.2 2 2.2 2.2-.4-3 .7-5.4 1.7-7.6z" />
    </S>
  ),
  calendar: (p: Props) => (
    <S {...p}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </S>
  ),
  mail: (p: Props) => (
    <S {...p}>
      <rect x="2.5" y="5" width="19" height="14" rx="3" />
      <path d="M3.5 7.5l8.5 6 8.5-6" />
    </S>
  ),
  chat: (p: Props) => (
    <S {...p}>
      <path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1-4.6A8.5 8.5 0 1 1 20.5 12z" />
      <path d="M8.6 11.8h.01M12 11.8h.01M15.4 11.8h.01" />
    </S>
  ),
  wallet: (p: Props) => (
    // Two strokes only — anything more turns to mush at the 16px it renders at
    // in the drawer.
    <S {...p}>
      <rect x="2.5" y="6" width="19" height="12" rx="2.6" />
      <path d="M2.5 10.2h19" />
    </S>
  ),
  photos: (p: Props) => (
    <S {...p}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <circle cx="8.6" cy="10" r="1.6" />
      <path d="M3.6 16.5l4.2-3.8a2 2 0 0 1 2.7 0l3.1 2.9M13.2 15.1l2.2-2a2 2 0 0 1 2.7 0l2.3 2.1" />
    </S>
  ),
  camera: (p: Props) => (
    <S {...p}>
      <path d="M4 8.5a2 2 0 0 1 2-2h2.2l1.3-2h5l1.3 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.2" />
    </S>
  ),
  link: (p: Props) => (
    <S {...p}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2" />
    </S>
  ),
  external: (p: Props) => (
    <S {...p}>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M19 13.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5.5" />
    </S>
  ),
  clock: (p: Props) => (
    <S {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4V12l3 2" />
    </S>
  ),
  check: (p: Props) => (
    <S {...p}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </S>
  ),
  plus: (p: Props) => (
    <S {...p}>
      <path d="M12 5v14M5 12h14" />
    </S>
  ),
  close: (p: Props) => (
    <S {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </S>
  ),
  chevronLeft: (p: Props) => (
    <S {...p}>
      <path d="M15 5l-7 7 7 7" />
    </S>
  ),
  chevronRight: (p: Props) => (
    <S {...p}>
      <path d="M9 5l7 7-7 7" />
    </S>
  ),
};
