'use client';
import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setErr('');
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (e2) {
      setErr(e2.message === 'Invalid login credentials' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : (e2.message || 'เข้าสู่ระบบไม่สำเร็จ'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">
          <div className="logo-icon">T</div>
          <span className="logo-text">TaskFlow</span>
        </div>
        <div className="login-title">เข้าสู่ระบบ</div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email" autoFocus className="form-input" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password" className="form-input" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••"
          />
        </div>
        {err && <div className="login-error">{err}</div>}
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
          {busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  );
}
