'use client';
import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useStore } from '../lib/StoreContext';
import { useAuth } from '../lib/AuthContext';

const EMPTY = {
  // Section 1 — Task (TaskFlow's own tracking, drives the board/table)
  ticket: '', sprint: '', module: '', func: '', name: '', desc: '',
  type: 'feature', status: 'todo', remark: '',
  opTicketId: null, opParentId: null, opUrl: '',
  // Section 2 — Open Project (mirrors an OpenProject ticket's own fields)
  opFeature: '', opPriority: 'Normal', opInformer: '', opCustomer: '',
  opPlatform: '', opEditedVersion: '', opApproval: 'New',
  opStartDate: '', opFinishDate: '', opEstimatedDate: '',
  opAssignee: '', opAssignees: '', opProgress: 0, opLevel: '',
  opFinishedVersion: '', opCloseDate: '', opCaseLevel: '', opReOpen: '', opReTest: '',
};

export default function DevTaskModal({ open, onClose, task, projectId, presetStatus }) {
  const { data, addRow, updateRow, deleteRow, confirm, toast } = useStore();
  const { perms } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [syncing, setSyncing] = useState(false);
  const [syncErr, setSyncErr] = useState('');

  const project = (data.projects || []).find(p => p.id === projectId);
  const openProjectId = project?.openProjectId;

  useEffect(() => {
    if (!open) return;
    setSyncErr('');
    if (task) setForm({ ...EMPTY, ...task });
    else setForm({ ...EMPTY, status: presetStatus || 'todo' });
  }, [open, task, presetStatus]);

  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim()) return;
    const payload = { ...form, project: projectId, opProgress: Number(form.opProgress) || 0 };
    if (task) { await updateRow('devTasks', task.id, payload); toast('✏️ อัปเดต dev task แล้ว'); }
    else { await addRow('devTasks', payload); toast('✅ เพิ่ม dev task แล้ว'); }
    onClose();
  }

  function del() {
    confirm('ลบ Dev Task นี้?', 'การลบจะไม่สามารถกู้คืนได้', async () => {
      await deleteRow('devTasks', task.id);
      toast('🗑️ ลบแล้ว');
      onClose();
    });
  }

  async function syncToOpenProject() {
    if (!task || !openProjectId || !form.name.trim()) return;
    setSyncErr('');
    setSyncing(true);
    try {
      const res = await fetch('/api/openproject/create-work-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openProjectId, title: form.name, description: form.desc,
          parentTicketId: form.opParentId || undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'sync ไม่สำเร็จ');
      const patch = { ticket: `#${json.opTicketId}`, opTicketId: json.opTicketId, opUrl: json.opUrl };
      setForm(f => ({ ...f, ...patch }));
      await updateRow('devTasks', task.id, patch);
      toast(form.opParentId ? `🔗 สร้าง Children Ticket ของ #${form.opParentId} แล้ว` : '🔗 สร้าง ticket บน OpenProject แล้ว');
    } catch (e) {
      setSyncErr(e.message || 'sync ไม่สำเร็จ');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} width="620px">
      <div className="modal-title">{task ? '✎ แก้ไข Dev Task' : '🗂️ Dev Task ใหม่'}</div>

      {/* ── Section 1: Task ─────────────────────────────────────── */}
      <div className="modal-section-title">Task</div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Children Ticket</label>
          {form.opTicketId ? (
            <>
              <a href={form.opUrl} target="_blank" rel="noreferrer" className="form-input" style={{ display: 'block', textDecoration: 'none', color: 'var(--accent)', fontWeight: 600 }}>
                🔗 #{form.opTicketId} — เปิดใน OpenProject
              </a>
              {form.opParentId && (
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>↳ Child ของ ticket #{form.opParentId}</div>
              )}
            </>
          ) : task && openProjectId ? (
            <>
              <input
                type="number" className="form-input" value={form.opParentId || ''}
                onChange={e => set('opParentId', e.target.value ? Number(e.target.value) : null)}
                placeholder="Parent Ticket ID เช่น 8795 (Feature)" style={{ marginBottom: 6 }}
              />
              <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={syncToOpenProject} disabled={syncing || !form.name.trim()}>
                {syncing ? 'กำลัง sync...' : '🔄 Sync เป็น Children Ticket'}
              </button>
            </>
          ) : (
            <input
              className="form-input" value={form.ticket} onChange={e => set('ticket', e.target.value)}
              placeholder={task ? 'Project นี้ยังไม่ได้ผูกกับ OpenProject' : 'บันทึกก่อน แล้วค่อย sync ได้'}
            />
          )}
          {syncErr && <div className="login-error" style={{ marginTop: 6 }}>{syncErr}</div>}
        </div>
        <div className="form-group"><label className="form-label">Sprint</label><input className="form-input" value={form.sprint} onChange={e => set('sprint', e.target.value)} placeholder="เช่น Sprint 5" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Module</label><input className="form-input" value={form.module} onChange={e => set('module', e.target.value)} placeholder="เช่น Subscription" /></div>
        <div className="form-group"><label className="form-label">Function</label><input className="form-input" value={form.func} onChange={e => set('func', e.target.value)} placeholder="เช่น Payment History" /></div>
      </div>
      <div className="form-group"><label className="form-label">Task Name *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="ชื่อ task" /></div>
      <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="รายละเอียด..." /></div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Type</label>
          <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="feature">Feature</option><option value="bug">Bug</option><option value="task">Task</option><option value="improve">Improvement</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="todo">To Do</option><option value="inprogress">In Progress</option><option value="review">Review</option><option value="donedt">Done</option><option value="blocked">Blocked</option>
          </select>
        </div>
      </div>
      <div className="form-group"><label className="form-label">Remark</label><input className="form-input" value={form.remark} onChange={e => set('remark', e.target.value)} placeholder="หมายเหตุ" /></div>

      {/* ── Section 2: Open Project ─────────────────────────────── */}
      <div className="modal-section-title">Open Project — รายละเอียด</div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Feature</label><input className="form-input" value={form.opFeature} onChange={e => set('opFeature', e.target.value)} placeholder="เช่น Hourly Sale" /></div>
        <div className="form-group">
          <label className="form-label">ระดับความสำคัญ</label>
          <select className="form-select" value={form.opPriority} onChange={e => set('opPriority', e.target.value)}>
            <option value="Low">Low</option><option value="Normal">Normal</option><option value="High">High</option><option value="Immediate">Immediate</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Informer</label><input className="form-input" value={form.opInformer} onChange={e => set('opInformer', e.target.value)} placeholder="-" /></div>
        <div className="form-group"><label className="form-label">Customer</label><input className="form-input" value={form.opCustomer} onChange={e => set('opCustomer', e.target.value)} placeholder="-" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Platform</label><input className="form-input" value={form.opPlatform} onChange={e => set('opPlatform', e.target.value)} placeholder="เช่น Webbase" /></div>
        <div className="form-group"><label className="form-label">Edited version</label><input className="form-input" value={form.opEditedVersion} onChange={e => set('opEditedVersion', e.target.value)} placeholder="-" /></div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Approval</label>
          <select className="form-select" value={form.opApproval} onChange={e => set('opApproval', e.target.value)}>
            <option value="New">New</option>
            <option value="Waiting for Review">Waiting for Review</option>
            <option value="Approved">Approved</option>
            <option value="Revise">Revise</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div />
      </div>

      <div className="modal-section-title">Estimates and Time</div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">วันที่ (เริ่มต้น - เสร็จสิ้น)</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="date" className="form-input" value={form.opStartDate || ''} onChange={e => set('opStartDate', e.target.value)} />
            <input type="date" className="form-input" value={form.opFinishDate || ''} onChange={e => set('opFinishDate', e.target.value)} />
          </div>
        </div>
        <div className="form-group"><label className="form-label">Estimated date</label><input type="date" className="form-input" value={form.opEstimatedDate || ''} onChange={e => set('opEstimatedDate', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">ผู้ได้รับมอบหมาย</label><input className="form-input" value={form.opAssignee} onChange={e => set('opAssignee', e.target.value)} placeholder="ชื่อผู้รับผิดชอบหลัก" /></div>
        <div className="form-group"><label className="form-label">Assignees</label><input className="form-input" value={form.opAssignees} onChange={e => set('opAssignees', e.target.value)} placeholder="คั่นด้วย , ถ้ามีหลายคน" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Progress (%)</label><input type="number" min="0" max="100" className="form-input" value={form.opProgress} onChange={e => set('opProgress', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Level</label><input className="form-input" value={form.opLevel} onChange={e => set('opLevel', e.target.value)} placeholder="เช่น Basic" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Finished version</label><input className="form-input" value={form.opFinishedVersion} onChange={e => set('opFinishedVersion', e.target.value)} placeholder="-" /></div>
        <div className="form-group"><label className="form-label">Close Date</label><input type="date" className="form-input" value={form.opCloseDate || ''} onChange={e => set('opCloseDate', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Case Level</label><input className="form-input" value={form.opCaseLevel} onChange={e => set('opCaseLevel', e.target.value)} placeholder="เช่น Normal" /></div>
        <div />
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Re-Open</label><input className="form-input" value={form.opReOpen} onChange={e => set('opReOpen', e.target.value)} placeholder="-" /></div>
        <div className="form-group"><label className="form-label">Re-Test</label><input className="form-input" value={form.opReTest} onChange={e => set('opReTest', e.target.value)} placeholder="-" /></div>
      </div>

      <div className="modal-actions-split">
        {task && perms.canDelete ? <button className="btn btn-danger" onClick={del}>🗑 ลบ</button> : <div />}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={save}>บันทึก</button>
        </div>
      </div>
    </Modal>
  );
}
