import { promises as fs } from "node:fs";
import path from "node:path";
import { todayInTz } from "../dates";
import { SEED_HABITS, SEED_LETTERS, defaultConfig } from "../seed";
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
import type { ExpensePatch, Store } from "./store";

const FILE = path.join(process.cwd(), ".data", "tracko.json");
const UPLOADS = path.join(process.cwd(), ".data", "uploads");

function freshDb(): DB {
  return {
    config: defaultConfig(todayInTz("Asia/Kolkata")),
    habits: SEED_HABITS,
    letters: SEED_LETTERS,
    entries: [],
    nudges: [],
    celebrations: [],
    pushSubs: [],
    coach: null,
    photos: [],
    chat: [],
    expenses: [],
  };
}

let writeChain: Promise<unknown> = Promise.resolve();

/**
 * Single-file JSON store for local development. Every mutation is queued onto
 * one promise chain so concurrent server actions can't clobber each other.
 */
export class FileStore implements Store {
  async read(): Promise<DB> {
    let raw: string;
    try {
      raw = await fs.readFile(FILE, "utf8");
    } catch (err) {
      // Only a genuinely missing file earns a fresh database. Any other read
      // failure must not be treated as "start over".
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      const db = freshDb();
      await this.write(db);
      return db;
    }

    let parsed: DB;
    try {
      parsed = JSON.parse(raw) as DB;
    } catch (err) {
      // Refuse rather than overwrite. Silently replacing an unreadable file
      // with defaults is how months of logging disappear.
      throw new Error(
        `${FILE} is not valid JSON — refusing to overwrite it. Fix or move the file. (${(err as Error).message})`,
      );
    }

    const base = freshDb();
    // Field-level merge on config so data written before a new setting
    // existed still gets that setting's default.
    return { ...base, ...parsed, config: { ...base.config, ...parsed.config } };
  }

  private async write(db: DB) {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    // Write-then-rename: a reader can never catch the file half-written.
    const tmp = `${FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tmp, FILE);
  }

  private mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
    const next = writeChain.then(async () => {
      const db = await this.read();
      const result = await fn(db);
      await this.write(db);
      return result;
    });
    writeChain = next.catch(() => {});
    return next;
  }

  patchConfig(patch: Partial<Config>) {
    return this.mutate((db) => {
      db.config = { ...db.config, ...patch };
      return db.config;
    });
  }

  upsertEntry(entry: Entry) {
    return this.mutate<void>((db) => {
      const i = db.entries.findIndex(
        (e) => e.habitId === entry.habitId && e.day === entry.day,
      );
      if (i >= 0) db.entries[i] = entry;
      else db.entries.push(entry);
    });
  }

  upsertHabit(habit: Habit) {
    return this.mutate<void>((db) => {
      const i = db.habits.findIndex((h) => h.id === habit.id);
      if (i >= 0) db.habits[i] = habit;
      else db.habits.push(habit);
    });
  }

  deleteHabit(id: string) {
    return this.mutate<void>((db) => {
      db.habits = db.habits.filter((h) => h.id !== id);
      db.entries = db.entries.filter((e) => e.habitId !== id);
    });
  }

  addCelebrations(items: Celebration[]) {
    return this.mutate<void>((db) => {
      const seen = new Set(db.celebrations.map((c) => c.key));
      for (const c of items) if (!seen.has(c.key)) db.celebrations.push(c);
    });
  }

  markCelebrationsSeen(keys: string[]) {
    return this.mutate<void>((db) => {
      const set = new Set(keys);
      for (const c of db.celebrations) if (set.has(c.key)) c.seen = true;
    });
  }

  addNudge(nudge: Nudge) {
    return this.mutate<void>((db) => {
      db.nudges.unshift(nudge);
      db.nudges = db.nudges.slice(0, 100);
    });
  }

  markNudgesRead(reader: Role) {
    return this.mutate<void>((db) => {
      const now = new Date().toISOString();
      for (const n of db.nudges) if (n.from !== reader && !n.readAt) n.readAt = now;
    });
  }

  upsertLetter(letter: Letter) {
    return this.mutate<void>((db) => {
      const i = db.letters.findIndex((l) => l.id === letter.id);
      if (i >= 0) db.letters[i] = letter;
      else db.letters.push(letter);
    });
  }

  openLetter(id: string) {
    return this.mutate<void>((db) => {
      const l = db.letters.find((x) => x.id === id);
      if (l && !l.openedAt) l.openedAt = new Date().toISOString();
    });
  }

  savePushSub(sub: PushSub) {
    return this.mutate<void>((db) => {
      db.pushSubs = db.pushSubs.filter((s) => s.endpoint !== sub.endpoint);
      db.pushSubs.push(sub);
    });
  }

  removePushSub(endpoint: string) {
    return this.mutate<void>((db) => {
      db.pushSubs = db.pushSubs.filter((s) => s.endpoint !== endpoint);
    });
  }

  setCoachPack(pack: CoachPack) {
    return this.mutate<void>((db) => {
      db.coach = pack;
    });
  }

  async addPhoto(photo: Photo, bytes: Buffer) {
    // photo.path is `<day>/<id>.<ext>`, so the day folder has to exist too —
    // creating UPLOADS alone left every upload failing on ENOENT.
    const dest = path.join(UPLOADS, photo.path);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, bytes);
    await this.mutate<void>((db) => {
      db.photos.push(photo);
    });
  }

  async deletePhoto(id: string) {
    const db = await this.read();
    const photo = db.photos.find((p) => p.id === id);
    if (photo) await fs.rm(path.join(UPLOADS, photo.path), { force: true });
    await this.mutate<void>((d) => {
      d.photos = d.photos.filter((p) => p.id !== id);
    });
  }

  addChatMessages(messages: ChatMessage[]) {
    return this.mutate<void>((db) => {
      db.chat.push(...messages);
      // Keep the transcript bounded; the model only ever sees the recent tail.
      db.chat = db.chat.slice(-400);
    });
  }

  clearChat() {
    return this.mutate<void>((db) => {
      db.chat = [];
    });
  }

  addExpense(expense: Expense) {
    return this.mutate<void>((db) => {
      db.expenses.push(expense);
    });
  }

  updateExpense(id: string, patch: ExpensePatch) {
    return this.mutate<void>((db) => {
      const found = db.expenses.find((e) => e.id === id);
      if (found) Object.assign(found, patch);
    });
  }

  deleteExpense(id: string) {
    return this.mutate<void>((db) => {
      db.expenses = db.expenses.filter((e) => e.id !== id);
    });
  }

  async photoUrl(photo: Photo) {
    try {
      const bytes = await fs.readFile(path.join(UPLOADS, photo.path));
      // Label it with what it actually is. Chrome sniffs past a wrong type,
      // iOS Safari — which is the whole point of this being a PWA — does not.
      const ext = photo.path.split(".").pop()?.toLowerCase();
      const mime =
        ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      return `data:${mime};base64,${bytes.toString("base64")}`;
    } catch {
      return null;
    }
  }
}
