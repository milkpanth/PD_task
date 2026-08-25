'use client';
import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useStore } from '../lib/StoreContext';
import { useAuth } from '../lib/AuthContext';

const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Personal Leave'];

function emptyForm(date) {
  return {
    entryType: 'work',
    date: date || '',
    timeIn: '09:00',
    timeOut: '18:00',
    workMode: 'project',
    projectId: '',
    workDetail: '',
    leaveType: 'Annual Leave',
    leaveStart: date || '',
    leaveEnd: date || '',
    reason: '',
  };
}

export default function TimesheetModal({ open, onClose, entry, presetDate, viewOnly = false, presetTime }) {
  const { data, addRow, updateRow, deleteRow, confirm, toast } = useStore();
  const { perms, session } = useAuth();
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');
  const projects = data.projects || [];

  // Build profile lookup for displaying owner name
  const profileMap = {};
  (data.profiles || []).forEach(p => { profileMap[p.id] = p; });

  useEffect(() => {
    if (!open) return;
    setFormErr('');
    if (entry && !entry._presetTime) {
      setForm({
        ...emptyForm(entry.date),
        ...entry,
        workMode: entry.projectId ? 'project' : 'non-project',
        leaveStart: entry.date || '',
        leaveEnd: entry.date || '',
      });
    } else {
      const base = emptyForm(presetDate);
      if (presetTime || entry?._presetTime) {
        const pt = presetTime || entry;
        base.timeIn = pt.timeIn || base.timeIn;
        base.timeOut = pt.timeOut || base.timeOut;
      }
      setForm(base);
    }
  }, [open, entry, presetDate]);

  if (!open) return null;
  const set = (k, v) => { if (!viewOnly) setForm(f => ({ ...f, [k]: v })); };

  function dateRange(startStr, endStr) {
    const out = [];
    let d = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    if (isNaN(d) || isNaN(end) || d > end) return out;
    while (d <= end) {
      const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
      out.push(`${y}-${m}-${day}`);
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  async function save() {
    if (viewOnly) return;
    setFormErr('');
    if (form.entryType === 'work' && form.workMode === 'project' && !form.projectId) {
      setFormErr('กรุณาเลือก Project');
      return;
    }
    setSaving(true);
    try {
      const owner = { userId: session?.user?.id, userEmail: session?.user?.email };
      const resolvedProjectId = form.workMode === 'project' ? (form.projectId || null) : null;

      if (entry) {
        const payload = form.entryType === 'leave'
          ? { entryType: 'leave', date: form.leaveStart, leaveType: form.leaveType, reason: form.reason, timeIn: null, timeOut: null, projectId: null, workDetail: '' }
          : { entryType: 'work', date: form.date, timeIn: form.timeIn, timeOut: form.timeOut, projectId: resolvedProjectId, workDetail: form.workDetail };
        await updateRow('timesheets', entry.id, payload);
        toast('✏️ อัปเดตรายการแล้ว');
        onClose();
        return;
      }

      if (form.entryType === 'work') {
        if (!form.date) return;
        await addRow('timesheets', {
          ...owner, entryType: 'work', date: form.date,
          timeIn: form.timeIn, timeOut: form.timeOut,
          projectId: resolvedProjectId, workDetail: form.workDetail,
        });
        toast('✅ บันทึกเวลาเข้างานแล้ว');
      } else {
        const dates = dateRange(form.leaveStart, form.leaveEnd);
        if (!dates.length) return;
        await Promise.all(dates.map(d => addRow('timesheets', {
          ...owner, entryType: 'leave', date: d,
          leaveType: form.leaveType, reason: form.reason,
          timeIn: null, timeOut: null, projectId: null, workDetail: '',
        })));
        toast(dates.length > 1 ? `🌴 บันทึกการลา ${dates.length} วันแล้ว` : '🌴 บันทึกการลาแล้ว');
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function del() {
    if (viewOnly) return;
    confirm('ลบรายการนี้?', 'การลบจะไม่สามารถกู้คืนได้', async () => {
      await deleteRow('timesheets', entry.id);
      toast('🗑️ ลบแล้ว');
      onClose();
    });
  }

  // Owner display name for view-only mode
  const ownerProfile = entry ? profileMap[entry.userId] : null;
  const ownerEmail = ownerProfile?.email || entry?.userEmail || '';
  const ownerName = ownerEmail ? ownerEmail.split('@')[0] : 'Unknown';

  return (
    <Modal open={open} onClose={onClose} width="480px">
      <div className="modal-title">
        {viewOnly ? '👁️ ดูรายการ' : entry ? '✎ แก้ไขรายการ' : '🕒 บันทึกเวลา'}
      </div>

      {viewOnly && entry && (
        <div style={{ background: 'var(--bg2, #f5f5f5)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: 'var(--text2)' }}>
          👤 <strong>{ownerName}</strong> ({ownerEmail}) — ดูได้อย่างเดียว
        </div>
      )}

      {!viewOnly && (
        <div className="ts-type-tabs">
          <div className={`ts-type-tab work ${form.entryType === 'work' ? 'active' : ''}`} onClick={() => set('entryType', 'work')}>🧑‍💻 เข้างาน</div>
          <div className={`ts-type-tab leave ${form.entryType === 'leave' ? 'active' : ''}`} onClick={() => set('entryType', 'leave')}>🌴 ลา</div>
        </div>
      )}

      {form.entryType === 'work' ? (
        <>
          <div className="form-group">
            <label className="form-label">วันที่</label>
            <input type="date" className="form-input" value={form.date} onChange={e => set('date', e.target.value)} disabled={viewOnly} />
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">เวลาเข้างาน</label><input type="time" className="form-input" value={form.timeIn} onChange={e => set('timeIn', e.target.value)} disabled={viewOnly} /></div>
            <div className="form-group"><label className="form-label">เวลาออกงาน</label><input type="time" className="form-input" value={form.timeOut} onChange={e => set('timeOut', e.target.value)} disabled={viewOnly} /></div>
          </div>
          <div className="form-group">
            <label className="form-label">ลักษณะงาน</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className={`filter-btn ${form.workMode === 'non-project' ? 'active' : ''}`} onClick={() => set('workMode', 'non-project')} style={viewOnly ? { pointerEvents: 'none' } : {}}>🚫 Non-Project</span>
              <span className={`filter-btn ${form.workMode === 'project' ? 'active' : ''}`} onClick={() => set('workMode', 'project')} style={viewOnly ? { pointerEvents: 'none' } : {}}>📁 Project</span>
            </div>
          </div>
          {form.workMode === 'project' && (
            <div className="form-group">
              <label className="form-label">Project</label>
              <select className="form-select" value={form.projectId || ''} onChange={e => set('projectId', e.target.value)} disabled={viewOnly}>
                <option value="">— เลือก Project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">รายละเอียดงานที่ทำ</label>
            <textarea className="form-textarea" value={form.workDetail} onChange={e => set('workDetail', e.target.value)} placeholder="วันนี้ทำอะไรไปบ้าง..." disabled={viewOnly} />
          </div>
          {formErr && <div className="login-error" style={{ marginBottom: 10 }}>{formErr}</div>}
        </>
      ) : (
        <>
          <div className="form-group">
            <label className="form-label">ประเภทการลา</label>
            <select className="form-select" value={form.leaveType} onChange={e => set('leaveType', e.target.value)} disabled={viewOnly}>
              {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">ตั้งแต่วันที่</label><input type="date" className="form-input" value={form.leaveStart} onChange={e => set('leaveStart', e.target.value)} disabled={viewOnly} /></div>
            <div className="form-group"><label className="form-label">ถึงวันที่</label><input type="date" className="form-input" value={form.leaveEnd} onChange={e => set('leaveEnd', e.target.value)} disabled={viewOnly} /></div>
          </div>
          {!entry && !viewOnly && (
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: -8, marginBottom: 14 }}>
              ลาล่วงหน้าหรือย้อนหลังได้ — เลือกช่วงวันที่ได้ตามจริง ระบบจะบันทึกทีละวันให้อัตโนมัติ
            </div>
          )}
          <div className="form-group">
            <label className="form-label">เหตุผลในการลา</label>
            <textarea className="form-textarea" value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="ระบุเหตุผล..." disabled={viewOnly} />
          </div>
        </>
      )}

      <div className="modal-actions-split">
        {entry && perms.canDelete && !viewOnly ? <button className="btn btn-danger" onClick={del}>🗑 ลบ</button> : <div />}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>{viewOnly ? 'ปิด' : 'ยกเลิก'}</button>
          {!viewOnly && <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>}
        </div>
      </div>
    </Modal>
  );
}
