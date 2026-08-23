'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { StoreProvider } from '../lib/StoreContext';
import { supabase, supabaseReady } from '../lib/supabaseClient';
import { logActivity } from '../lib/activityLog';
import LoginForm from './LoginForm';
import NoAccessScreen from './NoAccessScreen';
import Sidebar from './Sidebar';
import GlobalOverlays from './GlobalOverlays';

function RouteGuard({ children }) {
  const pathname = usePathname();
  const { perms, session } = useAuth();
  const lastLogged = useRef(null);

  // Page-view audit trail — one log entry per distinct page visited.
  // (Granularity is per-page, not per-record — opening an individual
  // record's edit modal is captured separately as an "update" once saved.)
  useEffect(() => {
    if (!session?.user || lastLogged.current === pathname) return;
    lastLogged.current = pathname;
    logActivity(supabase, {
      userId: session.user.id, userEmail: session.user.email,
      action: 'view', entityType: 'page', entityId: pathname, detail: pathname,
    });
  }, [pathname, session]);

  const blockedAdmin = pathname.startsWith('/admin') && !perms.canAccessAdmin;
  const blockedLog = pathname.startsWith('/admin/log') && !perms.canViewLogs;
  const blockedPD = pathname.startsWith('/pd') && !perms.canAccessPD;
  const blockedOverall = ['/', '/projects', '/timeline', '/products', '/tasks'].includes(pathname) && !perms.canAccessOverall;

  if (blockedAdmin || blockedLog || blockedPD || blockedOverall) {
    return (
      <>
        <div className="topbar"><span className="topbar-title">ไม่มีสิทธิ์เข้าถึง</span></div>
        <div className="content">
          <div className="empty-state" style={{ padding: 48 }}>
            <div className="emoji">🔒</div><p>คุณไม่ได้รับสิทธิ์เข้าถึงหน้านี้</p>
          </div>
        </div>
      </>
    );
  }
  return children;
}

export default function AppGate({ children }) {
  const { session, profile, profileChecked } = useAuth();

  // No Supabase env configured yet — let the existing DataGate message inside
  // pages explain what to do, without forcing a login screen first.
  if (!supabaseReady) {
    return (
      <StoreProvider>
        <Sidebar />
        <div className="main"><RouteGuard>{children}</RouteGuard></div>
        <GlobalOverlays />
      </StoreProvider>
    );
  }

  if (session === undefined || !profileChecked) {
    return <div className="login-page"><div style={{ color: 'var(--text3)', fontSize: 13 }}>กำลังตรวจสอบสิทธิ์...</div></div>;
  }

  if (!session) return <LoginForm />;
  if (!profile) return <NoAccessScreen />;

  return (
    <StoreProvider>
      <Sidebar />
      <div className="main"><RouteGuard>{children}</RouteGuard></div>
      <GlobalOverlays />
    </StoreProvider>
  );
}
