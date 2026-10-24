import { vi } from 'vitest';

// Tests must never touch a real Supabase project: force the app into its
// "not configured" mode so no client is created and no network calls happen.
vi.stubEnv('VITE_SUPABASE_URL', '');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
