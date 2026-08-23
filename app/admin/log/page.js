'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../lib/AuthContext';
import { supabase } from '../../../lib/supabaseClient';

const ACTION_LABEL = {
  login: '🔑 เข้าสู่ระบบ',
  logout: '🚪 ออกจากระบบ',
  view: '👁️ ดู',
  create: '➕ สร้าง',
  update: '✏️ แก้ไข',
  delete: '🗑️ ลบ',
};
const PAGE_SIZE = 200;

export default function LogPage() {
  const { perms } = useAuth();

  if (!perms.canViewLogs) {
    return (
      <>
        <div className="topbar"><span className="topbar-title">Admin · Log</span></div>
        <div className="content">
          <div className="empty-state" style={{ padding: 48 }}>
            <div className="emoji">🔒</div><p>เฉพาะ Super Admin เท่านั้นที่เข้าถึงหน้านี้ได้</p>
          </div>
        </div>
      </>
    );
  }
  return <Body />;
}

function Body() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (lim) => {
    setLoading(true);
    setErr('');
    const { data, error } = await supabase
      .from('activityLogs').select('*').order('createdAt', { ascending: false }).limit(lim);
    if (error) setErr(error.message);
    else {
      setRows(data || []);
      setHasMore((data || []).length >= lim);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(limit); }, [limit, load]);

  const filtered = rows.filter(r => {
    if (actionFilter !== 'all' && r.action !== actionFilter) return false;
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      return (r.userEmail || '').toLowerCase().includes(s)
        || (r.entityType || '').toLowerCase().includes(s)
        || (r.detail || '').toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Admin · Log</span>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={() => load(limit)}>🔄 รีเฟรช</button>
        </div>
      </div>
      <div className="content">
        <div className="project-page">
          <div className="proj-toolbar" style={{ gap: 10, flexWrap: 'wrap' }}>
            <span className="proj-toolbar-title">กิจกรรมล่าสุด ({filtered.length}{hasMore ? '+' : ''})</span>
            <input
              className="form-input" style={{ maxWidth: 220 }} placeholder="ค้นหา email / รายการ..."
              value={q} onChange={e => setQ(e.target.value)}
            />
            <select className="form-select" style={{ maxWidth: 180 }} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="all">ทุกกิจกรรม</option>
              <option value="login">เข้าสู่ระบบ</option>
              <option value="logout">ออกจากระบบ</option>
              <option value="view">ดู</option>
              <option value="create">สร้าง</option>
              <option value="update">แก้ไข</option>
              <option value="delete">ลบ</option>
            </select>
          </div>
          <div className="devtask-scroll">
            {err && <div className="login-error" style={{ margin: 12 }}>{err}</div>}
            {loading && !rows.length ? (
              <div className="empty-state"><p>กำลังโหลด...</p></div>
            ) : !filtered.length ? (
              <div className="empty-state"><div className="emoji">📜</div><p>ยังไม่มีกิจกรรม</p></div>
            ) : (
              <table className="devtask-table">
                <thead>
                  <tr><th>เวลา</th><th>ผู้ใช้</th><th>กิจกรรม</th><th>ส่วน</th><th>รายละเอียด</th></tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text3)' }}>
                        {new Date(r.createdAt).toLocaleString('th-TH')}
                      </td>
                      <td>{r.userEmail || '-'}</td>
                      <td>{ACTION_LABEL[r.action] || r.action}</td>
                      <td>{r.entityType || '-'}</td>
                      <td>{r.detail || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {hasMore && !loading && (
            <div style={{ textAlign: 'center', padding: 14 }}>
              <button className="btn btn-ghost" onClick={() => setLimit(l => l + PAGE_SIZE)}>โหลดเพิ่มเติม</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
