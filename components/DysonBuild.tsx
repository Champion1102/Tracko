"use client";

import { motion } from "motion/react";
import { DYSON_PARTS } from "@/lib/dyson";

type Props = { rewardPct: number; size?: number; showLabels?: boolean };

const ORDER = DYSON_PARTS.map((p) => p.id);

/**
 * The reward, drawn as a kit that assembles itself. Locked pieces stay as
 * dashed ghosts so the shape of what's coming is always visible.
 */
function Piece({
  id,
  rewardPct,
  children,
  ghost,
}: {
  id: string;
  rewardPct: number;
  children: React.ReactNode;
  ghost: React.ReactNode;
}) {
  const on = rewardPct >= (DYSON_PARTS.find((p) => p.id === id)?.at ?? 0);
  const delay = ORDER.indexOf(id) * 0.09;
  return on ? (
    <motion.g
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 220, damping: 16 }}
      style={{ transformOrigin: "120px 170px" }}
    >
      {children}
    </motion.g>
  ) : (
    <g opacity={0.22}>{ghost}</g>
  );
}

export function DysonBuild({ rewardPct, size = 300, showLabels = false }: Props) {
  const ghostStroke = {
    fill: "none",
    stroke: "#A29CC4",
    strokeWidth: 2,
    strokeDasharray: "5 5",
  } as const;

  return (
    <svg
      viewBox="0 0 240 330"
      width={size}
      height={(size * 330) / 240}
      role="img"
      aria-label={`Reward ${Math.round(rewardPct)} percent assembled`}
    >
      <defs>
        <linearGradient id="dy-metal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8E86B8" />
          <stop offset="35%" stopColor="#EFEAFF" />
          <stop offset="65%" stopColor="#B9B1DE" />
          <stop offset="100%" stopColor="#6C648F" />
        </linearGradient>
        <linearGradient id="dy-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C98A16" />
          <stop offset="40%" stopColor="#FFDE8A" />
          <stop offset="70%" stopColor="#FFC24B" />
          <stop offset="100%" stopColor="#9C6A0C" />
        </linearGradient>
        <linearGradient id="dy-case" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A2450" />
          <stop offset="100%" stopColor="#171334" />
        </linearGradient>
      </defs>

      {/* presentation case — the very last unlock */}
      <Piece
        rewardPct={rewardPct}
        id="case"
        ghost={<rect x="10" y="16" width="220" height="300" rx="26" {...ghostStroke} />}
      >
        <rect x="10" y="16" width="220" height="300" rx="26" fill="url(#dy-case)" stroke="#FFC24B" strokeWidth="2.5" />
        <rect x="22" y="28" width="196" height="276" rx="18" fill="none" stroke="#FFC24B" strokeWidth="1" opacity=".35" />
      </Piece>

      {/* main barrel */}
      <Piece
        rewardPct={rewardPct}
        id="barrel"
        ghost={<rect x="105" y="46" width="30" height="120" rx="15" {...ghostStroke} />}
      >
        <rect x="105" y="46" width="30" height="120" rx="15" fill="url(#dy-metal)" />
        <rect x="105" y="52" width="30" height="9" rx="4.5" fill="#FFC24B" opacity=".9" />
        <rect x="113" y="70" width="14" height="80" rx="7" fill="#fff" opacity=".18" />
      </Piece>

      {/* handle */}
      <Piece
        rewardPct={rewardPct}
        id="handle"
        ghost={<rect x="103" y="164" width="34" height="112" rx="17" {...ghostStroke} />}
      >
        <rect x="103" y="164" width="34" height="112" rx="17" fill="url(#dy-gold)" />
        <rect x="112" y="176" width="16" height="76" rx="8" fill="#fff" opacity=".2" />
      </Piece>

      {/* digital motor */}
      <Piece
        rewardPct={rewardPct}
        id="motor"
        ghost={<circle cx="120" cy="212" r="13" {...ghostStroke} />}
      >
        <circle cx="120" cy="212" r="13" fill="#171334" stroke="#FFC24B" strokeWidth="2" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line
            key={a}
            x1="120"
            y1="212"
            x2={120 + 11 * Math.cos((a * Math.PI) / 180)}
            y2={212 + 11 * Math.sin((a * Math.PI) / 180)}
            stroke="#FFC24B"
            strokeWidth="1.6"
            opacity=".8"
          />
        ))}
      </Piece>

      {/* filter cage */}
      <Piece
        rewardPct={rewardPct}
        id="filter"
        ghost={<rect x="102" y="248" width="36" height="30" rx="14" {...ghostStroke} />}
      >
        <rect x="102" y="248" width="36" height="30" rx="14" fill="#2A2450" stroke="#B9B1DE" strokeWidth="2" />
        {[254, 260, 266, 272].map((y) => (
          <line key={y} x1="105" y1={y} x2="135" y2={y} stroke="#B9B1DE" strokeWidth="1.4" opacity=".7" />
        ))}
      </Piece>

      {/* cable */}
      <Piece
        rewardPct={rewardPct}
        id="cable"
        ghost={<path d="M120 278 q0 28 -34 34" {...ghostStroke} />}
      >
        <path d="M120 278 q0 28 -34 34" fill="none" stroke="#6C648F" strokeWidth="5" strokeLinecap="round" />
      </Piece>

      {/* smoothing brush */}
      <Piece
        rewardPct={rewardPct}
        id="smooth"
        ghost={<rect x="44" y="76" width="24" height="92" rx="12" {...ghostStroke} />}
      >
        <rect x="44" y="76" width="24" height="92" rx="12" fill="url(#dy-metal)" />
        <rect x="44" y="76" width="24" height="34" rx="12" fill="#FFC24B" opacity=".85" />
      </Piece>

      {/* volumising round brush */}
      <Piece
        rewardPct={rewardPct}
        id="round"
        ghost={<rect x="42" y="188" width="28" height="88" rx="14" {...ghostStroke} />}
      >
        <rect x="42" y="188" width="28" height="88" rx="14" fill="#2A2450" stroke="#B9B1DE" strokeWidth="2" />
        {[196, 208, 220, 232, 244, 256].map((y) => (
          <g key={y}>
            <line x1="38" y1={y} x2="46" y2={y} stroke="#B9B1DE" strokeWidth="2" strokeLinecap="round" />
            <line x1="66" y1={y} x2="74" y2={y} stroke="#B9B1DE" strokeWidth="2" strokeLinecap="round" />
          </g>
        ))}
      </Piece>

      {/* curling barrels */}
      <Piece
        rewardPct={rewardPct}
        id="curl"
        ghost={
          <>
            <rect x="168" y="86" width="20" height="84" rx="10" {...ghostStroke} />
            <rect x="196" y="104" width="20" height="66" rx="10" {...ghostStroke} />
          </>
        }
      >
        <rect x="168" y="86" width="20" height="84" rx="10" fill="url(#dy-metal)" />
        <rect x="168" y="86" width="20" height="26" rx="10" fill="#FFC24B" opacity=".85" />
        <rect x="196" y="104" width="20" height="66" rx="10" fill="url(#dy-metal)" />
        <rect x="196" y="104" width="20" height="22" rx="10" fill="#FFC24B" opacity=".85" />
      </Piece>

      {showLabels && (
        <text x="120" y="322" textAnchor="middle" fill="#A29CC4" fontSize="12" fontWeight="700">
          {Math.round(rewardPct)}% assembled
        </text>
      )}
    </svg>
  );
}
