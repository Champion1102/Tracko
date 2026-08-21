import type {
  Celebration,
  ChatMessage,
  CoachPack,
  Config,
  DB,
  Entry,
  Expense,
  Habit,
  Letter,
  Nudge,
  Photo,
  PushSub,
  Role,
} from "../types";

export type ExpensePatch = Partial<Pick<Expense, "amount" | "categoryId" | "verdict" | "note">>;

export interface Store {
  read(): Promise<DB>;
  patchConfig(patch: Partial<Config>): Promise<Config>;
  upsertEntry(entry: Entry): Promise<void>;
  upsertHabit(habit: Habit): Promise<void>;
  deleteHabit(id: string): Promise<void>;
  addCelebrations(items: Celebration[]): Promise<void>;
  markCelebrationsSeen(keys: string[]): Promise<void>;
  addNudge(nudge: Nudge): Promise<void>;
  markNudgesRead(reader: Role): Promise<void>;
  upsertLetter(letter: Letter): Promise<void>;
  openLetter(id: string): Promise<void>;
  savePushSub(sub: PushSub): Promise<void>;
  removePushSub(endpoint: string): Promise<void>;
  setCoachPack(pack: CoachPack): Promise<void>;
  addPhoto(photo: Photo, bytes: Buffer, contentType: string): Promise<void>;
  deletePhoto(id: string): Promise<void>;
  /** Something the browser can render: a data/blob URL or a signed https URL. */
  photoUrl(photo: Photo): Promise<string | null>;
  addChatMessages(messages: ChatMessage[]): Promise<void>;
  clearChat(): Promise<void>;
  addExpense(expense: Expense): Promise<void>;
  updateExpense(id: string, patch: ExpensePatch): Promise<void>;
  deleteExpense(id: string): Promise<void>;
}
