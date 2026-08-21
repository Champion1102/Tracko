type Props = { size?: number; className?: string };

const S = ({ size = 22, className = "", children }: Props & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);

/** Drawn icons for habits. Custom habits fall back to an emoji. */
export const HABIT_ICONS = {
  sugar: (p: Props) => (
    <S {...p}>
      <rect x="5.5" y="8" width="13" height="10.5" rx="2.4" />
      <path d="M5.5 11.6h13" />
      <path d="M4 20.5L20 3.5" />
    </S>
  ),
  code: (p: Props) => (
    <S {...p}>
      <path d="M8.5 8L4 12l4.5 4M15.5 8L20 12l-4.5 4" />
      <path d="M13.4 5.5l-2.8 13" />
    </S>
  ),
  leaf: (p: Props) => (
    <S {...p}>
      <path d="M5 20s-1.6-9.2 5.5-13c4-2.1 9-1.6 9-1.6s.6 5.4-2 9.4C13.3 21.6 5 20 5 20z" />
      <path d="M5.5 20c2.2-5.2 5.3-8.4 9.4-10.4" />
    </S>
  ),
  droplet: (p: Props) => (
    <S {...p}>
      <path d="M12 3.2s6.2 6.6 6.2 10.6a6.2 6.2 0 0 1-12.4 0C5.8 9.8 12 3.2 12 3.2z" />
      <path d="M9.2 14.4a2.9 2.9 0 0 0 2.4 2.8" />
    </S>
  ),
  lotus: (p: Props) => (
    <S {...p}>
      <circle cx="12" cy="5.6" r="2.3" />
      <path d="M12 8.4v4.2" />
      <path d="M5.6 19.2c0-2.2 2.9-3.7 6.4-3.7s6.4 1.5 6.4 3.7" />
      <path d="M12 12.2L7.8 15.4M12 12.2l4.2 3.2" />
    </S>
  ),
  sparkle: (p: Props) => (
    <S {...p}>
      <path d="M10.5 3.2l1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1L3.5 10.2l5.1-1.9z" />
      <path d="M18.4 15.2l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z" />
    </S>
  ),
  cup: (p: Props) => (
    <S {...p}>
      <path d="M6.8 4.5h10.4l-1.3 14a2 2 0 0 1-2 1.8h-3.8a2 2 0 0 1-2-1.8z" />
      <path d="M7.5 10.8h9" />
    </S>
  ),
  moon: (p: Props) => (
    <S {...p}>
      <path d="M20.2 14.8A8.6 8.6 0 0 1 9.2 3.8a8.6 8.6 0 1 0 11 11z" />
    </S>
  ),
  dumbbell: (p: Props) => (
    <S {...p}>
      <path d="M3.5 9.2v5.6M6.8 6.8v10.4M17.2 6.8v10.4M20.5 9.2v5.6" />
      <path d="M6.8 12h10.4" />
    </S>
  ),
  megaphone: (p: Props) => (
    <S {...p}>
      <path d="M3.5 10v4a1.2 1.2 0 0 0 1.2 1.2h3L14 19V5L7.7 8.8h-3A1.2 1.2 0 0 0 3.5 10z" />
      <path d="M17.4 8.8a4.6 4.6 0 0 1 0 6.4" />
      <path d="M7.7 15.2V19a1.6 1.6 0 0 0 3.1.4" />
    </S>
  ),
  check: (p: Props) => (
    <S {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M8.4 12.3l2.5 2.5 4.7-5.1" />
    </S>
  ),
} as const;

export type HabitIconKey = keyof typeof HABIT_ICONS;
export const HABIT_ICON_KEYS = Object.keys(HABIT_ICONS) as HabitIconKey[];

export function HabitIcon({
  icon,
  emoji,
  size = 22,
  className = "",
}: {
  icon?: string;
  emoji?: string;
  size?: number;
  className?: string;
}) {
  const Glyph = icon ? HABIT_ICONS[icon as HabitIconKey] : undefined;
  if (Glyph) return <Glyph size={size} className={className} />;
  return (
    <span className={className} style={{ fontSize: size * 0.86, lineHeight: 1 }}>
      {emoji || "✅"}
    </span>
  );
}
