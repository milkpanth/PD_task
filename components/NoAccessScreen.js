'use client';
import { useAuth } from '../lib/AuthContext';

export default function NoAccessScreen() {
  const { logout, session } = useAuth();
  return (
    <div className="login-page">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div className="login-logo" style={{ justifyContent: 'center' }}>
          <div className="logo-icon">T</div>
          <span className="logo-text">TaskFlow</span>
        </div>
        <div style={{ fontSize: 32, margin: '12px 0' }}>🔒</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
          บัญชี <b>{session?.user?.email}</b> ยังไม่ได้รับสิทธิ์ใช้งานระบบ
        </p>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
          กรุณาติดต่อ Super Admin เพื่อสร้างบัญชีให้ใน Admin space
        </p>
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>ออกจากระบบ</button>
      </div>
    </div>
  );
}
