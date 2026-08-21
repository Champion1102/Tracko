import type { Mood } from "@/lib/mascot";
import { Face } from "./Face";

export type BodyProps = { mood: Mood; mouthOpen?: boolean; id: string };

const TINT: Record<Mood, string> = {
  happy: "#BFE9FF",
  hype: "#FFE39A",
  proud: "#C9FFB0",
  worried: "#FFC9D6",
  sleepy: "#D6CCFF",
  cheeky: "#FFD9F0",
};

/* ------------------------------------------------------------------ Nimbus */

export function NimbusBody({ mood, mouthOpen, id }: BodyProps) {
  const tint = TINT[mood];
  return (
    <>
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%">
          <stop offset="0%" stopColor={tint} stopOpacity="0.5" />
          <stop offset="100%" stopColor={tint} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={tint} />
        </linearGradient>
      </defs>

      <ellipse cx="65" cy="56" rx="62" ry="48" fill={`url(#${id}-glow)`} />

      {mood === "hype" ? (
        <>
          <path d="M20 52 L6 30" stroke="#E6F2FF" strokeWidth="7" strokeLinecap="round" />
          <path d="M110 52 L124 30" stroke="#E6F2FF" strokeWidth="7" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M20 62 q-12 6 -13 16" stroke="#E6F2FF" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M110 62 q12 6 13 16" stroke="#E6F2FF" strokeWidth="7" strokeLinecap="round" fill="none" />
        </>
      )}

      <g fill={`url(#${id}-body)`}>
        <circle cx="40" cy="54" r="25" />
        <circle cx="70" cy="44" r="31" />
        <circle cx="97" cy="59" r="21" />
        <rect x="22" y="54" width="86" height="28" rx="14" />
      </g>

      <Face mood={mood} cx={70} cy={50} mouthOpen={mouthOpen} />

      {mood === "sleepy" && <text x="104" y="26" fill="#D6CCFF" fontSize="15" fontWeight="800">z</text>}
      {mood === "hype" && (
        <>
          <path d="M14 16 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#FFC24B" />
          <path d="M116 12 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#FFC24B" />
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ Sprout */

export function SproutBody({ mood, mouthOpen, id }: BodyProps) {
  const perky = mood === "hype" || mood === "proud";
  const droop = mood === "sleepy" || mood === "worried";
  const lift = droop ? 6 : perky ? -3 : 0;

  return (
    <>
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="45%">
          <stop offset="0%" stopColor="#A8F26B" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#A8F26B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-bud`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C6F79B" />
          <stop offset="100%" stopColor="#6FCB4A" />
        </linearGradient>
        <linearGradient id={`${id}-pot`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D98C5F" />
          <stop offset="100%" stopColor="#A85C34" />
        </linearGradient>
      </defs>

      <ellipse cx="65" cy="48" rx="58" ry="44" fill={`url(#${id}-glow)`} />

      {/* stem */}
      <path d={`M65 ${60 + lift} L65 76`} stroke="#4FA236" strokeWidth="6" strokeLinecap="round" />

      {/* leaves */}
      <g fill="#5FBF41">
        <ellipse cx="38" cy={62 + lift} rx="17" ry="9" transform={`rotate(${droop ? 18 : -18} 38 ${62 + lift})`} />
        <ellipse cx="92" cy={62 + lift} rx="17" ry="9" transform={`rotate(${droop ? -18 : 18} 92 ${62 + lift})`} />
      </g>
      <g stroke="#3E8C2B" strokeWidth="1.6" opacity=".6" fill="none">
        <path d={`M26 ${62 + lift} h22`} transform={`rotate(${droop ? 18 : -18} 38 ${62 + lift})`} />
        <path d={`M82 ${62 + lift} h22`} transform={`rotate(${droop ? -18 : 18} 92 ${62 + lift})`} />
      </g>

      {/* bud head */}
      <circle cx="65" cy={36 + lift} r="25" fill={`url(#${id}-bud)`} />
      <path d={`M65 ${11 + lift} q7 -8 3 -11 q-3 4 -3 11z`} fill="#6FCB4A" />

      <Face mood={mood} cx={65} cy={34 + lift} scale={0.86} mouthOpen={mouthOpen} blush="#FF8FA8" />

      {/* pot */}
      <rect x="42" y="74" width="46" height="9" rx="4.5" fill={`url(#${id}-pot)`} />
      <path d="M46 84 h38 l-4.5 20 a3 3 0 0 1 -3 2 h-23 a3 3 0 0 1 -3 -2 z" fill={`url(#${id}-pot)`} />

      {mood === "hype" && (
        <>
          <path d="M16 20 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z" fill="#8FE05C" />
          <path d="M114 16 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#8FE05C" />
        </>
      )}
      {mood === "sleepy" && <text x="100" y="24" fill="#B9E8A0" fontSize="15" fontWeight="800">z</text>}
    </>
  );
}

/* ------------------------------------------------------------------- Ember */

export function EmberBody({ mood, mouthOpen, id }: BodyProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="55%">
          <stop offset="0%" stopColor="#FF9152" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#FF9152" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-flame`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD98A" />
          <stop offset="45%" stopColor="#FFA24B" />
          <stop offset="100%" stopColor="#F2662B" />
        </linearGradient>
        <linearGradient id={`${id}-core`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF3C4" />
          <stop offset="100%" stopColor="#FFC24B" />
        </linearGradient>
      </defs>

      <ellipse cx="65" cy="60" rx="56" ry="46" fill={`url(#${id}-glow)`} />

      {/* outer flame */}
      <path
        d="M65 4 C 80 24, 98 36, 98 60 a33 33 0 0 1 -66 0 C 32 38, 50 26, 65 4 z"
        fill={`url(#${id}-flame)`}
      />
      {/* inner core */}
      <path
        d="M65 32 C 73 44, 82 50, 82 63 a17 17 0 0 1 -34 0 C 48 51, 57 44, 65 32 z"
        fill={`url(#${id}-core)`}
        opacity=".55"
      />

      <Face mood={mood} cx={65} cy={58} scale={0.9} mouthOpen={mouthOpen} ink="#5A2408" blush="#FF6B6B" />

      {mood === "hype" && (
        <>
          <circle cx="20" cy="34" r="4" fill="#FFC24B" />
          <circle cx="110" cy="28" r="3.5" fill="#FFC24B" />
          <circle cx="102" cy="80" r="3" fill="#FFC24B" />
        </>
      )}
    </>
  );
}

/* -------------------------------------------------------------------- Luna */

export function LunaBody({ mood, mouthOpen, id }: BodyProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-glow`} cx="45%" cy="50%">
          <stop offset="0%" stopColor="#D6CCFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#D6CCFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-moon`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF6D8" />
          <stop offset="100%" stopColor="#E4CE95" />
        </linearGradient>
        <mask id={`${id}-crescent`}>
          <rect width="130" height="108" fill="black" />
          <circle cx="62" cy="54" r="40" fill="white" />
          <circle cx="92" cy="40" r="34" fill="black" />
        </mask>
      </defs>

      <ellipse cx="58" cy="54" rx="58" ry="46" fill={`url(#${id}-glow)`} />

      <g mask={`url(#${id}-crescent)`}>
        <circle cx="62" cy="54" r="40" fill={`url(#${id}-moon)`} />
      </g>

      {/* craters, kept clear of the face */}
      <g fill="#D8BE83" opacity=".45">
        <circle cx="30" cy="30" r="4.5" />
        <circle cx="24" cy="62" r="3" />
        <circle cx="44" cy="88" r="3.5" />
      </g>

      <Face mood={mood} cx={54} cy={50} scale={0.82} mouthOpen={mouthOpen} ink="#4A3A6B" blush="#E8A0C0" />

      {/* stars */}
      <g fill="#FFE7A8">
        <path d="M108 22 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z" />
        <circle cx="118" cy="58" r="2.6" />
        <circle cx="100" cy="82" r="2" />
      </g>
      {mood === "sleepy" && <text x="96" y="100" fill="#D6CCFF" fontSize="14" fontWeight="800">z</text>}
    </>
  );
}
