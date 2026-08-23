'use client';
import { useMemo, useState } from 'react';
import { useStore } from '../lib/StoreContext';
import DataGate from '../components/DataGate';
import MiniCalendar from '../components/MiniCalendar';
import TaskModal from '../components/TaskModal';

export default function DashboardPage() {
  const [taskModal, setTaskModal] = useState(false);

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Dashboard</span>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => setTaskModal(true)}>＋ Task ใหม่</button>
        </div>
      </div>
      <div className="content">
        <DataGate>
          <DashboardBody />
        </DataGate>
      </div>
      <TaskModal open={taskModal} onClose={() => setTaskModal(false)} />
    </>
  );
}

function DashboardBody() {
  const { data, updateRow, toast } = useStore();
  const { projects, tasks } = data;

  const total = tasks.length, done = tasks.filter(t => t.done).length, pending = total - done;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const overdue = tasks.filter(t => !t.done && t.due && new Date(t.due) < now).length;

  async function toggle(t) {
    await updateRow('tasks', t.id, { done: !t.done });
    toast(!t.done ? '✅ เสร็จแล้ว!' : '↩️ ยกเลิกสถานะ');
  }

  const recent = useMemo(() => [...tasks].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6), [tasks]);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.due === todayStr);

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card c1"><div className="stat-label">Tasks ทั้งหมด</div><div className="stat-value">{total}</div><div className="stat-sub">ใน {projects.length} projects</div><div className="stat-icon">📋</div></div>
        <div className="stat-card c2"><div className="stat-label">เสร็จแล้ว</div><div className="stat-value">{done}</div><div className="stat-sub">{total > 0 ? Math.round(done / total * 100) + '% ของทั้งหมด' : '0%'}</div><div className="stat-icon">✅</div></div>
        <div className="stat-card c3"><div className="stat-label">กำลังทำ</div><div className="stat-value">{pending}</div><div className="stat-sub">ยังไม่เสร็จ</div><div className="stat-icon">⏳</div></div>
        <div className="stat-card c4"><div className="stat-label">เกินกำหนด</div><div className="stat-value">{overdue}</div><div className="stat-sub">ต้องรีบทำ!</div><div className="stat-icon">🔥</div></div>
      </div>
      <div className="dashboard-grid">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><span className="card-title">Progress ของ Projects</span></div>
            <div className="card-body">
              <div className="project-progress-list">
                {!projects.length && <div className="empty-state" style={{ padding: 20 }}><p>ยังไม่มี project</p></div>}
                {projects.map(p => {
                  const pt = tasks.filter(t => t.project === p.id);
                  const pd = pt.filter(t => t.done).length;
                  const pct = pt.length > 0 ? Math.round(pd / pt.length * 100) : 0;
                  return (
                    <div key={p.id}>
                      <div className="proj-progress-header">
                        <span className="proj-progress-name"><span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />{p.name}</span>
                        <span className="proj-progress-pct">{pd}/{pt.length} — {pct}%</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: p.color }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Tasks ล่าสุด</span></div>
            <div className="card-body" style={{ padding: '8px 12px' }}>
              <div className="recent-tasks">
                {!recent.length && <div className="empty-state" style={{ padding: 16 }}><p>ยังไม่มี task</p></div>}
                {recent.map(t => {
                  const proj = projects.find(p => p.id === t.project);
                  return (
                    <div key={t.id} className="recent-task-item" onClick={() => toggle(t)}>
                      <div className={`task-check ${t.done ? 'done' : ''}`} />
                      <span className={`task-text ${t.done ? 'done' : ''}`}>{t.name}</span>
                      {proj && <span className="tag" style={{ background: proj.color + '22', color: proj.color, fontSize: 10, padding: '2px 7px', borderRadius: 20 }}>{proj.name}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><span className="card-title">ปฏิทิน</span></div>
            <div className="card-body"><MiniCalendar tasks={tasks} /></div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Tasks วันนี้</span></div>
            <div className="card-body" style={{ padding: '8px 12px' }}>
              {!todayTasks.length && <div className="empty-state" style={{ padding: 16 }}><p style={{ fontSize: 12 }}>ไม่มี task วันนี้ 🎉</p></div>}
              {todayTasks.map(t => (
                <div key={t.id} className="recent-task-item" onClick={() => toggle(t)}>
                  <div className={`task-check ${t.done ? 'done' : ''}`} />
                  <span className={`task-text ${t.done ? 'done' : ''}`} style={{ fontSize: 12 }}>{t.name}</span>
                  <span className={`priority-badge ${t.priority === 'high' ? 'p-high' : t.priority === 'medium' ? 'p-med' : 'p-low'}`} style={{ fontSize: 9 }}>
                    {t.priority === 'high' ? 'HIGH' : t.priority === 'medium' ? 'MED' : 'LOW'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
