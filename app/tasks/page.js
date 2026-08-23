'use client';
import { useMemo, useState } from 'react';
import { useStore } from '../../lib/StoreContext';
import { useAuth } from '../../lib/AuthContext';
import DataGate from '../../components/DataGate';
import TaskModal from '../../components/TaskModal';

const FILTERS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'todo', label: 'ยังไม่ทำ' },
  { key: 'done', label: 'เสร็จแล้ว' },
  { key: 'high', label: '🔴 สำคัญมาก' },
  { key: 'overdue', label: '⚠️ เกินกำหนด' },
];
const VIEWS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'daily', label: 'วันนี้' },
  { key: 'weekly', label: 'สัปดาห์นี้' },
  { key: 'monthly', label: 'เดือนนี้' },
];

export default function TasksPage() {
  const [taskModal, setTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  function openEdit(t) { setEditTask(t); setTaskModal(true); }
  function openAdd() { setEditTask(null); setTaskModal(true); }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">All Tasks</span>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={openAdd}>＋ Task ใหม่</button>
        </div>
      </div>
      <div className="content">
        <DataGate>
          <TasksBody onEdit={openEdit} />
        </DataGate>
      </div>
      <TaskModal open={taskModal} onClose={() => setTaskModal(false)} task={editTask} />
    </>
  );
}

function TasksBody({ onEdit }) {
  const { data, updateRow, deleteRow, confirm, toast } = useStore();
  const { perms } = useAuth();
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    let tasks = [...data.tasks];
    if (view === 'daily') { const td = new Date().toISOString().split('T')[0]; tasks = tasks.filter(t => t.type === 'daily' || t.due === td); }
    else if (view === 'weekly') tasks = tasks.filter(t => t.type === 'weekly' || t.type === 'daily');
    else if (view === 'monthly') tasks = tasks.filter(t => t.type === 'monthly');
    if (filter === 'todo') tasks = tasks.filter(t => !t.done);
    else if (filter === 'done') tasks = tasks.filter(t => t.done);
    else if (filter === 'high') tasks = tasks.filter(t => t.priority === 'high');
    else if (filter === 'overdue') tasks = tasks.filter(t => !t.done && t.due && new Date(t.due) < now);
    if (search) tasks = tasks.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    return tasks;
  }, [data.tasks, filter, view, search]);

  const pending = filtered.filter(t => !t.done);
  const done = filtered.filter(t => t.done);

  async function toggle(t) { await updateRow('tasks', t.id, { done: !t.done }); toast(!t.done ? '✅ เสร็จแล้ว!' : '↩️ ยกเลิกสถานะ'); }
  function del(t) { confirm('ลบ Task นี้?', 'การลบจะไม่สามารถกู้คืนได้', async () => { await deleteRow('tasks', t.id); toast('🗑️ ลบ task แล้ว'); }); }

  function TaskRow({ t }) {
    const proj = data.projects.find(p => p.id === t.project);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const ov = !t.done && t.due && new Date(t.due) < now;
    const tl = { daily: '📅 Daily', weekly: '📆 Weekly', monthly: '🗓️ Monthly' }[t.type] || '';
    const df = t.due ? new Date(t.due).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '';
    return (
      <div className={`task-item ${t.done ? 'done-item' : ''}`}>
        <div className={`task-checkbox ${t.done ? 'checked' : ''}`} onClick={() => toggle(t)} />
        <div className="task-content" onClick={() => onEdit(t)}>
          <div className={`task-title ${t.done ? 'done' : ''}`}>{t.name}</div>
          <div className="task-info">
            {proj && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: proj.color + '22', color: proj.color, fontWeight: 500 }}>{proj.name}</span>}
            <span className="tag" style={{ background: 'rgba(28,58,99,0.15)', color: 'var(--accent)' }}>{tl}</span>
            {df && <span className={`task-date ${ov ? 'overdue' : ''}`}>📅 {df}{ov ? ' ⚠️' : ''}</span>}
          </div>
        </div>
        <div className="task-right">
          <span className={`priority-badge ${t.priority === 'high' ? 'p-high' : t.priority === 'medium' ? 'p-med' : 'p-low'}`}>
            {t.priority === 'high' ? 'HIGH' : t.priority === 'medium' ? 'MED' : 'LOW'}
          </span>
          <div className="task-actions">
            <button className="task-action-btn" onClick={() => onEdit(t)}>✎</button>
            {perms.canDelete && <button className="task-action-btn del" onClick={() => del(t)}>✕</button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <div className="task-filters">
        {FILTERS.map(f => (
          <div key={f.key} className={`filter-btn ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</div>
        ))}
        <input className="search-input" placeholder="🔍  ค้นหา task..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginLeft: 'auto', maxWidth: 220 }} />
      </div>
      <div style={{ padding: '10px 24px 0' }}>
        <div className="view-toggle" style={{ display: 'inline-flex' }}>
          {VIEWS.map(v => (
            <div key={v.key} className={`view-btn ${view === v.key ? 'active' : ''}`} onClick={() => setView(v.key)}>{v.label}</div>
          ))}
        </div>
      </div>
      <div className="tasks-list">
        {!filtered.length && <div className="empty-state"><div className="emoji">🎯</div><p>ไม่พบ task ที่ตรงกัน</p></div>}
        {!!pending.length && <div className="task-group-label">กำลังทำ ({pending.length})</div>}
        {pending.map(t => <TaskRow key={t.id} t={t} />)}
        {!!done.length && <div className="task-group-label" style={{ marginTop: 8 }}>เสร็จแล้ว ({done.length})</div>}
        {done.map(t => <TaskRow key={t.id} t={t} />)}
      </div>
    </div>
  );
}
