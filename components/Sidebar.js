'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '../lib/StoreContext';
import { useAuth } from '../lib/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';

const OVERALL = [
  { href: '/', icon: '📊', label: 'Dashboard' },
  { href: '/projects', icon: '📁', label: 'Project Overview' },
  { href: '/timeline', icon: '🗺️', label: 'Roadmap' },
];

const PD = [
  { href: '/pd/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/pd/list', icon: '📋', label: 'Task List' },
  { href: '/pd/kanban', icon: '🗂️', label: 'Kanban' },
  { href: '/pd/issuelog', icon: '🐞', label: 'Issue Log', badgeKey: 'pdIssues' },
  { href: '/pd/backlog', icon: '📥', label: 'Backlog' },
  { href: '/pd/feedback', icon: '💬', label: 'Product Feedback' },
  { href: '/pd/mom', icon: '📝', label: 'MoM' },
  { href: '/pd/timesheet', icon: '⏱️', label: 'Timesheet' },
];

const ADMIN = [
  { href: '/admin/account', icon: '👤', label: 'Account' },
];
const ADMIN_SUPER = [
  { href: '/admin/log', icon: '📜', label: 'Log' },
];
const CONFIG = [
  { href: '/config/product', icon: '⚙️', label: 'Product Master' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data, confirm, deleteRow, toast } = useStore();
  const { perms, assignedProjectIds, role, session, logout } = useAuth();
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const allProjects = data.projects || [];
  const projects = perms.projectScope === 'all'
    ? allProjects
    : allProjects.filter(p => assignedProjectIds.includes(p.id));

  const openIssues = (data.pdIssues || []).filter(i => !['Resolved', 'Closed'].includes(i.status)).length;

  function delProject(e, p) {
    e.stopPropagation();
    e.preventDefault();
    confirm('ลบ Project นี้?', `ลบ "${p.name}" — งานที่เกี่ยวข้องบางส่วนอาจถูกลบตามไปด้วย`, async () => {
      await deleteRow('projects', p.id);
      toast('🗑️ ลบ project แล้ว');
      if (pathname === `/project/${p.id}`) router.push('/projects');
    });
  }

  const [theme, setTheme] = useState('dark');

  // Apply saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('pdtool-theme') || 'dark';
    setTheme(saved);
    if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next === 'dark' ? '' : 'light');
    localStorage.setItem('pdtool-theme', next);
  }

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">T</div>
        <span className="logo-text">PDTool</span>
        <button className="theme-toggle-btn" onClick={toggleTheme} title="สลับธีม">{theme === 'light' ? '☀️' : '🌙'}</button>
      </div>

      {perms.canAccessOverall && (
        <div className="sidebar-section">
          <div className="sidebar-label">Overall</div>
          {OVERALL.map(item => (
            <Link key={item.href} href={item.href}>
              <div className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                <span className="icon">{item.icon}</span> {item.label}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="sidebar-section">
        <div className="sidebar-label sidebar-label-toggle" onClick={() => setProjectsOpen(v => !v)}>
          <span>Project</span>
          <span className={`sidebar-arrow ${projectsOpen ? 'open' : ''}`}>▸</span>
        </div>
        {projectsOpen && (<>
        <div className="project-list">
          {!projects.length && (
            <div style={{ padding: '4px 10px', fontSize: 12, color: 'var(--text3)' }}>
              {perms.projectScope === 'assigned' ? 'ยังไม่ถูก assign project ใดๆ' : 'ยังไม่มี project'}
            </div>
          )}
          {projects.map(p => {
            const cnt = (data.tasks || []).filter(t => t.project === p.id && !t.done).length;
            return (
              <Link key={p.id} href={`/project/${p.id}`}>
                <div className="project-item">
                  <span className="project-dot" style={{ background: p.color }} />
                  <span className="project-name">{p.name}</span>
                  {cnt > 0 && <span className="project-count">{cnt}</span>}
                  {perms.canDelete && (
                    <div className="proj-actions">
                      <button className="proj-mini-btn del" title="ลบ" onClick={(e) => delProject(e, p)}>✕</button>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        {perms.projectScope === 'all' && (
          <Link href="/projects">
            <div className="add-project-btn"><span>＋</span> New Project</div>
          </Link>
        )}
        </>
        )}
      </div>

      {perms.canAccessPD && (
        <div className="sidebar-section" style={{ flex: perms.canAccessAdmin ? 'unset' : 1 }}>
          <div className="sidebar-label">PD Task</div>
          {PD.map(item => (
            <Link key={item.href} href={item.href}>
              <div className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                <span className="icon">{item.icon}</span> {item.label}
                {item.badgeKey && <span className="badge">{openIssues}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {perms.canAccessAdmin && (
        <div className="sidebar-section" style={{ flex: perms.canAccessConfig ? 'unset' : 1 }}>
          <div className="sidebar-label">Admin</div>
          {ADMIN.map(item => (
            <Link key={item.href} href={item.href}>
              <div className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                <span className="icon">{item.icon}</span> {item.label}
              </div>
            </Link>
          ))}
          {perms.canViewLogs && ADMIN_SUPER.map(item => (
            <Link key={item.href} href={item.href}>
              <div className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                <span className="icon">{item.icon}</span> {item.label}
              </div>
            </Link>
          ))}
        </div>
      )}

      {perms.canAccessConfig && (
        <div className="sidebar-section" style={{ flex: 1 }}>
          <div className="sidebar-label">Config</div>
          {CONFIG.map(item => (
            <Link key={item.href} href={item.href}>
              <div className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                <span className="icon">{item.icon}</span> {item.label}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
        {session && (
          <div className="sidebar-user">
            <div className="sidebar-user-email" title={session.user.email}>{session.user.email}</div>
            {role && <div className="sidebar-user-role">{role}</div>}
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 12 }} onClick={() => setChangePwOpen(true)}>🔑 เปลี่ยนรหัสผ่าน</button>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 4, fontSize: 12 }} onClick={logout}>ออกจากระบบ</button>
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 10 }}>PDTool v2.0 (Next.js + Supabase)</div>
      </div>
      <ChangePasswordModal open={changePwOpen} onClose={() => setChangePwOpen(false)} />
    </div>
  );
}
