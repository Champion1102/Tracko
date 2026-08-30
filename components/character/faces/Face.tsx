import type { Mood } from "@/lib/types";

/**
 * One face, shared by every hand-drawn character. Keeping eyes and mouth in a
 * single place is what makes a cloud, a sprout and a flame read as the same
 * cast rather than four unrelated drawings.
 */
export function Face({
  mood,
  cx,
  cy,
  scale = 1,
  mouthOpen = false,
  ink = "#2A2440",
  blush = "#FF9DBB",
  showBlush = true,
}: {
  mood: Mood;
  cx: number;
  cy: number;
  scale?: number;
  mouthOpen?: boolean;
  ink?: string;
  blush?: string;
  showBlush?: boolean;
}) {
  const eyeDx = 13 * scale;
  const eyeR = 6.5 * scale;
  const mouthY = cy + 15 * scale;
  const s = (n: number) => n * scale;

  return (
    <g>
      {/* eyes */}
      {mood === "proud" ? (
        <>
          <path d={`M${cx - eyeDx - s(7)} ${cy} q${s(7)} ${-s(9)} ${s(14)} 0`} stroke={ink} strokeWidth={s(5)} fill="none" strokeLinecap="round" />
          <path d={`M${cx + eyeDx - s(7)} ${cy} q${s(7)} ${-s(9)} ${s(14)} 0`} stroke={ink} strokeWidth={s(5)} fill="none" strokeLinecap="round" />
        </>
      ) : mood === "sleepy" ? (
        <>
          <path d={`M${cx - eyeDx - s(7)} ${cy} q${s(7)} ${s(6)} ${s(14)} 0`} stroke={ink} strokeWidth={s(5)} fill="none" strokeLinecap="round" />
          <path d={`M${cx + eyeDx - s(7)} ${cy} q${s(7)} ${s(6)} ${s(14)} 0`} stroke={ink} strokeWidth={s(5)} fill="none" strokeLinecap="round" />
        </>
      ) : mood === "cheeky" ? (
        <>
          <circle cx={cx - eyeDx} cy={cy} r={eyeR} fill={ink} />
          <circle cx={cx - eyeDx + s(2.5)} cy={cy - s(2.5)} r={s(2.2)} fill="#fff" />
          <path d={`M${cx + eyeDx - s(7)} ${cy + s(1)} q${s(7)} ${-s(7)} ${s(14)} 0`} stroke={ink} strokeWidth={s(5)} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx={cx - eyeDx} cy={cy} rx={eyeR} ry={mood === "hype" ? s(8.5) : s(7)} fill={ink} />
          <ellipse cx={cx + eyeDx} cy={cy} rx={eyeR} ry={mood === "hype" ? s(8.5) : s(7)} fill={ink} />
          <circle cx={cx - eyeDx + s(2.5)} cy={cy - s(2.5)} r={s(2.3)} fill="#fff" />
          <circle cx={cx + eyeDx + s(2.5)} cy={cy - s(2.5)} r={s(2.3)} fill="#fff" />
        </>
      )}

      {/* Worried, not cross: the inner ends of the brows lift. Angling them
          the other way is the universal "angry" face. */}
      {mood === "worried" && (
        <>
          <path d={`M${cx - eyeDx - s(9)} ${cy - s(7)} L${cx - s(2)} ${cy - s(14)}`} stroke={ink} strokeWidth={s(4)} strokeLinecap="round" />
          <path d={`M${cx + eyeDx + s(9)} ${cy - s(7)} L${cx + s(2)} ${cy - s(14)}`} stroke={ink} strokeWidth={s(4)} strokeLinecap="round" />
        </>
      )}

      {/* mouth */}
      {mouthOpen ? (
        <ellipse cx={cx} cy={mouthY} rx={s(8)} ry={s(9)} fill={ink} />
      ) : mood === "hype" ? (
        <ellipse cx={cx} cy={mouthY} rx={s(9)} ry={s(10)} fill={ink} />
      ) : mood === "worried" ? (
        <ellipse cx={cx} cy={mouthY} rx={s(5)} ry={s(4.5)} fill={ink} />
      ) : mood === "cheeky" ? (
        <path d={`M${cx - s(10)} ${mouthY - s(2)} q${s(10)} ${s(9)} ${s(20)} ${-s(2)}`} stroke={ink} strokeWidth={s(4.5)} fill="none" strokeLinecap="round" />
      ) : mood === "sleepy" ? (
        <ellipse cx={cx} cy={mouthY} rx={s(4)} ry={s(5)} fill={ink} />
      ) : (
        <path d={`M${cx - s(12)} ${mouthY - s(3)} q${s(12)} ${s(12)} ${s(24)} 0`} stroke={ink} strokeWidth={s(4.5)} fill="none" strokeLinecap="round" />
      )}

      {showBlush && (
        <>
          <circle cx={cx - s(26)} cy={mouthY - s(3)} r={s(5)} fill={blush} opacity=".55" />
          <circle cx={cx + s(26)} cy={mouthY - s(3)} r={s(5)} fill={blush} opacity=".55" />
        </>
      )}
    </g>
  );
}
