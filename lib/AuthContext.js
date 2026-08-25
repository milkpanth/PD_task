'use client';
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase, supabaseReady, createEphemeralAuthClient } from './supabaseClient';
import { logActivity } from './activityLog';

// ── Role master data ────────────────────────────────────────────────
// Single source of truth for the Role dropdown + what each role can do.
// Add/rename a role here and it updates everywhere (Account form, guards).
export const ROLE_OPTIONS = [
  'Super Admin', 'CTO', 'PD Manager', 'PD Team', 'SD', 'SD Manager', 'QA', 'QA Manager',
];

// projectScope: 'all' = every project, 'assigned' = only projects listed on
// the account's projectIds, 'none' = no project workspace access at all.
// canViewLogs is deliberately narrower than canAccessAdmin — the Admin
// section's other pages (Account) are open to all 4 full-system roles, but
// the audit Log is Super Admin only.
export const ROLE_CONFIG = {
  'Super Admin': { canDelete: true, canAccessAdmin: true, canAccessPD: true, canAccessOverall: true, canViewLogs: true, canAccessConfig: true, projectScope: 'all' },
  'CTO': { canDelete: false, canAccessAdmin: true, canAccessPD: true, canAccessOverall: true, canViewLogs: false, canAccessConfig: false, projectScope: 'all' },
  'PD Manager': { canDelete: false, canAccessAdmin: true, canAccessPD: true, canAccessOverall: true, canViewLogs: false, canAccessConfig: true, projectScope: 'all' },
  'PD Team': { canDelete: false, canAccessAdmin: true, canAccessPD: true, canAccessOverall: true, canViewLogs: false, canAccessConfig: false, projectScope: 'all' },
  'SD': { canDelete: false, canAccessAdmin: false, canAccessPD: false, canAccessOverall: false, canViewLogs: false, canAccessConfig: false, projectScope: 'assigned' },
  'SD Manager': { canDelete: false, canAccessAdmin: false, canAccessPD: false, canAccessOverall: true, canViewLogs: false, canAccessConfig: false, projectScope: 'all' },
  'QA': { canDelete: false, canAccessAdmin: false, canAccessPD: false, canAccessOverall: false, canViewLogs: false, canAccessConfig: false, projectScope: 'assigned' },
  'QA Manager': { canDelete: false, canAccessAdmin: false, canAccessPD: false, canAccessOverall: true, canViewLogs: false, canAccessConfig: false, projectScope: 'all' },
};

const NO_ROLE_PERMS = { canDelete: false, canAccessAdmin: false, canAccessPD: false, canAccessOverall: false, canViewLogs: false, canAccessConfig: false, projectScope: 'assigned' };

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = auth state not checked yet, null = signed out
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [authError, setAuthError] = useState('');

  const loadProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); setProfileChecked(true); return; }
    setProfileLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(error ? null : data);
    setProfileLoading(false);
    setProfileChecked(true);
  }, []);

  useEffect(() => {
    if (!supabaseReady) { setSession(null); setProfileChecked(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      if (data.session?.user) loadProfile(data.session.user.id);
      else setProfileChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess || null);
      if (sess?.user) loadProfile(sess.user.id);
      else { setProfile(null); setProfileChecked(true); }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const login = useCallback(async (email, password) => {
    setAuthError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setAuthError(error.message); throw error; }
    logActivity(supabase, {
      userId: data.user?.id, userEmail: data.user?.email,
      action: 'login', entityType: 'auth', detail: 'เข้าสู่ระบบ',
    });
  }, []);

  const logout = useCallback(async () => {
    if (session?.user) {
      // Log while the session/JWT is still valid — the insert's RLS check
      // requires auth.uid() to match, which is gone the instant signOut()
      // completes, so this must happen before (and be awaited).
      await logActivity(supabase, {
        userId: session.user.id, userEmail: session.user.email,
        action: 'logout', entityType: 'auth', detail: 'ออกจากระบบ',
      });
    }
    await supabase.auth.signOut();
  }, [session]);

  // Admin-only: create a new login account (auth user + profile row) without
  // disturbing the admin's own active session. Returns the generated
  // temporary password so the admin can hand it to the new user.
  const createAccount = useCallback(async ({ email, role, projectIds }) => {
    const eph = createEphemeralAuthClient();
    const tempPassword =
      Math.random().toString(36).slice(2, 8) +
      Math.random().toString(36).slice(2, 8).toUpperCase() + '!1';

    const { data: signUpData, error: signUpError } = await eph.auth.signUp({ email, password: tempPassword });
    if (signUpError) throw signUpError;
    const userId = signUpData.user?.id;
    if (!userId) throw new Error('สร้างบัญชีไม่สำเร็จ (ไม่ได้รับ user id)');

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId, email, role, projectIds: projectIds || [],
    });
    if (profileError) throw profileError;

    return { tempPassword };
  }, []);

  const role = profile?.role || null;
  const perms = ROLE_CONFIG[role] || NO_ROLE_PERMS;
  const assignedProjectIds = profile?.projectIds || [];

  const canAccessProject = useCallback((projectId) => {
    if (perms.projectScope === 'all') return true;
    return assignedProjectIds.includes(projectId);
  }, [perms.projectScope, assignedProjectIds]);

  const value = useMemo(() => ({
    session, profile, profileLoading, profileChecked, authError,
    isAuthenticated: !!session,
    role, perms, assignedProjectIds, canAccessProject,
    login, logout, createAccount,
  }), [session, profile, profileLoading, profileChecked, authError, role, perms,
      assignedProjectIds, canAccessProject, login, logout, createAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
