type Props = { size?: number; className?: string };

/**
 * Inline icons for app chrome. Emoji stay for habits — those are meaningful
 * and user-editable — but mixing emoji with unicode glyphs in the nav looked
 * like three different apps stitched together.
 */
const S = ({ size = 20, className = "", children }: Props & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);

export const Icon = {
  today: (p: Props) => (
    <S {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.2l2.4 2.4 4.6-5" />
    </S>
  ),
  journey: (p: Props) => (
    <S {...p}>
      <path d="M4 20c3-1 3-5 6-5s3 4 6 4 3-3 4-4" />
      <circle cx="5" cy="16" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <path d="M18 4l1.4 3 3 1.4-3 1.4L18 13l-1.4-3.2-3-1.4 3-1.4z" />
    </S>
  ),
  trophy: (p: Props) => (
    <S {...p}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M17 5h2.5a2.5 2.5 0 0 1-2.5 4M7 5H4.5A2.5 2.5 0 0 0 7 9" />
      <path d="M12 14v3M9 20h6" />
    </S>
  ),
  chart: (p: Props) => (
    <S {...p}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
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
  rupee: (p: Props) => (
    <S {...p}>
      <path d="M7 4h10M7 9h10M15.5 4c0 4-3 5-6 5l7 11" />
    </S>
  ),
};
