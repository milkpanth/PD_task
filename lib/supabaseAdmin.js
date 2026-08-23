import { createClient } from '@supabase/supabase-js';

// Server-only client using the SERVICE ROLE key — bypasses RLS entirely.
// NEVER import this from a 'use client' component or expose this key with
// a NEXT_PUBLIC_ prefix. Only used by app/api/**/route.js handlers that
// need to write data on behalf of an external system (e.g. an OpenProject
// webhook), where there is no logged-in TaskFlow user/session to act as.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdminReady = Boolean(url && serviceKey);

export const supabaseAdmin = supabaseAdminReady
  ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
