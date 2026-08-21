import { FileStore } from "./file";
import type { Store } from "./store";
import { SupabaseStore } from "./supabase";

let cached: Store | null = null;

/**
 * Supabase when it's configured, a local JSON file otherwise. Same interface
 * either way, so `npm run dev` works with zero setup.
 */
export function db(): Store {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  cached = url && key ? new SupabaseStore(url, key) : new FileStore();
  return cached;
}

export const usingSupabase = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export type { Store };
