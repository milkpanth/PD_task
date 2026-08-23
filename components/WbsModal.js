'use client';
import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useStore } from '../lib/StoreContext';
import { useAuth } from '../lib/AuthContext';

const EMPTY = { level: 'main', name: '', pic: '', planStart: '', planEnd: '', actualStart: '', actualEnd: '', progress: 0, remark: '' };

export default function WbsModal({ open, onClose, row, projectId, nextOrder }) {
  const { addRow, updateRow, deleteRow, confirm, toast } = useStore();
  const { perms } = useAuth();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(row ? { ...EMPTY, ...row } : EMPTY);
  }, [open, row]);

  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim()) return;
    const payload = { ...form, progress: Number(form.progress) || 0, project: projectId };
    if (row) { await updateRow('wbs', row.id, payload); toast('✏️ อัปเดตแล้ว'); }
    else { await addRow('wbs', { ...payload, sortOrder: nextOrder ?? 0 }); toast('✅ เพิ่มแถวแล้ว'); }
    onClose();
  }

  function del() {
    confirm('ลบแถวนี้?', 'การลบจะไม่สามารถกู้คืนได้', async () => {
      await deleteRow('wbs', row.id);
      toast('🗑️ ลบแล้ว');
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} width="520px">
      <div className="modal-title">{row ? '✎ แก้ไขแถว WBS' : '📊 แถว WBS ใหม่'}</div>
      <div className="form-group">
        <label className="form-label">ระดับ</label>
        <div className="level-select-row">
          {['header', 'main', 'sub'].map(lv => (
            <div key={lv} className={`level-opt ${form.level === lv ? 'selected' : ''}`} onClick={() => set('level', lv)}>
              {lv === 'header' ? 'Header' : lv === 'main' ? 'Main Task' : 'Sub Task'}
            </div>
          ))}
        </div>
      </div>
      <div className="form-group"><label className="form-label">ชื่องาน (Detail) *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="เช่น Database Design" /></div>
      <div className="form-group"><label className="form-label">PIC (แผนก/ชื่อ)</label><input className="form-input" value={form.pic} onChange={e => set('pic', e.target.value)} placeholder="เช่น SD - Nay" /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Plan Start</label><input type="date" className="form-input" value={form.planStart || ''} onChange={e => set('planStart', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Plan End</label><input type="date" className="form-input" value={form.planEnd || ''} onChange={e => set('planEnd', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Actual Start</label><input type="date" className="form-input" value={form.actualStart || ''} onChange={e => set('actualStart', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Actual End</label><input type="date" className="form-input" value={form.actualEnd || ''} onChange={e => set('actualEnd', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Progress % (Actual)</label><input type="number" min="0" max="100" className="form-input" value={form.progress} onChange={e => set('progress', e.target.value)} placeholder="0" /></div>
        <div className="form-group"><label className="form-label">Remark</label><input className="form-input" value={form.remark} onChange={e => set('remark', e.target.value)} placeholder="หมายเหตุ" /></div>
      </div>
      <div className="modal-actions-split">
        {row && perms.canDelete ? <button className="btn btn-danger" onClick={del}>🗑 ลบ</button> : <div />}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={save}>บันทึก</button>
        </div>
      </div>
    </Modal>
  );
}
