'use client';
import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useStore } from '../lib/StoreContext';
import { useAuth } from '../lib/AuthContext';

const COLORS = [
  { c: '#1c3a63', l: '💜 Purple' }, { c: '#4ade80', l: '💚 Green' }, { c: '#22d3ee', l: '🩵 Cyan' },
  { c: '#f472b6', l: '🩷 Pink' }, { c: '#fb923c', l: '🧡 Orange' }, { c: '#facc15', l: '💛 Yellow' },
  { c: '#f87171', l: '❤️ Red' },
];
const EMOJIS = ['🌐','📱','📣','🛒','🎯','🏗️','📊','🔬','🎨','⚙️','🚀','💡','📦','🎮','📝','🏆'];
const EMPTY = { name: '', desc: '', start: '', end: '', color: '#1c3a63', emoji: '🌐', status: 'active', openProjectId: '' };

export default function ProjectModal({ open, onClose, project }) {
  const { addRow, updateRow, deleteRow, confirm, toast } = useStore();
  const { perms } = useAuth();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (project) setForm({ ...EMPTY, ...project });
    else setForm({ ...EMPTY, start: new Date().toISOString().split('T')[0] });
  }, [open, project]);

  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim()) return;
    const payload = { ...form, openProjectId: form.openProjectId === '' ? null : Number(form.openProjectId) };
    if (project) { await updateRow('projects', project.id, payload); toast('✏️ อัปเดต project แล้ว'); }
    else { await addRow('projects', payload); toast('✅ เพิ่ม project แล้ว'); }
    onClose();
  }

  function del() {
    confirm('ลบ Project นี้?', `ลบ "${project.name}" — งานที่เกี่ยวข้องบางส่วนอาจถูกลบตามไปด้วย`, async () => {
      await deleteRow('projects', project.id);
      toast('🗑️ ลบ project แล้ว');
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="modal-title">{project ? '✎ แก้ไข Project' : '◈ Project ใหม่'}</div>
      <div className="form-group">
        <label className="form-label">ชื่อ Project *</label>
        <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="เช่น เว็บไซต์บริษัท, แอป Mobile" />
      </div>
      <div className="form-group">
        <label className="form-label">รายละเอียด</label>
        <textarea className="form-textarea" value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="อธิบาย project นี้..." />
      </div>
      <div className="form-group">
        <label className="form-label">OpenProject Project ID</label>
        <input
          type="number" className="form-input" value={form.openProjectId ?? ''}
          onChange={e => set('openProjectId', e.target.value)} placeholder="เช่น 12 (ดูจาก URL project บน OpenProject)"
        />
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
          ผูก project นี้กับ project บน OpenProject เพื่อ sync Dev Task สองทาง — เว้นว่างได้ถ้ายังไม่ต้องการ sync
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">วันเริ่มต้น</label>
          <input type="date" className="form-input" value={form.start || ''} onChange={e => set('start', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">วันสิ้นสุด</label>
          <input type="date" className="form-input" value={form.end || ''} onChange={e => set('end', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">ไอคอน</label>
        <div className="emoji-picker">
          {EMOJIS.map(e => (
            <div key={e} className={`emoji-opt ${form.emoji === e ? 'selected' : ''}`} onClick={() => set('emoji', e)}>{e}</div>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">สี</label>
        <div className="chip-group">
          {COLORS.map(({ c, l }) => (
            <div key={c} className={`chip ${form.color === c ? 'selected' : ''}`} onClick={() => set('color', c)}>{l}</div>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">สถานะ</label>
        <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="active">🟢 กำลังดำเนินการ</option>
          <option value="hold">🟡 รอดำเนินการ</option>
          <option value="done">✅ เสร็จสิ้น</option>
        </select>
      </div>
      <div className="modal-actions-split">
        {project && perms.canDelete ? <button className="btn btn-danger" onClick={del}>🗑 ลบ Project</button> : <div />}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={save}>บันทึก</button>
        </div>
      </div>
    </Modal>
  );
}
