import type { DayScore, Totals } from "./scoring";
import type { Config } from "./types";

export type Mood = "happy" | "hype" | "proud" | "worried" | "sleepy" | "cheeky";
export type Line = { text: string; mood: Mood };

const IDLE: Line[] = [
  { text: "Small things, every day. That's the whole trick.", mood: "happy" },
  { text: "Nobody's watching. Do it anyway.", mood: "cheeky" },
  { text: "Future you is already thanking you.", mood: "happy" },
  { text: "Ten boxes. That's it. That's the day.", mood: "happy" },
  { text: "You don't have to feel like it. You just have to do it.", mood: "proud" },
  { text: "Momentum is a real thing and you have some.", mood: "hype" },
  { text: "The boring days are the ones that count.", mood: "happy" },
];

export function mascotLine(
  config: Config,
  today: DayScore,
  totals: Totals,
  hour: number,
  name: string,
): Line {
  const left = today.perHabit.filter((p) => !p.done);
  const first = name ? `${name}, ` : "";

  if (totals.unlocked) {
    return {
      text: `It's done. The ${config.rewardName} is yours. Go and collect it. 🏆`,
      mood: "proud",
    };
  }

  if (today.status === "perfect") {
    return {
      text:
        totals.currentStreak >= 7
          ? `Perfect day, and ${totals.currentStreak} in a row. You're not messing about.`
          : "Perfect day. Every single box. Go rest.",
      mood: "proud",
    };
  }

  if (left.length === 1) {
    return {
      text: `${first}one left — ${left[0].habit.emoji} ${left[0].habit.name}. Don't you dare stop here.`,
      mood: "hype",
    };
  }

  if (left.length === 2 && hour >= 18) {
    return { text: "Two to go and the evening's still young.", mood: "hype" };
  }

  if (hour >= 21 && left.length >= 4) {
    return {
      text: `${left.length} boxes still open and it's getting late. Grab the easy ones — water, skincare.`,
      mood: "worried",
    };
  }

  if (totals.currentStreak === 0 && totals.daysElapsed > 3) {
    return {
      text: "Streak's at zero. One clean day and it starts again — that's all it takes.",
      mood: "worried",
    };
  }

  if (totals.currentStreak >= 30) {
    return { text: `${totals.currentStreak} days. This isn't a challenge any more, it's just your life.`, mood: "proud" };
  }

  if (totals.currentStreak >= 7) {
    return { text: `${totals.currentStreak}-day streak burning. Protect it.`, mood: "hype" };
  }

  if (totals.daysElapsed === 1) {
    return { text: `Day one. ${config.rewardName} is 90 days away. Let's go.`, mood: "hype" };
  }

  if (!totals.onTrack && totals.daysElapsed > 7) {
    return {
      text: `You need ${Math.ceil(totals.requiredPace)} points a day from here. Very doable — but not by accident.`,
      mood: "worried",
    };
  }

  if (hour < 10) {
    return { text: "Morning. Water and skincare are free points, start there.", mood: "sleepy" };
  }

  return IDLE[totals.daysElapsed % IDLE.length];
}
