'use client';
import { useStore } from '../../../lib/StoreContext';
import DataGate from '../../../components/DataGate';

export default function PdDashboardPage() {
  return (
    <>
      <div className="topbar"><span className="topbar-title">PD Task · Dashboard</span></div>
      <div className="content"><DataGate><Body /></DataGate></div>
    </>
  );
}

function Body() {
  const { data } = useStore();
  const { pdTasks, pdIssues, pdBacklog, pdFeedback } = data;
  const total = pdTasks.length, done = pdTasks.filter(t => t.status === 'Done').length;
  const openIssues = pdIssues.filter(i => !['Resolved', 'Closed'].includes(i.status)).length;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card c1"><div className="stat-label">PD Tasks ทั้งหมด</div><div className="stat-value">{total}</div><div className="stat-sub">{done} เสร็จแล้ว</div><div className="stat-icon">🗂️</div></div>
        <div className="stat-card c4"><div className="stat-label">Issue เปิดอยู่</div><div className="stat-value">{openIssues}</div><div className="stat-sub">จาก {pdIssues.length} ทั้งหมด</div><div className="stat-icon">🐞</div></div>
        <div className="stat-card c3"><div className="stat-label">Backlog</div><div className="stat-value">{pdBacklog.length}</div><div className="stat-sub">รายการรอ</div><div className="stat-icon">📥</div></div>
        <div className="stat-card c2"><div className="stat-label">Feedback</div><div className="stat-value">{pdFeedback.length}</div><div className="stat-sub">ทั้งหมด</div><div className="stat-icon">💬</div></div>
      </div>
    </div>
  );
}
