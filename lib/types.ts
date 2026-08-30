export type HabitKind = "binary" | "counter" | "checklist";

/** Optional extra a habit row offers next to the tick. Never required to tick.
 *  "hours" ticks with a number — sleep logs how long, not just whether. */
export type Proof = "photo" | "link" | "hours";

export type Habit = {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  emoji: string;
  /** Key into HABIT_ICONS. Falls back to `emoji` when unset. */
  icon?: string;
  kind: HabitKind;
  /** counter: taps to complete · checklist: number of sub-items · binary: 1 */
  target: number;
  unit: string;
  subItems?: string[];
  proof?: Proof;
  sortOrder: number;
  active: boolean;
};

export type Entry = {
  habitId: string;
  day: string; // YYYY-MM-DD
  value: number;
  subDone: boolean[];
  /** Link-proof habits keep the pasted URL here. */
  note?: string;
  updatedAt: string;
};

export type Photo = {
  id: string;
  day: string;
  /** Storage object key (Supabase) or filename under .data/uploads (local). */
  path: string;
  /** The habit it was added from, when it was. */
  habitId?: string;
  createdAt: string;
};

export type JournalMood = 1 | 2 | 3 | 4 | 5;

/** One entry per day. Hers only — never shown to the sponsor, never sent to Nimbus. */
export type JournalEntry = {
  day: string;
  body: string;
  mood: JournalMood | null;
  createdAt: string;
  updatedAt: string;
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
  kind: "perfect_day" | "streak" | "letter";
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
  /** Symbol for her money tracker. */
  currency: string;
  timezone: string;
  heroName: string;
  sponsorName: string;

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

  reminderMorning: string; // "07:30"
  reminderEvening: string; // "20:30"
  remindersOn: boolean;
  /** slot -> the YYYY-MM-DD it last fired, so a slot never sends twice. */
  notifyLog: Record<string, string>;
};

export type Mood = "happy" | "hype" | "proud" | "worried" | "sleepy" | "cheeky";

/** The two push reminders are the only readers of the daily coach pack now. */
export type Situation = "morning" | "evening";

export type CoachLine = {
  situation: Situation;
  text: string;
  mood: Mood;
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
  journal: JournalEntry[];
};
