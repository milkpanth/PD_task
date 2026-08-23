'use client';
import { useState } from 'react';
import { useStore } from '../../../lib/StoreContext';
import { useAuth } from '../../../lib/AuthContext';
import DataGate from '../../../components/DataGate';
import AccountModal from '../../../components/AccountModal';

export default function AccountPage() {
  const { perms } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState(null);

  function openAdd() { setEditAccount(null); setModalOpen(true); }
  function openEdit(a) { setEditAccount(a); setModalOpen(true); }

  if (!perms.canAccessAdmin) {
    return (
      <>
        <div className="topbar"><span className="topbar-title">Admin · Account</span></div>
        <div className="content">
          <div className="empty-state" style={{ padding: 48 }}>
            <div className="emoji">🔒</div><p>คุณไม่ได้รับสิทธิ์เข้าถึงส่วนนี้</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Admin · Account</span>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={openAdd}>＋ Account ใหม่</button>
        </div>
      </div>
      <div className="content">
        <DataGate><Body onEdit={openEdit} /></DataGate>
      </div>
      <AccountModal open={modalOpen} onClose={() => setModalOpen(false)} account={editAccount} />
    </>
  );
}

function Body({ onEdit }) {
  const { data } = useStore();
  const accounts = data.profiles || [];
  const projects = data.projects || [];
  const projectName = (id) => projects.find(p => p.id === id)?.name || id;

  return (
    <div className="project-page">
      <div className="proj-toolbar">
        <span className="proj-toolbar-title">บัญชีผู้ใช้ทั้งหมด ({accounts.length})</span>
      </div>
      <div className="devtask-scroll">
        {!accounts.length ? (
          <div className="empty-state"><div className="emoji">🛡️</div><p>ยังไม่มีบัญชีในระบบ — กด &quot;+ Account ใหม่&quot; เพื่อเริ่ม</p></div>
        ) : (
          <table className="devtask-table">
            <thead>
              <tr><th>Email</th><th>Role</th><th>Project</th><th></th></tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id}>
                  <td>{a.email}</td>
                  <td><span className="role-badge">{a.role}</span></td>
                  <td>
                    {(a.projectIds || []).length
                      ? (a.projectIds || []).map(pid => <span key={pid} className="project-chip">{projectName(pid)}</span>)
                      : <span style={{ color: 'var(--text3)', fontSize: 12 }}>ทุก project ตาม role</span>}
                  </td>
                  <td><div className="dt-row-actions"><button className="task-action-btn" onClick={() => onEdit(a)}>✎</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
