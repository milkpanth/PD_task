'use client';
import { useState } from 'react';
import { useStore } from '../../lib/StoreContext';
import { useAuth } from '../../lib/AuthContext';
import DataGate from '../../components/DataGate';
import ProjectModal from '../../components/ProjectModal';

const STATUS_LABEL = { active: 'กำลังดำเนินการ', hold: 'รอดำเนินการ', done: 'เสร็จสิ้น' };
const STATUS_CLASS = { active: 'status-active', hold: 'status-hold', done: 'status-done' };

export default function ProjectsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);

  function openAdd() { setEditProject(null); setModalOpen(true); }
  function openEdit(p) { setEditProject(p); setModalOpen(true); }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Project Overview</span>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={openAdd}>＋ Project ใหม่</button>
        </div>
      </div>
      <div className="content">
        <DataGate><ProjectsBody onEdit={openEdit} /></DataGate>
      </div>
      <ProjectModal open={modalOpen} onClose={() => setModalOpen(false)} project={editProject} />
    </>
  );
}

function ProjectsBody({ onEdit }) {
  const { data, confirm, deleteRow, toast } = useStore();
  const { perms } = useAuth();
  const { projects, tasks } = data;

  function del(p) {
    const tc = tasks.filter(t => t.project === p.id).length;
    confirm(`ลบ Project "${p.name}"?`, `คุณแน่ใจหรือไม่? tasks ${tc} รายการในโปรเจกต์นี้จะถูกลบด้วย`, async () => {
      await deleteRow('projects', p.id);
      toast('🗑️ ลบ project แล้ว');
    });
  }

  return (
    <div className="projects-page">
      <div className="projects-grid">
        {!projects.length && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="emoji">📂</div><p>ยังไม่มี project — กด &quot;+ Project ใหม่&quot; เพื่อเริ่ม</p>
          </div>
        )}
        {projects.map(p => {
          const pt = tasks.filter(t => t.project === p.id);
          const pd = pt.filter(t => t.done).length;
          const pct = pt.length > 0 ? Math.round(pd / pt.length * 100) : 0;
          const ed = p.end ? new Date(p.end).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
          return (
            <div key={p.id} className="project-card">
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: p.color }} />
              <div className="proj-card-actions">
                <button className="proj-card-action" onClick={() => onEdit(p)}>✎</button>
                {perms.canDelete && <button className="proj-card-action del" onClick={() => del(p)}>🗑</button>}
              </div>
              <a href={`/project/${p.id}`} style={{ display: 'block' }}>
                <div className="proj-card-header">
                  <span className="proj-card-icon">{p.emoji || '📁'}</span>
                  <span className={`proj-card-status ${STATUS_CLASS[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                </div>
                <div className="proj-card-name">{p.name}</div>
                <div className="proj-card-desc">{p.desc || 'ไม่มีรายละเอียด'}</div>
                <div className="proj-card-stats">
                  <div className="proj-stat"><div className="proj-stat-val" style={{ color: p.color }}>{pt.length}</div><div className="proj-stat-lbl">tasks ทั้งหมด</div></div>
                  <div className="proj-stat"><div className="proj-stat-val" style={{ color: 'var(--green)' }}>{pd}</div><div className="proj-stat-lbl">เสร็จแล้ว</div></div>
                  <div className="proj-stat"><div className="proj-stat-val">{pct}%</div><div className="proj-stat-lbl">progress</div></div>
                </div>
                <div className="proj-card-progress"><div className="proj-card-fill" style={{ width: `${pct}%`, background: p.color }} /></div>
                <div className="proj-card-footer">
                  <span className="proj-card-due">🎯 {ed}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{pt.length - pd} งานค้าง</span>
                </div>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
