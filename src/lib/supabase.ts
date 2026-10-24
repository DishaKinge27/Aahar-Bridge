import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasRealValues = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    /^https?:\/\//.test(supabaseUrl) &&
    supabaseUrl !== 'https://your-project-ref.supabase.co' &&
    supabaseAnonKey !== 'your-anon-public-key',
);

/**
 * Whether the Supabase environment variables point at a real project.
 * When false, pages show a setup notice instead of failing silently.
 */
export const isSupabaseConfigured: boolean = hasRealValues;

let client: SupabaseClient | null = null;

/**
 * Returns the shared Supabase client, creating it on first use.
 * Returns `null` when the app is not configured — callers must handle that
 * and surface a setup message instead of crashing.
 *
 * Only the public anon key is used here; the service-role key must never
 * appear in frontend code.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
