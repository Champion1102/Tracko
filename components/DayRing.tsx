import { Icon } from "./Icon";
import type { DayStatus } from "@/lib/scoring";

/**
 * One day as a ring: the arc is how much of the day got done, a solid green
 * disc is every habit ticked. Used at three sizes — the Today header, the
 * week strip, and the month grid — so they all read the same way.
 */
export function DayRing({
  pct,
  status,
  size = 32,
  stroke = 3,
  today = false,
  selected = false,
  children,
  className = "",
}: {
  pct: number;
  status: DayStatus;
  size?: number;
  stroke?: number;
  today?: boolean;
  selected?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const perfect = status === "perfect";
  const future = status === "future";

  const outline = selected
    ? "outline outline-2 outline-offset-2 outline-text"
    : today
      ? "outline outline-2 outline-offset-2 outline-line"
      : "";

  return (
    <span
      className={`relative grid shrink-0 place-items-center rounded-full ${outline} ${className}`}
      style={{ width: size, height: size }}
    >
      {perfect ? (
        <span className="grid h-full w-full place-items-center rounded-full bg-grass text-white">
          {children ?? <Icon.check size={Math.round(size * 0.52)} strokeWidth={3} />}
        </span>
      ) : (
        <>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth={stroke}
              strokeDasharray={future ? `${stroke * 0.9} ${stroke * 1.7}` : undefined}
              strokeLinecap="round"
              opacity={future ? 0.7 : 1}
            />
            {clamped > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="var(--color-grass)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c - (clamped / 100) * c}
              />
            )}
          </svg>
          {children && <span className="absolute inset-0 grid place-items-center">{children}</span>}
        </>
      )}
    </span>
  );
}
