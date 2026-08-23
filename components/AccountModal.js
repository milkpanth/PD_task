'use client';
import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useStore } from '../lib/StoreContext';
import { useAuth, ROLE_OPTIONS } from '../lib/AuthContext';

export default function AccountModal({ open, onClose, account }) {
  const { data, updateRow, deleteRow, confirm, toast, reload } = useStore();
  const { perms, createAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('SD');
  const [projectIds, setProjectIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [createdPassword, setCreatedPassword] = useState('');

  const projects = data.projects || [];

  useEffect(() => {
    if (!open) return;
    setErr('');
    setCreatedPassword('');
    if (account) {
      setEmail(account.email || '');
      setRole(account.role || 'SD');
      setProjectIds(account.projectIds || []);
    } else {
      setEmail('');
      setRole('SD');
      setProjectIds([]);
    }
  }, [open, account]);

  if (!open) return null;

  function toggleProject(id) {
    setProjectIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  async function save() {
    if (!email.trim()) return;
    setErr('');
    setBusy(true);
    try {
      if (account) {
        await updateRow('profiles', account.id, { role, projectIds });
        toast('✏️ อัปเดตบัญชีแล้ว');
        onClose();
      } else {
        const { tempPassword } = await createAccount({ email: email.trim(), role, projectIds });
        await reload();
        setCreatedPassword(tempPassword);
      }
    } catch (e) {
      setErr(e.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  function del() {
    confirm('ลบบัญชีนี้?', `เพิกถอนสิทธิ์การเข้าใช้งานของ "${account.email}" — ผู้ใช้จะไม่สามารถเข้าระบบได้อีก`, async () => {
      await deleteRow('profiles', account.id);
      toast('🗑️ ลบบัญชีแล้ว');
      onClose();
    });
  }

  if (createdPassword) {
    return (
      <Modal open={open} onClose={onClose} width="480px">
        <div className="modal-title">✅ สร้างบัญชีแล้ว</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.6 }}>
          แจ้ง Email และรหัสผ่านชั่วคราวนี้ให้ผู้ใช้เพื่อเข้าสู่ระบบ — ระบบยังไม่มีฟีเจอร์เปลี่ยนรหัสผ่านด้วยตัวเอง
          ผู้ใช้ล็อกอินได้ด้วยรหัสผ่านนี้จนกว่าจะถูกรีเซ็ต
        </p>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" readOnly value={email} />
        </div>
        <div className="form-group">
          <label className="form-label">รหัสผ่านชั่วคราว</label>
          <input className="form-input" readOnly value={createdPassword} style={{ fontFamily: 'monospace', letterSpacing: 0.5 }} />
        </div>
        <div className="modal-actions-split">
          <div />
          <button className="btn btn-primary" onClick={onClose}>เสร็จสิ้น</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} width="480px">
      <div className="modal-title">{account ? '✎ แก้ไขบัญชี' : '🛡️ Account ใหม่'}</div>
      <div className="form-group">
        <label className="form-label">Email *</label>
        <input
          type="email" className="form-input" value={email} disabled={!!account}
          onChange={e => setEmail(e.target.value)} placeholder="user@company.com"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Role</label>
        <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Project (assign ได้หลายรายการ)</label>
        <div className="multiselect-list">
          {!projects.length && <div className="multiselect-empty">ยังไม่มี project ในระบบ</div>}
          {projects.map(p => (
            <label key={p.id} className="multiselect-opt">
              <input type="checkbox" checked={projectIds.includes(p.id)} onChange={() => toggleProject(p.id)} />
              {p.name}
            </label>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
          ใช้กำหนดขอบเขตเฉพาะ role ที่เห็นได้แค่ project ที่ถูก assign (SD / QA) — role อื่นเห็นทุก project อยู่แล้ว
        </div>
      </div>
      {err && <div className="login-error">{err}</div>}
      <div className="modal-actions-split">
        {account && perms.canDelete ? <button className="btn btn-danger" onClick={del}>🗑 ลบ</button> : <div />}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'กำลังบันทึก...' : 'บันทึก'}</button>
        </div>
      </div>
    </Modal>
  );
}
