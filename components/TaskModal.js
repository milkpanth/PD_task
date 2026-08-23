'use client';
import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useStore } from '../lib/StoreContext';
import { useAuth } from '../lib/AuthContext';

const EMPTY = { name: '', desc: '', project: '', priority: 'medium', due: '', type: 'daily' };

export default function TaskModal({ open, onClose, task, defaultProject }) {
  const { data, addRow, updateRow, deleteRow, confirm, toast } = useStore();
  const { perms } = useAuth();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (task) setForm({ ...EMPTY, ...task, project: task.project || '' });
    else setForm({ ...EMPTY, project: defaultProject || '', due: new Date().toISOString().split('T')[0] });
  }, [open, task, defaultProject]);

  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim()) return;
    const payload = { ...form, project: form.project || null };
    if (task) { await updateRow('tasks', task.id, payload); toast('✏️ อัปเดต task แล้ว'); }
    else { await addRow('tasks', payload); toast('✅ เพิ่ม task แล้ว'); }
    onClose();
  }

  function del() {
    confirm('ลบ Task นี้?', 'การลบจะไม่สามารถกู้คืนได้', async () => {
      await deleteRow('tasks', task.id);
      toast('🗑️ ลบ task แล้ว');
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="modal-title">{task ? '✎ แก้ไข Task' : '✦ Task ใหม่'}</div>
      <div className="form-group">
        <label className="form-label">ชื่อ Task *</label>
        <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="เช่น ออกแบบ wireframe หน้าหลัก" />
      </div>
      <div className="form-group">
        <label className="form-label">รายละเอียด</label>
        <textarea className="form-textarea" value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="เพิ่มรายละเอียด..." />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Project</label>
          <select className="form-select" value={form.project || ''} onChange={e => set('project', e.target.value)}>
            <option value="">— ไม่ระบุ —</option>
            {(data.projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">ความสำคัญ</label>
          <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="low">🟢 ต่ำ</option>
            <option value="medium">🟡 ปานกลาง</option>
            <option value="high">🔴 สูง</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">กำหนดเสร็จ</label>
          <input type="date" className="form-input" value={form.due || ''} onChange={e => set('due', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">ประเภท</label>
          <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="daily">📅 Daily</option>
            <option value="weekly">📆 Weekly</option>
            <option value="monthly">🗓️ Monthly</option>
          </select>
        </div>
      </div>
      <div className="modal-actions-split">
        {task && perms.canDelete ? <button className="btn btn-danger" onClick={del}>🗑 ลบ</button> : <div />}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={save}>บันทึก Task</button>
        </div>
      </div>
    </Modal>
  );
}
