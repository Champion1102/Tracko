export type HabitKind = "binary" | "counter" | "duration" | "checklist" | "sleep";
export type Cadence = "daily" | "weekly";

export type Habit = {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  emoji: string;
  /** Key into HABIT_ICONS. Falls back to `emoji` when unset. */
  icon?: string;
  kind: HabitKind;
  cadence: Cadence;
  /** Daily habits: points toward the /100 day. Weekly: points per unit, capped at target. */
  points: number;
  /** counter/duration target, or weekly units required */
  target: number;
  unit: string;
  subItems?: string[];
  sortOrder: number;
  active: boolean;
};

export type Entry = {
  habitId: string;
  day: string; // YYYY-MM-DD
  value: number;
  subDone: boolean[];
  /** Sleep habits only: "HH:MM" clock times she actually hit. */
  bedtime?: string;
  wakeTime?: string;
  note?: string;
  updatedAt: string;
};

export type Photo = {
  id: string;
  day: string;
  /** Storage object key (Supabase) or filename under .data/uploads (local). */
  path: string;
  createdAt: string;
};

/**
 * Her verdict on a spend, decided by her at the moment she logs it. The whole
 * point of the tracker is the second column — knowing where it went is easy,
 * knowing whether it was worth it is the part that changes behaviour.
 */
export type SpendVerdict = "worth" | "meh" | "regret";

export type Expense = {
  id: string;
  /** YYYY-MM-DD, same day-key convention as entries and photos. */
  day: string;
  /** Minor-unit-free: whole rupees, matching how `money()` renders. */
  amount: number;
  categoryId: string;
  verdict: SpendVerdict;
  note?: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  who: "her" | "nimbus";
  body: string;
  createdAt: string;
};

export type Letter = {
  id: string;
  unlockDay: number;
  title: string;
  body: string;
  openedAt: string | null;
};

export type Nudge = {
  id: string;
  /** Who wrote it. Anything not from you counts as unread for you. */
  from: Role;
  body: string;
  /** Storage path of an attached photo, if any. */
  image?: string | null;
  sentAt: string;
  readAt: string | null;
};

export type Celebration = {
  key: string;
  kind:
    | "perfect_day"
    | "streak"
    | "reward_milestone"
    | "habit_streak"
    | "week_bonus"
    | "letter";
  title: string;
  body: string;
  meta: Record<string, unknown>;
  seen: boolean;
  createdAt: string;
};

export type PushSub = {
  role: Role;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type Config = {
  startDate: string; // YYYY-MM-DD
  totalDays: number;
  rewardName: string;
  rewardTargetPct: number;
  /** What the reward actually costs. Drives the rupee counter. */
  rewardPrice: number;
  currency: string;
  /** Public path to a real photo of the reward, e.g. "/reward.png". Falls back
      to the drawn illustration when empty. */
  rewardImage: string;
  timezone: string;
  heroName: string;
  sponsorName: string;
  freezesTotal: number;
  /** Optional daily photo proof: bonus points each, capped per day. */
  photoBonusPoints: number;
  photoMaxPerDay: number;
  /** Bonus points for a week where every single day was perfect. */
  perfectWeekBonus: number;

  /** Sleep targets, used to score the sleep habit. */
  idealBedtime: string;
  idealWakeTime: string;
  sleepTargetHours: number;
  sleepToleranceMin: number;

  /** Her birthday, "YYYY-MM-DD" or "" — drives the birthday takeover. */
  heroBirthday: string;

  /** The pledge she reads and signs on day one. Sponsor-editable. */
  promiseText: string;
  /** PNG data URL of her actual signature, drawn with a finger. */
  promiseSignature: string;
  promiseAcceptedAt: string | null;
  /** Set when she finishes onboarding; until then she's sent to /welcome. */
  onboardedAt: string | null;

  /**
   * Per-role login PIN, salted + hashed (scrypt). Unset means that role is
   * still on the bootstrap PIN from the environment — first login prompts them
   * to set their own, which lands here and the env var is ignored thereafter.
   * A hash, never the PIN itself, is stored: leaking the config leaks nothing.
   */
  heroPinHash: string | null;
  sponsorPinHash: string | null;

  /**
   * Optional deduction when a day closes badly. Off by default; see the note
   * in scoring.ts on why this is a sharp tool.
   */
  penaltyEnabled: boolean;
  penaltyPoints: number;
  penaltyBelowPct: number;
  freezeDays: string[]; // days consumed by a freeze
  reminderMorning: string; // "07:30"
  reminderEvening: string; // "20:30"
  remindersOn: boolean;
  /** slot -> the YYYY-MM-DD it last fired, so a slot never sends twice. */
  notifyLog: Record<string, string>;
};

export type Situation =
  | "morning"
  | "evening"
  | "habit_done"
  | "almost"
  | "perfect_day"
  | "streak"
  | "behind"
  | "comeback"
  | "reward";

export type CoachLine = {
  situation: Situation;
  text: string;
  mood: "happy" | "hype" | "proud" | "worried" | "sleepy" | "cheeky";
};

/** One day's worth of generated lines, written once by the cron job. */
export type CoachPack = {
  day: string;
  lines: CoachLine[];
  createdAt: string;
  /** Which provider actually answered, for the settings readout. */
  provider?: string;
};

export type Role = "hero" | "sponsor";

export type DB = {
  config: Config;
  habits: Habit[];
  entries: Entry[];
  letters: Letter[];
  nudges: Nudge[];
  celebrations: Celebration[];
  pushSubs: PushSub[];
  coach: CoachPack | null;
  photos: Photo[];
  chat: ChatMessage[];
  expenses: Expense[];
};
