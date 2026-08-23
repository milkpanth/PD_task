'use client';
import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useStore } from '../lib/StoreContext';
import { useAuth } from '../lib/AuthContext';

const EMOJIS = ['📦','👕','👟','💻','📱','🎒','⌚','📷','🎧','🍕','☕','🌿','💊','🔑','🎁','🛍️','🖥️','🎮','🏋️','🚗','✈️','🏠','💎','🎵'];
const EMPTY = { name: '', sku: '', desc: '', phase: '', scope: 'internal', status: 'planning', emoji: '📦' };

export default function ProductModal({ open, onClose, product }) {
  const { addRow, updateRow, deleteRow, confirm, toast } = useStore();
  const { perms } = useAuth();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(product ? { ...EMPTY, ...product } : EMPTY);
  }, [open, product]);

  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim()) return;
    if (product) { await updateRow('products', product.id, form); toast('✏️ อัปเดต product แล้ว'); }
    else { await addRow('products', form); toast('✅ เพิ่ม product แล้ว'); }
    onClose();
  }

  function del() {
    confirm('ลบ Product นี้?', 'การลบจะไม่สามารถกู้คืนได้', async () => {
      await deleteRow('products', product.id);
      toast('🗑️ ลบ product แล้ว');
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="modal-title">{product ? '✎ แก้ไข Product' : '◉ Product ใหม่'}</div>
      <div className="form-group">
        <label className="form-label">ไอคอน / อิโมจิ</label>
        <div className="emoji-picker">
          {EMOJIS.map(e => (
            <div key={e} className={`emoji-opt ${form.emoji === e ? 'selected' : ''}`} onClick={() => set('emoji', e)}>{e}</div>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">ชื่อ Product *</label>
        <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="เช่น ISARA PMS, POS, Loyalty, wCFO" />
      </div>
      <div className="form-group">
        <label className="form-label">SKU / รหัสอ้างอิง</label>
        <input className="form-input" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="เช่น ISARA-PMS" />
      </div>
      <div className="form-group">
        <label className="form-label">รายละเอียด</label>
        <textarea className="form-textarea" style={{ minHeight: 60 }} value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="อธิบาย product / โมดูล..." />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Phase</label>
          <input className="form-input" value={form.phase} onChange={e => set('phase', e.target.value)} placeholder="เช่น Phase 1, Phase 2" />
        </div>
        <div className="form-group">
          <label className="form-label">Internal / External</label>
          <select className="form-select" value={form.scope} onChange={e => set('scope', e.target.value)}>
            <option value="internal">🟣 Internal — พัฒนาใช้เอง</option>
            <option value="external">🟠 External — พัฒนาให้ลูกค้า</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Product Status</label>
        <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="planning">Planning</option>
          <option value="requirement">Requirement</option>
          <option value="development">Development</option>
          <option value="test">Test</option>
          <option value="deliver">Deliver</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div className="modal-actions-split">
        {product && perms.canDelete ? <button className="btn btn-danger" onClick={del}>🗑 ลบ</button> : <div />}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={save}>บันทึก</button>
        </div>
      </div>
    </Modal>
  );
}
