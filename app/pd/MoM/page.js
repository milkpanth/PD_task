'use client';
import { useMemo, useState } from 'react';
import { useStore } from '../../../lib/StoreContext';
import { useAuth } from '../../../lib/AuthContext';
import DataGate from '../../../components/DataGate';

function toISO(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function MomPage() {
  return (
    <>
      <div className="topbar"><span className="topbar-title">PD Task · MoM (Minutes of Meeting)</span></div>
      <div className="content"><DataGate><Body /></DataGate></div>
    </>
  );
}

function emptyMom() {
  return {
    subject: '',
    meetingDate: toISO(new Date()),
    meetingTime: '10:00',
    minutesBy: '',
    attendees: '',
    topic: '',
    decision: '',
    nextActions: '',
    remark: '',
  };
}

function Body() {
  const { data, addRow, updateRow, deleteRow, toast, confirm } = useStore();
  const { session } = useAuth();
  const moms = useMemo(() => (data.pdMom || []).sort((a, b) => (b.meetingDate || '').localeCompare(a.meetingDate || '')), [data.pdMom]);

  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyMom());
  const [saving, setSaving] = useState(false);

  const selectedMom = moms.find(m => m.id === selectedId);

  function selectMom(m) {
    setSelectedId(m.id);
    setForm({
      subject: m.subject || '',
      meetingDate: m.meetingDate || '',
      meetingTime: m.meetingTime || '',
      minutesBy: m.minutesBy || '',
      attendees: m.attendees || '',
      topic: m.topic || '',
      decision: m.decision || '',
      nextActions: m.nextActions || '',
      remark: m.remark || '',
    });
  }

  function newMom() {
    setSelectedId(null);
    setForm(emptyMom());
  }

  async function save() {
    if (!form.subject.trim()) return;
    setSaving(true);
    try {
      if (selectedId) {
        await updateRow('pdMom', selectedId, form);
        toast('✏️ อัปเดต MoM แล้ว');
      } else {
        const owner = { userId: session?.user?.id, userEmail: session?.user?.email };
        const res = await addRow('pdMom', { ...form, ...owner });
        if (res?.id) setSelectedId(res.id);
        toast('✅ สร้าง MoM ใหม่แล้ว');
      }
    } finally {
      setSaving(false);
    }
  }

  function del() {
    if (!selectedId) return;
    confirm('ลบ MoM นี้?', `"${form.subject}" จะถูกลบถาวร`, async () => {
      await deleteRow('pdMom', selectedId);
      toast('🗑️ ลบแล้ว');
      newMom();
    });
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="mom-layout">
      {/* List panel */}
      <div className="mom-list-panel">
        <div className="mom-list-header">
          <span className="mom-list-title">รายการ MoM ({moms.length})</span>
          <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={newMom}>＋ ใหม่</button>
        </div>
        <div className="mom-list-scroll">
          {!moms.length && <div style={{ padding: 16, fontSize: 12, color: 'var(--text3)' }}>ยังไม่มี MoM — กด "＋ ใหม่" เพื่อเริ่ม</div>}
          {moms.map(m => (
            <div key={m.id} className={`mom-list-item ${selectedId === m.id ? 'active' : ''}`} onClick={() => selectMom(m)}>
              <div className="mom-list-item-subject">{m.subject || '(ไม่มีหัวข้อ)'}</div>
              <div className="mom-list-item-date">{m.meetingDate || '-'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Note panel */}
      <div className="mom-note-panel">
        <div className="mom-note-header">
          <span style={{ fontWeight: 700, fontSize: 14 }}>{selectedId ? '✎ แก้ไข MoM' : '📝 MoM ใหม่'}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedId && <button className="btn btn-danger" style={{ fontSize: 12 }} onClick={del}>🗑 ลบ</button>}
            <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={save} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </div>
        <div className="mom-note-body">
          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input className="form-input" value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="หัวข้อการประชุม" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Meeting Date</label>
              <input type="date" className="form-input" value={form.meetingDate} onChange={e => set('meetingDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Meeting Time</label>
              <input type="time" className="form-input" value={form.meetingTime} onChange={e => set('meetingTime', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Minutes by</label>
              <input className="form-input" value={form.minutesBy} onChange={e => set('minutesBy', e.target.value)} placeholder="ผู้จดบันทึก" />
            </div>
            <div className="form-group">
              <label className="form-label">Attendees</label>
              <input className="form-input" value={form.attendees} onChange={e => set('attendees', e.target.value)} placeholder="ผู้เข้าร่วม (คั่นด้วย ,)" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Topic</label>
            <textarea className="form-textarea" rows={3} value={form.topic} onChange={e => set('topic', e.target.value)} placeholder="หัวข้อที่พูดคุย" />
          </div>
          <div className="form-group">
            <label className="form-label">Decision</label>
            <textarea className="form-textarea" rows={3} value={form.decision} onChange={e => set('decision', e.target.value)} placeholder="สิ่งที่ตัดสินใจ" />
          </div>
          <div className="form-group">
            <label className="form-label">Next Actions</label>
            <textarea className="form-textarea" rows={3} value={form.nextActions} onChange={e => set('nextActions', e.target.value)} placeholder="สิ่งที่ต้องทำต่อ" />
          </div>
          <div className="form-group">
            <label className="form-label">Remark</label>
            <textarea className="form-textarea" rows={2} value={form.remark} onChange={e => set('remark', e.target.value)} placeholder="หมายเหตุ" />
          </div>
        </div>
      </div>
    </div>
  );
}
