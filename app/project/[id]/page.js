'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '../../../lib/StoreContext';
import { useAuth } from '../../../lib/AuthContext';
import DataGate from '../../../components/DataGate';
import DevTaskModal from '../../../components/DevTaskModal';
import WbsModal from '../../../components/WbsModal';
import GenericTable from '../../../components/GenericTable';

const TABS = [
  { key: 'devtasks', icon: '🗂️', label: 'Dev Task' },
  { key: 'wbs', icon: '📊', label: 'WBS' },
  { key: 'requirement', icon: '📋', label: 'Requirement' },
  { key: 'sprint', icon: '🏁', label: 'Sprint' },
  { key: 'member', icon: '👥', label: 'Member' },
  { key: 'defect', icon: '🐞', label: 'Defect' },
  { key: 'changelog', icon: '🔀', label: 'Change Log' },
];

const STATUS_LABEL = { active: 'กำลังดำเนินการ', hold: 'รอดำเนินการ', done: 'เสร็จสิ้น' };
const STATUS_CLASS = { active: 'status-active', hold: 'status-hold', done: 'status-done' };
const TYPE_CLASS = { feature: 'type-feature', bug: 'type-bug', task: 'type-task', improve: 'type-improve' };
const DT_STATUS_LABEL = { todo: 'To Do', inprogress: 'In Progress', review: 'Review', donedt: 'Done', blocked: 'Blocked' };
const DT_STATUS_CLASS = { todo: 'status-todo', inprogress: 'status-inprogress', review: 'status-review', donedt: 'status-donedt', blocked: 'status-blocked' };

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { data } = useStore();
  const [tab, setTab] = useState('devtasks');

  return (
    <>
      <div className="topbar"><span className="topbar-title">Project Workspace</span></div>
      <div className="content">
        <DataGate>
          <Body id={params.id} tab={tab} setTab={setTab} router={router} />
        </DataGate>
      </div>
    </>
  );
}

function Body({ id, tab, setTab, router }) {
  const { data } = useStore();
  const { canAccessProject } = useAuth();
  const project = data.projects.find(p => p.id === id);

  if (!project) {
    return (
      <div className="empty-state" style={{ padding: 48 }}>
        <div className="emoji">🔍</div><p>ไม่พบ project นี้</p>
        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => router.push('/projects')}>← กลับไปหน้า Project</button>
      </div>
    );
  }

  if (!canAccessProject(id)) {
    return (
      <div className="empty-state" style={{ padding: 48 }}>
        <div className="emoji">🔒</div><p>คุณไม่ได้รับสิทธิ์เข้าถึง project นี้</p>
        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => router.push('/projects')}>← กลับไปหน้า Project</button>
      </div>
    );
  }

  const pt = data.tasks.filter(t => t.project === id);
  const pd = pt.filter(t => t.done).length;
  const dt = data.devTasks.filter(t => t.project === id);

  return (
    <div className="project-page">
      <div className="proj-head">
        <span className="proj-head-icon" style={{ background: project.color + '22', color: project.color }}>{project.emoji || '📁'}</span>
        <div style={{ flex: 1 }}>
          <div className="proj-head-name">{project.name}</div>
          <div className="proj-head-desc">{project.desc || 'ไม่มีรายละเอียด'}</div>
          <div className="proj-head-meta">
            <span className={`proj-card-status ${STATUS_CLASS[project.status]}`}>{STATUS_LABEL[project.status]}</span>
            {project.start && <span>🎯 {new Date(project.start).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} — {project.end ? new Date(project.end).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>}
          </div>
        </div>
        <div className="proj-head-stat"><div className="proj-head-stat-val">{pt.length}</div><div className="proj-head-stat-lbl">Tasks</div></div>
        <div className="proj-head-stat"><div className="proj-head-stat-val">{pd}</div><div className="proj-head-stat-lbl">เสร็จแล้ว</div></div>
        <div className="proj-head-stat"><div className="proj-head-stat-val">{dt.length}</div><div className="proj-head-stat-lbl">Dev Tasks</div></div>
      </div>

      <div className="tab-bar">
        {TABS.map(t => (
          <div key={t.key} className={`tab-item ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.icon} {t.label}</div>
        ))}
      </div>

      {tab === 'devtasks' && <DevTasksTab projectId={id} />}
      {tab === 'wbs' && <WbsTab projectId={id} />}
      {tab === 'requirement' && <GenericTab type="requirement" projectId={id} label="Requirement" />}
      {tab === 'sprint' && <GenericTab type="sprint" projectId={id} label="Sprint" />}
      {tab === 'member' && <GenericTab type="member" projectId={id} label="Member" />}
      {tab === 'defect' && <GenericTab type="defect" projectId={id} label="Defect" />}
      {tab === 'changelog' && <GenericTab type="changelog" projectId={id} label="Change Log" />}
    </div>
  );
}

function DevTasksTab({ projectId }) {
  const { data, confirm, deleteRow, toast } = useStore();
  const { perms } = useAuth();
  const rows = data.devTasks.filter(t => t.project === projectId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  function openAdd() { setEditRow(null); setModalOpen(true); }
  function openEdit(r) { setEditRow(r); setModalOpen(true); }
  function del(r) {
    confirm('ลบ Dev Task นี้?', 'การลบจะไม่สามารถกู้คืนได้', async () => {
      await deleteRow('devTasks', r.id);
      toast('🗑️ ลบแล้ว');
    });
  }

  return (
    <div className="proj-view active">
      <div className="proj-toolbar">
        <span className="proj-toolbar-title">รายการ Dev Task ของ project นี้ (No. running อัตโนมัติ)</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={openAdd}>＋ Dev Task ใหม่</button>
        </div>
      </div>
      <div className="devtask-scroll">
        {!rows.length ? (
          <div className="empty-state"><div className="emoji">🗂️</div><p>ยังไม่มี Dev Task</p></div>
        ) : (
          <table className="devtask-table">
            <thead>
              <tr>
                <th>No.</th><th>Children Ticket</th><th>Sprint</th><th>Module</th><th>Function</th>
                <th>Task Name</th><th>Description</th><th>Feature</th><th>Type</th><th>Priority</th>
                <th>Assignee</th><th>Progress</th><th>Status</th><th>Remark</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>
                    {r.opUrl
                      ? (
                        <a href={r.opUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                          🔗 {r.ticket || `#${r.opTicketId}`}
                          {r.opParentId && <span style={{ display: 'block', fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>↳ child of #{r.opParentId}</span>}
                        </a>
                      )
                      : (r.ticket || '-')}
                  </td>
                  <td>{r.sprint || '-'}</td>
                  <td>{r.module || '-'}</td>
                  <td>{r.func || '-'}</td>
                  <td>{r.name}</td>
                  <td className="dtd-cell">{r.desc || '-'}</td>
                  <td>{r.opFeature || '-'}</td>
                  <td><span className={`badge-pill ${TYPE_CLASS[r.type] || 'type-task'}`}>{r.type}</span></td>
                  <td><span className={`priority-badge ${r.opPriority === 'High' || r.opPriority === 'Immediate' ? 'p-high' : r.opPriority === 'Low' ? 'p-low' : 'p-med'}`}>{(r.opPriority || 'Normal').toUpperCase()}</span></td>
                  <td>{r.opAssignee || '-'}</td>
                  <td>{r.opProgress != null ? `${r.opProgress}%` : '-'}</td>
                  <td><span className={`badge-pill ${DT_STATUS_CLASS[r.status] || 'status-todo'}`}>{DT_STATUS_LABEL[r.status] || r.status}</span></td>
                  <td>{r.remark || '-'}</td>
                  <td>
                    <div className="dt-row-actions">
                      <button className="task-action-btn" onClick={() => openEdit(r)}>✎</button>
                      {perms.canDelete && <button className="task-action-btn del" onClick={() => del(r)}>✕</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <DevTaskModal open={modalOpen} onClose={() => setModalOpen(false)} task={editRow} projectId={projectId} />
    </div>
  );
}

function WbsTab({ projectId }) {
  const { data, confirm, deleteRow, toast } = useStore();
  const { perms } = useAuth();
  const rows = [...data.wbs.filter(r => r.project === projectId)].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  function openAdd() { setEditRow(null); setModalOpen(true); }
  function openEdit(r) { setEditRow(r); setModalOpen(true); }
  function del(r) {
    confirm('ลบแถวนี้?', 'การลบจะไม่สามารถกู้คืนได้', async () => {
      await deleteRow('wbs', r.id);
      toast('🗑️ ลบแล้ว');
    });
  }

  return (
    <div className="proj-view active">
      <div className="proj-toolbar">
        <span className="proj-toolbar-title">โครงสร้าง WBS (Plan / Actual / Progress)</span>
        <button className="btn btn-primary" onClick={openAdd}>＋ แถวใหม่</button>
      </div>
      <div className="wbs-legend">
        <span className="legend-sw" style={{ background: 'var(--accent)' }} /> Plan
        <span className="legend-sw" style={{ background: 'var(--green)', marginLeft: 12 }} /> Actual
      </div>
      <div className="devtask-scroll">
        {!rows.length ? (
          <div className="empty-state"><div className="emoji">📊</div><p>ยังไม่มีแถว WBS</p></div>
        ) : (
          <table className="wbs-table">
            <thead>
              <tr>
                <th>No.</th><th>Detail</th><th>PIC</th><th>Plan Start</th><th>Plan End</th>
                <th>Actual Start</th><th>Actual End</th><th>Progress</th><th>Remark</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: r.level === 'header' ? 700 : r.level === 'main' ? 600 : 400, paddingLeft: r.level === 'sub' ? 24 : 12 }}>{r.name}</td>
                  <td>{r.pic || '-'}</td>
                  <td>{r.planStart || '-'}</td>
                  <td>{r.planEnd || '-'}</td>
                  <td>{r.actualStart || '-'}</td>
                  <td>{r.actualEnd || '-'}</td>
                  <td style={{ minWidth: 110 }}>
                    <div className="progress-bar" style={{ display: 'inline-block', width: 70, verticalAlign: 'middle' }}>
                      <div className="progress-fill" style={{ width: `${r.progress || 0}%`, background: 'var(--green)' }} />
                    </div>
                    <span style={{ fontSize: 11, marginLeft: 6 }}>{r.progress || 0}%</span>
                  </td>
                  <td>{r.remark || '-'}</td>
                  <td>
                    <div className="dt-row-actions">
                      <button className="task-action-btn" onClick={() => openEdit(r)}>✎</button>
                      {perms.canDelete && <button className="task-action-btn del" onClick={() => del(r)}>✕</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <WbsModal open={modalOpen} onClose={() => setModalOpen(false)} row={editRow} projectId={projectId} nextOrder={rows.length} />
    </div>
  );
}

function GenericTab({ type, projectId, label }) {
  const { openGenericAdd } = useStore();
  return (
    <div className="proj-view active">
      <div className="proj-toolbar">
        <span className="proj-toolbar-title">รายการ {label} ของ project นี้</span>
        <button className="btn btn-primary" onClick={() => openGenericAdd(type, null, projectId)}>＋ {label} ใหม่</button>
      </div>
      <div className="devtask-scroll"><GenericTable type={type} projectId={projectId} /></div>
    </div>
  );
}
