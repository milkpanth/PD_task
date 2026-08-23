import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseReady = Boolean(url && key);

// Session is kept in sessionStorage (not localStorage) so it disappears when
// the tab/browser is closed. While the tab stays open, supabase-js keeps the
// access token auto-refreshed in the background — so the session never
// "expires" from inactivity. It only ends when the tab/browser is closed or
// the user explicitly logs out.
export const supabase = supabaseReady
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
      },
    })
  : null;

// A throwaway auth client used ONLY when an admin creates a new login
// account (supabase.auth.signUp). persistSession:false means it never reads
// or writes any storage and never touches the active session — so creating
// a new user does not log the admin out or swap sessions underneath them.
export function createEphemeralAuthClient() {
  if (!supabaseReady) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
