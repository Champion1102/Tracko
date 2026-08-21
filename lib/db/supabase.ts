import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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

type HabitRow = {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  emoji: string;
  icon: string | null;
  kind: Habit["kind"];
  cadence: Habit["cadence"];
  points: number;
  target: number;
  unit: string;
  sub_items: string[] | null;
  sort_order: number;
  active: boolean;
};

const toHabit = (r: HabitRow): Habit => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  blurb: r.blurb,
  emoji: r.emoji,
  icon: r.icon ?? undefined,
  kind: r.kind,
  cadence: r.cadence,
  points: Number(r.points),
  target: Number(r.target),
  unit: r.unit,
  subItems: r.sub_items ?? undefined,
  sortOrder: r.sort_order,
  active: r.active,
});

const fromHabit = (h: Habit): HabitRow => ({
  id: h.id,
  slug: h.slug,
  name: h.name,
  blurb: h.blurb,
  emoji: h.emoji,
  icon: h.icon ?? null,
  kind: h.kind,
  cadence: h.cadence,
  points: h.points,
  target: h.target,
  unit: h.unit,
  sub_items: h.subItems ?? null,
  sort_order: h.sortOrder,
  active: h.active,
});

const BUCKET = "proof";

export class SupabaseStore implements Store {
  private sb: SupabaseClient;

  constructor(url: string, serviceKey: string) {
    this.sb = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  /** First boot on an empty database: lay down config, habits and letters. */
  private async ensureSeeded(): Promise<Config> {
    const { data } = await this.sb.from("config").select("data").eq("id", 1).maybeSingle();
    const defaults = defaultConfig(todayInTz("Asia/Kolkata"));
    // Field-level merge so a config saved before a new setting existed still
    // picks up that setting's default rather than reading undefined.
    if (data?.data) return { ...defaults, ...(data.data as Config) };

    const config = defaults;
    await this.sb.from("config").upsert({ id: 1, data: config });
    await this.sb.from("habits").upsert(SEED_HABITS.map(fromHabit));
    await this.sb.from("letters").upsert(
      SEED_LETTERS.map((l) => ({
        id: l.id,
        unlock_day: l.unlockDay,
        title: l.title,
        body: l.body,
        opened_at: null,
      })),
    );
    return config;
  }

  async read(): Promise<DB> {
    const config = await this.ensureSeeded();
    const [habits, entries, letters, nudges, celebrations, pushSubs, coach, photos, chat, expenses] =
      await Promise.all([
      this.sb.from("habits").select("*").order("sort_order"),
      this.sb.from("entries").select("*"),
      this.sb.from("letters").select("*").order("unlock_day"),
      this.sb.from("nudges").select("*").order("sent_at", { ascending: false }).limit(100),
      this.sb.from("celebrations").select("*"),
      this.sb.from("push_subs").select("*"),
      this.sb.from("coach").select("data").eq("id", 1).maybeSingle(),
      this.sb.from("photos").select("*").order("created_at"),
      // Newest 400, not oldest — ascending order here meant that once her
      // thread passed 400 messages the page froze on her earliest ones and
      // Nimbus kept getting fed stale context. Re-sorted below.
      this.sb.from("chat").select("*").order("created_at", { ascending: false }).limit(400),
      this.sb.from("expenses").select("*").order("day", { ascending: false }).limit(5000),
    ]);

    return {
      config,
      habits: (habits.data ?? []).map(toHabit),
      entries: (entries.data ?? []).map((e) => ({
        habitId: e.habit_id,
        day: e.day,
        value: Number(e.value),
        subDone: e.sub_done ?? [],
        note: e.note ?? undefined,
        updatedAt: e.updated_at,
      })),
      letters: (letters.data ?? []).map((l) => ({
        id: l.id,
        unlockDay: l.unlock_day,
        title: l.title,
        body: l.body,
        openedAt: l.opened_at,
      })),
      nudges: (nudges.data ?? []).map((n) => ({
        id: n.id,
        from: (n.sender ?? "sponsor") as Role,
        body: n.body,
        sentAt: n.sent_at,
        readAt: n.read_at,
      })),
      celebrations: (celebrations.data ?? []).map((c) => ({
        key: c.key,
        kind: c.kind,
        title: c.title,
        body: c.body,
        meta: c.meta ?? {},
        seen: c.seen,
        createdAt: c.created_at,
      })),
      pushSubs: (pushSubs.data ?? []).map((s) => ({
        role: s.role,
        endpoint: s.endpoint,
        p256dh: s.p256dh,
        auth: s.auth,
      })),
      coach: (coach.data?.data as CoachPack | undefined) ?? null,
      photos: (photos.data ?? []).map((p) => ({
        id: p.id,
        day: p.day,
        path: p.path,
        createdAt: p.created_at,
      })),
      chat: (chat.data ?? [])
        .map((c) => ({
          id: c.id,
          who: c.who,
          body: c.body,
          createdAt: c.created_at,
        }))
        .reverse(),
      expenses: (expenses.data ?? []).map((e) => ({
        id: e.id,
        day: e.day,
        amount: Number(e.amount),
        categoryId: e.category_id,
        verdict: e.verdict,
        note: e.note ?? undefined,
        createdAt: e.created_at,
      })),
    };
  }

  async patchConfig(patch: Partial<Config>): Promise<Config> {
    const current = await this.ensureSeeded();
    const next = { ...current, ...patch };
    await this.sb.from("config").upsert({ id: 1, data: next });
    return next;
  }

  async upsertEntry(entry: Entry) {
    await this.sb.from("entries").upsert({
      habit_id: entry.habitId,
      day: entry.day,
      value: entry.value,
      sub_done: entry.subDone,
      note: entry.note ?? null,
      updated_at: entry.updatedAt,
    });
  }

  async upsertHabit(habit: Habit) {
    await this.sb.from("habits").upsert(fromHabit(habit));
  }

  async deleteHabit(id: string) {
    await this.sb.from("habits").delete().eq("id", id);
  }

  async addCelebrations(items: Celebration[]) {
    if (!items.length) return;
    await this.sb.from("celebrations").upsert(
      items.map((c) => ({
        key: c.key,
        kind: c.kind,
        title: c.title,
        body: c.body,
        meta: c.meta,
        seen: c.seen,
        created_at: c.createdAt,
      })),
      { onConflict: "key", ignoreDuplicates: true },
    );
  }

  async markCelebrationsSeen(keys: string[]) {
    if (!keys.length) return;
    await this.sb.from("celebrations").update({ seen: true }).in("key", keys);
  }

  async addNudge(nudge: Nudge) {
    await this.sb.from("nudges").insert({
      id: nudge.id,
      sender: nudge.from,
      body: nudge.body,
      sent_at: nudge.sentAt,
      read_at: null,
    });
  }

  async markNudgesRead(reader: Role) {
    await this.sb
      .from("nudges")
      .update({ read_at: new Date().toISOString() })
      .neq("sender", reader)
      .is("read_at", null);
  }

  async upsertLetter(letter: Letter) {
    await this.sb.from("letters").upsert({
      id: letter.id,
      unlock_day: letter.unlockDay,
      title: letter.title,
      body: letter.body,
      opened_at: letter.openedAt,
    });
  }

  async openLetter(id: string) {
    await this.sb
      .from("letters")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", id)
      .is("opened_at", null);
  }

  async savePushSub(sub: PushSub) {
    await this.sb.from("push_subs").upsert({
      endpoint: sub.endpoint,
      role: sub.role,
      p256dh: sub.p256dh,
      auth: sub.auth,
    });
  }

  async removePushSub(endpoint: string) {
    await this.sb.from("push_subs").delete().eq("endpoint", endpoint);
  }

  async setCoachPack(pack: CoachPack) {
    await this.sb.from("coach").upsert({ id: 1, data: pack });
  }

  async addPhoto(photo: Photo, bytes: Buffer, contentType: string) {
    const { error } = await this.sb.storage
      .from(BUCKET)
      .upload(photo.path, bytes, { contentType, upsert: false });
    if (error) throw new Error(`Upload failed: ${error.message}`);

    await this.sb.from("photos").insert({
      id: photo.id,
      day: photo.day,
      path: photo.path,
      created_at: photo.createdAt,
    });
  }

  async deletePhoto(id: string) {
    const { data } = await this.sb.from("photos").select("path").eq("id", id).maybeSingle();
    if (data?.path) await this.sb.storage.from(BUCKET).remove([data.path]);
    await this.sb.from("photos").delete().eq("id", id);
  }

  async addChatMessages(messages: ChatMessage[]) {
    if (!messages.length) return;
    await this.sb.from("chat").insert(
      messages.map((m) => ({ id: m.id, who: m.who, body: m.body, created_at: m.createdAt })),
    );
  }

  async clearChat() {
    await this.sb.from("chat").delete().neq("id", "");
  }

  async addExpense(expense: Expense) {
    await this.sb.from("expenses").insert({
      id: expense.id,
      day: expense.day,
      amount: expense.amount,
      category_id: expense.categoryId,
      verdict: expense.verdict,
      note: expense.note ?? null,
      created_at: expense.createdAt,
    });
  }

  async updateExpense(id: string, patch: ExpensePatch) {
    const row: Record<string, unknown> = {};
    if (patch.amount !== undefined) row.amount = patch.amount;
    if (patch.categoryId !== undefined) row.category_id = patch.categoryId;
    if (patch.verdict !== undefined) row.verdict = patch.verdict;
    if (patch.note !== undefined) row.note = patch.note || null;
    if (!Object.keys(row).length) return;
    await this.sb.from("expenses").update(row).eq("id", id);
  }

  async deleteExpense(id: string) {
    await this.sb.from("expenses").delete().eq("id", id);
  }

  async photoUrl(photo: Photo) {
    // Bucket is private; hand out a short-lived signed URL rather than making
    // her progress photos publicly guessable.
    const { data } = await this.sb.storage.from(BUCKET).createSignedUrl(photo.path, 60 * 60);
    return data?.signedUrl ?? null;
  }
}
