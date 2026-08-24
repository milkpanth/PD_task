'use client';
import { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function ChangePasswordModal({ open, onClose }) {
  const { session } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState(false);

  function reset() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErr('');
    setSuccess(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function submit() {
    setErr('');

    // Validate
    if (!currentPassword) { setErr('กรุณากรอกรหัสผ่านปัจจุบัน'); return; }
    if (!newPassword) { setErr('กรุณากรอกรหัสผ่านใหม่'); return; }
    if (newPassword.length < 6) { setErr('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if (newPassword !== confirmPassword) { setErr('รหัสผ่านใหม่ไม่ตรงกัน'); return; }
    if (currentPassword === newPassword) { setErr('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน'); return; }

    setBusy(true);
    try {
      // Step 1: Verify current password by attempting to sign in
      const email = session?.user?.email;
      if (!email) { setErr('ไม่พบ email ของผู้ใช้'); return; }

      const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (verifyError) {
        setErr('รหัสผ่านปัจจุบันไม่ถูกต้อง');
        return;
      }

      // Step 2: Update password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setErr(updateError.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
        return;
      }

      setSuccess(true);
    } catch (e) {
      setErr(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  if (success) {
    return (
      <Modal open={open} onClose={handleClose} width="420px">
        <div className="modal-title">✅ เปลี่ยนรหัสผ่านสำเร็จ</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 16 }}>
          รหัสผ่านของคุณได้ถูกเปลี่ยนเรียบร้อยแล้ว ครั้งถัดไปที่เข้าสู่ระบบให้ใช้รหัสผ่านใหม่
        </p>
        <div className="modal-actions-split">
          <div />
          <button className="btn btn-primary" onClick={handleClose}>เสร็จสิ้น</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} width="420px">
      <div className="modal-title">🔑 เปลี่ยนรหัสผ่าน</div>

      <div style={{ background: 'var(--bg2, #f5f5f5)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: 'var(--text2)' }}>
        👤 {session?.user?.email}
      </div>

      <div className="form-group">
        <label className="form-label">รหัสผ่านปัจจุบัน *</label>
        <input
          type="password"
          className="form-input"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          placeholder="กรอกรหัสผ่านปัจจุบัน"
          autoComplete="current-password"
        />
      </div>

      <div className="form-group">
        <label className="form-label">รหัสผ่านใหม่ *</label>
        <input
          type="password"
          className="form-input"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="อย่างน้อย 6 ตัวอักษร"
          autoComplete="new-password"
        />
      </div>

      <div className="form-group">
        <label className="form-label">ยืนยันรหัสผ่านใหม่ *</label>
        <input
          type="password"
          className="form-input"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
          autoComplete="new-password"
        />
      </div>

      {err && <div className="login-error" style={{ marginBottom: 10 }}>{err}</div>}

      <div className="modal-actions-split">
        <div />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={handleClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
